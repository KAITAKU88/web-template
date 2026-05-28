/**
 * Tạo mã order ID ngắn, dễ đọc, dùng làm nội dung chuyển khoản.
 * Format: TML + 8 ký tự hex ngẫu nhiên (VD: TML4A2F9B1C)
 */
export function generateOrderId(): string {
  const random = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `TML${random}`;
}

/**
 * Tạo URL VietQR qua SePay
 * https://docs.sepay.vn/vietqr.html
 */
export function buildVietQRUrl(params: {
  bankCode: string;
  accountNumber: string;
  amount: number;
  description: string;
}): string {
  const { bankCode, accountNumber, amount, description } = params;
  const base = "https://qr.sepay.vn/img";
  const qs = new URLSearchParams({
    bank: bankCode,
    acc: accountNumber,
    template: "compact2",
    amount: String(amount),
    des: description,
  });
  return `${base}?${qs.toString()}`;
}

/**
 * Tạo deep link VietQR để mở thẳng app ngân hàng trên mobile
 * Chuẩn NAPAS: https://dl.vietqr.io/pay
 */
export function buildPaymentDeepLink(params: {
  bankCode: string;
  accountNumber: string;
  amount: number;
  description: string;
}): string {
  const { bankCode, accountNumber, amount, description } = params;
  const qs = new URLSearchParams({
    ba: `${bankCode}-${accountNumber}`,
    am: String(amount),
    tn: description,
  });
  return `https://dl.vietqr.io/pay?${qs.toString()}`;
}

/**
 * Format tiền VND
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/**
 * Tính % giảm giá
 */
export function calcDiscountPercent(price: number, originalPrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * Format số lượt tải (VD: 1200 → "1.2k")
 */
export function formatCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

/**
 * Render sao (VD: 4.8 → "★★★★★" với opacity)
 */
export function renderStars(rating: number): string {
  return "★".repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? "½" : "");
}
