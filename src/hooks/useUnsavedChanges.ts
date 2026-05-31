import { useEffect } from "react";

type DirtyWindow = Window & { __adminFormDirty?: boolean };

export function useUnsavedChanges(isDirty: boolean) {
  // Expose cho Sidebar biết có form chưa lưu
  useEffect(() => {
    (window as DirtyWindow).__adminFormDirty = isDirty;
    return () => { (window as DirtyWindow).__adminFormDirty = false; };
  }, [isDirty]);

  // Cảnh báo khi đóng/refresh tab
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}
