import { getVideoUrl } from "./douyin.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // 👉 下载中转接口 /download?video=https://...
  if (pathname === "/download") {
    const videoUrl = url.searchParams.get("video");
    if (!videoUrl) {
      return new Response("缺少 video 参数", { status: 400, headers });
    }

    try {
      const res = await fetch(videoUrl);
      const buffer = await res.arrayBuffer();

      return new Response(buffer, {
        status: 200,
        headers: {
          ...headers,
          "Content-Type": "video/mp4",
          "Content-Disposition": 'attachment; filename="douyin-video.mp4"',
        },
      });
    } catch (err) {
      return new Response("下载失败：" + err.message, { status: 500, headers });
    }
  }

  // 👉 抖音解析接口 /?url=https://v.douyin.com/xxxxx/
  if (url.searchParams.has("url")) {
    const inputUrl = url.searchParams.get("url");
    try {
      const data = await getVideoUrl(inputUrl!);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers,
      });
    }
  }

  return new Response("请提供 url 参数，或使用 /download?video=...", {
    status: 400,
    headers,
  });
});
