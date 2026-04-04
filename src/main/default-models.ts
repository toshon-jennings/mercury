/**
 * Default models seeded on first install.
 *
 * Contributors: add new models here! They'll be available to all users
 * on fresh install. Format:
 *   { name: "Display Name", provider: "provider-key", model: "model-id", baseUrl: "" }
 *
 * Provider keys: openrouter, anthropic, openai, groq, custom
 * For openrouter models, use the full path (e.g. "anthropic/claude-sonnet-4-20250514")
 * For direct provider models, use the provider's model ID (e.g. "claude-sonnet-4-20250514")
 */

export interface DefaultModel {
  name: string
  provider: string
  model: string
  baseUrl: string
}

const DEFAULT_MODELS: DefaultModel[] = [
  // ── OpenRouter (200+ models via single API key) ──────────────────────
  { name: 'Claude Sonnet 4', provider: 'openrouter', model: 'anthropic/claude-sonnet-4-20250514', baseUrl: '' },
  { name: 'Claude Opus 4', provider: 'openrouter', model: 'anthropic/claude-opus-4-20250918', baseUrl: '' },
  { name: 'Claude Haiku 4.5', provider: 'openrouter', model: 'anthropic/claude-haiku-4-5-20251001', baseUrl: '' },
  { name: 'GPT-4o', provider: 'openrouter', model: 'openai/gpt-4o', baseUrl: '' },
  { name: 'GPT-4o Mini', provider: 'openrouter', model: 'openai/gpt-4o-mini', baseUrl: '' },
  { name: 'o3 Mini', provider: 'openrouter', model: 'openai/o3-mini', baseUrl: '' },
  { name: 'Gemini 2.5 Pro', provider: 'openrouter', model: 'google/gemini-2.5-pro-preview', baseUrl: '' },
  { name: 'Gemini 2.5 Flash', provider: 'openrouter', model: 'google/gemini-2.5-flash-preview', baseUrl: '' },
  { name: 'Llama 4 Maverick', provider: 'openrouter', model: 'meta-llama/llama-4-maverick', baseUrl: '' },
  { name: 'DeepSeek R1', provider: 'openrouter', model: 'deepseek/deepseek-r1', baseUrl: '' },
  { name: 'Qwen3 235B', provider: 'openrouter', model: 'qwen/qwen3-235b-a22b', baseUrl: '' },
  { name: 'Mistral Large', provider: 'openrouter', model: 'mistralai/mistral-large-2411', baseUrl: '' },

  // ── Anthropic (direct) ───────────────────────────────────────────────
  { name: 'Claude Sonnet 4', provider: 'anthropic', model: 'claude-sonnet-4-20250514', baseUrl: '' },
  { name: 'Claude Opus 4', provider: 'anthropic', model: 'claude-opus-4-20250918', baseUrl: '' },
  { name: 'Claude Haiku 4.5', provider: 'anthropic', model: 'claude-haiku-4-5-20251001', baseUrl: '' },

  // ── OpenAI (direct) ──────────────────────────────────────────────────
  { name: 'GPT-4o', provider: 'openai', model: 'gpt-4o', baseUrl: '' },
  { name: 'GPT-4o Mini', provider: 'openai', model: 'gpt-4o-mini', baseUrl: '' },
  { name: 'o3 Mini', provider: 'openai', model: 'o3-mini', baseUrl: '' },
  { name: 'GPT-4.1', provider: 'openai', model: 'gpt-4.1', baseUrl: '' },

  // ── Groq (ultra-fast inference) ──────────────────────────────────────
  { name: 'Llama 3.3 70B', provider: 'groq', model: 'llama-3.3-70b-versatile', baseUrl: '' },
  { name: 'Mixtral 8x7B', provider: 'groq', model: 'mixtral-8x7b-32768', baseUrl: '' }
]

export default DEFAULT_MODELS
