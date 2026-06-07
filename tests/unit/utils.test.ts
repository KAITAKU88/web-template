import { describe, expect, it } from "vitest";
import {
  buildPaymentDeepLink,
  buildVietQRUrl,
  calcDiscountPercent,
  formatCount,
  formatCurrency,
  generateOrderId,
  productUrl,
  renderStars,
  slugify,
  slugifyFilename,
} from "@/lib/utils";

describe("slugify", () => {
  it("chuyển tiếng Việt có dấu thành slug", () => {
    expect(slugify("Notion Habit Tracker")).toBe("notion-habit-tracker");
    expect(slugify("Quản lý công việc")).toBe("quan-ly-cong-viec");
  });

  it("loại bỏ ký tự đặc biệt", () => {
    expect(slugify("  Hello --- World!! ")).toBe("hello-world");
  });
});

describe("slugifyFilename", () => {
  it("giữ extension và slugify phần tên", () => {
    expect(slugifyFilename("Ảnh Sản Phẩm.PNG")).toBe("anh-san-pham.png");
    expect(slugifyFilename("noext")).toBe("noext");
  });
});

describe("productUrl", () => {
  it("ưu tiên slug nếu có", () => {
    expect(productUrl({ id: "uuid-1", slug: "my-product" })).toBe("/products/my-product");
    expect(productUrl({ id: "uuid-1", slug: null })).toBe("/products/uuid-1");
  });
});

describe("generateOrderId", () => {
  it("bắt đầu bằng TML và có 8 ký tự hex", () => {
    const id = generateOrderId();
    expect(id).toMatch(/^TML[0-9A-F]{8}$/);
  });

  it("sinh id khác nhau", () => {
    expect(generateOrderId()).not.toBe(generateOrderId());
  });
});

describe("buildVietQRUrl", () => {
  it("tạo URL SePay đúng tham số", () => {
    const url = buildVietQRUrl({
      bankCode: "VCB",
      accountNumber: "1234567890",
      amount: 168000,
      description: "TML4A2F9B1C",
    });
    expect(url).toContain("qr.sepay.vn");
    expect(url).toContain("bank=VCB");
    expect(url).toContain("acc=1234567890");
    expect(url).toContain("amount=168000");
    expect(url).toContain("des=TML4A2F9B1C");
  });
});

describe("buildPaymentDeepLink", () => {
  it("map bank code sang BIN NAPAS", () => {
    const url = buildPaymentDeepLink({
      bankCode: "VCB",
      accountNumber: "1234567890",
      amount: 50000,
      description: "TMLTEST01",
    });
    expect(url).toContain("dl.vietqr.io");
    expect(url).toContain("ba=970436-1234567890");
  });
});

describe("formatCurrency", () => {
  it("format VND theo locale vi-VN", () => {
    expect(formatCurrency(168000)).toMatch(/168\.?000/);
  });
});

describe("calcDiscountPercent", () => {
  it("tính % làm tròn", () => {
    expect(calcDiscountPercent(168000, 268000)).toBe(37);
    expect(calcDiscountPercent(100000, 0)).toBe(0);
  });
});

describe("formatCount", () => {
  it("format số lớn thành k", () => {
    expect(formatCount(999)).toBe("999");
    expect(formatCount(1200)).toBe("1.2k");
  });
});

describe("renderStars", () => {
  it("render sao đầy và nửa sao", () => {
    expect(renderStars(4)).toBe("★★★★");
    expect(renderStars(4.6)).toBe("★★★★½");
  });
});
