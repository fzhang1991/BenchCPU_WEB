# REWRITE：科学思考与论文写作工作流

## 名称释义

**REWRITE** 既表示“重写”，也代表一套贯穿科研思考、实验设计与论文写作的循环工作流：

- **R — Research Question：研究问题**
- **E — Examine the Literature：审视文献**
- **W — Work / Experiment：开展研究与实验**
- **R — Read the Finding：读懂发现**
- **I — Interrogate the Finding：追问发现**
- **T — Test Answerability：检验可回答性**
- **E — Extend or Exit：拓展或收束**

REWRITE 的核心思想是：

> **Writing is thinking.**
>
> 写作不是把已经想清楚的内容表达出来，而是迫使研究者把问题、证据、解释、边界和下一步研究显性化。

因此，REWRITE 既是一套**科学写作框架**，也是一套**科研思维工作流**。

它的基本循环是：

> **研究问题 → 实验 → 发现 → 解释 → 新问题 → 可回答性判断**

如果新问题能够在当前研究中回答：

> **新问题 → 新分析 / 新实验 → 新 Results → 再产生新问题**

如果新问题当前无法回答：

> **新问题 → Discussion → Limitation → Future Study**

真正成熟的研究，不是“做完预定实验以后开始写论文”，而是不断执行：

> **Finding → Question → Test → Finding**

直到剩余的问题自然定义下一项研究。

---

# 一、R — Research Question：研究问题

不要从“我要用什么方法”开始，也不要从某个算法、模型、数据集、benchmark 或可视化技术开始组织研究。

首先问：

> **我们真正想回答的 scientific question 是什么？**

学术研究通常有一个重要的“**开题**”过程。所谓开题，不只是确定一个题目，而是：

> **把问题打开。**

一个最有效、也最可操作的办法，就是围绕同一个核心现象，从多个问题维度继续展开：

> **When / What / Why / How / Whether / To what extent**

这些问题词并不是简单的语言形式，而是不同的科研思维方向：

- **When**：寻找成立条件与边界；
- **What**：寻找关键因素、对象或决定变量；
- **Why**：寻找原因、机制或解释；
- **How**：寻找过程、路径与实现机制；
- **Whether**：检验现象是否成立、是否必要、是否可泛化；
- **To what extent**：确定效应强度、适用范围与定量边界。

因此，“开题”的本质可以理解为：

> **从一个初始问题或 finding 出发，用这些问题维度把单点问题展开成一个 question space。**

这套方法既适用于研究刚开始时的选题与开题，也适用于得到一个重要 finding 之后继续生成新的 scientific questions。

常见问题类型包括：

### Whether：是否成立

- X 是否真的提高 Y？
- 这种优势是否稳定？
- 控制其他因素后是否仍然存在？
- 是否能够泛化到新数据、新任务或新体系？

### What：什么因素决定

- 哪个模块贡献最大？
- 什么特征决定成功或失败？
- 哪个变量真正驱动观察到的现象？

### How：如何发生

- X 如何改变 representation？
- 一个算法如何跳出局部最优？
- 结构信息如何改善预测？

### Why：为什么发生

- 为什么 X 会优于 Y？
- 背后的机制或原理是什么？

### When：何时成立

- 在什么条件下优势出现？
- 什么时候优势消失？
- 边界条件是什么？

### Where：在哪里成立

- 在哪些数据域、任务、物种、体系或 regime 中成立？

### To what extent：成立到什么程度

- 效应有多强？
- 定量边界在哪里？
- 多大的扰动以后结论失效？

研究起点应当形成：

> **Scientific Question → Hypothesis → Experimental Design**

---

# 二、E — Examine the Literature：审视文献

文献不是 Introduction 的装饰，而是科研推理的坐标系。

REWRITE 设置两个文献检查点。

## Literature Checkpoint 1：研究开始之前

在确定核心 scientific question 后，检查：

1. 这个问题是否已经被回答？
2. 已有工作提供了哪些解释？
3. 存在哪些 competing hypotheses？
4. 已知的 boundary conditions 是什么？
5. 当前工作相对于已有研究究竟新增什么？

这里的目标不是“找够引用”，而是判断：

> **Novelty 在哪里？**

以及：

> **当前研究真正需要区分哪些已有解释？**

## Literature Checkpoint 2：得到重要 Finding 之后

每得到一个重要 finding，再回到文献，问：

> **这个 finding 与已有认识是什么关系？**

可以分成：

- **Confirm**：验证已有结论；
- **Contradict**：与已有结论冲突；
- **Refine**：对已有结论增加边界、条件或更精细解释；
- **Extend**：把已有结论推广到新的任务、体系或场景；
- **Reframe**：改变问题本身的理解方式。

这一检查点直接决定 Discussion 的深度。

真正值得讨论的通常不是：

> “我们的结果与某文一致。”

而是：

> **我们的发现改变、修正或扩展了什么认识？**

---

# 三、W — Work / Experiment：开展研究与实验

每个实验都应当对应一个明确问题。

不要因为“论文通常需要 ablation”就做 ablation；也不要因为“别人画 t-SNE”就画 t-SNE。

先问：

> **这个实验究竟要回答什么问题？**

理想结构是：

> **Question → Experiment → Data → Finding**

实验是回答问题的工具，不是论文 Results 的组织单位。

---

# 四、R — Read the Finding：读懂发现

得到结果以后，不要立刻跳到下一项实验。首先区分三个层级。

## 1. Data：数据

原始观察或定量结果。

## 2. Finding：发现

数据直接支持的定性陈述。

## 3. 1-hop implication：一步推论

在不远离数据的前提下，向前走一步。

因此，一个 Results subsection 的标准结构是：

> **Question → Experiment → Data → Finding → 1-hop Implication**

Results subsection 的结尾应当回答：

> **这个具体结果意味着什么？**

但不要在这里直接跳到领域级 general principle。

---

# 五、异常结果与偶然发现：Anomaly Branch

真实科研不是完全线性的。实验经常会出现与假设相反的结果、异常样本、unexpected subgroup、看似失败但可重复的现象，或与已有理论不一致的结果。

因此每个重要实验之后，都应检查：

> **结果是否符合原先预期？**

如果符合，进入正常 REWRITE 流程。

如果不符合，进入异常结果分支：

### 1. 是技术错误吗？

检查数据处理错误、实现 bug、测量误差、数据泄漏、batch effect、样本污染、统计假象等。

如果是：

> 修正后重新实验。

### 2. 是随机噪声吗？

问：

> 是否可重复？

如果不可重复：

> 暂不作为主要 finding。

### 3. 是稳定、可重复的异常现象吗？

如果是，不要强行把它塞回原 hypothesis。

应当问：

> **这个异常是否意味着原来的 scientific question 不完整，甚至问错了？**

此时允许：

> **Unexpected Finding → Rewrite the Question**

也就是说，REWRITE 不仅“整理已有成果”，还允许研究问题被新发现重新定义。

---

# 六、I — Interrogate the Finding：追问发现

每个重要 finding 都应该继续产生问题。

系统追问：

- **Why？**
- **How？**
- **What？**
- **Whether？**
- **When？**
- **Where？**
- **To what extent？**

一个好的 finding 应该能够打开新的 question space。

---

# 七、T — Test Answerability：检验可回答性

这是 REWRITE 最关键的决策点。

对于每个新问题，问：

> **当前研究能不能通过额外分析或实验回答这个问题？**

## 如果答案是 YES

不要把它过早写进 Discussion。

应该继续做：

> **New Question → New Experiment / Analysis → New Finding → New Results**

例如，若发现 A 在 OOD 上优于 B，接着问“这种优势是否在不同 protein family 中一致？”而现有数据已包含多个 family，就应该立即分析，并把结果做成新的 Results subsection。

同样，如果“哪个模块带来主要提升？”可以通过 ablation 回答，就不应该写成 Future Work。

## 如果答案是 NO

问题才进入 Discussion：

> **New Question → Why current study cannot answer → Limitation → Future Study**

---

# 八、Results 应按 Scientific Question 组织，而不是按技术组织

不推荐：

- Ablation Study
- OOD Evaluation
- t-SNE Visualization
- Case Study

这些标题描述的是：

> **我们做了什么。**

更好的标题描述：

> **我们学到了什么。**

例如：

- “模块 X 是性能提升的主要来源”
- “性能优势在 distribution shift 下仍然保持”
- “学到的 representation 更好地区分不同功能状态”

核心原则：

> **科研过程从 Question 开始；论文 Results subsection 的标题通常写成 Answer。**

---

# 九、Discussion Opening：1-hop → 2-hop

Results 中每个 subsection 通常已经得到一个 1-hop implication。

Discussion 第一段的任务不是重复 Results，而是：

> **把多个 1-hop implication 综合成一个 2-hop interpretation。**

问：

> **Taken together，这些结果对本研究整体意味着什么？**

因此：

> **Multiple 1-hop implications → Integrated 2-hop Interpretation**

这一段仍然 stay close to this study。

---

# 十、Discussion Middle：2-hop → General Principle

Discussion 中间部分继续向上抽象。

问：

> **这些现象背后是否存在一个 beyond this study 的一般原理？**

结构：

> **2-hop Interpretation → Abstraction → General Principle**

例如：

具体 finding：更好的搜索策略恢复了 alternative conformations。

2-hop interpretation：alternative conformation 的缺失，可能部分来自 decoding 不充分，而不是 representation 中完全不存在这些状态。

General principle：

> **模型能力由 representation 与 search 共同决定。**

---

# 十一、从 General Principle 向外展开 Question Space

Discussion 不应止于 abstraction。

进一步问：

- 为什么这个 principle 成立？
- 什么时候成立？
- 什么时候失效？
- 哪些因素决定其强弱？
- 是否能推广到其他模型、任务、物种、体系？
- 是否存在反例？
- 如何区分 competing explanations？

因此完整运动是：

> **Data → Finding → 1-hop Implication → 2-hop Interpretation → General Principle → New Question Space**

前半段是：

> **向上抽象**

后半段是：

> **向外展开**

很多 Discussion 显得“薄”，不是因为解释错了，而是只完成了向上抽象，没有打开新的问题空间。

---

# 十二、Limitations 的正确含义

Limitation 不是：

> **我们没有做什么。**

世界上没做的事情无限多。

真正的 limitation 是：

> **一个限制，使当前研究无法回答由自身 findings 引出的重要问题。**

判断标准：

> **Because we did not / could not do X，是否导致一个重要 scientific question 仍然 unresolved？**

如果是，X 才是有意义的 limitation。

例如：

New Question：这个 principle 是否适用于其他模型架构？

Limitation：当前研究只系统测试了一个 model family。

因此：当前证据无法判断这一规律是否 architecture-independent。

---

# 十三、Future Studies 应从 Limitation 推导

Future Work 不应该是一张愿望清单。

每一项 future study 都应该回答一个明确的 unresolved question。

结构：

> **Finding → New Question → Limitation → Future Study**

原则：

> **Future studies are experiments designed to answer questions that the current study cannot answer.**

---

# 十四、Reviewer Stress Test：审稿人压力测试

在准备投稿前，主动切换到 reviewer perspective。

问：

> **如果我是最挑剔、最专业的 reviewer，这篇文章最可能受到哪三个挑战？**

生成：

> **Top 3 Reviewer Challenges**

然后逐一分类：

### A. 当前可以补实验解决

→ 回到 Results。

### B. 可以通过已有数据分析或解释解决

→ 补充 Results / Discussion。

### C. 当前研究确实无法解决

→ 写入 Limitation，并设计对应 Future Study。

### D. 属于 Fatal Flaw

例如 central comparison 不公平、claim 与实验设计不匹配、关键变量严重混杂、核心结论无法由现有证据支持。

此时不能简单放进 limitations。

应当：

> **重新设计研究或收缩 central claim。**

因此：

> **Reviewer challenge ≠ limitation**

Reviewer perspective 是一个 **stress test**，而 limitation 只是其可能输出之一。

---

# 十五、Deadline Mode：有限时间下如何收束研究

REWRITE 容易产生一个问题：每个 finding 都能继续生成问题，因此研究可以无限延伸。

真实科研存在投稿 deadline、学生毕业、计算资源限制、湿实验成本和项目周期限制。

因此必须加入：

> **Stop Rule / Minimum Sufficient Story**

## Deadline 临近时，优先回答三类问题

### Priority 1：会改变 central claim 的问题

如果这个问题答案不同，会导致论文主结论不成立或需要明显收缩，必须优先处理。

### Priority 2：Reviewer 极可能提出的致命问题

例如 data leakage、memorization、unfair baseline、缺少关键 control、alternative explanation。

优先处理。

### Priority 3：低成本但能显著提高解释力的问题

例如简单 ablation、subgroup analysis、error analysis、关键 negative control。

如果成本低、收益高，应优先补。

## 可以暂时停止的问题

如果一个问题：

- 不改变 central claim；
- 不影响主要证据链；
- 需要大量新实验；
- 更适合作为独立研究；

则进入：

> Discussion → Limitation → Future Study

## Stop Rule

当满足以下条件时，可以停止继续扩展 Results：

1. Central scientific question 已被可信地回答；
2. 关键 competing explanations 已排除到合理程度；
3. 主要 reviewer challenge 已处理；
4. 最重要的 boundary conditions 已有基本证据；
5. 剩余问题需要明显超出当前研究范围的新实验。

原则：

> **目标不是回答所有问题，而是形成一个最小但完整、可信、可辩护的 scientific story。**

---

# 十六、新手模式：Results Subsection 填空模板

对于经验较少的研究者，可以使用 Guided Mode。

### 1. Scientific Question

> 我们想知道：________________________。

### 2. Why this question matters

> 这个问题重要，因为：________________________。

### 3. Experiment / Analysis

> 为了回答这个问题，我们：________________________。

### 4. Data

> 结果显示：________________________。

### 5. Finding

> 这些数据直接表明：________________________。

### 6. 1-hop Implication

> 这些结果提示：________________________。

### 7. New Question

> 这一 finding 又引出了问题：________________________。

### 8. Answerability Check

> 当前研究能否回答？

- 能 → 设计下一项 experiment / analysis；
- 不能 → 放入 Discussion / Limitation / Future Study。

---

# 十七、Discussion 填空模板

## Opening Paragraph：2-hop

> 本研究的多个结果共同表明：________________________。

> 与单个实验结果相比，这意味着：________________________。

这一段仍然围绕：

> **this study**

## Middle Paragraphs：General Principle

> 更进一步，这些发现提示一个更一般的可能性：________________________。

> 这一原则可能不仅适用于当前体系，还可能适用于：________________________。

## New Question Space

> 这些发现进一步提出了以下尚未解决的问题：

- Why：________________________
- How：________________________
- What：________________________
- When：________________________
- Whether：________________________

## Limitations

> 当前研究无法回答其中的 ________________________，因为 ________________________。

## Future Study

> 为回答这一问题，下一步可以通过 ________________________ 进行检验。

---

# 十八、句子应该放在哪里：决策图

```text
这句话在说什么？
│
├─ 直接报告数据、比较或观察？
│      └─ Results
│
├─ 解释某一个具体结果的一步意义？
│      └─ Results subsection ending：1-hop implication
│
├─ 综合多个 findings，解释本研究整体说明什么？
│      └─ Discussion opening：2-hop interpretation
│
├─ 提出超越本研究的一般机制或原则？
│      └─ Discussion middle：general principle
│
├─ 由 findings / principle 引出新的未解问题？
│      └─ Late Discussion：new question
│
├─ 说明为什么当前研究无法回答这个问题？
│      └─ Limitations
│
└─ 说明下一步用什么实验或分析回答？
       └─ Future Studies
```

---

# 十九、REWRITE 的两个循环

## Inner Loop：研究推进循环

> **Finding → Question → Answerability → Experiment → Finding**

作用：

> 推动当前 project 继续生长。

## Outer Loop：理解与抽象循环

> **Finding → Literature → Interpretation → Principle → New Question**

作用：

> 把一个具体结果提升为更深的 scientific understanding。

两个循环共同决定：

> 做哪些新实验，以及 Results / Discussion 应该如何组织。

---

# 二十、Research Depth Diagnostic：科研深度诊断

## Level 0 — Observation

> A > B。

只报告现象。

## Level 1 — Implication

> X improves Y。

知道结果意味着什么。

## Level 2 — Interpretation

> X improves Y because it changes Z。

开始解释机制。

## Level 3 — General Principle

> 更一般地，Z 可能决定这一类问题。

形成可迁移的抽象。

## Level 4 — Boundary / Mechanism Questions

开始追问：

- 什么时候成立？
- 什么决定效应大小？
- 为什么有些情况失效？
- 是否存在反例？

## Level 5 — New Research Program

进一步形成：

- 哪些实验能够区分 competing hypotheses？
- 如何系统确定这个 principle 的作用范围？
- 什么新的研究问题由此产生？

强研究不应长期停留在：

> **A > B**

或：

> **我们的模型比 baseline 高了几个百分点。**

---

# 二十一、REWRITE 的推荐调用方式

## 模式 1：项目设计

> 这是我的核心 idea：XXX。请按 REWRITE 帮我设计 research storyline。

目标：

> Scientific Question → Hypothesis → Experiments → Possible Findings → Next Questions

## 模式 2：从一个 Finding 展开

> 这是一个 finding：XXX。请按 REWRITE 展开。

默认输出：

1. Finding；
2. 1-hop implication；
3. Literature positioning；
4. Why / How / What / When / Whether 等新问题；
5. 哪些当前可回答；
6. 建议补哪些实验；
7. 哪些当前不可回答；
8. 2-hop interpretation；
9. General principle；
10. Limitation；
11. Future study。

这是 REWRITE 最核心的日常用法。

## 模式 3：检查 Results

> 请按 REWRITE 检查 Results。

检查每个 subsection 是否由 scientific question 驱动、是否只是按技术组织、是否存在明确 finding 和合适的 1-hop implication、是否有本来可以回答的问题被过早扔进 Discussion、是否存在未处理的异常结果，以及是否遗漏关键 control / alternative explanation。

## 模式 4：检查 Discussion

> 请按 REWRITE 检查 Discussion。

检查 Opening 是否做到 multiple 1-hop → 2-hop，Middle 是否完成 2-hop → abstraction，是否提出 general principle，是否从 principle 打开新的 question space，limitations 是否真正对应 unresolved questions，以及 future studies 是否真正回答 limitations。

## 模式 5：找下一步实验

> 请按 REWRITE 判断下一步最值得做什么实验。

优先级：

1. Central claim；
2. Reviewer fatal challenges；
3. Competing explanations；
4. Boundary conditions；
5. 低成本高信息量实验；
6. 其余进入 Future Study。

## 模式 6：Deadline Mode

> Deadline 很近，请按 REWRITE 的 Deadline Mode 帮我收束。

输出：

- 必须做；
- 最好做；
- 可以不做；
- 应写入 limitation；
- 应留给 future study；
- central claim 是否需要收缩。

---

# 二十二、REWRITE 的核心原则

> **Results are answers to questions.**

Results 是对 scientific questions 的回答。

> **Good findings generate better questions.**

好的发现会产生更好的问题。

> **Questions answerable now should become new Results.**

当前能够回答的问题，不应过早留给 Discussion。

> **Questions not answerable now define Discussion, Limitations, and Future Studies.**

当前无法回答的重要问题，定义 Discussion、Limitations 和 Future Studies。

> **Unexpected findings may rewrite the original question.**

异常结果不仅需要解释，也可能迫使我们重写原来的研究问题。

> **Literature defines the coordinates of novelty and interpretation.**

文献决定一个 finding 在现有知识体系中的位置。

> **Reviewer criticism is a stress test, not automatically a limitation.**

审稿人的挑战应先判断能否解决，而不是直接写进 limitations。

> **A good project is not the project that answers every possible question.**

成熟研究不是回答所有问题。

> **A good project answers enough of the right questions to support a coherent and defensible scientific story.**

好的研究是在有限资源下，回答足够关键的问题，形成完整、可信、可辩护的 scientific story。

最终：

> **Writing is thinking.**

更具体地说：

> **Discussion writing is research thinking.**

而 REWRITE 的核心循环是：

> **Finding → Question → Test → Finding**

研究不断重写自己，论文也因此不断被重写。

这就是 **REWRITE**。
