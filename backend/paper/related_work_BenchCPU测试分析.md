# BenchCPU 测试分析论文：相关工作

## 相关工作

本文关注开放配置空间下 CPU benchmark 结果的测试分析问题：不同配置参数如何影响不同负载，同一类配置影响是否会在不同 ISA 和微架构平台上被放大或抑制，以及 BenchCPU 与 SPEC 类指标在平台排序和性能解释上为何可能一致或分歧。围绕这一问题，相关工作主要来自五条研究线：CPU benchmark suite、workload characterization、统计严谨与可复现性能评测、配置敏感性分析，以及 benchmark 方法论与评价学。

### 相关工作对比

表 1 从研究对象、配置空间、负载分析、跨架构比较和本文关系五个维度总结相关工作。其中，✓ 表示该工作直接研究并解决该问题，△ 表示该工作与该问题相关，但仅提供背景、部分结论或方法启发；✗ 表示该工作不属于该维度的主要关注对象。更具体地说，△ 不是“模糊地有一点关系”，而是指：这类工作确实研究了相关问题，但没有在本文所关心的 workload × configuration × architecture 三者交互层面给出系统结论。本文正是要补足这个空白：在开放配置空间中，分析同一 workload 在不同配置下的性能分布，以及这种差异如何随着 ISA/CPU 架构变化。

| 研究方向 | 代表工作 | 该工作具体做了什么 | 本文在这个方向上做了什么 | 与本文关系 |
|---|---|---|---|---|
| 标准 CPU benchmark | SPEC CPU2017:<br>Limaye and Adegbija, "A Workload Characterization of the SPEC CPU2017 Benchmark Suite," ISPASS 2018.<br><br>SPEC CPU2026:<br>M. Madhav et al., "SPEC CPU: The Next Generation," in 2026 ACM/IEEE 53rd Annual International Symposium on Computer Architecture (ISCA), 2026, pp. 671-687.<br>B. Li et al., "SPEC CPU2026: Characterization, Representativeness, and Cross-Suite Comparison," arXiv:2605.03713, 2026. | 设计固定 benchmark suite，给出标准化评分和性能比较基准；SPEC CPU2026 进一步扩展了微架构覆盖面和跨套件比较 | 以 SPEC CPU2026 为最新参考基准，并把它作为与 BenchCPU 开放配置空间结果的对照对象；强调固定 benchmark 不能解释配置敏感性和分布变化 | △：相关但不是本文主线；本文不是再做 suite 设计，而是分析配置驱动下的结果分布 |
| 多核与云 workload suite | PARSEC:<br>Bienia et al., "The PARSEC Benchmark Suite: Characterization and Architectural Implications," PACT 2008.<br><br>SPLASH-2:<br>Woo et al., "The SPLASH-2 Programs: Characterization and Methodological Considerations," ISCA 1995.<br><br>CloudSuite:<br>Ferdman et al., "Clearing the Clouds: A Study of Emerging Workloads on Modern Hardware," ASPLOS 2012. | 构建多线程、并行和云工作负载集，强调 workload 多样性和架构压力差异 | 关注的是同一 workload 在不同配置参数下表现如何变化，而不是只构造更多 workload | △：相关背景；本文把重点从“工作负载覆盖”转向“配置敏感性与交互” |
| Workload characterization | Hoste and Eeckhout, "Microarchitecture-Independent Workload Characterization," IEEE Micro 2007.<br><br>Phansalkar et al., "Measuring Program Similarity: Experiments with SPEC CPU Benchmark Suites," ISPASS 2005.<br><br>Shao and Brooks, "ISA-Independent Workload Characterization and Its Implications for Specialized Architectures," ISPASS 2013. | 研究 workload 相似性、冗余性、微架构无关特征，说明 benchmark 需要覆盖不同程序行为 | 继承其方法学，对 BenchCPU 负载进行行为解释，并进一步分析配置对 workload 行为和性能分布的影响 | △：方法基础；本文在表征维度上走向“配置-行为-架构”三维分析 |
| SPEC 代表性分析 | Limaye and Adegbija, "A Workload Characterization of the SPEC CPU2017 Benchmark Suite," ISPASS 2018.<br><br>Panda et al., "Wait of a Decade: Did SPEC CPU 2017 Broaden the Performance Horizon?" 2018.<br><br>Li et al., "SPEC CPU2026: Characterization, Representativeness, and Cross-Suite Comparison," arXiv:2605.03713, 2026. | 分析 SPEC suite 代表性、覆盖范围和跨套件差异，说明不同 benchmark 对微架构压力的解释不同 | 重点不是再证明 SPEC 是否代表性，而是比较 BenchCPU 与 SPEC 在开放配置空间下的排序和解释差异 | △：与本文互补；本文更关注配置变化导致的分布与排序差异 |
| 统计严谨与可复现评测 | Georges et al., "Statistically Rigorous Java Performance Evaluation," OOPSLA 2007.<br><br>Mytkowicz et al., "Producing Wrong Data Without Doing Anything Obviously Wrong!" ASPLOS 2009.<br><br>Hoefler and Belli, "Scientific Benchmarking of Parallel Computing Systems: Twelve Ways to Tell the Masses When Reporting Performance Results," SC 2015.<br><br>Koskela et al., "Principles for Automated and Reproducible Benchmarking," SC Workshops 2023. | 强调测量误差、统计显著性、实验规范和可复现性，避免单次结果误导 | 在本文中使用分布、CV、置信区间、极值和异常点来解释结果，并将它们作为 benchmark 结论的可靠性基础 | △：理论支撑；本文将统计方法嵌入到配置敏感性分析框架中 |
| 配置/实验设置敏感性 | Wang et al., "A Study of Database Performance Sensitivity to Experiment Settings," PVLDB 2022.<br><br>Benson et al., "Surprise Benchmarking: The Why, What, and How," DBTest 2024. | 说明数据库/系统 benchmark 对实验设置和参数配置非常敏感，固定配置会误导结论 | 将该思想拓展到 CPU benchmark，研究 workload × configuration × architecture 如何形成性能分布和排名差异 | ✓：最接近本文；本文在相同思想上进一步落到 CPU benchmark 与跨架构分析 |
| 评价学与开放评价 | OpenMeter.<br><br>Zhan et al., "Evaluatology: The Science and Engineering of Evaluation," BenchCouncil Transactions on Benchmarks, Standards and Evaluations 2024.<br><br>BenchCPU prior work, "Performance Distribution-Aware CPU Benchmarking over Open Configuration Spaces." | 讨论评价空间、评价指标、开放配置和 performance distribution-aware benchmarking | 本文不是重新定义评价学，而是用实证分析解释开放配置空间中的分布结构与归因机制 | ✓：方法论上延续；本文更关注“原因分析”而非“评价框架重新定义” |
| 本文 | BenchCPU 测试分析 | 使用 54 个 BenchCPU 负载、多轮随机配置、SPEC 指标和硬件计数器，系统研究 workload、configuration 与 architecture 的交互机制 | 本文的核心贡献是：解释为什么同一负载在不同配置下表现分化，为什么这种分化在不同 ISA/CPU 架构上不同，以及为什么 BenchCPU 与 SPEC 排名可能一致或不一致 | 代表本文的主线研究 |

此外，表 1 也可以被视为对相关工作进行“贡献定位”：对于每篇工作，都明确回答了两个问题：第一，这篇文章具体做了什么；第二，本文与它的差异在哪里。这样做比单纯写“△/✓/✗”更能说明研究定位，也更符合论文审稿中“相关工作对比”的叙述要求。

### CPU benchmark suite 与固定配置评测

CPU 性能评测长期依赖标准化 benchmark suite。SPEC CPU 系列是其中最具代表性的基准测试体系，其中 SPEC CPU2026 是当前最新版本，SPEC CPU2017 则主要作为历史对照基准。SPEC CPU2026 通过一组标准程序覆盖整数、浮点、缓存、分支、前端压力和吞吐能力等维度；相比于 SPEC CPU2017，它在指令规模、内存 footprint 和指令缓存压力等微架构特征上有所扩展。围绕 SPEC CPU2017，已有研究分析了其 workload 组成、微架构行为和代表性。Limaye and Adegbija, A Workload Characterization of the SPEC CPU2017 Benchmark Suite, 对 SPEC CPU2017 进行 workload characterization；Panda et al., Wait of a Decade: Did SPEC CPU 2017 Broaden the Performance Horizon? 讨论 SPEC CPU2017 相比前代套件是否拓宽了性能覆盖范围。近期，Li et al., SPEC CPU2026: Characterization, Representativeness, and Cross-Suite Comparison, 对 SPEC CPU2026 进行了跨平台和跨套件分析，比较了 SPEC CPU2026 与 SPEC CPU2017、DCPerf、MLPerf 以及 agentic AI probes 在微架构特征上的差异。

除 SPEC 外，PARSEC、SPLASH-2、CloudSuite 等 benchmark suite 也被广泛用于多核、并行和数据中心工作负载研究。Bienia et al. 提出的 PARSEC benchmark suite 强调多线程应用的体系结构含义；Woo et al. 的 SPLASH-2 工作奠定了并行程序 benchmark characterization 的基础；Ferdman et al. 通过 CloudSuite 展示了现代云工作负载对处理器、缓存和内存系统提出的不同压力。这些工作共同推动 CPU benchmark 从单纯运行时间比较走向 workload behavior characterization。

这些 benchmark suite 的优势在于标准化和可比性，但其典型使用方式仍然依赖相对固定的输入规模、并发度、编译配置和运行设置。固定配置有利于复现实验，却也将评测简化为单点测量，可能忽略同一 workload 在不同配置下的性能分布。对于现代服务器 CPU，尤其是在 x86、ARM 等不同 ISA 以及不同核心数、缓存层次、NUMA 拓扑和编译器后端共同作用的环境中，单一配置结果可能不足以刻画平台真实表现。本文正是在这一背景下，将配置空间中的性能分布作为分析对象，而不只比较固定配置下的聚合分数。

### Workload characterization 与代表性分析

为了判断 benchmark 是否能够代表真实应用，研究者提出了大量 workload characterization 方法。Hoste and Eeckhout 提出的 microarchitecture-independent workload characterization 试图区分程序固有行为与具体机器实现之间的影响，使 workload 比较不完全依赖某一个处理器平台。Phansalkar et al. 使用程序相似性分析研究 SPEC benchmark suite 的冗余性和代表性，Shao and Brooks 进一步讨论 ISA-independent workload characterization 对专用体系结构设计的意义。这类研究的核心思想是：benchmark 的价值不仅取决于程序数量，也取决于它们是否覆盖足够丰富且不冗余的程序行为。

近年来，workload characterization 进一步从静态程序相似性扩展到更完整的行为画像。WPC（Whole-picture Workload Characterization）强调从多维指标描述 workload 的整体行为；SPEC CPU2026 characterization 工作也使用 IPC、cache miss、branch behavior、frontend/backend pressure 和 instruction mix 等指标分析 benchmark suite 的覆盖范围。类似地，数据中心和云计算 benchmark 研究也大量采用硬件性能计数器刻画应用对前端、后端、缓存、分支和内存系统的压力。

本文继承 workload characterization 的思路，但关注点有所不同。已有工作主要回答“一个 benchmark suite 覆盖了哪些 workload 行为”或“不同 workload 之间是否相似”；本文进一步追问“同一个 workload 在不同配置下的行为和性能分布如何变化”，以及“这种变化在不同 ISA/CPU 平台上是否表现一致”。因此，本文不是只做 workload 静态分类，而是把 workload、configuration 和 architecture 三者之间的交互作为主要分析对象。

### 统计严谨性与可复现性能评测

性能评测结果容易受到测量噪声、实验设置、统计处理和系统环境的影响。Jain 的系统性能分析方法、Fisher 的实验设计思想，以及 Georges et al. 关于 Java 性能评测统计严谨性的研究，都强调性能结论不能依赖单次运行或未经检验的简单平均值。Mytkowicz et al. 进一步指出，即使研究者没有明显错误，环境变量、链接顺序、地址布局等看似无关的因素也可能导致错误性能结论。Hoefler and Belli 总结了并行计算系统 benchmark 报告中的常见陷阱，提出性能报告应明确统计方法、误差范围、系统配置和可复现边界。Koskela et al. 则从自动化和可复现 benchmark 的角度总结了实验流程设计原则。

这些工作说明，benchmark 的可信度不仅来自 workload 本身，也来自实验设计、统计分析和结果解释。BenchCPU 已有工作提出 performance distribution-aware benchmarking，将 CPU 评价从固定配置单点结果扩展到配置空间中的性能分布。本文延续这一思想，在实验分析中关注均值、方差、变异系数、置信区间、极值和异常点等统计量，并进一步分析这些统计量如何随 workload 类型、配置参数和 CPU 架构改变。与仅报告 leaderboard 分数不同，本文试图解释分数背后的分布结构。

### 配置敏感性与实验设置敏感性

与本文最接近的一条研究线是 configuration sensitivity 和 experiment-setting sensitivity。Wang et al. 在数据库领域研究了实验设置对数据库性能的影响，指出不同参数设置可能显著改变性能结论。Benson et al. 提出的 Surprise Benchmarking 也从数据库测试角度讨论为什么 benchmark 需要主动寻找 unexpected behavior，以及如何通过实验设计发现传统固定流程难以暴露的问题。这类研究表明，benchmark 结果并非只由 workload 名称决定，输入规模、并发度、编译选项、运行参数、系统状态和执行环境都可能成为主导因素。

BenchCPU 先前工作已经指出，固定 workload configuration 可能导致 biased evaluation 和 outlier，并提出以 open configuration space 和 performance distribution 作为 CPU 评测基础。本文在此基础上进一步转向归因分析：固定配置偏差来自哪些配置参数；哪些 workload 对参数变化最敏感；同一参数变化在不同 ISA/CPU 平台上是否产生不同幅度的性能波动；以及这种波动能否被硬件计数器和 workload 行为解释。换言之，本文不再仅论证“固定配置会产生偏差”，而是分析“偏差为何产生、何时产生、在哪些平台上更严重”。

### Benchmark ranking 与跨套件一致性

CPU 排名通常由某个 benchmark suite 的聚合分数给出，但不同 benchmark 对处理器资源提出的压力并不相同，因此不同套件之间的排名未必一致。SPECspeed 更强调单任务速度，SPECrate 更强调吞吐能力，BenchCPU Time 则反映开放配置空间下多个 workload 和多轮配置采样的总体执行代价。SPEC CPU2026 与 SPEC CPU2017、DCPerf、MLPerf 等套件的对比研究也表明，即使同属 CPU 或系统评测，不同 benchmark 覆盖的微架构行为范围仍有明显差异。

因此，benchmark disagreement 本身就是一个重要研究问题。当 BenchCPU 与 SPECspeed/SPECrate 对同一批平台给出不同差距甚至不同排序时，这种差异可能来自 workload 构成、配置空间、并发度、输入规模、编译器、内存压力、前端压力或 ISA/微架构特征。本文将这一问题与配置敏感性结合起来：如果一个平台在某些配置区域表现特别好或特别差，那么固定配置或单一 benchmark 指标就可能放大局部优势、掩盖整体分布，最终影响平台排序解释。

### Benchmark 方法论与评价学

BenchCouncil 的 OpenMeter、Zhan et al. 的 evaluatology 系列工作，以及已有 BenchCPU 论文共同试图把 benchmark 从经验性测试提升为评价科学问题。这一方向强调评价对象、评价空间、评价指标、评价过程和评价解释之间的系统关系。已有 BenchCPU 工作将 CPU 评价从固定 workload configuration 转向开放配置空间，并引入 performance distribution-aware 的评价方式，为后续测试分析奠定了方法基础。

本文可被看作 BenchCPU 方法论的一项实证延伸。已有 BenchCPU 工作回答了“为什么需要开放配置空间”和“如何基于性能分布进行 CPU 评价”；本文进一步回答“开放配置空间中的性能分布由什么因素塑造”。通过结合 54 个 BenchCPU 负载、多轮随机配置、SPEC 类指标和硬件性能计数器，本文分析 workload、configuration 和 architecture 三者之间的交互关系，目标是为 CPU benchmark 结果提供更细粒度、可解释的测试分析框架。

### 与已有工作的区别

综上，已有研究分别从 benchmark suite 设计、workload characterization、统计严谨性、可复现评测、配置敏感性和评价学方法论等角度推进了 CPU 性能评测研究。但仍存在三个不足。第一，许多 CPU benchmark 研究仍以固定配置或固定输入为基本单位，较少系统分析开放配置空间中的性能分布结构。第二，已有 workload characterization 更多关注 workload 行为向量和套件覆盖范围，较少分析同一 workload 在不同配置下的敏感性差异。第三，跨平台研究通常关注不同 CPU 的平均性能或最终排名，而较少把 ISA/微架构作为影响配置敏感性的调节因素进行分析。

本文拟补足这一空缺。不同于传统 benchmark 论文只报告平台分数，也不同于已有 characterization 工作只刻画 workload 行为覆盖范围，本文以配置敏感性为中心，分析不同配置参数对不同 workload 的影响、这种影响在不同 ISA/CPU 架构上的变化，以及 BenchCPU 与 SPEC 类指标之间的排序一致性和解释差异。通过这些分析，本文希望说明：CPU 性能评测结果不是 workload、configuration 或 architecture 中任一因素单独决定的，而是三者交互作用的结果。

## 重点参考文献清单

- SPEC. SPEC CPU benchmark suite and public results.
- SPEC. SPEC CPU the next generation. [SPEC CPU2026 overview / next-generation benchmark description].
- Limaye and Adegbija. A Workload Characterization of the SPEC CPU2017 Benchmark Suite. ISPASS 2018.
- Panda et al. Wait of a Decade: Did SPEC CPU 2017 Broaden the Performance Horizon? 2018.
- Li et al. SPEC CPU2026: Characterization, Representativeness, and Cross-Suite Comparison. arXiv:2605.03713, 2026.
- Bienia et al. The PARSEC Benchmark Suite: Characterization and Architectural Implications. PACT 2008.
- Woo et al. The SPLASH-2 Programs: Characterization and Methodological Considerations. ISCA 1995.
- Ferdman et al. Clearing the Clouds: A Study of Emerging Workloads on Modern Hardware. ASPLOS 2012.
- Hoste and Eeckhout. Microarchitecture-Independent Workload Characterization. IEEE Micro 2007.
- Phansalkar et al. Measuring Program Similarity: Experiments with SPEC CPU Benchmark Suites. ISPASS 2005.
- Shao and Brooks. ISA-Independent Workload Characterization and Its Implications for Specialized Architectures. ISPASS 2013.
- Georges et al. Statistically Rigorous Java Performance Evaluation. OOPSLA 2007.
- Mytkowicz et al. Producing Wrong Data Without Doing Anything Obviously Wrong! ASPLOS 2009.
- Hoefler and Belli. Scientific Benchmarking of Parallel Computing Systems: Twelve Ways to Tell the Masses When Reporting Performance Results. SC 2015.
- Koskela et al. Principles for Automated and Reproducible Benchmarking. SC Workshops 2023.
- Wang et al. A Study of Database Performance Sensitivity to Experiment Settings. PVLDB 2022.
- Benson et al. Surprise Benchmarking: The Why, What, and How. DBTest 2024.
- Wang et al. Achieving Consistent and Comparable CPU Evaluation Outcomes. arXiv:2411.08494, 2024.
- Zhan et al. Evaluatology: The Science and Engineering of Evaluation. BenchCouncil Transactions on Benchmarks, Standards and Evaluations 2024.
- BenchCPU prior work. Performance Distribution-Aware CPU Benchmarking over Open Configuration Spaces.