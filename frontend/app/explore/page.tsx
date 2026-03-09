"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Explore.module.css";

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

const memeScoreRows: MemeScoreRow[] = [
  {
    name: "Difficulty",
    type: "1D",
    from: "Difficulty",
    description: "Performs well on difficult probes.",
  },
  {
    name: "Uniqueness",
    type: "1D",
    from: "Uniqueness",
    description: "Performs well on probes with rare behavioral patterns.",
  },
  {
    name: "Risk",
    type: "1D",
    from: "Risk",
    description: "Resists probes whose failure tends to co-occur with broader errors.",
  },
  {
    name: "Surprise",
    type: "1D",
    from: "Surprise",
    description: "Handles probes with anomalous behavioral patterns.",
  },
  {
    name: "Typicality",
    type: "1D",
    from: "Typicality",
    description: "Performs well on prototypical probes.",
  },
  {
    name: "Bridge",
    type: "1D",
    from: "Bridge",
    description: "Performs well on probes that connect clusters.",
  },
  {
    name: "Mastery",
    type: "2D",
    from: "Difficulty, Typicality",
    description: "Proficiency on difficult, prototypical probes.",
  },
  {
    name: "Ingenuity",
    type: "2D",
    from: "Uniqueness, Surprise",
    description: "Flexibility on rare and anomalous probes.",
  },
  {
    name: "Robustness",
    type: "2D",
    from: "Risk, Bridge",
    description: "Correctness on high-risk probes at cross-cluster intersections.",
  },
  {
    name: "Caution",
    type: "3D",
    from: "Difficulty, Typicality, Risk",
    description: "Avoids errors on easy, prototypical, yet high-risk probes.",
  },
];

const navItems = [
  { id: "paradigm-overview", label: "Paradigm Overview" },
  { id: "meme-probe-properties", label: "Meme Probe Properties" },
  { id: "meme-scores", label: "Meme Scores" },
  { id: "experimental-settings", label: "Experimental Settings" },
];

export default function ExplorePage() {
  const [activeId, setActiveId] = useState<string>("paradigm-overview");

  const sectionIds = useMemo(() => navItems.map((x) => x.id), []);

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
                <h2 className={styles.sectionTitle}>The Probing Memes Paradigm Overview</h2>
                <p className={styles.sectionLead}>
                  Starting from the Perception Matrix, the paradigm computes diverse
                  item-level properties to construct probes, which are then used to
                  detect models’ memes, providing an interpretable view of fine-grained
                  behavioral structure and underlying capabilities.
                </p>
              </div>

              <div className={styles.heroCard}>
                <div className={styles.heroImageWrap}>
                  <img
                    src="/explore/overview.png"
                    alt="Overview of the Probing Memes Paradigm"
                    className={styles.heroImage}
                  />
                </div>
              </div>
            </section>

            <section id="meme-probe-properties" className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>From Perception Matrix to Meme Probe Properties</h2>
                <p className={styles.sectionLead}>
                  The paradigm starts from a <span className={styles.inlineCode}>Perception Matrix</span>,
                  where each entry records whether a model answers an item correctly.
                  Each item is treated as a probe, and its population-level success/failure
                  pattern becomes the basis for computing probe properties.
                </p>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Formalization</div>
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

              <div className={styles.subsectionTitle}>Six Meme Probe Properties</div>

              <div className={styles.formulaGrid}>
                <FormulaCard
                  title="Difficulty"
                  desc="Difficulty measures how many models fail on a probe. A higher value means the item is harder relative to the model population."
                >
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

                <FormulaCard
                  title="Risk"
                  desc="Risk captures whether failing this probe tends to co-occur with broader failure on many other probes."
                >
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

                <FormulaCard
                  title="Surprise"
                  desc="Surprise captures anomalous behavior, such as stronger models failing on easy probes or weaker models succeeding on hard probes."
                >
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

                <FormulaCard
                  title="Uniqueness"
                  desc="Uniqueness measures how dissimilar a probe’s perception span is from other probes’ spans."
                >
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

                <FormulaCard
                  title="Typicality"
                  desc="Typicality measures whether a probe acts like a prototype of its behavioral cluster, or how central it is within that cluster."
                >
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

                <FormulaCard
                  title="Bridge"
                  desc="Bridge measures whether a probe connects multiple behavioral clusters rather than remaining concentrated in a single one."
                >
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
            </section>

            <section id="meme-scores" className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Meme Scores of LLMs</h2>
                <p className={styles.sectionLead}>
                  Once probe properties are defined, subsets of those properties can be
                  mapped into latent behavioral traits, and each model receives a corresponding
                  Meme Score through weighted aggregation over probes.
                </p>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Generic Definition</div>
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

                  <p>
                    The paper introduces both property-derived scores and predefined
                    multi-property scores, allowing each model to be characterized by
                    a richer and more interpretable behavioral profile.
                  </p>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Meme Scores</div>
                <div className={styles.scoreTableWrap}>
                  <table className={styles.scoreTable}>
                    <thead>
                      <tr>
                        <th>Score</th>
                        <th>Type</th>
                        <th>From MPP(s)</th>
                        <th>Interpretation</th>
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
                <h2 className={styles.sectionTitle}>Experimental Settings</h2>
                <p className={styles.sectionLead}>
                  The following settings correspond to the <span className={styles.inlineCode}>Curated Population</span>
                  used in the paper, including reasoning modes, hyperparameters, prompt conventions,
                  and the large-scale application based on public leaderboard results.
                </p>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Curated Population Setup</div>
                <div className={styles.richText}>
                  <p>
                    The curated population analyzes three reasoning modes:
                    <span className={styles.inlineCode}>Base</span>,
                    <span className={styles.inlineCode}>CoT</span>, and
                    <span className={styles.inlineCode}>IR</span>.
                    Base and CoT differ only in prompting template: CoT explicitly asks the model to reason step by step, while Base uses a default instruction without a reasoning cue. IR refers to models that perform multi-step reasoning intrinsically. Base and IR use the default template, while CoT uses the chain-of-thought template.
                  </p>
                </div>

                <div className={styles.settingsGrid}>
                  <div className={styles.settingCard}>
                    <div className={styles.settingTitle}>Reasoning Modes</div>
                    <ul className={styles.settingList}>
                      <li><span>Base</span><em>Default prompting without explicit reasoning cue.</em></li>
                      <li><span>CoT</span><em>Prompt includes “Please reason step by step”.</em></li>
                      <li><span>IR</span><em>Internal reasoning mode for models that support intrinsic reasoning.</em></li>
                    </ul>
                  </div>

                  <div className={styles.settingCard}>
                    <div className={styles.settingTitle}>Hyperparameters</div>
                    <ul className={styles.settingList}>
                      <li><span>Non-IR models</span><em>temperature = 0, top-p = 1, max tokens = 8192</em></li>
                      <li><span>IR models</span><em>max tokens = 28672, other parameters follow provider defaults (for Qwen-family IR models, max tokens = 8192 and thinking budget = 20480)</em></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Prompt Conventions</div>
                <div className={styles.richText}>
                  <p>
                    Prompt templates follow a consistent structure across datasets. All prompts explicitly constrain the final output format and require the final answer to appear after
                    <span className={styles.inlineCode}>Answer:</span>
                    with no extra explanation in the answer field. Under the CoT setting, the phrase
                    <span className={styles.inlineCode}>Please reason step by step</span>
                    is added, and the model is instructed to separate its reasoning process from the final answer.
                  </p>
                  <p>
                    Dataset-specific answer formatting is kept minimal but strict: mathematical answers are enclosed in boxed form when needed, multiple-choice tasks require a single option letter, and free-form QA tasks only require the final answer after the
                    <span className={styles.inlineCode}>Answer:</span>
                    tag.
                  </p>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Application on Large-Scale Population (From Open LLM Leaderboard)</div>
                <div className={styles.richText}>
                  <p>
                    Beyond the curated population, the paradigm is also instantiated at larger scale using results collected from the Open LLM Leaderboard.
                  </p>
                  <p>
                    Results for 4,479 models across six datasets are used to construct a large-scale Perception Matrix. These leaderboard-reported results make it possible to apply the Probing Memes paradigm to a much broader and more heterogeneous model population.
                  </p>
                  <p>
                    To ensure consistency, the construction process removes models with missing records and also removes items with incomplete information, so that the retained matrix remains aligned across models and probes.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarTitle}>On this page</div>
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