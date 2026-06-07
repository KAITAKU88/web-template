import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/expireOrders", () => ({
  expireStaleOrders: vi.fn().mockResolvedValue(3),
}));

vi.mock("@/lib/admin-password", () => ({
  getActivePassword: vi.fn().mockResolvedValue(null),
}));

import { POST } from "@/app/api/cron/expire-orders/route";
import { expireStaleOrders } from "@/lib/expireOrders";

describe("POST /api/cron/expire-orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
  });

  it("trả 401 khi thiếu hoặc sai secret", async () => {
    const req = new NextRequest("http://localhost/api/cron/expire-orders", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(expireStaleOrders).not.toHaveBeenCalled();
  });

  it("gọi expireStaleOrders khi secret đúng", async () => {
    const req = new NextRequest("http://localhost/api/cron/expire-orders", {
      method: "POST",
      headers: { "x-cron-secret": "test-cron-secret" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ cancelled: 3 });
    expect(expireStaleOrders).toHaveBeenCalledOnce();
  });
});
