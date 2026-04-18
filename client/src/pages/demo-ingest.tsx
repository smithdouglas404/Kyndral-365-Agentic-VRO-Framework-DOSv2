import { useState } from "react";
import { sampleSafeProject } from "@/data/sampleProject";

interface AgentAction {
  agent: string;
  tool?: string;
  status: string;
  output?: any;
  error?: string;
}

interface IngestResponse {
  success: boolean;
  projectId: string;
  message: string;
  ingest?: {
    projectId: string;
    created: Record<string, number>;
    warnings: string[];
  };
  agentActions: AgentAction[];
}

export default function DemoIngestPage() {
  const [json, setJson] = useState<string>(JSON.stringify(sampleSafeProject, null, 2));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestResponse | null>(null);

  const loadSample = () => {
    setJson(JSON.stringify(sampleSafeProject, null, 2));
    setError(null);
    setResult(null);
  };

  const ingest = async () => {
    setError(null);
    setResult(null);
    let payload: any;
    try {
      payload = JSON.parse(json);
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/projects/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || `HTTP ${res.status}`);
      } else {
        setResult(body);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const pmoActions = (result?.agentActions || []).filter((a) => a.agent === "DeepPMO");
  const vroActions = (result?.agentActions || []).filter((a) => a.agent === "DeepVRO");
  const otherActions = (result?.agentActions || []).filter(
    (a) => a.agent !== "DeepPMO" && a.agent !== "DeepVRO"
  );

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 1400, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 4 }} data-testid="text-page-title">
        Project Ingest → Live Agent Insights
      </h1>
      <p style={{ color: "#666", marginTop: 0 }} data-testid="text-page-subtitle">
        Upload a SAFe project to Palantir Foundry. PMO and VRO agents analyze it end-to-end with real data — zero mocks.
      </p>

      <section style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>1. Project Payload</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={loadSample} style={btnStyle("ghost")} data-testid="button-load-sample">
              Load Sample Project
            </button>
            <button
              onClick={ingest}
              disabled={busy}
              style={btnStyle("primary", busy)}
              data-testid="button-ingest"
            >
              {busy ? "Ingesting…" : "Ingest into Palantir"}
            </button>
          </div>
        </div>
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          spellCheck={false}
          style={{
            width: "100%",
            height: 320,
            fontFamily: "monospace",
            fontSize: 12,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 6,
          }}
          data-testid="input-project-json"
        />
      </section>

      {error && (
        <div style={{ ...cardStyle, background: "#fff5f5", border: "1px solid #fbb" }} data-testid="text-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <>
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Ingest Result</h2>
            <div data-testid="text-project-id">
              <strong>Project ID:</strong> <code>{result.projectId}</code>
            </div>
            {result.ingest && (
              <>
                <div style={{ marginTop: 8 }} data-testid="text-ingest-counts">
                  <strong>Objects created in Palantir:</strong>{" "}
                  {Object.entries(result.ingest.created)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" • ")}
                </div>
                {result.ingest.warnings.length > 0 && (
                  <details style={{ marginTop: 8 }} data-testid="details-ingest-warnings">
                    <summary>{result.ingest.warnings.length} warning(s)</summary>
                    <ul>
                      {result.ingest.warnings.map((w, i) => (
                        <li key={i} style={{ fontSize: 12, color: "#a55" }}>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            )}
          </section>

          <AgentPanel title="2. PMO Agent — Live Insights" actions={pmoActions} testId="panel-pmo" />
          <AgentPanel title="3. VRO Agent — Live Insights" actions={vroActions} testId="panel-vro" />

          {otherActions.length > 0 && (
            <AgentPanel title="Other Agent Activity" actions={otherActions} testId="panel-other" />
          )}
        </>
      )}
    </div>
  );
}

function AgentPanel({
  title,
  actions,
  testId,
}: {
  title: string;
  actions: AgentAction[];
  testId: string;
}) {
  return (
    <section style={cardStyle} data-testid={testId}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {actions.length === 0 && <div style={{ color: "#888" }}>No activity returned.</div>}
      {actions.map((a, i) => (
        <div
          key={i}
          style={{
            border: "1px solid #eee",
            borderRadius: 6,
            padding: 12,
            marginBottom: 10,
            background: a.status === "failed" ? "#fff5f5" : "#fafafa",
          }}
          data-testid={`card-action-${a.agent}-${a.tool || i}`}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <strong data-testid={`text-tool-${a.agent}-${a.tool || i}`}>
              {a.tool || a.agent}
            </strong>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 10,
                background:
                  a.status === "completed" ? "#d4f5d4" : a.status === "failed" ? "#fcd4d4" : "#eee",
                color: "#222",
              }}
              data-testid={`status-${a.agent}-${a.tool || i}`}
            >
              {a.status}
            </span>
          </div>
          {a.error && (
            <div style={{ color: "#a33", fontSize: 12, marginBottom: 6 }} data-testid={`text-error-${a.tool || i}`}>
              {a.error}
            </div>
          )}
          {a.output && (
            <details>
              <summary style={{ cursor: "pointer", fontSize: 12, color: "#555" }}>
                View output
              </summary>
              <pre
                style={{
                  fontSize: 11,
                  background: "#fff",
                  padding: 8,
                  borderRadius: 4,
                  overflow: "auto",
                  maxHeight: 360,
                  marginTop: 6,
                }}
                data-testid={`pre-output-${a.tool || i}`}
              >
                {JSON.stringify(a.output, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ))}
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e3e3e3",
  borderRadius: 8,
  padding: 16,
  marginTop: 16,
};

function btnStyle(variant: "primary" | "ghost", disabled = false): React.CSSProperties {
  if (disabled) {
    return {
      padding: "8px 16px",
      borderRadius: 6,
      border: "1px solid #ccc",
      background: "#eee",
      color: "#888",
      cursor: "not-allowed",
    };
  }
  if (variant === "primary") {
    return {
      padding: "8px 16px",
      borderRadius: 6,
      border: "1px solid #1a73e8",
      background: "#1a73e8",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 600,
    };
  }
  return {
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid #ccc",
    background: "#fff",
    color: "#333",
    cursor: "pointer",
  };
}
