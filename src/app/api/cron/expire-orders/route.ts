import { NextRequest, NextResponse } from "next/server";
import { expireStaleOrders } from "@/lib/expireOrders";
import { getActivePassword } from "@/lib/admin-password";

// Được gọi bởi external cron (cron-job.org) mỗi 5 phút
// Bảo vệ bằng CRON_SECRET để tránh ai gọi tùy tiện
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [cancelled] = await Promise.all([
    expireStaleOrders(),
    getActivePassword(), // trigger cleanup nếu temp password hết hạn
  ]);
  return NextResponse.json({ cancelled });
}
