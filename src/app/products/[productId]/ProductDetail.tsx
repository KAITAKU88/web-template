"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, calcDiscountPercent, formatCount } from "@/lib/utils";
import type { Product, OrderStatus } from "@/types";
import Image from "next/image";
import Link from "next/link";

const TYPE_LABEL: Record<string, string> = { notion: "Notion", google_sheet: "Google Sheets" };
const TYPE_ICON: Record<string, string>  = { notion: "📓", google_sheet: "📊" };

type BuyStep = "idle" | "loading" | "waiting" | "success" | "expired";

function validateEmail(email: string) {
  if (!email) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email không hợp lệ";
  return "ok";
}

export default function ProductDetail({ product }: { product: Product }) {
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [emailStatus, setEmailStatus] = useState<"" | "ok" | string>("");
  const [step, setStep]         = useState<BuyStep>("idle");
  const [error, setError]       = useState("");
  const [orderId, setOrderId]   = useState("");
  const [qrUrl, setQrUrl]       = useState("");
  const [countdown, setCountdown] = useState(15 * 60);
  const [showFloating, setShowFloating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const formRef   = useRef<HTMLDivElement>(null);
  const qrRef     = useRef<HTMLDivElement>(null);
  const supabase  = createClient();

  const discount = product.original_price && product.original_price > product.price
    ? calcDiscountPercent(product.price, product.original_price) : null;

  // Email validate khi gõ
  useEffect(() => {
    if (!email) { setEmailStatus(""); return; }
    const t = setTimeout(() => setEmailStatus(validateEmail(email)), 400);
    return () => clearTimeout(t);
  }, [email]);

  // Floating CTA: hiện khi scroll qua form
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowFloating(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (formRef.current) observer.observe(formRef.current);
    return () => observer.disconnect();
  }, []);

  // Đếm ngược
  useEffect(() => {
    if (step !== "waiting") return;
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); setStep("expired"); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [step]);

  // Scroll xuống QR
  useEffect(() => {
    if (step === "waiting") {
      setTimeout(() => qrRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
  }, [step]);

  // Realtime
  useEffect(() => {
    if (!orderId || step !== "waiting") return;
    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          const s = payload.new.status as OrderStatus;
          if (s === "success") { clearInterval(timerRef.current!); setStep("success"); }
          else if (s === "expired") { clearInterval(timerRef.current!); setStep("expired"); }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, step, supabase]);

  // Lấy hoặc tạo session ID ẩn danh (dùng cho analytics)
  const getSessionId = () => {
    try {
      let sid = localStorage.getItem("_tl_sid");
      if (!sid) { sid = crypto.randomUUID(); localStorage.setItem("_tl_sid", sid); }
      return sid;
    } catch { return "unknown"; }
  };

  const trackEvent = (eventType: string) => {
    try {
      supabase.from("click_events").insert({
        event_type: eventType,
        product_id: product.id,
        session_id: getSessionId(),
        referrer: document.referrer || null,
        user_agent: navigator.userAgent || null,
      }).then(() => {}); // fire-and-forget
    } catch { /* không ảnh hưởng UX */ }
  };

  const handleBuy = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (emailStatus !== "ok") return;
    trackEvent("buy_click");
    setStep("loading"); setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, customer_email: email, customer_phone: phone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Có lỗi xảy ra."); setStep("idle"); return; }
      setOrderId(data.order_id); setQrUrl(data.qr_url);
      setCountdown(15 * 60); setStep("waiting");
    } catch { setError("Không thể kết nối máy chủ."); setStep("idle"); }
  };

  const scrollToForm = () => {
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };
  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const isBuying = step === "idle" || step === "loading";

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">Trang chủ</Link>
        <span>/</span>
        <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{product.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Cột trái — ảnh + trust */}
        <div>
          <div className="card overflow-hidden dark:bg-gray-800">
            <div className="relative flex h-72 items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900">
              {product.image_url
                ? <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                : <span className="text-8xl">{product.type ? TYPE_ICON[product.type] ?? "📄" : "📄"}</span>
              }
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-gray-500">
            {[["⚡", "Nhận tức thì", "Giao tự động qua email"], ["🔒", "An toàn", "QR VietQR ngân hàng"], ["♾️", "Vĩnh viễn", "Dùng không giới hạn"]].map(([icon, title, desc]) => (
              <div key={title} className="card p-3 dark:bg-gray-800">
                <div className="text-lg mb-1">{icon}</div>
                <div className="font-medium text-gray-700 dark:text-gray-200">{title}</div>
                <div className="dark:text-gray-400">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cột phải — thông tin + form mua */}
        <div className="flex flex-col gap-4">
          {product.type && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {TYPE_ICON[product.type]} {TYPE_LABEL[product.type]}
            </span>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-snug">{product.name}</h1>

          {(product.rating > 0 || product.download_count > 0) && (
            <div className="flex items-center gap-4 text-sm">
              {product.rating > 0 && (
                <span className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className={s <= Math.round(product.rating) ? "text-amber-400" : "text-gray-200"}>★</span>
                  ))}
                  <span className="ml-1 font-semibold text-gray-700 dark:text-gray-200">{product.rating.toFixed(1)}</span>
                  {product.rating_count > 0 && <span className="text-gray-400">({formatCount(product.rating_count)})</span>}
                </span>
              )}
              {product.download_count > 0 && <span className="text-gray-500 dark:text-gray-400">⬇ {formatCount(product.download_count)} lượt tải</span>}
            </div>
          )}

          {product.description && <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>}

          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-green-600">{formatCurrency(product.price)}</span>
            {discount && product.original_price && (
              <>
                <span className="text-base text-gray-400 line-through mb-0.5">{formatCurrency(product.original_price)}</span>
                <span className="mb-0.5 rounded-md bg-red-50 px-2 py-0.5 text-sm font-bold text-red-500">-{discount}%</span>
              </>
            )}
          </div>

          {/* Form mua */}
          <div ref={formRef}>
            {isBuying && !showForm && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="btn-primary w-full"
              >
                🛒 Mua ngay — {formatCurrency(product.price)}
              </button>
            )}

            {isBuying && showForm && (
              <form onSubmit={handleBuy} className="card p-5 flex flex-col gap-3 dark:bg-gray-800">
                <div className="flex items-center justify-between -mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Thông tin đặt hàng</span>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setError(""); }}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 transition"
                    aria-label="Đóng"
                  >
                    ✕
                  </button>
                </div>
                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email nhận template <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ban@example.com"
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition pr-9 dark:bg-gray-700 dark:text-white ${
                        emailStatus === "ok" ? "border-green-400 focus:ring-green-100" :
                        emailStatus ? "border-red-400 focus:ring-red-100" :
                        "border-gray-200 focus:border-green-500 focus:ring-green-100 dark:border-gray-600"
                      } focus:ring-2`}
                    />
                    {emailStatus === "ok" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>}
                    {emailStatus && emailStatus !== "ok" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">✕</span>}
                  </div>
                  {emailStatus && emailStatus !== "ok" && (
                    <p className="mt-1 text-xs text-red-500">{emailStatus}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Số điện thoại
                    <span className="ml-1.5 text-xs font-normal text-gray-400">(không bắt buộc — để được hỗ trợ nhanh hơn)</span>
                  </label>
                  <input
                    type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xxxxxxxx"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {error && <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

                <button
                  type="submit"
                  disabled={step === "loading" || emailStatus !== "ok"}
                  className="btn-primary w-full"
                >
                  {step === "loading"
                    ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Đang tạo đơn...</>
                    : "🛒 Mua ngay"}
                </button>
                <p className="text-center text-xs text-gray-400">Link template gửi tự động qua email sau khi thanh toán</p>
              </form>
            )}

            {step === "success" && (
              <div className="card p-6 text-center border-2 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <div className="text-4xl mb-3">🎉</div>
                <h2 className="font-bold text-gray-900 dark:text-white mb-1">Thanh toán thành công!</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Template đang gửi đến <strong>{email}</strong>. Kiểm tra hộp thư (kể cả Spam).
                </p>
                <span className="text-xs text-gray-400">Mã đơn: <span className="font-mono">{orderId}</span></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR thanh toán */}
      {step === "waiting" && (
        <div ref={qrRef} className="mt-10 card p-6 max-w-sm mx-auto text-center dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white">Quét QR để thanh toán</h2>
            <span className={`font-mono font-bold tabular-nums text-lg ${countdown < 60 ? "text-red-500" : "text-gray-700 dark:text-gray-200"}`}>
              {formatTime(countdown)}
            </span>
          </div>
          <div className="mb-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700 text-left dark:bg-amber-900/20 dark:text-amber-300">
            <strong>Nội dung CK:</strong> <span className="font-mono font-bold">{orderId}</span>
            <span className="ml-1 text-xs text-amber-400">(bắt buộc)</span>
          </div>
          {qrUrl
            ? <div className="flex justify-center mb-4"><div className="rounded-2xl border-4 border-green-100 p-2"><Image src={qrUrl} alt="VietQR" width={240} height={240} unoptimized className="rounded-xl" /></div></div>
            : <div className="h-60 w-60 mx-auto mb-4 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-700" />
          }
          <p className="text-sm text-gray-500 mb-1">Số tiền: <strong className="text-gray-900 dark:text-white">{formatCurrency(product.price)}</strong></p>
          <p className="text-sm text-gray-500 mb-4">Gửi về: <strong className="text-gray-900 dark:text-white">{email}</strong></p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            Đang chờ xác nhận thanh toán...
          </div>
          <button onClick={() => { clearInterval(timerRef.current!); setStep("idle"); setOrderId(""); setQrUrl(""); }}
            className="mt-4 text-xs text-gray-400 underline hover:text-gray-600">
            Huỷ, nhập lại
          </button>
        </div>
      )}

      {step === "expired" && (
        <div className="mt-10 card p-6 max-w-sm mx-auto text-center dark:bg-gray-800">
          <div className="text-4xl mb-3">⏰</div>
          <h2 className="font-bold text-gray-900 dark:text-white mb-2">Mã QR đã hết hạn</h2>
          <button onClick={() => { setStep("idle"); setOrderId(""); setQrUrl(""); setError(""); }} className="btn-primary">
            Tạo mã QR mới
          </button>
        </div>
      )}

      {/* Floating CTA — hiện khi scroll qua form */}
      {showFloating && step !== "waiting" && step !== "success" && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-bounce">
          <button
            onClick={scrollToForm}
            className="flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-2xl ring-4 ring-green-200 transition hover:bg-green-700 active:scale-95"
          >
            🛒 Mua ngay — {formatCurrency(product.price)}
          </button>
        </div>
      )}
    </div>
  );
}
