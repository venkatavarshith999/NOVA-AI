export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export type VerificationStatus = "verified" | "partially_verified" | "not_verified";

export interface Source {
  title: string;
  url: string;
  content: string;
  score: number;
  source_name: string;
}

export interface Claim {
  id: string;
  text: string;
  source_urls: string[];
  verification: { status: VerificationStatus; reason: string; corroborating_sources: number };
  confidence: { score: number; band: "green" | "yellow" | "red" };
}

export interface HallucinationFlag {
  claim_id: string;
  claim_text: string;
  reason: string;
  severity: "high" | "medium" | "low";
}

export interface ReportStats {
  total_claims: number;
  verified: number;
  partially_verified: number;
  not_verified: number;
  avg_confidence: number;
  total_sources: number;
}

export interface Report {
  query: string;
  executive_summary: string;
  claims: Claim[];
  hallucinations: HallucinationFlag[];
  stats: ReportStats;
  sources: Source[];
  conclusion: string;
  is_conversational?: boolean;
}

export type StreamEvent =
  | { type: "start"; query: string }
  | { type: "stage_start"; key: string; label: string; detail: string }
  | { type: "stage_complete"; key: string; label: string; log: string }
  | { type: "substep"; key: string; message: string }
  | { type: "done"; report: Report }
  | { type: "error"; message: string };

/**
 * Streams pipeline progress from the FastAPI SSE endpoint via fetch + a
 * ReadableStream reader (works everywhere; avoids EventSource's POST
 * limitation since the query is a GET param here).
 */
export async function streamResearch(
  query: string,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal
) {
  const url = `${API_BASE}/api/research/stream?query=${encodeURIComponent(query)}`;
  const token = typeof window !== "undefined" ? localStorage.getItem("nova_token") : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { signal, headers });
  if (!res.body) throw new Error("No response body from research stream");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const jsonStr = line.slice(5).trim();
      try {
        const evt = JSON.parse(jsonStr) as StreamEvent;
        onEvent(evt);
      } catch {
        // ignore malformed chunk
      }
    }
  }
}
