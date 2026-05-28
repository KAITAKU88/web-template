export type ProductType = "notion" | "google_sheet";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;  // Giá gốc (NULL = không khuyến mãi)
  template_link: string;
  type: ProductType | null;
  image_url: string | null;
  rating: number;                 // 0.0 - 5.0
  rating_count: number;           // Số lượt đánh giá
  download_count: number;         // Số lượt tải
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  landing_content: any | null;   // ProductCopy sinh bởi AI — NULL = dùng content tĩnh
  created_at: string;
}

export type OrderStatus = "pending" | "success" | "expired" | "cancelled";

export interface Order {
  id: string;
  customer_email: string;
  customer_phone: string | null;
  product_id: string;
  amount: number;
  status: OrderStatus;
  created_at: string;
  paid_at: string | null;
  bump_product_id: string | null;
  bump_amount: number | null;
}

export interface Customer {
  email: string;
  full_name: string | null;
  total_orders: number;
  last_purchase: string | null;
}

// API request/response types
export interface CreateOrderRequest {
  product_id: string;
  customer_email: string;
  customer_phone?: string;
  bump_product_id?: string;
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  qr_url: string;
  payment_url: string;
}

// SePay webhook payload
export interface SepayWebhookPayload {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string | null;
  transferAmount: number;
  referenceCode: string;
  description: string;
  transferType: "in" | "out";
  accumulated: number;
}
