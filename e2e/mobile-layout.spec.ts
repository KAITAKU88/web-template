import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test.describe("Checkout mobile layout", () => {
  test("nút Áp dụng không bị tràn khỏi viewport", async ({ page }) => {
    await page.goto("/");
    const productLink = page.locator('a[href^="/products/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15_000 });
    const href = await productLink.getAttribute("href");
    expect(href).toBeTruthy();

    // Vào checkout từ sản phẩm đầu tiên
    await page.goto(href!.replace("/products/", "/checkout/"));
    await expect(page.getByPlaceholder("Mã giảm giá (nếu có)")).toBeVisible({ timeout: 15_000 });

    const applyBtn = page.getByRole("button", { name: "Áp dụng" });
    await expect(applyBtn).toBeVisible();

    const box = await applyBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390 + 1);
    expect(box!.x).toBeGreaterThanOrEqual(-1);
  });

  test("nút Mua ngay trên landing không bị tràn viewport", async ({ page }) => {
    await page.goto("/");
    const productLink = page.locator('a[href^="/products/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15_000 });
    await productLink.click();

    const buyBtn = page.getByRole("link", { name: /Mua ngay/i }).first();
    await expect(buyBtn).toBeVisible();

    const box = await buyBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390 + 1);
  });
});
