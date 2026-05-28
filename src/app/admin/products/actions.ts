"use server";

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { revalidatePath } from "next/cache";
import type { ProductCopy } from "@/lib/productContent";

function buildPrompt(name: string, type: string, description: string, audience: string): string {
  const typeLabel = type === "google_sheet" ? "Google Sheets" : "Notion";
  return `Bạn là copywriter chuyên viết landing page cho sản phẩm template ${typeLabel} bán tại thị trường Việt Nam.

Thông tin sản phẩm:
- Tên: ${name}
- Loại: Template ${typeLabel}
- Mô tả: ${description || "(không có — hãy tự suy luận từ tên sản phẩm)"}
- Đối tượng mục tiêu: ${audience || "(không có — hãy tự suy luận từ tên và loại template)"}

Hãy tạo nội dung marketing hoàn chỉnh bằng tiếng Việt. Trả về JSON hợp lệ với cấu trúc sau (KHÔNG có markdown, KHÔNG có text khác):

{
  "headline": "Câu hỏi gây đồng cảm hoặc headline mạnh về vấn đề người dùng đang gặp",
  "subheadline": "Mô tả lợi ích cốt lõi của template, 1-2 câu",
  "pains": [
    { "icon": "emoji", "title": "Tên nỗi đau ngắn", "desc": "Mô tả chi tiết nỗi đau này 1-2 câu" },
    { "icon": "emoji", "title": "...", "desc": "..." },
    { "icon": "emoji", "title": "...", "desc": "..." }
  ],
  "solutionTitle": "Tiêu đề phần giải pháp",
  "solutionDesc": "Mô tả giải pháp 1-2 câu",
  "solutionFormula": { "a": "emoji Yếu tố 1", "b": "emoji Yếu tố 2", "result": "emoji Kết quả" },
  "features": [
    { "icon": "emoji", "title": "Tên tính năng", "desc": "Mô tả ngắn 1 câu" },
    { "icon": "emoji", "title": "...", "desc": "..." },
    { "icon": "emoji", "title": "...", "desc": "..." },
    { "icon": "emoji", "title": "...", "desc": "..." },
    { "icon": "emoji", "title": "...", "desc": "..." },
    { "icon": "emoji", "title": "...", "desc": "..." }
  ],
  "testimonials": [
    { "text": "Review thực tế, chân thực", "name": "Tên Việt Nam", "role": "Nghề nghiệp · Thành phố", "avatar": "emoji" },
    { "text": "...", "name": "...", "role": "...", "avatar": "emoji" },
    { "text": "...", "name": "...", "role": "...", "avatar": "emoji" }
  ],
  "includes": [
    { "title": "Tên mục included", "desc": "Mô tả ngắn" },
    { "title": "...", "desc": "..." },
    { "title": "...", "desc": "..." },
    { "title": "...", "desc": "..." },
    { "title": "...", "desc": "..." }
  ],
  "faqs": [
    { "q": "Câu hỏi thường gặp?", "a": "Câu trả lời chi tiết." },
    { "q": "...", "a": "..." },
    { "q": "...", "a": "..." },
    { "q": "...", "a": "..." },
    { "q": "...", "a": "..." }
  ]
}`;
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
    model: "claude-sonnet-4-5",
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
): Promise<ProductCopy> {
  const settings = await getSettings();
  const provider = settings.ai_provider ?? "claude";
  const prompt = buildPrompt(name, type, description, audience);

  try {
    if (provider === "gemini") {
      const apiKey = settings.gemini_api_key;
      if (!apiKey) throw new Error("Gemini API key chưa được cấu hình. Vào Admin → Cấu hình → AI để nhập key.");
      return await generateWithGemini(prompt, apiKey);
    }

    const apiKey = settings.claude_api_key;
    if (!apiKey) throw new Error("Claude API key chưa được cấu hình. Vào Admin → Cấu hình → AI để nhập key.");
    return await generateWithClaude(prompt, apiKey);
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("Lỗi không xác định khi gọi AI. Kiểm tra API key và thử lại.");
  }
}

export async function createProduct(formData: FormData) {
  const supabase = createAdminClient();

  const landingRaw = formData.get("landing_content") as string | null;
  const landing = landingRaw ? JSON.parse(landingRaw) : null;

  const { error } = await supabase.from("products").insert({
    name: formData.get("name") as string,
    type: (formData.get("type") as string) || null,
    price: Number(formData.get("price")),
    original_price: formData.get("original_price") ? Number(formData.get("original_price")) : null,
    template_link: formData.get("template_link") as string,
    description: (formData.get("description") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    download_count: Number(formData.get("download_count") ?? 0),
    landing_content: landing,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = createAdminClient();

  const landingRaw = formData.get("landing_content") as string | null;
  const landing = landingRaw ? JSON.parse(landingRaw) : null;

  const { error } = await supabase.from("products").update({
    name: formData.get("name") as string,
    type: (formData.get("type") as string) || null,
    price: Number(formData.get("price")),
    original_price: formData.get("original_price") ? Number(formData.get("original_price")) : null,
    template_link: formData.get("template_link") as string,
    description: (formData.get("description") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    download_count: Number(formData.get("download_count") ?? 0),
    landing_content: landing,
  }).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath(`/products/${id}`);
}

export async function deleteProduct(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/");
}
