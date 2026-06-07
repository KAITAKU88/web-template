import { test, expect } from "@playwright/test";

test.describe("Trang public", () => {
  test("trang chủ load và hiển thị header", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Tìm kiếm template...")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Template chất lượng cao/i })).toBeVisible();
  });

  test("có thể mở trang sản phẩm từ grid", async ({ page }) => {
    await page.goto("/");
    const productLink = page.locator('a[href^="/products/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15_000 });
    await productLink.click();
    await expect(page).toHaveURL(/\/products\//);
    await expect(page.getByRole("link", { name: /Mua ngay/i }).first()).toBeVisible();
  });
});

test.describe("Admin auth", () => {
  test("chưa đăng nhập → redirect về login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole("button", { name: /Đăng nhập/i })).toBeVisible();
  });

  test("trang quên mật khẩu load được", async ({ page }) => {
    await page.goto("/admin/forgot-password");
    await expect(page.getByRole("heading", { name: /Quên mật khẩu/i })).toBeVisible();
  });
});

test.describe("Trang orders", () => {
  test("form tra cứu lịch sử hiển thị", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });
});
