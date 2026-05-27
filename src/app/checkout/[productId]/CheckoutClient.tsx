"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import type { Product, OrderStatus } from "@/types";
import Image from "next/image";
import Link from "next/link";

type CheckoutStep = "form" | "waiting" | "success" | "expired";

interface Props {
  product: Product;
}

export default function CheckoutClient({ product }: Props) {
  const [step, setStep] = useState<CheckoutStep>("form");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [countdown, setCountdown] = useState(15 * 60); // 15 phút
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supabase = createClient();

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

  // Realtime: lắng nghe thay đổi status của order
  useEffect(() => {
    if (!orderId || step !== "waiting") return;

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as OrderStatus;
          if (newStatus === "success") {
            clearInterval(timerRef.current!);
            setStep("success");
          } else if (newStatus === "expired") {
            clearInterval(timerRef.current!);
            setStep("expired");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, step, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, customer_email: email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra. Vui lòng thử lại.");
        return;
      }

      setOrderId(data.order_id);
      setQrUrl(data.qr_url);
      setCountdown(15 * 60);
      setStep("waiting");
    } catch {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="mx-auto max-w-lg">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">Trang chủ</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Thanh toán</span>
      </div>

      {/* Product summary */}
      <div className="card mb-6 flex items-center gap-4 p-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 text-3xl">
          {product.type === "notion" ? "📓" : "📊"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 truncate">{product.name}</div>
          {product.description && (
            <div className="text-sm text-gray-500 truncate">{product.description}</div>
          )}
        </div>
        <div className="text-lg font-bold text-green-600 flex-shrink-0">
          {formatCurrency(product.price)}
        </div>
      </div>

      {/* Step: Form */}
      {step === "form" && (
        <div className="card p-6">
          <h1 className="mb-1 text-xl font-bold text-gray-900">Nhập thông tin</h1>
          <p className="mb-6 text-sm text-gray-500">
            Link template sẽ được gửi tự động đến email của bạn sau khi thanh toán.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
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
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang tạo đơn hàng...
                </>
              ) : (
                <>Tạo mã QR thanh toán →</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Step: Waiting for payment */}
      {step === "waiting" && (
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Quét mã QR để thanh toán</h1>
            <span
              className={`text-lg font-mono font-bold tabular-nums ${
                countdown < 60 ? "text-red-500" : "text-gray-700"
              }`}
            >
              {formatTime(countdown)}
            </span>
          </div>

          <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <strong>Nội dung chuyển khoản:</strong>{" "}
            <span className="font-mono font-bold">{orderId}</span>
            <span className="ml-2 text-xs text-amber-500">(bắt buộc, không thay đổi)</span>
          </div>

          {/* QR Code */}
          <div className="mb-4 flex justify-center">
            {qrUrl ? (
              <div className="rounded-2xl border-4 border-green-100 p-2 shadow-inner">
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
              <div className="h-64 w-64 animate-pulse rounded-2xl bg-gray-100" />
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-500 text-center">
            <p>Số tiền: <strong className="text-gray-900">{formatCurrency(product.price)}</strong></p>
            <p>Email nhận: <strong className="text-gray-900">{email}</strong></p>
          </div>

          <div className="mt-5 rounded-xl bg-gray-50 p-4 text-xs text-gray-400 space-y-1">
            <p>✅ Hệ thống tự động xác nhận ngay sau khi nhận được tiền</p>
            <p>✅ Link template được gửi qua email trong vòng vài phút</p>
            <p>⏳ Mã QR hết hạn sau {formatTime(countdown)}</p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-sm text-gray-500">Đang chờ xác nhận thanh toán...</span>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === "success" && (
        <div className="card p-8 text-center">
          <div className="mb-4 text-6xl">🎉</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Thanh toán thành công!</h1>
          <p className="mb-6 text-gray-500">
            Template đang được gửi đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư
            (kể cả thư mục Spam) trong vài phút.
          </p>
          <div className="mb-6 rounded-xl bg-green-50 p-4 text-sm text-green-700">
            <p>Mã đơn hàng: <span className="font-mono font-bold">{orderId}</span></p>
          </div>
          <Link href="/" className="btn-secondary">
            ← Về trang chủ
          </Link>
        </div>
      )}

      {/* Step: Expired */}
      {step === "expired" && (
        <div className="card p-8 text-center">
          <div className="mb-4 text-5xl">⏰</div>
          <h1 className="mb-2 text-xl font-bold text-gray-900">Mã QR đã hết hạn</h1>
          <p className="mb-6 text-gray-500">
            Đơn hàng đã hết thời gian thanh toán. Bạn có thể tạo đơn mới.
          </p>
          <button
            onClick={() => {
              setStep("form");
              setOrderId("");
              setQrUrl("");
              setError("");
            }}
            className="btn-primary"
          >
            Tạo đơn hàng mới
          </button>
        </div>
      )}
    </div>
  );
}
