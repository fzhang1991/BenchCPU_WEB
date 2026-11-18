# BenchCPU 测试分析论文 100 次迭代清单

目标截止时间：Sep 1 08:00。本文档用于把“持续优化论文”拆成可检查的 100 个微迭代。每一轮只检查一个维度，避免大改时丢失主线。当前已执行第 1 轮高价值重写：明确论文主线、贡献边界、结果模板和后续实验接口。

## 使用规则

- 每完成一项，将 `[ ]` 改为 `[x]`，并在后面补一句改动摘要。
- 未获得实验数据之前，不把预期趋势写成已验证结论。
- 每个 Results 小节必须遵循：Question → Experiment → Data → Finding → 1-hop Implication。
- 每 10 轮作为一个检查点，检查论文是否仍围绕 `workload × configuration × architecture` 主线。

## Cycle 1：主线与问题定义

- [x] 001. 明确本文不是新 benchmark 方法论文，而是 BenchCPU 测试分析论文。
- [ ] 002. 将题目压缩到 configuration sensitivity、workload、architecture 三个核心词。
- [ ] 003. 检查摘要第一句是否直接指出固定配置评测的局限。
- [ ] 004. 检查摘要是否避免提前声称尚未补实验的数据结论。
- [ ] 005. 检查 Introduction 是否在前三段完成 problem、gap、approach。
- [ ] 006. 检查贡献点是否都是本文能通过实验回答的问题。
- [ ] 007. 检查 RQ1 是否只问配置对 workload 的影响。
- [ ] 008. 检查 RQ2 是否只问架构是否改变配置敏感性。
- [ ] 009. 检查 RQ3 是否只问 benchmark ranking 一致性与分歧。
- [ ] 010. 删除与当前 BenchCPU 无关的优化收益叙事。

## Cycle 2：相关工作

- [ ] 011. 检查相关工作表格是否覆盖 SPEC、PARSEC、CloudSuite、workload characterization、统计评测、配置敏感性、评价学。
- [ ] 012. 将表格中的 ✓/△/✗ 与正文叙述保持一致。
- [ ] 013. 为 SPEC CPU2017/CPU2026 增加更精确的引用信息。
- [ ] 014. 为 Surprise Benchmarking 增加一句与 unexpected behavior 的关系。
- [ ] 015. 为数据库实验设置敏感性工作增加一句与本文差异。
- [ ] 016. 为统计严谨性能评测工作增加一句为什么支持分布报告。
- [ ] 017. 为 microarchitecture-independent characterization 增加一句与 ISA 分析的关系。
- [ ] 018. 明确已有 BenchCPU 论文与本文的区别。
- [ ] 019. 压缩相关工作中重复的“固定配置”表述。
- [ ] 020. 将重点参考文献转成 BibTeX 待办清单。

## Cycle 3：实验设计

- [ ] 021. 明确 54 个 workload 的分类标准。
- [ ] 022. 明确每个 workload 的配置参数类型。
- [ ] 023. 明确随机配置轮数和随机种子。
- [ ] 024. 明确平台清单和 ISA/微架构信息。
- [ ] 025. 明确编译器、版本和 flags。
- [ ] 026. 明确是否固定 CPU frequency / governor。
- [ ] 027. 明确 NUMA、thread pinning 和 isolation 设置。
- [ ] 028. 明确重复测量次数和异常运行处理规则。
- [ ] 029. 明确运行时间统计口径。
- [ ] 030. 明确 SPECspeed/SPECrate 数据来源和版本。

## Cycle 4：RQ1 配置敏感性结果

- [ ] 031. 生成每个 workload 的 mean/median/min/max/std/CV 表。
- [ ] 032. 生成 Top-k 高 CV workload 表。
- [ ] 033. 生成 workload 类别维度的 CV 分布图。
- [ ] 034. 计算参数与运行时间的 Pearson correlation。
- [ ] 035. 计算参数与运行时间的 Spearman correlation。
- [ ] 036. 给每个高敏感 workload 写一句主要驱动参数。
- [ ] 037. 检查是否存在低敏感 workload 作为对照。
- [ ] 038. 写 RQ1 的 Finding，不超过数据支持范围。
- [ ] 039. 写 RQ1 的 1-hop implication。
- [ ] 040. 检查 RQ1 是否没有提前涉及架构泛化结论。

## Cycle 5：RQ2 架构敏感性结果

- [ ] 041. 对齐不同平台上的相同配置集合。
- [ ] 042. 计算每个平台每个 workload 的 CV。
- [ ] 043. 计算同一参数相关性在不同平台上的差异。
- [ ] 044. 生成 Intel/AMD/ARM 的分布对比图。
- [ ] 045. 找出架构差异最大的 workload。
- [ ] 046. 找出架构差异最小的 workload。
- [ ] 047. 检查是否需要按核心数或频率归一化。
- [ ] 048. 写 RQ2 的 Finding。
- [ ] 049. 写 RQ2 的 1-hop implication。
- [ ] 050. 检查 RQ2 是否把“更快”和“更敏感”区分开。

## Cycle 6：RQ3 benchmark ranking 结果

- [ ] 051. 整理 BenchCPU Time 排名。
- [ ] 052. 整理 SPECspeed Int/FP 排名。
- [ ] 053. 整理 SPECrate Int/FP 排名。
- [ ] 054. 计算 Spearman ranking correlation。
- [ ] 055. 生成 ranking correlation matrix。
- [ ] 056. 生成 pairwise ranking disagreement 表。
- [ ] 057. 对比 fixed configuration 与 distribution-aware ranking。
- [ ] 058. 分析排名分歧是否来自某类 workload 或配置区域。
- [ ] 059. 写 RQ3 的 Finding。
- [ ] 060. 写 RQ3 的 1-hop implication。

## Cycle 7：硬件计数器与归因

- [ ] 061. 整理 IPC、MPKI、Branch、Frontend/Backend、Retiring、Inst Mix、DRAM 指标。
- [ ] 062. 对硬件计数器做标准化。
- [ ] 063. 运行 PCA 并记录解释方差。
- [ ] 064. 生成 PC loading 表。
- [ ] 065. 将高敏感 workload 映射到 PCA 空间。
- [ ] 066. 检查敏感性是否与 cache pressure 相关。
- [ ] 067. 检查敏感性是否与 frontend pressure 相关。
- [ ] 068. 检查敏感性是否与 memory access intensity 相关。
- [ ] 069. 写硬件计数器归因 Finding。
- [ ] 070. 检查归因表述是否没有把相关性写成因果。

## Cycle 8：图表与论文可读性

- [ ] 071. 检查每张图是否回答一个 RQ。
- [ ] 072. 检查每张表是否有明确 take-away。
- [ ] 073. 给相关工作对比表写更短标题。
- [ ] 074. 给实验设置表补全平台、OS、kernel、compiler。
- [ ] 075. 给 workload 分类表补全参数空间。
- [ ] 076. 给每个 Results 小节添加 opening question。
- [ ] 077. 给每个 Results 小节添加 closing implication。
- [ ] 078. 删除没有被正文引用的图表。
- [ ] 079. 检查所有图表编号连续。
- [ ] 080. 检查图表标题是否可独立理解。

## Cycle 9：讨论、限制与审稿风险

- [ ] 081. 明确本文不是否定固定配置 benchmark。
- [ ] 082. 明确本文与 BenchCPU 已发表论文的增量。
- [ ] 083. 写平台数量不足的 limitation。
- [ ] 084. 写配置采样覆盖不足的 limitation。
- [ ] 085. 写测量噪声和系统状态的 limitation。
- [ ] 086. 写硬件计数器解释的 limitation。
- [ ] 087. 写 future work：更多 CPU、更多 ISA、更多配置轮数。
- [ ] 088. 检查 Discussion 是否回扣 RQ。
- [ ] 089. 检查 Conclusion 是否只总结已验证发现。
- [ ] 090. 准备审稿人可能质疑清单。

## Cycle 10：投稿前收敛

- [ ] 091. 全文统一 BenchCPU、SPECspeed、SPECrate 写法。
- [ ] 092. 全文统一 workload/configuration/architecture 术语。
- [ ] 093. 全文删除“显然、很强、非常”等非论文语气。
- [ ] 094. 全文检查每个 claim 是否有图/表支持。
- [ ] 095. 全文检查是否存在与当前实验无关的数据。
- [ ] 096. 检查参考文献格式和 BibTeX。
- [ ] 097. 检查摘要、引言、结论是否三处一致。
- [ ] 098. 检查标题是否准确反映贡献。
- [ ] 099. 导出 PDF 并检查表格是否跨页可读。
- [ ] 100. 最终通读：是否清楚回答“为什么配置、负载和架构必须一起分析”。