// download.ts

export async function downloadHandler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get("video");

  if (!videoUrl) {
    return new Response("缺少 video 参数", { status: 400 });
  }

  try {
    const res = await fetch(videoUrl);
    const buffer = await res.arrayBuffer();

    const headers = new Headers();
    headers.set("Content-Type", "video/mp4");
    headers.set("Content-Disposition", 'attachment; filename="douyin-video.mp4"');
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(buffer, {
      status: 200,
      headers,
    });
  } catch (e) {
    return new Response("下载失败：" + e.message, { status: 500 });
  }
}
