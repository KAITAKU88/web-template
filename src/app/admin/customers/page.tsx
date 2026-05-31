import { createAdminClient } from "@/lib/supabase/server";
import CustomersClient from "./CustomersClient";

export const dynamic = "force-dynamic";

interface OrderRow {
  customer_email: string;
  customer_phone: string | null;
  amount: number;
  paid_at: string | null;
  bump_amount: number | null;
}

export default async function CustomersPage() {
  const supabase = createAdminClient();

  const [{ data: orders }, { data: groupMembers }, { data: groups }] = await Promise.all([
    supabase
      .from("orders")
      .select("customer_email, customer_phone, amount, paid_at, bump_amount")
      .eq("status", "success")
      .order("paid_at", { ascending: false }),
    supabase
      .from("customer_group_members")
      .select("email, group_id"),
    supabase
      .from("customer_groups")
      .select("id, name, color")
      .order("created_at"),
  ]);

  // Aggregate customers từ orders
  const customerMap = new Map<string, {
    email: string;
    phone: string | null;
    total_orders: number;
    total_revenue: number;
    last_purchase: string | null;
    groups: string[];
  }>();

  for (const o of (orders as OrderRow[]) ?? []) {
    const existing = customerMap.get(o.customer_email);
    const revenue = (o.amount ?? 0) + (o.bump_amount ?? 0);
    if (existing) {
      existing.total_orders += 1;
      existing.total_revenue += revenue;
      if (!existing.last_purchase || (o.paid_at && o.paid_at > existing.last_purchase)) {
        existing.last_purchase = o.paid_at;
      }
      if (!existing.phone && o.customer_phone) existing.phone = o.customer_phone;
    } else {
      customerMap.set(o.customer_email, {
        email: o.customer_email,
        phone: o.customer_phone,
        total_orders: 1,
        total_revenue: revenue,
        last_purchase: o.paid_at,
        groups: [],
      });
    }
  }

  // Gắn groups vào từng khách hàng
  for (const m of groupMembers ?? []) {
    const c = customerMap.get(m.email);
    if (c) c.groups.push(m.group_id);
  }

  const customers = Array.from(customerMap.values());

  return (
    <CustomersClient
      customers={customers}
      groups={(groups ?? []) as { id: string; name: string; color: string }[]}
    />
  );
}
