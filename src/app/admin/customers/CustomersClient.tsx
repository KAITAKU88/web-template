"use client";

import { useState, useTransition, useMemo, useRef } from "react";
import { deleteCustomerOrders, createCustomerGroup, deleteCustomerGroup, addToGroup, removeFromGroup, bulkAddToGroup } from "./actions";
import { formatCurrency } from "@/lib/utils";

interface CustomerRow {
  email: string;
  phone: string | null;
  total_orders: number;
  total_revenue: number;
  last_purchase: string | null;
  groups: string[];
}

interface Group {
  id: string;
  name: string;
  color: string;
}

type SortKey = "revenue" | "orders" | "last_purchase" | "email";

const GROUP_COLORS = ["#6b7280","#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#ec4899"];

// ── CSV auto-detect helpers ──────────────────────────────────────────
function detectEmailCol(headers: string[]): number {
  return headers.findIndex((h) => /email|mail/i.test(h));
}
function detectPhoneCol(headers: string[]): number {
  return headers.findIndex((h) => /phone|sdt|điện thoại|sđt|tel/i.test(h));
}
function parseCSV(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      // Handle quoted fields
      const cols: string[] = [];
      let cur = "", inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQ = !inQ; }
        else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
        else cur += ch;
      }
      cols.push(cur.trim());
      return cols;
    });
}

export default function CustomersClient({
  customers: initial,
  groups: initialGroups,
}: {
  customers: CustomerRow[];
  groups: Group[];
}) {
  const [customers, setCustomers] = useState(initial);
  const [groups, setGroups] = useState(initialGroups);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterMinOrders, setFilterMinOrders] = useState(0);
  const [filterMinRevenue, setFilterMinRevenue] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [addGroupTarget, setAddGroupTarget] = useState<string | null>(null);

  // ── Create Group modal ──────────────────────────────────────────────
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[1]);
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [groupErr, setGroupErr] = useState("");

  // ── CSV Import modal ────────────────────────────────────────────────
  const [showImportModal, setShowImportModal] = useState(false);
  const [importForGroupId, setImportForGroupId] = useState<string>(""); // pre-fill when opened from a group
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [emailColIdx, setEmailColIdx] = useState(-1);
  const [phoneColIdx, setPhoneColIdx] = useState(-1);
  const [importGroupId, setImportGroupId] = useState<string>("");
  const [importStatus, setImportStatus] = useState<"idle" | "importing" | "done" | "error">("idle");
  const [importResult, setImportResult] = useState<{ added: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Filter ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return customers
      .filter((c) => {
        const matchSearch = !search || c.email.toLowerCase().includes(search.toLowerCase());
        const matchGroup = filterGroup === "all" || c.groups.includes(filterGroup);
        const matchOrders = c.total_orders >= filterMinOrders;
        const matchRevenue = c.total_revenue >= filterMinRevenue;
        return matchSearch && matchGroup && matchOrders && matchRevenue;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "revenue")       cmp = a.total_revenue - b.total_revenue;
        if (sortKey === "orders")        cmp = a.total_orders - b.total_orders;
        if (sortKey === "email")         cmp = a.email.localeCompare(b.email);
        if (sortKey === "last_purchase") {
          cmp = (a.last_purchase ?? "").localeCompare(b.last_purchase ?? "");
        }
        return sortDir === "desc" ? -cmp : cmp;
      });
  }, [customers, search, sortKey, sortDir, filterGroup, filterMinOrders, filterMinRevenue]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-gray-700">↕</span>;
    return <span className="text-emerald-400">{sortDir === "desc" ? "↓" : "↑"}</span>;
  }

  // ── Handlers ─────────────────────────────────────────────────────────
  async function handleDelete(email: string) {
    startTransition(async () => {
      await deleteCustomerOrders(email);
      setCustomers((cs) => cs.filter((c) => c.email !== email));
      setDeleteConfirm(null);
    });
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) { setGroupErr("Tên nhóm không được để trống"); return; }
    startTransition(async () => {
      await createCustomerGroup(newGroupName.trim(), newGroupColor, newGroupDesc.trim());
      setShowGroupModal(false);
      setNewGroupName(""); setNewGroupDesc(""); setGroupErr("");
      window.location.reload();
    });
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm("Xóa nhóm này sẽ xóa tất cả thành viên khỏi nhóm. Tiếp tục?")) return;
    startTransition(async () => {
      await deleteCustomerGroup(id);
      setGroups((gs) => gs.filter((g) => g.id !== id));
    });
  }

  async function handleAddToGroup(email: string, groupId: string) {
    startTransition(async () => {
      await addToGroup(email, groupId);
      setCustomers((cs) => cs.map((c) =>
        c.email === email && !c.groups.includes(groupId)
          ? { ...c, groups: [...c.groups, groupId] }
          : c
      ));
      setAddGroupTarget(null);
    });
  }

  async function handleRemoveFromGroup(email: string, groupId: string) {
    startTransition(async () => {
      await removeFromGroup(email, groupId);
      setCustomers((cs) => cs.map((c) =>
        c.email === email ? { ...c, groups: c.groups.filter((g) => g !== groupId) } : c
      ));
    });
  }

  // ── CSV Import handlers ───────────────────────────────────────────────
  function openImportModal(groupId = "") {
    setImportForGroupId(groupId);
    setImportGroupId(groupId || (groups[0]?.id ?? ""));
    setCsvRows([]); setCsvHeaders([]);
    setEmailColIdx(-1); setPhoneColIdx(-1);
    setImportStatus("idle"); setImportResult(null);
    setShowImportModal(true);
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (!parsed.length) return;
      const headers = parsed[0];
      const rows = parsed.slice(1).filter((r) => r.some((c) => c.trim()));
      setCsvHeaders(headers);
      setCsvRows(rows);
      setEmailColIdx(detectEmailCol(headers));
      setPhoneColIdx(detectPhoneCol(headers));
      setImportStatus("idle"); setImportResult(null);
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  async function handleImport() {
    if (emailColIdx === -1) return;
    const emails = csvRows.map((r) => r[emailColIdx]).filter(Boolean);
    if (!emails.length || !importGroupId) return;
    setImportStatus("importing");
    const result = await bulkAddToGroup(emails, importGroupId);
    setImportResult(result);
    setImportStatus(result.errors.length > 0 && result.added === 0 ? "error" : "done");
  }

  const totalRevenue = customers.reduce((s, c) => s + c.total_revenue, 0);
  const hasActiveFilter = filterMinOrders > 0 || filterMinRevenue > 0 || filterGroup !== "all" || search;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Khách hàng</h1>
          <p className="mt-1 text-sm text-gray-400">
            {customers.length} khách hàng · {formatCurrency(totalRevenue)} tổng doanh thu
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openImportModal()}
            className="flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            📥 Import CSV
          </button>
          <button
            onClick={() => setShowGroupModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            + Tạo nhóm
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Tổng khách", value: customers.length },
          { label: "Đã mua", value: customers.filter((c) => c.total_orders > 0).length },
          { label: "Doanh thu TB", value: formatCurrency(customers.length ? Math.round(totalRevenue / customers.length) : 0) },
          { label: "Nhóm khách", value: groups.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Groups */}
      {groups.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300">Nhóm khách hàng</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setFilterGroup("all");
                setFilterMinOrders(0);
                setFilterMinRevenue(0);
                setSearch("");
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterGroup === "all" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Tất cả ({customers.length})
            </button>
            {groups.map((g) => {
              const count = customers.filter((c) => c.groups.includes(g.id)).length;
              return (
                <div key={g.id} className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setFilterGroup(filterGroup === g.id ? "all" : g.id);
                      setFilterMinOrders(0);
                      setFilterMinRevenue(0);
                      setSearch("");
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filterGroup === g.id ? "ring-2 ring-white/20" : ""
                    }`}
                    style={{ backgroundColor: g.color + "33", color: g.color }}
                  >
                    {g.name} ({count})
                  </button>
                  <button
                    onClick={() => openImportModal(g.id)}
                    className="rounded-full px-2 py-0.5 text-xs text-gray-500 hover:text-emerald-400 transition-colors"
                    title="Import CSV vào nhóm này"
                  >
                    📥
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(g.id)}
                    className="rounded-full p-0.5 text-gray-600 hover:text-red-400 transition-colors"
                    title="Xóa nhóm"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Bộ lọc</span>
          {hasActiveFilter && (
            <button
              onClick={() => { setSearch(""); setFilterGroup("all"); setFilterMinOrders(0); setFilterMinRevenue(0); }}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {/* Search */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 shrink-0">Tìm email</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập email..."
              className="rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500 w-52"
            />
          </div>

          {/* Min orders */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 shrink-0">Số đơn</span>
            <div className="flex gap-1">
              {[
                { label: "Tất cả", val: 0 },
                { label: "≥1", val: 1 },
                { label: "≥3", val: 3 },
                { label: "≥5", val: 5 },
                { label: "≥10", val: 10 },
              ].map((o) => (
                <button
                  key={o.val}
                  onClick={() => setFilterMinOrders(o.val)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    filterMinOrders === o.val
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Min revenue */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 shrink-0">Doanh thu</span>
            <div className="flex gap-1">
              {[
                { label: "Tất cả", val: 0 },
                { label: "≥100k", val: 100_000 },
                { label: "≥500k", val: 500_000 },
                { label: "≥1M", val: 1_000_000 },
                { label: "≥5M", val: 5_000_000 },
              ].map((o) => (
                <button
                  key={o.val}
                  onClick={() => setFilterMinRevenue(o.val)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    filterMinRevenue === o.val
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result count */}
        {hasActiveFilter && (
          <p className="text-xs text-gray-500">
            Hiển thị <span className="font-semibold text-gray-300">{filtered.length}</span> / {customers.length} khách hàng
          </p>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-500 uppercase">
                <th className="px-5 py-3 text-left">#</th>
                <th className="px-5 py-3 text-left cursor-pointer hover:text-gray-300" onClick={() => toggleSort("email")}>
                  Email <SortIcon k="email" />
                </th>
                <th className="px-5 py-3 text-left">SĐT</th>
                <th className="px-5 py-3 text-right cursor-pointer hover:text-gray-300" onClick={() => toggleSort("orders")}>
                  Đơn hàng <SortIcon k="orders" />
                </th>
                <th className="px-5 py-3 text-right cursor-pointer hover:text-gray-300" onClick={() => toggleSort("revenue")}>
                  Doanh thu <SortIcon k="revenue" />
                </th>
                <th className="px-5 py-3 text-right cursor-pointer hover:text-gray-300" onClick={() => toggleSort("last_purchase")}>
                  Lần cuối <SortIcon k="last_purchase" />
                </th>
                <th className="px-5 py-3 text-left">Nhóm</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filtered.map((c, i) => (
                <tr key={c.email} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-4 text-gray-600 text-xs">{i + 1}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{c.email}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{c.phone ?? "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-semibold text-gray-900 dark:text-white">{c.total_orders}</span>
                    <span className="text-gray-500 text-xs ml-1">đơn</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-semibold text-emerald-400">{formatCurrency(c.total_revenue)}</span>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-400 text-xs">
                    {c.last_purchase ? new Date(c.last_purchase).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {c.groups.map((gid) => {
                        const g = groups.find((x) => x.id === gid);
                        if (!g) return null;
                        return (
                          <span key={gid} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: g.color + "33", color: g.color }}>
                            {g.name}
                            <button onClick={() => handleRemoveFromGroup(c.email, gid)} className="hover:opacity-70">×</button>
                          </span>
                        );
                      })}
                      {addGroupTarget === c.email ? (
                        <select autoFocus onBlur={() => setAddGroupTarget(null)}
                          onChange={(e) => { if (e.target.value) handleAddToGroup(c.email, e.target.value); }}
                          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-900 dark:text-white">
                          <option value="">Chọn nhóm...</option>
                          {groups.filter((g) => !c.groups.includes(g.id)).map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      ) : (
                        groups.length > 0 && c.groups.length < groups.length && (
                          <button onClick={() => setAddGroupTarget(c.email)}
                            className="rounded-full border border-gray-300 dark:border-gray-700 px-2 py-0.5 text-xs text-gray-500 hover:border-emerald-500 hover:text-emerald-400 transition-colors">
                            + nhóm
                          </button>
                        )
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => setDeleteConfirm(c.email)}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors">
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-gray-500">
                    {hasActiveFilter ? "Không có khách hàng nào khớp bộ lọc" : "Chưa có khách hàng nào"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Delete confirm modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-white dark:bg-gray-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Xóa khách hàng</h3>
                <p className="text-xs text-gray-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <p className="mb-2 text-sm text-gray-300">Bạn sắp xóa toàn bộ đơn hàng của:</p>
            <p className="mb-4 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 font-mono text-sm text-gray-900 dark:text-white">{deleteConfirm}</p>
            <p className="mb-6 text-sm text-red-400">⚠️ Tất cả đơn hàng, lịch sử giao dịch của khách này sẽ bị xóa vĩnh viễn.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Hủy
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={isPending}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50">
                {isPending ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Group modal ── */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
            <h3 className="mb-4 font-bold text-gray-900 dark:text-white">Tạo nhóm khách hàng</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Tên nhóm *</label>
                <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="VD: Khách VIP, Mua nhiều lần..."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500" />
                {groupErr && <p className="mt-1 text-xs text-red-400">{groupErr}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Màu nhóm</label>
                <div className="flex gap-2">
                  {GROUP_COLORS.map((c) => (
                    <button key={c} onClick={() => setNewGroupColor(c)}
                      className={`h-6 w-6 rounded-full transition-transform ${newGroupColor === c ? "scale-125 ring-2 ring-white ring-offset-1 ring-offset-gray-900" : ""}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Mô tả (tuỳ chọn)</label>
                <input value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Mô tả ngắn về nhóm..."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => { setShowGroupModal(false); setGroupErr(""); }}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Hủy
              </button>
              <button onClick={handleCreateGroup} disabled={isPending}
                className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors disabled:opacity-50">
                Tạo nhóm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSV Import modal ── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">Import khách hàng từ CSV</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-white transition-colors text-xl">✕</button>
            </div>

            {/* Step 1: Upload file */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Bước 1 — Chọn file CSV</label>
              <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleCsvFile} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 px-4 py-3 text-sm text-gray-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors w-full justify-center">
                📂 {csvRows.length > 0 ? `Đã tải ${csvRows.length} dòng — nhấn để đổi file` : "Chọn file CSV"}
              </button>
              <p className="mt-1 text-xs text-gray-600">File CSV cần có ít nhất 1 cột chứa email. Hệ thống tự động phát hiện cột.</p>
            </div>

            {/* Step 2: Column mapping */}
            {csvHeaders.length > 0 && (
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-400">Bước 2 — Mapping cột</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Cột Email <span className="text-red-400">*</span></label>
                    <select value={emailColIdx} onChange={(e) => setEmailColIdx(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500">
                      <option value={-1}>— Không chọn —</option>
                      {csvHeaders.map((h, i) => <option key={i} value={i}>{h || `Cột ${i + 1}`}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Cột SĐT (tuỳ chọn)</label>
                    <select value={phoneColIdx} onChange={(e) => setPhoneColIdx(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500">
                      <option value={-1}>— Không chọn —</option>
                      {csvHeaders.map((h, i) => <option key={i} value={i}>{h || `Cột ${i + 1}`}</option>)}
                    </select>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-400">
                    Xem trước ({Math.min(5, csvRows.length)}/{csvRows.length} dòng)
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {csvRows.slice(0, 5).map((row, i) => (
                      <div key={i} className="flex items-center gap-4 px-3 py-2 text-xs">
                        <span className="text-gray-400 w-4">{i + 1}</span>
                        <span className="text-gray-900 dark:text-white font-mono flex-1">
                          {emailColIdx >= 0 ? row[emailColIdx] || "—" : "—"}
                        </span>
                        <span className="text-gray-500 font-mono">
                          {phoneColIdx >= 0 ? row[phoneColIdx] || "—" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Select group */}
            {csvRows.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Bước 3 — Gán vào nhóm</label>
                {groups.length === 0 ? (
                  <p className="text-xs text-amber-400">⚠️ Chưa có nhóm nào. Tạo nhóm trước khi import.</p>
                ) : (
                  <select value={importGroupId} onChange={(e) => setImportGroupId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500">
                    <option value="">— Chọn nhóm —</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                )}
              </div>
            )}

            {/* Result */}
            {importResult && (
              <div className={`rounded-xl px-4 py-3 text-sm ${importStatus === "done" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                {importStatus === "done"
                  ? `✅ Đã import ${importResult.added} email vào nhóm thành công!`
                  : `❌ Lỗi: ${importResult.errors.join(", ")}`}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => setShowImportModal(false)}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {importStatus === "done" ? "Đóng" : "Hủy"}
              </button>
              {importStatus !== "done" && (
                <button
                  onClick={handleImport}
                  disabled={emailColIdx === -1 || !importGroupId || csvRows.length === 0 || importStatus === "importing"}
                  className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors disabled:opacity-40">
                  {importStatus === "importing"
                    ? "Đang import..."
                    : `Import ${emailColIdx >= 0 ? csvRows.length : 0} email`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
