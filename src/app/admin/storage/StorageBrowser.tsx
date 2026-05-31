"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const BUCKETS = [
  { id: "product-images", label: "Ảnh sản phẩm", icon: "🖼️" },
  { id: "site-assets",    label: "Assets trang web", icon: "🎨" },
  { id: "avatars",        label: "Avatar",     icon: "👤" },
];

interface StorageFile {
  name: string;
  url: string;
  size?: number;
  updatedAt?: string | null;
  isFolder?: boolean;
}

export default function StorageBrowser() {
  const [bucket, setBucket] = useState(BUCKETS[0].id);
  const [folder, setFolder] = useState("");
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const breadcrumbs = folder ? folder.split("/") : [];

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    const { data } = await supabase.storage.from(bucket).list(folder || undefined, {
      sortBy: { column: "updated_at", order: "desc" },
      limit: 200,
    });
    const items: StorageFile[] = (data ?? [])
      .filter((f) => f.name !== ".emptyFolderPlaceholder")
      .map((f) => {
        const isFolder = !f.metadata;
        const path = folder ? `${folder}/${f.name}` : f.name;
        const url = isFolder ? "" : supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
        return { name: f.name, url, size: f.metadata?.size, updatedAt: f.updated_at, isFolder };
      });
    setFiles(items);
    setLoading(false);
  }, [bucket, folder, supabase]);

  useEffect(() => { load(); }, [load]);

  const openFolder = (name: string) =>
    setFolder((f) => f ? `${f}/${name}` : name);

  const navigateTo = (idx: number) =>
    setFolder(breadcrumbs.slice(0, idx + 1).join("/"));

  async function handleUpload(fileList: FileList) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setUploading(true);
    setUploadProgress(0);
    let done = 0;
    for (const file of files) {
      const ext = file.name.split(".").pop() ?? "bin";
      const prefix = folder ? `${folder}/` : "";
      const path = `${prefix}${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      done++;
      setUploadProgress(Math.round((done / files.length) * 100));
    }
    setUploading(false);
    load();
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    const prefix = folder ? `${folder}/` : "";
    const path = `${prefix}${newFolderName.trim()}/.emptyFolderPlaceholder`;
    await supabase.storage.from(bucket).upload(path, new Blob([""]), { upsert: true });
    setNewFolderName(""); setShowNewFolder(false);
    load();
  }

  async function handleDeleteSelected() {
    if (!selected.size) return;
    if (!confirm(`Xóa ${selected.size} mục đã chọn?`)) return;
    const paths = Array.from(selected).map((name) => folder ? `${folder}/${name}` : name);
    await supabase.storage.from(bucket).remove(paths);
    load();
  }

  function toggleSelect(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === files.length) setSelected(new Set());
    else setSelected(new Set(files.map((f) => f.name)));
  }

  function formatSize(bytes?: number) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
  }

  return (
    <div className="space-y-4">
      {/* Bucket tabs */}
      <div className="flex gap-2 flex-wrap">
        {BUCKETS.map((b) => (
          <button key={b.id} onClick={() => { setBucket(b.id); setFolder(""); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              bucket === b.id ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-gray-800 text-gray-400 hover:text-white border border-transparent"
            }`}>
            <span>{b.icon}</span>{b.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 flex-1 text-sm min-w-0">
          <button onClick={() => setFolder("")} className="text-gray-400 hover:text-white transition-colors shrink-0">
            {BUCKETS.find((b) => b.id === bucket)?.label}
          </button>
          {breadcrumbs.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-gray-600">/</span>
              <button onClick={() => navigateTo(i)} className="text-gray-400 hover:text-white transition-colors">
                {part}
              </button>
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {selected.size > 0 && (
            <button onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xóa ({selected.size})
            </button>
          )}

          {showNewFolder ? (
            <div className="flex items-center gap-1">
              <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                placeholder="Tên thư mục" autoFocus
                className="w-32 rounded-xl border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500" />
              <button onClick={handleCreateFolder} className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-400 hover:bg-emerald-500/30">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }} className="rounded-lg p-1.5 text-gray-500 hover:text-white">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button onClick={() => setShowNewFolder(true)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Tạo thư mục
            </button>
          )}

          <label className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
            uploading ? "bg-gray-700 text-gray-500" : "bg-emerald-500 text-white hover:bg-emerald-400"
          }`}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploading ? `${uploadProgress}%` : "Upload"}
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" disabled={uploading}
              onChange={(e) => { if (e.target.files) handleUpload(e.target.files); e.target.value = ""; }} />
          </label>

          <button onClick={() => setView(view === "grid" ? "list" : "grid")}
            className="rounded-xl border border-gray-700 p-1.5 text-gray-400 hover:text-white transition-colors">
            {view === "grid"
              ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
            }
          </button>
        </div>
      </div>

      {/* Drop zone + file area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) handleUpload(e.dataTransfer.files); }}
        className={`rounded-2xl border-2 transition-colors min-h-[300px] ${dragOver ? "border-emerald-400 bg-emerald-500/5" : "border-gray-800 bg-gray-900"}`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-gray-600">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-400">Kéo thả ảnh vào đây để upload</p>
              <p className="text-xs mt-1">hoặc dùng nút Upload ở trên</p>
            </div>
          </div>
        ) : view === "grid" ? (
          <div className="p-4">
            {/* Select all */}
            <div className="mb-3 flex items-center gap-2">
              <button onClick={toggleAll} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                {selected.size === files.length ? "Bỏ chọn tất cả" : `Chọn tất cả (${files.length})`}
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {files.map((file) => (
                <div key={file.name} className="relative group">
                  {file.isFolder ? (
                    <button onClick={() => openFolder(file.name)}
                      className="w-full aspect-square rounded-xl border-2 border-gray-700 bg-gray-800 flex flex-col items-center justify-center gap-2 hover:border-gray-500 transition-colors">
                      <svg className="h-8 w-8 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8c0-1.11-.89-2-2-2h-8l-2-2z" />
                      </svg>
                      <span className="text-xs text-gray-300 truncate w-full text-center px-1">{file.name}</span>
                    </button>
                  ) : (
                    <>
                      <button onClick={() => toggleSelect(file.name)}
                        className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          selected.has(file.name) ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-gray-700 hover:border-gray-500"
                        }`}>
                        <Image src={file.url} alt={file.name} fill className="object-cover" unoptimized />
                        {selected.has(file.name) && (
                          <div className="absolute inset-0 bg-emerald-500/20 flex items-start justify-end p-1">
                            <div className="rounded-full bg-emerald-500 p-0.5">
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                      {/* Hover actions */}
                      <div className="absolute bottom-0 left-0 right-0 flex gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyUrl(file.url)} title="Copy URL"
                          className="flex-1 rounded-lg bg-black/70 py-1 text-xs text-gray-300 hover:text-white transition-colors">
                          Copy URL
                        </button>
                      </div>
                    </>
                  )}
                  <p className="mt-1 text-xs text-gray-600 truncate px-0.5">{file.name}</p>
                  <p className="text-xs text-gray-700">{formatSize(file.size)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* List view */
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500">
                <th className="px-4 py-2 text-left w-8">
                  <input type="checkbox" checked={selected.size === files.length && files.length > 0} onChange={toggleAll}
                    className="rounded accent-emerald-500" />
                </th>
                <th className="px-4 py-2 text-left">Tên</th>
                <th className="px-4 py-2 text-right">Dung lượng</th>
                <th className="px-4 py-2 text-right">Cập nhật</th>
                <th className="px-4 py-2 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {files.map((file) => (
                <tr key={file.name} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-2">
                    {!file.isFolder && (
                      <input type="checkbox" checked={selected.has(file.name)} onChange={() => toggleSelect(file.name)}
                        className="rounded accent-emerald-500" />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {file.isFolder ? (
                        <button onClick={() => openFolder(file.name)} className="flex items-center gap-2 hover:text-emerald-400">
                          <svg className="h-4 w-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8c0-1.11-.89-2-2-2h-8l-2-2z" />
                          </svg>
                          <span className="text-gray-300">{file.name}/</span>
                        </button>
                      ) : (
                        <>
                          <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-gray-800">
                            <Image src={file.url} alt="" width={32} height={32} className="h-full w-full object-cover" unoptimized />
                          </div>
                          <span className="text-gray-300 text-xs truncate max-w-[200px]">{file.name}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-gray-500">{formatSize(file.size)}</td>
                  <td className="px-4 py-2 text-right text-xs text-gray-600">
                    {file.updatedAt ? new Date(file.updatedAt).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {!file.isFolder && (
                      <button onClick={() => copyUrl(file.url)} className="text-xs text-gray-500 hover:text-emerald-400 transition-colors">
                        Copy URL
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {dragOver && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-emerald-500/10 backdrop-blur-sm pointer-events-none">
          <div className="rounded-2xl border-2 border-emerald-500 bg-gray-900 px-10 py-8 text-center">
            <div className="text-4xl mb-3">⬆️</div>
            <p className="text-lg font-semibold text-emerald-400">Thả ảnh để upload</p>
          </div>
        </div>
      )}
    </div>
  );
}
