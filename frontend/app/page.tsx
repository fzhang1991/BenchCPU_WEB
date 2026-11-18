"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import styles from "./Home.module.css";
import { useLanguage } from "@/contexts/LanguageContext";

const EN = { "title": "BenchCPU", "subtitle": "BenchCPU Run and Reporting Rules — Version 1.0, August 2026. For any questions, please contact us by email at benchcpu_feedback@benchcouncil.cn.", "warning": "These rules are established based on the Evaluatology methodology [1] to define CPU performance ranking standards. The rules may be revised from time to time; all tests must comply with the latest version published as of the date of testing. ", "figCaption": "The methodology of BenchCPU.", "p1Title": "Part 1: Configuration Space & Statistical Methods", "s1_1Title": "1.1 From Static Configuration to Open Configuration Space", "s1_1a": "The purpose of BenchCPU is to further the cause of fair, objective, and statistically rigorous CPU benchmarking. Traditional CPU benchmarks have relied on a <b>static workload configurations</b> paradigm — binding representative workloads to fixed datasets and specific concurrency levels to report a single aggregate score. In the era of heterogeneous multi-core architectures and rapidly evolving applications, CPU performance is profoundly sensitive to evaluation configurations: fixed configurations mask an average of 20% performance gap, and frequently produce statistically biased evaluation results that deviate starkly from a CPU's true performance distribution.", "s1_1b": "BenchCPU addresses these limitations by decoupling benchmarks into multiple orthogonal, extensible dimensions, constructing an <b>open configuration space</b>, and characterizing CPU performance as a complete <em>distribution</em> through statistically disciplined sampling. The core idea: instead of using a single configuration to proxy CPU performance, transform benchmarking into distribution-aware statistics over an open configuration space.", "s1_1c": "BenchCPU's configuration space is <b>open and explicit</b>: all selectable parameters in every dimension come from pre-defined sets. Testers may freely use any combination of parameters within these sets — there are no forbidden compiler flags, no prohibited dataset sizes, no restricted concurrency levels.", "tradVs": "Traditional Benchmarks vs BenchCPU", "colTrad": "Traditional CPU Benchmarks", "colBC": "BenchCPU", "tradRows": [["Evaluation Method", "A few predefined static configurations", "Statistical sampling across an open configuration space"], ["Result Format", "Single aggregate score", "Performance distribution (μ, σ, CI)"], ["Configuration Constraints", "Extensive prohibited flags and options", "Free combination of any parameters within the defined sets"], ["Reproducibility", "Exact numerical reproduction", "Statistical distribution reproduction (exact with fixed seed)"], ["Anti-overfitting", "Relies on rule-based constraints", "Naturally suppressed by configuration space breadth"]], "s1_2Title": "1.2 Configuration Space: W × D × T × C", "s1_2Intro": "The BenchCPU configuration space consists of four orthogonal dimensions, yielding approximately 1.23 million theoretical configurations. A fixed-seed stratified random sampling draws representative configuration samples. Each round independently samples from each dimension.", "colDim": "Dimension", "colSym": "Symbol", "colMeaning": "Meaning", "colSampling": "Sampling Method", "colScope": "Scope", "dimRows": [["Workload", "W", "The benchmark program itself", "All 54 workloads executed per round; no sampling", "All"], ["Data Scale", "D", "Input data size parameter", "10 evenly-spaced discrete points in [base, base×2); 1 randomly selected per round", "All 54"], ["Threads", "T", "Number of parallel execution threads", "Independent random integer from [1, 64] per workload per round", "All 54"], ["Compiler", "C₁", "Compiler choice", "Random choice of clang or gcc per round", "C/C++ only"], ["Optimization", "C₂", "Compiler optimization level", "Random choice of -O1, -O2, -O3 per round", "C/C++ only"]], "s1_2Round": "One round = all 54 workloads each executed once with their independently sampled (d, t, c₁, c₂) parameters. All four dimension parameters are independently randomly sampled per workload, and each round is fully independent. Because a fixed random seed is used, all sampling results are deterministic and reproducible.", "s1_2_2Title": "Workload Dimension (W)", "s1_2_2Text": "BenchCPU includes <b>54 workloads</b>, of which 42 are Basic Workloads (updated every 10 years) and 12 are Emerging Workloads (updated annually), as listed in the table below.", "s1_3Title": "1.3 Statistical Inference & Distribution Awareness", "s1_3Text": "A BenchCPU result is not a single score but a statistical characterization of the CPU's <b>performance distribution</b> over the open configuration space. The methodology is grounded in the Central Limit Theorem (CLT): for a sufficiently large sample size n drawn from the configuration space, the sample mean is approximately normally distributed: <b>μ̂ ~ N(μ, σ²/n)</b>.", "s1_3Stats": "A compliant BenchCPU run produces the following statistics:", "stats": ["<b>Mean (μ)</b> — Arithmetic mean performance across all sampled configurations.", "<b>Standard deviation (σ)</b> — Characterizing cross-configuration performance variation.", "<b>95% Confidence Interval</b> — [μ − t<sub>0.025,n-1</sub>·σ/√n, μ + t<sub>0.025,n-1</sub>·σ/√n], a range that contains the true mean with 95% confidence.", "<b>Coefficient of Variation (CV = σ/μ)</b> — Relative dispersion metric.", "<b>Min / Max</b> — Observed performance extremes."], "s1_4Title": "1.4 Basic Space and Emerging Space", "s1_4Basic": "<b>Basic Space:</b> Composed of a stable set of anchored workloads and their configuration dimensions, held fixed across major BenchCPU releases to ensure long-term continuity in cross-generational CPU performance comparisons.", "s1_4Emerging": "<b>Emerging Space:</b> Composed of a dynamically evolving set of workloads and their configuration dimensions, <b>updated annually</b> to track cutting-edge application demands (e.g., AI inference, graph analytics, serverless computing).", "s1_4Note": "Results must clearly identify which spaces were evaluated. Basic-only is the minimum for publication; Basic+Emerging is recommended for comprehensive evaluation.", "s1_5Title": "1.5 Momentum-Based Filtering & Cross-Version Stability", "s1_5Text": "To maintain cross-version stability, BenchCPU applies a <b>momentum-based filtering</b> mechanism. When the Emerging Space is updated, 90% of the configuration samples from the previous cycle are retained with weight, and 10% new configurations are gradually integrated, thereby suppressing the distributional drift caused by workload rotation and ensuring cross-version longitudinal comparability.", "s1_5Repro": "", "p2Title": "Part 2: Leaderboard Rules", "s2_1Title": "3.1 Evaluatology Foundation: EO / AO / COs / SCS / EC", "s2_1Text": "The BenchCPU leaderboard adopts the Evaluatology framing of complex systems with five core concepts:", "eoaoConcept": "Concept", "eoaoEntity": "Entity", "eoaoDesc": "Description", "eoao": [["EO (Evaluated Object)", "CPU Hardware", "The object being evaluated. In BenchCPU, EO is the CPU itself (model, architecture, cores/threads, frequency, cache hierarchy)."], ["AO (Affected Object)", "Minimal independent running computer system", "AO is the minimal independent running computer system, including OS, OS setting, memory, memory setting, disk, and disk setting."], ["COs (Confounding Objects)", "Application such as benchmark (workload, dataset, copies/threads), compiler, compiler flag", "COs are confounding objects: application-side benchmark factors (workload, dataset, copies/threads), compiler, and compiler flags."], ["SCS (Self-Contained System)", "SCS = EO + AO + COs", "A runnable self-contained system that contains EO, AO, and COs needed to reproduce the observed effect."], ["EC (Evaluation Condition)", "EC = SCS after removing CPU", "EC is the evaluation condition derived from SCS after removing CPU (EO). Fair EO comparison requires shared or equivalent EC."]], "s2_1Note": "", "eoEnumerate": "EO: Current Three CPU Platforms", "colCPU": "CPU", "colDevice": "Device", "colArch": "Architecture", "colCores": "Cores/Threads", "colFreq": "Frequency", "colCache": "Cache", "eoData": [["Intel Xeon Gold 5120T", "Huawei 2288H V5", "x86_64", "28C/28T (2×14)", "1.00~3.20GHz (base 2.20GHz)", "L1d/i: 896KiB, L2: 28MiB, L3: 38.5MiB"], ["Kunpeng 920", "Huawei TaiShan 200", "aarch64", "64C/64T (2×32)", "0.20~2.60GHz (base 2.60GHz)", "L1d/i: 4MiB, L2: 32MiB, L3: 64MiB"], ["AMD EPYC 7543", "Supermicro Super Server", "x86_64", "64C/128T (2×32, SMT2)", "1.50~3.74GHz (base 2.80GHz)", "L1d/i: 2MiB, L2: 32MiB, L3: 512MiB"]], "aoDesc": "COs: BenchCPU Confounding Objects", "aoDescText": "COs are: application such as benchmark (workload, dataset, copies/threads), compiler, and compiler flag.", "exoEnumerate": "SCS / EC: Cross-Platform Context and Conditions", "colExo": "SCS/EC Category", "colXeon": "Intel Xeon 5120T", "colKunpeng": "Kunpeng 920", "colEPYC": "AMD EPYC 7543", "colImpact": "Impact", "exoData": [["OS (EC)", "Ubuntu 20.04", "Ubuntu 22.04", "Ubuntu 22.04", "Xeon differs"], ["Kernel (EC)", "Linux 5.4.0", "Linux 6.5.0", "Linux 5.15.0", "All differ"], ["GCC (COs)", "11.4.0", "11.4.0", "11.4.0", "Same"], ["Clang (COs)", "14.0.6", "14.0.0", "14.0.0", "Minor diff"], ["Python (COs)", "3.10.18", "3.11.5", "3.10.12", "Minor diff"], ["OpenJDK (COs)", "17.0.15", "17.0.10", "17.0.18", "Minor diff"], ["Go (COs)", "1.24.5", "1.24.5", "1.24.5", "Same"], ["Memory (EC)", "375 GiB", "376 GiB", "504 GiB", "EPYC larger"]], "s2_2Title": "2.2 Evaluation Execution Workflow", "steps": ["<b>Configuration Sample Generation:</b> The BenchCPU Committee pre-generates multiple rounds of configuration sample sets using a fixed random seed each release cycle and publishes them openly.", "<b>User Evaluation:</b> Users download one round's configuration sample set and run the BenchCPU toolchain on their CPU platform. The toolchain automatically builds and executes all 54 workloads under each configuration, collecting execution times and system information.", "<b>Result Submission:</b> After evaluation, the toolchain automatically packages the collected timing data and system information and submits them to the BenchCPU server.", "<b>Cumulative Statistics:</b> The server accumulates multiple submissions from the same CPU platform. Let X_i be the 54-workload average execution time of round i. Compute over n rounds: mean μ = (1/n)·ΣX_i, 95% CI = [μ−t<sub>0.025,n-1</sub>·σ/√n, μ+t<sub>0.025,n-1</sub>·σ/√n]. Ranking is based on the mean, and the confidence interval is reported.", "<b>Ranking Update:</b> Rankings and statistics automatically update with each new submission."], "s2_2Chart": "Relative Error vs Accumulated Rounds: Relative Error = (95% CI half-width) / mean. Relative Error ≤ 10% means the 95% CI half-width is within ±10% of the sample mean. At n=4: Xeon 9.44%, Kunpeng 5.49%, EPYC 9.95%.", "s2_2Qualify": "<b>Ranking Qualification:</b> To be ranked, two conditions must be met simultaneously: (1) cumulative rounds n ≥ 4; (2) relative error (RE) ≤ 10%. The result receives a 'Statistically Sufficient' mark.", "s2_3Title": "2.3 Submission & Ranking Mechanism", "submit": ["<b>Fixed-Seed Reproducibility:</b> Given the same configuration space definition and fixed random seed, any tester can exactly reproduce the same configuration sample sets.", "<b>Incremental Update:</b> As submissions accumulate, relative error progressively decreases, confidence intervals narrow, and rankings stabilize.", "<b>Multi-User Contribution:</b> Multiple submissions for the same CPU model can come from different users. The server merges all submissions for community collaboration."], "s2_4Title": "2.4 Comparison Scenarios & Validity", "colScenario": "Scenario", "colEOChg": "EO Change", "colAO": "AO", "colEXO": "COs/EC", "colValid": "Validity", "colConcl": "Applicable Conclusion", "compare": [["Same-Platform Compiler", "Compiler only", "Fixed", "Fixed", "Strong", "Compiler differences attributable to compiler itself"], ["Cross-Platform (Same ISA)", "Hardware only", "Fixed", "OS may differ", "Moderate-Strong", "Differences mainly attributable to hardware; note COs/EC"], ["Cross-Architecture", "Compiler + Hardware", "Fixed", "All differ", "Caution needed", "Trend observation only; not suitable for strict causal inference"], ["Overall Leaderboard", "All vary", "Fixed", "All differ", "Weakest", "Panoramic browsing; no strict causal inference"]], "s2_5Title": "2.5 Results Disclosure Requirements", "colCat": "Category", "colReq": "Required Disclosure Items", "disclose": [["Evaluation Identity", "BenchCPU suite version, configuration space definition version, random seed value, cumulative round count"], ["CPU Information", "Vendor, model, nominal/max frequency, chip count, cores per chip, threads per core, cache hierarchy and sizes"], ["Memory & Storage", "Total capacity, type, DIMM configuration, frequency, file system type"], ["Software Environment", "OS name and version, kernel version, compiler name/version/category, key runtime library versions"], ["Firmware", "BIOS/UEFI version and release date, microcode version"], ["Power Management", "Frequency governor, C-states/P-states configuration"], ["Statistics", "Mean μ, std dev σ, 95% CI, RSE, min/max, effective sample count n, Basic Space mean, Emerging Space mean"]], "appendixTitle": "BenchCPU Workload List", "appendixHeader": ["#", "Name", "Language", "Tier", "Parallel", "Source", "Description", "Parameter Space"], "show": "Show", "hide": "Hide" };
const ZH = { "title": "BenchCPU", "subtitle": "BenchCPU 运行与报告规则 — 版本 1.0，2026年8月。如有任何问题欢迎邮件咨询 benchcpu_feedback@benchcouncil.cn。", "warning": "本规则依据评价学方法[1]制定，旨在建立CPU性能排行标准。规则内容可能不定期修订，所有测试须以执行当日公布的最新版本为准。", "figCaption": "BenchCPU 方法论。", "p1Title": "第一部分：配置空间与统计方法", "s1_1Title": "1.1 从静态配置到开放配置空间", "s1_1a": "BenchCPU 旨在推动公平、客观、统计严谨的 CPU 基准测试。传统 CPU 基准测试遵循<b>静态工作负载配置</b>范式：将代表性工作负载与固定数据集、特定并发级别绑定，报告单一聚合分数。在异构多核架构和快速演进的应用场景下，CPU 性能对评估配置极度敏感：固定配置掩盖了平均约 20% 的性能差距，并频繁产生统计偏倚结果，严重偏离 CPU 的真实性能分布。", "s1_1b": "BenchCPU 通过将基准测试解耦为多个正交、可扩展的维度，构造<b>开放配置空间</b>，以统计规整的采样方法刻画 CPU 性能的完整<em>分布</em>，来解决这些局限。核心思想：不再用单一配置代理 CPU 性能，而是将基准测试转化为开放配置空间上的分布统计。", "s1_1c": "BenchCPU 的配置空间是<b>开放且显式</b>的：所有维度中的所有可选参数均来自预定义集合。测试者可自由使用集合内的任意参数组合——不存在被禁止的编译器标志、数据集大小或并发级别。", "tradVs": "传统基准测试 vs BenchCPU", "colTrad": "传统 CPU 基准测试", "colBC": "BenchCPU", "tradRows": [["评估方法", "少数预定义静态配置", "开放配置空间上的统计采样"], ["结果格式", "单一聚合分数", "性能分布（μ, σ, CI）"], ["配置约束", "大量禁止的编译器标志和选项", "预定义集合内任意参数自由组合"], ["可复现性", "精确数值复现", "统计分布复现（固定种子下精确）"], ["抗过拟合", "依赖规则约束", "配置空间广度天然抑制"]], "s1_2Title": "1.2 配置空间定义：W × D × T × C", "s1_2Intro": "BenchCPU 的配置空间由四个正交维度构成，理论总配置空间约百万个配置。采用固定种子的分层随机采样从中抽取代表性配置样本。每轮从各维度独立采样。", "colDim": "维度", "colSym": "符号", "colMeaning": "含义", "colSampling": "采样方法", "colScope": "范围", "dimRows": [["工作负载", "W", "基准测试程序本体", "每轮执行全部 54 个工作负载；不采样", "全部"], ["数据规模", "D", "输入数据规模参数", "[base, base×2) 内 10 等分离散点；每轮随机选 1 个", "全部 54"], ["线程", "T", "并行执行线程数", "每负载每轮独立随机整数 [1, 64]", "全部 54"], ["编译器", "C₁", "编译器选择", "每轮随机选择 clang 或 gcc", "仅 C/C++"], ["优化级别", "C₂", "编译器优化级别", "每轮随机选择 -O1、-O2、-O3", "仅 C/C++"]], "s1_2Round": "一轮 = 全部 54 个工作负载各以当轮独立采样的（d, t, c₁, c₂）参数执行一次。四个维度参数按工作负载独立随机采样，且各轮完全独立。由于使用固定随机种子，所有轮的采样结果都是确定且可复现的。", "s1_2_2Title": "工作负载维度（W）", "s1_2_2Text": "BenchCPU 包含 <b>54 个工作负载</b>，其中基础工作负载 42 个（每10年更新），新兴工作负载 12 个（每年更新），详见下表。", "s1_3Title": "1.3 统计推断与分布感知", "s1_3Text": "BenchCPU 的结果不是一个单一分数，而是 CPU 在开放配置空间上<b>性能分布</b>的统计刻画。方法论基于中心极限定理（CLT）：对于从配置空间抽取的足够样本量 n，样本均值近似服从正态分布：<b>μ̂ ~ N(μ, σ²/n)</b>。", "s1_3Stats": "一次合规的 BenchCPU 运行产生以下统计量：", "stats": ["<b>均值（μ）</b>——所有采样配置的算术平均性能。", "<b>标准差（σ）</b>——刻画跨配置性能变异。", "<b>95% 置信区间</b>——[μ − t<sub>0.025,n-1</sub>·σ/√n, μ + t<sub>0.025,n-1</sub>·σ/√n]。这个区间有 95% 的置信度包含了真实均值。", "<b>变异系数（CV = σ/μ）</b>——相对离散度指标。", "<b>最小值/最大值</b>——观测性能极值。"], "s1_4Title": "1.4 基础空间与新兴空间", "s1_4Basic": "<b>基础空间：</b>由稳定锚定的工作负载及其配置维度组成，在 BenchCPU 大版本间保持固定，确保跨代 CPU 性能比较的长期连续性。", "s1_4Emerging": "<b>新兴空间：</b>由动态演进的工作负载及其配置维度组成，<b>每年更新</b>以追踪前沿应用需求（如 AI 推理、图分析、无服务器计算）。", "s1_4Note": "结果须明确标识评测了哪些空间。仅基础空间为发表最低要求；基础+新兴空间推荐用于全面评测。", "s1_5Title": "1.5 动量过滤与跨版本稳定性", "s1_5Text": "为维护跨版本稳定性，BenchCPU 应用<b>动量过滤</b>机制。当新兴空间更新时，前一周期 90% 的配置样本以权重保留，10% 的新配置逐步融合，从而抑制因工作负载更新导致的分布漂移，确保跨版本纵向可比性。", "s1_5Repro": "", "p2Title": "第二部分：排行榜规则", "s2_1Title": "3.1 评价学基础：EO / AO / COs / SCS / EC", "s2_1Text": "BenchCPU 排行榜采用复杂系统评价学框架，使用五个核心概念：", "eoaoConcept": "概念", "eoaoEntity": "对应实体", "eoaoDesc": "说明", "eoao": [["EO（评价对象）", "CPU 硬件", "被评价对象本身。在 BenchCPU 中，EO 即 CPU（型号、架构、核心/线程、频率、缓存层级）。"], ["AO（受影响对象）", "最小独立运行计算机系统", "AO 是最小独立运行计算机系统，包括操作系统、操作系统设置、内存、内存设置、磁盘、磁盘设置等。"], ["COs（混杂对象）", "基准应用（如工作负载、数据集、副本/线程）、编译器、编译器标志", "COs 指混杂对象：基准应用（工作负载、数据集、副本/线程）以及编译器与编译器标志。"], ["SCS（自包含系统）", "SCS = EO + AO + COs", "可运行的自包含系统，包含 EO、AO、COs，用于复现实验观测效应。"], ["EC（评价条件）", "EC = 去除 CPU 后的 SCS", "EC 是从 SCS 中移除 CPU（EO）后得到的评价条件。进行 EO 对比时，应尽量保证 EC 共享或等价。"]], "s2_1Note": "", "eoEnumerate": "EO 枚举：当前三个 CPU 平台", "colCPU": "CPU", "colDevice": "设备型号", "colArch": "架构", "colCores": "核心/线程", "colFreq": "频率", "colCache": "缓存", "eoData": [["Intel Xeon Gold 5120T", "Huawei 2288H V5", "x86_64", "28C/28T (2×14)", "1.00~3.20GHz (base 2.20GHz)", "L1d/i: 896KiB, L2: 28MiB, L3: 38.5MiB"], ["Kunpeng 920", "Huawei TaiShan 200", "aarch64", "64C/64T (2×32)", "0.20~2.60GHz (base 2.60GHz)", "L1d/i: 4MiB, L2: 32MiB, L3: 64MiB"], ["AMD EPYC 7543", "Supermicro Super Server", "x86_64", "64C/128T (2×32, SMT2)", "1.50~3.74GHz (base 2.80GHz)", "L1d/i: 2MiB, L2: 32MiB, L3: 512MiB"]], "aoDesc": "COs枚举：BenchCPU 负载配置对象集合", "aoDescText": "COs 枚举如下：<br/>1. W（工作负载）：每轮执行全部 54 个工作负载；不采样。<br/>2. D（数据规模）：在 [base, base×2) 内 10 等分离散点；每轮随机选 1 个。<br/>3. T（线程）：每负载每轮独立随机整数 [1,64]。<br/>4. C<sub>1</sub>（编译器）：每轮随机选择 clang 或 gcc（仅 C/C++）。<br/>5. C<sub>2</sub>（优化级别）：每轮随机选择 -O1、-O2、-O3（仅 C/C++）。", "exoEnumerate": "SCS/EC 枚举：跨平台系统上下文与评价条件", "colExo": "SCS/EC 类别", "colXeon": "Intel Xeon 5120T", "colKunpeng": "Kunpeng 920", "colEPYC": "AMD EPYC 7543", "colImpact": "对比影响", "exoData": [["OS（EC）", "Ubuntu 20.04", "Ubuntu 22.04", "Ubuntu 22.04", "Xeon 不同"], ["内核（EC）", "Linux 5.4.0", "Linux 6.5.0", "Linux 5.15.0", "各不相同"], ["GCC（COs）", "11.4.0", "11.4.0", "11.4.0", "相同"], ["Clang（COs）", "14.0.6", "14.0.0", "14.0.0", "微小差异"], ["Python（COs）", "3.10.18", "3.11.5", "3.10.12", "微小差异"], ["OpenJDK（COs）", "17.0.15", "17.0.10", "17.0.18", "微小差异"], ["Go（COs）", "1.24.5", "1.24.5", "1.24.5", "相同"], ["内存（EC）", "375 GiB", "376 GiB", "504 GiB", "EPYC 更大"]], "s2_2Title": "2.2 评测执行流程", "steps": ["<b>配置样本生成：</b>BenchCPU 委员会使用固定随机种子，从配置空间中预生成配置样本集，并在每个发布周期公开发布（例如 2026-8-10-config.json）。用户可从 GitHub 下载源代码，并从网站下载当期配置文件。", "<b>用户评测：</b>用户在自己的 CPU 平台上，下载 BenchCPU 源码（GitHub 下载链接），并下载一轮配置样本集，然后运行 BenchCPU 工具链。工具链自动完成全部 54 个工作负载在各配置下的构建与执行，并自动采集运行时间、系统信息。", "<b>结果提交：</b>评测完成后，工具链自动采集计时数据和系统信息；用户需将结果文件打包后提交至 BenchCPU 服务端。", "<b>累积统计：</b>服务端累积同一 CPU 平台的多次提交。设第 i 轮 54 个负载的平均执行时间为 X_i，按 n 轮累计计算：均值 μ = (1/n)·ΣX_i 、95% 置信区间 CI₉₅ = [μ−t<sub>0.025,n-1</sub>·σ/√n, μ+t<sub>0.025,n-1</sub>·σ/√n]。根据均值进行排名，并报告置信区间。", "<b>排名更新：</b>每次新提交到达时，排名和统计量自动更新。"], "s2_2Chart": "相对误差与累积轮数：相对误差 = 95% 置信区间半宽 / 样本均值。相对误差 ≤ 10% 表示 95% 置信区间半宽落在样本均值的 ±10% 以内。n=4 时：Xeon 9.44%，Kunpeng 5.49%，EPYC 9.95%。", "s2_2Qualify": "<b>排名资格：</b>参与排名需同时满足两个条件：① 累积轮数 n ≥ 4；② 相对误差（RE）≤10%。满足后获得「统计充分」标记并进入正式排名。", "s2_3Title": "2.3 提交与排名机制", "submit": ["<b>固定种子可复现：</b>给定相同配置空间定义和固定随机种子，任意测试者可精确复现相同的配置样本集，三个平台的每轮参数完全一致。", "<b>增量更新：</b>随着同一 CPU 平台的提交累积，相对误差逐步下降，置信区间收窄，排名趋于稳定。", "<b>多用户贡献：</b>同一 CPU 型号的多次提交可来自不同用户，服务端合并计算，允许社区协作完成完整评测。"], "s2_4Title": "2.4 对比场景与有效性", "colScenario": "场景", "colEOChg": "EO 变化", "colAO": "AO", "colEXO": "COs/EC", "colValid": "有效性", "colConcl": "适用结论", "compare": [["同平台编译器对比", "仅编译器", "固定", "固定", "较强", "编译器性能差异可归因于编译器本身"], ["跨平台对比（同 ISA）", "仅硬件", "固定", "OS 可能不同", "中等偏强", "性能差异主要归因于硬件，需注明 COs/EC 差异"], ["跨架构对比", "编译器 + 硬件", "固定", "全部不同", "需谨慎", "仅适合趋势观察"], ["总排行榜", "全部变化", "固定", "各不相同", "最弱", "适合全景浏览"]], "s2_5Title": "2.5 结果披露要求", "colCat": "类别", "colReq": "须披露项", "disclose": [["评测标识", "BenchCPU 套件版本、配置空间定义版本、随机种子值、累积轮数"], ["CPU 信息", "供应商、型号、标称/最大频率、芯片数、每芯片核心数、每核心线程数、缓存层级与大小"], ["内存与存储", "总容量、类型、DIMM 配置、频率、文件系统类型"], ["软件环境", "OS 名称与版本、内核版本、编译器名称/版本/类别、关键运行时库版本"], ["固件", "BIOS/UEFI 版本与发布日期、微码版本"], ["功耗管理", "频率调控器、C-states/P-states 配置"], ["统计量", "均值 μ、标准差 σ、95% CI、RSE、最小值/最大值、有效样本数 n、基础空间均值、新兴空间均值"]], "appendixTitle": "BenchCPU负载列表", "appendixHeader": ["#", "名称", "语言", "层级", "并行", "来源", "描述", "参数空间"], "show": "展开", "hide": "隐藏" };
EN.dimRows[0][3] = "Sample 50 workloads per round (40 basic, 10 emerging)";
EN.dimRows[0][4] = "All workloads";
EN.dimRows[1][4] = "All workloads";
EN.dimRows[2][4] = "All workloads";
EN.s1_2Round = "Parameters in the configuration space (W, D, T, C1, C2) are sampled independently at random, and a fixed random seed ensures reproducibility of the sampled configurations. The BenchCPU committee publishes the configuration parameters for each release cycle. Testers run this configuration set and submit results to participate in ranking; valid ranking requires results from multiple release cycles and additional conditions, detailed in Part 3: Leaderboard Rules.";
ZH.dimRows[0][3] = "每轮从54个负载中采样50个负载（40个基础，10个新兴）";
ZH.dimRows[0][4] = "全部负载";
ZH.dimRows[1][4] = "全部负载";
ZH.dimRows[2][4] = "全部负载";
ZH.s1_2Round = "配置空间中的参数（W, D, T, C₁, C₂）独立随机采样，并使用固定随机种子确保采样结果的可复现性。BenchCPU委员会在每个发布周期发布当期配置参数，测试者运行这组配置参数并提交测试结果参与排名（有效排名要求测试者提交了多期的测试结果，并满足一定条件，详见“第三部分：排行榜规则”）。";
ZH.appendixTitle = "BenchCPU负载列表";

const WLS = [
  ["1", "numpy/matmul", "Python", "E", "进程（multiprocessing.Pool）", "GitHub", "https://github.com/numpy/numpy", "稠密矩阵乘法：输入两个 size×size 方阵，调用 NumPy/BLAS 进行矩阵乘法 (C=A*B)，输出结果矩阵", "size in [2048,4096), threads in [1,64]", "稠密矩阵乘法：输入两个 size×size 方阵，调用 NumPy/BLAS 进行矩阵乘法 (C=A*B)，输出结果矩阵"],
  ["2", "numpy/svd", "Python", "B", "进程（multiprocessing.Pool）", "GitHub", "https://github.com/numpy/numpy", "奇异值分解：输入 size×size 稠密矩阵，调用 LAPACK dgesdd 进行完全 SVD 分解，输出 U, Σ, VT", "size in [1024,2048), threads in [1,64]", "奇异值分解：输入 size×size 稠密矩阵，调用 LAPACK dgesdd 进行完全 SVD 分解，输出 U, Σ, VT"],
  ["3", "numpy/fft", "Python", "B", "进程（multiprocessing.Pool）", "GitHub", "https://github.com/numpy/numpy", "一维快速傅里叶变换：输入长度为 size 的复数序列，调用 FFTW/NumPy 进行 1D FFT，输出频域复数序列", "size in [4.2M,8.4M), threads in [1,64]", "一维快速傅里叶变换：输入长度为 size 的复数序列，调用 FFTW/NumPy 进行 1D FFT，输出频域复数序列"],
  ["4", "tuf/metadata", "Python", "B", "进程（multiprocessing.Pool）", "GitHub", "https://github.com/theupdateframework/python-tuf", "TUF 安全元数据哈希：输入 size 大小的二进制元数据块，进行 SHA256 哈希计算，输出 256-bit 摘要", "size in [256M,512M), threads in [1,64]", "TUF 安全元数据哈希：输入 size 大小的二进制元数据块，进行 SHA256 哈希计算，输出 256-bit 摘要"],
  ["5", "requests/json", "Python", "B", "进程（multiprocessing.Pool）", "GitHub", "https://github.com/psf/requests", "JSON 反序列化：输入 size 大小的 JSON 文档字符串，调用 json.loads 解析为 Python 对象树，输出反序列化后的字典/列表结构", "size in [128K,256K), threads in [1,64]", "JSON 反序列化：输入 size 大小的 JSON 文档字符串，调用 json.loads 解析为 Python 对象树，输出反序列化后的字典/列表结构"],
  ["6", "raytrace", "Python", "B", "进程（concurrent.futures.ProcessPoolExecutor）", "LangBench", "https://github.com/python/pyperformance", "光线追踪渲染：输入 width 像素的方形画布，对每个像素发射光线，计算球体/平面的反射与折射，输出 RGB 像素数组", "width in [2048,4096), threads in [1,64]", "光线追踪渲染：输入 width 像素的方形画布，对每个像素发射光线，计算球体/平面的反射与折射，输出 RGB 像素数组"],
  ["7", "chaos_fractal", "Python", "B", "进程（concurrent.futures.ProcessPoolExecutor）", "LangBench", "https://github.com/python/pyperformance", "混沌游戏分形：输入 width 像素画布，通过 50M 次随机迭代在三角顶点间插值绘制 Sierpinski 分形，输出灰度图像数组", "width in [2048,4096), threads in [1,64]", "混沌游戏分形：输入 width 像素画布，通过 50M 次随机迭代在三角顶点间插值绘制 Sierpinski 分形，输出灰度图像数组"],
  ["8", "deltablue", "Python", "B", "进程（concurrent.futures.ProcessPoolExecutor）", "LangBench", "https://github.com/python/pyperformance", "增量约束求解：输入 n 个变量与等式/不等式约束的有向图，运行 DeltaBlue 规划算法进行约束传播求解，输出各变量最终取值", "n in [100K,200K), threads in [1,64]", "增量约束求解：输入 n 个变量与等式/不等式约束的有向图，运行 DeltaBlue 规划算法进行约束传播求解，输出各变量最终取值"],
  ["9", "pyflate", "Python", "B", "进程（concurrent.futures.ProcessPoolExecutor）", "LangBench", "https://github.com/python/pyperformance", "bzip2 解压：输入 size 大小的 bzip2 压缩数据，进行 Burrows-Wheeler 逆变换 + Huffman 解码，输出原始未压缩数据", "size in [5M,10M), threads in [1,64]", "bzip2 解压：输入 size 大小的 bzip2 压缩数据，进行 Burrows-Wheeler 逆变换 + Huffman 解码，输出原始未压缩数据"],
  ["10", "go_board_game", "Python", "B", "进程（concurrent.futures.ProcessPoolExecutor）", "LangBench", "https://github.com/python/pyperformance", "围棋 MCTS AI：输入 size 张 19x19 围棋棋盘，对每张棋盘运行蒙特卡洛树搜索（选择-扩展-模拟-回溯），输出各棋盘最佳落子坐标", "size in [100,200), threads in [1,64]", "围棋 MCTS AI：输入 size 张 19x19 围棋棋盘，对每张棋盘运行蒙特卡洛树搜索（选择-扩展-模拟-回溯），输出各棋盘最佳落子坐标"],
  ["11", "resnet50/inference", "Python", "B", "线程（torch.set_num_threads(N)）", "GitHub", "https://github.com/pytorch/vision", "ResNet50 推理：输入 img_size x img_size x 3 的图片张量，通过 50 层残差网络进行前向推理 (ImageNet-1K)，输出 1000 类 logits", "img_size in [256,512), threads in [1,64]", "ResNet50 推理：输入 img_size x img_size x 3 的图片张量，通过 50 层残差网络进行前向推理 (ImageNet-1K)，输出 1000 类 logits"],
  ["12", "resnet50/training", "Python", "E", "线程（torch.set_num_threads(N)）", "GitHub", "https://github.com/pytorch/vision", "ResNet50 训练：输入 img_size x img_size x 3 的批次图片，执行前向传播 + 交叉熵损失 + 反向传播 + SGD 权重更新，输出 loss 值", "img_size in [256,512), threads in [1,64]", "ResNet50 训练：输入 img_size x img_size x 3 的批次图片，执行前向传播 + 交叉熵损失 + 反向传播 + SGD 权重更新，输出 loss 值"],
  ["13", "bert/eval", "Python", "E", "线程（torch.set_num_threads(N)）", "GitHub", "https://github.com/huggingface/transformers", "BERT 推理：输入 seq_len 长度的 token 序列，通过 BERT-base (12层 Transformer) 进行 MLM 推理，输出每个位置的词表概率分布", "seq_len in [512,1024), threads in [1,64]", "BERT 推理：输入 seq_len 长度的 token 序列，通过 BERT-base (12层 Transformer) 进行 MLM 推理，输出每个位置的词表概率分布"],
  ["14", "transformer_inference", "Python", "E", "线程（torch.set_num_threads(N)）", "GitHub", "https://github.com/pytorch/pytorch", "Transformer 推理：输入 seq_len 长度的源语言 token 序列，通过 24 层 Encoder-Decoder 生成目标语言翻译，输出目标 token 序列", "seq_len in [128,256), threads in [1,64]", "Transformer 推理：输入 seq_len 长度的源语言 token 序列，通过 24 层 Encoder-Decoder 生成目标语言翻译，输出目标 token 序列"],
  ["15", "transformer_train", "Python", "B", "线程（torch.set_num_threads(N)）", "GitHub", "https://github.com/pytorch/pytorch", "Transformer 训练：输入 seq_len 长度的平行语料对，12 层 Encoder-Decoder + Adam 优化器进行 NMT 训练，前向+反向+参数更新，输出 loss/perplexity", "seq_len in [128,256), threads in [1,64]", "Transformer 训练：输入 seq_len 长度的平行语料对，12 层 Encoder-Decoder + Adam 优化器进行 NMT 训练，前向+反向+参数更新，输出 loss/perplexity"],
  ["16", "ffmpeg", "C/C++", "B", "进程（multiprocessing.Process）", "GitHub", "https://github.com/FFmpeg/FFmpeg", "FFmpeg 视频处理：输入 duration 秒的 H.264 视频文件，依次进行缩放 (sws_scale) + 高斯模糊 + 锐化滤波，输出处理后的视频帧序列", "dur in [240,480), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "FFmpeg 视频处理：输入 duration 秒的 H.264 视频文件，依次进行缩放 (sws_scale) + 高斯模糊 + 锐化滤波，输出处理后的视频帧序列"],
  ["17", "redis", "C/C++", "E", "进程 + 线程（subprocess.Popen + ThreadPoolExecutor）", "GitHub", "https://github.com/redis/redis", "Redis 读写压测：启动多个 Redis 实例，执行 requests 次 SET/GET 操作循环，使用 RESP 协议通信，输出 QPS 和延迟分布", "req in [2M,4M), opt in {-O1,-O2,-O3}, threads in [1,64]", "Redis 读写压测：启动多个 Redis 实例，执行 requests 次 SET/GET 操作循环，使用 RESP 协议通信，输出 QPS 和延迟分布"],
  ["18", "openssl", "C/C++", "B", "线程（pthread）", "GitHub", "https://github.com/openssl/openssl", "加密循环：输入 size 大小的明文数据块，循环执行 AES-256-CBC 加密 + SHA256 + SHA512 哈希，输出密文和摘要", "size in [25K,50K), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "加密循环：输入 size 大小的明文数据块，循环执行 AES-256-CBC 加密 + SHA256 + SHA512 哈希，输出密文和摘要"],
  ["19", "zstd", "C/C++", "E", "进程（ProcessPoolExecutor）", "GitHub", "https://github.com/facebook/zstd", "Zstd 压缩解压：输入 size 大小的原始数据，使用 level 19 最高压缩率进行 Zstd 压缩，随后解压验证数据完整性，输出压缩比和吞吐量", "size in [25K,50K), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "Zstd 压缩解压：输入 size 大小的原始数据，使用 level 19 最高压缩率进行 Zstd 压缩，随后解压验证数据完整性，输出压缩比和吞吐量"],
  ["20", "gcc_compile", "C/C++", "B", "进程（subprocess.run）", "GCC", "https://gcc.gnu.org", "GCC 编译：输入 30 个合成 .c 源文件（每文件含 300 个不同大小的函数），用 GCC 编译为目标文件并链接为可执行文件，输出编译时间和二进制大小", "func_size in [100,200), opt in {O1,O2,O3}, threads in [1,64]", "GCC 编译：输入 30 个合成 .c 源文件（每文件含 300 个不同大小的函数），用 GCC 编译为目标文件并链接为可执行文件，输出编译时间和二进制大小"],
  ["21", "clang_compile", "C/C++", "B", "进程（subprocess.run）", "Clang", "https://clang.llvm.org", "Clang 编译：同上，使用 Clang/LLVM 工具链编译，覆盖 Clang AST 前端 + LLVM 优化管线 + 目标代码生成全流程", "func_size in [100,200), opt in {O1,O2,O3}, threads in [1,64]", "Clang 编译：同上，使用 Clang/LLVM 工具链编译，覆盖 Clang AST 前端 + LLVM 优化管线 + 目标代码生成全流程"],
  ["22", "lapack/solve", "C/C++", "B", "线程（pthread）", "GitHub", "https://github.com/OpenMathLib/OpenBLAS", "线性方程组求解：输入 size x size 稠密矩阵 A 和右端向量 b，调用 LAPACK dgesv (LU 分解 + 前代回代) 求解 Ax=b，输出解向量 x", "size in [1024,2048), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "线性方程组求解：输入 size x size 稠密矩阵 A 和右端向量 b，调用 LAPACK dgesv (LU 分解 + 前代回代) 求解 Ax=b，输出解向量 x"],
  ["23", "lapack/eigen", "C/C++", "B", "线程（pthread）", "GitHub", "https://github.com/OpenMathLib/OpenBLAS", "特征值分解：输入 size x size 对称矩阵 A，调用 LAPACK dsyev 进行三对角化 + QR 迭代求解所有特征值与特征向量", "size in [1024,2048), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "特征值分解：输入 size x size 对称矩阵 A，调用 LAPACK dsyev 进行三对角化 + QR 迭代求解所有特征值与特征向量"],
  ["24", "lapack/svd", "C/C++", "B", "线程（pthread）", "GitHub", "https://github.com/OpenMathLib/OpenBLAS", "奇异值分解：输入 size x size 稠密矩阵 A，调用 LAPACK dgesvd 进行双对角化 + QR 迭代求全部奇异值与左右奇异向量，输出 U, Σ, VT", "size in [1024,2048), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "奇异值分解：输入 size x size 稠密矩阵 A，调用 LAPACK dgesvd 进行双对角化 + QR 迭代求全部奇异值与左右奇异向量，输出 U, Σ, VT"],
  ["25", "rocksdb", "C/C++", "E", "线程（db_bench --threads=N）", "GitHub", "https://github.com/facebook/rocksdb", "RocksDB KV 存储：输入 num 条键值对，执行顺序写入 + 随机读取 + Snappy 压缩的混合工作负载，使用 LSM-Tree 存储引擎，输出读写延迟和吞吐量", "num in [2M,4M), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "RocksDB KV 存储：输入 num 条键值对，执行顺序写入 + 随机读取 + Snappy 压缩的混合工作负载，使用 LSM-Tree 存储引擎，输出读写延迟和吞吐量"],
  ["26", "opencv/fft_batch", "C/C++", "B", "线程（std::thread）", "GitHub", "https://github.com/opencv/opencv", "批量 DFT：输入 size x size 像素的灰度图像，对其行/列执行批量一维复数 DFT (cv::dft)，输出频域复数矩阵", "size in [512,1024), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "批量 DFT：输入 size x size 像素的灰度图像，对其行/列执行批量一维复数 DFT (cv::dft)，输出频域复数矩阵"],
  ["27", "opencv/conv_heavy", "C/C++", "B", "线程（std::thread）", "GitHub", "https://github.com/opencv/opencv", "大核高斯卷积：输入 size x size 图像，使用 31x31 大核高斯滤波器进行可分离卷积 (cv::GaussianBlur)，输出模糊后的图像，模拟 CNN 卷积层", "size in [512,1024), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "大核高斯卷积：输入 size x size 图像，使用 31x31 大核高斯滤波器进行可分离卷积 (cv::GaussianBlur)，输出模糊后的图像，模拟 CNN 卷积层"],
  ["28", "opencv/mandelbrot", "C/C++", "B", "线程（std::thread）", "GitHub", "https://github.com/opencv/opencv", "Mandelbrot 分形：以复平面 [-2,2]x[-2,2] 为输入域，对 size x size 像素网格逐点计算逃逸时间迭代，输出分形图像", "size in [512,1024), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "Mandelbrot 分形：以复平面 [-2,2]x[-2,2] 为输入域，对 size x size 像素网格逐点计算逃逸时间迭代，输出分形图像"],
  ["29", "opencv/jacobi", "C/C++", "E", "线程（std::thread）", "GitHub", "https://github.com/opencv/opencv", "Jacobi 迭代求解：输入 size x size 网格上的 2D Poisson 方程，使用红黑 Jacobi 迭代法求解离散线性系统，输出收敛后的解网格 u(x,y)", "size in [1024,2048), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "Jacobi 迭代求解：输入 size x size 网格上的 2D Poisson 方程，使用红黑 Jacobi 迭代法求解离散线性系统，输出收敛后的解网格 u(x,y)"],
  ["30", "opencv/canny", "C/C++", "B", "线程（std::thread）", "GitHub", "https://github.com/opencv/opencv", "Canny 边缘检测：输入 size x size 图像，执行高斯平滑、梯度计算 (Sobel)、非极大值抑制、双阈值滞后连接，输出二值边缘图", "size in [1024,2048), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "Canny 边缘检测：输入 size x size 图像，执行高斯平滑、梯度计算 (Sobel)、非极大值抑制、双阈值滞后连接，输出二值边缘图"],
  ["31", "opencv/optical_flow", "C/C++", "B", "线程（std::thread）", "GitHub", "https://github.com/opencv/opencv", "稠密光流：输入 size x size 的相邻帧图像对，使用 Farneback 多项式展开算法计算每个像素的运动向量 (dx,dy)，输出稠密光流场", "size in [512,1024), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "稠密光流：输入 size x size 的相邻帧图像对，使用 Farneback 多项式展开算法计算每个像素的运动向量 (dx,dy)，输出稠密光流场"],
  ["32", "opencv/motion_blur", "C/C++", "B", "线程（std::thread）", "GitHub", "https://github.com/opencv/opencv", "运动模糊：输入 size x size 图像，使用对角线方向卷积核 (cv::filter2D) 模拟运动模糊效果，输出模糊图像", "size in [1024,2048), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "运动模糊：输入 size x size 图像，使用对角线方向卷积核 (cv::filter2D) 模拟运动模糊效果，输出模糊图像"],
  ["33", "opencv/background_sub", "C/C++", "B", "线程（std::thread）", "GitHub", "https://github.com/opencv/opencv", "背景减除：输入 size x 540 像素视频帧序列，使用 MOG2 混合高斯模型逐像素建立背景模型并检测前景运动目标，输出前景掩码", "size in [540,1080), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "背景减除：输入 size x 540 像素视频帧序列，使用 MOG2 混合高斯模型逐像素建立背景模型并检测前景运动目标，输出前景掩码"],
  ["34", "opencv/color_tracking", "C/C++", "B", "线程（std::thread）", "GitHub", "https://github.com/opencv/opencv", "HSV 颜色追踪：输入 size x size 彩色图像，转换到 HSV 空间，颜色阈值分割，腐蚀膨胀形态学操作，连通域检测，输出追踪目标的边界框", "size in [1080,2160), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "HSV 颜色追踪：输入 size x size 彩色图像，转换到 HSV 空间，颜色阈值分割，腐蚀膨胀形态学操作，连通域检测，输出追踪目标的边界框"],
  ["35", "opencv/feature_match", "C/C++", "B", "线程（std::thread）", "GitHub", "https://github.com/opencv/opencv", "ORB 特征匹配：输入 size x size 图像对，提取 ORB 角点特征 + 计算 BRIEF 描述符 + 暴力 Hamming 距离匹配 + RANSAC 单应矩阵估计，输出匹配点对", "size in [512,1024), compiler in {clang,gcc}, opt in {-O1,-O2,-O3}, threads in [1,64]", "ORB 特征匹配：输入 size x size 图像对，提取 ORB 角点特征 + 计算 BRIEF 描述符 + 暴力 Hamming 距离匹配 + RANSAC 单应矩阵估计，输出匹配点对"],
  ["36", "guava/event", "Java", "B", "线程（ExecutorService）", "LangBench", "https://github.com/google/guava", "事件流聚合：输入 dataSize 条事件记录，使用 LinkedHashMultimap 按事件类型分组 + HashMultiset 统计频次，输出分组聚合结果", "dataSize in [100K,200K), threads in [1,64]", "事件流聚合：输入 dataSize 条事件记录，使用 LinkedHashMultimap 按事件类型分组 + HashMultiset 统计频次，输出分组聚合结果"],
  ["37", "guava/cache", "Java", "B", "线程（ExecutorService）", "LangBench", "https://github.com/google/guava", "并发缓存模拟：输入 dataSize 个 key 的访问序列（热点/冷 key 混合模式），对 CacheBuilder 构建的 LRU 缓存执行并发 get/put 操作，输出命中率和吞吐量", "dataSize in [50K,100K), threads in [1,64]", "并发缓存模拟：输入 dataSize 个 key 的访问序列（热点/冷 key 混合模式），对 CacheBuilder 构建的 LRU 缓存执行并发 get/put 操作，输出命中率和吞吐量"],
  ["38", "guava/graph", "Java", "B", "线程（ExecutorService）", "LangBench", "https://github.com/google/guava", "有向图遍历：输入 dataSize 个节点和随机边的有向图，执行 BFS 层序遍历 + 拓扑排序 + 环检测 (Tarjan 变种)，输出遍历序列和环列表", "dataSize in [200K,400K), threads in [1,64]", "有向图遍历：输入 dataSize 个节点和随机边的有向图，执行 BFS 层序遍历 + 拓扑排序 + 环检测 (Tarjan 变种)，输出遍历序列和环列表"],
  ["39", "guava/bloom", "Java", "B", "线程（ExecutorService）", "LangBench", "https://github.com/google/guava", "Bloom Filter：输入 dataSize 个字符串元素，插入 Guava BloomFilter (误报率 0.01)，然后查询所有元素验证存在性，使用 SHA-256 和 Murmur3 双哈希，输出假阳性率", "dataSize in [200K,400K), threads in [1,64]", "Bloom Filter：输入 dataSize 个字符串元素，插入 Guava BloomFilter (误报率 0.01)，然后查询所有元素验证存在性，使用 SHA-256 和 Murmur3 双哈希，输出假阳性率"],
  ["40", "guava/immutable", "Java", "B", "线程（ExecutorService）", "LangBench", "https://github.com/google/guava", "不可变集合操作：输入 dataSize 个元素构建 ImmutableList/Set/Map，执行快照复制 + 交集/差集/并集集合运算，输出各集合大小", "dataSize in [200K,400K), threads in [1,64]", "不可变集合操作：输入 dataSize 个元素构建 ImmutableList/Set/Map，执行快照复制 + 交集/差集/并集集合运算，输出各集合大小"],
  ["41", "cassandra", "Java", "B", "进程（subprocess.run）", "GitHub", "https://github.com/apache/cassandra", "Cassandra NoSQL 读压测：对预填充的 Cassandra 表执行 read-n 次随机主键读取，覆盖 SSTable 扫描 + 行缓存 + Bloom Filter 路径，输出读延迟分位数", "read-n in [1M,2M), threads in [1,64]", "Cassandra NoSQL 读压测：对预填充的 Cassandra 表执行 read-n 次随机主键读取，覆盖 SSTable 扫描 + 行缓存 + Bloom Filter 路径，输出读延迟分位数"],
  ["42", "kafka", "Java", "B", "进程（ProcessPoolExecutor）", "GitHub", "https://github.com/apache/kafka", "Kafka 生产者压测：向 Kafka 集群异步发送 num-records 条消息（每条含 key+value），使用 snappy 压缩 + 批量发送，输出端到端吞吐量和平均延迟", "num-records in [700M,1400M), threads in [1,64]", "Kafka 生产者压测：向 Kafka 集群异步发送 num-records 条消息（每条含 key+value），使用 snappy 压缩 + 批量发送，输出端到端吞吐量和平均延迟"],
  ["43", "biogo/igor", "Go", "B", "线程（goroutine）", "LangBench", "https://github.com/golang/benchmarks", "基因组序列比对：输入 seq 条 DNA 序列的 GFF 注释文件，解析 GFF3 格式并按染色体坐标聚类重叠特征（外显子/CDS/UTR），输出各基因区间坐标", "seq in [50K,100K), threads in [1,64]", "基因组序列比对：输入 seq 条 DNA 序列的 GFF 注释文件，解析 GFF3 格式并按染色体坐标聚类重叠特征（外显子/CDS/UTR），输出各基因区间坐标"],
  ["44", "bleve/index", "Go", "B", "线程（goroutine）", "GitHub", "https://github.com/blevesearch/bleve", "全文索引构建：输入 documents 篇合成文档（词频服从 Zipf 分布），使用 Bleve 引擎进行分词 + 倒排索引构建 + 向量空间评分，输出索引大小和构建时间", "doc in [2000,4000), threads in [1,64]", "全文索引构建：输入 documents 篇合成文档（词频服从 Zipf 分布），使用 Bleve 引擎进行分词 + 倒排索引构建 + 向量空间评分，输出索引大小和构建时间"],
  ["45", "cockroachdb/kv", "Go", "E", "进程（exec.Command）", "GitHub", "https://github.com/cockroachdb/cockroach", "CockroachDB KV 事务：在分布式 KV 存储上执行 max-ops 次读写事务 (1.2M ops/core)，覆盖 MVCC + 分布式共识路径", "max-ops in [600K,1.2M), threads in [1,64]", "CockroachDB KV 事务：在分布式 KV 存储上执行 max-ops 次读写事务 (1.2M ops/core)，覆盖 MVCC + 分布式共识路径"],
  ["46", "cockroachdb/tpcc", "Go", "E", "进程（exec.Command）", "GitHub", "https://github.com/cockroachdb/cockroach", "TPC-C OLTP 模拟：执行 max-ops 次 TPC-C 混合事务 (New-Order/Payment/Order-Status/Delivery/Stock-Level)，覆盖分布式 JOIN + 跨节点事务协调", "max-ops in [15K,30K), threads in [1,64]", "TPC-C OLTP 模拟：执行 max-ops 次 TPC-C 混合事务 (New-Order/Payment/Order-Status/Delivery/Stock-Level)，覆盖分布式 JOIN + 跨节点事务协调"],
  ["47", "esbuild/ThreeJS", "Go", "B", "进程（exec.Command）", "GitHub", "https://github.com/evanw/esbuild", "JS 项目打包：输入 500 个合成 JavaScript/JSON/CSS 模块文件，使用 esbuild 进行依赖解析 + 作用域提升 + Tree Shaking + 代码压缩，输出单文件 bundle", "complexity in [1000,2000), threads in [1,64]", "JS 项目打包：输入 500 个合成 JavaScript/JSON/CSS 模块文件，使用 esbuild 进行依赖解析 + 作用域提升 + Tree Shaking + 代码压缩，输出单文件 bundle"],
  ["48", "esbuild/RomeTS", "Go", "E", "进程（exec.Command）", "GitHub", "https://github.com/evanw/esbuild", "TS 项目编译打包：同上，输入 500 个合成 TypeScript 模块文件，附加类型剥离 + 降级编译 (ESNext to ES2020)，输出编译后的 JS bundle", "complexity in [1000,2000), threads in [1,64]", "TS 项目编译打包：同上，输入 500 个合成 TypeScript 模块文件，附加类型剥离 + 降级编译 (ESNext to ES2020)，输出编译后的 JS bundle"],
  ["49", "gc_garbage", "Go", "B", "线程（goroutine）", "LangBench", "https://github.com/golang/benchmarks", "Go GC 压力测试：输入 size 行的合成 Go 源文件，解析为 AST，生成大量短生命周期对象，触发并发 GC (三色标记-清除)，输出 GC 停顿时间和回收率", "size in [50K,100K), threads in [1,64]", "Go GC 压力测试：输入 size 行的合成 Go 源文件，解析为 AST，生成大量短生命周期对象，触发并发 GC (三色标记-清除)，输出 GC 停顿时间和回收率"],
  ["50", "go_compiler", "Go", "E", "进程（subprocess.run）", "Go", "https://go.dev", "Go 包编译：输入 complex 个合成 Go 包（含 import 依赖图），执行词法分析、语法分析、类型检查、SSA 优化、代码生成全流程，输出编译产物", "complex in [100,200), threads in [1,64]", "Go 包编译：输入 complex 个合成 Go 包（含 import 依赖图），执行词法分析、语法分析、类型检查、SSA 优化、代码生成全流程，输出编译产物"],
  ["51", "gopher_lua", "Go", "B", "线程（goroutine）", "LangBench", "https://github.com/golang/benchmarks", "Lua 生物信息脚本：在 Go 实现的 Lua VM (GopherLua) 中运行 k-nucleotide 基准脚本，输入 size 大小的 FASTA 序列文件，统计 k-mer 频率，输出各 k-mer 计数", "size in [500K,1M), threads in [1,64]", "Lua 生物信息脚本：在 Go 实现的 Lua VM (GopherLua) 中运行 k-nucleotide 基准脚本，输入 size 大小的 FASTA 序列文件，统计 k-mer 频率，输出各 k-mer 计数"],
  ["52", "go_json", "Go", "B", "线程（goroutine）", "LangBench", "https://github.com/golang/benchmarks", "JSON 序列化：输入 size 大小的嵌套 Go struct (树深度 6-8 层)，使用 encoding/json 进行 marshal (struct to JSON) 和 unmarshal (JSON to struct)，输出序列化后的字节流", "size in [25K,50K), threads in [1,64]", "JSON 序列化：输入 size 大小的嵌套 Go struct (树深度 6-8 层)，使用 encoding/json 进行 marshal (struct to JSON) 和 unmarshal (JSON to struct)，输出序列化后的字节流"],
  ["53", "go_markdown", "Go", "B", "线程（goroutine）", "LangBench", "https://github.com/golang/benchmarks", "Markdown 渲染：输入 size 字节的 Markdown 文档（含标题/代码块/表格/图片/链接），解析为 AST，渲染为 HTML 字符串，输出 HTML 文档", "size in [500,1000), threads in [1,64]", "Markdown 渲染：输入 size 字节的 Markdown 文档（含标题/代码块/表格/图片/链接），解析为 AST，渲染为 HTML 字符串，输出 HTML 文档"],
  ["54", "tile38/kdtree", "Go", "B", "线程（goroutine）", "GitHub", "https://github.com/tidwall/tile38", "地理空间 KD-Tree 查询：输入 points 个 (lat,lng) 坐标点构建 KD-Tree 索引，执行 KNN 最近邻查询 + 矩形范围查询 + 圆形相交查询，输出匹配点集", "points in [50K,100K), threads in [1,64]", "地理空间 KD-Tree 查询：输入 points 个 (lat,lng) 坐标点构建 KD-Tree 索引，执行 KNN 最近邻查询 + 矩形范围查询 + 圆形相交查询，输出匹配点集"],

];

const APPENDIX_SOURCES: Record<string, readonly [string, string]> = {
  "1": ["NumPy", "https://github.com/numpy/numpy"],
  "2": ["NumPy", "https://github.com/numpy/numpy"],
  "3": ["NumPy", "https://github.com/numpy/numpy"],
  "4": ["TUF", "https://github.com/theupdateframework/python-tuf"],
  "5": ["Requests", "https://github.com/psf/requests"],
  "6": ["Pyperformance", "https://github.com/python/pyperformance/blob/main/pyperformance/data-files/benchmarks/bm_raytrace/run_benchmark.py"],
  "7": ["Pyperformance", "https://github.com/python/pyperformance/blob/main/pyperformance/data-files/benchmarks/bm_chaos/run_benchmark.py"],
  "8": ["Pyperformance", "https://github.com/python/pyperformance/blob/main/pyperformance/data-files/benchmarks/bm_deltablue/run_benchmark.py"],
  "9": ["Pyperformance", "https://github.com/python/pyperformance/blob/main/pyperformance/data-files/benchmarks/bm_pyflate/run_benchmark.py"],
  "10": ["Pyperformance", "https://github.com/python/pyperformance/blob/main/pyperformance/data-files/benchmarks/bm_go/run_benchmark.py"],
  "11": ["PyTorch", "https://github.com/pytorch/vision"],
  "12": ["PyTorch", "https://github.com/pytorch/vision"],
  "13": ["Hugging Face", "https://github.com/huggingface/transformers"],
  "14": ["PyTorch", "https://github.com/pytorch/pytorch"],
  "15": ["PyTorch", "https://github.com/pytorch/pytorch"],
  "16": ["FFmpeg", "https://github.com/FFmpeg/FFmpeg"],
  "17": ["Redis", "https://github.com/redis/redis"],
  "18": ["OpenSSL", "https://github.com/openssl/openssl"],
  "19": ["zstd", "https://github.com/facebook/zstd"],
  "20": ["GCC", "https://gcc.gnu.org"],
  "21": ["LLVM/Clang", "https://clang.llvm.org"],
  "22": ["OpenBLAS", "https://github.com/OpenMathLib/OpenBLAS/releases/tag/v0.3.30"],
  "23": ["OpenBLAS", "https://github.com/OpenMathLib/OpenBLAS/releases/tag/v0.3.31"],
  "24": ["OpenBLAS", "https://github.com/OpenMathLib/OpenBLAS/releases/tag/v0.3.32"],
  "25": ["RocksDB", "https://github.com/facebook/rocksdb"],
  "26": ["OpenCV", "https://github.com/opencv/opencv"],
  "27": ["OpenCV", "https://github.com/opencv/opencv"],
  "28": ["OpenCV", "https://github.com/opencv/opencv"],
  "29": ["OpenCV", "https://github.com/opencv/opencv"],
  "30": ["OpenCV", "https://github.com/opencv/opencv"],
  "31": ["OpenCV", "https://github.com/opencv/opencv"],
  "32": ["OpenCV", "https://github.com/opencv/opencv"],
  "33": ["OpenCV", "https://github.com/opencv/opencv"],
  "34": ["OpenCV", "https://github.com/opencv/opencv"],
  "35": ["OpenCV", "https://github.com/opencv/opencv"],
  "36": ["Guava", "https://github.com/google/guava"],
  "37": ["Guava", "https://github.com/google/guava"],
  "38": ["Guava", "https://github.com/google/guava"],
  "39": ["Guava", "https://github.com/google/guava"],
  "40": ["Guava", "https://github.com/google/guava"],
  "41": ["Cassandra", "https://github.com/apache/cassandra"],
  "42": ["Kafka", "https://github.com/apache/kafka"],
  "43": ["Biogo", "https://github.com/golang/benchmarks/tree/master/third_party/biogo-examples"],
  "44": ["Bleve", "https://github.com/blevesearch/bleve"],
  "45": ["CockroachDB", "https://github.com/cockroachdb/cockroach"],
  "46": ["CockroachDB", "https://github.com/cockroachdb/cockroach"],
  "47": ["Three.js", "https://github.com/evanw/esbuild"],
  "48": ["esbuild", "https://github.com/evanw/esbuild"],
  "49": ["GC garbage", "https://github.com/golang/benchmarks/tree/master/garbage"],
  "50": ["Go compiler", "https://github.com/golang/go"],
  "51": ["gopher-lua", "https://github.com/yuin/gopher-lua"],
  "52": ["JSON", "https://github.com/golang/go/tree/go1.24.5/src/encoding/json"],
  "53": ["Go markdown", "https://gitlab.com/golang-commonmark/markdown"],
  "54": ["KDTree", "https://github.com/kyroy/kdtree"],
};

const subH: React.CSSProperties = { fontSize: 17, fontWeight: 800, color: "#0f172a", marginTop: 22 };
const bodyP: React.CSSProperties = { fontSize: 15, color: "#0f172a", lineHeight: 1.7, marginTop: 10 };
const thS: React.CSSProperties = { padding: "8px 10px", borderBottom: "2px solid #e2e8f0", textAlign: "left", fontWeight: 700, fontSize: 15, background: "#f1f5f9", whiteSpace: "nowrap" };
const tdS: React.CSSProperties = { padding: "6px 10px", borderBottom: "1px solid #e2e8f0", fontSize: 15, verticalAlign: "top" };
const boxBlue: React.CSSProperties = { background: "#eef5ff", borderLeft: "4px solid #2563eb", padding: "12px 18px", borderRadius: "0 6px 6px 0", marginTop: 12 };
const boxWarn: React.CSSProperties = { background: "#fff8e8", borderLeft: "4px solid #f90", padding: "12px 18px", borderRadius: "0 6px 6px 0", marginTop: 12 };

function THead({ cols }: { cols: string[] }) {
  return <thead><tr>{cols.map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>;
}

function HtmlLabel({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function parallelLabel(v: string, lang: string) {
  const map: Record<string, [string, string]> = {
    "multiprocessing.Pool": ["Process", "进程"],
    "multiprocessing+taskset": ["Process", "进程"],
    "make -j": ["Process", "进程"],
    "go build -j": ["Process", "进程"],
    "OpenMP": ["Thread", "线程"],
    "PyTorch/OpenMP": ["Thread", "线程"],
    "pthread": ["Thread", "线程"],
    "OpenBLAS pthread": ["Thread", "线程"],
    "std::thread": ["Thread", "线程"],
    "JVM ExecutorService": ["Thread", "线程"],
    "JVM ForkJoinPool": ["Thread", "线程"],
    "FFmpeg": ["Thread", "线程"],
    "OpenSSL": ["Thread", "线程"],
    "SQLite": ["Thread", "线程"],
    "PostgreSQL": ["Thread", "线程"],
    "Redis": ["Thread", "线程"],
    "Nginx": ["Thread", "线程"],
    "JVM": ["Thread", "线程"],
    "Kafka": ["Thread", "线程"],
    "Spark": ["Thread", "线程"],
    "MapReduce": ["Process", "进程"],
    "Goroutines": ["Thread", "线程"],
    "goroutine": ["Thread", "线程"],
    "gRPC": ["Thread", "线程"],
  };
  const m = map[v];
  if (!m) {
    // Best-effort fallback for unexpected labels.
    const lower = v.toLowerCase();
    if (lower.includes("goroutine")) return (lang === "zh" ? "线程" : "Thread") + " (" + v + ")";
    if (lower.includes("thread") || lower.includes("pthread") || lower.includes("openmp") || lower.includes("jvm")) return (lang === "zh" ? "线程" : "Thread") + " (" + v + ")";
    if (lower.includes("process") || lower.includes("multiprocessing") || lower.includes("taskset") || lower.includes("-j")) return (lang === "zh" ? "进程" : "Process") + " (" + v + ")";
    return v;
  }
  const label = lang === "zh" ? m[1] : m[0];
  return label + " (" + v + ")";
}

function parallelUnitZh(v: string) {
  if (v.startsWith("进程 + 线程")) return "进程/线程数";
  if (v.startsWith("进程")) return "进程数";
  if (v.startsWith("线程")) return "线程数";
  return parallelLabel(v, "zh").startsWith("进程") ? "进程数" : "线程数";
}

function parallelCell(v: string, lang: string) {
  if (lang === "zh") return v;
  return v
    .replace(/^进程 \+ 线程（/, "Process + Thread (")
    .replace(/^进程（/, "Process (")
    .replace(/^线程（/, "Thread (")
    .replace(/）$/, ")");
}

function appendixParameterSpaceLabel(paramSpace: string, parallel: string, lang: string) {
  if (lang !== "zh") return paramSpace;

  const paramNames: Record<string, string> = {
    size: "数据规模",
    width: "图像宽度",
    n: "问题规模",
    img_size: "图像尺寸",
    seq_len: "序列长度",
    dur: "时长",
    req: "请求数",
    func_size: "函数规模",
    num: "数量",
    dataSize: "数据量",
    "read-n": "读取次数",
    "num-records": "记录数",
    seq: "序列数",
    doc: "文档数",
    "max-ops": "最大操作数",
    complexity: "复杂度",
    complex: "包复杂度",
    points: "点数量",
    compiler: "编译器",
    opt: "优化级别",
    threads: parallelUnitZh(parallel),
  };

  return paramSpace
    .split(", ")
    .map((part) => {
      const match = part.match(/^(.+?) in (.+)$/);
      if (!match) return part;
      const [, name, range] = match;
      return `${paramNames[name] ?? name}：${range}`;
    })
    .join("；");
}

function CollapseToggle({ label, open, onClick }: { label: string; open: boolean; onClick: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={onClick}>
      <h2 className={styles.cardTitle}>{label}</h2>
      <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>{open ? "▲" : "▼"}</span>
    </div>
  );
}

function EvaluatologyFigure({ lang }: { lang: string }) {
  const terms = lang === "zh"
    ? {
      cos: "应用（COs）",
      app: "Application (COs)",
      workload: "Workload",
      dataset: "Dataset",
      concurrency: "Concurrency",
      more: "...",
      confounding: "Confounding",
      cpu: "CPU\n(EO)",
      system: "系统\n(Well-defined AO)",
    }
    : {
      cos: "Application (COs)",
      app: "Application (COs)",
      workload: "Workload",
      dataset: "Dataset",
      concurrency: "Concurrency",
      more: "...",
      confounding: "Confounding",
      cpu: "CPU\n(EO)",
      system: "System\n(Well-defined AO)",
    };

  return (
    <div className={styles.evaluatologyFigureArt} role="img" aria-label={terms.cos}>
      <div className={styles.cosDocument}>
        <span className={styles.cosFold} />
        <ul>
          <li>{terms.workload}</li>
          <li>{terms.dataset}</li>
          <li>{terms.concurrency}</li>
          <li>{terms.more}</li>
        </ul>
        <div>{terms.app}</div>
      </div>
      <div className={styles.confoundingLeft}>{terms.confounding}</div>
      <div className={styles.confoundingRight}>{terms.confounding}</div>
      <div className={styles.downArrowLeft} />
      <div className={styles.downArrowRight} />
      <div className={styles.cpuGlyph} aria-hidden="true">
        <span />
      </div>
      <div className={styles.systemGlyph} aria-hidden="true">
        <span className={styles.gearDot}>●</span>
        <span className={styles.laptopBase} />
      </div>
      <div className={styles.effectArrow} />
      <div className={styles.cpuLabel}>{terms.cpu}</div>
      <div className={styles.systemLabel}>{terms.system}</div>
    </div>
  );
}

export default function HomePage() {
  const { lang } = useLanguage();
  const t = useMemo(() => (lang === "zh" ? ZH : EN), [lang]);
  const poster = lang === "zh"
    ? {
      title: "BenchCPU",
      abstract: "BenchCPU 运行与报告规则 — 版本 1.0，2026年8月。如有任何问题欢迎邮件咨询 benchcpu_feedback@benchcouncil.cn。",
      methodologyChapterTitle: "第一部分：评价学方法",
      conceptTitle: "评价学对象建模：EO / AO / COs",
      conceptIntro: "BenchCPU 将计算机系统解释为评价对象（EO）、受影响对象（AO）与混杂对象（COs）的组合。CPU 是 EO，包含 CPU 的可测试计算机系统是 AO；工作负载、数据集、并发度、编译器等会影响 AO 的观测量，因此属于 COs。CPU 评价的目标，是在明确 AO 的前提下，跨多样化 CO 配置推断 CPU 的真实效应。",
      conceptRows: [
        ["EO（Evaluated Object，评价对象）", "被评价的目标实体。在 BenchCPU 中，EO 是 CPU。"],
        ["AO（Affected Object，受影响对象）", "承载 EO 并可被直接测试的完整系统。在 BenchCPU 中，AO 是包含 CPU、内存、操作系统、编译器等环境的明确计算机系统。"],
        ["COs（Confounding Objects，混杂对象）", "会影响 AO 观测结果、但不是本次评价目标的对象或配置。在 BenchCPU 中包括工作负载、数据集、并发度、编译器及优化选项等。"],
      ],
      methodologyStepsTitle: "方法要点",
      methodologySteps: [
        ["先定义 AO", "完整记录硬件、软件栈和运行环境，避免把系统差异误解释为 CPU 差异。"],
        ["再展开 CO 空间", "将应用拆成工作负载、数据集、并发度和编译参数等维度，使配置空间显式、开放且可复现。"],
        ["最后统计 EO 效应", "在多组 CO 配置上采样运行，通过均值、方差和置信区间报告 CPU 在开放配置空间中的稳定表现。"],
      ],
      motivationTitle: "1. 研究动机：静态配置不能代表 CPU 的真实效应",
      motivation: "SPEC CPU 等传统基准将工作负载、数据集和并发配置固定在少量经验设置上，同时没有完整定义 AO。这样得到的往往是某个系统与某组静态配置的聚合性能，而不是 CPU 在多样场景中的稳定效应。可以归纳为三个直接问题：",
      issues: [
        ["排名反转", "针对静态配置的优化，可能让常见真实配置产生与推荐配置完全相反的 CPU 排名。"],
        ["评价结果偏倚", "固定 CO 使推荐结果可能落在真实性能分布的尾部，成为统计上缺乏代表性的离群点。"],
        ["体系结构盲区", "单一经验配置可能受内存带宽等因素主导，从而高估或低估现代处理器的能力。"],
      ],
      figure1Title: "图 1：评价学视角下的 BenchCPU 方法",
      figure1Body: "图中只保留评价学的三个核心对象：CPU 是评价对象（EO），包含 CPU 的可测试完整系统是受影响对象（AO），工作负载、数据集和并发度等应用配置是混杂对象（COs）。COs 会同时影响 CPU 效应的观测和系统层面的测试结果，因此 BenchCPU 必须在明确 AO 的前提下展开并采样 CO 空间。",
      methodTitle: "2. BenchCPU 方法",
      methods: [
        ["解耦并开放 CO 空间", "将单体基准拆分为工作负载、数据集与并发度三个可独立探索的维度。工作负载分为长期稳定的基础负载和跟踪前沿需求的新兴负载。当前 BenchCPU 包含 WDTC多维配置空间。"],
        ["严格定义 AO", "完整记录操作系统、内存、编译器等执行环境，并按 AO 配置对结果分组。只有明确 CPU 被放入了怎样的系统，才可能讨论 CPU 的真实效应。"],
        ["分层采样与加权过滤", "遍历百万级配置不可行，因此使用分层随机采样降低成本。BenchCPU 每月发布一组配置；年度更新负载时，基础负载权重更高，以抑制分布漂移并保持纵向可比性。"],
        ["评价指标", "1. 排行榜以负载的墙钟执行时间作为评价指标，不依赖参考机器。2. CPU 两两比较，使用配对时间比值的几何均值及其置信区间作为评价指标。"],
      ],
      leaderboardMetricTitle: "2.4.1 排行榜指标",
      pairwiseMetricTitle: "2.4.2 CPU 两两比较指标",
      pairwiseMetricBody: "<strong>配对与比值</strong>：在相同 workload 和配置下，对 CPU A、CPU B 的运行结果逐一配对，共 n 对（n ≥ 2）。第 i 对运行时间分别记为 Tₐ,ᵢ、Tᵦ,ᵢ，定义无量纲时间比值 rᵢ = Tₐ,ᵢ / Tᵦ,ᵢ，以及对数比值 xᵢ = ln(rᵢ)，其中 i ∈ {1, …, n}。\n<strong>对数域估计：</strong>计算对数比值的样本均值 d = (1/n)Σᵢ₌₁ⁿ xᵢ、样本标准差 sₓ = √[Σᵢ₌₁ⁿ(xᵢ − d)²/(n − 1)]。其 95% t 置信区间为 [L, U] = [d − t₀.₀₂₅,ₙ₋₁·sₓ/√n, d + t₀.₀₂₅,ₙ₋₁·sₓ/√n]；t₀.₀₂₅,ₙ₋₁ 表示自由度为 n − 1 的 t 分布上侧 2.5% 临界值。\n<strong>结果还原与判定：</strong>将对数域结果指数还原，得到时间比值的几何均值 eᵈ 及其 95% 置信区间 [eᴸ, eᵁ]。<strong>区间包含 1 表示差异无统计显著性；区间整体大于 1 表示 CPU A 显著慢于 CPU B；区间整体小于 1 表示 CPU A 显著快于 CPU B。</strong>具体统计步骤及示例见 3.3 节。",
      metricIntro: "每轮运行抽取的 50 个负载各一次，并记录墙钟运行时间。设 n 为该 CPU 完成的轮数；轮次编号 i ∈ {1, 2, …, n}，每轮中的负载编号 j ∈ {1, 2, …, 50}。tᵢ,ⱼ 表示该 CPU 第 i 轮运行第 j 个负载的时间（秒）。按以下两步计算：",
      metricRound: "第 i 轮平均时间：xᵢ = (tᵢ,₁ + tᵢ,₂ + ⋯ + tᵢ,₅₀) / 50\n排行榜均值：X̄ₙ = (x₁ + x₂ + ⋯ + xₙ) / n",
      metricRounds: "先将一轮中 50 次运行的时间相加并除以 50，得到该轮平均时间 xᵢ；再将 n 轮的平均时间相加并除以 n，得到排行榜均值 X̄ₙ。BenchCPU 的结果不是单次运行分数，而是 CPU 在开放配置空间上性能分布的统计刻画。根据<strong>中心极限定理（CLT）</strong>，当从配置空间抽取的样本数 N 足够大时，样本均值 μ̂ 近似服从正态分布 N(μ, σ²/N)。<strong>排行榜依据 X̄ₙ 排序，数值越小表示总体运行越快</strong>，并报告<strong>95% 置信区间</strong>。",
      evaluationTitle: "3. 实验评价：BenchCPU 与 SPEC CPU 的跨架构比较",
      figure2Title: "图 2：CPU B 相对 CPU A 的跨架构排名结果",
      figure2Body: "图 2(a) 对每个 SPEC CPU2017 负载探索 32 个采样配置。箱线图表示配置分布，红色三角形是 SPEC 推荐配置（SPEC-R）；其中 10/43 个推荐结果位于分布极端，且 28/43 个负载的分布跨过零线，说明静态点可能任意落在某一侧并造成排名反转。图 2(b) 展示 BenchCPU 的 54 个负载：红色菱形为对数时间比均值，误差棒表示置信区间。区间完全位于零线上方或下方时，才认为 CPU B 与 CPU A 的差异具有统计显著性；区间跨零则不能判定存在显著差异。图内标注保留 PDF 论文原样，本站正文、排行榜和统计表统一采用 95% CI。",
      detailsTitle: "完整运行、报告规则与数据附录",
    }
    : {
      title: "BenchCPU",
      abstract: "BenchCPU Run and Reporting Rules — Version 1.0, August 2026. For any questions, please contact us by email at benchcpu_feedback@benchcouncil.cn.",
      methodologyChapterTitle: "Part 1: Evaluatology Methodology",
      conceptTitle: "Evaluatology object model: EO / AO / COs",
      conceptIntro: "Evaluatology decomposes evaluation into a causal relation among the evaluated object, the affected object, and confounding objects. BenchCPU does not equate one runtime with CPU capability; it first defines the AO boundary, then controls and samples COs to infer the EO's true effect from observations on the AO.",
      conceptRows: [
        ["EO (Evaluated Object)", "The entity being evaluated. In BenchCPU, the EO is the CPU."],
        ["AO (Affected Object)", "The complete directly testable system that contains the EO. In BenchCPU, the AO is the well-defined computer system including CPU, memory, OS, compiler, and execution environment."],
        ["COs (Confounding Objects)", "Objects or configurations that affect observations on the AO but are not the target of evaluation. In BenchCPU, they include workloads, datasets, concurrency, compilers, and optimization options."],
      ],
      methodologyStepsTitle: "Method essentials",
      methodologySteps: [
        ["Define the AO first", "Record hardware, software stack, and runtime environment so system differences are not misread as CPU differences."],
        ["Open the CO space", "Separate applications into workload, dataset, concurrency, and compilation dimensions so the configuration space is explicit, open, and reproducible."],
        ["Estimate the EO effect statistically", "Sample multiple CO configurations and report the CPU's stable behavior with means, variances, and confidence intervals."],
      ],
      motivationTitle: "1. Motivation: static configurations do not represent the true CPU effect",
      motivation: "Traditional suites such as SPEC CPU fix workloads, datasets, and concurrency to a small number of empirical settings while leaving the AO incompletely defined. Their aggregate result can describe one system under one static configuration rather than a stable CPU effect. The poster identifies three consequences:",
      issues: [
        ["Rank inversions", "Optimization for static configurations can make common real-world configurations produce the opposite CPU ranking."],
        ["Biased outcomes", "A fixed recommended configuration can sit at the tail of the actual performance distribution and be statistically unrepresentative."],
        ["Architectural blind spots", "One empirical configuration may be dominated by factors such as memory bandwidth, overstating or understating a modern CPU's capabilities."],
      ],
      figure1Title: "Figure 1: Evaluatology-based BenchCPU methodology",
      figure1Body: "This redrawn figure keeps only the three core evaluatology objects: the CPU is the evaluated object (EO), the directly testable complete system containing the CPU is the affected object (AO), and workload, dataset, concurrency, and related application parameters are confounding objects (COs). Because COs affect both CPU-effect observation and system-level results, BenchCPU samples the CO space under a well-defined AO.",
      methodTitle: "2. BenchCPU methodology",
      methods: [
        ["Decoupled open CO space", "BenchCPU separates workload, dataset, and concurrency into independently explorable dimensions and combines stable fundamental workloads with emerging workloads. The current suite contains 54 workloads in a multidimensional configuration space."],
        ["Well-defined AO", "Execution environments such as OS, memory, and compiler are recorded in detail, and outcomes are grouped by AO configuration. A CPU effect cannot be interpreted without specifying the system in which it was observed."],
        ["Stratified sampling and weighted filtering", "Exhaustive traversal is impractical, so stratified random sampling reduces cost. BenchCPU publishes one configuration set each month. When workloads are updated annually, fundamental workloads receive higher weights to limit distribution drift and maintain longitudinal comparability."],
        ["Evaluation metrics", "1. The leaderboard uses workload wall-clock execution time as its evaluation metric without relying on a reference machine. 2. Pairwise CPU comparisons use the geometric mean of paired time ratios and its confidence interval."],
      ],
      leaderboardMetricTitle: "2.4.1 Leaderboard metric",
      pairwiseMetricTitle: "2.4.2 Pairwise CPU comparison metric",
      pairwiseMetricBody: "<strong>Pairing and ratios</strong>: Pair CPU A and CPU B results for each identical workload and configuration, giving n pairs (n ≥ 2). Let Tₐ,ᵢ and Tᵦ,ᵢ be the runtimes in pair i. Define the dimensionless time ratio rᵢ = Tₐ,ᵢ / Tᵦ,ᵢ and log-ratio xᵢ = ln(rᵢ), for i ∈ {1, …, n}.\n<strong>Estimation in log space:</strong> Compute the sample mean d = (1/n)Σᵢ₌₁ⁿ xᵢ and sample standard deviation sₓ = √[Σᵢ₌₁ⁿ(xᵢ − d)²/(n − 1)]. Its 95% t-confidence interval is [L, U] = [d − t₀.₀₂₅,ₙ₋₁·sₓ/√n, d + t₀.₀₂₅,ₙ₋₁·sₓ/√n], where t₀.₀₂₅,ₙ₋₁ is the upper-tail 2.5% critical value of the t distribution with n − 1 degrees of freedom.\n<strong>Back-transformation and interpretation:</strong> Exponentiating the log-space results gives the geometric mean time ratio eᵈ and its 95% confidence interval [eᴸ, eᵁ]. <strong>An interval containing 1 indicates no statistically significant difference; an interval entirely above 1 indicates CPU A is significantly slower than CPU B; an interval entirely below 1 indicates CPU A is significantly faster than CPU B.</strong> See Section 3.3 for the detailed procedure and an example.",
      metricIntro: "Each round runs each of the 50 sampled workloads once and records its wall-clock runtime. Let n be the number of completed rounds for a CPU; round indices are i ∈ {1, 2, …, n}, and workload indices within each round are j ∈ {1, 2, …, 50}. Let tᵢ,ⱼ (in seconds) denote the runtime of workload j in round i. Calculate the score in two steps:",
      metricRound: "Mean runtime in round i: xᵢ = (tᵢ,₁ + tᵢ,₂ + ⋯ + tᵢ,₅₀) / 50\nLeaderboard mean: X̄ₙ = (x₁ + x₂ + ⋯ + xₙ) / n",
      metricRounds: "First, add the 50 runtimes in a round and divide by 50 to obtain that round's mean xᵢ. Then add the means from all n rounds and divide by n to obtain the leaderboard mean X̄ₙ. A BenchCPU result is not a single-run score, but a statistical characterization of CPU performance across the open configuration space. By the <strong>central limit theorem (CLT)</strong>, when the number N of samples drawn from the configuration space is sufficiently large, the sample mean μ̂ is approximately normally distributed as N(μ, σ²/N). <strong>The leaderboard ranks CPUs by X̄ₙ; lower values indicate faster overall performance</strong>, and reports the <strong>95% confidence interval</strong>.",
      evaluationTitle: "3. Evaluation: cross-architecture comparison with SPEC CPU",
      figure2Title: "Figure 2: Cross-architecture ranking of CPU B versus CPU A",
      figure2Body: "Figure 2(a) explores 32 sampled configurations per SPEC CPU2017 workload. Boxes show configuration distributions and red triangles mark SPEC-R; 10/43 recommended results lie at distribution extremes, while 28/43 distributions cross zero, so a static point can invert a ranking. Figure 2(b) shows BenchCPU's 54 workloads: red diamonds are mean log time ratios and error bars are confidence intervals. A difference is significant only when the interval lies entirely above or below zero. Labels inside the figure remain unchanged from the PDF paper; this site's copy, leaderboard, and statistical tables consistently use 95% CIs.",
      detailsTitle: "Complete run and reporting rules and data appendix",
    };
  const workflowSteps = lang === "zh"
    ? [
      "<b>配置样本生成：</b>BenchCPU委员会使用固定随机种子，从配置空间中预生成一组配置样本集，然后在每个发布周期公开发布一轮配置样本。",
      "<b>用户评测：</b>用户下载 BenchCPU基准测试程序和配置样本文件，并在本地 CPU 平台上运行。BenchCPU将自动完成每轮抽取的50个负载在给定配置下的构建与执行，并自动采集负载运行时间、系统配置等信息。",
      "<b>结果提交：</b>评测完成后，用户将BenchCPU自动采集的结果文件提交至BenchCPU委员会。",
      ...(t.steps as string[]).slice(3).map((step) =>
        step.replace("设第 i 轮 54 个负载的平均执行时间为 X_i", "设第 i 轮50个采样负载的平均执行时间为 X_i")
      ),
    ]
    : (t.steps as string[]);
  const tierLabel = (v: string) => v === "B" ? (lang === "zh" ? "基础" : "Basic") : (lang === "zh" ? "新兴" : "Emerging");
  const coEnumHeader = lang === "zh" ? ["维度", "符号", "含义", "采样方法", "范围"] : ["Dimension", "Symbol", "Meaning", "Sampling", "Scope"];
  const coEnumRows = lang === "zh"
    ? [
      ["工作负载", "W", "基准测试程序本体", "每轮从54个负载中采样50个负载（40个基础，10个新兴）", "全部负载"],
      ["数据规模", "D", "输入数据规模参数", "[base, base×2) 内 10 等分离散点；每轮随机选 1 个", "全部负载"],
      ["线程", "T", "并行执行线程数", "每负载每轮独立随机整数 [1,64]", "全部负载"],
      ["编译器", "C1", "编译器选择", "每轮随机选择 clang 或 gcc", "仅 C/C++"],
      ["优化级别", "C2", "编译器优化级别", "每轮随机选择 -O1、-O2、-O3", "仅 C/C++"],
    ]
    : [
      ["Workload", "W", "Benchmark program body", "Sample 50 workloads per round (40 basic, 10 emerging)", "All workloads"],
      ["Data scale", "D", "Input data size parameter", "10 equal-spaced points in [base, base×2); choose 1 per round", "All workloads"],
      ["Threads", "T", "Parallel execution thread count", "Per-workload, per-round independent random integer [1,64]", "All workloads"],
      ["Compiler", "C1", "Compiler choice", "Randomly choose clang or gcc each round", "C/C++ only"],
      ["Optimization", "C2", "Compiler optimization level", "Randomly choose -O1, -O2, or -O3 each round", "C/C++ only"],
    ];
  const aoEnumHeader = lang === "zh"
    ? ["服务器", "CPU", "操作系统", "内存配置", "磁盘配置", "软件环境"]
    : ["Server", "CPU", "OS", "Memory", "Disk", "Software environment"];
  const scsEnumTitle = lang === "zh" ? "SCS 枚举：自包含系统" : "SCS Enumeration: Self-Contained Systems";
  const scsEnumHeader = lang === "zh" ? ["SCS 示例", "EO", "AO", "COs"] : ["SCS Example", "EO", "AO", "COs"];
  const scsBenchTypes = lang === "zh"
    ? ["BenchCPU", "SPECspeed Int 2017", "SPECspeed FP 2017", "SPECrate Int 2017", "SPECrate FP 2017"]
    : ["BenchCPU", "SPECspeed Int 2017", "SPECspeed FP 2017", "SPECrate Int 2017", "SPECrate FP 2017"];
  const scsCosTypes = lang === "zh"
    ? [
      "BenchCPU 负载配置（W/D/T/C1/C2）",
      "SPECspeed Int 2017 base，GCC 11.4.0 -O3",
      "SPECspeed FP 2017 base，GCC 11.4.0 -O3",
      "SPECrate Int 2017 base，GCC 11.4.0 -O3",
      "SPECrate FP 2017 base，GCC 11.4.0 -O3",
    ]
    : [
      "BenchCPU workload configuration (W/D/T/C1/C2)",
      "SPECspeed Int 2017 base, GCC 11.4.0 -O3",
      "SPECspeed FP 2017 base, GCC 11.4.0 -O3",
      "SPECrate Int 2017 base, GCC 11.4.0 -O3",
      "SPECrate FP 2017 base, GCC 11.4.0 -O3",
    ];
  const scsPlatforms = lang === "zh"
    ? [
      ["Huawei 2288H V5", "Intel Xeon Gold 5120T", "Huawei 2288H V5	Intel Xeon Gold 5120T	Ubuntu 20.04；Linux 5.4.0-216-generic	ECC DDR4；376GiB；230.4 GB/s	系统盘1×1.8TB（EFI+ext4）；数据盘7×1.8TB（XFS）", "BenchCPU 负载配置（W/D/T/C1/C2）+ 特定编译器与编译器选项", "GCC 11.4.0；\nClang 14.0.6；\nPython 3.8.10；\nOpenJDK 17.0.15；\nGo 1.24.5"],
      ["Huawei TaiShan 200", "Kunpeng 920", "Huawei TaiShan 200	Kunpeng 920	Ubuntu 22.04；Linux 6.5.0-15-generic	ECC DDR4；384GB；170.62 GB/s	系统盘1×1.8TB（EFI+ext4）；数据盘7×1.8TB（XFS）", "BenchCPU 负载配置（W/D/T/C1/C2）+ 特定编译器与编译器选项", "GCC 11.4.0；\nClang 14.0.0；\nPython 3.11.5；\nOpenJDK 17.0.10；\nGo 1.24.5"],
      ["Supermicro Super Server", "AMD EPYC 7543", "Supermicro Super Server, AMD EPYC 7543	Ubuntu 22.04；Linux 5.15.0-176-generic	ECC DDR4；503GiB；409.6 GB/s	系统盘1×1.8TB（EFI+/boot+LVM）；数据盘1×12.7TB", "BenchCPU 负载配置（W/D/T/C1/C2）+ 特定编译器与编译器选项", "GCC 11.4.0；\nClang 14.0.0；\nPython 3.10.12；\nOpenJDK 17.0.18；\nGo 1.24.5"],
    ]
    : [
      ["Huawei 2288H V5", "Intel Xeon Gold 5120T", "Huawei 2288H V5\tIntel Xeon Gold 5120T\tUbuntu 20.04; Linux 5.4.0-216-generic\tECC DDR4; 376GiB; 230.4 GB/s\tSystem disk 1x1.8TB (EFI+ext4); data disks 7x1.8TB (XFS)", "BenchCPU workload configuration (W/D/T/C1/C2) + specific compiler and compiler flags", "GCC 11.4.0;\nClang 14.0.6;\nPython 3.8.10;\nOpenJDK 17.0.15;\nGo 1.24.5"],
      ["Huawei TaiShan 200", "Kunpeng 920", "Huawei TaiShan 200\tKunpeng 920\tUbuntu 22.04; Linux 6.5.0-15-generic\tECC DDR4; 384GB; 170.62 GB/s\tSystem disk 1x1.8TB (EFI+ext4); data disks 7x1.8TB (XFS)", "BenchCPU workload configuration (W/D/T/C1/C2) + specific compiler and compiler flags", "GCC 11.4.0;\nClang 14.0.0;\nPython 3.11.5;\nOpenJDK 17.0.10;\nGo 1.24.5"],
      ["Supermicro Super Server", "AMD EPYC 7543", "Supermicro Super Server\tUbuntu 22.04; Linux 5.15.0-176-generic\tECC DDR4; 503GiB; 409.6 GB/s\tSystem disk 1x1.8TB (EFI+/boot+LVM); data disk 1x12.7TB", "BenchCPU workload configuration (W/D/T/C1/C2) + specific compiler and compiler flags", "GCC 11.4.0;\nClang 14.0.0;\nPython 3.10.12;\nOpenJDK 17.0.18;\nGo 1.24.5"],
    ];
  const scsEnumRows = scsPlatforms.flatMap(([displayLabel, cpu, ao]) => scsBenchTypes.map((benchType) => [
    `${displayLabel} + ${benchType}`,
    cpu,
    ao,
    scsCosTypes[scsBenchTypes.indexOf(benchType)],
  ]));
  const aoEnumRowsFromScs = scsPlatforms.map(([, , ao, , software]) => {
    const fields = String(ao)
      .split("\t")
      .map((s) => s.trim())
      .filter(Boolean);

    // Some rows store "Server, CPU" in the first field, then OS/memory/disk.
    // Split that combined field so table columns stay aligned.
    if (fields.length === 4) {
      const first = fields[0];
      const commaIdx = first.indexOf(",");
      if (commaIdx > 0 && commaIdx < first.length - 1) {
        const server = first.slice(0, commaIdx).trim();
        const cpu = first.slice(commaIdx + 1).trim();
        return [server, cpu, fields[1], fields[2], fields[3], software];
      }
    }

    if (fields.length >= 5) return [...fields.slice(0, 5), software];
    return [String(ao), "-", "-", "-", "-", software];
  });
  const [open1, setOpen1] = useState(true);
  const [openEval, setOpenEval] = useState(true);
  const [open2, setOpen2] = useState(false);
  const [openA, setOpenA] = useState(false);
  const pairwiseMethodRows = lang === "zh"
    ? [
      ["1. 求比值", "对每个配对样本先计算 r<sub>i</sub> = T<sub>A,i</sub> / T<sub>B,i</sub>（每个 workload 共 16 轮；全量汇总为 54×16）。"],
      ["2. 对比值取 ln", "令 x<sub>i</sub> = ln(r<sub>i</sub>) = ln(T<sub>A,i</sub> / T<sub>B,i</sub>)。这样做的原因是：t 区间基于算术平均，先在 ln 域求算术平均再指数还原，等价于在原始比值域求几何平均；且若改为 B/A，只需整体取倒数，结论保持对称。"],
      ["3. 在对数域计算均值和 95% CI", "d = (1/n) &Sigma;<sub>i=1</sub><sup>n</sup> x<sub>i</sub>，s<sub>x</sub> = &radic;((&Sigma;<sub>i=1</sub><sup>n</sup> (x<sub>i</sub> - d)<sup>2</sup>) / (n - 1))，并计算 [l<sub>ci</sub>, r<sub>ci</sub>] = d &plusmn; t<sub>0.025,n-1</sub> × s<sub>x</sub> / &radic;n。"],
      ["4. 指数还原到原始比值域", "Time A / Time B 的几何均值为 e<sup>d</sup>，其 95% CI 为 [e<sup>l_ci</sup>, e<sup>r_ci</sup>]。"],
      ["5. 显著性判断", "1 落在 CI 内 -> 无显著差异；CI 全 > 1 -> A(Intel) 显著慢于 B(Kunpeng)；CI 全 < 1 -> A(Intel) 显著快于 B(Kunpeng)。"],
    ]
    : [
      ["1. Compute ratios", "For each paired sample, compute r<sub>i</sub> = T<sub>A,i</sub> / T<sub>B,i</sub> (16 rounds per workload; 54×16 samples for global aggregation)."],
      ["2. Take ln of ratios", "Let x<sub>i</sub> = ln(r<sub>i</sub>) = ln(T<sub>A,i</sub> / T<sub>B,i</sub>). t-intervals are built on arithmetic means, so averaging in log space and exponentiating back is equivalent to a geometric mean in ratio space. It also preserves reciprocal symmetry for B/A."],
      ["3. Mean and 95% CI in log domain", "d = (1/n) &Sigma;<sub>i=1</sub><sup>n</sup> x<sub>i</sub>, s<sub>x</sub> = &radic;((&Sigma;<sub>i=1</sub><sup>n</sup>(x<sub>i</sub> - d)<sup>2</sup>)/(n-1)), and [l<sub>ci</sub>, r<sub>ci</sub>] = d &plusmn; t<sub>0.025,n-1</sub> × s<sub>x</sub> / &radic;n."],
      ["4. Exponentiate back", "The geometric mean ratio is Time A / Time B = e<sup>d</sup>, with 95% CI [e<sup>l_ci</sup>, e<sup>r_ci</sup>]."],
      ["5. Significance rule", "If 1 is inside the CI: no significant difference. If CI > 1: A is significantly slower than B. If CI < 1: A is significantly faster than B."],
    ];

  const normalizePairwiseConclusion = (label: string) => {
    if (lang === "zh") return label;
    if (label.includes("A快")) return "✅ A faster";
    if (label.includes("A慢")) return "❌ A slower";
    if (label.includes("无显著差异")) return "➖ No significant difference";
    return label;
  };

  const sanitizeAppendixDescriptionEn = (workload: string, desc: string) => {
    if (lang === "zh") return desc;
    const hasCjk = /[\u3400-\u9FFF]/.test(desc);
    if (!hasCjk) return desc;
    return `BenchCPU workload: ${workload}. See Source/Link for implementation details.`;
  };
  const pairwiseResultRows = [
    ["1", "bert_cpu", "bert_eval", "-3.5763", "0.028", "[0.019, 0.041]", "✅ A快"],
    ["2", "biogo-benchmark", "biogo-igor", "-0.2305", "0.794", "[0.770, 0.819]", "✅ A快"],
    ["3", "bleve_benchmark", "bleve-index", "-0.4417", "0.643", "[0.597, 0.692]", "✅ A快"],
    ["4", "c_compiler_benchmark", "clang_compile", "+1.2867", "3.621", "[1.972, 6.649]", "❌ A慢"],
    ["5", "c_compiler_benchmark", "gcc_compile", "+0.3404", "1.405", "[1.292, 1.528]", "❌ A慢"],
    ["6", "cassandra_benchmark", "cassandra_stress_read", "-0.0838", "0.920", "[0.885, 0.956]", "✅ A快"],
    ["7", "chaos_fractal", "chaos-fractal", "+0.8164", "2.262", "[2.151, 2.379]", "❌ A慢"],
    ["8", "cockroachdb_benchmark", "kv", "-0.2079", "0.812", "[0.766, 0.861]", "✅ A快"],
    ["9", "cockroachdb_benchmark", "tpcc", "-0.1278", "0.880", "[0.823, 0.941]", "✅ A快"],
    ["10", "deltablue", "deltablue", "-0.1051", "0.900", "[0.834, 0.972]", "✅ A快"],
    ["11", "esbuild_benchmark", "RomeTS", "+0.0390", "1.040", "[1.017, 1.063]", "❌ A慢"],
    ["12", "esbuild_benchmark", "ThreeJS", "-0.0891", "0.915", "[0.855, 0.979]", "✅ A快"],
    ["13", "ffmpeg_benchmark", "ffmpeg", "-0.2041", "0.815", "[0.771, 0.862]", "✅ A快"],
    ["14", "gc_garbage", "gc_garbage", "-0.1133", "0.893", "[0.828, 0.963]", "✅ A快"],
    ["15", "go_board_game", "go-board-game", "+0.7387", "2.093", "[1.870, 2.343]", "❌ A慢"],
    ["16", "go_compiler", "go_compiler", "-0.0244", "0.976", "[0.853, 1.117]", "➖ 无显著差异"],
    ["17", "go_json", "json", "+0.1608", "1.174", "[1.102, 1.251]", "❌ A慢"],
    ["18", "go_markdown", "markdown_render", "-0.3566", "0.700", "[0.635, 0.771]", "✅ A快"],
    ["19", "gopher_lua", "gopher_lua", "-0.0181", "0.982", "[0.905, 1.065]", "➖ 无显著差异"],
    ["20", "guava_benchmark", "guava_bloom", "+0.1325", "1.142", "[1.038, 1.256]", "❌ A慢"],
    ["21", "guava_benchmark", "guava_cache", "-0.2255", "0.798", "[0.742, 0.858]", "✅ A快"],
    ["22", "guava_benchmark", "guava_event", "-0.1676", "0.846", "[0.766, 0.934]", "✅ A快"],
    ["23", "guava_benchmark", "guava_graph", "-0.0878", "0.916", "[0.860, 0.976]", "✅ A快"],
    ["24", "guava_benchmark", "guava_immutable", "-0.2974", "0.743", "[0.701, 0.787]", "✅ A快"],
    ["25", "kafka_benchmark", "kafka_producer_perf", "-0.1467", "0.864", "[0.764, 0.976]", "✅ A快"],
    ["26", "lapack_benchmark", "lapack_eigen", "-0.1840", "0.832", "[0.761, 0.909]", "✅ A快"],
    ["27", "lapack_benchmark", "lapack_solve", "-0.6035", "0.547", "[0.500, 0.598]", "✅ A快"],
    ["28", "lapack_benchmark", "lapack_svd", "-0.2203", "0.802", "[0.733, 0.879]", "✅ A快"],
    ["29", "numpy_benchmark", "fft", "-0.5734", "0.564", "[0.523, 0.607]", "✅ A快"],
    ["30", "numpy_benchmark", "matmul", "-0.8963", "0.408", "[0.388, 0.429]", "✅ A快"],
    ["31", "numpy_benchmark", "svd", "-0.5178", "0.596", "[0.558, 0.637]", "✅ A快"],
    ["32", "opencv_benchmark", "background_sub", "-0.9605", "0.383", "[0.324, 0.453]", "✅ A快"],
    ["33", "opencv_benchmark", "canny", "-0.2553", "0.775", "[0.723, 0.830]", "✅ A快"],
    ["34", "opencv_benchmark", "color_tracking", "-1.1988", "0.302", "[0.277, 0.328]", "✅ A快"],
    ["35", "opencv_benchmark", "conv_heavy", "-1.8739", "0.154", "[0.141, 0.167]", "✅ A快"],
    ["36", "opencv_benchmark", "feature_match", "-0.7399", "0.477", "[0.439, 0.518]", "✅ A快"],
    ["37", "opencv_benchmark", "fft_batch", "-0.1478", "0.863", "[0.779, 0.955]", "✅ A快"],
    ["38", "opencv_benchmark", "jacobi", "-0.7473", "0.474", "[0.425, 0.528]", "✅ A快"],
    ["39", "opencv_benchmark", "mandelbrot", "+0.1373", "1.147", "[1.064, 1.237]", "❌ A慢"],
    ["40", "opencv_benchmark", "motion_blur", "-0.2406", "0.786", "[0.696, 0.888]", "✅ A快"],
    ["41", "opencv_benchmark", "optical_flow", "-0.4279", "0.652", "[0.613, 0.693]", "✅ A快"],
    ["42", "openssl_benchmark", "openssl", "+0.0808", "1.084", "[0.948, 1.239]", "➖ 无显著差异"],
    ["43", "pyflate", "pyflate", "+1.6620", "5.270", "[4.945, 5.616]", "❌ A慢"],
    ["44", "raytrace", "raytrace", "+1.0767", "2.935", "[2.817, 3.058]", "❌ A慢"],
    ["45", "redis_benchmark", "redis-benchmark", "+0.1830", "1.201", "[1.121, 1.287]", "❌ A慢"],
    ["46", "requests_benchmark", "requests-json", "-0.0095", "0.991", "[0.948, 1.036]", "➖ 无显著差异"],
    ["47", "resnet50_cpu", "resnet50_inference", "-1.4413", "0.237", "[0.192, 0.292]", "✅ A快"],
    ["48", "resnet50_cpu", "resnet50_training", "-1.8590", "0.156", "[0.138, 0.176]", "✅ A快"],
    ["49", "rocksdb_benchmark", "rocksdb_cpu", "+0.0396", "1.040", "[0.947, 1.143]", "➖ 无显著差异"],
    ["50", "tile38_sim", "kdtree", "+0.1360", "1.146", "[0.950, 1.382]", "➖ 无显著差异"],
    ["51", "transformer_inference", "transformer_inference", "-3.5735", "0.028", "[0.020, 0.038]", "✅ A快"],
    ["52", "transformer_train", "transformer_train", "-3.1580", "0.043", "[0.032, 0.056]", "✅ A快"],
    ["53", "tuf_benchmark", "tuf-metadata", "+0.5930", "1.809", "[1.524, 2.148]", "❌ A慢"],
    ["54", "zstd_benchmark", "zstd", "-0.3350", "0.715", "[0.691, 0.740]", "✅ A快"],
  ];
  const pairwiseRelativeByWorkload: Record<string, string> = {
    "bert_cpu||bert_eval": "-97.20%",
    "biogo-benchmark||biogo-igor": "-20.59%",
    "bleve_benchmark||bleve-index": "-35.71%",
    "c_compiler_benchmark||clang_compile": "+262.07%",
    "c_compiler_benchmark||gcc_compile": "+40.54%",
    "cassandra_benchmark||cassandra_stress_read": "-8.03%",
    "chaos_fractal||chaos-fractal": "+126.23%",
    "cockroachdb_benchmark||kv": "-18.77%",
    "cockroachdb_benchmark||tpcc": "-12.00%",
    "deltablue||deltablue": "-9.97%",
    "esbuild_benchmark||RomeTS": "+3.98%",
    "esbuild_benchmark||ThreeJS": "-8.53%",
    "ffmpeg_benchmark||ffmpeg": "-18.46%",
    "gc_garbage||gc_garbage": "-10.71%",
    "go_board_game||go-board-game": "+109.33%",
    "go_compiler||go_compiler": "-2.41%",
    "go_json||json": "+17.44%",
    "go_markdown||markdown_render": "-30.00%",
    "gopher_lua||gopher_lua": "-1.80%",
    "guava_benchmark||guava_bloom": "+14.17%",
    "guava_benchmark||guava_cache": "-20.19%",
    "guava_benchmark||guava_event": "-15.43%",
    "guava_benchmark||guava_graph": "-8.41%",
    "guava_benchmark||guava_immutable": "-25.72%",
    "kafka_benchmark||kafka_producer_perf": "-13.65%",
    "lapack_benchmark||lapack_eigen": "-16.81%",
    "lapack_benchmark||lapack_solve": "-45.31%",
    "lapack_benchmark||lapack_svd": "-19.78%",
    "numpy_benchmark||fft": "-43.64%",
    "numpy_benchmark||matmul": "-59.19%",
    "numpy_benchmark||svd": "-40.42%",
    "opencv_benchmark||background_sub": "-61.73%",
    "opencv_benchmark||canny": "-22.53%",
    "opencv_benchmark||color_tracking": "-69.85%",
    "opencv_benchmark||conv_heavy": "-84.65%",
    "opencv_benchmark||feature_match": "-52.29%",
    "opencv_benchmark||fft_batch": "-13.74%",
    "opencv_benchmark||jacobi": "-52.63%",
    "opencv_benchmark||mandelbrot": "+14.72%",
    "opencv_benchmark||motion_blur": "-21.38%",
    "opencv_benchmark||optical_flow": "-34.81%",
    "openssl_benchmark||openssl": "+8.41%",
    "pyflate||pyflate": "+426.97%",
    "raytrace||raytrace": "+193.49%",
    "redis_benchmark||redis-benchmark": "+20.09%",
    "requests_benchmark||requests-json": "-0.94%",
    "resnet50_cpu||resnet50_inference": "-76.34%",
    "resnet50_cpu||resnet50_training": "-84.42%",
    "rocksdb_benchmark||rocksdb_cpu": "+4.04%",
    "tile38_sim||kdtree": "+14.57%",
    "transformer_inference||transformer_inference": "-97.19%",
    "transformer_train||transformer_train": "-95.75%",
    "tuf_benchmark||tuf-metadata": "+80.94%",
    "zstd_benchmark||zstd": "-28.47%",
  };
  const pairwiseSummaryText = lang === "zh"
    ? "Time A / Time B 整体几何均值为 0.70，95% CI = [0.66, 0.75]，A 比 B 快约 30%。在 54 个 workload 中，Intel 显著更快 36 个（67%），Kunpeng 显著更快 12 个（22%），无显著差异 6 个（11%）。"
    : "Summary: Across 54 workloads, Intel is significantly faster in 36 cases (67%), Kunpeng is significantly faster in 12 cases (22%), and 6 cases (11%) show no significant difference. The overall geometric mean ratio is Time A / Time B = 0.70 with 95% CI = [0.66, 0.75]. Equivalently, A is about 30% faster than B.";
  const pairwiseWorkloadNameByKey: Record<string, string> = {
    "numpy_benchmark||matmul": "numpy/matmul",
    "numpy_benchmark||svd": "numpy/svd",
    "numpy_benchmark||fft": "numpy/fft",
    "tuf_benchmark||tuf-metadata": "tuf/metadata",
    "requests_benchmark||requests-json": "requests/json",
    "raytrace||raytrace": "raytrace",
    "chaos_fractal||chaos-fractal": "chaos_fractal",
    "deltablue||deltablue": "deltablue",
    "pyflate||pyflate": "pyflate",
    "go_board_game||go-board-game": "go_board_game",
    "resnet50_cpu||resnet50_inference": "resnet50/inference",
    "resnet50_cpu||resnet50_training": "resnet50/training",
    "bert_cpu||bert_eval": "bert/eval",
    "transformer_inference||transformer_inference": "transformer_inference",
    "transformer_train||transformer_train": "transformer_train",
    "ffmpeg_benchmark||ffmpeg": "ffmpeg",
    "redis_benchmark||redis-benchmark": "redis",
    "openssl_benchmark||openssl": "openssl",
    "zstd_benchmark||zstd": "zstd",
    "c_compiler_benchmark||gcc_compile": "gcc_compile",
    "c_compiler_benchmark||clang_compile": "clang_compile",
    "lapack_benchmark||lapack_solve": "lapack/solve",
    "lapack_benchmark||lapack_eigen": "lapack/eigen",
    "lapack_benchmark||lapack_svd": "lapack/svd",
    "rocksdb_benchmark||rocksdb_cpu": "rocksdb",
    "opencv_benchmark||fft_batch": "opencv/fft_batch",
    "opencv_benchmark||conv_heavy": "opencv/conv_heavy",
    "opencv_benchmark||mandelbrot": "opencv/mandelbrot",
    "opencv_benchmark||jacobi": "opencv/jacobi",
    "opencv_benchmark||canny": "opencv/canny",
    "opencv_benchmark||optical_flow": "opencv/optical_flow",
    "opencv_benchmark||motion_blur": "opencv/motion_blur",
    "opencv_benchmark||background_sub": "opencv/background_sub",
    "opencv_benchmark||color_tracking": "opencv/color_tracking",
    "opencv_benchmark||feature_match": "opencv/feature_match",
    "guava_benchmark||guava_event": "guava/event",
    "guava_benchmark||guava_cache": "guava/cache",
    "guava_benchmark||guava_graph": "guava/graph",
    "guava_benchmark||guava_bloom": "guava/bloom",
    "guava_benchmark||guava_immutable": "guava/immutable",
    "cassandra_benchmark||cassandra_stress_read": "cassandra",
    "kafka_benchmark||kafka_producer_perf": "kafka",
    "biogo-benchmark||biogo-igor": "biogo/igor",
    "bleve_benchmark||bleve-index": "bleve/index",
    "cockroachdb_benchmark||kv": "cockroachdb/kv",
    "cockroachdb_benchmark||tpcc": "cockroachdb/tpcc",
    "esbuild_benchmark||ThreeJS": "esbuild/ThreeJS",
    "esbuild_benchmark||RomeTS": "esbuild/RomeTS",
    "gc_garbage||gc_garbage": "gc_garbage",
    "go_compiler||go_compiler": "go_compiler",
    "gopher_lua||gopher_lua": "gopher_lua",
    "go_json||json": "go_json",
    "go_markdown||markdown_render": "go_markdown",
    "tile38_sim||kdtree": "tile38/kdtree",
  };
  const appendixWorkloadOrder = WLS.map((w) => w[1]);
  const pairwiseResultRowsOrdered = pairwiseResultRows
    .map((r) => {
      const key = `${r[1]}||${r[2]}`;
      const workloadName = pairwiseWorkloadNameByKey[key] ?? `${r[1]}/${r[2]}`;
      const order = appendixWorkloadOrder.indexOf(workloadName);
      const rel = pairwiseRelativeByWorkload[key] ?? "-";
      return { row: r, workloadName, order: order >= 0 ? order : Number.MAX_SAFE_INTEGER, rel };
    })
    .sort((a, b) => a.order - b.order);

  const formatTwoDecimals = (value: string) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
  };

  const formatConfidenceInterval = (value: string) => {
    const match = value.match(/^\[([+-]?\d+(?:\.\d+)?),\s*([+-]?\d+(?:\.\d+)?)\]$/);
    if (!match) return value;
    return `[${Number(match[1]).toFixed(2)}, ${Number(match[2]).toFixed(2)}]`;
  };

  const pairwiseIntroHtml = lang === "zh"
    ? "采用对数比值法分析 CPU A（Intel Xeon Gold 5120T）与 CPU B（Kunpeng 920）的运行时间。先取 ln(T<sub>A,i</sub> / T<sub>B,i</sub>)，再在对数域求均值和 95% CI，最后指数还原。详见下表。"
    : "Below we use the log-ratio method to analyze the 16 paired runtimes of CPU A (Intel Xeon Gold 5120T) and CPU B (Kunpeng 920). The rationale and formulas are listed in the table below: take ln(T<sub>A,i</sub> / T<sub>B,i</sub>), compute the mean and 95% CI in log space, and exponentiate to obtain the final ratio and interval.";

  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <h1 className={styles.heroTitle}>{poster.title}</h1>
        <p className={styles.heroDesc}>{poster.abstract}</p>
      </div>

      <div className={styles.stack}>
        <section className={styles.previewCard}>
          <div className={styles.cardHead}>
            <CollapseToggle label={poster.methodologyChapterTitle} open={openEval} onClick={() => setOpenEval(!openEval)} />
          </div>
          {openEval && <div className={styles.cardBodyCompare}>
            <div className={styles.posterSection}>
              <h3 className={styles.sectionTitle}>{poster.conceptTitle}</h3>
              <p className={styles.sectionLead}>{poster.conceptIntro}</p>
              <figure className={styles.posterFigure}>
                <EvaluatologyFigure lang={lang} />
                <figcaption><strong>{poster.figure1Title}</strong><span>{poster.figure1Body}</span></figcaption>
              </figure>
              <div style={{ overflowX: "auto", marginTop: 20 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <colgroup>
                    <col style={{ width: "38%" }} />
                    <col style={{ width: "62%" }} />
                  </colgroup>
                  <THead cols={[lang === "zh" ? "概念" : "Concept", lang === "zh" ? "含义" : "Meaning"]} />
                  <tbody>{poster.conceptRows.map((r, i) => <tr key={r[0]} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>{r.map((c, j) => <td key={c} style={{ ...tdS, fontWeight: j === 0 ? 700 : undefined, whiteSpace: j === 0 ? "nowrap" : "normal" }}>{c}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </div>
            <div className={styles.posterSection}>
              <h3 className={styles.sectionTitle}>{poster.methodologyStepsTitle}</h3>
              <div className={styles.methodGrid}>
                {poster.methodologySteps.map(([title, body]) => (
                  <div className={styles.methodItem} key={title}>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>}
        </section>

        <section className={styles.previewCard}>
          <div className={styles.cardHead}>
            <CollapseToggle label={lang === "zh" ? "第二部分：配置空间与统计方法" : "Part 2: Configuration Space & Statistical Methods"} open={open1} onClick={() => setOpen1(!open1)} />
          </div>
          {open1 && <div className={styles.cardBodyCompare}>
            <div className={styles.posterSection}>
              <h3 className={styles.sectionTitle}>{poster.motivationTitle}</h3>
              <p className={styles.sectionLead}>{poster.motivation}</p>
              <div className={styles.issueGrid}>
                {poster.issues.map(([title, body], index) => (
                  <div className={styles.issueItem} key={title}>
                    <span className={styles.issueNumber}>{index + 1}</span>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                ))}
              </div>
              <h3 style={subH}>{t.tradVs}</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <THead cols={["", t.colTrad, t.colBC]} />
                  <tbody>{(t.tradRows as string[][]).map((r, i) => <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>{r.map((c, j) => j === 0 ? <td key={j} style={{ ...tdS, fontWeight: 700, whiteSpace: "nowrap", width: "30%" }}>{c}</td> : <td key={j} style={{ ...tdS, whiteSpace: j === 2 ? "normal" : "nowrap" }}>{c}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </div>

            <div className={styles.posterSection}>
              <h3 className={styles.sectionTitle}>{poster.methodTitle}</h3>
              <div className={styles.methodGrid}>
                {poster.methods.map(([title, body]) => (
                  <div className={styles.methodItem} key={title}>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                ))}
              </div>

              <h3 style={subH}>{t.s1_2Title.replace(/^1\.2/, "2.1")}</h3>
              <p style={bodyP}><HtmlLabel html={t.s1_2Intro} /></p>
              <div style={{ overflowX: "auto", marginTop: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <THead cols={[t.colDim, t.colSym, t.colMeaning, t.colSampling, t.colScope]} />
                  <tbody>{(t.dimRows as string[][]).map((r, i) => <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>{r.map((c, j) => j === 0 ? <td key={j} style={{ ...tdS, fontWeight: 700, whiteSpace: "nowrap", width: 130 }}>{c}</td> : <td key={j} style={{ ...tdS, whiteSpace: j >= 2 ? "normal" : "nowrap", maxWidth: j >= 3 ? 280 : undefined }}>{c}</td>)}</tr>)}</tbody>
                </table>
              </div>
              <p style={bodyP}><HtmlLabel html={t.s1_2Round} /></p>

              <p style={bodyP}><HtmlLabel html={t.s1_2_2Text} /></p>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "10px 14px", border: "1px solid rgba(15, 23, 42, 0.10)", borderRadius: 10, background: "#fff" }} onClick={() => setOpenA(!openA)}>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>{t.appendixTitle}</h4>
                  <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>{openA ? "▲" : "▼"}</span>
                </div>
                {openA && (
                  <div style={{ overflowX: "auto", marginTop: 8 }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
                      <colgroup>
                        <col style={{ width: "5%" }} />
                        <col style={{ width: "14%" }} />
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "7%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "9%" }} />
                        <col style={{ width: "26%" }} />
                        <col style={{ width: "16%" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          {(t.appendixHeader as string[]).map((h) => (
                            <th
                              key={h}
                              style={{
                                ...thS,
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {WLS.map((w, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                            {w.map((c, j) => {
                              if (j === 0) return <td key={j} style={{ ...tdS, fontWeight: 700, textAlign: "center", whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }}>{c}</td>;
                              if (j === 4) return <td key={j} style={{ ...tdS, whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }}>{parallelCell(c, lang)}</td>;
                              if (j === 3) return <td key={j} style={{ ...tdS, whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }}>{tierLabel(c)}</td>;
                              if (j === 5) {
                                const [sourceProject, sourceLink] = APPENDIX_SOURCES[w[0]];
                                return <td key={j} style={{ ...tdS, whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }}><a href={sourceLink} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>{sourceProject}</a></td>;
                              }
                              if (j === 6) return null;
                              if (j === 1) return <td key={j} style={{ ...tdS, fontWeight: 600, whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }}>{c}</td>;
                              if (j === 7) return <td key={j} style={{ ...tdS, whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }}>{sanitizeAppendixDescriptionEn(String(w[1]), lang === "zh" && w[9] ? w[9] : c)}</td>;
                              if (j === 8) return <td key={j} style={{ ...tdS, whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }}>{appendixParameterSpaceLabel(c, String(w[4]), lang)}</td>;
                              if (j === 9) return null;
                              return <td key={j} style={{ ...tdS, whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }}>{c}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <h3 style={subH}>{`2.2 ${t.s1_4Title.replace(/^1\.4\s*/, "")}`}</h3>
              <div style={boxBlue}><p style={{ margin: 0, fontSize: 15, color: "#0f172a" }}><HtmlLabel html={t.s1_4Basic} /></p></div>
              <div style={{ ...boxBlue, borderLeftColor: "#16a34a", background: "#eaf5ea" }}><p style={{ margin: 0, fontSize: 15, color: "#0f172a" }}><HtmlLabel html={t.s1_4Emerging} /></p></div>
              <p style={bodyP}>{t.s1_4Note}</p>

              <h3 style={subH}>{`2.3 ${t.s1_5Title.replace(/^1\.5\s*/, "")}`}</h3>
              <p style={bodyP}><HtmlLabel html={t.s1_5Text} /></p>

              <div className={styles.metricBlock}>
                <h3>{lang === "zh" ? "2.4 评价指标" : "2.4 Evaluation Metrics"}</h3>
                <h4 className={styles.metricSubheading}>{poster.leaderboardMetricTitle}</h4>
                <p>{poster.metricIntro}</p>
                <div className={styles.metricFormula}>{poster.metricRound}</div>
                <p><HtmlLabel html={poster.metricRounds} /></p>
                <h4 className={styles.metricSubheading}>{poster.pairwiseMetricTitle}</h4>
                <p className={styles.pairwiseMetricBody}><HtmlLabel html={poster.pairwiseMetricBody} /></p>
              </div>

            </div>

            <div className={styles.posterSection}>
              <h3 className={styles.sectionTitle}>{poster.evaluationTitle}</h3>
              <figure className={styles.posterFigure}>
                <Image src="/poster-figure-2.png" alt={poster.figure2Title} width={2448} height={2448} className={styles.posterFigureImage} />
                <figcaption><strong>{poster.figure2Title}</strong><span>{poster.figure2Body}</span></figcaption>
              </figure>
            </div>
          </div>}
        </section>

        <section className={styles.previewCard}>
          <div className={styles.cardHead}>
            <CollapseToggle label={lang === "zh" ? "第三部分：排行榜规则" : "Part 3: Leaderboard Rules"} open={open2} onClick={() => setOpen2(!open2)} />
          </div>
          {open2 && <div className={styles.cardBodyCompare}>
            <h3 style={subH}>{t.s2_1Title}</h3>
            <p style={bodyP}>{t.s2_1Text}</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10, tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "43%" }} />
                  <col style={{ width: "40%" }} />
                </colgroup>
                <thead>
                  <tr>
                    {[t.eoaoConcept, t.eoaoEntity, t.eoaoDesc].map((h) => (
                      <th key={h} style={{ ...thS, whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>{(t.eoao as string[][]).map((r, i) => <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>{r.map((c2, j) => j === 0 ? <td key={j} style={{ ...tdS, fontWeight: 700, whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }}><HtmlLabel html={c2} /></td> : <td key={j} style={{ ...tdS, whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }}><HtmlLabel html={c2} /></td>)}</tr>)}</tbody>
              </table>
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginTop: 20 }}>{`3.1.1 ${t.eoEnumerate}`}</h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                <THead cols={[t.colCPU, t.colArch, t.colCores, t.colFreq, t.colCache]} />
                <tbody>{(t.eoData as string[][]).map((r, i) => <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>{r.filter((_, j) => j !== 1).map((c, j) => j === 0 ? <td key={j} style={{ ...tdS, fontWeight: 700, whiteSpace: "nowrap" }}>{c}</td> : <td key={j} style={{ ...tdS, whiteSpace: "nowrap" }}>{c}</td>)}</tr>)}</tbody>
              </table>
            </div>

            <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginTop: 20 }}>
              {lang === "zh" ? "3.1.2 AO枚举：当前三个最小独立运行计算机系统" : "3.1.2 AO Enumeration: Current Three Minimal Independent Running Computer Systems"}
            </h4>
            <div style={{ overflowX: "auto", width: "calc(100vw - 48px)", marginLeft: "calc(50% - 50vw + 24px)" }}>
              <table style={{ width: "100%", minWidth: 1180, tableLayout: "fixed", borderCollapse: "collapse", marginTop: 10 }}>
                <colgroup>
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "22%" }} />
                </colgroup>
                <THead cols={aoEnumHeader} />
                <tbody>
                  {aoEnumRowsFromScs.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      {r.map((c, j) => (
                        <td key={j} style={{ ...tdS, fontWeight: j === 0 ? 700 : 400, whiteSpace: "normal", overflowWrap: "anywhere", verticalAlign: j === 5 ? "top" : "middle" }}>
                          {j === 5 ? c.split("\n").map((version, index) => <div key={index}>{version}</div>) : c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


            <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginTop: 20 }}>{`3.1.3 ${t.aoDesc}`}</h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                <THead cols={coEnumHeader} />
                <tbody>{coEnumRows.map((r, i) => <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>{r.map((c, j) => j === 0 ? <td key={j} style={{ ...tdS, fontWeight: 700, whiteSpace: "nowrap" }}>{c}</td> : <td key={j} style={{ ...tdS, whiteSpace: j >= 2 ? "normal" : "nowrap" }}>{c}</td>)}</tr>)}</tbody>
              </table>
            </div>

            <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginTop: 20 }}>{`3.1.4 ${scsEnumTitle}`}</h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                <THead cols={scsEnumHeader} />
                <tbody>{scsEnumRows.map((r, i) => <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>{r.map((c, j) => j === 0 ? <td key={j} style={{ ...tdS, fontWeight: 700, whiteSpace: "normal" }}>{c}</td> : <td key={j} style={{ ...tdS, whiteSpace: j >= 1 ? "normal" : "nowrap" }}>{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <p style={bodyP}>
              {lang === "zh" ? "SPEC CPU信息详见官网[3]。" : "For SPEC CPU information, see the official website [3]."}
            </p>

            <h3 style={subH}>{lang === "zh" ? "3.2 CPU排行榜评测执行流程" : "3.2 CPU Leaderboard Evaluation Workflow"}</h3>
            <ol style={{ fontSize: 15, color: "#0f172a", lineHeight: 1.8, paddingLeft: 20 }}>
              {workflowSteps.map((s, i) => <li key={i}><HtmlLabel html={s} /></li>)}
            </ol>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <Image src="/rse_chart.svg" alt="Relative Error Chart" width={760} height={420} style={{ maxWidth: "100%", height: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }} />
            </div>
            <div style={{ background: "#f8f9fb", border: "1px solid #e8ecf0", borderRadius: 8, padding: 14, marginTop: 8, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 14, color: "#0f172a" }}>{t.s2_2Chart}</p>
            </div>
            <div style={boxWarn}><p style={{ margin: 0, fontSize: 15, color: "#0f172a" }}><HtmlLabel html={t.s2_2Qualify} /></p></div>

            <h3 style={subH}>{lang === "zh" ? "3.3 CPU两两比较与显著性判断" : "3.3 Pairwise CPU Comparison and Significance"}</h3>
            <p style={bodyP}>
              <HtmlLabel html={pairwiseIntroHtml} />
            </p>

            <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginTop: 20 }}>
              {lang === "zh" ? "3.3.1 统计方法说明" : "3.3.1 Statistical Method"}
            </h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                <THead cols={lang === "zh" ? ["步骤", "解释说明"] : ["Step", "Explanation"]} />
                <tbody>{pairwiseMethodRows.map((r, i) => <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>{r.map((c, j) => j === 0 ? <td key={j} style={{ ...tdS, fontWeight: 700, whiteSpace: "nowrap", width: "26%" }}><HtmlLabel html={c} /></td> : <td key={j} style={{ ...tdS, whiteSpace: "normal" }}><HtmlLabel html={c} /></td>)}</tr>)}</tbody>
              </table>
            </div>

            <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginTop: 20 }}>
              {lang === "zh" ? "3.3.2 各Workload对数比值区间估计结果" : "3.3.2 Log-Ratio t-Interval Results by Workload"}
            </h4>
            <p style={bodyP}><HtmlLabel html={pairwiseSummaryText} /></p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse", marginTop: 10 }}>
                <colgroup>
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "35%" }} />
                </colgroup>
                <THead cols={lang === "zh" ? ["#", "Workload", "Time A/Time B", "95% CI (Time A/Time B)", "结论"] : ["#", "Workload", "Time A/Time B", "95% CI (Time A/Time B)", "Conclusion"]} />
                <tbody>
                  {pairwiseResultRowsOrdered.map((item, i) => {
                    const r = item.row;
                    const row = [String(i + 1), item.workloadName, formatTwoDecimals(r[4]), formatConfidenceInterval(r[5]), normalizePairwiseConclusion(r[6])];
                    return <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>{row.map((c, j) => <td key={j} style={{ ...tdS, fontWeight: j === 0 ? 700 : 400, whiteSpace: j === 1 || j === 4 ? "normal" : "nowrap" }}>{c}</td>)}</tr>;
                  })}
                </tbody>
              </table>
            </div>

            <h3 style={subH}>{lang === "zh" ? "3.4 结果披露要求" : "3.4 Result Disclosure Requirements"}</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                <THead cols={[t.colCat, t.colReq]} />
                <tbody>{(t.disclose as string[][]).map((r, i) => <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>{r.map((c, j) => j === 0 ? <td key={j} style={{ ...tdS, fontWeight: 700, whiteSpace: "nowrap", width: "22%" }}>{c}</td> : <td key={j} style={{ ...tdS, whiteSpace: "normal" }}>{c}</td>)}</tr>)}</tbody>
              </table>
            </div>

            <h3 style={subH}>{lang === "zh" ? "附录：参考文献" : "Appendix: References"}</h3>
            <div style={{ ...boxBlue, marginTop: 10 }}>
              <p style={{ margin: 0, fontSize: 14, color: "#0f172a", lineHeight: 1.8 }}>
                {lang === "zh" ? "[1]" : "[1]"} Zhan J, Wang L, Gao W, et al. Evaluatology: The Science of Uncovering the Effects[M]. Hong Kong: BenchCouncil Press, 2025. ISBN 978-988-71596-8-1.
                <a href="https://press.benchcouncil.org/book.html" target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", textDecoration: "underline" }}>
                  https://press.benchcouncil.org/book.html
                </a>
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "#0f172a", lineHeight: 1.8 }}>
                {lang === "zh" ? "[2] BenchCouncil. 国际测试委员会BenchCouncil[EB/OL]. " : "[2] BenchCouncil. BenchCouncil International Test Committee [EB/OL]. "}
                <a href="https://www.benchcouncil.org/cn/index.html" target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", textDecoration: "underline" }}>
                  https://www.benchcouncil.org/cn/index.html
                </a>
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "#0f172a", lineHeight: 1.8 }}>
                [3] Standard Performance Evaluation Corporation. SPEC CPU Benchmarks[EB/OL].
                <a href="https://www.spec.org/cpu/" target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", textDecoration: "underline", marginLeft: 4 }}>
                  https://www.spec.org/cpu/
                </a>
              </p>
            </div>
          </div>}
        </section>

      </div >
    </div >
  );
}
