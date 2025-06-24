import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { getVideoUrl } from "./douyin.ts";  // 你的业务逻辑

serve(async (req) => {
  // 允许跨域
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const url = new URL(req.url);
    const videoUrl = url.searchParams.get("url");
    if (!videoUrl) {
      return new Response("Missing url parameter", { status: 400, headers });
    }
    const data = await getVideoUrl(videoUrl);
    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
});
