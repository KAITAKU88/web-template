"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Lightbox from "./Lightbox";

interface Props {
  images: string[];
  autoPlayMs?: number;
  productName?: string;
}

export default function ImageCarousel({ images, autoPlayMs = 4000, productName = "" }: Props) {
  const [current, setCurrent] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  // Auto-play
  useEffect(() => {
    if (paused || images.length <= 1) return;
    const t = setInterval(next, autoPlayMs);
    return () => clearInterval(t);
  }, [paused, next, autoPlayMs, images.length]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="overflow-hidden rounded-xl border-2 border-gray-200 shadow-md"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}>

        {/* Browser mockup bar */}
        <div className="flex items-center gap-1.5 border-b border-gray-200 bg-white px-3 py-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
          <span className="ml-2 flex-1 rounded bg-gray-100 px-3 py-1 text-xs text-gray-400 truncate">
            notion.so / {productName.toLowerCase().replace(/\s+/g, "-")}
          </span>
          <span className="text-xs text-gray-400">{current + 1}/{images.length}</span>
        </div>

        {/* Slide area */}
        <div className="relative aspect-video w-full bg-gray-100 cursor-zoom-in group"
          onClick={() => setLightboxIdx(current)}>
          <Image
            key={current}
            src={images[current]}
            alt={`${productName} — ảnh ${current + 1}`}
            fill className="object-cover transition-opacity duration-300"
            unoptimized
          />
          {/* Zoom hint overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
            <div className="scale-0 group-hover:scale-100 transition-transform flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-white text-sm font-medium">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              Xem toàn màn hình
            </div>
          </div>
        </div>

        {/* Controls */}
        {images.length > 1 && (
          <div className="flex items-center justify-between bg-white px-4 py-2">
            {/* Prev/Next */}
            <div className="flex gap-1">
              <button onClick={prev} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={next} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all ${i === current ? "h-2 w-5 bg-green-500" : "h-2 w-2 bg-gray-300 hover:bg-gray-400"}`}
                />
              ))}
            </div>
            {/* Thumbnail strip */}
            <div className="flex gap-1">
              {images.slice(0, 5).map((img, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`h-8 w-8 overflow-hidden rounded border-2 transition-all ${i === current ? "border-green-500" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <Image src={img} alt="" width={32} height={32} className="h-full w-full object-cover" unoptimized />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}
