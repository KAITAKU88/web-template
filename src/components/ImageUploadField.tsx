"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface Props {
  name: string;
  bucket: string;
  folder?: string;
  defaultValue?: string;
  placeholder?: string;
  accept?: string;
  hint?: string;
  previewSize?: "sm" | "md" | "lg"; // sm=40px, md=80px, lg=wide banner
  onChange?: (url: string) => void;
}

export default function ImageUploadField({
  name,
  bucket,
  folder = "",
  defaultValue = "",
  placeholder,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  hint,
  previewSize = "sm",
  onChange,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);

  const isImg =
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/");

  const previewCls =
    previewSize === "lg" ? "h-20 w-36" :
    previewSize === "md" ? "h-16 w-16" :
    "h-10 w-10";
  const previewW = previewSize === "lg" ? 144 : previewSize === "md" ? 64 : 40;
  const previewH = previewSize === "lg" ? 80  : previewSize === "md" ? 64 : 40;

  function update(url: string) {
    setValue(url);
    onChange?.(url);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "bin";
      const prefix = folder ? `${folder}/` : "";
      const path = `${prefix}${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      update(data.publicUrl);
    } catch (err) {
      console.error(err);
      alert(`Upload thất bại. Kiểm tra bucket '${bucket}' đã được tạo chưa.`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {hint && <p className="text-xs text-gray-500">{hint}</p>}

      {/* Preview + upload row */}
      <div className="flex items-center gap-3">
        {/* Preview */}
        <div className={`shrink-0 rounded-lg border border-gray-700 bg-gray-800 overflow-hidden flex items-center justify-center ${previewCls}`}>
          {isImg ? (
            <Image src={value} alt="preview" width={previewW} height={previewH}
              className="h-full w-full object-cover" unoptimized />
          ) : value ? (
            <span className="text-gray-300 text-xs font-medium truncate px-1">{value}</span>
          ) : (
            <span className="text-gray-600 text-xs">—</span>
          )}
        </div>

        {/* Upload trigger */}
        <label className={`flex cursor-pointer items-center gap-2 rounded-xl border border-dashed px-4 py-2 text-xs font-medium transition-colors ${
          uploading
            ? "border-gray-700 text-gray-600 cursor-not-allowed"
            : "border-gray-600 text-gray-400 hover:border-emerald-500 hover:text-emerald-400"
        }`}>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploading ? "Đang upload…" : "Tải ảnh lên"}
          <input type="file" accept={accept} className="hidden" disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
        </label>

        <span className="text-xs text-gray-600">hoặc paste URL</span>
      </div>

      {/* URL input + clear */}
      <div className="flex items-center gap-2">
        <input
          id={name}
          name={name}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => update(e.target.value)}
          className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
        />
        {value && (
          <button type="button" onClick={() => update("")}
            className="shrink-0 rounded-lg p-2 text-gray-600 hover:text-red-400 transition-colors" title="Xóa">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
