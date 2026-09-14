"use client";

import { useLanguage } from "@/contexts/LanguageContext";

const GITHUB_URL = "https://github.com/BenchCouncil/BenchCPU";

const ENV_SETUP_COMMAND = `# Environment setup
sudo apt-get update
sudo apt-get install -y python3 python3-venv python3-pip gcc g++ clang openjdk-17-jdk
pip3 install pyyaml

# Go (x86_64) - adapt for ARM64
wget https://go.dev/dl/go1.24.5.linux-amd64.tar.gz -O /tmp/go.tar.gz \
    && sudo tar -C /usr/local -xzf /tmp/go.tar.gz \
    && echo 'export PATH=/usr/local/go/bin:$PATH' | sudo tee /etc/profile.d/go.sh

# perf
sudo apt-get install -y linux-perf || sudo apt-get install -y perf`;

const CLONE_COMMAND = `# Clone BenchCPU
git clone https://github.com/BenchCouncil/BenchCPU.git
cd BenchCPU`;

const QUICK_RUN_COMMAND = `# Setup and run a pair of workloads with override param
python3 scripts/run_cpu.py --workloads numpy_benchmark.matmul ffmpeg_benchmark.ffmpeg \
    --setup-env --set-param numpy_benchmark.matmul.workload.size=2048 --verbose`;

const FULL_RUN_COMMAND = `# CPU Bench full preset suite
python3 run_v_0_0_1.py --config configs/benchcpu-config-2026-08.json --tag tag_name`;

export default function DownloadPage() {
    const { lang } = useLanguage();

    const isZh = lang === "zh";

    const content = isZh
        ? {
            title: "BenchCPU 快速开始",
            step1Title: "1. 下载 BenchCPU 基准测试程序和配置文件并运行",
            step1Text: "先准备基础环境，再获取 BenchCPU 源码。可以先运行少量 workload 验证环境，也可以使用发布配置文件运行完整 preset suite。",
            repoLabel: "GitHub 下载源码",
            envTitle: "环境准备",
            cloneTitle: "获取源码",
            quickRunTitle: "试运行两个 workload",
            fullRunTitle: "使用发布配置运行完整 suite",
            fullRunText: "BenchCPU 委员会会在每个发布周期公开发布一轮配置样本。配置样本文件位于 BenchCPU GitHub 仓库的 configs 文件夹。",
            step2Title: "2. 提交结果",
            step2Text: "评测完成后，请将 BenchCPU 自动采集的结果文件夹 res 和 log 提交至 BenchCPU 委员会。",
        }
        : {
            title: "BenchCPU Quick Start",
            step1Title: "1. Download BenchCPU, fetch configuration files, and run",
            step1Text: "Prepare the base environment, then fetch the BenchCPU source code. You can run a small workload pair to verify the setup, or run the full preset suite with the published configuration file.",
            repoLabel: "GitHub Download",
            envTitle: "Environment setup",
            cloneTitle: "Get the source code",
            quickRunTitle: "Smoke-test two workloads",
            fullRunTitle: "Run the full suite with a published config",
            fullRunText: "The BenchCPU Committee publicly releases one round of configuration samples each release cycle. Configuration files are stored in the configs folder of the BenchCPU GitHub repository.",
            step2Title: "2. Submit results",
            step2Text: "After evaluation, submit the res and log folders automatically collected by BenchCPU to the BenchCPU Committee.",
        };

    const codeStyle = {
        margin: "10px 0 0",
        padding: "14px 16px",
        overflowX: "auto" as const,
        maxWidth: "100%",
        boxSizing: "border-box" as const,
        whiteSpace: "pre-wrap" as const,
        overflowWrap: "anywhere" as const,
        borderRadius: 12,
        background: "#0f172a",
        color: "#e2e8f0",
        fontSize: 13,
        lineHeight: 1.6,
    };

    const subTitleStyle = { margin: "18px 0 8px", fontSize: 15, color: "#0f172a", fontWeight: 850 };
    const panelStyle = { padding: "18px 20px", minWidth: 0, borderRadius: 16, background: "#f8fafc", border: "1px solid rgba(148,163,184,0.2)" };

    return (
        <main style={{ maxWidth: 1040, margin: "28px auto", padding: "0 20px 48px", minWidth: 0 }}>
            <div
                style={{
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(15,23,42,0.08)",
                    borderRadius: 20,
                    boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
                    padding: "26px 28px 24px",
                    minWidth: 0,
                }}
            >
                <header
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 18,
                        flexWrap: "wrap",
                        margin: "0 0 22px",
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "clamp(30px, 4vw, 46px)",
                            lineHeight: 1.08,
                            letterSpacing: "-0.03em",
                            color: "#0f172a",
                        }}
                    >
                        {content.title}
                    </h1>
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-start", gap: 12 }}>
                        <a
                            href={GITHUB_URL}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: "inline-block",
                                textDecoration: "none",
                                color: "#fff",
                                background: "linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)",
                                padding: "9px 15px",
                                borderRadius: 10,
                                fontSize: 15,
                                fontWeight: 800,
                            }}
                        >
                            {content.repoLabel}
                        </a>
                    </div>
                </header>

                <section style={{ display: "grid", gap: 18, minWidth: 0 }}>
                    <div style={panelStyle}>
                        <h2 style={{ margin: "0 0 10px", fontSize: 22, color: "#0f172a" }}>{content.step1Title}</h2>
                        <p style={{ margin: "0 0 14px", fontSize: 16, lineHeight: 1.7, color: "#334155" }}>{content.step1Text}</p>

                        <h3 style={subTitleStyle}>{content.envTitle}</h3>
                        <pre style={codeStyle}><code>{ENV_SETUP_COMMAND}</code></pre>

                        <h3 style={subTitleStyle}>{content.cloneTitle}</h3>
                        <pre style={codeStyle}><code>{CLONE_COMMAND}</code></pre>

                        <h3 style={subTitleStyle}>{content.quickRunTitle}</h3>
                        <pre style={codeStyle}><code>{QUICK_RUN_COMMAND}</code></pre>

                        <h3 style={subTitleStyle}>{content.fullRunTitle}</h3>
                        <p style={{ margin: "0 0 10px", fontSize: 16, lineHeight: 1.7, color: "#334155" }}>{content.fullRunText}</p>
                        <pre style={codeStyle}><code>{FULL_RUN_COMMAND}</code></pre>
                    </div>

                    <div style={panelStyle}>
                        <h2 style={{ margin: "0 0 10px", fontSize: 22, color: "#0f172a" }}>{content.step2Title}</h2>
                        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: "#334155" }}>{content.step2Text}</p>
                    </div>
                </section>

            </div>
        </main>
    );
}
