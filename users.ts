// users.ts
// 这是简化版的注册和鉴权逻辑，实际可用数据库或KV存储替换

interface User {
  username: string;
  passwordHash: string;
  token: string;
  expireAt: number;  // 时间戳，到期时间
}

const users = new Map<string, User>();  // token => User

import { createHash } from "https://deno.land/std@0.188.0/hash/sha256.ts";

function hashPwd(pwd: string) {
  const hash = createHash("sha256");
  hash.update(pwd);
  return hash.toString();
}

function generateToken(username: string) {
  return crypto.randomUUID();
}

export async function handleAuthRoutes(req: Request, headers: Headers) {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === "POST" && path === "/auth/register") {
    const body = await req.json();
    const username: string = body.username;
    const password: string = body.password;
    const code: string = body.code || "";

    if (!username || username.length < 3) {
      return new Response(JSON.stringify({ error: "用户名至少3个字符" }), { status: 400, headers });
    }
    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: "密码至少6个字符" }), { status: 400, headers });
    }

    // 简单校验注册码（可替换成真实校验）
    const authorized = code === "YOUR_VALID_CODE_HERE" || code === "";

    const pwdHash = hashPwd(password);
    const token = generateToken(username);
    const expireAt = Date.now() + (authorized ? 365 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000); // 授权1年，无授权30天

    users.set(token, { username, passwordHash: pwdHash, token, expireAt });

    return new Response(JSON.stringify({ token, authorized }), { headers });
  }

  if (req.method === "POST" && path === "/auth/login") {
    const body = await req.json();
    const username: string = body.username;
    const password: string = body.password;

    for (const user of users.values()) {
      if (user.username === username && user.passwordHash === hashPwd(password)) {
        // 更新token过期时间
        user.expireAt = Date.now() + 365 * 24 * 3600 * 1000;
        return new Response(JSON.stringify({ token: user.token }), { headers });
      }
    }
    return new Response(JSON.stringify({ error: "用户名或密码错误" }), { status: 401, headers });
  }

  return new Response("404 Not Found", { status: 404, headers });
}

export function isAuthorized(token: string) {
  if (!token) return null;
  const user = users.get(token);
  if (!user) return null;
  if (user.expireAt < Date.now()) {
    users.delete(token);
    return null;
  }
  return user;
}
