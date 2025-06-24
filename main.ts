import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { handleAuthRoutes, isAuthorized } from "./users.ts";
import { getVideoUrl } from "./douyin.ts";

const rateLimit = new Map<string, number[]>(); // IP => 时间戳数组

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (path.startsWith("/auth")) {
    return await handleAuthRoutes(req, headers);
  }

  if (path === "/api" && req.method === "GET") {
    const videoUrl = url.searchParams.get("url");
    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "缺少 url 参数" }), { status: 400, headers });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const ip = req.headers.get("X-Forwarded-For") || (req.conn.remoteAddr as Deno.NetAddr)?.hostname || "unknown";

    const user = isAuthorized(token);

    if (!user) {
      // 游客一天限3次
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      let timestamps = rateLimit.get(ip) || [];
      timestamps = timestamps.filter(t => now - t < oneDay);

      if (timestamps.length >= 3) {
        return new Response(JSON.stringify({ error: "游客每天最多解析3次，请注册或明日再试" }), { status: 429, headers });
      }

      timestamps.push(now);
      rateLimit.set(ip, timestamps);
    }

    try {
      const data = await getVideoUrl(videoUrl);
      return new Response(JSON.stringify(data), { headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }

  return new Response("404 Not Found", { status: 404, headers });
});
