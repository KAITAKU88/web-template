"use client";

import { useState, useTransition, useMemo } from "react";
import { deleteCustomerOrders, createCustomerGroup, deleteCustomerGroup, addToGroup, removeFromGroup } from "./actions";
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
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[1]);
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [addGroupTarget, setAddGroupTarget] = useState<string | null>(null);
  const [groupErr, setGroupErr] = useState("");

  const filtered = useMemo(() => {
    return customers
      .filter((c) => {
        const matchSearch = !search || c.email.toLowerCase().includes(search.toLowerCase());
        const matchGroup = filterGroup === "all" || c.groups.includes(filterGroup);
        return matchSearch && matchGroup;
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
  }, [customers, search, sortKey, sortDir, filterGroup]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-gray-700">↕</span>;
    return <span className="text-emerald-400">{sortDir === "desc" ? "↓" : "↑"}</span>;
  }

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

  const totalRevenue = customers.reduce((s, c) => s + c.total_revenue, 0);

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
        <button
          onClick={() => setShowGroupModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          + Tạo nhóm
        </button>
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
          <h2 className="mb-3 text-sm font-semibold text-gray-300">Nhóm khách hàng</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterGroup("all")}
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
                    onClick={() => setFilterGroup(filterGroup === g.id ? "all" : g.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filterGroup === g.id ? "ring-2 ring-white/20" : ""
                    }`}
                    style={{ backgroundColor: g.color + "33", color: g.color }}
                  >
                    {g.name} ({count})
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
      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm email..."
          className="rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500"
        />
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
                <tr key={c.email} className="hover:bg-gray-800/40 transition-colors">
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
                    {c.last_purchase
                      ? new Date(c.last_purchase).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {c.groups.map((gid) => {
                        const g = groups.find((x) => x.id === gid);
                        if (!g) return null;
                        return (
                          <span
                            key={gid}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: g.color + "33", color: g.color }}
                          >
                            {g.name}
                            <button
                              onClick={() => handleRemoveFromGroup(c.email, gid)}
                              className="hover:opacity-70"
                            >×</button>
                          </span>
                        );
                      })}
                      {addGroupTarget === c.email ? (
                        <select
                          autoFocus
                          onBlur={() => setAddGroupTarget(null)}
                          onChange={(e) => { if (e.target.value) handleAddToGroup(c.email, e.target.value); }}
                          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-900 dark:text-white"
                        >
                          <option value="">Chọn nhóm...</option>
                          {groups.filter((g) => !c.groups.includes(g.id)).map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      ) : (
                        groups.length > 0 && c.groups.length < groups.length && (
                          <button
                            onClick={() => setAddGroupTarget(c.email)}
                            className="rounded-full border border-gray-300 dark:border-gray-700 px-2 py-0.5 text-xs text-gray-500 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                          >
                            + nhóm
                          </button>
                        )
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setDeleteConfirm(c.email)}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-gray-500">
                    {search ? "Không tìm thấy khách hàng" : "Chưa có khách hàng nào"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm modal */}
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
            <p className="mb-2 text-sm text-gray-300">
              Bạn sắp xóa toàn bộ đơn hàng của:
            </p>
            <p className="mb-4 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 font-mono text-sm text-gray-900 dark:text-white">
              {deleteConfirm}
            </p>
            <p className="mb-6 text-sm text-red-400">
              ⚠️ Tất cả đơn hàng, lịch sử giao dịch của khách này sẽ bị xóa vĩnh viễn.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isPending}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {isPending ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create group modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
            <h3 className="mb-4 font-bold text-gray-900 dark:text-white">Tạo nhóm khách hàng</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Tên nhóm *</label>
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="VD: Khách VIP, Mua nhiều lần..."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500"
                />
                {groupErr && <p className="mt-1 text-xs text-red-400">{groupErr}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Màu nhóm</label>
                <div className="flex gap-2">
                  {GROUP_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewGroupColor(c)}
                      className={`h-6 w-6 rounded-full transition-transform ${newGroupColor === c ? "scale-125 ring-2 ring-white ring-offset-1 ring-offset-gray-900" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Mô tả (tuỳ chọn)</label>
                <input
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Mô tả ngắn về nhóm..."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { setShowGroupModal(false); setGroupErr(""); }}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={isPending}
                className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors disabled:opacity-50"
              >
                Tạo nhóm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
