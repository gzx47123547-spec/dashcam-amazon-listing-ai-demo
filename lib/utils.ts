export function safeJsonParse(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return { raw_text: "" };
  }

  const jsonCandidate = unwrapJsonFence(trimmed);

  try {
    return JSON.parse(jsonCandidate);
  } catch {
    return { raw_text: value };
  }
}

function unwrapJsonFence(value: string) {
  const match = value.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : value;
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : String(item ?? "")))
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|,|，|;|；/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function toPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
