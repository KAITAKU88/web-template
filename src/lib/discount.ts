export type DiscountType = "percent" | "fixed";

export interface DiscountInput {
  type: DiscountType | string;
  value: number;
}

/** Tính số tiền giảm — logic dùng chung cho API validate và orders. */
export function calcDiscountAmount(discount: DiscountInput, orderAmount: number): number {
  if (orderAmount <= 0) return 0;
  if (discount.type === "percent") {
    return Math.min(Math.round(orderAmount * (discount.value / 100) / 1000) * 1000, orderAmount);
  }
  return Math.min(discount.value, orderAmount);
}
