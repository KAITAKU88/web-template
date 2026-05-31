"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { slugifyFilename } from "@/lib/utils";
import { compressToWebP } from "@/lib/browser-utils";

const BUCKETS = [
  { id: "product-images", label: "Ảnh sản phẩm", icon: "🖼️" },
  { id: "site-assets",    label: "Assets trang web", icon: "🎨" },
  { id: "avatars",        label: "Avatar",     icon: "👤" },
];

const STORAGE_LIMIT = 1024 * 1024 * 1024; // 1 GB Supabase free tier

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
  const [folderError, setFolderError] = useState("");
  const [search, setSearch] = useState("");
  const [renamingItem, setRenamingItem] = useState<{ name: string; isFolder: boolean; draft: string } | null>(null);
  const [movingFile, setMovingFile] = useState<string | null>(null);
  const [moveFolders, setMoveFolders] = useState<string[]>([]);
  const [moveTarget, setMoveTarget] = useState("");
  const [statsTotal, setStatsTotal] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const breadcrumbs = folder ? folder.split("/") : [];

  // ── Load current folder ──────────────────────────────────────────
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

  // ── Storage stats (load once on mount) ──────────────────────────
  useEffect(() => {
    async function sumFolder(bkt: string, prefix = ""): Promise<number> {
      const { data } = await supabase.storage.from(bkt).list(prefix || undefined, { limit: 500 });
      let size = 0;
      for (const f of data ?? []) {
        if (f.name === ".emptyFolderPlaceholder") continue;
        if (f.metadata?.size) size += f.metadata.size;
        else size += await sumFolder(bkt, prefix ? `${prefix}/${f.name}` : f.name);
      }
      return size;
    }
    async function loadStats() {
      setStatsLoading(true);
      let total = 0;
      for (const b of BUCKETS) total += await sumFolder(b.id);
      setStatsTotal(total);
      setStatsLoading(false);
    }
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────
  const getPublicUrl = (path: string) =>
    supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

  async function updateDbRefs(oldUrl: string, newUrl: string) {
    if (oldUrl === newUrl) return;
    await fetch("/api/admin/update-image-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldUrl, newUrl }),
    });
  }

  async function listAllRecursive(prefix: string): Promise<string[]> {
    const { data } = await supabase.storage.from(bucket).list(prefix, { limit: 500 });
    const paths: string[] = [];
    for (const f of data ?? []) {
      if (f.name === ".emptyFolderPlaceholder") continue;
      const p = `${prefix}/${f.name}`;
      if (f.metadata) paths.push(p);
      else paths.push(...await listAllRecursive(p));
    }
    return paths;
  }

  // Create a 1×1 transparent PNG (satisfies image/* MIME restriction on buckets)
  async function makePlaceholderBlob(): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1; canvas.height = 1;
      canvas.toBlob((b) => resolve(b ?? new Blob()), "image/png");
    });
  }

  // ── Navigation ───────────────────────────────────────────────────
  const openFolder = (name: string) => { setFolder((f) => f ? `${f}/${name}` : name); setSearch(""); };
  const navigateTo = (idx: number) => { setFolder(breadcrumbs.slice(0, idx + 1).join("/")); setSearch(""); };

  // ── Upload (compress → WebP, keep original name) ─────────────────
  async function handleUpload(fileList: FileList) {
    const raw = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!raw.length) return;
    setUploading(true);
    setUploadProgress(0);
    let done = 0;
    for (const file of raw) {
      const compressed = await compressToWebP(file);
      const prefix = folder ? `${folder}/` : "";
      const path = `${prefix}${slugifyFilename(compressed.name)}`;
      await supabase.storage.from(bucket).upload(path, compressed, { upsert: true });
      done++;
      setUploadProgress(Math.round((done / raw.length) * 100));
    }
    setUploading(false);
    load();
  }

  // ── Create folder ─────────────────────────────────────────────────
  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    setFolderError("");
    const prefix = folder ? `${folder}/` : "";
    const path = `${prefix}${name}/.emptyFolderPlaceholder`;
    const placeholder = await makePlaceholderBlob();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, placeholder, { contentType: "image/png", upsert: true });
    if (error) { setFolderError(error.message); return; }
    setNewFolderName(""); setShowNewFolder(false);
    load();
  }

  // ── Delete selected files ─────────────────────────────────────────
  async function handleDeleteSelected() {
    if (!selected.size) return;
    if (!confirm(`Xóa ${selected.size} mục đã chọn?`)) return;
    const paths = Array.from(selected).map((name) => folder ? `${folder}/${name}` : name);
    await supabase.storage.from(bucket).remove(paths);
    load();
  }

  // ── Rename file ───────────────────────────────────────────────────
  async function handleRenameFile(oldName: string, newName: string) {
    const slugged = slugifyFilename(newName.trim());
    if (!slugged || slugged === oldName) { setRenamingItem(null); return; }
    const oldPath = folder ? `${folder}/${oldName}` : oldName;
    const newPath = folder ? `${folder}/${slugged}` : slugged;
    const { error } = await supabase.storage.from(bucket).move(oldPath, newPath);
    if (error) { alert(error.message); return; }
    await updateDbRefs(getPublicUrl(oldPath), getPublicUrl(newPath));
    setRenamingItem(null);
    load();
  }

  // ── Rename folder ─────────────────────────────────────────────────
  async function handleRenameFolder(oldName: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) { setRenamingItem(null); return; }
    const oldPrefix = folder ? `${folder}/${oldName}` : oldName;
    const newPrefix = folder ? `${folder}/${trimmed}` : trimmed;
    const allFiles = await listAllRecursive(oldPrefix);
    for (const filePath of allFiles) {
      const newFilePath = newPrefix + filePath.slice(oldPrefix.length);
      const { error } = await supabase.storage.from(bucket).move(filePath, newFilePath);
      if (!error) await updateDbRefs(getPublicUrl(filePath), getPublicUrl(newFilePath));
    }
    // move placeholder if exists
    await supabase.storage.from(bucket)
      .move(`${oldPrefix}/.emptyFolderPlaceholder`, `${newPrefix}/.emptyFolderPlaceholder`)
      .catch(() => {});
    setRenamingItem(null);
    load();
  }

  // ── Delete folder ─────────────────────────────────────────────────
  async function handleDeleteFolder(name: string) {
    if (!confirm(`Xóa thư mục "${name}" và toàn bộ ảnh bên trong?`)) return;
    const prefix = folder ? `${folder}/${name}` : name;
    const allFiles = await listAllRecursive(prefix);
    const toDelete = [...allFiles, `${prefix}/.emptyFolderPlaceholder`];
    if (toDelete.length) await supabase.storage.from(bucket).remove(toDelete);
    load();
  }

  // ── Move file ─────────────────────────────────────────────────────
  async function openMoveModal(filename: string) {
    setMovingFile(filename);
    setMoveTarget("");
    const { data } = await supabase.storage.from(bucket).list(undefined, { limit: 200 });
    setMoveFolders(
      (data ?? [])
        .filter((f) => !f.metadata && f.name !== ".emptyFolderPlaceholder")
        .map((f) => f.name)
    );
  }

  async function handleMoveFile() {
    if (!movingFile) return;
    const oldPath = folder ? `${folder}/${movingFile}` : movingFile;
    const newPath = moveTarget ? `${moveTarget}/${movingFile}` : movingFile;
    if (oldPath === newPath) { setMovingFile(null); return; }
    const { error } = await supabase.storage.from(bucket).move(oldPath, newPath);
    if (error) { alert(error.message); return; }
    await updateDbRefs(getPublicUrl(oldPath), getPublicUrl(newPath));
    setMovingFile(null);
    load();
  }

  // ── Misc ──────────────────────────────────────────────────────────
  function toggleSelect(name: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
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
  async function copyUrl(url: string) { await navigator.clipboard.writeText(url); }

  const visible = search.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const statsPct = statsTotal !== null ? Math.min((statsTotal / STORAGE_LIMIT) * 100, 100) : 0;

  return (
    <div className="space-y-4">
      {/* Storage usage bar */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 shrink-0 font-medium">Dung lượng</span>
          {statsLoading ? (
            <span className="text-xs text-gray-600">Đang tính...</span>
          ) : statsTotal !== null ? (
            <>
              <span className="text-xs whitespace-nowrap shrink-0">
                <span className="text-white font-medium">{formatSize(statsTotal)}</span>
                <span className="text-gray-600"> / 1 GB</span>
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden min-w-0">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${statsPct > 80 ? "bg-red-500" : statsPct > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.max(statsPct, 0.5)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 shrink-0">{statsPct.toFixed(1)}%</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Bucket tabs */}
      <div className="flex gap-2 flex-wrap">
        {BUCKETS.map((b) => (
          <button type="button" key={b.id} onClick={() => { setBucket(b.id); setFolder(""); setSearch(""); }}
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
          <button type="button" onClick={() => { setFolder(""); setSearch(""); }} className="text-gray-400 hover:text-white transition-colors shrink-0">
            {BUCKETS.find((b) => b.id === bucket)?.label}
          </button>
          {breadcrumbs.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-gray-600">/</span>
              <button type="button" onClick={() => navigateTo(i)} className="text-gray-400 hover:text-white transition-colors">{part}</button>
            </span>
          ))}
        </div>

        {/* Search */}
        <div className="relative shrink-0">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên..."
            className="w-40 rounded-xl border border-gray-700 bg-gray-800 pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 placeholder:text-gray-600" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {selected.size > 0 && (
            <button type="button" onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xóa ({selected.size})
            </button>
          )}

          {showNewFolder ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <input value={newFolderName} onChange={(e) => { setNewFolderName(e.target.value); setFolderError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()} placeholder="Tên thư mục" autoFocus
                  className={`w-32 rounded-xl border bg-gray-800 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500 ${folderError ? "border-red-500" : "border-gray-700"}`} />
                <button type="button" onClick={handleCreateFolder} className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-400 hover:bg-emerald-500/30">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button type="button" onClick={() => { setShowNewFolder(false); setNewFolderName(""); setFolderError(""); }} className="rounded-lg p-1.5 text-gray-500 hover:text-white">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {folderError && <p className="text-xs text-red-400 ml-0.5">{folderError}</p>}
            </div>
          ) : (
            <button type="button" onClick={() => setShowNewFolder(true)}
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

          <button type="button" onClick={() => setView(view === "grid" ? "list" : "grid")}
            className="rounded-xl border border-gray-700 p-1.5 text-gray-400 hover:text-white transition-colors">
            {view === "grid"
              ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
            }
          </button>
        </div>
      </div>

      {/* File area */}
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
              <p className="text-xs mt-1">Ảnh tự động nén → WebP. Dùng nút Upload ở trên.</p>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <p className="text-sm text-gray-500">Không tìm thấy ảnh nào với từ khóa <span className="text-gray-300">&quot;{search}&quot;</span></p>
            <button type="button" onClick={() => setSearch("")} className="text-xs text-emerald-400 hover:text-emerald-300">Xóa tìm kiếm</button>
          </div>
        ) : view === "grid" ? (
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <button type="button" onClick={toggleAll} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                {selected.size === files.length ? "Bỏ chọn tất cả" : `Chọn tất cả (${visible.length})`}
              </button>
              {search && <span className="text-xs text-gray-600">— {visible.length} kết quả</span>}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {visible.map((file) => (
                <div key={file.name} className="relative group">
                  {file.isFolder ? (
                    <>
                      {renamingItem?.name === file.name && renamingItem.isFolder ? (
                        <div className="w-full aspect-square rounded-xl border-2 border-emerald-500 bg-gray-800 flex flex-col items-center justify-center gap-2 p-2">
                          <svg className="h-7 w-7 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8c0-1.11-.89-2-2-2h-8l-2-2z" />
                          </svg>
                          <input value={renamingItem.draft}
                            onChange={(e) => setRenamingItem({ ...renamingItem, draft: e.target.value })}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRenameFolder(file.name, renamingItem.draft); if (e.key === "Escape") setRenamingItem(null); }}
                            autoFocus className="w-full text-xs bg-gray-700 border border-emerald-500 rounded px-1.5 py-0.5 text-white outline-none text-center"
                            onClick={(e) => e.stopPropagation()} />
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleRenameFolder(file.name, renamingItem.draft)} className="text-emerald-400 text-xs hover:text-emerald-300">✓</button>
                            <button type="button" onClick={() => setRenamingItem(null)} className="text-gray-500 text-xs hover:text-white">✗</button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => openFolder(file.name)}
                          className="w-full aspect-square rounded-xl border-2 border-gray-700 bg-gray-800 flex flex-col items-center justify-center gap-2 hover:border-gray-500 transition-colors">
                          <svg className="h-8 w-8 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8c0-1.11-.89-2-2-2h-8l-2-2z" />
                          </svg>
                          <span className="text-xs text-gray-300 truncate w-full text-center px-1">{file.name}</span>
                        </button>
                      )}
                      {!renamingItem && (
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setRenamingItem({ name: file.name, isFolder: true, draft: file.name }); }} title="Đổi tên"
                            className="rounded-lg bg-black/70 p-1 text-gray-300 hover:text-white">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(file.name); }} title="Xóa thư mục"
                            className="rounded-lg bg-black/70 p-1 text-gray-300 hover:text-red-400">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => toggleSelect(file.name)}
                        className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          selected.has(file.name) ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-gray-700 hover:border-gray-500"
                        }`}>
                        <Image src={file.url} alt={file.name} fill className="object-cover" unoptimized />
                        {selected.has(file.name) && (
                          <div className="absolute inset-0 bg-emerald-500/20 flex items-start justify-end p-1">
                            <div className="rounded-full bg-emerald-500 p-0.5">
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                          </div>
                        )}
                      </button>
                      <div className="absolute bottom-6 left-0 right-0 flex gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => copyUrl(file.url)} title="Copy URL"
                          className="flex-1 rounded-lg bg-black/70 py-1 text-xs text-gray-300 hover:text-white">Copy</button>
                        <button type="button" onClick={() => setRenamingItem({ name: file.name, isFolder: false, draft: file.name })} title="Đổi tên"
                          className="rounded-lg bg-black/70 p-1 text-gray-300 hover:text-white">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button type="button" onClick={() => openMoveModal(file.name)} title="Di chuyển"
                          className="rounded-lg bg-black/70 p-1 text-gray-300 hover:text-white">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                        </button>
                      </div>
                      {renamingItem?.name === file.name && !renamingItem.isFolder ? (
                        <div className="mt-1 flex items-center gap-1">
                          <input value={renamingItem.draft}
                            onChange={(e) => setRenamingItem({ ...renamingItem, draft: e.target.value })}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRenameFile(file.name, renamingItem.draft); if (e.key === "Escape") setRenamingItem(null); }}
                            autoFocus className="flex-1 text-xs bg-gray-800 border border-emerald-500 rounded px-1.5 py-0.5 text-white outline-none min-w-0"
                            onClick={(e) => e.stopPropagation()} />
                          <button type="button" onClick={() => handleRenameFile(file.name, renamingItem.draft)} className="text-emerald-400 hover:text-emerald-300 text-xs shrink-0">✓</button>
                          <button type="button" onClick={() => setRenamingItem(null)} className="text-gray-500 hover:text-white text-xs shrink-0">✗</button>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-gray-600 truncate px-0.5">{file.name}</p>
                      )}
                      <p className="text-xs text-gray-700">{formatSize(file.size)}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500">
                <th className="px-4 py-2 text-left w-8">
                  <input type="checkbox" checked={selected.size === files.length && files.length > 0} onChange={toggleAll}
                    className="rounded accent-emerald-500" title="Chọn tất cả" />
                </th>
                <th className="px-4 py-2 text-left">Tên</th>
                <th className="px-4 py-2 text-right">Dung lượng</th>
                <th className="px-4 py-2 text-right">Cập nhật</th>
                <th className="px-4 py-2 text-center w-28">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {visible.map((file) => (
                <tr key={file.name} className="hover:bg-gray-800/30 transition-colors group">
                  <td className="px-4 py-2">
                    {!file.isFolder && (
                      <input type="checkbox" checked={selected.has(file.name)} onChange={() => toggleSelect(file.name)}
                        className="rounded accent-emerald-500" />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {renamingItem?.name === file.name ? (
                      <div className="flex items-center gap-1">
                        <input value={renamingItem.draft}
                          onChange={(e) => setRenamingItem({ ...renamingItem, draft: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") renamingItem.isFolder ? handleRenameFolder(file.name, renamingItem.draft) : handleRenameFile(file.name, renamingItem.draft);
                            if (e.key === "Escape") setRenamingItem(null);
                          }}
                          autoFocus className="flex-1 text-xs bg-gray-800 border border-emerald-500 rounded px-2 py-1 text-white outline-none" />
                        <button type="button" onClick={() => renamingItem.isFolder ? handleRenameFolder(file.name, renamingItem.draft) : handleRenameFile(file.name, renamingItem.draft)}
                          className="text-emerald-400 hover:text-emerald-300 text-xs px-1">✓</button>
                        <button type="button" onClick={() => setRenamingItem(null)} className="text-gray-500 hover:text-white text-xs px-1">✗</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {file.isFolder ? (
                          <button type="button" onClick={() => openFolder(file.name)} className="flex items-center gap-2 hover:text-emerald-400">
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
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-gray-500">{formatSize(file.size)}</td>
                  <td className="px-4 py-2 text-right text-xs text-gray-600">
                    {file.updatedAt ? new Date(file.updatedAt).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => setRenamingItem({ name: file.name, isFolder: !!file.isFolder, draft: file.name })} title="Đổi tên"
                        className="rounded p-1 text-gray-500 hover:text-white hover:bg-gray-700 transition-colors">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      {!file.isFolder && (
                        <>
                          <button type="button" onClick={() => copyUrl(file.url)} title="Copy URL"
                            className="rounded p-1 text-gray-500 hover:text-white hover:bg-gray-700 transition-colors">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          </button>
                          <button type="button" onClick={() => openMoveModal(file.name)} title="Di chuyển"
                            className="rounded p-1 text-gray-500 hover:text-white hover:bg-gray-700 transition-colors">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                          </button>
                        </>
                      )}
                      {file.isFolder && (
                        <button type="button" onClick={() => handleDeleteFolder(file.name)} title="Xóa thư mục"
                          className="rounded p-1 text-gray-500 hover:text-red-400 hover:bg-gray-700 transition-colors">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Move file modal */}
      {movingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMovingFile(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-1">Di chuyển file</h3>
            <p className="text-xs text-gray-500 mb-4 truncate">{movingFile}</p>
            <div className="space-y-1 mb-4 max-h-52 overflow-y-auto">
              <button type="button" onClick={() => setMoveTarget("")}
                className={`w-full text-left rounded-lg px-3 py-2 text-xs transition-colors ${moveTarget === "" ? "bg-emerald-500/20 text-emerald-400" : "text-gray-400 hover:bg-gray-800"}`}>
                <span className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  / (Root)
                  {moveTarget === "" && <svg className="h-3 w-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>
              </button>
              {moveFolders.map((f) => (
                <button type="button" key={f} onClick={() => setMoveTarget(f)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-xs transition-colors ${moveTarget === f ? "bg-emerald-500/20 text-emerald-400" : "text-gray-400 hover:bg-gray-800"}`}>
                  <span className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8c0-1.11-.89-2-2-2h-8l-2-2z" /></svg>
                    {f}/
                    {moveTarget === f && <svg className="h-3 w-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMovingFile(null)}
                className="flex-1 rounded-xl border border-gray-700 py-2 text-xs text-gray-400 hover:text-white transition-colors">Hủy</button>
              <button type="button" onClick={handleMoveFile} disabled={folder === moveTarget}
                className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Di chuyển đến đây
              </button>
            </div>
          </div>
        </div>
      )}

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
