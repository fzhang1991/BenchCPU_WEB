export const probeAnalysisZh = {
  subtitle:
    "Probe Analysis 将数据集中的每个样本视为一个 probe，并为每个 probe 计算多个属性。上方展示 3D 概览；你可以通过下拉菜单或点击 3D 视图中的数据集来选择。选中后，可在下方固定高度表格中浏览问题，并支持按属性排序与查看详细信息。",

  probeAnalysisTitle: "Probe Analysis",

  overview3dTitle: "概览（3D）",
  overview3dDesc:
    "每个数据集都由其所有题目在六个 probe properties（difficulty、uniqueness、risk、surprise、typicality、bridge）上的均值表示。上方 3D 概览可直观展示这些数据集级平均值，便于比较。",

  selectDataset: "选择数据集...",
  questionBrowser: "问题浏览器",

  search: "搜索",
  searchQuestion: "搜索问题",
  searchPlaceholder: "输入问题文本…",
  clearSearch: "清空搜索",

  comingSoon: "即将上线",
  comingSoonForHF: "HF Population 即将上线。",
  noDatasetSelected: "尚未选择数据集",
  selectDatasetHint: "请先通过上方下拉菜单选择一个数据集，再开始浏览问题。",

  showing: "当前显示",
  loading: "加载中...",
  sortedBy: "当前排序",
  rank: "排名",
  question: "问题",

  clickViewDetail: "点击查看详情",
  clickViewQuestionDetail: "点击查看问题详情和模型行为。",
  sortByTipPrefix: "可通过表头中的 ▲ / ▼ 按",
  sortByTipSuffix: "排序。",

  noData: "暂无数据",

  topSummaryHF: "HF Population：即将上线。",
  topSummaryNeedDataset: "请先通过上方下拉菜单或 3D 图选择一个数据集。",
  topSummaryDataset: "数据集",
  topSummaryQuestions: "问题数",

  total: "总数",

  questionDetailTitleSuffix: "问题详情",
  errorTitle: "错误",

  drawerQuestion: "问题",
  drawerGroundTruth: "标准答案",
  drawerProbeProperties: "Probe Properties",
  drawerCorrectModels: "回答正确的模型",
  drawerWrongModels: "回答错误的模型",
  drawerNone: "无",

  population: "Population",
  populationTooltipTitle: "Population",
  populationTooltipDesc: "一起被分析的一组模型。本页展示的结果都是基于这一组模型计算得到的。",
  curatedPopulationTitle: "Curated Population",
  curatedPopulationDesc: "一组具有代表性的模型，用于产生更清晰、更易解释的行为对比。",
  hfPopulationTitle: "HF Population",
  hfPopulationDesc:
    "一个来自 Open LLM Leaderboard 的更大模型群体，其 Probing Memes 指标基于 Hugging Face 上公开可获得的信息进行计算。",
} as const;