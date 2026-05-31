const VIET_MAP: Record<string, string> = {
  à:'a',á:'a',ả:'a',ã:'a',ạ:'a',ă:'a',ắ:'a',ằ:'a',ẳ:'a',ẵ:'a',ặ:'a',
  â:'a',ấ:'a',ầ:'a',ẩ:'a',ẫ:'a',ậ:'a',
  è:'e',é:'e',ẻ:'e',ẽ:'e',ẹ:'e',ê:'e',ế:'e',ề:'e',ể:'e',ễ:'e',ệ:'e',
  ì:'i',í:'i',ỉ:'i',ĩ:'i',ị:'i',
  ò:'o',ó:'o',ỏ:'o',õ:'o',ọ:'o',ô:'o',ố:'o',ồ:'o',ổ:'o',ỗ:'o',ộ:'o',
  ơ:'o',ớ:'o',ờ:'o',ở:'o',ỡ:'o',ợ:'o',
  ù:'u',ú:'u',ủ:'u',ũ:'u',ụ:'u',ư:'u',ứ:'u',ừ:'u',ử:'u',ữ:'u',ự:'u',
  ỳ:'y',ý:'y',ỷ:'y',ỹ:'y',ỵ:'y',đ:'d',
};

export function slugifyFilename(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  const base = lastDot >= 0 ? filename.slice(0, lastDot) : filename;
  const ext = lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : "";
  const slug = base
    .toLowerCase()
    .split("").map((c) => VIET_MAP[c] ?? c).join("")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (slug || "file") + ext;
}

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

// BIN số của các ngân hàng VN (chuẩn NAPAS) — dùng cho deep link VietQR
const BANK_BIN_MAP: Record<string, string> = {
  VCB: "970436", VIETCOMBANK: "970436",
  TCB: "970407", TECHCOMBANK: "970407",
  MB:  "970422", MBBANK: "970422",
  ACB: "970416",
  BIDV: "970418",
  VTB: "970415", VIETINBANK: "970415",
  AGR: "970405", AGRIBANK: "970405",
  TPB: "970423", TPBANK: "970423",
  VPB: "970432", VPBANK: "970432",
  OCB: "970448",
  SHB: "970443",
  MSB: "970426",
  STB: "970403", SACOMBANK: "970403",
  HDB: "970437", HDBANK: "970437",
  EIB: "970431", EXIMBANK: "970431",
  BVB: "970438",
};

/**
 * Tạo deep link VietQR để mở thẳng app ngân hàng trên mobile
 * Chuẩn NAPAS: https://dl.vietqr.io/pay
 * ba phải dùng BIN số thay vì text code để app ngân hàng nhận diện đúng
 */
export function buildPaymentDeepLink(params: {
  bankCode: string;
  accountNumber: string;
  amount: number;
  description: string;
}): string {
  const { bankCode, accountNumber, amount, description } = params;
  const bin = BANK_BIN_MAP[bankCode.toUpperCase()] ?? bankCode;
  const qs = new URLSearchParams({
    ba: `${bin}-${accountNumber}`,
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
