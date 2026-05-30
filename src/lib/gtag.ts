declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

type GtagParams = Record<string, string | number | boolean | undefined>;

export function fireEvent(eventName: string, params?: GtagParams) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", eventName, params ?? {});
    }
  } catch {
    // không bao giờ làm gián đoạn UX
  }
}
