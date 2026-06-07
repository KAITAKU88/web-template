/**
 * Smoke E2E — chạy bằng fetch khi Playwright browser không cài được (WSL/ubuntu 26).
 * Yêu cầu dev server: npm run dev (localhost:3000)
 */
import { beforeAll, describe, expect, it } from "vitest";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  const text = await res.text();
  return { status: res.status, headers: res.headers, text };
}

describe("Smoke E2E (HTTP)", () => {
  beforeAll(async () => {
    const deadline = Date.now() + 90_000;
    let lastError = "";
    while (Date.now() < deadline) {
      try {
        const res = await fetch(BASE, { signal: AbortSignal.timeout(30_000) });
        if (res.ok || res.status === 307) return;
        lastError = `status ${res.status}`;
      } catch (e) {
        lastError = String(e);
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error(`Không kết nối được ${BASE} sau 90s (${lastError}). Chạy "npm run dev" trước.`);
  }, 120_000);

  it("GET / trả HTML trang chủ", async () => {
    const { status, text } = await get("/");
    expect(status).toBe(200);
    expect(text).toContain("Template chất lượng cao");
    expect(text).toContain("Tìm kiếm template");
  });

  it("GET /admin redirect về login khi chưa auth", async () => {
    const { status, headers } = await get("/admin");
    expect([307, 308, 302]).toContain(status);
    const location = headers.get("location") ?? "";
    expect(location).toMatch(/login/);
  });

  it("GET /admin/login trả form đăng nhập", async () => {
    const { status, text } = await get("/admin/login");
    expect(status).toBe(200);
    expect(text).toMatch(/Đăng nhập|password|Mật khẩu/i);
  });

  it("GET /orders trả trang tra cứu", async () => {
    const { status, text } = await get("/orders");
    expect(status).toBe(200);
    expect(text).toMatch(/email|Email/i);
  });

  it("POST /api/cron/expire-orders từ chối khi thiếu secret", async () => {
    const res = await fetch(`${BASE}/api/cron/expire-orders`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /api/discounts/validate từ chối mã rỗng", async () => {
    const res = await fetch(`${BASE}/api/discounts/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "", amount: 100_000 }),
    });
    expect(res.status).toBe(400);
  });
});
