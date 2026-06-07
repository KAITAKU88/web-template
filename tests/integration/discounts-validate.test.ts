import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSingle,
        }),
      }),
    }),
  }),
}));

import { POST } from "@/app/api/discounts/validate/route";

describe("POST /api/discounts/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("400 khi thiếu mã", async () => {
    const req = new NextRequest("http://localhost/api/discounts/validate", {
      method: "POST",
      body: JSON.stringify({ code: "", amount: 100_000 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("404 khi mã không tồn tại", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "not found" } });
    const req = new NextRequest("http://localhost/api/discounts/validate", {
      method: "POST",
      body: JSON.stringify({ code: "INVALID", amount: 100_000 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("trả discount_amount cho mã % hợp lệ", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: "dc-1",
        code: "SALE10",
        type: "percent",
        value: 10,
        product_id: null,
        min_amount: 0,
        max_uses: null,
        used_count: 0,
        expires_at: null,
        is_active: true,
      },
      error: null,
    });
    const req = new NextRequest("http://localhost/api/discounts/validate", {
      method: "POST",
      body: JSON.stringify({ code: "sale10", amount: 168_000 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.code).toBe("SALE10");
    expect(body.discount_amount).toBe(17_000);
    expect(body.final_amount).toBe(151_000);
  });

  it("400 khi đơn dưới min_amount", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: "dc-2",
        code: "MIN100",
        type: "fixed",
        value: 10_000,
        product_id: null,
        min_amount: 200_000,
        max_uses: null,
        used_count: 0,
        expires_at: null,
        is_active: true,
      },
      error: null,
    });
    const req = new NextRequest("http://localhost/api/discounts/validate", {
      method: "POST",
      body: JSON.stringify({ code: "MIN100", amount: 100_000 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
