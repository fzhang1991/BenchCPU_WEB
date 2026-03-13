export const exploreZh = {
  navParadigmOverview: "范式总览",
  navMemeProbeProperties: "Meme Probe Properties",
  navMemeScores: "Meme Scores",
  navExperimentalSettings: "实验设置",
  navImplications: "Probing Memes范式能做什么？",

  sectionParadigmOverviewTitle: "Probing Memes 范式总览",
  sectionParadigmOverviewLead:
    "该范式从 Perception Matrix 出发，计算多种题目级属性来构造 probes，并进一步用这些 probes 检测模型的 memes，从而为细粒度行为结构与潜在能力提供一种可解释的观察视角。",

  overviewImageAlt: "Probing Memes 范式总览图",

  sectionProbePropsTitle: "从 Perception Matrix 到 Meme Probe Properties",
  sectionProbePropsLead:
    "该范式从一个 Perception Matrix 开始，其中每个元素记录一个模型是否正确回答某个题目。每个题目都被视为一个 probe，而它在模型群体上的成功/失败模式则构成了计算 probe properties 的基础。",

  formalization: "形式化定义",
  memeProbeProps: "Meme Probe Properties",

  clusterConstructionTitle: "用于群体行为分析的簇构建",
  clusterConstructionP1:
    "对于两个 probe i 和 k，它们之间的相似度由 perception span 上的 Hamming similarity 衡量，也就是逐个模型比较它们的成功/失败模式是否一致。",
  clusterConstructionP2:
    "基于这些相似度，可以构建一个无向加权图：每个节点对应一个 probe，当两个 probes 的相似度不小于阈值 τ 时保留一条边，并将相似度本身作为边权。",
  clusterConstructionP3:
    "随后，对该结构执行层次聚类以得到 probes 的行为簇划分。在实现上，首先会把 perception span 完全相同的 probes 合并以提升效率；然后通过阈值筛除较弱相似度，并在每个连通分量内部执行 complete-linkage 的 hierarchical agglomerative clustering。",
  clusterConstructionP4:
    "这种簇结构提供了群体层面的行为组织形式，并被 Typicality 和 Bridge 直接使用。Typicality 衡量一个 probe 是否是其簇中的原型或中心成员，而 Bridge 衡量一个 probe 是否连接多个簇，而不是只集中在单一簇内部。",
  clusterUsedByTitle: "用于",
  clusterUsedByTypicality: "Typicality",
  clusterUsedByBridge: "Bridge",

  difficultyDesc:
    "Difficulty 衡量有多少模型会在该 probe 上失败。值越高，说明这个题目相对于模型群体越难。",
  riskDesc:
    "Risk 衡量在该 probe 上失败，是否会与许多其他 probes 上更广泛的失败共同出现。",
  surpriseDesc:
    "Surprise 衡量异常行为，例如强模型在简单 probes 上失败，或弱模型在困难 probes 上成功。",
  uniquenessDesc:
    "Uniqueness 衡量一个 probe 的 perception span 与其他 probes 的 perception spans 有多不相似。",
  typicalityDesc:
    "Typicality 衡量一个 probe 是否像其行为簇中的原型，或者说它在该簇内部有多中心。",
  bridgeDesc:
    "Bridge 衡量一个 probe 是否连接了多个行为簇，而不是只集中在单一簇中。",

  sectionMemeScoresTitle: "LLMs 的 Meme Scores",
  sectionMemeScoresLead:
    "在 probe properties 定义之后，这些属性的子集可以被映射为潜在行为特征，而每个模型则通过对 probes 的加权聚合获得相应的 Meme Score。",

  genericDefinition: "通用定义",
  genericDefinitionTail:
    "论文同时引入了基于单一属性构造的 scores 和预定义的多属性 scores，使得每个模型都可以被刻画为更丰富、更可解释的行为画像。",

  memeScoresCardTitle: "Meme Scores",
  tableScore: "Score",
  tableType: "Type",
  tableFrom: "来自 MPP(s)",
  tableInterpretation: "解释",

  sectionExperimentalSettingsTitle: "实验设置",
  sectionExperimentalSettingsLead:
    "下面的设置对应论文中使用的 Curated Population，包括推理模式、超参数、prompt 约定，以及基于公开 leaderboard 结果的大规模应用。",

  curatedSetupTitle: "Curated Population 设置",

  curatedSetupParagraph:
    "Curated Population 分析了三种推理模式：Base、CoT 和 IR。Base 与 CoT 只在 prompting template 上不同：CoT 会显式要求模型逐步推理，而 Base 使用默认指令，不提供推理提示。IR 指能够以内在方式执行多步推理的模型。Base 和 IR 使用默认模板，而 CoT 使用 chain-of-thought 模板。",

  reasoningModesTitle: "推理模式",
  reasoningBaseDesc: "默认 prompting，不显式要求推理。",
  reasoningCoTDesc: "Prompt 中包含 “Please reason step by step”。",
  reasoningIRDesc: "支持 intrinsic reasoning 的模型所使用的内在推理模式。",

  hyperparametersTitle: "超参数",
  hyperNonIRDesc: "temperature = 0, top-p = 1, max tokens = 8192",
  hyperIRDesc:
    "max tokens = 28672，其余参数遵循 provider 默认设置（对于 Qwen-family IR 模型，max tokens = 8192，thinking budget = 20480）",

  promptConventionsTitle: "Prompt 约定",
  promptConventionsP1:
    "Prompt 模板在不同数据集之间保持一致结构。所有 prompts 都会显式约束最终输出格式，并要求最终答案出现在 Answer: 之后，且答案字段中不包含额外解释。在 CoT 设置下，会额外加入 Please reason step by step，并要求模型将推理过程与最终答案分离。",
  promptConventionsP2:
    "不同数据集的答案格式约束尽量保持简洁但严格：数学题在需要时使用 boxed 形式；选择题要求只输出单个选项字母；自由问答任务则只要求在 Answer: 标签后给出最终答案。",

  largeScaleTitle: "大规模群体上的应用（来自 Open LLM Leaderboard）",
  largeScaleP1Prefix:
    "除 curated population 外，该范式也基于 ",
  largeScaleLinkText: "Open LLM Leaderboard",
  largeScaleP1Suffix:
    " 收集的结果，在更大规模上进行了实例化。",
  largeScaleP2:
    "使用了 4,479 个模型在六个数据集上的结果来构建大规模 Perception Matrix。这些 leaderboard 报告结果使得 Probing Memes 范式能够应用到更广泛、异质性更强的模型群体。",
  largeScaleP2Extra:
    "需要说明的是，这里的 evaluation 标准与 Open LLM Leaderboard 本身并不相同：Probing Memes 范式只收集题目的正确和错误结果，并据此构造 Perception Matrix。",
  largeScaleP3:
    "为保证一致性，构建过程中会移除记录缺失的模型，也会移除信息不完整的题目，从而使保留的矩阵在模型与 probes 之间保持对齐。",

  sectionImplicationsTitle: "Implications：Probing Memes 范式能够支持什么",
  sectionImplicationsLead:
    "Probing Memes 范式并不止于描述性评估。通过 Meme Probe Properties（MPPs）和 Meme Scores（MSs）为 probes 与模型构建结构化表示，它揭示出细粒度的行为结构，并可被直接用于一系列更实际的应用场景。",
  implicationsRoutingTitle: "通过 Meme-Guided Model Routing 提供决策支持",
  implicationsRoutingP1:
    "Meme Scores 能够刻画模型在行为特征与能力上的差异，因此可以根据任务需求选择更合适的模型。",
  implicationsRoutingP2:
    "论文通过 routing 实验验证了这一点：如果根据模型在 meme 相关维度上的优势来为题目分配模型，整体性能可以得到提升。这说明 Meme Scores 不仅适用于分析，也适用于多模型系统和 agent-like pipeline 等实际场景，在这些场景中，为每个题目选择合适的模型能够改善端到端效果。",
  implicationsDiagnosisTitle: "通过 Probe-Level Surprise Analysis 进行行为诊断",
  implicationsDiagnosisP1:
    "Probing Memes 范式还支持在 probe 层面进行细粒度分析。",
  implicationsDiagnosisP2:
    "在论文中，实验重点分析了 high-surprise probes。这类 probes 能捕捉一些稀有但信息量很强的现象，例如强模型在简单题上失败、而弱模型在更难题上成功。通过对这些 probes 的针对性分析，研究识别出了这类异常的典型模式，并进一步探查其潜在成因，从而为理解模型为何会在具体题目上成功或失败提供了可操作的洞见。",
  implicationsMoreDetailsPrefix: "更多细节与其他应用请参考",
  implicationsMoreDetailsLinkText: "paper",
  implicationsMoreDetailsSuffix: "。",

  sidebarTitle: "本页导航",

  scoreDifficultyDesc: "擅长处理困难 probes。",
  scoreUniquenessDesc: "擅长处理具有稀有行为模式的 probes。",
  scoreRiskDesc: "能够抵抗那些失败往往会与更广泛错误共同出现的 probes。",
  scoreSurpriseDesc: "能够处理具有异常行为模式的 probes。",
  scoreTypicalityDesc: "在原型性 probes 上表现良好。",
  scoreBridgeDesc: "在连接多个簇的 probes 上表现良好。",
  scoreMasteryDesc: "在困难且具有原型性的 probes 上表现熟练。",
  scoreIngenuityDesc: "能够灵活应对稀有且异常的 probes。",
  scoreRobustnessDesc: "在跨簇交界处的高风险 probes 上保持正确。",
  scoreCautionDesc: "避免在看似简单、具有原型性但高风险的 probes 上出错。",
} as const;