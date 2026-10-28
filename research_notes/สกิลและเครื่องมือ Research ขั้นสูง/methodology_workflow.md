# Methodology, Core Skills and Workflow Design for Rigorous Research with AI Agents (as of 2026-10-28)

> Method note: these notes come from about 15 search/fetch calls. arxiv.org and pressbooks.pub could not be fetched from this session (DNS blocked by the sandbox), so arXiv numbers come from search-result abstracts and alphaxiv mirrors. Items tagged **[training knowledge, not re-verified]** come from the model's prior knowledge, with a canonical URL that was not fetched this session. Treat them as lower confidence.

## 1. Proven research process frameworks, source evaluation (SIFT, CRAAP, lateral reading, triangulation, OSINT) and search operators in 2026

### Takeaway
The strongest human method is a loop: question → scope/decompose → plan → broad-then-narrow search → read laterally → verify claims (trace upstream, triangulate) → synthesize with citations. Use SIFT and lateral reading for fast triage of web sources. CRAAP works as a slower checklist, but it is weaker on its own because it rewards on-page signals. Google operators still work for precise retrieval (site:, filetype:, intitle:, "exact", -, before:/after:), but cache:, link: and info: are gone.

### Cited Findings
**Process loop (as applied by agents)**
- Anthropic's production research system follows this loop. A lead agent plans and saves the plan to memory, spawns subagents that each search one aspect in parallel, iterates if results are insufficient, synthesizes, and then runs a separate CitationAgent pass that attaches sources to claims. — [Anthropic, How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- Search heuristic: "start with short, broad queries, evaluate what's available, then progressively narrow focus." Agents tended to default to overly long, specific queries. — [Anthropic multi-agent research](https://www.anthropic.com/engineering/multi-agent-research-system)
- LangChain's open_deep_research splits the work into three phases. (1) Scoping: optional clarifying questions, then a structured "research brief". (2) Research: a supervisor with think_tool, ConductResearch and ResearchComplete tools, plus parallel sub-researchers capped by `max_concurrent_research_units`. (3) Report writing. — [DEV: Open Deep Research internals](https://dev.to/bolshchikov/open-deep-research-internals-a-step-by-step-architecture-guide-2ibk); [rywalker.com summary](https://rywalker.com/research/open-deep-research) (secondary sources; official repo: https://github.com/langchain-ai/open_deep_research)

**SIFT and lateral reading**
- SIFT (Mike Caulfield): **S**top; **I**nvestigate the source; **F**ind better coverage; **T**race claims, quotes and media to the original context. It grew out of the earlier "Four Moves and a Habit" in *Web Literacy for Student Fact-Checkers*. — [College of DuPage library SIFT guide](https://library.cod.edu/evaluating/SIFT); [Clackamas CC SIFT guide](https://libguides.clackamas.edu/research-help/sift); [Caulfield, Web Literacy for Student Fact-Checkers (Pressbooks)](https://pressbooks.pub/webliteracy/chapter/four-strategies/)
- Lateral reading means leaving the site to see what other sources say about its reputation before reading it closely. "Click restraint" means scanning the results page before opening any link. — [Woodward library SIFT guide](https://woodward.libguides.com/factchecking/SIFT); [Intro to College Research: SIFT](https://pressbooks.pub/introtocollegeresearch/chapter/the-sift-method)
- Evidence base: Stanford History Education Group research (Wineburg & McGrew) found that professional fact-checkers who read laterally, spending little time on the site itself and more on what others say about it, identified misleading information better than historians and Stanford students. — [ACRL C&RL News article](https://crln.acrl.org/index.php/crlnews/article/view/26143/34085) (secondary). Original working paper: Wineburg & McGrew 2017, "Lateral Reading: Reading Less and Learning More When Evaluating Digital Information," Stanford Graduate School of Education working paper 2017-A1 **[training knowledge, not re-verified]**
- Application to AI: treat each AI answer as an unknown source. Stop, check who or what the cited source is, find independent coverage, and trace each claim to its primary document. This is our inference from SIFT combined with the hallucination data in section 2.

**CRAAP test**
- The CRAAP test (Currency, Relevance, Authority, Accuracy, Purpose) was created by Sarah Blakeslee at CSU Chico's Meriam Library around 2004. Library guides now often pair it with SIFT or replace it, because a checklist applied to a single page can be gamed by professional-looking misinformation. **[training knowledge, not re-verified]** Canonical PDF: https://library.csuchico.edu/sites/default/files/craap-test.pdf

**Triangulation and OSINT**
- Bellingcat-style OSINT practice: trace material back to its origin (re-uploads strip the metadata that confirms date, time and location), corroborate it against other sources, and watch for your own biases and those of your sources. — [IJNet: Fundamentals of OSINT for journalists](https://ijnet.org/en/story/fundamentals-open-source-intelligence-journalists); [Kyiv Post: Bellingcat's 'Seven Commandments' for OSINT](https://www.kyivpost.com/amp/post/32947)
- Toolkits and standards: Bellingcat's Online Open Source Investigation Toolkit, the BBC Africa Eye forensics dashboard, Sentinel Hub EO Browser and Google Earth for satellite imagery. The Berkeley Protocol on Digital Open Source Investigations covers how to gather, analyse and preserve digital evidence "in a professional, legal, and ethical manner." — [Barnard Library OSINT guide](https://guides.library.barnard.edu/misinformation/osint). Toolkit: https://bellingcat.gitbook.io/toolkit **[URL from training knowledge]**
- Bellingcat's editor warns that AI-generated imagery makes authenticity checks harder. — [Barnard guide](https://guides.library.barnard.edu/misinformation/osint)
- Structured analytic technique: Analysis of Competing Hypotheses (Richards Heuer, CIA, *Psychology of Intelligence Analysis*, 1999) builds a matrix of evidence against hypotheses and tries to disconfirm each one rather than confirm a favourite. It fits well as an "adversarial reviewer" prompt. **[training knowledge, not re-verified]** https://www.cia.gov/resources/csi/books-monographs/psychology-of-intelligence-analysis-2/

**Search operators (2026 status)**
- Still working according to multiple 2026 SEO/OSINT cheat sheets: `site:`, `filetype:`, `intitle:`/`allintitle:`, `inurl:`, `"exact phrase"`, `-exclude`, `OR`, `*`, `before:`/`after:`. About 25 operators reportedly still work, and none were added in 2024–early 2026. — [meshworld 2026 cheatsheet](https://meshworld.in/blog/cheatsheets/google-search-operators-cheatsheet/); [maxintel Google dorking reference 2026](https://maxintel.org/google-dorking-reference-2026.html); [GreenGeeks full list](https://www.greengeeks.com/blog/google-search-operators-full-list-and-examples/)
- Removed: `cache:` (retired in early 2024; Google removed the documentation by about September 2024 and pointed users to the Internet Archive). `link:` and `info:` (about 2017). `related:` is unreliable or gone (about 2023). — same sources plus [Meetanshi 2026](https://meetanshi.com/blog/google-search-operators-for-seo/). **Uncertainty:** these are blog sources, not an official Google changelog, and the dates differ between them.
- Replacements for cache: the Wayback Machine (web.archive.org) and archive.today. — [GreenGeeks](https://www.greengeeks.com/blog/google-search-operators-full-list-and-examples/)

### Inferences
- A practical 2026 workflow: use AI deep research for breadth and candidate sources. Then do SIFT/lateral reading plus operator-driven searches by hand (e.g. `site:gov filetype:pdf "exact title"`) to reach primary documents for any claim that matters.
- Use CRAAP as a final checklist on the shortlisted sources and SIFT for triage. Don't let CRAAP stand in for lateral reading.
- Triangulation rule of thumb: a load-bearing claim needs at least two independent sources that do not cite each other, or one primary source (data, filing, paper).

### Gaps
- No official 2026 Google or Bing documentation of operator status was found. Bing operators (e.g. `inbody:`, `contains:`, `ip:`) were not verified this session.
- The original SHEG study text and the Caulfield pressbooks pages could not be fetched (domain blocked), so the wording above is taken from library guides.

## 2. Verifying AI research output: citation checking, claim-level verification, measured hallucination rates, CoVe, self-consistency, adversarial review

### Takeaway
Deep research agents still fabricate a measurable share of citations: about 3–13% of URLs are fabricated and 5–18% fail to resolve, according to an April 2026 study, and claims can misrepresent sources that do exist. Verification therefore has to work at the claim level: check that the URL exists, that the source says what the claim says, and that the source is authoritative. Automated post-hoc URL checks, factored verification (CoVe), and separate tool-using judge or reviewer agents measurably help.

### Cited Findings
- **Reference hallucination rates (Rao, Wong, Callison-Burch, arXiv 2604.03173, April 2026):** across 10 commercial LLMs and deep research agents on DRBench, about **3–13% of cited URLs are fabricated** (no archive record) and **5–18% fail to resolve**. Deep research agents produce more citations per query than search-augmented LLMs but fabricate URLs at higher rates. More citations do not lower the per-citation error rate. A post-hoc URL verification step sharply reduced non-resolving links. — [alphaXiv: Detecting and Correcting Reference Hallucinations in Commercial LLMs and Deep Research Agents](https://www.alphaxiv.org/abs/2604.03173); [arXiv PDF](https://arxiv.org/pdf/2604.03173) (figures taken from the abstract via search; the full paper was not fetched)
- **Two failure modes (ReportBench, ByteDance, arXiv 2508.15804, Aug 2025):** *statement hallucination*, where a claim misrepresents a real source, and *citation hallucination*, where the reference is invented. Its audit found OpenAI Deep Research attributing a claim to an author who is not on the cited paper. — [ReportBench arXiv](https://arxiv.org/pdf/2508.15804); [alphaXiv ReportBench benchmark](https://alphaxiv.org/benchmarks/bytedance/reportbench)
- **DeepResearch Bench (ICLR 2026):** scores agents on report quality (RACE) and citation metrics (effective citation count, citation accuracy), and is aligned with expert judges. — [mlanthology ICLR 2026 listing](https://mlanthology.org/iclr/2026/du2026iclr-deepresearch/)
- **LiveResearchBench (Oct 2025):** its DeepEval suite scores citation accuracy alongside presentation and analytical depth. — [EmergentMind listing](https://www.emergentmind.com/papers/2510.14240)
- **DREAM (Feb 2026):** argues that static LLM judges cannot verify facts themselves and so miss factual and temporal errors even when citations look aligned. It proposes evaluators that call tools. — [hyper.ai listing of arXiv 2602.18940](https://hyper.ai/de/papers/2602.18940)
- **Chain-of-Verification (Dhuliawala et al., Meta; Findings of ACL 2024):** (1) draft an answer, (2) plan verification questions, (3) answer them independently, (4) write a revised, verified answer. The "factored" variant answers each verification question without seeing the draft, which avoids copying its errors, and works best. It reduced hallucinations on Wikidata list questions, closed-book MultiSpanQA and long-form biographies. — [ACL Anthology 2024.findings-acl.212](https://preview.aclanthology.org/add_acl24_videos/2024.findings-acl.212); [ICLR 2024 workshop listing](https://mlanthology.org/iclrw/2024/dhuliawala2024iclrw-chainofverification); arXiv 2309.11495. Exact percentages were not retrieved.
- **Self-consistency (Wang et al., 2022, arXiv 2203.11171):** sample several reasoning paths and take the majority answer. Disagreement between samples is a cheap signal of uncertainty. **[training knowledge, not re-verified]**
- **Human review still catches what automation misses:** Anthropic's human testers found that agents preferred SEO content farms over authoritative sources such as academic PDFs. Anthropic fixed this by adding source-quality heuristics to the prompts. — [Anthropic multi-agent research](https://www.anthropic.com/engineering/multi-agent-research-system)
- A dedicated CitationAgent pass that maps claims to sources after synthesis is part of Anthropic's production design. — [Anthropic multi-agent research](https://www.anthropic.com/engineering/multi-agent-research-system)

### Inferences
Recommended verification stack, from cheap to expensive:
1. **Deterministic link check.** HTTP-resolve every URL, fall back to a Wayback lookup, and flag DOIs that do not resolve on doi.org or Crossref. The 2604.03173 study shows this step alone removes most dead or fabricated links.
2. **Claim-source entailment.** For each atomic claim, fetch the cited page and ask a separate model "Does this passage support claim X? Quote the supporting text, or answer NOT FOUND." This targets statement hallucination (ReportBench).
3. **Factored CoVe.** Generate verification questions for numbers, dates, names and quotes, and answer them with fresh searches, without showing the draft.
4. **Adversarial reviewer subagent.** In a clean context, using ACH-style prompts, look for disconfirming evidence, missing perspectives, recency problems and weak sources. The reviewer should call tools (per DREAM) rather than only read.
5. **Self-consistency.** Run two or three independent research runs for key numbers and flag any disagreement.
6. **Human SIFT spot-check** on load-bearing claims.

### Gaps
- No single 2026 leaderboard comparing hallucination rates of OpenAI Deep Research, Gemini Deep Research, Perplexity and Claude Research was found. Per-tool numbers in 2604.03173 were not retrieved because arxiv.org was blocked.
- Quantitative CoVe gains (e.g. precision on list tasks) were not retrieved.

## 3. Multi-agent research architecture with Claude: orchestrator-worker, token economics, effort scaling, prompts, context engineering, memory, implementation, evaluation

### Takeaway
Use an orchestrator-worker design: one lead agent that plans and saves the plan, 3–5 or more parallel subagents with clean contexts, and separate citation and verification passes. Multi-agent pays off for broad, parallelizable research. It costs about 15× chat tokens, and token spend explains most of the performance difference. Context engineering, meaning compaction, external notes, condensed subagent summaries and just-in-time retrieval, matters more than clever prompts. Evaluate on outcomes with an LLM judge (0–1 score plus pass/fail) and read transcripts.

### Cited Findings
**Architecture and economics** — all from [Anthropic, How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- An Opus 4 lead with Sonnet 4 subagents outperformed single-agent Opus 4 by **90.2%** on Anthropic's internal research eval.
- On BrowseComp, three factors explained **95% of performance variance**: token usage alone explained **80%**, and tool-call count and model choice explained the rest. Upgrading the model (Sonnet 3.7 → Sonnet 4) gained more than doubling the token budget.
- Agents use about **4× the tokens** of chat, and multi-agent systems about **15×**. A good fit is high-value, parallelizable work, information larger than one context window, and many tools. A poor fit is work that needs shared context or tight dependencies between agents (e.g. most coding).
- **Effort-scaling rules embedded in the prompt:** simple fact-finding uses 1 agent with 3–10 tool calls; direct comparisons use 2–4 subagents with 10–15 calls each; complex research uses more than 10 subagents with clearly divided roles. Early versions spawned 50 subagents for simple queries.
- **Parallelism:** the lead spawns 3–5 subagents at once, and each subagent makes 3+ tool calls in parallel. This cut research time by up to **90%** on complex queries.
- **Delegation spec:** each subagent needs an objective, an output format, guidance on tools and sources, and clear task boundaries. Vague instructions caused duplicated work.
- **Other prompting lessons:** simulate the agent step by step to see its failures; check available tools first and prefer specialized tools; use extended or interleaved thinking as a scratchpad. Letting Claude rewrite a flawed MCP tool description cut task completion time by **40%**. Prefer heuristics to rigid rules.
- **Memory:** the lead saves its plan to memory because context beyond 200k tokens gets truncated. Finished phases are summarized and stored externally, and fresh subagents can pick up from the stored plan. Subagents write outputs to external storage and pass lightweight references back, which avoids a "game of telephone".
- **Reliability:** resume from checkpoints rather than restarting; combine deterministic retries with model adaptivity; trace in production; use rainbow deployments. Synchronous subagent batches are a bottleneck, and asynchronous execution adds coordination problems.

**Context engineering** — [Anthropic, Effective context engineering for AI agents (29 Sep 2025)](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- **Context rot:** recall degrades as the context fills. Treat context as a finite "attention budget".
- **System prompts** should sit at the "right altitude", between brittle if-else logic and vague guidance. Start minimal and add instructions in response to observed failures.
- **Tools:** keep a minimal, non-overlapping tool set that returns token-efficient output. Use a few diverse, canonical examples rather than long lists of edge-case rules.
- **Just-in-time retrieval:** keep lightweight identifiers (paths, queries, URLs) and load content when needed; hybrid pre-retrieval is acceptable.
- **Long-horizon techniques:** (a) compaction, which summarizes near the limit and should be tuned for recall first, with clearing old tool results as the lightest form; (b) structured note-taking such as NOTES.md or to-do files ("agentic memory"); (c) sub-agents in clean contexts that return condensed summaries of about **1,000–2,000 tokens**.
- Anthropic's memory tool, a file-based store outside the context window, launched in public beta on the Claude Developer Platform.

**Implementation**
- **Claude Agent SDK subagents** are separate agent instances with their own fresh context, and only their final result returns to the parent. They can run concurrently. Define them programmatically via the `agents` option of `query()` (recommended for SDK apps), as markdown files in `.claude/agents/`, or use the built-in general-purpose subagent. Claude routes work by each subagent's `description`. — [Claude Agent SDK: Subagents](https://code.claude.com/docs/en/agent-sdk/subagents); [platform.claude.com mirror](https://platform.claude.com/docs/en/agent-sdk/subagents)
- **Claude API server tools (2026):** `web_search_20260209` and `web_fetch_20260209` require `code_execution_20260120` or later. Code execution is free when used with these tools, and it powers **dynamic filtering**: Claude writes code to filter search and fetch results before they enter the context window. All three are GA with no beta header. Not available on Bedrock or Vertex, and not ZDR-eligible. — [Claude docs: Code execution tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool); [Simon Willison, 17 Feb 2026, dynamic filtering](https://simonwillison.net/2026/Feb/17/dynamic-filtering/). A newer `code_execution_20260521` version with a 90-second per-cell limit appears only in a translated docs mirror. **Unverified.**
- **LangGraph open_deep_research:** supervisor and sub-researcher subgraphs with isolated contexts, tools named think_tool, ConductResearch and ResearchComplete, a concurrency cap, and a scoping or brief node. The architecture has been stable since the July 2025 rewrite. Its reported RACE score of 0.4344 on DeepResearch Bench is historical because the leaderboard space went offline. — [DEV architecture guide](https://dev.to/bolshchikov/open-deep-research-internals-a-step-by-step-architecture-guide-2ibk); [rywalker.com](https://rywalker.com/research/open-deep-research); [Medium enterprise write-up](https://medium.com/@tuhinsharma121/building-enterprise-deep-research-agents-with-langchains-open-deep-research-63e7cdb80a58)
- Anthropic's earlier "Building effective agents" (Dec 2024) describes the workflow patterns behind this design: prompt chaining, routing, parallelization (sectioning and voting), orchestrator-workers, and evaluator-optimizer. It advises using the simplest pattern that works. **[training knowledge, not re-verified]** https://www.anthropic.com/engineering/building-effective-agents

**Evaluation**
- Start with about **20 real queries**, because early prompt changes swing success a lot (e.g. 30% → 80%). — [Anthropic multi-agent research](https://www.anthropic.com/engineering/multi-agent-research-system)
- **LLM-as-judge rubric:** factual accuracy, citation accuracy, completeness, source quality, tool efficiency. A single judge prompt that outputs a 0.0–1.0 score plus pass/fail was the most consistent and closest to human judgment. Judge the end state, not the path, and add checkpoints for long workflows. — [Anthropic multi-agent research](https://www.anthropic.com/engineering/multi-agent-research-system)
- **Eval anatomy:** tasks, trials, graders (code-based, model-based, human), transcripts, outcomes, harness. Grade the outcome rather than the exact tool path, but read transcripts to validate the graders. **pass@k** (at least one success in k trials) tends toward 100% as k grows, while **pass^k** (all k trials succeed) tends toward 0%, so report both for non-deterministic agents. — [Anthropic, Demystifying evals for AI agents](https://anthropic.com/engineering/demystifying-evals-for-ai-agents) (page body seen only partially; details confirmed via [secondary commentary](https://khaledea.substack.com/p/evals-for-agents-the-missing-bridge))
- Use tool-calling judges for factual checks, because static judges miss factual and temporal errors. — [DREAM listing](https://hyper.ai/de/papers/2602.18940)

### Inferences
**Reference pipeline (Claude):**
1. **Scoper.** Ask clarifying questions, then write a research brief: question, sub-questions, scope, recency cut-off, output format.
2. **Lead/orchestrator.** Decompose into 3–8 non-overlapping sub-questions, choose an effort budget from the scaling rules, and save the plan to a file.
3. **Researcher subagents run in parallel.** Each gets an objective, key questions, suggested sources, a tool-call budget of about 10–15, and an output schema (findings with inline URLs, inferences, gaps). Each writes its notes to a file and returns a short summary.
4. **Verifier subagent(s).** Deterministic URL check, claim-source entailment, factored CoVe on numbers, and an ACH-style adversarial review.
5. **Synthesizer/writer.** Write only from the verified notes, attach a citation to every claim, and include an explicit uncertainty section.
6. **Eval.** About 20 or more golden queries, scored by an LLM judge on the five-criterion rubric, with periodic human transcript review.

This is essentially the pattern the requesting system already uses: one researcher per notes file under /research_notes, plus a report writer.

**Cost control:** run Sonnet-class subagents under an Opus-class lead, cap subagents and tool calls per query, and use dynamic filtering to keep raw HTML out of context.

### Gaps
- No public 2026 update from Anthropic on token and performance figures for newer models (Opus 4.6+/5) was found. The 90.2% figure is from the June 2025 post with Claude 4-era models.
- LangGraph-specific 2026 features (e.g. the current status of langgraph-supervisor) were not verified in primary docs.

## 4. Analysis and synthesis tools: Python/Jupyter, DuckDB, Claude code execution, visualization, QDA (NVivo/ATLAS.ti), NotebookLM, PKM (Obsidian/Logseq/Notion) and AI integration

### Takeaway
Do quantitative work in code (Jupyter, or Claude's code execution, with pandas, Polars or DuckDB) so that numbers are reproducible rather than generated by the model. Use NotebookLM for answers grounded in a bounded, curated set of sources. QDA tools now offer AI-assisted coding (ATLAS.ti most aggressively), but they still need a human-owned codebook. Obsidian connects to Claude through community MCP servers, which makes a local markdown vault a durable research memory.

### Cited Findings
- **Claude code execution:** a sandbox for analysis and charting. With web search and fetch it is free and filters results before they enter context. — [Claude docs: Code execution tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool); [Simon Willison](https://simonwillison.net/2026/Feb/17/dynamic-filtering/)
- **NotebookLM:** answers are grounded in user-uploaded sources. A Deep Research mode searches the web or Google Drive, builds a report, and adds the sources to the notebook, in fast or deep runs. Reported limits are **50 sources per notebook (free), 300 (AI Pro), 600 (AI Ultra)**, and Deep Research reports at roughly 10/month free, 20/month Pro, and 100+/month Ultra. **Conflicting:** another source lists Pro at 20 per day. — [DigitalOcean: What is NotebookLM (2026)](https://www.digitalocean.com/resources/articles/what-is-notebooklm); [aiagent-navi (JP)](https://aiagent-navi.com/generation-ai/notebooklm-deep-research/); [Lead with AI, Nov 2025](https://www.leadwithai.co/article/level-up-your-report-with-notebooklms-deep-research). Check these limits against Google's help pages before relying on them.
- **ATLAS.ti:** AI Coding (beta) proposes an initial code structure and hierarchies across multiple documents. Critics say the researcher still owns the codebook and reviews every suggestion, and some Capterra reviewers call the AI options limited. — [Delve: AI features in QDA software](https://delvetool.com/blog/ai-features-in-qda-software); [Usercall comparison](https://usercall.co/post/atlas-ti-vs-nvivo-vs-usercall-which-qualitative-analysis-tool-is-best); [Capterra reviews](https://www.capterra.com/p/171500/ATLAS-ti/reviews/)
- **NVivo:** positioned for rigorous mixed-methods academic work with heavy manual oversight. Its AI assistant features are described as more limited than AI-native tools and as having a steep learning curve. — [Energent 2026 thematic-analysis comparison](https://www.energent.ai/use-cases/en/compare/ai-tools-for-thematic-analysis); [Delve](https://delvetool.com/blog/ai-features-in-qda-software). **Caveat:** these sources are competitor vendors.
- **Obsidian + Claude via MCP:** community servers use the Obsidian Local REST API plugin over stdio, with data kept local. Some expose 35+ tools (frontmatter, wikilinks, backlinks, orphan detection, full-text search) or hybrid semantic search. They are configured in `claude_desktop_config.json`. Maintenance quality varies. — [SMU Libraries: Claude Desktop + Obsidian MCP](https://library.smu.edu.sg/topics-insights/what-if-your-ai-could-read-your-notes-claude-desktop-obsidian-mcp); [Glama Obsidian MCP directory](https://glama.ai/mcp/best/obsidian); [Obsidian knowledge MCP README](https://glama.ai/mcp/servers/@TheOutcastVirus/obsidian-knowledge-mcp/blob/5fee669e3681dd105798febfca0b165a4c6d699c/README.md)
- Zotero, Semantic Scholar and OpenAlex are starting to offer MCP integrations. — [SMU Libraries](https://library.smu.edu.sg/topics-insights/what-if-your-ai-could-read-your-notes-claude-desktop-obsidian-mcp)
- DuckDB runs analytical SQL in-process directly on CSV and Parquet files. Polars is a fast multi-threaded DataFrame library with lazy queries. Both suit agent-written analysis code. **[training knowledge, not re-verified]** https://duckdb.org/docs/ ; https://docs.pola.rs/

### Inferences
- Rule: the LLM never does arithmetic in prose. Every statistic in a report should come from code (notebook or code execution) with the data source logged.
- **PKM pattern:** one markdown note per source (citation, key quotes with locators, SIFT verdict), one note per claim linking to its sources, and agents reading and writing through MCP. This is the human equivalent of Anthropic's "external memory".
- Use NotebookLM as a closed-corpus Q&A and verification layer on top of open-web deep research: upload the verified primary sources and ask it to confirm claims.

### Gaps
- No independent 2026 benchmarks of NVivo or ATLAS.ti AI accuracy were found.
- Logseq and Notion AI 2026 integrations were not researched (time budget). Official NotebookLM limits are unconfirmed.

## 5. Prompt templates and output templates for research briefs and reports

### Takeaway
Effective templates encode the delegation spec (objective, key questions, sources, budget, boundaries, output schema) and force a split between cited findings, inferences and gaps. This mirrors Anthropic's lessons and the structure used for these very notes.

### Cited Findings
- A subagent task needs "an objective, an output format, guidance on the tools and sources to use, and clear task boundaries". Effort budgets should be stated in the prompt. — [Anthropic multi-agent research](https://www.anthropic.com/engineering/multi-agent-research-system)
- Subagents should return condensed summaries of about 1–2k tokens. — [Anthropic context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- Open Deep Research starts from a structured research brief produced by the scoping step. — [DEV guide](https://dev.to/bolshchikov/open-deep-research-internals-a-step-by-step-architecture-guide-2ibk)

### Inferences (templates synthesized from the cited principles)

**A. Research brief (scoper output)**
```
QUESTION: <one sentence>
DECISION/USE: <who will use this and for what>
SCOPE: in: <...> | out: <...> | geography/time window: <...> | recency cutoff: <date>
SUB-QUESTIONS (non-overlapping): 1.. 2.. 3..
SOURCE PRIORITIES: primary data/filings/papers > official docs > reputable press > blogs (flag)
EFFORT: simple | comparison | complex  -> agents: N, tool calls per agent: M
DELIVERABLE: format, length, language, citation style
```

**B. Subagent researcher prompt**
```
You are researching <sub-question> as part of <overall question>. Others cover <adjacent topics>; stay in scope.
Objective: ... Key questions: ...
Method: short broad queries -> narrow; fetch full pages, don't trust snippets; prefer primary sources; run parallel calls.
Budget: <=15 tool calls. Stop when questions are answered or no new info is coming in.
Source rules: lateral-read unknown sites; flag SEO/content farms; note dates; mark speculation.
Output (save to <path>): per key question -> Takeaway / Cited Findings (every claim + [Source](URL)) / Inferences / Gaps.
Never invent a number or URL; if not found, put it in Gaps.
```

**C. Verifier / adversarial reviewer prompt**
```
For each atomic claim in <notes>: (1) fetch the cited URL; (2) quote the supporting passage or answer NOT_FOUND;
(3) label: SUPPORTED / PARTIAL / CONTRADICTED / UNVERIFIABLE / DEAD_LINK; (4) for numbers/dates/names run an independent search
without looking at the draft (factored CoVe). Then argue the strongest competing hypothesis (ACH): what evidence would
disconfirm the main conclusion, and did we look for it?
Output: table claim | label | evidence quote | better source.
```

**D. LLM-as-judge rubric (score 0.0–1.0 per criterion + overall pass/fail)**
factual accuracy · citation accuracy (does the source support the claim) · completeness against the key questions · source quality (primary/authoritative) · tool efficiency · (optional) recency, and clear statement of uncertainty.

**E. Final report skeleton**
```
1. Executive summary (3–5 bullets, each with a confidence level)
2. Question & scope (incl. cutoff date)
3. Key findings by theme (claim -> evidence -> citation)
4. Disagreements / conflicting evidence
5. Analysis & implications (marked as inference)
6. Limitations, gaps, open questions
7. Method (sources searched, tools, verification steps)
8. References (verified, with access dates; archived links for volatile pages)
```

### Gaps
- No peer-reviewed comparison of research-prompt templates was found. The templates above are synthesized from Anthropic's published principles, not taken from an official source.
