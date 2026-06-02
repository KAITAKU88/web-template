export interface AiProvider {
  value: string;
  label: string;
  keyName: string;
  keyUrl: string | null;
  baseUrl?: string;
  defaultModel: string;
}

export const AI_PROVIDERS: AiProvider[] = [
  {
    value: "claude",
    label: "Claude (Anthropic)",
    keyName: "claude_api_key",
    keyUrl: "https://console.anthropic.com/settings/keys",
    defaultModel: "claude-sonnet-4-6",
  },
  {
    value: "gemini",
    label: "Gemini (Google)",
    keyName: "gemini_api_key",
    keyUrl: "https://aistudio.google.com/apikey",
    defaultModel: "gemini-2.0-flash",
  },
  {
    value: "openai",
    label: "OpenAI",
    keyName: "openai_api_key",
    keyUrl: "https://platform.openai.com/api-keys",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
  {
    value: "grok",
    label: "Grok (xAI)",
    keyName: "grok_api_key",
    keyUrl: "https://console.x.ai",
    baseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-3-mini",
  },
  {
    value: "groq",
    label: "Groq",
    keyName: "groq_api_key",
    keyUrl: "https://console.groq.com/keys",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
  },
  {
    value: "mistral",
    label: "Mistral",
    keyName: "mistral_api_key",
    keyUrl: "https://console.mistral.ai/api-keys",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
  },
  {
    value: "together",
    label: "Together AI",
    keyName: "together_api_key",
    keyUrl: "https://api.together.xyz/settings/api-keys",
    baseUrl: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  },
  {
    value: "custom",
    label: "Custom Provider",
    keyName: "custom_api_key",
    keyUrl: null,
    defaultModel: "gpt-4o-mini",
  },
];

export function getProvider(value: string): AiProvider | undefined {
  return AI_PROVIDERS.find((p) => p.value === value);
}
