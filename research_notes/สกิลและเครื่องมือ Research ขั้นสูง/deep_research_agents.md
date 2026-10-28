# Deep Research AI Products and Open-Source Deep-Research Agent Frameworks (state as of 2026-10-28)

> Research-environment note: these hosts could not be reached from this session (DNS blocked), so their pages were NOT fetched directly: blog.google, ai.google.dev, en.wikipedia.org, huggingface.co, presenc.ai. The GitHub API was also blocked (403), so star counts come from fetching the github.com HTML pages on 2026-10-28. Wherever a claim relies on a secondary blog or aggregator, it is marked [secondary]. Claims marked [prior knowledge, not re-verified] come from the researcher's background knowledge (cutoff mid-2026) and need checking.

## Q1. Commercial deep research products: what each does, pricing tiers, limits, export/citation quality

### Takeaway
All major vendors now ship an agentic "deep research" mode. The pattern is the same everywhere: plan, then iterate search/read, then write a cited report. The products differ mainly in depth versus speed. ChatGPT gives deep, polished reports in 5-30 minutes. Gemini gives breadth and now has a Max tier plus an API with MCP. Perplexity is fastest and its citations are rated most reliable. Claude Research is a multi-agent orchestrator-worker system that is strong at synthesis but reads fewer sources. Vendors increasingly describe limits in words rather than numbers, and most published limit and price figures come from secondary blogs that conflict with each other.

### Cited Findings
**OpenAI ChatGPT Deep Research and the API**
- API model `o3-deep-research`: $10 per 1M input tokens, $2.50 per 1M cached input, $40 per 1M output tokens. Tool calls (web search and others) are billed per call on top of that. — [OpenAI model docs](https://developers.openai.com/api/docs/models/o3-deep-research). OpenRouter confirms the $10/$40 rate and notes the model always uses web_search, which adds cost. — [OpenRouter](https://openrouter.ai/openai/o3-deep-research/pricing). A dated snapshot `o3-deep-research-2025-06-26` exists. — [Eden AI](https://www.edenai.co/models/o3-deep-research-2025-06-26)
- ChatGPT plan limits: the current pricing page reportedly says Deep Research is "limited" on Free/Go, "expanded" on Plus and "maximum" on Pro, with no published count. The allowance resets 30 days after the first task. The 2025 figures were Plus 25 tasks/month (10 full + 15 lightweight) and Pro 250/month, from OpenAI's April 2025 update. — [whizi.io, secondary](https://whizi.io/resources/chatgpt-deep-research-limit/); [toolcolumn, secondary](https://www.toolcolumn.com/learn/chatgpt-deep-research-limits-by-plan); [izzedo, secondary](https://www.izzedo.chat/blog/chatgpt-limits)
- Blog comparisons say ChatGPT DR runs take up to about 30 minutes and produce polished, executive-ready output. They disagree on whether full access needs Pro ($200/month) or whether Plus ($20/month) is enough. — [aitoolradar, secondary](https://aitoolradar.io/blog/deep-research-showdown); [superkind, secondary](https://superkind.ai/blog/ai-deep-research-tools)
- A source-count comparison is titled "200 vs 40 sources" (ChatGPT vs Gemini). The direction and method are unclear from the snippet. — [tech-insider, secondary](https://tech-insider.org/ca/chatgpt-vs-gemini-deep-research-sources-2026/)

**Google Gemini Deep Research / Deep Research Max**
- Deep Research and Deep Research Max launched on 2026-04-21 as public-preview agents on paid tiers of the Gemini API. They are built on Gemini 3.1 Pro. — [Google blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/next-generation-gemini-deep-research/) (via search snippet; not fetched); [VentureBeat](https://venturebeat.com/technology/googles-new-deep-research-and-deep-research-max-agents-can-search-the-web-and-your-private-data); [pasqualepillitteri, secondary](https://pasqualepillitteri.it/en/news/1191/google-deep-research-max-gemini-3-1-pro-ai-agents)
- Agent IDs are `deep-research-preview-04-2026` (speed-oriented) and `deep-research-max-preview-04-2026` (maximum comprehensiveness using extended test-time compute). Both are available only through the Interactions API, not generateContent. — [Gemini API docs](https://ai.google.dev/gemini-api/docs/deep-research) (via snippet)
- The Interactions API was introduced in December 2025, when Deep Research first became programmatically available. It later went GA. — [Google dev blog](https://blog.google/innovation-and-ai/technology/developers-tools/deep-research-agent-gemini-api/); [Interactions API GA](https://blog.google/innovation-and-ai/technology/developers-tools/interactions-api-general-availability/)
- Launch features: MCP support for third-party and private data, native charts and infographics, and collaborative planning (the user reviews the research plan before it runs). Google Cloud enterprise availability was described as "soon". — [Google blog via snippet](https://blog.google/innovation-and-ai/models-and-research/gemini-models/next-generation-gemini-deep-research/); [tech-ish](https://tech-ish.com/2026/04/22/google-deep-research-max-gemini-api-launch/)
- Max is reported at 93.3% on DeepSearchQA. This figure was relayed via search snippets and third-party blogs and is not independently verified. — [kingy.ai, secondary](https://kingy.ai/ai-launch-tracker/gemini-deep-research-max-2026-04-21-major-update/)
- A developer how-to is available. — [Phil Schmid](https://www.philschmid.de/deep-research-update)
- Blogs rate Gemini best for breadth of web coverage. One test reported weak accuracy on news citations; that is a single test. — [aitoolradar, secondary](https://aitoolradar.io/blog/deep-research-showdown)

**Anthropic Claude Research**
- The architecture is an orchestrator-worker system. A LeadResearcher plans and saves the plan to memory, because context is truncated past 200K tokens. Parallel subagents search with interleaved thinking, and a CitationAgent attaches citations at the end. The post is dated 2025-06-13. — [Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)
- An Opus 4 lead with Sonnet 4 subagents beat single-agent Opus 4 by 90.2% on Anthropic's internal research eval. Parallelism cut research time by up to 90% on complex queries. Multi-agent runs use about 15x the tokens of a chat (single agents about 4x). On BrowseComp, token usage alone explained about 80% of performance variance. — [Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)
- Blogs say Claude covers fewer sources than its rivals but leads on reasoning and synthesis, and that Research is on paid plans only. — [aitoolradar, secondary](https://aitoolradar.io/blog/deep-research-showdown); [superkind, secondary](https://superkind.ai/blog/ai-deep-research-tools)
- In the "Cited but Not Verified" benchmark (2026), Claude Opus 4.5 had the highest claim-level fact-check accuracy (76.8%) versus GPT-5.4 (47.7%). — [arXiv 2605.06635](https://arxiv.org/html/2605.06635v1)

**Perplexity Deep Research / Labs**
- Reports reportedly take about 2-4 minutes, and blogs rank it the most citation-reliable of the big four. Its narrative synthesis is weaker than ChatGPT's or Claude's. — [aitoolradar, secondary](https://aitoolradar.io/blog/deep-research-showdown)
- The DeepResearch Bench paper (2025) found Perplexity Deep Research had the highest citation accuracy (about 90%). Gemini 2.5 Pro DR had by far the most effective citations (about 111 per task). — [arXiv 2506.11763](https://arxiv.org/html/2506.11763v1)
- Limits conflict between sources. One says early-2026 cuts moved Pro to 200 Pro Searches/week and 20 Deep Research runs/month; another says 20/day. A third gives Free 5 DR/day. Enterprise is listed from about $40/user/month. — [aitoolradar guide, secondary](https://aitoolradar.io/guides/perplexity); [suprmind, secondary](https://suprmind.ai/hub/perplexity/pricing/); [prismer, secondary](https://prismer.ai/blog/deep-research-queries-per-month-all-tools)

**xAI Grok DeepSearch**
- Reportedly included in every paid plan, priced at about $10-$300/month. The limiting factor is the chat quota: about 10 messages per 2 hours on Free and about 30 per 2 hours on SuperGrok. These figures are not verified. — [tech-insider pricing, secondary](https://tech-insider.org/chatgpt-vs-claude-vs-gemini-vs-grok-subscription-pricing-2026/); [perspectiveai, secondary](https://perspectiveai.xyz/ai-pricing-guide-2026-every-plan-compared/)

**Microsoft Copilot Researcher**
- I found no reliable 2026 pricing or limits specific to Researcher. The only number found was a third-party estimate of about 5 deep searches/day on free Copilot. — [prismer, secondary](https://prismer.ai/blog/deep-research-queries-per-month-all-tools)

**Kimi / Manus / Genspark**
- One 2026 comparison covers the products' "Claw" agent offerings. Kimi Claw uses flat pricing of $39-$199/month and is built on OpenClaw with a skills ecosystem. Manus uses credits at $0-$199/month and is rated stronger on complex multi-step research. Genspark Claw uses credits at $0-$249.99/month. — [clawagora, secondary](https://www.clawagora.com/en/blog/kimi-claw-vs-manus-vs-genspark)
- Kimi K3 is listed at 91.2% on BrowseComp (vendor-reported). — [TensorFeed, aggregator](https://tensorfeed.ai/benchmarks/browsecomp)

### Inferences
- Choosing a product (synthesized from the sources above):
  - Fast fact-finding with checkable citations: Perplexity.
  - Long analyst-style reports: ChatGPT Deep Research or Gemini DR Max.
  - Synthesis and argument over a moderate source set, and work with private data through connectors/MCP: Claude Research.
  - Building research into your own app: Gemini Interactions API (has MCP and private data) or OpenAI `o3-deep-research`.
- Cost of API deep research is driven by output tokens plus per-call search fees, not the headline token price. Since token usage explains most of the BrowseComp variance, expect quality to scale with spend.
- Vendors are moving away from published task counts ("expanded", "maximum"). Any number in the final report should be labeled "as reported by third parties".

### Gaps
- Not verified: the current (October 2026) underlying model for ChatGPT Deep Research, whether newer API deep-research models exist beyond o3/o4-mini-deep-research, and the o4-mini-deep-research price. From prior knowledge, not re-verified: o4-mini-deep-research is about $2/$8 per 1M tokens.
- The Gemini consumer-app plan limits (AI Pro / Ultra) and the per-task API cost of DR Max were not found from primary sources (ai.google.dev was blocked).
- Claude Research's current plan availability and limits in 2026 were not verified from an Anthropic pricing page.
- Microsoft Copilot Researcher (M365 Copilot, $30/user/month historically; prior knowledge) has no verified 2026 data.
- I found no primary sources for Kimi Researcher, Manus Wide Research or Genspark Super Agent architectures or limits.
- Export formats (PDF/Docs/Markdown) per product were not verified from primary sources.

## Q2. Open-source frameworks: architecture, required APIs, GitHub stars, how to run

### Takeaway
Open-source deep research has split into two families. One is orchestration frameworks that wrap any LLM plus a search API: GPT Researcher, STORM, LangChain ODR, dzhng/deep-research and Jina. The other is agentic models trained end-to-end with RL that can be self-hosted: Tongyi DeepResearch 30B-A3B and MiroThinker 1.7. The trained models now post BrowseComp scores in the 70s, though still below the frontier closed systems at about 90+. LangChain's open_deep_research was archived in August 2026.

### Cited Findings
Star counts are from github.com pages fetched on 2026-10-28.

| Project | Stars | Architecture | Required APIs | Run | Source |
|---|---|---|---|---|---|
| GPT Researcher (assafelovic) | ~30.3k (4.1k forks) | Planner generates research questions, execution agents gather information, and a publisher aggregates the report. "Deep Research" mode does tree-like recursion with depth/breadth and concurrent branches (~5 min, ~$0.40/run with o3-mini high). | `OPENAI_API_KEY`, `TAVILY_API_KEY`; OpenAI-compatible base URL optional | `pip install gpt-researcher` (`GPTResearcher().conduct_research()` then `write_report()`), or uvicorn on :8000, or docker-compose (React UI on :3000) | [GitHub](https://github.com/assafelovic/gpt-researcher) |
| Stanford STORM / Co-STORM | ~31.7k | STORM has a pre-writing stage (perspective-guided question asking plus simulated writer-expert conversations, then an outline) and a writing stage (Wikipedia-style cited article). Co-STORM adds a collaborative discourse protocol with expert agents, a moderator and a human user, plus a dynamic mind map. | Any litellm LLM and embeddings; retrievers include You, Bing, Serper, Brave, SearXNG, DuckDuckGo, Tavily, Google, Azure AI Search and VectorRM | `pip install knowledge-storm`; keys in `secrets.toml`; run `examples/storm_examples/run_storm_wiki_gpt.py --retriever bing ...` | [GitHub](https://github.com/stanford-oval/storm) (last dated news January 2025, v1.1.0 litellm) |
| LangChain open_deep_research | ~12.7k (1.9k forks) | Configurable LangGraph agent with four LLM roles: summarization, research, compression and final report. The older supervisor/sub-agent multi-agent design is now in `src/legacy`. **Archived and read-only since 2026-08-21.** | Any `init_chat_model` model with tool calling and structured output (default gpt-4.1 / 4.1-mini); Tavily default, or Anthropic/OpenAI native search; MCP | `uv sync`, then `uvx ... langgraph dev --allow-blocking` (API at 127.0.0.1:2024) | [GitHub](https://github.com/langchain-ai/open_deep_research) |
| Jina node-DeepResearch | ~5.2k | Search, read and reason loop with actions answer, reflect, search and visit, and a gaps queue. Runs until it answers or the token budget runs out, then "Beast Mode" forces an answer. Built for answers, not long reports. | Gemini (default gemini-2.0-flash) or OpenAI or a local OpenAI-compatible endpoint; `JINA_API_KEY` (free key includes 1M tokens) | `npm install`, then `npm run dev "query"`; `npm run serve` gives an OpenAI-compatible server on :3000; hosted at search.jina.ai | [GitHub](https://github.com/jina-ai/node-DeepResearch) |
| dzhng/deep-research | ~19.8k (2.0k forks) | Minimal (goal under 500 LoC) recursive breadth x depth loop: SERP queries produce learnings and new directions, then recurse, then write `report.md`. Breadth 3-10 (default 4), depth 1-5 (default 2). | Firecrawl (self-host option) plus OpenAI o3-mini; Fireworks/DeepSeek R1 optional | `npm install`, set `.env.local` (`FIRECRAWL_KEY`, `OPENAI_KEY`), `npm start` | [GitHub](https://github.com/dzhng/deep-research) |
| Tongyi DeepResearch (Alibaba-NLP) | ~20.1k (1.5k forks) | Trained agent model, 30.5B total / ~3.3B active (MoE), 128K context. Training: agentic continual pre-training, then SFT, then end-to-end RL (customized GRPO). Inference: ReAct mode, or "Heavy" mode (IterResearch test-time scaling). Apache-2.0. Released 2025-09-17; OpenRouter 2025-09-20; technical report arXiv 2510.24701. | Serper (search), Jina (read), an OpenAI-compatible summarizer, DashScope (file parsing), SandboxFusion | `pip install -r requirements.txt`, fill `.env`, then `bash run_react_infer.sh`; or via OpenRouter | [GitHub](https://github.com/Alibaba-NLP/DeepResearch) |
| MiroThinker (MiroMindAI) | ~8.4k | Trained agent model. v1.7 (2026-03-11) comes in 30B ("mini") and 235B. 256K context; up to 300 tool calls (v1.5: 400, v1.0: 600). "Interactive scaling" is presented as a third scaling axis. A "keep5" context option keeps only the last 5 tool results. A proprietary MiroThinker-H1 also exists. Apache-2.0. | Serper, Jina, E2B sandbox, a summary LLM | `apps/miroflow-agent`: `uv sync`, serve with SGLang, then `uv run python main.py agent=mirothinker_1.7_keep5_max200 ...` | [GitHub](https://github.com/MiroMindAI/MiroThinker) |

- LangChain ODR on Deep Research Bench (RACE): 0.4943 with GPT-5, 0.4401 with Claude Sonnet 4, 0.4344 for the submitted config (ranked #6 as of 2025-08-02), 0.4309 for defaults. — [GitHub](https://github.com/langchain-ai/open_deep_research)
- MiroThinker 1.7 scores: BrowseComp 74.0, BrowseComp-ZH 75.3, GAIA-Val-165 82.7, HLE-Text 42.9. v1.5 scores: 69.8 / 71.5 / 80.8 / 39.2. v1.0 scores: BrowseComp 47.1, HLE 37.7. The README banner claims "88.2 on BrowseComp" with no explanation; it is probably the proprietary H1 or a heavy setting (unclear). — [GitHub](https://github.com/MiroMindAI/MiroThinker)
- Tongyi claims state-of-the-art (at its release) on HLE, BrowseComp, BrowseComp-ZH, WebWalkerQA, xbench-DeepSearch, FRAMES and SimpleQA. The exact numbers are in an image on the page and could not be extracted. — [GitHub](https://github.com/Alibaba-NLP/DeepResearch)

### Inferences
- Choosing a framework:
  - Long cited survey or Wikipedia-style article: STORM, or Co-STORM for human-in-the-loop work.
  - Production report pipeline with a UI and pip package: GPT Researcher.
  - Hackable minimal baseline: dzhng/deep-research.
  - Answer-finding on hard questions: Jina node-DeepResearch.
  - Fully self-hosted, data-sovereign agents: Tongyi DeepResearch (30B-A3B is cheap to serve) or MiroThinker.
  - Avoid starting new projects on LangChain ODR, since it is archived.
- Nearly every framework depends on a paid search/scrape API (Tavily, Serper, Firecrawl or Jina). That API is the real recurring cost and the main factor in source quality.

### Gaps
- Not fetched (huggingface.co blocked): HF smolagents open-deep-research. From prior knowledge, not re-verified: it launched on 2025-02-04 as a CodeAgent with a text browser, scoring about 55% on GAIA validation versus OpenAI DR at about 67%. Its repo is under `huggingface/smolagents/examples/open_deep_research`.
- Not fetched: II-Researcher (Intelligent-Internet), ByteDance DeerFlow, CAMEL OWL, and nickscamara/open-deep-research (Firecrawl). The GitHub API was blocked, so their stars and status are unknown.
- Tongyi's exact benchmark numbers are unknown. From prior knowledge, not re-verified: HLE about 32.9, BrowseComp about 43.4, BrowseComp-ZH about 46.7. Check arXiv 2510.24701.

## Q3. Benchmarks: what they measure and latest scores

### Takeaway
BrowseComp (hard-to-find facts on the web) has saturated at the frontier. Vendor-reported top scores were about 91-92.5% in October 2026, versus open trained models in the 70s. Report-quality benchmarks (DeepResearch Bench RACE/FACT) are tightly clustered at the top and have reproducibility problems (dead links break FACT). Claim-level citation-faithfulness benchmarks from 2026 show much lower numbers (39-77%), and that is the most decision-relevant signal.

### Cited Findings
- BrowseComp leaders conflict across aggregators. All of these are vendor-reported and unverified:
  - BenchLM (2026-10-20): Atria Dawn Preview 92.5%, GPT-5.6 Sol 92.2%, Ling 3.1 Flash 91.7%. — [BenchLM](https://benchlm.ai/benchmarks/browsecomp)
  - TensorFeed (2026-10-19): GPT-6 Astra 91.5%, Kimi K3 91.2%. — [TensorFeed](https://tensorfeed.ai/benchmarks/browsecomp)
  - Datalearner (late September): Claude Opus 5 at 90.8%, in third place. — [Datalearner](https://datalearner.com/en/benchmarks/browsecomp)
  - Steel: GPT-5.6 Sol Ultra (an agent setup) 92.2%. — [Steel](https://leaderboard.steel.dev/leaderboards/browsecomp/)
  - Mercor variant (different step and time limits): GPT-6.1 Sol 95.4%. — [BenchLM Mercor](https://benchlm.ai/benchmarks/mercorbrowsecomp)
  - BenchLeader/Kaggle shows a 31.2% leader. This looks stale or uses a different setup. — [BenchLeader](https://www.benchleader.com/benchmarks/kaggle_browsecomp)
  - BrowseComp-Plus (fixed-corpus variant for reproducibility) also exists. — [llm-stats](https://llm-stats.com/benchmarks/browsecomp-plus)
  - Several model names above (GPT-6 Astra, Atria Dawn, Ling 3.1) could not be verified against vendor primary sources.
- Open models on BrowseComp: MiroThinker 1.7 scores 74.0, and also GAIA-Val 82.7 and HLE-Text 42.9. — [GitHub](https://github.com/MiroMindAI/MiroThinker)
- DeepSearchQA: Gemini DR Max is reported at 93.3% (secondary). — [kingy.ai](https://kingy.ai/ai-launch-tracker/gemini-deep-research-max-2026-04-21-major-update/)
- DeepResearch Bench (arXiv 2506.11763, June 2025) has 100 PhD-level tasks across 22 fields. RACE scores report quality (comprehensiveness, depth, instruction-following, readability against a reference). FACT measures citation accuracy and effective citation count. In 2025, Gemini 2.5 Pro DR had about 111 effective citations per task and Perplexity DR had the best citation accuracy (about 90%). — [arXiv 2506.11763](https://arxiv.org/html/2506.11763v1)
- A 2026 snapshot (August) of DeepResearch Bench says the top 8 are within 2.4 points (overall around 58), while citation accuracy spans a 50-point range. The top entries are mostly Chinese-lab and enterprise agents. — [benchmarklist](https://benchmarklist.com/benchmarks/deepresearch_bench/)
- The RACE judge reportedly moved to GPT-5.5 in May 2026. This is uncorroborated. — [Learn AI wiki](https://ai.miraheze.org/wiki/DeepResearch_Bench)
- At least one 2026 paper dropped FACT because cited pages 404, which makes it non-reproducible. — [AgentDisCo arXiv 2605.11732](https://arxiv.org/pdf/2605.11732)
- ReportBench (2025) evaluates using academic survey tasks and separates statement hallucination from citation hallucination. — [arXiv 2508.15804](https://arxiv.org/pdf/2508.15804)

### Inferences
- What the benchmarks measure:
  - BrowseComp: persistence and multi-hop retrieval of short answers.
  - GAIA: general tool-using assistant tasks.
  - HLE: expert-level reasoning, with or without tools.
  - DeepResearch Bench, ReportBench and ResearchQA: long-form report quality and citations.
- A high BrowseComp score does not guarantee a faithful long report. For report jobs, use citation-faithfulness results.

### Gaps
- I did not retrieve current, primary leaderboard numbers for GAIA, HLE (with tools), DeepResearchGym or ResearchQA.
- From prior knowledge, not re-verified: OpenAI DR scored HLE 26.6% and GAIA about 67% at launch in February 2025, and BrowseComp 51.5% (April 2025 paper).
- DeepResearchGym (CMU, 2025) uses a free search sandbox (ClueWeb22) for reproducible evaluation; prior knowledge, no URL verified.
- ResearchQA (2025) uses rubric-based evaluation of scholarly QA; prior knowledge, not verified.

## Q4. Known failure modes and mitigations

### Takeaway
Fabricated URLs are a minority problem (3-13%). The bigger issue is claims that cite a real, relevant page that does not actually support them: claim-level accuracy is only 39-77% even for frontier systems. Agents also over-select SEO content farms and burn budget (over-spawning subagents, endless searching). The mitigations are claim-level verification, source-quality steering in prompts and tools, effort-scaling rules, and treating a high citation count as meaningless on its own.

### Cited Findings
- Across 10 models (DRBench) and 3 (ExpertQA), 3-13% of citation URLs were hallucinated and 5-18% did not resolve. Deep research agents had the highest hallucination rates, and citation volume is not a proxy for quality. The paper also proposes detection and correction. — [arXiv 2604.03173](https://arxiv.org/abs/2604.03173)
- "Cited but Not Verified" tested 14 models. Link validity and topical relevance stay high, but the factual accuracy of cited claims is only 39-77% for the strongest frontier models (Claude Opus 4.5 76.8%, GPT-5.4 47.7%). Fewer than half of the open-source models produced a cited report one-shot. — [arXiv 2605.06635](https://arxiv.org/html/2605.06635v1)
- Anthropic observed these failure modes:
  - spawning 50 subagents for simple queries
  - endlessly searching for nonexistent sources
  - duplicated subagent work caused by vague task specs
  - continuing to search after enough evidence was found
  - overly long queries and wrong tool choice
  - **preferring SEO-optimized content farms over authoritative sources**
  - compounding errors in long stateful runs
  — [Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)
- Anthropic's mitigations:
  - explicit subagent objectives, output formats and boundaries
  - effort-scaling rules (1 agent for simple facts, 10+ for complex research)
  - start with short, broad queries, then narrow
  - better tool descriptions (an agent rewriting them cut task time by 40%)
  - LLM-judge rubric evaluation on about 20 queries plus human testing
  - checkpoints and resume
  — [Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)
- Other failure-mode research:
  - Trajectory-level hallucination analysis. — [arXiv 2601.22984](https://arxiv.org/pdf/2601.22984v1)
  - Localizing which agent in a pipeline causes faithfulness and citation errors (listed as ICLR 2026). — [arXiv 2608.24306](https://arxiv.org/pdf/2608.24306)
  - An on-device 4B study ties faithfulness to source exposure and coverage to retrieval. — [arXiv 2607.12257](https://arxiv.org/pdf/2607.12257)
- In ReportBench, a DR output attributed a method to a paper whose author list did not include the named author. — [arXiv 2508.15804](https://arxiv.org/pdf/2508.15804)
- Link rot undermines citation evaluation and audits. — [AgentDisCo arXiv 2605.11732](https://arxiv.org/pdf/2605.11732)

### Inferences
- Practical mitigations for users:
  1. Spot-check claim-to-source support, not just whether links work.
  2. Specify preferred source types (primary docs, peer-reviewed papers, .gov) and exclusions (content farms) in the prompt or by using domain filters.
  3. Use a plan-review step where available (Gemini collaborative planning) to catch a wrong scope early.
  4. Archive cited pages at research time, because links rot.
  5. Cross-run with two different products and compare the claims they disagree on.
  6. For open frameworks, add a dedicated verification/citation agent pass (as in Anthropic's CitationAgent).

### Gaps
- I found no unified, cross-vendor 2026 hallucination leaderboard. The numbers above come from different benchmarks and are not directly comparable.
- I found no quantified study specifically on SEO-content over-reliance beyond Anthropic's qualitative observation.
