/**
 * Auto-detection of locally running model servers.
 *
 * Probes well-known local endpoints (Ollama, LM Studio, vLLM, llama.cpp) and
 * reports which runtimes are up and what models they have loaded, so the UI can
 * offer them without the user having to type a base URL or model id.
 *
 * Detected models are added through the existing `custom` provider with the
 * server's OpenAI-compatible base URL (see src/main/models.ts addModel).
 */

export interface DetectedServer {
  id: string; // "ollama" | "lmstudio" | "vllm" | "llamacpp"
  name: string; // human-readable runtime name
  baseUrl: string; // OpenAI-compatible base, e.g. http://localhost:11434/v1
  models: string[]; // model ids loaded on that server
}

interface Probe {
  id: string;
  name: string;
  baseUrl: string;
  kind: "ollama" | "openai";
}

const PROBES: Probe[] = [
  {
    id: "ollama",
    name: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    kind: "ollama",
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    baseUrl: "http://localhost:1234/v1",
    kind: "openai",
  },
  {
    id: "vllm",
    name: "vLLM",
    baseUrl: "http://localhost:8000/v1",
    kind: "openai",
  },
  {
    id: "llamacpp",
    name: "llama.cpp",
    baseUrl: "http://localhost:8080/v1",
    kind: "openai",
  },
];

const PROBE_TIMEOUT_MS = 800;

async function fetchModels(probe: Probe): Promise<string[]> {
  // Ollama's native /api/tags is the canonical list of pulled models; everything
  // else (and Ollama too) speaks the OpenAI-compatible GET /models endpoint.
  if (probe.kind === "ollama") {
    const url = probe.baseUrl.replace(/\/v1\/?$/, "") + "/api/tags";
    const res = await fetch(url, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { models?: Array<{ name?: string }> };
    return (json.models || [])
      .map((m) => m.name)
      .filter((n): n is string => typeof n === "string" && n.length > 0);
  }

  const res = await fetch(probe.baseUrl + "/models", {
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: Array<{ id?: string }> };
  return (json.data || [])
    .map((m) => m.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

/**
 * Probe all known local runtimes in parallel. Returns only servers that
 * responded with at least one model; unreachable servers are silently skipped.
 */
export async function detectLocalModels(): Promise<DetectedServer[]> {
  const results = await Promise.all(
    PROBES.map(async (probe) => {
      try {
        const models = await fetchModels(probe);
        if (models.length === 0) return null;
        return {
          id: probe.id,
          name: probe.name,
          baseUrl: probe.baseUrl,
          models,
        } satisfies DetectedServer;
      } catch {
        return null;
      }
    }),
  );
  return results.filter((r): r is DetectedServer => r !== null);
}
