// download.ts

Deno.serve(async (req) => {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get("video");

  if (!videoUrl) {
    return new Response("缺少 video 参数", { status: 400 });
  }

  try {
    const res = await fetch(videoUrl);
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="douyin-video.mp4"',
        "Access-Control-Allow-Origin": "*"
      },
    });
  } catch (e) {
    return new Response("下载失败：" + e.message, { status: 500 });
  }
});
