"use client";

import { FormEvent, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

type FormValues = {
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

type RunState = "idle" | "running" | "success" | "error";

const defaultValues: FormValues = {
  product_name: "4K 前后双录车载记录仪",
  marketplace: "Amazon US / 美国站",
  product_specs:
    "前摄支持 4K 录制，后摄支持 1080P 录制，3 英寸 IPS 屏幕，前摄 170° 广角，后摄 140° 视角，支持循环录制、G-Sensor 碰撞锁定、夜视、停车监控，最大支持 256GB microSD 卡。内存卡不包含在包装内。停车监控可能需要额外降压线，降压线不包含。",
  core_features:
    "4K 高清前摄、1080P 后摄、前后双录、夜视、循环录制、G-Sensor 碰撞锁定、停车监控、3 英寸屏幕、广角录制、安装便捷。",
  target_audience:
    "日常通勤车主、新手司机、网约车司机、家庭用车用户、自驾出行用户。",
  core_keywords:
    "dash cam, 4K dash cam, front and rear dash cam, dash camera for cars, night vision dash cam, loop recording dash cam, G-sensor dash cam, parking monitor dash cam",
  competitor_listing:
    "Competitor Title: 4K Dash Cam Front and Rear, Dashboard Camera for Cars with Night Vision, Loop Recording, G-Sensor, Parking Monitor, 3 Inch Screen\n\nCompetitor Bullet Points:\n\n1. Records front and rear road conditions with clear video quality.\n2. Night vision helps capture driving footage in low-light environments.\n3. Loop recording automatically overwrites old unlocked files when the card is full.\n4. Built-in G-Sensor locks important footage when sudden impact is detected.\n5. Parking monitor helps record unexpected events when the vehicle is parked.",
  review_pain_points:
    "部分用户反馈夜间画面不够清晰，后摄像头布线比较麻烦，停车监控需要额外配件但页面说明不够清楚，内存卡不包含容易产生误解，安装说明不够直观。",
  brand_tone: "专业、可靠、简洁、实用、有科技感。"
};

const fields: Array<{
  key: keyof FormValues;
  label: string;
  type?: "input" | "textarea";
  rows?: number;
}> = [
  { key: "product_name", label: "产品名称", type: "input" },
  { key: "marketplace", label: "目标站点", type: "input" },
  { key: "product_specs", label: "产品参数", rows: 5 },
  { key: "core_features", label: "核心功能", rows: 4 },
  { key: "target_audience", label: "目标用户", rows: 3 },
  { key: "core_keywords", label: "核心关键词", rows: 4 },
  { key: "competitor_listing", label: "竞品 Listing", rows: 8 },
  { key: "review_pain_points", label: "用户评论痛点", rows: 4 },
  { key: "brand_tone", label: "品牌语气", rows: 3 }
];

function formatElapsed(ms: number | null) {
  if (ms === null) {
    return "--";
  }

  if (ms < 1000) {
    return `${ms} ms`;
  }

  return `${(ms / 1000).toFixed(1)} s`;
}

export default function Home() {
  const [formValues, setFormValues] = useState<FormValues>(defaultValues);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [runState, setRunState] = useState<RunState>("idle");
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const statusLabel = useMemo(() => {
    const labels: Record<RunState, string> = {
      idle: "待运行",
      running: "运行中",
      success: "已完成",
      error: "失败"
    };

    return labels[runState];
  }, [runState]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunState("running");
    setError("");
    setCopied(false);
    setElapsedMs(null);

    const startedAt = performance.now();

    try {
      const response = await fetch("/api/dify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formValues)
      });

      const payload = await response.json();
      const clientElapsed = Math.round(performance.now() - startedAt);
      setElapsedMs(
        typeof payload.elapsedMs === "number" ? payload.elapsedMs : clientElapsed
      );

      if (!response.ok) {
        const detail =
          typeof payload.detail === "string"
            ? payload.detail
            : payload.detail
              ? JSON.stringify(payload.detail, null, 2)
              : "";
        throw new Error(
          [payload.error ?? "请求失败，请检查 Dify 配置。", detail]
            .filter(Boolean)
            .join("\n\n")
        );
      }

      setResult(payload.result ?? JSON.stringify(payload, null, 2));
      setRunState("success");
    } catch (requestError) {
      setRunState("error");
      setResult("");
      setElapsedMs(Math.round(performance.now() - startedAt));
      setError(
        requestError instanceof Error
          ? requestError.message
          : "调用 Dify Workflow API 时发生未知错误。"
      );
    }
  }

  async function handleCopy() {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="page-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">DashCam Amazon Listing AI Workflow Demo</p>
          <h1>车载记录仪 Amazon Listing AI 优化助手</h1>
          <p className="subtitle">
            输入产品参数、核心功能、关键词、竞品 Listing 和用户评论痛点，系统会调用 Dify 工作流，自动生成 Listing 初稿，并进行关键词覆盖和合规风险检查，最终输出一版可供运营参考的 Amazon Listing。
          </p>
        </div>
      </header>

      <section className="workspace" aria-label="Listing workflow demo">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <div>
              <h2>产品输入</h2>
              <p>已预填一组测试数据，可直接运行。</p>
            </div>
          </div>

          <div className="field-grid">
            {fields.map((field) => (
              <label className="field" key={field.key}>
                <span>{field.label}</span>
                {field.type === "input" ? (
                  <input
                    value={formValues[field.key]}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        [field.key]: event.target.value
                      }))
                    }
                  />
                ) : (
                  <textarea
                    rows={field.rows}
                    value={formValues[field.key]}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        [field.key]: event.target.value
                      }))
                    }
                  />
                )}
              </label>
            ))}
          </div>

          <div className="button-row">
            <button
              className="primary-button"
              type="submit"
              disabled={runState === "running"}
            >
              {runState === "running" ? "生成中..." : "生成 Listing"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormValues(defaultValues);
                setError("");
              }}
              disabled={runState === "running"}
            >
              恢复测试数据
            </button>
            <button
              type="button"
              onClick={() => {
                setResult("");
                setError("");
                setRunState("idle");
                setElapsedMs(null);
              }}
              disabled={runState === "running"}
            >
              清空结果
            </button>
          </div>
        </form>

        <section className="panel result-panel">
          <div className="result-toolbar">
            <div className="status-group">
              <span className={`status-dot ${runState}`} aria-hidden="true" />
              <div>
                <h2>输出结果</h2>
                <p>
                  运行状态：{statusLabel} · 运行耗时：{formatElapsed(elapsedMs)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!result || runState === "running"}
            >
              {copied ? "已复制" : "复制结果"}
            </button>
          </div>

          {error ? (
            <div className="error-box" role="alert">
              <strong>调用失败</strong>
              <pre>{error}</pre>
            </div>
          ) : null}

          <div className="markdown-body">
            {runState === "running" ? (
              <div className="empty-state">Dify 工作流正在运行，请稍候...</div>
            ) : result ? (
              <ReactMarkdown>{result}</ReactMarkdown>
            ) : (
              <div className="empty-state">
                点击“生成 Listing”后，这里会展示 Dify 返回的 Markdown 结果。
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
