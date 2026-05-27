-- Dữ liệu mẫu (chạy khi `supabase db reset` local)
INSERT INTO public.products (name, description, price, original_price, template_link, type, image_url, rating, rating_count, download_count)
SELECT
  'Notion Second Brain',
  'Hệ thống quản lý tri thức cá nhân trên Notion. Bao gồm inbox, project tracker, reading list và daily journal.',
  99000,
  199000,
  'https://www.notion.so/template/example',
  'notion',
  NULL,
  4.8,
  128,
  342
WHERE NOT EXISTS (
  SELECT 1 FROM public.products WHERE name = 'Notion Second Brain'
);

INSERT INTO public.products (name, description, price, original_price, template_link, type, image_url, rating, rating_count, download_count)
SELECT
  'Google Sheets Budget Tracker',
  'Theo dõi thu chi hàng tháng tự động. Dashboard trực quan, phân loại chi tiêu, báo cáo cuối tháng.',
  79000,
  NULL,
  'https://docs.google.com/spreadsheets/d/example',
  'google_sheet',
  NULL,
  4.5,
  64,
  189
WHERE NOT EXISTS (
  SELECT 1 FROM public.products WHERE name = 'Google Sheets Budget Tracker'
);
