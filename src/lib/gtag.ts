declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

type GtagParams = Record<string, string | number | boolean | undefined>;

export function fireEvent(eventName: string, params?: GtagParams) {
  try {
    if (typeof window === "undefined") return;
    // Push vào dataLayer — GTM (nếu có) và GA4 đều nhận được
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...(params ?? {}) });
    }
    // GA4 trực tiếp (khi không dùng GTM)
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params ?? {});
    }
  } catch {
    // không bao giờ làm gián đoạn UX
  }
}
