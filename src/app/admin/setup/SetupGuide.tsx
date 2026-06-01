"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StepLink {
  label: string;
  href: string;
  variant?: "primary" | "secondary"; // primary = link den Settings field
}

interface Step {
  id: string;
  title: string;
  desc: string;
  links?: StepLink[];
  tips?: string;
}

interface Phase {
  id: string;
  label: string;
  color: string;
  steps: Step[];
}

const PHASES: Phase[] = [
  {
    id: "supabase",
    label: "Bước 1 — Supabase (Database)",
    color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    steps: [
      {
        id: "sb-project",
        title: "Tạo Supabase Project",
        desc: "Supabase là nơi lưu toàn bộ dữ liệu: sản phẩm, đơn hàng, khách hàng, cấu hình.\n\nĐăng nhập supabase.com → New project → đặt tên, chọn region Singapore (ap-southeast-1), đặt mật khẩu DB mạnh. Chờ ~2 phút để project khởi tạo xong.",
        links: [{ label: "Mở Supabase Dashboard", href: "https://supabase.com/dashboard/projects" }],
        tips: "Chọn region Singapore (ap-southeast-1) để tốc độ tốt nhất từ Việt Nam.",
      },
      {
        id: "sb-migration",
        title: "Chạy SQL Migration (tạo cấu trúc database)",
        desc: "SQL Migration tạo toàn bộ bảng dữ liệu và cấu hình ban đầu.\n\nTrong Supabase project: SQL Editor → New query → copy toàn bộ nội dung file supabase/deploy-via-dashboard.sql → paste vào editor → nhấn Run (Ctrl+Enter).\n\nKiểm tra Tables bên trái: phải thấy products, orders, customers, settings, click_events, staff, download_tokens...",
        links: [{ label: "Mở Supabase SQL Editor", href: "https://supabase.com/dashboard/projects" }],
        tips: "Nếu chạy lần 2 bị lỗi 'already exists' là bình thường — dữ liệu cũ không bị xóa.",
      },
      {
        id: "sb-keys",
        title: "Copy 3 API Keys từ Supabase",
        desc: "Supabase → Settings → API → Project API keys. Copy 3 giá trị này để dán vào Cloudflare ở bước tiếp theo:\n\n  NEXT_PUBLIC_SUPABASE_URL  →  Project URL (dạng https://xxxx.supabase.co)\n  NEXT_PUBLIC_SUPABASE_ANON_KEY  →  anon/public key\n  SUPABASE_SERVICE_ROLE_KEY  →  service_role key",
        links: [{ label: "Mở Supabase API Settings", href: "https://supabase.com/dashboard/projects" }],
        tips: "service_role key có quyền bypass mọi bảo mật — chỉ dùng ở server, không bao giờ để lộ ra client hay commit vào git.",
      },
    ],
  },
  {
    id: "cloudflare",
    label: "Bước 2 — Cloudflare Workers (Deploy)",
    color: "bg-orange-500/15 text-orange-300 border-orange-500/20",
    steps: [
      {
        id: "cf-connect",
        title: "Deploy lên Cloudflare Workers",
        desc: "Cloudflare là nơi host toàn bộ ứng dụng — miễn phí 100.000 requests/ngày.\n\nCách 1 (khuyến nghị): Clone repo về máy → chạy:\n  npm install\n  npm run pages:build\n  npx wrangler deploy\n\nCách 2 (qua GitHub): Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → chọn repo.\n  Build command: npx @opennextjs/cloudflare build\n  Node.js: 22",
        links: [{ label: "Cloudflare Dashboard", href: "https://dash.cloudflare.com/" }],
        tips: "Deploy lần đầu sẽ thất bại nếu chưa có env vars — điền xong bước tiếp theo rồi redeploy.",
      },
      {
        id: "cf-env",
        title: "Set Environment Variables trên Cloudflare (bắt buộc)",
        desc: "Cloudflare Dashboard → Workers & Pages → chọn project → Settings → Environment variables → Add variable.\n\nBắt buộc (nhớ chọn Encrypt):\n  NEXT_PUBLIC_SUPABASE_URL  ← lấy từ Supabase bước 1\n  NEXT_PUBLIC_SUPABASE_ANON_KEY  ← lấy từ Supabase bước 1\n  SUPABASE_SERVICE_ROLE_KEY  ← lấy từ Supabase bước 1\n  ADMIN_PASSWORD  ← mật khẩu đăng nhập admin, tự đặt\n  ADMIN_SECRET  ← chuỗi random 32+ ký tự, dùng generate-secret\n  CRON_SECRET  ← chuỗi random 32+ ký tự\n  SUPABASE_WEBHOOK_SECRET  ← tự đặt, dùng lại ở bước webhook\n  SEPAY_WEBHOOK_SECRET  ← lấy từ SePay sau (điền sau)\n  RESEND_API_KEY  ← lấy từ Resend sau (điền sau)\n  NEXT_PUBLIC_SITE_URL  ← domain của bạn, VD: https://templatestores.com",
        links: [
          { label: "Cloudflare Dashboard", href: "https://dash.cloudflare.com/" },
          { label: "Tạo chuỗi random an toàn", href: "https://generate-secret.vercel.app/40" },
        ],
        tips: "ADMIN_SECRET và CRON_SECRET phải là chuỗi ngẫu nhiên phức tạp — không dùng mật khẩu đơn giản. Sau khi thêm xong → Redeploy.",
      },
      {
        id: "cf-domain",
        title: "Gắn custom domain (khuyến nghị)",
        desc: "Domain *.workers.dev có thể bị chặn bởi một số ISP Việt Nam (Viettel, FPT). Nên gắn domain riêng.\n\nCloudflare Dashboard → Workers & Pages → chọn project → Custom domains → Add custom domain → nhập domain của bạn.\n\nNếu domain không ở Cloudflare: cần chuyển nameserver về Cloudflare hoặc thêm CNAME record.\n\nSau khi gắn xong: cập nhật NEXT_PUBLIC_SITE_URL trong env vars thành domain mới.",
        links: [{ label: "Cloudflare Dashboard", href: "https://dash.cloudflare.com/" }],
        tips: "SSL certificate tự động được cấp trong ~5 phút. Không cần cấu hình thêm.",
      },
      {
        id: "cf-cron",
        title: "Cron tự động (đã tích hợp sẵn — kiểm tra)",
        desc: "Hệ thống tự động chạy 4 tác vụ mỗi 5 phút mà không cần dịch vụ ngoài:\n\n  • Hủy đơn pending quá 10 phút (chưa thanh toán)\n  • Gửi email nhắc giỏ hàng bỏ rơi (sau 15 phút)\n  • Xử lý hàng đợi automation\n  • Gửi campaign theo lịch\n\nKiểm tra: Cloudflare Dashboard → Workers → chọn project → Triggers → Cron Triggers → phải thấy '*/5 * * * *'.",
        links: [{ label: "Cloudflare Workers Dashboard", href: "https://dash.cloudflare.com/" }],
        tips: "Cron chỉ chạy trên Cloudflare, không chạy khi dev local. Nếu không thấy Cron Triggers → redeploy.",
      },
    ],
  },
  {
    id: "appearance",
    label: "Bước 3 — Giao diện & Thương hiệu",
    color: "bg-violet-500/15 text-violet-300 border-violet-500/20",
    steps: [
      {
        id: "cfg-sitename",
        title: "Tên site, tagline và mô tả SEO",
        desc: "Những thông tin này ảnh hưởng đến tab trình duyệt, kết quả Google và chia sẻ mạng xã hội.\n\n  Tên site: tên hiển thị trên tab trình duyệt và email\n  Tagline: phụ đề ngắn sau tên site\n  Mô tả site: 150-160 ký tự, dùng cho SEO và preview khi chia sẻ link",
        links: [{ label: "Điền Tên site ngay", href: "/admin/settings#site_name", variant: "primary" }],
      },
      {
        id: "cfg-color",
        title: "Màu chủ đạo, Logo và Favicon",
        desc: "Màu chủ đạo (brand color) áp dụng cho toàn bộ: nút bấm, highlight, email giao hàng, badge...\n\n  Màu chủ đạo: nhập mã HEX hoặc dùng color picker\n  Logo: URL ảnh hoặc chữ ngắn (VD: TL hoặc 🚀)\n  Favicon: icon nhỏ trên tab — khuyến nghị .ico hoặc .png 32×32px",
        links: [{ label: "Chọn màu chủ đạo", href: "/admin/settings#brand_color", variant: "primary" }],
        tips: "Màu chủ đạo ảnh hưởng đến email gửi cho khách — chọn kỹ một lần, sau khó đổi.",
      },
      {
        id: "cfg-og",
        title: "Ảnh chia sẻ mạng xã hội (OG Image)",
        desc: "Khi khách chia sẻ link sản phẩm lên Facebook/Zalo/Telegram, ảnh OG sẽ hiển thị làm thumbnail.\n\nChuẩn bị ảnh 1200×630px (banner giới thiệu site) → Upload trong Admin → Cấu hình → Ảnh chia sẻ mạng xã hội.\n\nKiểm tra tại: opengraph.xyz — dán link trang chủ để xem preview.",
        links: [
          { label: "Upload OG Image", href: "/admin/settings#og_image_url", variant: "primary" },
          { label: "Kiểm tra preview", href: "https://www.opengraph.xyz" },
        ],
      },
      {
        id: "cfg-contact",
        title: "Email hỗ trợ và Link Zalo",
        desc: "Email hỗ trợ hiển thị trong email giao hàng — khách có thể reply để liên hệ bạn.\nLink Zalo hiển thị dưới dạng nút 'Nhắn Zalo' trong email.\n\n  Email hỗ trợ: VD admin@yourdomain.com (dùng Cloudflare Email Routing để nhận về Gmail)\n  Link Zalo: mở Zalo → Profile → Share → copy link zalo.me/...",
        links: [{ label: "Điền Email và Zalo", href: "/admin/settings#admin_email", variant: "primary" }],
      },
    ],
  },
  {
    id: "payment",
    label: "Bước 4 — Thanh toán (SePay + VietQR)",
    color: "bg-amber-500/15 text-amber-300 border-amber-500/20",
    steps: [
      {
        id: "cfg-bank",
        title: "Nhập thông tin ngân hàng nhận tiền",
        desc: "Đây là thông tin để tạo mã QR VietQR cho khách chuyển khoản.\n\n  Ngân hàng: chọn từ danh sách (Vietcombank, Techcombank, MB...)\n  Số tài khoản: nhập chính xác\n  Tên chủ tài khoản: VIẾT HOA KHÔNG DẤU, phải khớp chính xác với tên đăng ký ngân hàng",
        links: [{ label: "Cấu hình ngân hàng", href: "/admin/settings#bank_code", variant: "primary" }],
        tips: "Sai tên chủ tài khoản có thể khiến QR không hiển thị đúng. Kiểm tra bằng ứng dụng ngân hàng trước khi đưa vào production.",
      },
      {
        id: "sepay-account",
        title: "Tạo tài khoản SePay và kết nối ngân hàng",
        desc: "SePay theo dõi biến động số dư tài khoản và thông báo realtime về app khi có tiền vào.\n\n1. Đăng ký tại my.sepay.vn (miễn phí)\n2. Xác minh email\n3. Cài đặt → Liên kết ngân hàng → kết nối tài khoản (cùng STK đã điền)\n4. Chờ xác minh từ SePay (~1-2 ngày làm việc)",
        links: [{ label: "Đăng ký SePay", href: "https://my.sepay.vn/" }],
        tips: "SePay miễn phí cho cá nhân. Cần cài app ngân hàng hỗ trợ thông báo để SePay nhận được.",
      },
      {
        id: "sepay-webhook",
        title: "Tạo SePay Webhook và nhập API Key",
        desc: "Webhook là cầu nối: khi có tiền vào → SePay gọi về app → app xác nhận đơn hàng tự động.\n\n1. SePay Dashboard → Dịch vụ → Webhook → Tạo webhook mới\n2. URL webhook: lấy từ Cấu hình → Webhook & API URLs → SePay Webhook URL\n   (dạng: https://yourdomain.com/api/webhook/sepay)\n3. Nhấn Tạo → copy API Key vừa tạo\n4. Dán vào Dashboard → Cấu hình → SePay Webhook Secret → Lưu\n5. Nhấn Test trong SePay để kiểm tra kết nối",
        links: [
          { label: "SePay Dashboard", href: "https://my.sepay.vn/" },
          { label: "Nhập SePay Webhook Secret", href: "/admin/settings#sepay_webhook_secret", variant: "primary" },
        ],
        tips: "⚠️ Bắt buộc phải có API Key — sau khi update bảo mật, hệ thống từ chối 100% webhook nếu thiếu secret.",
      },
    ],
  },
  {
    id: "sb-webhook",
    label: "Bước 5 — Supabase Database Webhook (Gửi email tự động)",
    color: "bg-sky-500/15 text-sky-300 border-sky-500/20",
    steps: [
      {
        id: "sb-webhook-secret",
        title: "Đặt Supabase Webhook Secret trong Dashboard",
        desc: "Webhook secret là mật khẩu để app xác nhận request đến từ Supabase (không phải hacker giả mạo).\n\nBước này: chọn 1 chuỗi bí mật bất kỳ (VD: my-secret-abc123) → nhập vào Dashboard → Cấu hình → Supabase Webhook Secret → Lưu.\n\nGhi nhớ chuỗi này — dùng lại ở bước tiếp theo khi cấu hình trên Supabase.",
        links: [{ label: "Nhập Supabase Webhook Secret", href: "/admin/settings#supabase_webhook_secret", variant: "primary" }],
        tips: "Nếu đã set SUPABASE_WEBHOOK_SECRET trong Cloudflare env vars thì dùng cùng giá trị đó.",
      },
      {
        id: "sb-webhook-create",
        title: "Tạo Database Webhook trên Supabase",
        desc: "Webhook này lắng nghe khi đơn hàng chuyển sang 'Thành công' → tự động gửi email kèm link template cho khách.\n\nSupabase → Database → Webhooks → Create a new hook:\n  Name: order-success\n  Table: orders\n  Events: chỉ chọn UPDATE (không chọn INSERT/DELETE)\n  Type: HTTP Request — POST\n  URL: lấy từ Cấu hình → Webhook & API URLs → Supabase DB Webhook URL\n       (dạng: https://yourdomain.com/api/webhook/order-success)\n  HTTP Header: x-webhook-secret = [chuỗi bí mật đã nhập ở bước trên]\n\nNhấn Confirm.",
        links: [{ label: "Supabase Database Webhooks", href: "https://supabase.com/dashboard/projects" }],
        tips: "Phải chọn đúng event UPDATE. Nếu chọn INSERT sẽ gửi email ngay khi tạo đơn — chưa thanh toán.",
      },
    ],
  },
  {
    id: "email",
    label: "Bước 6 — Email tự động (Resend)",
    color: "bg-rose-500/15 text-rose-300 border-rose-500/20",
    steps: [
      {
        id: "resend-key",
        title: "Tạo Resend API Key",
        desc: "Resend là dịch vụ gửi email — miễn phí 3.000 email/tháng (100/ngày), đủ cho giai đoạn đầu.\n\n1. Đăng ký tại resend.com\n2. Resend → API Keys → Create API Key → Full Access\n3. Copy key (dạng re_xxxxxxxx)\n4. Dán vào Cloudflare env vars: RESEND_API_KEY\n5. Hoặc nhập vào Dashboard bên dưới",
        links: [
          { label: "Mở Resend API Keys", href: "https://resend.com/api-keys" },
          { label: "Nhập vào Dashboard", href: "/admin/settings#resend_api_key", variant: "primary" },
        ],
        tips: "⚠️ RESEND_API_KEY cần set trên Cloudflare env vars để production hoạt động. Nếu chỉ nhập vào Dashboard mà không set Cloudflare, email không gửi được.",
      },
      {
        id: "resend-verify",
        title: "Verify domain gửi email trên Resend",
        desc: "Nếu dùng onboarding@resend.dev thì chỉ test được. Để gửi thật cho mọi khách cần verify domain riêng.\n\n1. Resend → Domains → Add domain → nhập domain (VD: templatestores.com)\n2. Resend cung cấp các DNS records (MX, TXT, DKIM)\n3. Vào Cloudflare DNS → thêm từng record\n4. Quay lại Resend → Verify → chờ xanh (~5-30 phút)\n5. Sau khi verify: cập nhật From Email thành noreply@yourdomain.com",
        links: [
          { label: "Verify domain Resend", href: "https://resend.com/domains" },
          { label: "Cập nhật From Email", href: "/admin/settings#resend_from_email", variant: "primary" },
        ],
        tips: "Dùng onboarding@resend.dev để test nhanh trước khi verify domain. Không forget cập nhật sau khi verify!",
      },
    ],
  },
  {
    id: "protection",
    label: "Bước 7 — Bảo vệ link tải template",
    color: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
    steps: [
      {
        id: "link-protect",
        title: "Cấu hình giới hạn lượt tải",
        desc: "Mặc định link template gốc gửi thẳng trong email — khách có thể share link cho người khác dùng miễn phí.\n\nBật bảo vệ: Admin → Cấu hình → cuộn xuống mục 'Link bảo vệ tải template'\n\n  Thời hạn link: chọn 48 giờ (khuyến nghị) — link hết hạn sau 48h kể từ khi gửi email\n  Giới hạn lượt truy cập: chọn 3 lần (khuyến nghị) — đủ để Duplicate + 2 lần dự phòng\n\nSau khi lưu: mỗi đơn hàng mới sẽ nhận link /api/download/... thay vì link Notion/GSheet gốc. Khách click sẽ thấy cảnh báo còn bao nhiêu lượt trước khi chuyển hướng.",
        links: [{ label: "Cấu hình bảo vệ link", href: "/admin/settings#download_link_expiry_hours", variant: "primary" }],
        tips: "Đơn hàng cũ (trước khi bật) vẫn có link cũ. Chỉ đơn hàng mới sau khi bật mới được bảo vệ.",
      },
    ],
  },
  {
    id: "golive",
    label: "Bước 8 — Thêm sản phẩm & Go Live",
    color: "bg-green-500/15 text-green-300 border-green-500/20",
    steps: [
      {
        id: "add-product",
        title: "Thêm sản phẩm đầu tiên",
        desc: "Admin → Sản phẩm → Thêm sản phẩm mới.\n\nĐiền đầy đủ:\n  Tên sản phẩm: rõ ràng, hấp dẫn\n  Giá (VND): số nguyên, VD: 79000\n  Template Link: link Notion (để Duplicate) hoặc Google Sheets (để Copy)\n  Ảnh thumbnail: tỉ lệ 16:9 hoặc 4:3\n  Mô tả ngắn: 1-2 câu gợi ý cho AI tạo landing page\n\nSau khi tạo: nhấn Publish để hiển thị trên trang chủ.",
        links: [{ label: "Thêm sản phẩm mới", href: "/admin/products/new", variant: "primary" }],
        tips: "Template Link phải là link public (không yêu cầu đăng nhập). Với Notion: Share → Copy link → bật 'Allow anyone with this link to Duplicate'.",
      },
      {
        id: "test-flow",
        title: "Test toàn bộ luồng mua hàng (bắt buộc trước khi ra mắt)",
        desc: "Đây là bước quan trọng nhất — xác nhận tất cả đã hoạt động end-to-end.\n\n1. Mở tab ẩn danh → vào trang chủ\n2. Chọn sản phẩm → Mua ngay\n3. Nhập email thật + số điện thoại\n4. Quét QR → chuyển khoản đúng số tiền, đúng nội dung (mã TML...)\n5. Chờ tối đa 60 giây, xác nhận:\n   ✅ Admin → Đơn hàng đổi sang 'Thành công'\n   ✅ Nhận email có link template (kiểm tra spam)\n   ✅ Click link → thấy cảnh báo lượt còn lại → tự redirect sau 5s\n   ✅ Template mở được và Duplicate về workspace",
        tips: "Nếu không nhận email: vào Resend Dashboard → Logs để xem lỗi. Vào Supabase → Database → Webhooks → xem Logs để debug.",
      },
    ],
  },
  {
    id: "security",
    label: "Bước 9 — Bảo mật (trước khi ra mắt chính thức)",
    color: "bg-red-500/15 text-red-300 border-red-500/20",
    steps: [
      {
        id: "sec-secret",
        title: "Đổi ADMIN_SECRET thành chuỗi random mạnh",
        desc: "ADMIN_SECRET được dùng để tạo token đăng nhập admin. Nếu dùng giá trị mặc định hoặc đơn giản, attacker có thể tạo token hợp lệ mà không cần mật khẩu.\n\n1. Tạo chuỗi random 40+ ký tự: generate-secret.vercel.app/40\n2. Cloudflare Dashboard → Workers & Pages → project → Settings → Environment variables\n3. Cập nhật ADMIN_SECRET → giá trị mới → Encrypt → Save\n4. Redeploy worker\n5. Lưu ý: toàn bộ admin đang đăng nhập sẽ bị logout",
        links: [
          { label: "Tạo secret mạnh", href: "https://generate-secret.vercel.app/40" },
          { label: "Cloudflare Dashboard", href: "https://dash.cloudflare.com/" },
        ],
        tips: "Làm bước này một lần duy nhất trước khi có khách hàng thật. Không cần đổi lại sau.",
      },
      {
        id: "sec-password",
        title: "Đổi ADMIN_PASSWORD thành mật khẩu mạnh",
        desc: "Đây là mật khẩu đăng nhập admin tại /admin/login. Nếu dùng mật khẩu mặc định → bất kỳ ai cũng đăng nhập được.\n\n1. Tạo mật khẩu mạnh 12+ ký tự (chữ hoa, chữ thường, số, ký tự đặc biệt)\n2. Cloudflare Dashboard → Environment variables → cập nhật ADMIN_PASSWORD\n3. Redeploy\n4. Thử đăng nhập lại với mật khẩu mới",
        links: [{ label: "Cloudflare Dashboard", href: "https://dash.cloudflare.com/" }],
        tips: "Ghi lại mật khẩu vào password manager. Nếu quên, phải vào Cloudflare để đổi.",
      },
      {
        id: "sec-staff",
        title: "Cấu hình quyền nhân viên (nếu có team)",
        desc: "Nếu có người hỗ trợ quản lý, tạo tài khoản nhân viên thay vì share mật khẩu admin.\n\nAdmin → Nhân viên → Thêm nhân viên:\n  Quản lý: xem + sửa sản phẩm, xem đơn hàng, xem khách hàng\n  Cộng tác viên: chỉ xem (không sửa được)\n\nNhân viên đăng nhập tại /manager/login (Quản lý) hoặc /collaborator/login (Cộng tác viên).",
        links: [{ label: "Quản lý nhân viên", href: "/admin/staff", variant: "primary" }],
        tips: "Không chia sẻ mật khẩu admin với bất kỳ ai — tạo tài khoản nhân viên riêng với quyền phù hợp.",
      },
    ],
  },
];

const TOTAL_STEPS = PHASES.reduce((acc, p) => acc + p.steps.length, 0);
const STORAGE_KEY = "admin-setup-guide-v1";

export default function SetupGuide() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(new Set(JSON.parse(saved) as string[]));
    } catch {}
    setHydrated(true);
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const reset = () => {
    setChecked(new Set());
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const doneCount = checked.size;
  const pct = Math.round((doneCount / TOTAL_STEPS) * 100);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tiến trình triển khai</h2>
              {doneCount === TOTAL_STEPS ? (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">Hoàn thành!</span>
              ) : (
                <span className="text-sm text-gray-400">{doneCount}/{TOTAL_STEPS} bước</span>
              )}
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              {pct === 100 ? "Hệ thống đã sẵn sàng hoạt động!" : `Còn ${TOTAL_STEPS - doneCount} bước nữa`}
            </p>
          </div>
          {doneCount > 0 && (
            <button onClick={reset} className="shrink-0 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-400 transition hover:border-gray-600 hover:text-gray-900 dark:hover:text-white">
              Bắt đầu lại
            </button>
          )}
        </div>
      </div>

      {/* Phases */}
      {PHASES.map((phase) => {
        const phaseDone = phase.steps.filter((s) => checked.has(s.id)).length;
        const phaseComplete = phaseDone === phase.steps.length;
        return (
          <div key={phase.id} className={`rounded-2xl border bg-white dark:bg-gray-900 overflow-hidden transition-opacity ${phaseComplete ? "border-gray-200 dark:border-gray-800 opacity-60" : "border-gray-300 dark:border-gray-700"}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                {phaseComplete ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                    <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 111.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-600 bg-gray-100 dark:bg-gray-800">
                    <span className="text-xs font-bold text-gray-400">{phaseDone}/{phase.steps.length}</span>
                  </div>
                )}
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${phase.color}`}>{phase.label}</span>
              </div>
              {phaseComplete && <span className="text-xs text-emerald-400">Xong</span>}
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800/60">
              {phase.steps.map((step, idx) => {
                const isDone = checked.has(step.id);
                return (
                  <div key={step.id} className={`flex gap-4 px-6 py-5 transition-colors ${isDone ? "bg-gray-900/50" : "hover:bg-gray-800/20"}`}>
                    {/* Checkbox */}
                    <button
                      onClick={() => toggle(step.id)}
                      title={isDone ? "Bỏ đánh dấu" : "Đánh dấu xong"}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        isDone ? "border-emerald-500 bg-emerald-500 hover:bg-emerald-600" : "border-gray-600 hover:border-emerald-500"
                      }`}
                    >
                      {isDone && (
                        <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 111.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <span className={`shrink-0 mt-0.5 text-xs font-mono font-bold ${isDone ? "text-gray-600" : "text-gray-500"}`}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <h3 className={`text-sm font-semibold leading-snug ${isDone ? "text-gray-500 line-through decoration-gray-600" : "text-gray-900 dark:text-white"}`}>
                          {step.title}
                        </h3>
                      </div>

                      <p className={`mt-2 text-xs leading-relaxed whitespace-pre-line ${isDone ? "text-gray-600" : "text-gray-400"}`}>
                        {step.desc}
                      </p>

                      {step.tips && !isDone && (
                        <div className="mt-2 flex gap-1.5 rounded-xl border border-amber-500/15 bg-amber-500/5 px-3 py-2"> {/* đã đồng bộ design system */}
                          <span className="shrink-0 text-xs text-amber-400 mt-0.5">💡</span>
                          <p className="text-xs text-amber-300/80">{step.tips}</p>
                        </div>
                      )}

                      {step.links && step.links.length > 0 && !isDone && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {step.links.map((link) => {
                            const isInternal = link.href.startsWith("/");
                            // đã đồng bộ design system — rounded-xl, bg-emerald-500 (primary token)
                            const cls = link.variant === "primary"
                              ? "inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition"
                              : "inline-flex items-center gap-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300 transition hover:border-gray-600 hover:text-gray-900 dark:hover:text-white";
                            return isInternal ? (
                              <Link key={link.href} href={link.href} className={cls}>
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                                {link.label}
                              </Link>
                            ) : (
                              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                {link.label}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
