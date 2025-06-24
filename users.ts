// users.ts

interface User {
  username: string;
  passwordHash: string;
  isAuthorized: boolean;
  expireAt?: number; // 授权过期时间时间戳
}

const users = new Map<string, User>();

// 用 Web Crypto API 做 sha256 异步哈希
export async function hashPwd(pwd: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pwd);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

export async function handleAuthRoutes(req: Request, headers: Headers) {
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { username, password, code } = body;
      if (!username || username.length < 3) {
        return new Response(JSON.stringify({ error: "用户名至少3位" }), { status: 400, headers });
      }
      if (!password || password.length < 6) {
        return new Response(JSON.stringify({ error: "密码至少6位" }), { status: 400, headers });
      }

      let user = users.get(username);
      const pwdHash = await hashPwd(password);

      if (user) {
        // 登录流程，校验密码
        if (user.passwordHash !== pwdHash) {
          return new Response(JSON.stringify({ error: "密码错误" }), { status: 401, headers });
        }
      } else {
        // 注册新用户
        const authorized = code && code === "your-secret-code"; // 简单注册码校验
        user = {
          username,
          passwordHash: pwdHash,
          isAuthorized: !!authorized,
          expireAt: authorized ? Date.now() + 30 * 24 * 3600 * 1000 : undefined, // 授权30天
        };
        users.set(username, user);
      }

      const token = btoa(username + ":" + pwdHash);

      return new Response(JSON.stringify({ token, isAuthorized: user.isAuthorized }), {
        status: 200,
        headers,
      });
    } catch {
      return new Response(JSON.stringify({ error: "请求格式错误" }), { status: 400, headers });
    }
  }
  return new Response("仅支持 POST", { status: 405, headers });
}

export async function isAuthorized(token: string | null): Promise<User | null> {
  if (!token) return null;
  try {
    const decoded = atob(token);
    const [username, pwdHash] = decoded.split(":");
    const user = users.get(username);
    if (!user) return null;
    if (user.passwordHash !== pwdHash) return null;
    if (user.isAuthorized) {
      if (user.expireAt && Date.now() > user.expireAt) {
        user.isAuthorized = false;
        return null;
      }
      return user;
    }
    return null;
  } catch {
    return null;
  }
}
