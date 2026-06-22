import { NextResponse } from "next/server";

type ListingInputs = {
  product_name: string;
  marketplace: string;
  product_specs: string;
  core_features: string;
  target_audience: string;
  core_keywords: string;
  competitor_listing: string;
  review_pain_points: string;
  brand_tone: string;
};

const requiredFields: Array<keyof ListingInputs> = [
  "product_name",
  "marketplace",
  "product_specs",
  "core_features",
  "target_audience",
  "core_keywords",
  "competitor_listing",
  "review_pain_points",
  "brand_tone"
];

function pickWorkflowResult(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as Record<string, unknown>;
  const data = root.data as Record<string, unknown> | undefined;
  const outputs = data?.outputs as Record<string, unknown> | undefined;
  const candidates = [
    outputs?.text,
    outputs?.result,
    data?.answer,
    root.answer,
    root.text
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return null;
}

async function readDifyStream(stream: ReadableStream<Uint8Array> | null) {
  if (!stream) {
    return null;
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalPayload: unknown = null;
  let lastPayload: unknown = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split(/\n\n/);
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const dataLines = chunk
        .split(/\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s?/, ""));

      if (dataLines.length === 0) {
        continue;
      }

      const data = dataLines.join("\n").trim();
      if (!data || data === "[DONE]") {
        continue;
      }

      try {
        const payload = JSON.parse(data) as Record<string, unknown>;
        lastPayload = payload;

        if (payload.event === "workflow_finished") {
          finalPayload = payload;
        }
      } catch {
        lastPayload = data;
      }
    }
  }

  return finalPayload ?? lastPayload;
}

function resolveWorkflowUrl(apiUrl: string): string {
  const trimmedUrl = apiUrl.trim().replace(/\/+$/, "");

  if (trimmedUrl.endsWith("/workflows/run")) {
    return trimmedUrl;
  }

  return `${trimmedUrl}/workflows/run`;
}

export async function POST(request: Request) {
  const apiUrl = process.env.DIFY_API_URL;
  const apiKey = process.env.DIFY_API_KEY;
  const timeoutMs = Number(process.env.DIFY_TIMEOUT_MS ?? 60000);
  const responseMode = process.env.DIFY_RESPONSE_MODE ?? "streaming";

  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      {
        error:
          "Dify API is not configured. Please set DIFY_API_URL and DIFY_API_KEY in .env.local."
      },
      { status: 500 }
    );
  }

  let inputs: Partial<ListingInputs>;

  try {
    inputs = (await request.json()) as Partial<ListingInputs>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const missingFields = requiredFields.filter((field) => {
    const value = inputs[field];
    return typeof value !== "string" || !value.trim();
  });

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missingFields.join(", ")}` },
      { status: 400 }
    );
  }

  const startedAt = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const difyResponse = await fetch(resolveWorkflowUrl(apiUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        inputs,
        response_mode: responseMode,
        user: "demo-interviewer"
      })
    });

    const contentType = difyResponse.headers.get("content-type") ?? "";
    const rawPayload = contentType.includes("text/event-stream")
      ? await readDifyStream(difyResponse.body)
      : contentType.includes("application/json")
        ? await difyResponse.json()
        : await difyResponse.text();
    clearTimeout(timeout);

    if (!difyResponse.ok) {
      return NextResponse.json(
        {
          error: "Dify workflow request failed.",
          status: difyResponse.status,
          detail: rawPayload,
          elapsedMs: Date.now() - startedAt
        },
        { status: difyResponse.status }
      );
    }

    const payloadData =
      rawPayload && typeof rawPayload === "object"
        ? (rawPayload as Record<string, unknown>).data
        : null;

    if (
      payloadData &&
      typeof payloadData === "object" &&
      (payloadData as Record<string, unknown>).status === "failed"
    ) {
      return NextResponse.json(
        {
          error:
            (payloadData as Record<string, unknown>).error ??
            "Dify workflow finished with failed status.",
          detail: rawPayload,
          elapsedMs: Date.now() - startedAt
        },
        { status: 500 }
      );
    }

    const result =
      pickWorkflowResult(rawPayload) ??
      (typeof rawPayload === "string"
        ? rawPayload
        : JSON.stringify(rawPayload, null, 2));

    return NextResponse.json({
      result,
      raw: rawPayload,
      elapsedMs: Date.now() - startedAt
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.name === "AbortError"
            ? `Dify workflow request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please check whether the workflow can finish within the configured timeout.`
            : error instanceof Error
            ? error.message
            : "Unexpected error while calling Dify workflow.",
        elapsedMs: Date.now() - startedAt
      },
      { status: 500 }
    );
  }
}
