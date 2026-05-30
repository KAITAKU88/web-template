-- Xóa constraint cũ chỉ cho phép notion/google_sheet
-- Từ nay type có thể là bất kỳ category id nào trong bảng categories
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_type_check;
