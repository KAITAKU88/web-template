// Browser-only utilities (Canvas API, File API). Do not import from server code.

export async function compressToWebP(file: File, quality = 0.82): Promise<File> {
  // Skip types that don't convert well (animated GIF loses frames, SVG/ICO already optimized)
  if (["image/gif", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"].includes(file.type)) {
    return file;
  }
  return new Promise((resolve) => {
    const img = new globalThis.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_W = 1920;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX_W) { h = Math.round((h * MAX_W) / w); w = MAX_W; }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve(new File([blob], `${baseName}.webp`, { type: "image/webp" }));
        },
        "image/webp",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}
