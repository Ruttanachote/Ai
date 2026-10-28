# Academic / Scholarly Research Tools for AI-Assisted Research (as of 2026-10-28)

Note on method: ~22 web searches done on 2026-10-28. Many pricing figures come from aggregator sites (CostBench, aiproductivity.ai, CASRAI, neuronfeed) because vendor pricing pages were not fetched directly; these are flagged. Items marked "[prior knowledge, unverified this session]" come from model training data (cutoff mid-2026) and should be re-checked before publication.

## 1. Scholarly databases & free APIs (coverage, rate limits, keys)

### Takeaway
OpenAlex (key now mandatory since Feb 2026, usage-budget model), Semantic Scholar (1 RPS with key), Crossref (new limits since 1 Dec 2025), PubMed E-utilities (3/10 RPS) and Unpaywall (email param, ~100k/day) form the free backbone; Scopus/WoS offer free-but-limited keys for academics; Google Scholar still has no official API.

### Cited Findings
**OpenAlex**
- API key now required; keys are free. Introduced 13 Feb 2026 with usage-based limits — [OpenAlex docs: authentication](https://developers.openalex.org/api-reference/authentication); [OpenAlex rate limits](https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication)
- Free key = ~$1/day API budget; keyless = ~$0.01/day per official docs (a third-party guide says $0.10 — conflict; official docs take precedence) — [OpenAlex docs](https://developers.openalex.org/api-reference/authentication); [freeapihub (conflicting)](https://freeapihub.com/blog/openalex-api-keys-required-guide)
- Example per-call costs: singleton lookup $0, list $0.0001, search $0.001, semantic/content/full-text $0.01; hard cap 100 req/s; per_page max 100; `/rate-limit` endpoint shows remaining budget; academics can request higher limits; Premium paid plans exist — [OpenAlex rate-limit status doc](https://developers.openalex.org/api-reference/rate-limits/check-rate-limit-status.md)
- OpenAlex publishes an "API Guide for LLMs" — [docs.openalex.org/api-guide-for-llms](https://docs.openalex.org/api-guide-for-llms)
- Unpaywall is now operated under/with OpenAlex (help pages hosted at help.openalex.org) — [OpenAlex help: Unpaywall](https://help.openalex.org/access/unpaywall.md)

**Semantic Scholar (Ai2)**
- API key introductory limit: 1 request/sec on all endpoints; higher possible after review — [S2 API overview](https://semanticscholar.org/product/api); [S2 tutorial](https://webflow.semanticscholar.org/product/api/tutorial)
- Unauthenticated: shared pool of 1,000 RPS across all unauthenticated users, throttled under heavy load; some endpoints require a key; 429 on rate limit — [S2 API overview](https://semanticscholar.org/product/api)
- Third-party report: rate limiting uneven, returns HTTP 500 as often as 429 (unverified) — [CASRAI guide](https://casrai.org/guides/semantic-scholar-api)

**Crossref**
- New REST API limits effective 1 Dec 2025 (first change since 2013). Polite pool: 10 req/s for single-DOI lookups, 3 req/s for list/query requests, concurrency 3 each — [Crossref blog](https://crossref.org/blog/announcing-changes-to-rest-api-rate-limits/)
- Polite pool = add `mailto=` parameter with valid email; no key needed — [Crossref community: REST API pools](https://community.crossref.org/t/rest-api-pools-which-to-use-and-when/15317)

**Unpaywall**
- Must pass `email=` parameter; asked to keep under 100,000 calls/day; heavier use → download the database snapshot — [Unpaywall API v2](https://unpaywall.org/api/v2)

**PubMed / NCBI E-utilities**
- No key: 3 req/s per IP; with free NCBI API key: 10 req/s (per service: EUtils, Datasets, dbGaP each 10 rps); higher by documented request; key from NCBI account Settings, pass `api_key=` — [NLM support KA-05318](https://support.nlm.nih.gov/knowledgebase/article/KA-05318/en-us); [NCBI Insights 2017](https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities); [E-utilities book](https://www.ncbi.nlm.nih.gov/books/NBK25497/)

**Scopus / Web of Science (paid/institutional)**
- Scopus API key registration free for non-commercial academic/public-sector use, but full Abstract Retrieval (view=FULL) and Author Retrieval require institutional subscription (401 otherwise); institutional token available via Elsevier support — [Elsevier API overview](https://www.elsevier.support/dataasaservice/answer/overview-of-elsevier-apis); [pybliometrics access docs](https://pybliometrics.readthedocs.io/en/latest/access.html); [Harzing PoP: Scopus key](https://harzing.com/resources/publish-or-perish/manual/reference/dialogs/scopus-api-key)
- Web of Science Starter API: one free token per user; ~5,000 requests/day per a third-party integration doc (Pure); Expanded API quota depends on subscription — [Clarivate WoS Starter API](https://developer.clarivate.com/apis/wos-starter); [Clarivate release notes](https://clarivate.com/academia-government/release-notes/wos-apis/release-notes-june-8-2023/); [Pure docs (quota)](https://pure.helpjuice.com/data-sources-and-integrations/web-of-science-and-use-of-quota)

**Thai-relevant: ThaiJO / TCI**
- ThaiJO (Thai Journals Online) = Thailand's central e-journal platform, run by TCI Centre on Open Journal Systems (OJS); download page lists an OAI (OAI-PMH) resource — [ThaiJO About](https://www.tci-thaijo.org/en/pages/about); [ThaiJO download page](https://www.tci-thaijo.org/en/pages/download)
- TCI Centre founded 2001, first national citation centre in Thailand and ASEAN — [MJLIS paper on TCI 10 years](https://ejournal.um.edu.my/index.php/MJLIS/article/view/6639)

### Inferences
- Since ThaiJO runs OJS, each journal likely exposes standard OJS OAI-PMH endpoints (`/index.php/<journal>/oai`) — usable for harvesting Thai literature where OpenAlex/S2 coverage is thin. Verify per-journal.
- With OpenAlex's new budget model, agents should prefer singleton/filter calls (cheap) over search/semantic calls (10–100x cost) and cache results.
- For DOI verification at scale, Crossref single-DOI lookups (10 rps) are the cheapest check; OpenAlex singleton lookups are $0.

### Gaps
- Not verified this session (prior knowledge, re-check): arXiv API asks ≤1 request per 3 seconds, no key (https://info.arxiv.org/help/api/); Europe PMC REST API free, no key (https://europepmc.org/RestfulWebService); CORE API v3 requires free key, tiered limits (https://core.ac.uk/services/api); DBLP free API (https://dblp.org/faq/How+to+use+the+dblp+search+API.html); bioRxiv/medRxiv API at https://api.biorxiv.org (no key); SSRN has no public API; Google Scholar has no API — SerpAPI "Google Scholar API" is a paid scraping workaround (https://serpapi.com/google-scholar-api), ToS risk.
- No public TCI API found; ThaiJO OAI base URL / metadata formats not confirmed.
- Scopus numeric quotas not confirmed (see Elsevier "Default API Key Settings").

## 2. AI literature-review tools (features, pricing, accuracy evidence)

### Takeaway
Evidence is strongest for Elicit (~81% extraction accuracy vs ~87% human, not significantly different) and for OpenScholar (Nature, Feb 2026: GPT-4o fabricated 78–90% of citations; OpenScholar matches experts). Consensus has poor search sensitivity (~40%) in two studies; SciSpace has no independent accuracy studies. Pricing figures mostly come from aggregators and conflict.

### Cited Findings
**Elicit**
- Free Basic: search across 138M+ papers, limited Research Agent, 2 automated reports/month; Pro ≈ $49/user/month (annual), with systematic-review workflow (screen up to ~5,000 papers), 144 reports/yr, API access; Scale ≈ $169/user/mo; Enterprise custom; old Plus ($12)/Team ($79) tiers seem retired; academic pricing lower — aggregator data, conflicting — [CostBench](https://costbench.com/software/ai-research-tools/elicit); [aiproductivity.ai](https://aiproductivity.ai/pricing/elicit/); [fast.io review](https://fast.io/resources/elicit-ai-review-2026/)
- Hilkenmeier et al. 2025 (Research Synthesis Methods): 43 studies, 602 data points; Elicit extraction accuracy 81.4% vs human 86.7% (n.s.); when Elicit and human agreed, 100% correct — [PMC 40102714](https://pmc.ncbi.nlm.nih.gov/articles/pmid/40102714)
- EcoEvoRxiv 2025: repeated Elicit extractions across accounts agreed 90% on values but only 46% on supporting quotes and 30% on reasoning; "complement, not replace" human extractors — [EcoEvoRxiv 9909](https://ecoevorxiv.org/repository/view/9909/)
- Elicit as semi-automated second reviewer evaluation — [RSU publication](https://science.rsu.lv/en/publications/evaluating-the-ai-tool-elicit-as-a-semi-automated-second-reviewer/)
- Vendor claims (95% recall, 97% screening, 96% extraction over 994 Cochrane reviews) are self-reported, not audited — reported via [CASRAI Elicit vs Consensus](https://casrai.org/compare/elicit-vs-consensus)

**Consensus**
- Free / Pro ~$10/mo / Deep ~$45/mo; student plan ~$9/mo; free tier includes 3 Deep Searches/month (aggregator data). Beware a different sales-software product also named "Consensus" — [aiproductivity.ai](https://aiproductivity.ai/pricing/consensus/); [CostBench](https://costbench.com/software/ai-research-tools/consensus/negotiation/)
- Two peer-reviewed studies (Lau & Golder 2025; Lagisz et al. 2026) reportedly found ~39–40% search sensitivity vs traditional searches; no independent study of the "Consensus Meter" (secondary, not verified from the papers) — [CASRAI](https://casrai.org/compare/elicit-vs-consensus)

**SciSpace** — not a dedicated SR screening tool; no independent accuracy studies found — [CASRAI Elicit vs SciSpace](https://casrai.org/compare/elicit-vs-scispace)

**Undermind** — pricing unreliable across aggregators (Free; ~$15–16 per month or per year depending on source) — [CostBench Undermind](https://costbench.com/software/ai-research-tools/undermind/); [neuronfeed](https://neuronfeed.com/compare/undermind-vs-consensus)

**OpenScholar (UW + Ai2)**
- Published in Nature 4 Feb 2026 (Asai, Hajishirzi et al., DOI 10.1038/s41586-025-10072-4); retrieval over 45M open-access papers + self-feedback loop — [Nature Asia press release](https://www.natureasia.com/en/info/press-releases/detail/9228); [The Scientist](https://www.the-scientist.com/openscholar-an-ai-tool-for-scientific-literature-search-outperforms-chatgpt-and-other-llms-74060)
- GPT-4o fabricated 78–90% of citations in their experiments; OpenScholar-8B beats GPT-4o by 6.1% and PaperQA2 by 5.5% correctness on ScholarQABench; citation accuracy on par with human experts; experts preferred OpenScholar-8B over expert answers 51%, OpenScholar-GPT-4o 70%, vs 32% for plain GPT-4o — [Newswise/UW](https://www.newswise.com/articles/in-a-study-ai-model-openscholar-synthesizes-scientific-research-and-cites-sources-as-accurately-as-human-experts); [The Scientist](https://www.the-scientist.com/openscholar-an-ai-tool-for-scientific-literature-search-outperforms-chatgpt-and-other-llms-74060)
- Models, data, datastore, indices, benchmark and demo released openly; authors caution LMs can't fully automate synthesis. Critique: benchmarks compare against now-deprecated models — [Rogue Scholar commentary, May 2026](https://rogue-scholar.org/records/yd37z-emb56)

**Ai2 ScholarQA / Asta / AstaBench**
- Ai2 ScholarQA: free scientific QA app; open-source Python package; paper indexes via public APIs — [Ai2 blog](https://allenai.org/blog/ai2-scholarqa)
- AstaBench (Aug 26 2025): 2,400+ problems across the discovery process; no external commercial research agent could do the full task range, many did well at literature understanding; includes ScholarQA-CS2 — [Ai2 AstaBench blog](https://allenai.org/blog/astabench); [AstaBench](https://allenai.org/asta/bench)

**FutureHouse / Edison Scientific**
- Edison Scientific = commercial spinout of FutureHouse; $70M seed (Dec 2025); Kosmos = persistent code-writing agent that reviews papers/patents; claims 7 discoveries (3 reproductions, 4 novel); successor to Robin agent; free tier + undisclosed paid tiers — [runtimewire](https://runtimewire.com/zh/article/edison-scientific-advances-glyph-open-models); [36kr](https://eu.36kr.com/zh/p/3563808885800065); [neuronfeed](https://neuronfeed.com/compare/edison-scientific-vs-trata-research)
- PaperQA2: FutureHouse's literature retrieval/synthesis system, SOTA on LitQA/PubMedQA (per investor profile) — [impala.digital profile](https://impala.digital/public/profiles/88-3221427/programs)

### Inferences
- Practical consensus from evidence: use AI tools as a second reviewer / first-pass extractor, always with human verification of quotes and reasoning (low reproducibility of justifications).
- Retrieval-grounded systems (OpenScholar, PaperQA, Scholar Gateway) are categorically safer than raw LLM recall for citations.

### Gaps
- Not researched in detail this session: Scite (Smart Citations), ResearchRabbit, Connected Papers, Litmaps, Inciteful, Semantic Scholar Research Feeds, NotebookLM, Perplexity Academic focus, Google AI co-scientist — features/pricing need separate verification. (Prior knowledge: ResearchRabbit, Inciteful, S2 Feeds have free tiers; Connected Papers/Litmaps freemium; NotebookLM is source-grounded on user-uploaded docs; Google AI co-scientist announced Feb 2025 as a Gemini-based multi-agent hypothesis generator with limited access.)
- No official vendor pricing pages fetched; all prices aggregator-sourced.
- No PaperQA3 info found; Asta product launch details not confirmed.

## 3. Citation management & citation verification

### Takeaway
Zotero 8 (Jan 2026) is the recommended hub, with rich MCP integration (54yyyu/zotero-mcp). For hallucinated references, DOI-resolution alone is insufficient — tools must match title/authors against Crossref/OpenAlex/S2; even dedicated tools have known limitations.

### Cited Findings
- Zotero 8 released 22 Jan 2026: unified citation dialog (List/Library modes), note tabs, Linux ARM; releases every 6–10 weeks; drops macOS ≤10.14 and Windows 7/8; plugin developers must adapt to new annotation/full-text APIs — [Zotero blog](https://www.zotero.org/blog/zotero-8/); [heise](https://heise.de/-11153978); [AlternativeTo](https://alternativeto.net/news/2026/1/zotero-8-brings-unified-citation-dialog-improved-reading-note-tabs-and-linux-arm-support)
- CheckIfExist (arXiv 2602.15871): open-source tool checking references against Crossref, Semantic Scholar, OpenAlex; batch BibTeX — [arXiv](https://arxiv.org/abs/2602.15871)
- Badalova & Mayr (arXiv 2607.22693, 2026) evaluate CheckIfExist, HalluCiteChecker, Hallucinator, HalRef, RefChecker: limited by reference extraction errors, incomplete metadata, database coverage gaps, inconsistent results — [arXiv PDF](https://arxiv.org/pdf/2607.22693)
- CiteAudit: 5-agent pipeline, self-reported 97.2% accuracy; reported that GPT-5.2 flags nearly half of legitimate citations as hallucinated — [The Decoder](https://the-decoder.com/?p=32935)
- Citation Guard MCP: verifies DOI via doi.org then compares title with OpenAlex/Crossref metadata — [Glama](https://glama.ai/mcp/servers/n6dyi7grlv)
- citation-verifier skill (jkitchin/skillz, updated 22 Jun 2026): extracts DOI/URL/arXiv/PMID/ISBN, checks Crossref — [skillselion](https://skillselion.com/skills/jkitchin/skillz/citation-verifier)
- check-citations skill (brycewang-stanford): checks Crossref/S2/OpenAlex and flags "chimeric" citations (real title + wrong authors) — [skillselion](https://skillselion.com/skills/brycewang-stanford/awesome-agent-skills-for-empirical-research/check-citations)

### Inferences
- Recommended verification pipeline: (1) extract refs → (2) resolve DOI via Crossref (`mailto=`) → (3) fuzzy-match title + first author + year against returned metadata → (4) fallback OpenAlex/S2 title search for DOI-less refs → (5) human check flagged items. Never trust an LLM alone as the judge (high false positive rate).

### Gaps
- Better BibTeX compatibility with Zotero 8 not confirmed this session (BBT site: https://retorque.re/zotero-better-bibtex/).
- Mendeley, EndNote (incl. EndNote 2025 AI features), JabRef, Paperpile current features/pricing not researched; CSL (https://citationstyles.org) not re-verified. Prior knowledge: Mendeley Desktop retired in favor of Mendeley Reference Manager; JabRef is free/open-source BibTeX-native; Paperpile is Google-Docs-centric paid (~$3/mo academic).

## 4. MCP servers & skills for academia (repos + install)

### Takeaway
A workable Claude Code/Desktop stack: official connectors (PubMed, Wiley Scholar Gateway), plus community MCP servers (arxiv-mcp-server, paper-search-mcp, Semantic Scholar MCPs, Asta MCP, zotero-mcp) and K-Dense Scientific Agent Skills.

### Cited Findings
- Anthropic "Claude for Life Sciences" connectors include PubMed and Wiley's Scholar Gateway (plus Benchling, BioRender, Synapse, 10x Genomics) — [Anthropic news](https://www.anthropic.com/news/claude-for-life-sciences?lang=us)
- Scholar Gateway: Wiley-only content, semantic search tool, peer-reviewed answers with DOI links, requires auth (scholargateway@wiley.com); tutorial cites 300+ life-science journals / 900k+ articles (counts conflict: also "3M+") — [Claude tutorial](https://claude.com/resources/tutorials/using-the-scholar-gateway-connector-in-claude); [Marketplace](https://claude.com/marketplace/connectors/scholar-gateway)
- arxiv-mcp-server (github.com/blazickjp/arxiv-mcp-server): `claude mcp add --transport stdio --scope user arxiv -- uvx arxiv-mcp-server`; or `uv tool install arxiv-mcp-server` (`[pdf]` extra for older PDF-only papers); papers stored in `~/.arxiv-mcp-server/papers` (`--storage-path` / `ARXIV_STORAGE_PATH`); tool count differs by version (4 vs 14 tools) — [Algolia DocSearch mirror](https://docsearch.algolia.com/mcp/docs/repo/blazickjp/arxiv-mcp-server); [mcp.so](https://mcp.so/servers/blazickjp_arxiv-mcp-server); [unikraft guide](https://unikraft.com/docs/guides/mcp-server-arxiv.md)
- paper-search-mcp (github.com/openags/paper-search-mcp, MIT, Python): arXiv, PubMed, bioRxiv, medRxiv, Google Scholar, IACR, Semantic Scholar; optional Sci-Hub source (legal risk) — [mcpservers.org](https://mcpservers.org/en/servers/openags/paper-search-mcp); [Glama](https://glama.ai/mcp/servers/openags/paper-search-mcp)
- Semantic Scholar MCP servers: e.g., zongmin-yu/semantic-scholar-fastmcp-mcp-server, JackKuo666/semanticscholar-MCP-Server; without key → frequent 429s — [Glama zongmin-yu](https://glama.ai/mcp/servers/@zongmin-yu/semantic-scholar-fastmcp-mcp-server/blob/580ed5ab5d51f15d9788e8bc7f56195e0b1558a6/semantic_scholar/utils/http.py); [Glama JackKuo666](https://glama.ai/mcp/servers/@JackKuo666/semanticscholar-MCP-Server)
- Ai2 Asta MCP (secondhand): streamable-HTTP endpoint `https://asta-tools.allen.ai/mcp/v1`, `x-api-key` header, key via form; community wrapper maxwellsdm1867/asta-mcp (Apache-2.0, ASTA_TOKEN) — [asta-skill](https://www.skills.sh/agents365-ai/365-skills/asta-skill); [Glama asta-mcp](https://glama.ai/mcp/servers/maxwellsdm1867/asta-mcp)
- PubMed/Entrez MCP: QuentinCody/entrez-mcp-server — [Glama](https://glama.ai/mcp/servers/@QuentinCody/entrez-mcp-server/blob/14df9e7e66cdd06d96fc131972fc6c94b749fd0a/test-rate-limits.js)
- Unpaywall MCP: dam2452/unpaywall-mcp — [Glama](https://glama.ai/mcp/servers/dam2452/unpaywall-mcp)
- Zotero MCP (github.com/54yyyu/zotero-mcp, MIT, Python): library search, metadata/full-text, PDF annotation extraction, note creation; local API (Zotero 7+, Python 3.10+) or web API; `zotero-mcp setup` auto-configures Claude Desktop; AUR v0.11.0. Naming trap: PyPI package for this fork is `zotero-mcp-server` (`uvx zotero-mcp` installs a different, simpler server) — [mcp.directory guide 2026](https://mcp.directory/blog/zotero-mcp-complete-guide-2026); [AUR](https://aur.archlinux.org/packages/zotero-mcp-server); [LobeHub](https://lobehub.com/ko/mcp/54yyyu-zotero-mcp)
- K-Dense Scientific Agent Skills (formerly claude-scientific-skills), github.com/K-Dense-AI/scientific-agent-skills: ~140–188 skills (count varies by snapshot) across ML, chemistry, materials, physics, bio, lab automation; DB access (PubMed, PubChem, UniProt…) and packages (BioPython, RDKit, Scanpy); install in Claude Code via `/plugin marketplace add K-Dense-AI/claude-scientific-skills` or copy into `~/.claude/skills/`; works with any Agent Skills-compatible agent; K-Dense BYOK desktop co-scientist; user-count claims unverified; avoid forks — [GitHub](https://github.com/k-dense-ai/scientific-agent-skills); [aitoolly Oct 2026](https://aitoolly.com/de/ai-news/article/2026-10-19-k-dense-ai-releases-scientific-agent-skills-library-to-transform-any-ai-agent-into-an-ai-scientist)

### Inferences
- Third-party MCP servers run with local privileges; prefer well-maintained repos, pin versions, and supply your own API keys (S2, NCBI, OpenAlex) to avoid shared-pool throttling.

### Gaps
- No official OpenAlex MCP server confirmed this session (community ones likely exist on Glama/Smithery).
- Did not fetch repo READMEs directly; install commands come from mirrors/directories.

## 5. Systematic review methodology support (PRISMA, ASReview, Rayyan, Covidence)

### Takeaway
ASReview (free, open-source active learning) is the go-to free screening tool; Rayyan is cheap per-seat with AI restricted to institutional plans; Covidence is the paid standard (~$339/review/yr reported). Prices conflict across sources.

### Cited Findings
- Covidence ~$339/year per single review, no monthly plan, free trial capped at 500 records (other sources: $240–420/yr or $149+/mo — conflict) — [CASRAI Covidence guide](https://casrai.org/guides/covidence); [paperguide](https://paperguide.ai/blog/covidence-vs-rayyan/)
- Rayyan: Essential $4.99/seat/mo, Advanced $8.33/seat/mo (annual); free tier 3 reviews, no PRISMA diagram or auto-dedup; ResearchPilot AI on institutional plans only — [AI Agent Index: Rayyan](https://theaiagentindex.com/agents/rayyan); [ponder.ing](https://ponder.ing/blog/rayyan-alternatives)
- ASReview: free, open source, active-learning screening; workload reduction 70–90% reported (unverified); self-hosted, steeper learning curve — [researchgold](https://researchgold.org/blog/best-systematic-review-software-tools); [rework](https://resources.rework.com/tools/ai-tools/best-ai-tools-for-literature-review-2026)
- Elicit Pro includes a systematic-review workflow (screen up to ~5,000 papers) — [CostBench](https://costbench.com/software/ai-research-tools/elicit)

### Inferences
- A defensible AI-assisted SR workflow: register protocol → database searches via APIs (PubMed, OpenAlex, Scopus/WoS) logged for PRISMA → dedupe in Zotero → ASReview/Rayyan screening with dual human review → AI-assisted extraction (Elicit) verified by humans → PRISMA 2020 flow diagram.

### Gaps
- ASReview LAB 2 specifics (released 2025, per prior knowledge) not verified; PRISMA 2020 / PRISMA-trAIce / RAISE guidance on AI use in evidence synthesis not researched this session (prior knowledge: PRISMA 2020 at https://www.prisma-statement.org; Cochrane/Campbell/JBI "RAISE" recommendations on responsible AI in evidence synthesis, 2025 — unverified).
