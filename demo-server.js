const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;

function loadEnvFile() {
  const envPath = path.join(ROOT, ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed.slice(equalIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function resolveWorkflowUrl(apiUrl) {
  const trimmedUrl = apiUrl.trim().replace(/\/+$/, "");
  return trimmedUrl.endsWith("/workflows/run")
    ? trimmedUrl
    : `${trimmedUrl}/workflows/run`;
}

function pickWorkflowResult(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload.data || {};
  const outputs = data.outputs || {};
  const candidates = [
    outputs.text,
    outputs.result,
    data.answer,
    payload.answer,
    payload.text
  ];

  return candidates.find((item) => typeof item === "string" && item.trim()) || null;
}

async function readDifyStream(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalPayload = null;
  let lastPayload = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split(/\n\n/);
    buffer = chunks.pop() || "";

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
        const payload = JSON.parse(data);
        lastPayload = payload;

        if (payload.event === "workflow_finished") {
          finalPayload = payload;
        }
      } catch {
        lastPayload = data;
      }
    }
  }

  return finalPayload || lastPayload;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handleDify(request, response) {
  const apiUrl = process.env.DIFY_API_URL;
  const apiKey = process.env.DIFY_API_KEY;
  const timeoutMs = Number(process.env.DIFY_TIMEOUT_MS || 60000);
  const responseMode = process.env.DIFY_RESPONSE_MODE || "streaming";
  const startedAt = Date.now();

  if (!apiUrl || !apiKey || apiKey === "your_dify_api_key_here") {
    sendJson(response, 500, {
      error:
        "Dify API is not configured. Please set DIFY_API_URL and DIFY_API_KEY in .env.local.",
      elapsedMs: Date.now() - startedAt
    });
    return;
  }

  let inputs;
  try {
    inputs = await readJsonBody(request);
  } catch {
    sendJson(response, 400, { error: "Invalid JSON request body." });
    return;
  }

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

    const contentType = difyResponse.headers.get("content-type") || "";
    const rawPayload = contentType.includes("text/event-stream")
      ? await readDifyStream(difyResponse.body)
      : contentType.includes("application/json")
        ? await difyResponse.json()
        : await difyResponse.text();
    clearTimeout(timeout);

    if (!difyResponse.ok) {
      sendJson(response, difyResponse.status, {
        error: "Dify workflow request failed.",
        status: difyResponse.status,
        detail: rawPayload,
        elapsedMs: Date.now() - startedAt
      });
      return;
    }

    if (
      rawPayload &&
      typeof rawPayload === "object" &&
      rawPayload.data &&
      rawPayload.data.status === "failed"
    ) {
      sendJson(response, 500, {
        error: rawPayload.data.error || "Dify workflow finished with failed status.",
        detail: rawPayload,
        elapsedMs: Date.now() - startedAt
      });
      return;
    }

    const result =
      pickWorkflowResult(rawPayload) ||
      (typeof rawPayload === "string"
        ? rawPayload
        : JSON.stringify(rawPayload, null, 2));

    sendJson(response, 200, {
      result,
      raw: rawPayload,
      elapsedMs: Date.now() - startedAt
    });
  } catch (error) {
    sendJson(response, 500, {
      error:
        error instanceof Error && error.name === "AbortError"
          ? `Dify workflow request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please check whether the workflow can finish within the configured timeout.`
          : error instanceof Error
            ? error.message
            : "Unexpected error while calling Dify workflow.",
      elapsedMs: Date.now() - startedAt
    });
  }
}

loadEnvFile();

const server = http.createServer(async (request, response) => {
  if (request.method === "POST" && request.url === "/api/dify") {
    await handleDify(request, response);
    return;
  }

  if (request.method === "GET" && (request.url === "/" || request.url === "/index.html")) {
    const html = fs.readFileSync(path.join(ROOT, "mvp-demo.html"), "utf8");
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(html);
    return;
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

server.listen(PORT, HOST, () => {
  console.log(`MVP demo is running at http://localhost:${PORT}`);
});
