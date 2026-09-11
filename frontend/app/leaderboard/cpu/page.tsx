"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CpuDetailPanel from "../ui/CpuDetailPanel";
import CpuFullDetailPanel from "../ui/CpuFullDetailPanel";

function CpuDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const cpu = searchParams.get("cpu");
    const full = searchParams.get("full") === "1";

    if (full) {
        return (
            <CpuFullDetailPanel
                cpu={cpu}
                standalone
                onClose={() => router.push("/leaderboard")}
            />
        );
    }

    return (
        <CpuDetailPanel
            cpu={cpu}
            standalone
            onClose={() => router.push("/leaderboard")}
        />
    );
}

export default function CpuDetailPage() {
    return (
        <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>}>
            <CpuDetailContent />
        </Suspense>
    );
}