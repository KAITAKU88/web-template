"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, productUrl } from "@/lib/utils";
import type { Product, OrderStatus } from "@/types";
import type { BumpCompanion, BundleOffer } from "./page";
import Image from "next/image";
import Link from "next/link";
import { fireEvent } from "@/lib/gtag";

type CheckoutStep = "form" | "waiting" | "success" | "cancelled";

const COUNTDOWN_SEC = 3 * 60 + 30; // 3 phút 30 giây

interface Props {
  product: Product;
  companion: BumpCompanion | null;
  bundle: BundleOffer | null;
  siteName?: string;
}

export default function CheckoutClient({ product, companion, bundle, siteName = "TemplateLab" }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<CheckoutStep>("form");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phone, setPhone] = useState("");
  const [bumpChecked, setBumpChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [orderAmount, setOrderAmount] = useState(0);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [upsellCountdown, setUpsellCountdown] = useState(10 * 60);
  const [isBundleOrder, setIsBundleOrder] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState("");
  const [discountApplying, setDiscountApplying] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  // Đếm ngược 10 phút cho upsell banner — bắt đầu (lại) khi vào success step
  useEffect(() => {
    if (step !== "success") return;
    setUpsellCountdown(10 * 60); // reset mỗi lần vào success
    const t = setInterval(() => {
      setUpsellCountdown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailError =
    emailTouched && email && !emailRegex.test(email)
      ? "Email không đúng định dạng."
      : "";

  const [orderId, setOrderId] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [countdown, setCountdown] = useState(COUNTDOWN_SEC);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderIdRef = useRef(""); // ref để dùng an toàn trong closures / beforeunload
  const supabase = createClient();

  // Gọi API hủy đơn (fire-and-forget)
  const cancelOrder = (id: string) => {
    if (!id) return;
    fetch(`/api/orders/${id}`, { method: "PATCH" }).catch(() => {});
  };

  // Đếm ngược — khi hết giờ tự hủy đơn
  useEffect(() => {
    if (step !== "waiting") return;
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          cancelOrder(orderIdRef.current);
          setStep("cancelled");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [step]);

  // F5 / đóng tab → hủy đơn qua sendBeacon
  useEffect(() => {
    if (step !== "waiting") return;
    const handleUnload = () => {
      navigator.sendBeacon(`/api/orders/${orderIdRef.current}`);
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [step]);

  // Realtime: nhận cập nhật status từ Supabase
  useEffect(() => {
    if (!orderId || step !== "waiting") return;
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          const newStatus = payload.new.status as OrderStatus;
          if (newStatus === "success") {
            clearInterval(timerRef.current!);
            setStep("success");
            fireEvent("Purchase", { product_id: product.id, product_name: product.name, value: orderAmount, currency: "VND" });
          } else if (newStatus === "cancelled" || newStatus === "expired") {
            clearInterval(timerRef.current!);
            setStep("cancelled");
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, step, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    fireEvent("Click_Mua_Ngay", { product_id: product.id, product_name: product.name, price: product.price });
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          customer_email: email,
          customer_phone: phone || undefined,
          bump_product_id: bumpChecked && companion ? companion.id : undefined,
          discount_code: discountCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra. Vui lòng thử lại.");
        return;
      }
      orderIdRef.current = data.order_id;
      setOrderId(data.order_id);
      setQrUrl(data.qr_url);
      setOrderAmount(data.amount);
      setPaymentUrl(data.payment_url ?? "");
      setCountdown(COUNTDOWN_SEC);
      setStep("waiting");
      fireEvent("Generate_QR", { product_id: product.id, product_name: product.name, price: data.amount, order_id: data.order_id });
    } catch {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = () => {
    clearInterval(timerRef.current!);
    cancelOrder(orderIdRef.current);
    router.push(productUrl(product));
  };

  const handleBundleOrder = async () => {
    if (!bundle) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders/bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_ids: bundle.items.map((i) => i.id),
          customer_email: email,
          customer_phone: phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Có lỗi xảy ra."); return; }
      orderIdRef.current = data.order_id;
      setOrderId(data.order_id);
      setQrUrl(data.qr_url);
      setOrderAmount(data.amount);
      setPaymentUrl(data.payment_url ?? "");
      setCountdown(COUNTDOWN_SEC);
      setIsBundleOrder(true);
      setStep("waiting");
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    setDiscountApplying(true); setDiscountError("");
    const bumpPrice = bumpChecked && companion ? companion.bumpPrice : 0;
    const subtotal = product.price + bumpPrice;
    const res = await fetch("/api/discounts/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: discountInput, product_id: product.id, amount: subtotal }),
    });
    const data = await res.json();
    setDiscountApplying(false);
    if (!res.ok) { setDiscountError(data.error ?? "Mã không hợp lệ"); return; }
    setDiscountCode(data.code);
    setDiscountAmount(data.discount_amount);
  };

  const handleRemoveDiscount = () => {
    setDiscountCode(""); setDiscountInput(""); setDiscountAmount(0); setDiscountError("");
  };

  return (
    <div className="mx-auto max-w-lg">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-300">Trang chủ</Link>
        <span>/</span>
        <Link href={productUrl(product)} className="hover:text-gray-600 dark:hover:text-gray-300 truncate max-w-[140px]">
          {product.name}
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-700 dark:text-gray-200">Thanh toán</span>
      </div>

      {/* Product summary */}
      <div className="card mb-6 flex items-center gap-4 p-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/30 text-3xl">
          {product.type === "notion" ? "📓" : "📊"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 dark:text-white truncate">{product.name}</div>
          {product.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{product.description}</div>
          )}
        </div>
        <div className="text-lg font-bold text-brand flex-shrink-0">
          {formatCurrency(product.price)}
        </div>
      </div>

      {/* ── Step: Form ── */}
      {step === "form" && (
        <div className="card p-6">
          <h1 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">Nhập thông tin</h1>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Link template sẽ được gửi tự động đến email của bạn sau khi thanh toán.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email nhận template <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailTouched(true); }}
                onBlur={() => setEmailTouched(true)}
                placeholder="ban@example.com"
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${
                  emailError
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100 dark:border-red-500 dark:focus:ring-red-900/30"
                    : "border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-100 dark:focus:ring-green-900/20"
                }`}
              />
              {emailError && <p className="mt-1.5 text-xs text-red-500">{emailError}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/20"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                Không bắt buộc — cung cấp số điện thoại để được hỗ trợ nhanh hơn nếu có sự cố.
              </p>
            </div>

            {/* ── Mã giảm giá ── */}
            <div>
              {!discountCode ? (
                <div className="flex items-center gap-2">
                  <input
                    value={discountInput}
                    onChange={(e) => { setDiscountInput(e.target.value.toUpperCase()); setDiscountError(""); }}
                    placeholder="Mã giảm giá (nếu có)"
                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 px-4 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/20 uppercase"
                  />
                  <button type="button" onClick={handleApplyDiscount} disabled={discountApplying || !discountInput.trim()}
                    className="shrink-0 rounded-xl bg-gray-100 dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors">
                    {discountApplying ? "…" : "Áp dụng"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    <span className="font-mono font-bold text-green-700 dark:text-green-400">{discountCode}</span>
                    <span className="text-green-600 dark:text-green-400">— giảm {formatCurrency(discountAmount)}</span>
                  </div>
                  <button type="button" onClick={handleRemoveDiscount} className="text-xs text-gray-400 hover:text-red-500">Xóa</button>
                </div>
              )}
              {discountError && <p className="mt-1 text-xs text-red-500">{discountError}</p>}
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
            )}

            {/* ── Order Bump ── */}
            {companion && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setBumpChecked((v) => !v)}
                onKeyDown={(e) => e.key === " " && setBumpChecked((v) => !v)}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-4 transition select-none ${
                  bumpChecked
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                    : "border-amber-300 bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                      bumpChecked
                        ? "border-amber-500 bg-amber-500"
                        : "border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700"
                    }`}
                  >
                    {bumpChecked && <span className="text-xs font-bold text-white">✓</span>}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      Thêm vào đơn hàng:{" "}
                      <span className="italic">"{companion.name}"</span>
                    </p>
                    <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-200">
                      Chỉ{" "}
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(companion.bumpPrice)}
                      </span>{" "}
                      <span className="text-xs text-gray-400 line-through">
                        {formatCurrency(companion.originalPrice)}
                      </span>
                    </p>
                    <p className="mt-1 text-xs italic text-gray-400">
                      Ưu đãi này chỉ xuất hiện duy nhất tại trang thanh toán này.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!emailError}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang tạo đơn hàng...
                </>
              ) : bumpChecked && companion ? (
                <>Tạo mã QR — {formatCurrency(product.price + companion.bumpPrice)} →</>
              ) : (
                <>Tạo mã QR thanh toán →</>
              )}
            </button>

            <Link
              href={productUrl(product)}
              className="block text-center text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              ← Đổi ý, quay lại trang sản phẩm
            </Link>
          </form>
        </div>
      )}

      {/* ── Step: Waiting ── */}
      {step === "waiting" && (
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quét mã QR để thanh toán</h1>
            <span
              className={`font-mono text-lg font-bold tabular-nums ${
                countdown < 60 ? "text-red-500" : "text-gray-700 dark:text-gray-200"
              }`}
            >
              {formatTime(countdown)}
            </span>
          </div>

          <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            <strong>Nội dung chuyển khoản:</strong>{" "}
            <span className="font-mono font-bold">{orderId}</span>
            <span className="ml-2 text-xs text-amber-500 dark:text-amber-400">(bắt buộc, không thay đổi)</span>
          </div>

          <div className="mb-4 flex justify-center">
            {qrUrl ? (
              <div className="rounded-2xl border-4 border-green-100 dark:border-green-900 p-2 shadow-inner">
                <Image
                  src={qrUrl}
                  alt="VietQR thanh toán"
                  width={280}
                  height={280}
                  unoptimized
                  className="rounded-xl"
                />
              </div>
            ) : (
              <div className="h-64 w-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-700" />
            )}
          </div>

          {/* Nút lưu mã QR — chỉ hiện trên mobile khi QR đã load */}
          {isMobile && qrUrl && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch(qrUrl);
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `QR-${orderId}.png`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  window.open(qrUrl, "_blank");
                }
              }}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-brand bg-white dark:bg-gray-800 px-4 py-3 text-sm font-semibold text-brand shadow-sm transition hover:bg-brand-subtle active:scale-95"
            >
              <span>⬇️</span>
              Lưu mã QR về máy
            </button>
          )}

          {/* Nút mở app ngân hàng — chỉ hiện trên thiết bị di động */}
          {isMobile && paymentUrl && (
            <button
              onClick={() => setShowBankModal(true)}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-dim active:scale-95"
            >
              <span>🏦</span>
              Mở ứng dụng ngân hàng
            </button>
          )}

          {/* Modal chọn ngân hàng */}
          {showBankModal && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
              onClick={() => setShowBankModal(false)}
            >
              <div
                className="w-full max-w-lg rounded-t-2xl bg-white dark:bg-gray-800 p-5 pb-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Chọn ứng dụng ngân hàng</h3>
                  <button onClick={() => setShowBankModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">✕</button>
                </div>
                <p className="mb-3 text-xs text-blue-700 dark:text-blue-400 bg-blue-500/10 rounded-xl px-3 py-2">
                  💡 Lưu mã QR → Mở app → Quét mã QR → Chọn ảnh từ thư viện ảnh
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {([
                    { code: "vcb",  name: "Vietcombank", short: "VCB",  color: "#007B40" },
                    { code: "tcb",  name: "Techcombank",  short: "TCB",  color: "#E31837" },
                    { code: "mb",   name: "MB Bank",      short: "MB",   color: "#0066B3" },
                    { code: "acb",  name: "ACB",          short: "ACB",  color: "#005BAA" },
                    { code: "bidv", name: "BIDV",         short: "BIDV", color: "#1A4F9C" },
                    { code: "vtb",  name: "Vietinbank",   short: "VTB",  color: "#CC0000" },
                    { code: "agr",  name: "Agribank",     short: "AGR",  color: "#D30000" },
                    { code: "tpb",  name: "TPBank",       short: "TPB",  color: "#6B21A8" },
                    { code: "vpb",  name: "VPBank",       short: "VPB",  color: "#00AA44" },
                    { code: "ocb",  name: "OCB",          short: "OCB",  color: "#E65C00" },
                    { code: "shb",  name: "SHB",          short: "SHB",  color: "#B91C1C" },
                    { code: "msb",  name: "MSB",          short: "MSB",  color: "#0088CC" },
                    { code: "stb",  name: "Sacombank",    short: "STB",  color: "#003087" },
                    { code: "hdb",  name: "HDBank",       short: "HDB",  color: "#004B9B" },
                    { code: "eib",  name: "Eximbank",     short: "EIB",  color: "#003082" },
                    { code: "bvb",  name: "BaoViet",      short: "BVB",  color: "#008000" },
                  ] as const).map((bank) => (
                    <a
                      key={bank.code}
                      href={`${paymentUrl}&app=${bank.code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 dark:border-gray-700 p-2 text-center text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-[10px] font-bold text-white"
                        style={{ backgroundColor: bank.color }}
                      >
                        {bank.short}
                      </div>
                      <span className="leading-tight">{bank.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Số tiền: <strong className="text-gray-900 dark:text-white">{formatCurrency(orderAmount)}</strong></p>
            <p>Email nhận: <strong className="text-gray-900 dark:text-white">{email}</strong></p>
          </div>

          <div className="mt-5 rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 text-xs text-gray-400 space-y-1">
            <p>✅ Hệ thống tự động xác nhận ngay sau khi nhận được tiền</p>
            <p>✅ Link template được gửi qua email trong vòng vài phút</p>
            <p>⏳ Mã QR hết hạn sau {formatTime(countdown)}</p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Đang chờ xác nhận thanh toán...</span>
          </div>

          {/* Nút hủy */}
          <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-4">
            {confirmCancel ? (
              <div className="rounded-xl border border-orange-100 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/20 p-4 text-center">
                <p className="mb-3 text-sm text-gray-700 dark:text-gray-200">Bạn có chắc muốn hủy đơn hàng này?</p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={handleConfirmCancel}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                  >
                    Xác nhận hủy đơn
                  </button>
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Tiếp tục mua
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmCancel(true)}
                className="w-full py-1 text-center text-xs text-gray-300 dark:text-gray-500 transition hover:text-gray-500 dark:hover:text-gray-300"
              >
                Hủy đơn
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Step: Success ── */}
      {step === "success" && (
        <div className="space-y-4">
          {/* Header */}
          <div className="card p-6 text-center">
            <div className="mb-2 text-5xl">🎉</div>
            <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Thanh toán thành công!</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cảm ơn bạn đã tin tưởng {siteName}</p>
          </div>

          {/* Upsell banner với countdown — ẩn nếu đã mua bundle */}
          {bundle && upsellCountdown > 0 && !isBundleOrder && (
            <div className="rounded-2xl border-2 border-dashed border-orange-400 dark:border-orange-600 bg-gradient-to-b from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-orange-700 dark:text-orange-400">🎁 Quà tặng đặc biệt dành cho bạn</span>
                <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-red-700 dark:text-red-400">
                  ⏰ {formatTime(upsellCountdown)}
                </span>
              </div>

              <p className="mb-3 text-sm font-semibold leading-snug text-gray-800 dark:text-gray-100">
                Sở hữu toàn bộ hệ sinh thái quản lý cuộc sống toàn diện
                <span className="text-orange-600 dark:text-orange-400"> với giá giảm 50%</span>
              </p>

              <div className="mb-3 space-y-1.5 rounded-xl bg-white/60 dark:bg-gray-800/60 p-3">
                {bundle.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 dark:text-gray-300">📄 {item.name}</span>
                    <span className="font-medium text-gray-500 dark:text-gray-400">{formatCurrency(item.price)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-orange-200 dark:border-orange-800 pt-1.5 text-xs font-medium">
                  <span className="text-gray-600 dark:text-gray-300">Tổng giá lẻ</span>
                  <span className="text-gray-400 line-through">{formatCurrency(bundle.originalPrice)}</span>
                </div>
              </div>

              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">
                  {formatCurrency(bundle.salePrice)}
                </span>
                <span className="text-xs text-gray-400">
                  thay vì {formatCurrency(bundle.originalPrice)}
                </span>
              </div>

              <button
                onClick={handleBundleOrder}
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 py-3 text-center text-sm font-bold text-white transition hover:bg-orange-600 active:scale-95 disabled:opacity-60"
              >
                {loading ? "Đang tạo đơn hàng..." : "Sở hữu combo ngay →"}
              </button>
              <p className="mt-2 text-center text-xs italic text-orange-500/80 dark:text-orange-400/70">
                Ưu đãi chỉ dành riêng cho khách vừa mua — hết hạn sau {formatTime(upsellCountdown)}
              </p>
            </div>
          )}

          {/* Nút tải template — chỉ hiện khi không phải bundle và không phải combo */}
          {!isBundleOrder && !product.is_combo && product.template_link && (
            <a
              href={product.template_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex w-full items-center justify-center gap-2 text-base"
            >
              ⬇ Nhận template của bạn ngay
            </a>
          )}

          {/* Thông báo email */}
          <div className="rounded-xl bg-blue-500/10 px-4 py-3 text-sm">
            <p className="font-medium text-blue-700 dark:text-blue-400">📧 Email xác nhận đã được gửi</p>
            <p className="mt-0.5 text-blue-700 dark:text-blue-400">
              {isBundleOrder
                ? <>Toàn bộ template trong combo đang được gửi đến <strong>{email}</strong>.</>
                : <>Link tải đã gửi đến <strong>{email}</strong>.</>
              }{" "}
              Kiểm tra cả thư mục Spam nếu không thấy trong hộp thư đến.
            </p>
          </div>

          {/* Mã đơn + về trang chủ */}
          <div className="text-center">
            <p className="mb-3 text-xs text-gray-400">
              Mã đơn hàng: <span className="font-mono font-medium text-gray-600 dark:text-gray-400">{orderId}</span>
            </p>
            <Link href="/" className="btn-secondary">← Về trang chủ</Link>
          </div>
        </div>
      )}

      {/* ── Step: Cancelled ── */}
      {step === "cancelled" && (
        <div className="card p-8 text-center">
          <div className="mb-4 text-5xl">⏰</div>
          <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Đơn hàng đã bị hủy</h1>
          <p className="mb-6 text-gray-500 dark:text-gray-400">
            Mã QR thanh toán đã không còn hiệu lực.
          </p>
          <Link href={productUrl(product)} className="btn-primary">
            ← Quay lại trang sản phẩm
          </Link>
        </div>
      )}
    </div>
  );
}
