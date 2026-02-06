import Image from "next/image";

export default function ExploreOverviewPage() {
  const src = "/explore/overview.png"; // public/explore/overview.png

  return (
    <main style={{ padding: "24px 32px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>
            Explore · Overview
          </h1>
          <div style={{ marginTop: 8, color: "rgba(15,23,42,0.65)", fontSize: 13 }}>
            Figure: {src}
          </div>
        </div>

        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          style={{
            border: "1px solid rgba(15,23,42,0.12)",
            background: "#fff",
            height: 38,
            padding: "0 14px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: 750,
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            color: "rgba(15,23,42,0.92)",
            boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
          }}
        >
          Open PNG
        </a>
      </div>

      <div
        style={{
          marginTop: 18,
          width: "100%",
          maxWidth: 1200,
          borderRadius: 14,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          border: "1px solid rgba(15,23,42,0.08)",
        }}
      >
        <Image
          src={src}
          alt="Overview"
          width={2000}
          height={1200}
          priority
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>
    </main>
  );
}
