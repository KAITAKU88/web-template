import { NextRequest, NextResponse } from "next/server";
import { expireStaleOrders } from "@/lib/expireOrders";

// Được gọi bởi external cron (cron-job.org) mỗi 5 phút
// Bảo vệ bằng CRON_SECRET để tránh ai gọi tùy tiện
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cancelled = await expireStaleOrders();
  return NextResponse.json({ cancelled });
}
