"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { slugifyFilename } from "@/lib/utils";
import { compressToWebP } from "@/lib/browser-utils";

interface Props {
  bucket: string;
  folder?: string;
  accept?: string;
  multiSelect?: boolean;
  onSelect: (url: string) => void;
  onClose: () => void;
}

type Tab = "upload" | "library";

interface StorageFile {
  name: string;
  url: string;
  updatedAt: string;
}

export default function MediaPicker({ bucket, folder = "", accept = "image/jpeg,image/png,image/webp,image/gif", multiSelect = false, onSelect, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("upload");
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [multiSelected, setMultiSelected] = useState<Set<string>>(new Set());

  const supabase = createClient();

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    const all: StorageFile[] = [];

    // Load root level — collect files + subfolder names
    const { data: rootData } = await supabase.storage.from(bucket).list(undefined, {
      sortBy: { column: "updated_at", order: "desc" },
      limit: 300,
    });
    const subfolders: string[] = [];
    for (const f of rootData ?? []) {
      if (f.name === ".emptyFolderPlaceholder") continue;
      if (!f.metadata) { subfolders.push(f.name); continue; }
      const { data: u } = supabase.storage.from(bucket).getPublicUrl(f.name);
      all.push({ name: f.name, url: u.publicUrl, updatedAt: f.updated_at ?? "" });
    }

    // Load each subfolder (1 level deep)
    for (const sub of subfolders) {
      const { data: subData } = await supabase.storage.from(bucket).list(sub, {
        sortBy: { column: "updated_at", order: "desc" },
        limit: 200,
      });
      for (const f of subData ?? []) {
        if (f.name === ".emptyFolderPlaceholder" || !f.metadata) continue;
        const path = `${sub}/${f.name}`;
        const { data: u } = supabase.storage.from(bucket).getPublicUrl(path);
        all.push({ name: f.name, url: u.publicUrl, updatedAt: f.updated_at ?? "" });
      }
    }

    all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setFiles(all);
    setLoading(false);
  }, [bucket, supabase]);

  useEffect(() => {
    if (tab === "library") loadLibrary();
  }, [tab, loadLibrary]);

  async function handleUpload(fileList: File[]) {
    const images = fileList.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setUploading(true);
    setUploadProgress({ done: 0, total: images.length });
    const urls: string[] = [];
    for (const file of images) {
      const compressed = await compressToWebP(file);
      const prefix = folder ? `${folder}/` : "";
      const path = `${prefix}${slugifyFilename(compressed.name)}`;
      const { error } = await supabase.storage.from(bucket).upload(path, compressed, { upsert: true });
      if (!error) {
        urls.push(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
      }
      setUploadProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    setUploading(false);
    if (!urls.length) {
      alert(`Upload thất bại. Kiểm tra bucket '${bucket}' đã được tạo chưa.`);
      return;
    }
    urls.forEach((url) => onSelect(url));
    onClose();
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) handleUpload(Array.from(e.target.files));
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleUpload(Array.from(e.dataTransfer.files));
  }

  function handleConfirmSelect() {
    if (multiSelect) {
      multiSelected.forEach((url) => onSelect(url));
      onClose();
    } else if (selected) {
      onSelect(selected);
      onClose();
    }
  }

  function toggleMultiSelect(url: string) {
    setMultiSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url); else next.add(url);
      return next;
    });
  }

  async function handleDelete(file: StorageFile) {
    if (!confirm(`Xóa ảnh "${file.name}"?`)) return;
    const path = folder ? `${folder}/${file.name}` : file.name;
    await supabase.storage.from(bucket).remove([path]);
    setFiles((prev) => prev.filter((f) => f.name !== file.name));
    if (selected === file.url) setSelected(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <h2 className="text-base font-semibold text-white">Chọn ảnh</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {[
            { key: "upload" as Tab, label: "Upload mới" },
            { key: "library" as Tab, label: "Thư viện" },
          ].map((t) => (
            <button type="button" key={t.key} onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key ? "bg-emerald-500/20 text-emerald-400" : "text-gray-500 hover:text-gray-300"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Tab Upload ── */}
          {tab === "upload" && (
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-emerald-400 bg-emerald-500/5"
                  : "border-gray-700 hover:border-gray-500 hover:bg-gray-800/40"
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  <p className="text-sm text-gray-400">
                    Đang upload {uploadProgress.done}/{uploadProgress.total} ảnh…
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl bg-gray-800 p-4">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Kéo thả ảnh vào đây</p>
                    <p className="mt-1 text-xs text-gray-500">hoặc click để chọn — có thể chọn nhiều ảnh cùng lúc</p>
                    <p className="mt-2 text-xs text-gray-600">JPG, PNG, WebP, GIF — tối đa 3 MB/ảnh</p>
                  </div>
                </>
              )}
              <input type="file" accept={accept} multiple className="hidden" disabled={uploading} onChange={handleFileInput} />
            </label>
          )}

          {/* ── Tab Library ── */}
          {tab === "library" && (
            <div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                </div>
              ) : files.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  Chưa có ảnh nào trong thư viện.
                  <button type="button" onClick={() => setTab("upload")} className="block mx-auto mt-3 text-emerald-400 hover:text-emerald-300 text-xs underline">
                    Upload ảnh đầu tiên →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {files.map((file) => (
                    <div key={file.name} className="relative group">
                      <button
                        type="button"
                        onClick={() => multiSelect ? toggleMultiSelect(file.url) : setSelected(selected === file.url ? null : file.url)}
                        className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          (multiSelect ? multiSelected.has(file.url) : selected === file.url)
                            ? "border-emerald-500 ring-2 ring-emerald-500/30"
                            : "border-gray-700 hover:border-gray-500"
                        }`}
                      >
                        <Image src={file.url} alt={file.name} fill className="object-cover" unoptimized />
                        {(multiSelect ? multiSelected.has(file.url) : selected === file.url) && (
                          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                            <div className="rounded-full bg-emerald-500 p-1">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(file)}
                        className="absolute top-1 right-1 rounded-lg bg-black/60 p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                        title="Xóa ảnh"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <p className="mt-1 text-xs text-gray-600 truncate px-0.5">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — chỉ hiện khi tab Library và đã chọn ảnh */}
        {tab === "library" && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-800 shrink-0">
            <span className="text-xs text-gray-500">
              {multiSelect
                ? multiSelected.size > 0 ? `Đã chọn ${multiSelected.size} ảnh` : `${files.length} ảnh trong thư viện`
                : selected ? "Đã chọn 1 ảnh" : `${files.length} ảnh trong thư viện`}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Hủy
              </button>
              <button type="button" onClick={handleConfirmSelect} disabled={multiSelect ? multiSelected.size === 0 : !selected}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {multiSelect && multiSelected.size > 0 ? `Thêm ${multiSelected.size} ảnh` : "Chọn ảnh này"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
