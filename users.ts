// users.ts
import { createHash } from "https://deno.land/std@0.188.0/hash/mod.ts";

const users = new Map<string, { password: string; vip: boolean }>();
const validCodes = new Set(["VIP123", "ABC999"]); // 注册码白名单，可自行添加
const tokenStore = new Map<string, { username: string; vip: boolean; expires: number }>();

function hash(input: string) {
  return createHash("sha256").update(input).toString();
}

function generateToken(username: string): string {
  const raw = username + Date.now() + Math.random();
  return hash(raw).slice(0, 32);
}

export function isAuthorized(token: string) {
  const record = tokenStore.get(token);
  if (!record) return null;
  if (Date.now() > record.expires) {
    tokenStore.delete(token);
    return null;
  }
  return record;
}

export async function handleAuthRoutes(req: Request, headers: Headers): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const body = await req.json().catch(() => ({}));

  if (path === "/auth/register") {
    const { username, password, code } = body;
    if (!username || username.length < 6 || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: "用户名和密码必须不少于6位" }), { status: 400, headers });
    }
    if (users.has(username)) {
      return new Response(JSON.stringify({ error: "用户名已存在" }), { status: 400, headers });
    }
    const vip = code && validCodes.has(code);
    users.set(username, { password: hash(password), vip });
    return new Response(JSON.stringify({ success: true, vip }), { headers });
  }

  if (path === "/auth/login") {
    const { username, password } = body;
    const user = users.get(username);
    if (!user || user.password !== hash(password)) {
      return new Response(JSON.stringify({ error: "用户名或密码错误" }), { status: 401, headers });
    }
    const token = generateToken(username);
    tokenStore.set(token, { username, vip: user.vip, expires: Date.now() + 1000 * 60 * 60 * 24 * 30 }); // 30天有效期
    return new Response(JSON.stringify({ token, vip: user.vip }), { headers });
  }

  return new Response("404 Not Found", { status: 404, headers });
}
