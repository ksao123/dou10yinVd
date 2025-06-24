// users.ts
import { Sha256 } from "https://deno.land/std/hash/sha256.ts";

interface User {
  username: string;
  passwordHash: string;
  isAuthorized: boolean;
  expireAt?: number; // 可选，授权过期时间（时间戳）
  lastDownloadDay?: number; // 记录未授权用户当天下载限制
}

// 简易内存用户库，生产环境请改成数据库
const users = new Map<string, User>();

function hashPwd(pwd: string) {
  const hash = new Sha256();
  hash.update(pwd);
  return hash.toString();
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
      const pwdHash = hashPwd(password);

      if (user) {
        // 登录流程，校验密码
        if (user.passwordHash !== pwdHash) {
          return new Response(JSON.stringify({ error: "密码错误" }), { status: 401, headers });
        }
      } else {
        // 注册新用户
        const authorized = code && code === "your-secret-code"; // 简单校验注册码
        user = {
          username,
          passwordHash: pwdHash,
          isAuthorized: !!authorized,
          expireAt: authorized ? Date.now() + 30 * 24 * 3600 * 1000 : undefined, // 授权有效期30天示例
          lastDownloadDay: 0,
        };
        users.set(username, user);
      }

      // 生成简单 Token (此处为示例，生产请用 JWT 或其他安全方案)
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

export function isAuthorized(token: string | null): User | null {
  if (!token) return null;
  try {
    const decoded = atob(token);
    const [username, pwdHash] = decoded.split(":");
    const user = users.get(username);
    if (!user) return null;
    if (user.passwordHash !== pwdHash) return null;
    if (user.isAuthorized) {
      // 判断是否过期
      if (user.expireAt && Date.now() > user.expireAt) {
        user.isAuthorized = false; // 过期自动取消授权
        return null;
      }
      return user;
    }
    return null;
  } catch {
    return null;
  }
}
