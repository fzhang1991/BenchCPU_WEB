"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Explore.module.css";
import { useLanguage } from "@/contexts/LanguageContext";
import { exploreZh } from "./exploreZh";

function FormulaCard({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.formulaCard}>
      <div className={styles.formulaCardTitle}>{title}</div>
      <p className={styles.formulaDesc}>{desc}</p>
      <div className={styles.formulaBox}>{children}</div>
    </div>
  );
}

type MemeScoreRow = {
  name: string;
  type: string;
  from: string;
  description: string;
};

const BASE_TEXT = {
  navParadigmOverview: "Paradigm Overview",
  navMemeProbeProperties: "Meme Probe Properties",
  navMemeScores: "Meme Scores",
  navExperimentalSettings: "Experimental Settings",

  sectionParadigmOverviewTitle: "The Probing Memes Paradigm Overview",
  sectionParadigmOverviewLead:
    "Starting from the Perception Matrix, the paradigm computes diverse item-level properties to construct probes, which are then used to detect models’ memes, providing an interpretable view of fine-grained behavioral structure and underlying capabilities.",

  overviewImageAlt: "Overview of the Probing Memes Paradigm",

  sectionProbePropsTitle: "From Perception Matrix to Meme Probe Properties",
  sectionProbePropsLead:
    "The paradigm starts from a Perception Matrix, where each entry records whether a model answers an item correctly. Each item is treated as a probe, and its population-level success/failure pattern becomes the basis for computing probe properties.",

  formalization: "Formalization",
  memeProbeProps: "Meme Probe Properties",

  clusterConstructionTitle: "Cluster Construction for Population-Level Behavioral Analysis",
  clusterConstructionP1:
    "Given two probes i and k, their similarity is measured by Hamming similarity over their perception spans, comparing model-wise success and failure patterns element-wise.",
  clusterConstructionP2:
    "Based on these similarities, an undirected weighted graph is built: each node corresponds to a probe, and an edge is kept when the probe-pair similarity is no smaller than a threshold τ, with the edge weight set to that similarity value.",
  clusterConstructionP3:
    "A hierarchical clustering procedure is then applied to obtain a partition of probes into behavioral clusters. In implementation, probes with identical perception spans are first merged for efficiency; then weak similarities are filtered by thresholding, and complete-linkage hierarchical agglomerative clustering is performed within each connected component.",
  clusterConstructionP4:
    "This clustering structure provides the population-level behavioral organization used by Typicality and Bridge. Typicality evaluates whether a probe acts as a prototype or a central member within its cluster, while Bridge measures whether a probe connects multiple clusters rather than concentrating within only one.",
  clusterUsedByTitle: "Used by",
  clusterUsedByTypicality: "Typicality",
  clusterUsedByBridge: "Bridge",

  difficultyDesc:
    "Difficulty measures how many models fail on a probe. A higher value means the item is harder relative to the model population.",
  riskDesc:
    "Risk captures whether failing this probe tends to co-occur with broader failure on many other probes.",
  surpriseDesc:
    "Surprise captures anomalous behavior, such as stronger models failing on easy probes or weaker models succeeding on hard probes.",
  uniquenessDesc:
    "Uniqueness measures how dissimilar a probe’s perception span is from other probes’ spans.",
  typicalityDesc:
    "Typicality measures whether a probe acts like a prototype of its behavioral cluster, or how central it is within that cluster.",
  bridgeDesc:
    "Bridge measures whether a probe connects multiple behavioral clusters rather than remaining concentrated in a single one.",

  sectionMemeScoresTitle: "Meme Scores of LLMs",
  sectionMemeScoresLead:
    "Once probe properties are defined, subsets of those properties can be mapped into latent behavioral traits, and each model receives a corresponding Meme Score through weighted aggregation over probes.",

  genericDefinition: "Generic Definition",
  genericDefinitionTail:
    "The paper introduces both property-derived scores and predefined multi-property scores, allowing each model to be characterized by a richer and more interpretable behavioral profile.",

  memeScoresCardTitle: "Meme Scores",
  tableScore: "Score",
  tableType: "Type",
  tableFrom: "From MPP(s)",
  tableInterpretation: "Interpretation",

  sectionExperimentalSettingsTitle: "Experimental Settings",
  sectionExperimentalSettingsLead:
    "The following settings correspond to the Curated Population used in the paper, including reasoning modes, hyperparameters, prompt conventions, and the large-scale application based on public leaderboard results.",

  curatedSetupTitle: "Curated Population Setup",

  curatedSetupParagraph:
    "The curated population analyzes three reasoning modes: Base, CoT, and IR. Base and CoT differ only in prompting template: CoT explicitly asks the model to reason step by step, while Base uses a default instruction without a reasoning cue. IR refers to models that perform multi-step reasoning intrinsically. Base and IR use the default template, while CoT uses the chain-of-thought template.",

  reasoningModesTitle: "Reasoning Modes",
  reasoningBaseDesc: "Default prompting without explicit reasoning cue.",
  reasoningCoTDesc: "Prompt includes “Please reason step by step”.",
  reasoningIRDesc: "Internal reasoning mode for models that support intrinsic reasoning.",

  hyperparametersTitle: "Hyperparameters",
  hyperNonIRDesc: "temperature = 0, top-p = 1, max tokens = 8192",
  hyperIRDesc:
    "max tokens = 28672, other parameters follow provider defaults (for Qwen-family IR models, max tokens = 8192 and thinking budget = 20480)",

  promptConventionsTitle: "Prompt Conventions",
  promptConventionsP1:
    "Prompt templates follow a consistent structure across datasets. All prompts explicitly constrain the final output format and require the final answer to appear after Answer: with no extra explanation in the answer field. Under the CoT setting, the phrase Please reason step by step is added, and the model is instructed to separate its reasoning process from the final answer.",
  promptConventionsP2:
    "Dataset-specific answer formatting is kept minimal but strict: mathematical answers are enclosed in boxed form when needed, multiple-choice tasks require a single option letter, and free-form QA tasks only require the final answer after the Answer: tag.",

  largeScaleTitle: "Application on Large-Scale Population (From Open LLM Leaderboard)",
  largeScaleP1Prefix:
    "Beyond the curated population, the paradigm is also instantiated at larger scale using results collected from the ",
  largeScaleLinkText: "Open LLM Leaderboard",
  largeScaleP1Suffix: ".",
  largeScaleP2:
    "Results for 4,479 models across six datasets are used to construct a large-scale Perception Matrix. These leaderboard-reported results make it possible to apply the Probing Memes paradigm to a much broader and more heterogeneous model population.",
  largeScaleP2Extra:
    "Note that the evaluation criterion here is different from that of the Open LLM Leaderboard itself: the Probing Memes paradigm only collects correct/incorrect outcomes to construct the Perception Matrix.",
  largeScaleP3:
    "To ensure consistency, the construction process removes models with missing records and also removes items with incomplete information, so that the retained matrix remains aligned across models and probes.",

  sidebarTitle: "On this page",

  scoreDifficultyDesc: "Performs well on difficult probes.",
  scoreUniquenessDesc: "Performs well on probes with rare behavioral patterns.",
  scoreRiskDesc: "Resists probes whose failure tends to co-occur with broader errors.",
  scoreSurpriseDesc: "Handles probes with anomalous behavioral patterns.",
  scoreTypicalityDesc: "Performs well on prototypical probes.",
  scoreBridgeDesc: "Performs well on probes that connect clusters.",
  scoreMasteryDesc: "Proficiency on difficult, prototypical probes.",
  scoreIngenuityDesc: "Flexibility on rare and anomalous probes.",
  scoreRobustnessDesc: "Correctness on high-risk probes at cross-cluster intersections.",
  scoreCautionDesc: "Avoids errors on easy, prototypical, yet high-risk probes.",
};

type ExploreText = Record<keyof typeof BASE_TEXT, string>;

export default function ExplorePage() {
  const { lang } = useLanguage();
  const t: ExploreText = useMemo(
    () => (lang === "zh" ? { ...BASE_TEXT, ...exploreZh } : BASE_TEXT),
    [lang]
  );

  const memeScoreRows: MemeScoreRow[] = useMemo(
    () => [
      {
        name: "Difficulty",
        type: "1D",
        from: "Difficulty",
        description: t.scoreDifficultyDesc,
      },
      {
        name: "Uniqueness",
        type: "1D",
        from: "Uniqueness",
        description: t.scoreUniquenessDesc,
      },
      {
        name: "Risk",
        type: "1D",
        from: "Risk",
        description: t.scoreRiskDesc,
      },
      {
        name: "Surprise",
        type: "1D",
        from: "Surprise",
        description: t.scoreSurpriseDesc,
      },
      {
        name: "Typicality",
        type: "1D",
        from: "Typicality",
        description: t.scoreTypicalityDesc,
      },
      {
        name: "Bridge",
        type: "1D",
        from: "Bridge",
        description: t.scoreBridgeDesc,
      },
      {
        name: "Mastery",
        type: "2D",
        from: "Difficulty, Typicality",
        description: t.scoreMasteryDesc,
      },
      {
        name: "Ingenuity",
        type: "2D",
        from: "Uniqueness, Surprise",
        description: t.scoreIngenuityDesc,
      },
      {
        name: "Robustness",
        type: "2D",
        from: "Risk, Bridge",
        description: t.scoreRobustnessDesc,
      },
      {
        name: "Caution",
        type: "3D",
        from: "Difficulty, Typicality, Risk",
        description: t.scoreCautionDesc,
      },
    ],
    [t]
  );

  const navItems = useMemo(
    () => [
      { id: "paradigm-overview", label: t.navParadigmOverview },
      { id: "meme-probe-properties", label: t.navMemeProbeProperties },
      { id: "meme-scores", label: t.navMemeScores },
      { id: "experimental-settings", label: t.navExperimentalSettings },
    ],
    [t]
  );

  const [activeId, setActiveId] = useState<string>("paradigm-overview");

  const sectionIds = useMemo(() => navItems.map((x) => x.id), [navItems]);

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-18% 0px -55% 0px",
        threshold: [0.1, 0.2, 0.35, 0.5, 0.7],
      }
    );

    sections.forEach((section) => observer.observe(section));

    const onScroll = () => {
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140) current = id;
      }
      setActiveId(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [sectionIds]);

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <main className={styles.main}>
          <div className={styles.content}>
            <section id="paradigm-overview" className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{t.sectionParadigmOverviewTitle}</h2>
                <p className={styles.sectionLead}>{t.sectionParadigmOverviewLead}</p>
              </div>

              <div className={styles.heroCard}>
                <div className={styles.heroImageWrap}>
                  <img
                    src="/explore/overview.png"
                    alt={t.overviewImageAlt}
                    className={styles.heroImage}
                  />
                </div>
              </div>
            </section>

            <section id="meme-probe-properties" className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{t.sectionProbePropsTitle}</h2>
                <p className={styles.sectionLead}>
                  {lang === "zh" ? (
                    <>
                      该范式从一个 <span className={styles.inlineCode}>Perception Matrix</span> 开始，
                      其中每个元素记录一个模型是否正确回答某个题目。每个题目都被视为一个 probe，
                      而它在模型群体上的成功/失败模式则构成了计算 probe properties 的基础。
                    </>
                  ) : (
                    <>
                      The paradigm starts from a <span className={styles.inlineCode}>Perception Matrix</span>,
                      where each entry records whether a model answers an item correctly.
                      Each item is treated as a probe, and its population-level success/failure
                      pattern becomes the basis for computing probe properties.
                    </>
                  )}
                </p>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>{t.formalization}</div>
                <div className={styles.richText}>
                  <p>
                    Let the dataset be
                    <span className={styles.mathInline}>
                      <math>
                        <mrow>
                          <mi>D</mi>
                          <mo>=</mo>
                          <mo>{"{"}</mo>
                          <mo stretchy="false">(</mo>
                          <msub><mi>x</mi><mi>i</mi></msub>
                          <mo>,</mo>
                          <msub><mi>y</mi><mi>i</mi></msub>
                          <mo stretchy="false">)</mo>
                          <msup><mo>{"}"}</mo><mi>n</mi></msup>
                          <msub><mi>i</mi><mn>1</mn></msub>
                        </mrow>
                      </math>
                    </span>
                    , and let
                    <span className={styles.mathInline}>
                      <math>
                        <mrow>
                          <mi>M</mi>
                          <mo>=</mo>
                          <mo>{"{"}</mo>
                          <msub><mi>M</mi><mi>j</mi></msub>
                          <msup><mo>{"}"}</mo><mi>m</mi></msup>
                          <msub><mi>j</mi><mn>1</mn></msub>
                        </mrow>
                      </math>
                    </span>
                    be a population of LLMs. For an item-model pair, a judging function returns
                    a binary correctness signal, producing the perception unit:
                  </p>

                  <div className={styles.displayFormula}>
                    <math display="block">
                      <mrow>
                        <msub><mi>P</mi><mrow><mi>i</mi><mi>j</mi></mrow></msub>
                        <mo>=</mo>
                        <mi>J</mi>
                        <mo stretchy="false">(</mo>
                        <msub><mi>M</mi><mi>j</mi></msub>
                        <mo stretchy="false">(</mo>
                        <msub><mi>x</mi><mi>i</mi></msub>
                        <mo stretchy="false">)</mo>
                        <mo>,</mo>
                        <msub><mi>y</mi><mi>i</mi></msub>
                        <mo stretchy="false">)</mo>
                        <mo>.</mo>
                      </mrow>
                    </math>
                  </div>

                  <p>
                    Collecting all perception units yields the perception matrix
                    <span className={styles.mathInline}>
                      <math>
                        <mrow>
                          <mi>P</mi>
                          <mo>∈</mo>
                          <msup>
                            <mrow>
                              <mo>{"{"}</mo>
                              <mn>0</mn>
                              <mo>,</mo>
                              <mn>1</mn>
                              <mo>{"}"}</mo>
                            </mrow>
                            <mrow><mi>n</mi><mo>×</mo><mi>m</mi></mrow>
                          </msup>
                        </mrow>
                      </math>
                    </span>
                    . Each row corresponds to one probe and summarizes how that probe is
                    perceived across the model population.
                  </p>
                </div>
              </div>

              <div className={styles.subsectionTitle}>{t.memeProbeProps}</div>

              <div className={styles.formulaGrid}>
                <FormulaCard title="Difficulty" desc={t.difficultyDesc}>
                  <math display="block">
                    <mrow>
                      <msub><mi>d</mi><mi>i</mi></msub>
                      <mo>=</mo>
                      <mn>1</mn>
                      <mo>−</mo>
                      <mfrac>
                        <mn>1</mn>
                        <mrow><mo>|</mo><mi>M</mi><mo>|</mo></mrow>
                      </mfrac>
                      <munderover>
                        <mo>∑</mo>
                        <mrow><mi>j</mi><mo>=</mo><mn>1</mn></mrow>
                        <mrow><mo>|</mo><mi>M</mi><mo>|</mo></mrow>
                      </munderover>
                      <msub><mi>P</mi><mrow><mi>i</mi><mi>j</mi></mrow></msub>
                      <mo>.</mo>
                    </mrow>
                  </math>
                </FormulaCard>

                <FormulaCard title="Risk" desc={t.riskDesc}>
                  <math display="block">
                    <mrow>
                      <msub><mi>r</mi><mi>i</mi></msub>
                      <mo>=</mo>
                      <msub><mi>scale</mi><mi>i</mi></msub>
                      <mo>·</mo>
                      <mfrac>
                        <mn>1</mn>
                        <mrow><mi>n</mi><mo>−</mo><mn>1</mn></mrow>
                      </mfrac>
                      <munder>
                        <mo>∑</mo>
                        <mrow><mi>k</mi><mo>≠</mo><mi>i</mi></mrow>
                      </munder>
                      <msub><mi>CF</mi><mrow><mi>i</mi><mo>→</mo><mi>k</mi></mrow></msub>
                      <mo>.</mo>
                    </mrow>
                  </math>
                </FormulaCard>

                <FormulaCard title="Surprise" desc={t.surpriseDesc}>
                  <div className={styles.multiFormula}>
                    <math display="block">
                      <mrow>
                        <msubsup><mi>s</mi><mi>i</mi><mtext>easy</mtext></msubsup>
                        <mo>=</mo>
                        <mo stretchy="false">(</mo>
                        <mo>−</mo>
                        <mi>ln</mi>
                        <msub><mi>d</mi><mi>i</mi></msub>
                        <mo stretchy="false">)</mo>
                        <mo>·</mo>
                        <mfrac>
                          <mn>1</mn>
                          <mrow><mo>|</mo><msub><mi>F</mi><mi>i</mi></msub><mo>|</mo></mrow>
                        </mfrac>
                        <munder>
                          <mo>∑</mo>
                          <mrow><mi>j</mi><mo>∈</mo><msub><mi>F</mi><mi>i</mi></msub></mrow>
                        </munder>
                        <msub><mi>a</mi><mi>j</mi></msub>
                        <mo>,</mo>
                      </mrow>
                    </math>

                    <math display="block">
                      <mrow>
                        <msub><mi>s</mi><mi>i</mi></msub>
                        <mo>=</mo>
                        <mfrac><mn>1</mn><mn>2</mn></mfrac>
                        <mo stretchy="false">(</mo>
                        <msubsup><mi>s</mi><mi>i</mi><mtext>easy</mtext></msubsup>
                        <mo>+</mo>
                        <msubsup><mi>s</mi><mi>i</mi><mtext>hard</mtext></msubsup>
                        <mo stretchy="false">)</mo>
                        <mo>.</mo>
                      </mrow>
                    </math>
                  </div>
                </FormulaCard>

                <FormulaCard title="Uniqueness" desc={t.uniquenessDesc}>
                  <math display="block">
                    <mrow>
                      <msub><mi>u</mi><mi>i</mi></msub>
                      <mo>=</mo>
                      <mn>1</mn>
                      <mo>−</mo>
                      <mfrac>
                        <mn>1</mn>
                        <mrow><mi>n</mi><mo>−</mo><mn>1</mn></mrow>
                      </mfrac>
                      <munderover>
                        <mo>∑</mo>
                        <mrow><mi>k</mi><mo>=</mo><mn>1</mn>, <mi>k</mi><mo>≠</mo><mi>i</mi></mrow>
                        <mi>n</mi>
                      </munderover>
                      <msub><mi>S</mi><mrow><mi>i</mi><mi>k</mi></mrow></msub>
                      <mo>,</mo>
                      <mspace width="0.5em" />
                      <msub><mi>S</mi><mrow><mi>i</mi><mi>k</mi></mrow></msub>
                      <mo>∈</mo>
                      <mo>[</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>]</mo>
                      <mo>.</mo>
                    </mrow>
                  </math>
                </FormulaCard>

                <FormulaCard title="Typicality" desc={t.typicalityDesc}>
                  <math display="block">
                    <mrow>
                      <msub><mi>t</mi><mi>i</mi></msub>
                      <mo>=</mo>
                      <mrow>
                        <mo>{"{"}</mo>
                        <mtable>
                          <mtr>
                            <mtd>
                              <mrow>
                                <mfrac><mn>1</mn><mn>2</mn></mfrac>
                                <mo>+</mo>
                                <mfrac><mn>1</mn><mn>2</mn></mfrac>
                                <mi>h</mi>
                                <mo stretchy="false">(</mo>
                                <mo>|</mo><msub><mi>C</mi><mi>ℓ</mi></msub><mo>|</mo>
                                <mo stretchy="false">)</mo>
                                <mo>Intra</mo>
                                <mo stretchy="false">(</mo>
                                <msub><mi>C</mi><mi>ℓ</mi></msub>
                                <mo stretchy="false">)</mo>
                                <mo>,</mo>
                                <mspace width="0.5em" />
                                <mi>i</mi>
                                <mo>=</mo>
                                <msub><mi>p</mi><msub><mi>C</mi><mi>ℓ</mi></msub></msub>
                              </mrow>
                            </mtd>
                          </mtr>
                          <mtr>
                            <mtd>
                              <mrow>
                                <mi>g</mi>
                                <mo stretchy="false">(</mo>
                                <mo>|</mo><msub><mi>C</mi><mi>ℓ</mi></msub><mo>|</mo>
                                <mo stretchy="false">)</mo>
                                <mo>Cen</mo>
                                <mo stretchy="false">(</mo>
                                <mi>i</mi>
                                <mo>;</mo>
                                <msub><mi>C</mi><mi>ℓ</mi></msub>
                                <mo stretchy="false">)</mo>
                                <mo>,</mo>
                                <mspace width="0.5em" />
                                <mtext>otherwise</mtext>
                              </mrow>
                            </mtd>
                          </mtr>
                        </mtable>
                      </mrow>
                    </mrow>
                  </math>
                </FormulaCard>

                <FormulaCard title="Bridge" desc={t.bridgeDesc}>
                  <math display="block">
                    <mrow>
                      <msub><mi>b</mi><mi>i</mi></msub>
                      <mo>=</mo>
                      <mn>1</mn>
                      <mo>−</mo>
                      <munderover>
                        <mo>∑</mo>
                        <mrow><mi>ℓ</mi><mo>=</mo><mn>1</mn></mrow>
                        <mi>L</mi>
                      </munderover>
                      <msup>
                        <mrow>
                          <mo stretchy="false">(</mo>
                          <mfrac>
                            <mrow>
                              <munder>
                                <mo>∑</mo>
                                <mrow><mi>k</mi><mo>∈</mo><msub><mi>C</mi><mi>ℓ</mi></msub><mo>,</mo><mi>k</mi><mo>≠</mo><mi>i</mi></mrow>
                              </munder>
                              <msub><mi>S</mi><mrow><mi>i</mi><mi>k</mi></mrow></msub>
                            </mrow>
                            <mrow>
                              <munder>
                                <mo>∑</mo>
                                <mrow><mi>k</mi><mo>≠</mo><mi>i</mi></mrow>
                              </munder>
                              <msub><mi>S</mi><mrow><mi>i</mi><mi>k</mi></mrow></msub>
                            </mrow>
                          </mfrac>
                          <mo stretchy="false">)</mo>
                        </mrow>
                        <mn>2</mn>
                      </msup>
                      <mo>.</mo>
                    </mrow>
                  </math>
                </FormulaCard>
              </div>

              <div className={styles.minorSubsectionTitle}>{t.clusterConstructionTitle}</div>

              <div className={styles.card}>
                <div className={styles.richText}>
                  <p>{t.clusterConstructionP1}</p>

                  <div className={styles.displayFormula}>
                    <math display="block">
                      <mrow>
                        <mi>sim</mi>
                        <mo stretchy="false">(</mo>
                        <msub><mi>P</mi><mi>i</mi></msub>
                        <mo>,</mo>
                        <msub><mi>P</mi><mi>k</mi></msub>
                        <mo stretchy="false">)</mo>
                        <mo>=</mo>
                        <mfrac><mn>1</mn><mi>m</mi></mfrac>
                        <munderover>
                          <mo>∑</mo>
                          <mrow><mi>j</mi><mo>=</mo><mn>1</mn></mrow>
                          <mi>m</mi>
                        </munderover>
                        <mn>1</mn>
                        <mo>[</mo>
                        <msub><mi>P</mi><mrow><mi>i</mi><mi>j</mi></mrow></msub>
                        <mo>=</mo>
                        <msub><mi>P</mi><mrow><mi>k</mi><mi>j</mi></mrow></msub>
                        <mo>]</mo>
                        <mo>.</mo>
                      </mrow>
                    </math>
                  </div>

                  <p>{t.clusterConstructionP2}</p>
                  <p>{t.clusterConstructionP3}</p>

                  <div className={styles.displayFormula}>
                    <math display="block">
                      <mrow>
                        <mi>C</mi>
                        <mo>=</mo>
                        <mo>{"{"}</mo>
                        <msub><mi>C</mi><mn>1</mn></msub>
                        <mo>,</mo>
                        <msub><mi>C</mi><mn>2</mn></msub>
                        <mo>,</mo>
                        <mo>…</mo>
                        <mo>,</mo>
                        <msub><mi>C</mi><mi>L</mi></msub>
                        <mo>{"}"}</mo>
                        <mo>.</mo>
                      </mrow>
                    </math>
                  </div>

                  <p>{t.clusterConstructionP4}</p>

                  <div className={styles.usedByRow}>
                    <span className={styles.usedByLabel}>{t.clusterUsedByTitle}</span>
                    <span className={styles.usedByBadge}>{t.clusterUsedByTypicality}</span>
                    <span className={styles.usedByBadge}>{t.clusterUsedByBridge}</span>
                  </div>
                </div>
              </div>
            </section>

            <section id="meme-scores" className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{t.sectionMemeScoresTitle}</h2>
                <p className={styles.sectionLead}>{t.sectionMemeScoresLead}</p>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>{t.genericDefinition}</div>
                <div className={styles.richText}>
                  <p>
                    Let the property space be
                    <span className={styles.mathInline}>
                      <math>
                        <mrow>
                          <mi>A</mi>
                          <mo>=</mo>
                          <mo>{"{"}</mo>
                          <msub><mi>α</mi><mn>1</mn></msub>
                          <mo>,</mo>
                          <msub><mi>α</mi><mn>2</mn></msub>
                          <mo>,</mo>
                          <mo>…</mo>
                          <mo>,</mo>
                          <msub><mi>α</mi><mi>K</mi></msub>
                          <mo>{"}"}</mo>
                        </mrow>
                      </math>
                    </span>
                    . Any nonempty subset
                    <span className={styles.mathInline}>
                      <math>
                        <mrow>
                          <mi>U</mi>
                          <mo>⊆</mo>
                          <mi>A</mi>
                        </mrow>
                      </math>
                    </span>
                    is mapped by a construction operator
                    <span className={styles.mathInline}>
                      <math>
                        <mrow>
                          <mi>f</mi>
                        </mrow>
                      </math>
                    </span>
                    into a meme
                    <span className={styles.mathInline}>
                      <math>
                        <mrow>
                          <mi>v</mi>
                          <mo>=</mo>
                          <mi>f</mi>
                          <mo stretchy="false">(</mo>
                          <mi>U</mi>
                          <mo stretchy="false">)</mo>
                        </mrow>
                      </math>
                    </span>
                    . The corresponding Meme Score of model
                    <span className={styles.mathInline}>
                      <math>
                        <mrow>
                          <msub><mi>M</mi><mi>j</mi></msub>
                        </mrow>
                      </math>
                    </span>
                    is:
                  </p>

                  <div className={styles.displayFormula}>
                    <math display="block">
                      <mrow>
                        <mi>MemeScore</mi>
                        <mo stretchy="false">(</mo>
                        <mi>v</mi>
                        <mo>;</mo>
                        <msub><mi>M</mi><mi>j</mi></msub>
                        <mo stretchy="false">)</mo>
                        <mo>=</mo>
                        <mi>Score</mi>
                        <mo stretchy="false">(</mo>
                        <mi>w</mi>
                        <mo stretchy="false">(</mo>
                        <mi>U</mi>
                        <mo stretchy="false">)</mo>
                        <mo>;</mo>
                        <msub><mi>P</mi><mrow><mo>·</mo><mi>j</mi></mrow></msub>
                        <mo stretchy="false">)</mo>
                        <mo>.</mo>
                      </mrow>
                    </math>
                  </div>

                  <p>{t.genericDefinitionTail}</p>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>{t.memeScoresCardTitle}</div>
                <div className={styles.scoreTableWrap}>
                  <table className={styles.scoreTable}>
                    <thead>
                      <tr>
                        <th>{t.tableScore}</th>
                        <th>{t.tableType}</th>
                        <th>{t.tableFrom}</th>
                        <th>{t.tableInterpretation}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memeScoreRows.map((row) => (
                        <tr key={row.name}>
                          <td className={styles.scoreName}>{row.name}</td>
                          <td>
                            <span className={styles.typeBadge}>{row.type}</span>
                          </td>
                          <td>{row.from}</td>
                          <td>{row.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section id="experimental-settings" className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{t.sectionExperimentalSettingsTitle}</h2>
                <p className={styles.sectionLead}>
                  {lang === "zh" ? (
                    <>
                      下面的设置对应论文中使用的{" "}
                      <span className={styles.inlineCode}>Curated Population</span>
                      ，包括推理模式、超参数、prompt 约定，以及基于公开 leaderboard 结果的大规模应用。
                    </>
                  ) : (
                    <>
                      The following settings correspond to the{" "}
                      <span className={styles.inlineCode}>Curated Population</span>
                      {" "}used in the paper, including reasoning modes, hyperparameters, prompt conventions,
                      and the large-scale application based on public leaderboard results.
                    </>
                  )}
                </p>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>{t.curatedSetupTitle}</div>
                <div className={styles.richText}>
                  <p>{t.curatedSetupParagraph}</p>
                </div>

                <div className={styles.settingsGrid}>
                  <div className={styles.settingCard}>
                    <div className={styles.settingTitle}>{t.reasoningModesTitle}</div>
                    <ul className={styles.settingList}>
                      <li><span>Base</span><em>{t.reasoningBaseDesc}</em></li>
                      <li><span>CoT</span><em>{t.reasoningCoTDesc}</em></li>
                      <li><span>IR</span><em>{t.reasoningIRDesc}</em></li>
                    </ul>
                  </div>

                  <div className={styles.settingCard}>
                    <div className={styles.settingTitle}>{t.hyperparametersTitle}</div>
                    <ul className={styles.settingList}>
                      <li><span>Non-IR models</span><em>{t.hyperNonIRDesc}</em></li>
                      <li><span>IR models</span><em>{t.hyperIRDesc}</em></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>{t.promptConventionsTitle}</div>
                <div className={styles.richText}>
                  <p>{t.promptConventionsP1}</p>
                  <p>{t.promptConventionsP2}</p>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>{t.largeScaleTitle}</div>
                <div className={styles.richText}>
                  <p>
                    {t.largeScaleP1Prefix}
                    <a
                      href="https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard#/"
                      target="_blank"
                      rel="noreferrer"
                      className={styles.inlineLink}
                    >
                      {t.largeScaleLinkText}
                    </a>
                    {t.largeScaleP1Suffix}
                  </p>
                  <p>
                    {t.largeScaleP2} {t.largeScaleP2Extra}
                  </p>
                  <p>{t.largeScaleP3}</p>
                </div>
              </div>
            </section>
          </div>
        </main>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarTitle}>{t.sidebarTitle}</div>
            <nav className={styles.sidebarNav}>
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`${styles.sidebarLink} ${activeId === item.id ? styles.sidebarLinkActive : ""}`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}