"use client";

import { useState, useEffect } from "react";

const CITIES = [
  "Hà Nội", "TP.HCM", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
  "Nha Trang", "Huế", "Biên Hoà", "Vũng Tàu", "Quy Nhơn",
  "Buôn Ma Thuột", "Thái Nguyên", "Vinh", "Bắc Ninh", "Đà Lạt",
];

type Msg =
  | { type: "purchase"; city: string; minutesAgo: number }
  | { type: "viewers"; count: number };

function randomMsg(): Msg {
  if (Math.random() < 0.6) {
    return {
      type: "purchase",
      city: CITIES[Math.floor(Math.random() * CITIES.length)],
      minutesAgo: Math.floor(Math.random() * 58) + 2, // 2–59 phút
    };
  }
  return {
    type: "viewers",
    count: Math.floor(Math.random() * 24) + 5, // 5–28 người
  };
}

// Popup đầu tiên: 5–8 giây; các popup tiếp theo: 30s–3 phút
const firstDelay = () => Math.random() * (8_000 - 5_000) + 5_000;
const nextDelay  = () => Math.random() * (180_000 - 30_000) + 30_000;

export default function SocialProofToast() {
  const [visible, setVisible]   = useState(false);
  const [entering, setEntering] = useState(false);
  const [msg, setMsg]           = useState<Msg | null>(null);

  useEffect(() => {
    let cancelled = false;
    let isFirst = true;

    function run() {
      const delay = isFirst ? firstDelay() : nextDelay();
      isFirst = false;

      setTimeout(() => {
        if (cancelled) return;

        setMsg(randomMsg());
        setVisible(true);

        // Trigger slide-in animation sau 1 frame
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (!cancelled) setEntering(true);
          })
        );

        // Tự ẩn sau 5 giây
        setTimeout(() => {
          if (cancelled) return;
          setEntering(false);
          setTimeout(() => {
            if (cancelled) return;
            setVisible(false);
            run(); // lên lịch popup tiếp theo
          }, 350);
        }, 5_000);
      }, delay);
    }

    run();
    return () => { cancelled = true; };
  }, []);

  function dismiss() {
    setEntering(false);
    setTimeout(() => setVisible(false), 350);
  }

  if (!visible || !msg) return null;

  return (
    <div
      className={`fixed bottom-6 left-4 z-50 max-w-[300px] transform transition-all duration-300 ease-out ${
        entering ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <span className="mt-0.5 text-xl">
          {msg.type === "purchase" ? "🛍️" : "👀"}
        </span>

        <div className="flex-1 min-w-0">
          {msg.type === "purchase" ? (
            <p className="text-sm text-gray-800 dark:text-white">
              Một bạn ở{" "}
              <span className="font-semibold">{msg.city}</span>{" "}
              đã mua template này{" "}
              <span className="font-semibold">{msg.minutesAgo} phút trước</span>
            </p>
          ) : (
            <p className="text-sm text-gray-800 dark:text-white">
              <span className="font-semibold">{msg.count} người</span>{" "}
              đang xem template này
            </p>
          )}
        </div>

        <button
          onClick={dismiss}
          aria-label="Đóng"
          className="mt-0.5 shrink-0 text-xs text-gray-300 transition hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
