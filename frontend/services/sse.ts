import { TimelineEvent, RunIncidentRequest } from "@/types";
import { API_BASE } from "./api";

export async function streamIncidentContainment(
  req: RunIncidentRequest,
  onEvent: (event: TimelineEvent) => void,
  onError?: (err: Error) => void
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/incidents/run-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Failed to initialize containment stream: HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const line = part.trim();
        if (line.startsWith("data:")) {
          try {
            const rawJson = line.substring(5).trim();
            const eventData: TimelineEvent = JSON.parse(rawJson);
            onEvent(eventData);
          } catch (e) {
            console.error("Error parsing SSE JSON payload:", e, line);
          }
        }
      }
    }
  } catch (err: any) {
    if (onError) onError(err);
    else console.error("Stream incident error:", err);
  }
}
