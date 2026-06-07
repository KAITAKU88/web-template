import { describe, expect, it } from "vitest";
import { calcDiscountAmount } from "@/lib/discount";

describe("calcDiscountAmount", () => {
  it("giảm theo % — làm tròn nghìn", () => {
    expect(calcDiscountAmount({ type: "percent", value: 10 }, 168_000)).toBe(17_000);
    expect(calcDiscountAmount({ type: "percent", value: 50 }, 100_000)).toBe(50_000);
  });

  it("không giảm quá số tiền đơn", () => {
    expect(calcDiscountAmount({ type: "percent", value: 100 }, 50_000)).toBe(50_000);
    expect(calcDiscountAmount({ type: "fixed", value: 200_000 }, 100_000)).toBe(100_000);
  });

  it("giảm cố định VND", () => {
    expect(calcDiscountAmount({ type: "fixed", value: 30_000 }, 168_000)).toBe(30_000);
  });

  it("đơn 0đ → không giảm", () => {
    expect(calcDiscountAmount({ type: "percent", value: 20 }, 0)).toBe(0);
  });
});
