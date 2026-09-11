"use client";

import { useEffect, useState, useMemo } from "react";

type Props = {
    cpu: string | null;
    onClose: () => void;
    standalone?: boolean;
};

function flattenConfig(obj: Record<string, unknown>, prefix = ""): [string, string][] {
    const pairs: [string, string][] = [];
    for (const [key, value] of Object.entries(obj)) {
        const displayKey = prefix ? `${prefix} - ${key}` : key;
        if (value === null || value === undefined) {
            pairs.push([displayKey, "—"]);
        } else if (Array.isArray(value)) {
            pairs.push([displayKey, value.join(", ")]);
        } else if (typeof value === "object") {
            pairs.push(...flattenConfig(value as Record<string, unknown>, displayKey));
        } else if (typeof value === "boolean") {
            pairs.push([displayKey, value ? "Yes" : "No"]);
        } else {
            pairs.push([displayKey, String(value)]);
        }
    }
    return pairs;
}

function categorizeConfig(config: Record<string, unknown>): Record<string, [string, string][]> {
    const categories: Record<string, [string, string][]> = {
        "CPU": [],
        "Memory": [],
        "Storage": [],
        "Software": [],
        "System": [],
    };

    const pairs = flattenConfig(config);
    for (const [key, value] of pairs) {
        const keyLower = key.toLowerCase();
        if (keyLower.includes("cpu") || keyLower.includes("processor") || keyLower.includes("core") ||
            keyLower.includes("cache") || keyLower.includes("frequency") || keyLower.includes("mhz") || keyLower.includes("ghz")) {
            categories["CPU"].push([key, value]);
        } else if (keyLower.includes("memory") || keyLower.includes("ram") || keyLower.includes("mem") ||
            keyLower.includes("kb") || keyLower.includes("mb") || keyLower.includes("gb")) {
            categories["Memory"].push([key, value]);
        } else if (keyLower.includes("disk") || keyLower.includes("storage") || keyLower.includes("ssd") || keyLower.includes("nvme")) {
            categories["Storage"].push([key, value]);
        } else if (keyLower.includes("os") || keyLower.includes("system") || keyLower.includes("linux") ||
            keyLower.includes("windows") || keyLower.includes("kernel") || keyLower.includes("compiler") ||
            keyLower.includes("file system")) {
            categories["Software"].push([key, value]);
        } else {
            categories["System"].push([key, value]);
        }
    }
    return categories;
}

function ConfigTable({ pairs }: { pairs: [string, string][] }) {
    if (pairs.length === 0) return null;
    return (
        <div style={{ overflowX: "auto", borderRadius: 6, border: "1px solid #e2e8f0" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
                <tbody>
                    {pairs.map(([key, value], i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                            <td style={{ padding: "9px 12px", borderBottom: "1px solid #e2e8f0", fontWeight: 600, color: "#0f172a", width: "40%", wordBreak: "break-word" }}>{key}</td>
                            <td style={{ padding: "9px 12px", borderBottom: "1px solid #e2e8f0", color: "#475569", wordBreak: "break-all" }}>{value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function SystemConfigTable({ config }: { config: Record<string, unknown> }) {
    const categories = useMemo(() => categorizeConfig(config), [config]);
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {Object.entries(categories).map(([category, pairs]) =>
                pairs.length > 0 ? (
                    <div key={category}>
                        <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>{category}</h4>
                        <ConfigTable pairs={pairs} />
                    </div>
                ) : null
            )}
        </div>
    );
}

function formatOverviewLabel(rawKey: string): string {
    const key = rawKey.replace(/^hardware\s*-\s*/i, "").replace(/^software\s*-\s*/i, "")
        .replace(/^cpu\s*-\s*/i, "").replace(/^system\s*-\s*/i, "").trim();
    if (!key) return rawKey;
    return key.charAt(0).toUpperCase() + key.slice(1);
}

function buildOverviewColumns(config: Record<string, unknown> | undefined): {
    hardware: [string, string][];
    software: [string, string][];
} {
    if (!config) return { hardware: [], software: [] };

    const pairs = flattenConfig(config);
    const hardware: [string, string][] = [];
    const software: [string, string][] = [];
    const seen = new Set<string>();

    const manufacturer = pairs.find(([k]) => k.toLowerCase().includes("dmi_system - manufacturer"))?.[1]?.toString().trim() ?? "";
    const productNameRaw = pairs.find(([k]) => k.toLowerCase().includes("dmi_system - product name"))?.[1]?.toString().trim() ?? "";
    const productName = productNameRaw.replace(/\s*\([^)]*\)\s*$/g, "").trim();
    const systemSummary = [manufacturer, productName].filter(Boolean).join(" ").trim();

    const hardwareHints = ["system - summary", "cpu -", "memory", "ram", "cache", "socket", "core", "thread", "storage", "disk", "ssd", "nvme", "manufacturer", "vendor", "product"];
    const softwareHints = ["software -", "os", "kernel", "compiler", "firmware", "bios", "file system", "system state", "pointers", "power management", "jemalloc", "library"];

    const hardwareRank = (keyLower: string): number => {
        if (keyLower.includes("system - summary")) return 0;
        if (keyLower.includes("cpu - cpu(s)")) return 1;
        if (keyLower.includes("cpu - thread(s) per core")) return 2;
        if (keyLower.includes("cpu - core(s) per socket")) return 3;
        if (keyLower.includes("cpu - socket(s)")) return 4;
        if (keyLower.includes("l1d cache")) return 5;
        if (keyLower.includes("l1i cache")) return 6;
        if (keyLower.includes("l2 cache")) return 7;
        if (keyLower.includes("l3 cache")) return 8;
        if (keyLower.includes("memory")) return 9;
        return 100;
    };

    const softwareRank = (keyLower: string): number => {
        if (keyLower.includes("software - os") || keyLower === "os") return 0;
        if (keyLower.includes("software - compiler") || keyLower.includes("compiler")) return 1;
        if (keyLower.includes("firmware") || keyLower.includes("bios")) return 2;
        if (keyLower.includes("file system")) return 3;
        if (keyLower.includes("system state")) return 4;
        if (keyLower.includes("base pointers")) return 5;
        if (keyLower.includes("peak pointers")) return 6;
        if (keyLower.includes("power management")) return 7;
        return 100;
    };

    const hardwareRaw: [string, string][] = [];
    const softwareRaw: [string, string][] = [];

    for (const [key, value] of pairs) {
        const keyLower = key.toLowerCase();
        if (keyLower.includes("dmi_system - manufacturer") || keyLower.includes("dmi_system - product name")) continue;
        const dedupeKey = `${keyLower}::${value}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const isSoftware = softwareHints.some((h) => keyLower.includes(h));
        const isHardware = hardwareHints.some((h) => keyLower.includes(h));
        if (isSoftware) softwareRaw.push([key, value]);
        else if (isHardware) hardwareRaw.push([key, value]);
    }

    if (systemSummary) hardware.push(["System", systemSummary]);

    hardwareRaw.sort((a, b) => hardwareRank(a[0].toLowerCase()) - hardwareRank(b[0].toLowerCase()))
        .slice(0, 10).forEach(([k, v]) => hardware.push([formatOverviewLabel(k), v]));

    softwareRaw.filter(([k]) => /_version(?:\s*-\s*0)?$/i.test(k.toLowerCase()))
        .sort((a, b) => softwareRank(a[0].toLowerCase()) - softwareRank(b[0].toLowerCase()))
        .forEach(([k, v]) => software.push([formatOverviewLabel(k), v]));

    return { hardware, software };
}

function OverviewColumnTable({ rows }: { rows: [string, string][] }) {
    if (rows.length === 0) return <div style={{ color: "#64748b", fontSize: 11, padding: "6px 0" }}>No data</div>;
    return (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <tbody>
                {rows.map(([label, value], idx) => (
                    <tr key={`${label}-${idx}`}>
                        <td style={{ width: "42%", verticalAlign: "top", padding: "4px 8px 4px 0", color: "#475569", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>{label}</td>
                        <td style={{ verticalAlign: "top", padding: "4px 0", color: "#0f172a", borderBottom: "1px solid #e2e8f0", wordBreak: "break-word" }}>{value}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default function CpuDetailPanel({ cpu, onClose, standalone = false }: Props) {
    const [systemInfo, setSystemInfo] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!cpu) return;
        let cancelled = false;

        queueMicrotask(() => {
            if (cancelled) return;
            setLoading(true);
            setError(null);
        });

        fetch(`/backend/api/cpu-system-info?cpu=${encodeURIComponent(cpu)}`)
            .then((r) => r.json())
            .then((sysInfo) => {
                if (!cancelled) setSystemInfo(sysInfo.data ?? null);
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message || "Failed to load CPU details");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [cpu]);

    const overviewColumns = useMemo(() => buildOverviewColumns(systemInfo ?? undefined), [systemInfo]);

    if (!cpu) {
        return standalone ? (
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 18px" }}>
                <div style={{ color: "#64748b", fontSize: 13 }}>No CPU selected.</div>
            </div>
        ) : null;
    }

    const panelBody = (
        <div
            style={{
                background: "#fff", borderRadius: 12, padding: 28,
                maxWidth: standalone ? 960 : "95vw", maxHeight: standalone ? "none" : "88vh",
                overflow: "auto", minWidth: standalone ? "auto" : 620,
                boxShadow: standalone ? "0 8px 30px rgba(0,0,0,0.08)" : "0 20px 60px rgba(0,0,0,0.22)",
                border: standalone ? "1px solid #e2e8f0" : "none",
                margin: standalone ? "0 auto" : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24, borderBottom: "2px solid #e2e8f0", paddingBottom: 16 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{cpu}</h2>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>System Information</p>
                </div>
                <button type="button" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 24, padding: "0 8px", color: "#94a3b8" }} aria-label="Close">✕</button>
            </div>

            {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>
            ) : error ? (
                <div style={{ padding: 20, background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: 13 }}>Error: {error}</div>
            ) : systemInfo ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Overview: Hardware + Software */}
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
                        <h3 style={{ margin: "0 0 12px 0", fontSize: 13, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>Overview</h3>
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                            <div style={{ flex: "1 1 280px", minWidth: 260, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", padding: 10 }}>
                                <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 700, color: "#0f172a", textTransform: "uppercase" }}>Hardware</div>
                                <OverviewColumnTable rows={overviewColumns.hardware} />
                            </div>
                            <div style={{ flex: "1 1 280px", minWidth: 260, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", padding: 10 }}>
                                <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 700, color: "#0f172a", textTransform: "uppercase" }}>Software</div>
                                <OverviewColumnTable rows={overviewColumns.software} />
                            </div>
                        </div>
                    </div>

                    {/* System Configuration Details */}
                    <div>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>System Configuration Details</h3>
                        <p style={{ margin: "0 0 12px 0", fontSize: 12, color: "#64748b" }}>Comprehensive hardware and software configuration information</p>
                        <SystemConfigTable config={systemInfo} />
                    </div>
                </div>
            ) : (
                <div style={{ padding: 20, color: "#64748b", textAlign: "center" }}>No data available for this CPU.</div>
            )}
        </div>
    );

    if (standalone) {
        return <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 18px" }}>{panelBody}</div>;
    }

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
            {panelBody}
        </div>
    );
}