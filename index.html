// main.ts
import { getVideoUrl } from "./douyin.ts";

// 限流：IP => [时间戳, 时间戳, ...]
const rateLimit = new Map<string, number[]>();

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // ✅ 首页 index.html
  if (path === "/" && req.method === "GET" && !url.searchParams.has("url")) {
    try {
      const html = await Deno.readTextFile("./index.html");
      headers.set("Content-Type", "text/html; charset=utf-8");
      return new Response(html, { headers });
    } catch {
      return new Response("页面加载失败", { status: 500, headers });
    }
  }

  // ✅ 解析接口：/?url=xxx
  if (path === "/" && url.searchParams.has("url")) {
    const inputUrl = url.searchParams.get("url")!;
    const ip = req.headers.get("X-Forwarded-For") || "unknown";
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    let timestamps = rateLimit.get(ip) || [];
    timestamps = timestamps.filter((t) => now - t < oneDay); // 清除过期
    if (timestamps.length >= 5) {
      return new Response(JSON.stringify({ error: "游客每天最多解析 5 次，请明天再试" }), {
        status: 429,
        headers,
      });
    }

    timestamps.push(now);
    rateLimit.set(ip, timestamps);

    try {
      const data = await getVideoUrl(inputUrl);
      return new Response(JSON.stringify(data), { headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }

  return new Response("404 Not Found", { status: 404, headers });
});
