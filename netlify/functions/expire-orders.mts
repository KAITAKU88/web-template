import type { Config } from "@netlify/functions";

// Chạy mỗi 5 phút — tự động hủy đơn pending quá hạn
export default async function handler() {
  const baseUrl = process.env.URL ?? "http://localhost:3000";
  const secret = process.env.CRON_SECRET ?? "";

  await fetch(`${baseUrl}/api/cron/expire-orders`, {
    method: "POST",
    headers: { "x-cron-secret": secret },
  });
}

export const config: Config = {
  schedule: "*/5 * * * *", // mỗi 5 phút
};
