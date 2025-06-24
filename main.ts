import { getVideoUrl } from "./douyin.ts";

Deno.serve(async (req) => {
  console.log("Method:", req.method);

  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",  // 允许跨域
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  const url = new URL(req.url);
  if (url.searchParams.has("url")) {
    const inputUrl = url.searchParams.get("url")!;
    console.log("inputUrl:", inputUrl);
    try {
      const videoData = await getVideoUrl(inputUrl);
      return new Response(JSON.stringify(videoData), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  } else {
    return new Response(JSON.stringify({ error: "请提供url参数" }), { status: 400, headers });
  }
});
