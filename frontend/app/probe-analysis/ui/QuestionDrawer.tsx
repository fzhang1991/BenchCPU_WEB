"use client";

import styles from "../ProbeAnalysis.module.css";

export type DrawerContentStub = {
  title: string;
  content: string;
};

type ParsedSections = {
  question: string;
  groundTruth: string;
  probeProperties: Array<{ key: string; value: string }>;
  correctModels: string[];
  wrongModels: string[];
  error: string;
  others: Array<{ title: string; body: string }>;
};

function parseSections(content: string): ParsedSections {
  const out: ParsedSections = {
    question: "",
    groundTruth: "",
    probeProperties: [],
    correctModels: [],
    wrongModels: [],
    error: "",
    others: [],
  };

  const blocks = content
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n");
    const rawTitle = (lines[0] ?? "").trim();
    const body = lines.slice(1).join("\n").trim();

    const m = rawTitle.match(/^【(.+?)】$/);
    if (!m) {
      out.others.push({ title: "", body: block });
      continue;
    }

    const title = m[1];

    if (title === "Question") {
      out.question = body;
      continue;
    }

    if (title === "Ground Truth") {
      out.groundTruth = body;
      continue;
    }

    if (title === "Probe Properties") {
      const props = body
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((line) => {
          const mm = line.match(/^[•\-]\s*(.+?)\s*:\s*(.+)$/);
          if (!mm) return null;
          return { key: mm[1].trim(), value: mm[2].trim() };
        })
        .filter(Boolean) as Array<{ key: string; value: string }>;
      out.probeProperties = props;
      continue;
    }

    if (title === "Correct Models") {
      out.correctModels = body
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
        .filter((x) => x.toLowerCase() !== "none");
      continue;
    }

    if (title === "Wrong Models") {
      out.wrongModels = body
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
        .filter((x) => x.toLowerCase() !== "none");
      continue;
    }

    if (title === "Error") {
      out.error = body;
      continue;
    }

    out.others.push({ title, body });
  }

  return out;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: "0.02em",
        color: "rgb(29, 78, 216)",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function Surface(props: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        border: "1px solid rgba(15,23,42,0.08)",
        borderRadius: 16,
        background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96))",
        boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
        padding: "16px 18px",
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}

function ModelChip({ text, kind }: { text: string; kind: "good" | "bad" }) {
  const isGood = kind === "good";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        lineHeight: 1.2,
        fontWeight: 700,
        border: isGood ? "1px solid rgba(22,163,74,0.16)" : "1px solid rgba(220,38,38,0.16)",
        background: isGood ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
        color: isGood ? "rgb(21,128,61)" : "rgb(185,28,28)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

export default function QuestionDrawer(props: {
  open: boolean;
  data: DrawerContentStub | null;
  onClose: () => void;
}) {
  const { open, data, onClose } = props;
  if (!open || !data) return null;

  const parsed = parseSections(data.content);

  return (
    <div className={styles.drawerMask} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div
          className={styles.drawerHeader}
          style={{
            borderBottom: "1px solid rgba(15,23,42,0.08)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94))",
          }}
        >
          <div>
            <div className={styles.drawerTitle}>{data.title}</div>
            <div className={styles.muted}>Probe-level detail view</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>

        <div
          className={styles.drawerBody}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: "radial-gradient(circle at top right, rgba(59,130,246,0.05), transparent 28%), white",
          }}
        >
          {parsed.error ? (
            <Surface
              style={{
                border: "1px solid rgba(220,38,38,0.16)",
                background: "rgba(254,242,242,0.9)",
              }}
            >
              <SectionTitle>Error</SectionTitle>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.65,
                  color: "rgb(127,29,29)",
                  fontSize: 14,
                }}
              >
                {parsed.error}
              </div>
            </Surface>
          ) : null}

          {parsed.question ? (
            <Surface>
              <SectionTitle>Question</SectionTitle>
              <div
                style={{
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: "rgba(15,23,42,0.92)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {parsed.question}
              </div>
            </Surface>
          ) : null}

          {parsed.groundTruth ? (
            <Surface
              style={{
                border: "1px solid rgba(59,130,246,0.12)",
                background: "linear-gradient(180deg, rgba(239,246,255,0.95), rgba(248,250,252,0.96))",
              }}
            >
              <SectionTitle>Ground Truth</SectionTitle>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "rgba(15,23,42,0.88)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {parsed.groundTruth}
              </div>
            </Surface>
          ) : null}

          {parsed.probeProperties.length > 0 ? (
            <Surface>
              <SectionTitle>Probe Properties</SectionTitle>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 10,
                }}
              >
                {parsed.probeProperties.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      borderRadius: 14,
                      padding: "12px 12px 10px",
                      background: "rgba(59,130,246,0.06)",
                      border: "1px solid rgba(59,130,246,0.10)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(15,23,42,0.56)",
                        fontWeight: 700,
                        marginBottom: 6,
                      }}
                    >
                      {item.key}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        lineHeight: 1.1,
                        fontWeight: 800,
                        color: "rgb(30,41,59)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </Surface>
          ) : null}

          {(parsed.correctModels.length > 0 || parsed.wrongModels.length > 0) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                alignItems: "stretch",
              }}
            >
              <Surface
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 330,
                }}
              >
                <SectionTitle>Correct Models</SectionTitle>
                <div
                  style={{
                    marginBottom: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "rgba(15,23,42,0.56)",
                  }}
                >
                  Count: {parsed.correctModels.length}
                </div>

                {parsed.correctModels.length === 0 ? (
                  <div className={styles.muted}>None</div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      flex: 1,
                      minHeight: 240,
                      maxHeight: 340,
                      overflowY: "auto",
                      alignContent: "flex-start",
                      paddingRight: 4,
                    }}
                  >
                    {parsed.correctModels.map((m) => (
                      <ModelChip key={`good-${m}`} text={m} kind="good" />
                    ))}
                  </div>
                )}
              </Surface>

              <Surface
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 330,
                }}
              >
                <SectionTitle>Wrong Models</SectionTitle>
                <div
                  style={{
                    marginBottom: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "rgba(15,23,42,0.56)",
                  }}
                >
                  Count: {parsed.wrongModels.length}
                </div>

                {parsed.wrongModels.length === 0 ? (
                  <div className={styles.muted}>None</div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      flex: 1,
                      minHeight: 240,
                      maxHeight: 340,
                      overflowY: "auto",
                      alignContent: "flex-start",
                      paddingRight: 4,
                    }}
                  >
                    {parsed.wrongModels.map((m) => (
                      <ModelChip key={`bad-${m}`} text={m} kind="bad" />
                    ))}
                  </div>
                )}
              </Surface>
            </div>
          )}

          {parsed.others.map((sec, idx) => (
            <Surface key={`${sec.title}-${idx}`}>
              {sec.title ? <SectionTitle>{sec.title}</SectionTitle> : null}
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.65,
                  color: "rgba(15,23,42,0.9)",
                  fontSize: 14,
                }}
              >
                {sec.body}
              </div>
            </Surface>
          ))}
        </div>
      </div>
    </div>
  );
}