import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

/**
 * NOTE: This route is intentionally minimal:
 * - Accepts a file upload or an image URL
 * - For dev/demo it returns the same input image as "generated" variations (mock)
 * - Replace `generateWithProvider` with real calls to your chosen provider
 */

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    // If it's multipart, parse using FormData (Next supports reading formData in edge/node)
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const style = form.get("style") as string | null;
      const text = form.get("text") as string | null;
      const file = form.get("file") as unknown;

      // If file is provided (browser File), it will have .stream()/arrayBuffer() etc.
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const fileBuf = Buffer.from(await (file as any).arrayBuffer());
        // mock: return the uploaded file as data URL variations (3 copies)
        const base64 = fileBuf.toString("base64");
        const dataUrl = `data:image/png;base64,${base64}`;
        return NextResponse.json({ images: [dataUrl, dataUrl, dataUrl] });
      }

      // If no file, maybe imageUrl provided
      const imageUrl = form.get("imageUrl") as string | null;
      if (imageUrl) {
        // For local dev, if imageUrl points to a local file path (e.g. /mnt/...), read it
        if (imageUrl.startsWith("/mnt/") || imageUrl.startsWith("C:") || imageUrl.startsWith("D:")) {
          const filePath = imageUrl;
          try {
            const buf = await readFile(path.resolve(filePath));
            const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
            return NextResponse.json({ images: [dataUrl, dataUrl, dataUrl] });
          } catch (err) {
            console.warn("Could not read local file:", err);
          }
        }
        // Production: proxy the URL and convert to base64 (left as TODO)
        return NextResponse.json({ images: [imageUrl, imageUrl, imageUrl] });
      }

      return NextResponse.json({ images: [] });
    }

    // If non-multipart (fallback)
    return NextResponse.json({ images: [] });

  } catch (err) {
    console.error(err);
    return new NextResponse(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

