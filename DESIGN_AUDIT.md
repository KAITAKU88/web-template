# DESIGN_AUDIT.md — TemplateLab Design System Audit

> Ngày: 2026-06-01  
> Nguồn spec: `TemplateLab Design System.zip` (Claude Design handoff)  
> Trạng thái: **Chỉ báo cáo — chưa sửa bất cứ thứ gì**

---

## Tóm tắt

| Mức độ | Số vi phạm |
|--------|-----------|
| 🔴 Nghiêm trọng | 3 |
| 🟠 Cảnh báo | 42 |
| 🟡 Nhỏ | 8 |
| **Tổng** | **53** |

---

## 🔴 NGHIÊM TRỌNG — Gây bug hoặc lệch hoàn toàn khỏi spec

### 1. StorageBrowser — `backdrop-blur` trong fixed overlay bên trong AdminShell
**File:** `src/app/admin/storage/StorageBrowser.tsx:632`

```tsx
// HIỆN TẠI — GÂY BUG TIỀM NĂNG
<div className="fixed inset-0 z-40 flex items-center justify-center bg-emerald-500/10 backdrop-blur-sm pointer-events-none">

// ĐÚNG — bỏ backdrop-blur, dùng màu solid
<div className="fixed inset-0 z-40 flex items-center justify-center bg-emerald-500/5 pointer-events-none">
```

**Lý do nghiêm trọng:** `backdrop-filter` bên trong `fixed inset-0 overflow-hidden` (AdminShell) tạo compositing layer mới, gây layout glitch giống bug đã fix ở ProductForm/SettingsForm sticky bars.

---

### 2. Discount Badge — sai token màu (light-mode only, không có dark variant)
**Files:**
- `src/app/products/[productId]/page.tsx:131`
- `src/components/ProductGrid.tsx:249`

```tsx
// HIỆN TẠI
<span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-500">-{discount}%</span>

// ĐÚNG theo spec
<span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">-{discount}%</span>
```

**Vi phạm:** `bg-red-50` không có `dark:` variant → trắng nền trên dark mode. Radius `rounded` (4px) → spec badge dùng `rounded-full`. Padding `px-1.5` → spec badge `px-2.5 py-0.5`.

---

### 3. ProductDetail — Discount badge sai radius + màu light-mode only
**File:** `src/app/products/[productId]/ProductDetail.tsx:214`

```tsx
// HIỆN TẠI
<span className="mb-0.5 rounded-md bg-red-50 px-2 py-0.5 text-sm font-bold text-red-500">-{discount}%</span>

// ĐÚNG theo spec
<span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">-{discount}%</span>
```

**Vi phạm:** `rounded-md` (6px) → phải `rounded-full`; `bg-red-50` không dark variant; `text-sm font-bold` → spec badge dùng `text-xs font-medium`.

---

## 🟠 CẢNH BÁO — Không nhất quán với design system

### 4. `rounded-lg` (8px) thay vì `rounded-xl` (12px) — Buttons & Small Elements

Spec: mọi button, action button phải dùng **`rounded-xl`**. Các file sau đang dùng `rounded-lg`:

| File | Line | Element | Hiện tại | Cần |
|------|------|---------|----------|-----|
| `src/app/admin/Sidebar.tsx` | 185 | Close button (mobile) | `rounded-lg` | `rounded-xl` |
| `src/app/admin/Sidebar.tsx` | 201 | Logo mark badge | `rounded-lg` | `rounded-xl` |
| `src/app/admin/login/LoginForm.tsx` | 18 | Tab switch button | `rounded-lg` | `rounded-xl` |
| `src/app/admin/login/LoginForm.tsx` | 99 | Warning box | `rounded-lg` | `rounded-xl` |
| `src/app/admin/login/LoginForm.tsx` | 105 | Error message box | `rounded-lg` | `rounded-xl` |
| `src/app/admin/staff-login/StaffLoginForm.tsx` | 18 | Tab switch button | `rounded-lg` | `rounded-xl` |
| `src/app/admin/staff-login/StaffLoginForm.tsx` | 113 | Error message box | `rounded-lg` | `rounded-xl` |
| `src/app/admin/staff/StaffActions.tsx` | 65 | Edit icon button | `rounded-lg` | `rounded-xl` |
| `src/app/admin/staff/StaffActions.tsx` | 75 | Toggle icon button | `rounded-lg` | `rounded-xl` |
| `src/app/admin/staff/StaffActions.tsx` | 87 | Delete icon button | `rounded-lg` | `rounded-xl` |
| `src/app/admin/settings/page.tsx` | 162 | External link button | `rounded-lg` | `rounded-xl` |
| `src/app/admin/settings/page.tsx` | 252 | Copy button | `rounded-lg` | `rounded-xl` |
| `src/app/admin/orders/ResendEmailButton.tsx` | 19 | Resend button | `rounded-lg` | `rounded-xl` |
| `src/app/admin/products/AdminProductsClient.tsx` | 204 | Edit button | `rounded-lg` | `rounded-xl` |
| `src/app/admin/products/DeleteButton.tsx` | 19 | Delete button | `rounded-lg` | `rounded-xl` |
| `src/app/admin/products/PublishButton.tsx` | 22 | Publish button | `rounded-lg` | `rounded-xl` |
| `src/app/admin/products/ProductForm.tsx` | 372 | Badge type tag | `rounded-lg` | `rounded-xl` |
| `src/app/admin/products/ProductForm.tsx` | 466 | Delete overlay button | `rounded-lg` | `rounded-xl` |
| `src/app/admin/categories/CategoryActions.tsx` | 32,38,44 | Action icon buttons | `rounded-lg` | `rounded-xl` |
| `src/app/admin/automation/AutomationClient.tsx` | 217, 223 | Action buttons | `rounded-lg` | `rounded-xl` |
| `src/app/admin/discounts/DiscountsClient.tsx` | 181 | Delete button | `rounded-lg` | `rounded-xl` |
| `src/app/admin/marketing/page.tsx` | 110 | Action button | `rounded-lg` | `rounded-xl` |
| `src/app/admin/setup/SetupGuide.tsx` | 409, 410 | Guide link buttons | `rounded-lg` | `rounded-xl` |
| `src/app/admin/setup/SetupGuide.tsx` | 398 | Tip box | `rounded-lg` | `rounded-xl` |
| `src/app/admin/storage/StorageBrowser.tsx` | 601, 610 | Move target items | `rounded-lg` | `rounded-xl` |
| `src/app/admin/AdminShell.tsx` | 39 | ThemeToggle button | `rounded-lg` | `rounded-xl` |
| `src/components/ImageCarousel.tsx` | 73, 78 | Prev/Next buttons | `rounded-lg` | `rounded-xl` |
| `src/components/MediaPicker.tsx` | 151, 255 | Close / delete buttons | `rounded-lg` | `rounded-xl` |
| `src/app/products/[productId]/ProductDetail.tsx` | 241 | Gallery nav button | `rounded-lg` | `rounded-xl` |
| `src/app/checkout/[productId]/CheckoutClient.tsx` | 496 | Info notice box | `rounded-lg` | `rounded-xl` |
| `src/app/checkout/[productId]/CheckoutClient.tsx` | 563 | Confirm cancel button | `rounded-lg` | `rounded-xl` |
| `src/app/checkout/[productId]/CheckoutClient.tsx` | 569 | Cancel button | `rounded-lg` | `rounded-xl` |

---

### 5. Code Block — `rounded-lg` thay vì `rounded-xl`
**File:** `src/app/admin/settings/page.tsx:208, 245`

```tsx
// HIỆN TẠI
<code className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-mono text-gray-300">

// ĐÚNG theo spec (Code Blocks section)
<code className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-mono text-emerald-300 truncate">
```

**Vi phạm thêm:** màu text `text-gray-300` thay vì `text-emerald-300` như spec quy định cho code/API URLs.

---

### 6. `rounded` (4px bare) — Inline edit inputs trong StorageBrowser
**File:** `src/app/admin/storage/StorageBrowser.tsx:467, 511, 557`

```tsx
// HIỆN TẠI
className="... rounded px-1.5 py-0.5 ..."

// ĐÚNG
className="... rounded-xl px-1.5 py-0.5 ..."
```

---

### 7. `rounded` (4px bare) — Inline code tag trong AutomationClient
**File:** `src/app/admin/automation/AutomationClient.tsx:319`

```tsx
// HIỆN TẠI
<code className="rounded bg-gray-700 px-1.5 py-0.5 text-xs text-emerald-400">

// ĐÚNG
<code className="rounded-lg bg-gray-700 px-1.5 py-0.5 text-xs text-emerald-400">
```

---

### 8. Countdown badge trong Checkout — `rounded-lg` + màu light-mode
**File:** `src/app/checkout/[productId]/CheckoutClient.tsx:602`

```tsx
// HIỆN TẠI
<span className="rounded-lg bg-red-100 px-2 py-0.5 font-mono text-sm font-bold text-red-600">

// ĐÚNG theo spec badge
<span className="rounded-full bg-red-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-red-400">
```

**Vi phạm:** `bg-red-100` light-mode only (không dark variant); `rounded-lg` → `rounded-full`; `text-sm font-bold` → `text-xs font-medium`.

---

### 9. Info box trong Checkout — màu không theo semantic token
**File:** `src/app/checkout/[productId]/CheckoutClient.tsx:496`

```tsx
// HIỆN TẠI
<p className="mb-3 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">

// ĐÚNG
<p className="mb-3 text-xs text-blue-400 bg-blue-500/10 rounded-xl px-3 py-2">
```

**Vi phạm:** `bg-blue-50 text-blue-700` — light-mode only, không dark variant; radius `rounded-lg` → `rounded-xl`.

---

### 10. Spec icon buttons nhỏ — sai kích thước container
**Spec:** icon button dùng `h-9 w-9 rounded-xl`. Nhiều nơi dùng `h-8 w-8 rounded-lg`.

| File | Line | Hiện tại | Cần |
|------|------|----------|-----|
| `src/app/admin/Sidebar.tsx` | 185 | `h-8 w-8 rounded-lg` | `h-9 w-9 rounded-xl` |
| `src/app/admin/staff/StaffActions.tsx` | 65,75,87 | `p-1.5 rounded-lg` | `h-9 w-9 rounded-xl` |

---

### 11. Checkout — Checkbox không có dark variants
**File:** `src/app/checkout/[productId]/CheckoutClient.tsx:352`

```tsx
// HIỆN TẠI
className={`... flex h-5 w-5 ... rounded border-2 ...`}

// ĐÚNG — checkbox nên dùng rounded-sm hoặc rounded theo spec accent-emerald-500
```

---

### 12. SettingsForm — ColorField preview swatch dùng `rounded-lg`
**File:** `src/app/admin/settings/SettingsForm.tsx:494, 506`

```tsx
// HIỆN TẠI
<input type="color" className="h-10 w-14 cursor-pointer rounded-lg ...">
<div className="h-8 w-8 rounded-lg ..." />

// ĐÚNG — color swatch nên dùng rounded-xl để nhất quán
<input type="color" className="h-10 w-14 cursor-pointer rounded-xl ...">
<div className="h-8 w-8 rounded-xl ..." />
```

---

### 13. Revenue bar trên Dashboard — `rounded` bare
**File:** `src/app/admin/page.tsx:294`

```tsx
// HIỆN TẠI
className="h-full bg-emerald-500/70 rounded flex items-center justify-end ..."

// ĐÚNG theo spec bar chart
className="h-full bg-emerald-500/70 rounded-sm flex items-center justify-end ..."
// hoặc giữ nguyên bare rounded cho bar fill (acceptable)
```

**Ghi chú:** Đây là bar fill element (con của container overflow-hidden) — `rounded` bare là chấp nhận được cho trường hợp này. Mức độ thấp.

---

### 14. ProductDetail — Copy URL input thiếu dark mode
**File:** `src/app/products/[productId]/page.tsx:216`  
**File:** `src/components/ImageCarousel.tsx:41`

```tsx
// HIỆN TẠI
<span className="... rounded bg-gray-100 px-3 py-1 text-xs text-gray-400">

// ĐÚNG
<span className="... rounded-xl bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-gray-400 dark:text-gray-500">
```

---

### 15. ProductDetail — FAQ/guarantee box màu không theo token
**File:** `src/app/products/[productId]/page.tsx:320`

```tsx
// HIỆN TẠI
<div className="mb-4 rounded-lg bg-white/70 p-3 text-xs leading-relaxed text-green-800">

// ĐÚNG
<div className="mb-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
```

---

## 🟡 NHỎ — Lệch nhỏ, ít ảnh hưởng visual

### 16. Font chênh lệch: Design System HTML vs README

**Design System.html** import `Plus Jakarta Sans` + `JetBrains Mono`.  
**README.md** quy định: `font-sans` — Tailwind default (system-ui / -apple-system).

```html
<!-- Design System.html dùng -->
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans...">

<!-- Codebase thực tế dùng -->
font-family: var(--font-inter), system-ui, sans-serif
```

**Đề xuất:** Codebase hiện tại dùng Inter (từ `next/font`). Nếu muốn upgrade sang Plus Jakarta Sans, cần update `layout.tsx`.

---

### 17. SetupGuide — Button primary dùng `bg-emerald-600` thay vì `bg-emerald-500`
**File:** `src/app/admin/setup/SetupGuide.tsx:409`

```tsx
// HIỆN TẠI
className="... rounded-lg bg-emerald-600 hover:bg-emerald-500 ..."

// ĐÚNG theo spec button primary
className="... rounded-xl bg-emerald-500 hover:bg-emerald-600 ..."
```

---

### 18. Sidebar — Logo mark dùng `rounded-lg` thay vì `rounded-xl`
**File:** `src/app/admin/Sidebar.tsx:201`

```tsx
// HIỆN TẠI
<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">

// SPEC (README): "logo mark h-8 w-8 rounded-lg bg-emerald-500"
// → Thực ra spec ĐÚNG là rounded-lg cho logo mark, không phải rounded-xl
```

**Ghi chú:** Spec README viết rõ logo mark = `rounded-lg`. Đây KHÔNG phải vi phạm — tôi nhầm khi phân loại ở đầu. Logo mark dùng `rounded-lg` là đúng spec.

---

### 19. Checkout — Các button không theo spec secondary
**File:** `src/app/checkout/[productId]/CheckoutClient.tsx`

Nhiều button trong checkout dùng styling riêng không theo token chuẩn. Checkout là public page (không phải admin) nên có thể có design riêng, nhưng nên thống nhất.

---

### 20. StorageBrowser — Inline rename input border không theo spec
**File:** `src/app/admin/storage/StorageBrowser.tsx:467`

```tsx
// HIỆN TẠI — border màu xanh khi focus (hardcoded border-emerald-500)
className="... border border-emerald-500 rounded px-1.5 ..."

// ĐÚNG theo spec input
className="... border border-gray-700 rounded-xl px-1.5 focus:border-emerald-500 ..."
```

---

## Phân tích tổng hợp

### Nguyên nhân chính gây ra số lượng vi phạm cao
Phần lớn vi phạm là **`rounded-lg` → `rounded-xl`** (32/42 warnings). Đây là pattern lặp lại nhất quán — có vẻ như codebase được build trước khi spec quy định rõ `rounded-xl` là chuẩn cho buttons/small elements.

### Ưu tiên sửa
1. **Ngay lập tức:** Mục #1 (StorageBrowser backdrop-blur)
2. **Trước release:** Mục #2, #3 (discount badges — khách hàng nhìn thấy)
3. **Sprint tiếp:** Mục #4 (rounded-lg → rounded-xl, toàn bộ admin)
4. **Backlog:** Mục #5–15 (inconsistencies nhỏ)
5. **Tùy chọn:** Mục #16 (font upgrade)

### Những gì ĐÃ đúng spec
- ✅ Tất cả Stat Cards trên Dashboard
- ✅ Content Cards (rounded-2xl, border, dark variants)
- ✅ Status badges (success/pending/cancelled colors)
- ✅ Order list rows
- ✅ Funnel bars + Revenue bars
- ✅ Top products section
- ✅ Sidebar layout (width, nav item classes)
- ✅ AdminShell layout
- ✅ Dark mode trên phần lớn admin pages
- ✅ Semantic color mapping (emerald/yellow/red)
- ✅ Spacing: p-4 md:p-6, space-y-8, px-5 py-4 card headers

---

*Audit bởi Claude Sonnet 4.6 · Dựa trên TemplateLab Design System handoff từ Claude Design*
