"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

const MediaPicker = dynamic(() => import("./MediaPicker"), { ssr: false });

interface Props {
  name: string;
  bucket: string;
  folder?: string;
  defaultValue?: string;
  placeholder?: string;
  accept?: string;
  hint?: string;
  previewSize?: "sm" | "md" | "lg";
  onChange?: (url: string) => void;
  creatorId?: string | null; // staffId của người upload — để record ownership
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
  creatorId,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [pickerOpen, setPickerOpen] = useState(false);

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

  return (
    <>
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

          {/* Open picker button */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-dashed border-gray-600 px-4 py-2 text-xs font-medium text-gray-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Tải ảnh lên / Chọn từ thư viện
          </button>

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

      {/* Media Picker Modal */}
      {pickerOpen && (
        <MediaPicker
          bucket={bucket}
          folder={folder}
          accept={accept}
          onSelect={update}
          onClose={() => setPickerOpen(false)}
          creatorId={creatorId}
        />
      )}
    </>
  );
}
