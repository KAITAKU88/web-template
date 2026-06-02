"use server";

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { revalidatePath } from "next/cache";
import type { ProductCopy } from "@/lib/productContent";
import { queueAutomation } from "@/lib/automation";

function buildPrompt(name: string, type: string, description: string, audience: string): string {
  const typeLabel = type === "google_sheet" ? "Google Sheets" : type === "notion" ? "Notion" : type;
  return `Bạn là chuyên gia copywriter người Việt, chuyên viết landing page bán template ${typeLabel} cho thị trường Việt Nam. Nhiệm vụ: tạo toàn bộ nội dung marketing cho sản phẩm dưới đây.

═══ THÔNG TIN SẢN PHẨM ═══
Tên: ${name}
Loại: Template ${typeLabel}
Mô tả: ${description || "(tự suy luận từ tên — phải hợp lý và cụ thể)"}
Đối tượng: ${audience || "(tự suy luận từ tên và loại template)"}

═══ YÊU CẦU CHẤT LƯỢNG ═══
- Viết hoàn toàn bằng tiếng Việt, tự nhiên như người bản ngữ
- Tone: thân thiện, đồng cảm, không hoa mỹ quá mức
- Nội dung phải THỰC TẾ và CỤ THỂ cho đúng sản phẩm này — không được chung chung
- Mỗi "nỗi đau" phải khiến người đọc gật đầu vì đúng tâm lý
- Testimonial phải nghe chân thực như người thật viết, có chi tiết cụ thể
- FAQ phải trả lời đúng điều khách hàng thực sự lo ngại khi mua

═══ CẤU TRÚC BẮT BUỘC ═══
Trả về JSON hợp lệ duy nhất (KHÔNG markdown, KHÔNG giải thích, KHÔNG text thừa):

{
  "headline": "1 câu — câu hỏi đánh đúng nỗi đau HOẶC tuyên bố gây tò mò mạnh. VD: 'Mỗi sáng mở máy lên, bạn không biết hôm nay phải làm gì trước?'",
  "subheadline": "2-3 câu — mô tả lợi ích cốt lõi, ai dùng được, kết quả cụ thể sau khi dùng template này",
  "pains": [
    { "icon": "emoji phù hợp", "title": "Tên nỗi đau ngắn gọn (3-6 từ)", "desc": "Mô tả 1-2 câu cụ thể, đúng tâm lý người đang gặp vấn đề này. Nên có chi tiết như số liệu, tình huống quen thuộc." },
    { "icon": "...", "title": "...", "desc": "..." },
    { "icon": "...", "title": "...", "desc": "..." },
    { "icon": "...", "title": "...", "desc": "..." },
    { "icon": "...", "title": "...", "desc": "..." },
    { "icon": "...", "title": "...", "desc": "..." }
  ],
  "solutionTitle": "Tiêu đề phần giải pháp — 1 câu ngắn, mạnh, khẳng định",
  "solutionDesc": "2 câu — template này giải quyết vấn đề trên như thế nào, cơ chế hoạt động",
  "solutionFormula": {
    "a": "emoji + Yếu tố 1 (điều template cung cấp)",
    "b": "emoji + Yếu tố 2 (điều template cung cấp)",
    "result": "emoji + Kết quả cuối cùng người dùng đạt được"
  },
  "features": [
    { "icon": "emoji", "title": "Tên tính năng/module (3-5 từ)", "desc": "1 câu — nó làm được gì cụ thể, giúp người dùng tiết kiệm gì hoặc đạt được gì" },
    { "icon": "...", "title": "...", "desc": "..." },
    { "icon": "...", "title": "...", "desc": "..." },
    { "icon": "...", "title": "...", "desc": "..." },
    { "icon": "...", "title": "...", "desc": "..." },
    { "icon": "...", "title": "...", "desc": "..." }
  ],
  "goals": [
    { "icon": "emoji", "title": "Mục tiêu/kết quả cụ thể (3-6 từ)", "desc": "1-2 câu — sau khi dùng template này, người dùng đạt được điều gì cụ thể, đo lường được" },
    { "icon": "...", "title": "...", "desc": "..." },
    { "icon": "...", "title": "...", "desc": "..." },
    { "icon": "...", "title": "...", "desc": "..." }
  ],
  "testimonials": [
    { "text": "Review 2-4 câu — nghe như người thật viết, có chi tiết cụ thể (thời gian setup, tình huống dùng, kết quả cụ thể). KHÔNG dùng từ hoa mỹ như 'tuyệt vời', 'xuất sắc'.", "name": "Tên tiếng Việt thật", "role": "Nghề nghiệp · Thành phố VN", "avatar": "emoji người" },
    { "text": "...", "name": "...", "role": "...", "avatar": "emoji người" },
    { "text": "...", "name": "...", "role": "...", "avatar": "emoji người" }
  ],
  "audience": [
    { "icon": "emoji", "title": "Nhóm đối tượng (3-5 từ)", "desc": "1 câu — lý do nhóm này đặc biệt phù hợp với template, vấn đề cụ thể nó giải quyết cho họ" },
    { "icon": "...", "title": "...", "desc": "..." },
    { "icon": "...", "title": "...", "desc": "..." },
    { "icon": "...", "title": "...", "desc": "..." }
  ],
  "includes": [
    { "title": "Tên module/phần bao gồm", "desc": "1 câu ngắn mô tả dùng để làm gì" },
    { "title": "...", "desc": "..." },
    { "title": "...", "desc": "..." },
    { "title": "...", "desc": "..." },
    { "title": "...", "desc": "..." }
  ],
  "faqs": [
    { "q": "Câu hỏi mà khách hàng thực sự hay hỏi trước khi mua?", "a": "Trả lời đầy đủ, giải tỏa lo ngại, 2-4 câu." },
    { "q": "...", "a": "..." },
    { "q": "...", "a": "..." },
    { "q": "...", "a": "..." },
    { "q": "...", "a": "..." }
  ]
}

LƯU Ý QUAN TRỌNG: Chỉ trả về JSON. Không có bất kỳ text nào khác ngoài JSON.`;
}

function parseJson(raw: string): ProductCopy {
  try {
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) ?? raw.match(/(\{[\s\S]*\})/);
    return JSON.parse(jsonMatch ? jsonMatch[1] : raw) as ProductCopy;
  } catch {
    throw new Error(`AI trả về format không hợp lệ. Raw: ${raw.slice(0, 200)}`);
  }
}

async function generateWithClaude(prompt: string, apiKey: string): Promise<ProductCopy> {
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  if (!raw) throw new Error("Claude không trả về nội dung. Thử lại.");
  return parseJson(raw);
}

async function generateWithGemini(prompt: string, apiKey: string): Promise<ProductCopy> {
  const ai = new GoogleGenAI({ apiKey });
  let response;
  try {
    response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      throw new Error(
        "Gemini API lỗi quota. Model gemini-1.5-flash miễn phí 1500 req/ngày — nếu vẫn lỗi hãy kiểm tra API key tại aistudio.google.com/apikey."
      );
    }
    if (msg.includes("401") || msg.includes("403") || msg.includes("API_KEY_INVALID")) {
      throw new Error("Gemini API key không hợp lệ. Kiểm tra lại trong Admin → Cấu hình → AI.");
    }
    throw err;
  }
  const raw = response.text ?? "";
  if (!raw) throw new Error("Gemini không trả về nội dung. Thử lại.");
  return parseJson(raw);
}

export async function generateLandingContent(
  name: string,
  type: string,
  description: string,
  audience: string,
): Promise<{ data: ProductCopy } | { error: string }> {
  try {
    const settings = await getSettings();
    const provider = settings.ai_provider;
    const prompt = buildPrompt(name, type, description, audience);

    if (!provider) {
      return { error: "Chưa cấu hình AI provider. Vào Admin → Cấu hình → AI để chọn Gemini hoặc Claude." };
    }

    if (provider === "gemini") {
      const apiKey = settings.gemini_api_key;
      if (!apiKey) return { error: "Gemini API key chưa được cấu hình. Vào Admin → Cấu hình → AI để nhập key." };
      return { data: await generateWithGemini(prompt, apiKey) };
    }

    if (provider === "claude") {
      const apiKey = settings.claude_api_key;
      if (!apiKey) return { error: "Claude API key chưa được cấu hình. Vào Admin → Cấu hình → AI để nhập key." };
      return { data: await generateWithClaude(prompt, apiKey) };
    }

    return { error: `AI provider không hợp lệ: "${provider}". Vào Admin → Cấu hình → AI để cấu hình lại.` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi không xác định khi gọi AI.";
    return { error: msg };
  }
}

export async function createProduct(formData: FormData) {
  const supabase = createAdminClient();

  const landingRaw = formData.get("landing_content") as string | null;
  const landing = landingRaw ? JSON.parse(landingRaw) : null;

  const isCombo = formData.get("is_combo") === "true";
  const comboProductIds = JSON.parse((formData.get("combo_product_ids") as string) || "[]");

  const { error } = await supabase.from("products").insert({
    name: formData.get("name") as string,
    slug: (formData.get("slug") as string) || null,
    type: (formData.get("type") as string) || null,
    price: Number(formData.get("price")),
    original_price: formData.get("original_price") ? Number(formData.get("original_price")) : null,
    template_link: isCombo ? "" : (formData.get("template_link") as string),
    description: (formData.get("description") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    download_count: Number(formData.get("download_count") ?? 0),
    rating: Number(formData.get("rating") ?? 0),
    rating_count: Number(formData.get("rating_count") ?? 0),
    landing_content: landing,
    label: (formData.get("label") as string) || null,
    gallery_images: JSON.parse((formData.get("gallery_images") as string) || "[]"),
    is_combo: isCombo,
    combo_product_ids: comboProductIds,
    status: "draft",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = createAdminClient();

  const landingRaw = formData.get("landing_content") as string | null;
  const landing = landingRaw ? JSON.parse(landingRaw) : null;

  const slugVal = (formData.get("slug") as string) || null;
  const isCombo = formData.get("is_combo") === "true";
  const comboProductIds = JSON.parse((formData.get("combo_product_ids") as string) || "[]");

  const { error } = await supabase.from("products").update({
    name: formData.get("name") as string,
    slug: slugVal,
    type: (formData.get("type") as string) || null,
    price: Number(formData.get("price")),
    original_price: formData.get("original_price") ? Number(formData.get("original_price")) : null,
    template_link: isCombo ? "" : (formData.get("template_link") as string),
    description: (formData.get("description") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    download_count: Number(formData.get("download_count") ?? 0),
    rating: Number(formData.get("rating") ?? 0),
    rating_count: Number(formData.get("rating_count") ?? 0),
    landing_content: landing,
    label: (formData.get("label") as string) || null,
    gallery_images: JSON.parse((formData.get("gallery_images") as string) || "[]"),
    is_combo: isCombo,
    combo_product_ids: comboProductIds,
  }).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath(`/products/${id}`);
  if (slugVal) revalidatePath(`/products/${slugVal}`);
}

export async function deleteProduct(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function toggleProductStatus(id: string, newStatus: "published" | "draft") {
  const supabase = createAdminClient();
  const { data: product, error } = await supabase
    .from("products")
    .update({ status: newStatus })
    .eq("id", id)
    .select("id, name, slug")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/");

  // Trigger automation khi publish sản phẩm mới
  if (newStatus === "published" && product) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://web-template-cloudflare.thankful-to-all-88.workers.dev";
    queueAutomation("product_published", {
      product_id:   product.id,
      product_name: product.name,
      product_url:  `${siteUrl}/products/${product.slug ?? product.id}`,
      checkout_url: `${siteUrl}/checkout/${product.slug ?? product.id}`,
      site_url:     siteUrl,
    }).catch((e) => console.error("product_published automation error:", e));
  }
}
