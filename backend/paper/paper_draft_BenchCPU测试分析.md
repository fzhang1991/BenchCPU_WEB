# BenchCPU 测试分析论文草案

当前版本：v0.2，目标是形成可继续填充实验结果的主稿骨架。本文当前采取“先固定问题与叙事，再补齐实验”的写法；所有尚未由数据直接支撑的结论均以研究问题、实验设计或预期分析位置呈现，避免提前写成既成发现。

## 题目候选

**Understanding Configuration Sensitivity Across Workloads and CPU Architectures in Open Benchmark Spaces**

备选中文题目：**开放配置空间下工作负载与 CPU 架构对基准测试结果的影响分析**

## 摘要草稿

传统 CPU 基准测试通常采用固定输入规模、固定并发度和固定运行配置，并据此给出单一性能分数或平台排序。这种方式便于复现和横向比较，但也可能掩盖同一工作负载在不同配置下的性能分布。随着服务器 CPU 在 ISA、微架构、缓存层次、核心数和编译器后端上的差异不断扩大，固定配置下的单点结果越来越难以解释平台真实性能。已有 BenchCPU 工作提出了开放配置空间和性能分布感知的 CPU 评价方法，说明固定配置可能导致偏差评价和异常结果。然而，开放配置空间中的性能差异究竟由哪些因素塑造，不同工作负载对配置变化的敏感性是否一致，以及这种敏感性是否会被不同 CPU 架构放大或抑制，仍缺少系统分析。

本文围绕 BenchCPU 的多负载、多轮随机配置实验展开测试分析，并结合 SPECspeed、SPECrate 和硬件性能计数器，从 workload、configuration 和 architecture 三个维度解释 CPU benchmark 结果。本文重点回答三个问题：第一，不同配置参数对不同工作负载的性能影响是否一致；第二，同一工作负载的配置敏感性在不同 ISA/CPU 平台上是否发生变化；第三，BenchCPU 与 SPEC 类指标在平台排序和性能解释上何时一致、何时分歧。通过分析运行时间分布、变异系数、极值、参数相关性和微架构指标，本文建立一个面向开放配置空间的 CPU 测试分析框架。该框架的核心观点是：CPU benchmark 结果不是由工作负载、配置或架构中任一因素单独决定的，而是三者交互作用的结果。该分析为开放配置空间下的 CPU 性能评价、benchmark 设计和平台选型提供了更细粒度的解释路径。

## 1. 引言草稿

CPU 性能评测是体系结构设计、系统优化和平台选型中的基础问题。长期以来，标准 benchmark suite 通过固定工作负载、固定输入和固定运行规则提供可复现的性能比较。例如 SPEC CPU 系列以标准程序和标准化报告规则支撑了大量处理器比较研究，PARSEC、SPLASH-2 和 CloudSuite 等套件则分别面向多核并行和数据中心场景扩展了 benchmark 覆盖范围。这些 benchmark 的共同优势是可重复、可比较和易于形成单一分数，但它们也共同依赖一个隐含假设：固定配置下的结果能够代表平台在相应工作负载上的真实性能。

这一假设在现代 CPU 评测中越来越值得重新审视。一方面，现代服务器处理器在 ISA、核心数量、缓存层次、NUMA 拓扑、内存带宽、分支预测和向量执行能力上存在显著差异；另一方面，实际应用的性能往往受到输入规模、线程数、并发度、编译器、优化等级和运行参数共同影响。同一个 workload 在不同配置下可能表现出不同的运行时间分布，而同一个配置变化在不同 CPU 架构上也可能产生不同幅度的影响。因此，固定配置 benchmark 可能将某个局部配置点误认为整体性能代表，从而放大或掩盖平台之间的真实差异。

已有 BenchCPU 工作从方法论上提出开放配置空间和 performance distribution-aware benchmarking，指出传统固定配置可能导致 biased evaluation 和 outlier。本文进一步从测试分析角度追问：开放配置空间中的性能分布由什么因素决定？具体而言，我们关注 workload、configuration 和 architecture 之间的交互关系。这里的 configuration 包括输入规模、线程数、并发参数、编译器和优化等级等运行设置；workload 表示不同程序和任务类型；architecture 表示不同 ISA、微架构和 CPU 平台特征。本文认为，只有同时分析这三个维度，才能解释为什么某些 workload 对配置极其敏感，而另一些 workload 相对稳定；为什么某些平台在特定配置区域表现突出，却在整体分布中优势减弱；以及为什么 BenchCPU 与 SPEC 类指标有时会给出不同的平台排序解释。

围绕这一目标，本文基于 BenchCPU 的 54 个负载和多轮随机配置实验，结合 SPECspeed、SPECrate 以及硬件性能计数器，系统分析配置敏感性、负载敏感性和架构敏感性。本文不试图重新提出一个 benchmark suite，而是把 BenchCPU 作为实验平台，解释 benchmark 结果背后的分布结构和影响因素。换言之，本文的核心不是“哪个 CPU 更快”，而是“为什么 benchmark 在不同配置和不同架构下会形成不同性能结论”。

本文的贡献可以概括为三点。

1. 本文提出一个面向开放配置空间的 CPU benchmark 测试分析框架，将 workload、configuration 和 architecture 三者的交互作为解释性能结果的核心对象。
2. 本文设计一组配置敏感性实验，量化不同参数对不同 workload 的影响，并通过运行时间分布、CV、极值和参数相关性识别高敏感负载及其主导配置因素。
3. 本文结合跨 ISA/CPU 平台、SPEC 类指标和硬件性能计数器，分析配置敏感性如何影响平台排序，并讨论 BenchCPU 与传统 benchmark 指标之间的一致性和分歧。

需要补充实验后才能最终落定的贡献项包括：各类 workload 的敏感性排名、不同 CPU 平台上的敏感性差异幅度、以及 BenchCPU 与 SPEC 指标之间的 rank correlation。当前版本先固定这些贡献的逻辑位置。

## 2. 研究问题

本文围绕以下三个研究问题展开。

**RQ1：不同配置参数对不同 workload 的影响是否一致？**

该问题关注 configuration sensitivity。实验需要统计每个 workload 在多轮随机配置下的运行时间分布，并分析输入规模、线程数、并发度、编译器和优化等级等参数与运行时间之间的相关性。预期结果不是简单给出平均性能，而是识别哪些 workload 对配置变化最敏感，以及敏感性主要来自哪些参数。

**RQ2：同一 workload 的配置敏感性是否随 ISA/CPU 架构改变？**

该问题关注 architecture sensitivity。实验需要在不同 CPU 平台上运行相同配置集合，并比较同一 workload 的 CV、极值范围、参数相关性和分布形状是否发生变化。若同一配置参数在不同平台上产生不同影响，则说明架构不是简单的性能缩放因子，而是会改变 workload 对配置的响应方式。

**RQ3：BenchCPU 与 SPEC 类指标在平台排序和性能解释上何时一致、何时分歧？**

该问题关注 benchmark agreement。实验需要比较 BenchCPU Time、SPECspeed Int/FP 和 SPECrate Int/FP 的平台排序，计算 ranking correlation，并分析分歧来源。重点不是判断某个 benchmark 更优，而是解释不同 benchmark 由于 workload 构成、配置空间和资源压力不同，可能给出不同的性能视角。

## 3. 方法与实验设计

本节的目标是把开放配置空间中的性能差异转化为可测量、可比较、可解释的统计对象。整体流程包括四步：首先，在每个平台上对同一组 workload 运行相同的配置采样集合；其次，计算每个 workload 的性能分布与参数相关性；第三，比较不同 CPU/ISA 上的敏感性变化；最后，结合硬件计数器和 SPEC 类指标解释分布差异和 ranking 分歧。

### 3.1 实验对象

本文以 BenchCPU 中的 54 个负载作为主要测试对象，并将负载按程序域和行为特征分组，例如图像处理、数值计算、数据库、消息队列、推理任务和系统类负载。每个负载在开放配置空间中进行多轮随机采样，配置参数包括输入规模、线程数、并发度、编译器、优化等级和 workload-specific 参数。

### 3.2 平台维度

实验至少应覆盖不同 ISA 和不同微架构平台，例如 Intel x86、AMD x86 和 ARM server CPU。为了增强论文说服力，后续实验可进一步补充不同代际、不同核心数和不同内存配置的平台。平台差异不只用于最终排名，还用于分析同一配置变化在不同架构上是否表现出不同敏感性。

### 3.3 指标维度

本文建议同时报告以下指标。

- 运行时间分布：mean、median、min、max、standard deviation、CV 和 95% confidence interval。
- 参数敏感性：配置参数与运行时间之间的 Pearson/Spearman correlation。
- 排名一致性：BenchCPU Time、SPECspeed 和 SPECrate 之间的 ranking correlation。
- 微架构指标：IPC、L1/L2/L3 MPKI、Branch MPKI、Frontend/Backend bound、Retiring、instruction mix、memory access bytes per cycle。
- 分布异常：outlier ratio、极端配置、best/worst configuration gap。

### 3.4 分析方法

本文采用从现象到归因的分析路径。首先根据 CV 和极值范围识别高敏感 workload；然后根据参数相关性判断主要驱动参数；接着比较不同平台上的敏感性差异；最后结合硬件性能计数器解释这种差异是否来自缓存压力、前端压力、分支行为、内存访问或并发效率。

为了避免将尚未验证的趋势写成结论，本文将每个结果小节都组织为固定结构：Research Question → Experiment → Data → Finding → 1-hop Implication。只有能够由数据直接支持的内容放入 Finding；更宽泛的解释放入 Discussion 或 Limitation。

## 4. 预期结果组织

### 4.1 配置对 workload 的影响不是均匀的

这一节回答 RQ1。可用表格列出 CV 最高的 workload、运行时间范围、主要相关参数和简短解释。例如 Kafka producer、LAPACK solve/eigen、Cassandra read、OpenCV optical flow、Transformer inference 等已经在组会材料中体现出明显参数敏感性。后续实验补齐后，应将这些案例扩展为系统性统计。

建议图表：Top-k 高 CV workload 表、参数相关性热图、每类 workload 的运行时间箱线图。

### 4.2 架构会改变 workload 对配置的响应

这一节回答 RQ2。核心图可以是同一 workload 在不同 CPU 上的分布对比，或者同一参数相关性在不同平台上的变化。关键结论应避免只说“某平台更快”，而要说明“某平台对线程数、输入规模或编译配置更敏感”。

建议图表：同一 workload 在 Intel/AMD/ARM 上的分布对比图、参数相关性跨平台差值图、架构敏感性 ranking 表。

### 4.3 固定配置可能导致 ranking 偏差

这一节回答 RQ3。可比较固定配置、随机配置均值、最优配置、最差配置和 SPEC 指标排名。若某些平台在固定配置下排名靠前，但在分布均值或稳健指标下优势下降，这将直接支持开放配置空间评测的必要性。

建议图表：BenchCPU 与 SPEC 指标 ranking correlation matrix、pairwise ranking disagreement 表、fixed vs distribution-aware ranking 对比图。

### 4.4 硬件计数器解释配置敏感性的来源

这一节用于提升论文深度。可以使用 PCA 或聚类分析展示 workload 的微架构行为分布，并解释高敏感 workload 是否集中在某些行为区域，例如高 L1D/L2/L3 MPKI、高 frontend pressure、高 branch MPKI 或高 memory access intensity。

建议图表：硬件计数器 PCA 图、PC loading 表、高敏感 workload 在 PCA 空间中的位置、敏感性与关键微架构指标的相关性。

## 5. 结果写作模板

为了后续补实验时保持论文风格一致，每个结果小节建议使用如下模板。

**Question.** 本小节回答哪个 RQ，以及为什么该问题对 CPU benchmark 评价重要。

**Experiment.** 使用哪些平台、workload、配置采样和指标。若只覆盖部分平台，需要说明当前结果的边界。

**Data.** 给出关键表格或图，例如 CV、运行时间范围、参数相关性、ranking correlation 或硬件计数器分布。

**Finding.** 只写数据直接支持的结论，例如“threads 与运行时间在 workload A 上呈显著负相关，但在 workload B 上相关性弱”。

**Implication.** 给出一步推论，例如“固定线程数配置可能低估 workload A 的配置敏感性”。不要在这里过度扩展成所有 workload 或所有 CPU 的普遍规律。

## 6. 相关工作

相关工作章节见 [related_work_BenchCPU测试分析.md](related_work_BenchCPU测试分析.md)。当前版本已经按 CPU benchmark suite、workload characterization、统计严谨性、配置敏感性、benchmark ranking 和评价学方法论组织，并包含对比表。正式论文中可根据篇幅压缩为 1.5 至 2 页。

## 7. 讨论要点

本文需要避免把 BenchCPU 写成另一个单纯 leaderboard。更好的定位是：BenchCPU 提供开放配置空间，本文解释这个空间中性能分布的形成机制。讨论部分可以围绕三个观点展开。

第一，固定配置 benchmark 不是错误的，但它只观察配置空间中的一个点，因此适合标准化比较，却不一定适合解释真实性能分布。第二，workload sensitivity 和 architecture sensitivity 不能分开看；同一 workload 的参数敏感性可能随 CPU 架构发生变化。第三，多指标 benchmark ranking 的分歧不是噪声，而是不同 benchmark 观察到不同性能侧面的结果。

讨论部分还应主动说明本文与已有 BenchCPU 方法论文的关系：前作回答“为什么需要开放配置空间”，本文回答“开放配置空间中的性能分布如何被解释”。这样可以避免被审稿人认为本文只是前作的重复实验。

## 8. 威胁有效性

本文后续需要在正式稿中加入 threats to validity，至少包括以下四类。

**平台覆盖威胁。** 如果实验平台数量较少，结论应限制为当前 CPU/ISA 范围内的观察，避免泛化到所有服务器处理器。

**配置采样威胁。** 随机配置采样可能未覆盖极端配置区域，需要说明采样策略、随机种子、配置范围和重复次数。

**测量噪声威胁。** 多租户环境、温度、频率调节、NUMA 绑定、系统后台任务和 I/O 状态都可能影响运行时间，需要报告控制方法。

**指标解释威胁。** 硬件计数器和 PCA 只能提供相关性解释，不能单独证明因果机制；必要时需要用对照实验验证关键解释。

## 9. 后续实验接口

为了把本文从草案推进到可投稿版本，后续最需要补充以下实验表和图。

| 编号 | 实验/图表 | 回答问题 | 当前用途 |
|---|---|---|---|
| E1 | 每个 workload 的运行时间分布、CV、min/max | RQ1 | 识别高敏感负载 |
| E2 | 配置参数与运行时间相关性表 | RQ1 | 找出主要驱动参数 |
| E3 | 同一 workload 在不同 CPU 上的分布对比 | RQ2 | 证明架构会改变敏感性 |
| E4 | BenchCPU 与 SPECspeed/SPECrate ranking correlation | RQ3 | 分析 benchmark 一致性和分歧 |
| E5 | 硬件计数器 PCA 或聚类图 | RQ1/RQ2 | 给出微架构归因 |
| E6 | 固定配置 vs 分布统计 vs 最优配置排名 | RQ3 | 说明固定配置可能导致偏差 |

## 10. 当前最应该补强的文字

后续写作时，Introduction 需要反复压住一条主线：本文不是“谁跑得更快”的平台比较，而是解释“为什么同一 benchmark 在不同配置和不同架构下会产生不同性能结论”。Results 每一节也应保持同样结构：Question → Experiment → Data → Finding → 1-hop Implication。这样可以避免论文变成数据堆砌。