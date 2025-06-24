// main.ts
import { getVideoUrl } from "./douyin.ts";

const rateLimit = new Map<string, number[]>();

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // ✅ 首页：返回 index.html
  if (path === "/" && req.method === "GET" && !url.searchParams.has("url")) {
    try {
      const html = await Deno.readTextFile("./index.html");
      headers.set("Content-Type", "text/html; charset=utf-8");
      return new Response(html, { headers });
    } catch {
      return new Response("加载页面失败", { status: 500, headers });
    }
  }

  // ✅ 视频解析接口：/api?url=...
  if (path === "/api" && req.method === "GET") {
    const videoUrl = url.searchParams.get("url");
    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "缺少 url 参数" }), {
        status: 400,
        headers,
      });
    }

    // 限制：每个 IP 每天最多 5 次
    const ip = req.headers.get("X-Forwarded-For") || "unknown";
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    let times = rateLimit.get(ip) || [];
    times = times.filter((t) => now - t < oneDay);
    if (times.length >= 5) {
      return new Response(JSON.stringify({ error: "游客每天最多 5 次" }), {
        status: 429,
        headers,
      });
    }

    times.push(now);
    rateLimit.set(ip, times);

    try {
      const result = await getVideoUrl(videoUrl);
      return new Response(JSON.stringify(result), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers,
      });
    }
  }

  return new Response("404 Not Found", { status: 404, headers });
});
