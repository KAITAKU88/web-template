"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, calcDiscountPercent, formatCount } from "@/lib/utils";
import type { Product, OrderStatus } from "@/types";
import Image from "next/image";
import Link from "next/link";

const TYPE_LABEL: Record<string, string> = {
  notion: "Notion",
  google_sheet: "Google Sheets",
};
const TYPE_ICON: Record<string, string> = {
  notion: "📓",
  google_sheet: "📊",
};

type BuyStep = "idle" | "loading" | "waiting" | "success" | "expired";

export default function ProductDetail({ product }: { product: Product }) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<BuyStep>("idle");
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [countdown, setCountdown] = useState(15 * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const discount =
    product.original_price && product.original_price > product.price
      ? calcDiscountPercent(product.price, product.original_price)
      : null;

  // Đếm ngược
  useEffect(() => {
    if (step !== "waiting") return;
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          setStep("expired");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [step]);

  // Scroll xuống QR khi hiện ra
  useEffect(() => {
    if (step === "waiting") {
      setTimeout(() => qrRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [step]);

  // Realtime lắng nghe order
  useEffect(() => {
    if (!orderId || step !== "waiting") return;
    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        const status = payload.new.status as OrderStatus;
        if (status === "success") { clearInterval(timerRef.current!); setStep("success"); }
        else if (status === "expired") { clearInterval(timerRef.current!); setStep("expired"); }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, step, supabase]);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("loading");
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, customer_email: email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Có lỗi xảy ra."); setStep("idle"); return; }
      setOrderId(data.order_id);
      setQrUrl(data.qr_url);
      setCountdown(15 * 60);
      setStep("waiting");
    } catch {
      setError("Không thể kết nối máy chủ."); setStep("idle");
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">Trang chủ</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate">{product.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Cột trái — ảnh */}
        <div>
          <div className="card overflow-hidden">
            <div className="relative flex h-72 items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
              {product.image_url ? (
                <Image src={product.image_url} alt={product.name} fill className="object-cover" />
              ) : (
                <span className="text-8xl">
                  {product.type ? TYPE_ICON[product.type] ?? "📄" : "📄"}
                </span>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-gray-500">
            <div className="card p-3">
              <div className="text-lg mb-1">⚡</div>
              <div className="font-medium text-gray-700">Nhận tức thì</div>
              <div>Giao tự động qua email</div>
            </div>
            <div className="card p-3">
              <div className="text-lg mb-1">🔒</div>
              <div className="font-medium text-gray-700">An toàn</div>
              <div>QR VietQR ngân hàng</div>
            </div>
            <div className="card p-3">
              <div className="text-lg mb-1">♾️</div>
              <div className="font-medium text-gray-700">Vĩnh viễn</div>
              <div>Dùng không giới hạn</div>
            </div>
          </div>
        </div>

        {/* Cột phải — thông tin + mua */}
        <div className="flex flex-col gap-5">
          {/* Type badge */}
          {product.type && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
              {TYPE_ICON[product.type]} {TYPE_LABEL[product.type]}
            </span>
          )}

          <h1 className="text-2xl font-bold text-gray-900 leading-snug">{product.name}</h1>

          {/* Rating + lượt tải */}
          {(product.rating > 0 || product.download_count > 0) && (
            <div className="flex items-center gap-4 text-sm">
              {product.rating > 0 && (
                <span className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className={s <= Math.round(product.rating) ? "text-amber-400" : "text-gray-200"}>★</span>
                  ))}
                  <span className="ml-1 font-semibold text-gray-700">{product.rating.toFixed(1)}</span>
                  {product.rating_count > 0 && (
                    <span className="text-gray-400">({formatCount(product.rating_count)} đánh giá)</span>
                  )}
                </span>
              )}
              {product.download_count > 0 && (
                <span className="text-gray-500">⬇ {formatCount(product.download_count)} lượt tải</span>
              )}
            </div>
          )}

          {product.description && (
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {/* Giá */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-green-600">{formatCurrency(product.price)}</span>
            {discount && product.original_price && (
              <>
                <span className="text-base text-gray-400 line-through mb-0.5">{formatCurrency(product.original_price)}</span>
                <span className="mb-0.5 rounded-md bg-red-50 px-2 py-0.5 text-sm font-bold text-red-500">-{discount}%</span>
              </>
            )}
          </div>

          {/* Form mua — chỉ hiển thị khi chưa mua */}
          {(step === "idle" || step === "loading") && (
            <form onSubmit={handleBuy} className="card p-5 flex flex-col gap-3">
              <label className="text-sm font-medium text-gray-700">
                Email nhận template
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@example.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
              )}
              <button type="submit" disabled={step === "loading"} className="btn-primary w-full">
                {step === "loading" ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Đang tạo đơn...</>
                ) : "🛒 Mua ngay"}
              </button>
              <p className="text-center text-xs text-gray-400">
                Link template sẽ được gửi tự động đến email sau khi thanh toán
              </p>
            </form>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="card p-6 text-center border-2 border-green-200 bg-green-50">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="font-bold text-gray-900 mb-1">Thanh toán thành công!</h2>
              <p className="text-sm text-gray-600 mb-3">
                Template đang được gửi đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư (kể cả Spam).
              </p>
              <span className="text-xs text-gray-400">Mã đơn: <span className="font-mono">{orderId}</span></span>
            </div>
          )}
        </div>
      </div>

      {/* QR thanh toán — hiện ra bên dưới sau khi submit */}
      {step === "waiting" && (
        <div ref={qrRef} className="mt-10 card p-6 max-w-sm mx-auto text-center">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Quét mã QR để thanh toán</h2>
            <span className={`font-mono font-bold tabular-nums text-lg ${countdown < 60 ? "text-red-500" : "text-gray-700"}`}>
              {formatTime(countdown)}
            </span>
          </div>

          <div className="mb-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700 text-left">
            <strong>Nội dung CK:</strong>{" "}
            <span className="font-mono font-bold">{orderId}</span>
            <span className="ml-1 text-xs text-amber-400">(bắt buộc)</span>
          </div>

          {qrUrl ? (
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl border-4 border-green-100 p-2">
                <Image src={qrUrl} alt="VietQR" width={240} height={240} unoptimized className="rounded-xl" />
              </div>
            </div>
          ) : (
            <div className="h-60 w-60 mx-auto mb-4 animate-pulse rounded-2xl bg-gray-100" />
          )}

          <p className="text-sm text-gray-500 mb-1">
            Số tiền: <strong className="text-gray-900">{formatCurrency(product.price)}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Gửi về: <strong className="text-gray-900">{email}</strong>
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            Đang chờ xác nhận thanh toán...
          </div>

          {step === "waiting" && (
            <button
              onClick={() => { clearInterval(timerRef.current!); setStep("idle"); setOrderId(""); setQrUrl(""); }}
              className="mt-4 text-xs text-gray-400 underline hover:text-gray-600"
            >
              Huỷ, nhập lại email
            </button>
          )}
        </div>
      )}

      {/* Expired */}
      {step === "expired" && (
        <div className="mt-10 card p-6 max-w-sm mx-auto text-center">
          <div className="text-4xl mb-3">⏰</div>
          <h2 className="font-bold text-gray-900 mb-2">Mã QR đã hết hạn</h2>
          <button
            onClick={() => { setStep("idle"); setOrderId(""); setQrUrl(""); setError(""); }}
            className="btn-primary"
          >
            Tạo mã QR mới
          </button>
        </div>
      )}
    </div>
  );
}
