# Claude Agent Skills, Claude Code plugins, and similar "skill" packages for research (state as of 2026-10-28)

Research method note: about 18 tool calls. GitHub API (`gh`) was blocked in this session, so star counts come from WebFetch snapshots of GitHub pages taken on 2026-10-28. agentskills.io, developers.openai.com and claudeskills.info could not be reached (network allowlist), so claims about them rely on search snippets or on secondary pages, and are marked as such.

## Q1. What official Anthropic skills and features exist for research?

### Takeaway
Anthropic's public `anthropics/skills` repo has **no dedicated research skill**. It holds document, design, dev and meta skills. Anthropic's research tooling comes in four other forms:
- the consumer **Research** feature in claude.ai
- the **multi-agent research architecture** described on the engineering blog
- a **deep-research skill synced into claude.ai/Claude Code** under `anthropic-skills:*`
- the **`bio-research`, `data` and `enterprise-search` plugins** in `anthropics/knowledge-work-plugins`

### Cited Findings
**anthropics/skills (the official repo)**
- Snapshot of 2026-10-28: about 184.3k stars, 21.8k forks, 421 open issues, about 1k PRs, 60 commits on `main` — [anthropics/skills](https://github.com/anthropics/skills)
- The 19 skill folders listed under `skills/` are: academy-guide, algorithmic-art, brand-guidelines, canvas-design, claude-api, discernment-nudge, doc-coauthoring, docx, frontend-design, internal-comms, mcp-builder, pdf, pptx, skill-creator, slack-gif-creator, theme-factory, web-artifacts-builder, webapp-testing, xlsx. None is a research skill. The listing may be incomplete because the page had a "View all files" link — [skills/ tree](https://github.com/anthropics/skills/tree/main/skills)
- The docx, pdf, pptx and xlsx skills are source-available, not open source, and they power Claude's document features. The repo also contains `spec/` (the format spec) and `template/` (a starter skill) — [anthropics/skills](https://github.com/anthropics/skills)
- Install commands:
  - Add the marketplace: `/plugin marketplace add anthropics/skills`
  - Install a skill set: `/plugin install document-skills@anthropic-agent-skills` or `/plugin install example-skills@anthropic-agent-skills`
  - Paid claude.ai plans already include the example skills — [anthropics/skills](https://github.com/anthropics/skills)
- Research-relevant skills in this repo:
  - `skill-creator`: creates and edits skills, runs evals, and benchmarks triggering. It is useful for building your own research skill.
  - `pdf`: reads papers and extracts tables.
  - `xlsx`: data analysis.
  - `doc-coauthoring`
  - Source: [skills/ tree](https://github.com/anthropics/skills/tree/main/skills)

**Claude "Research" feature (claude.ai)**
- Available on paid plans (Pro, Max, Team, Enterprise) on web, Desktop and Mobile. Web search must be on. You enable it with the "+" button and then "Research".
- Claude runs several searches that build on each other, can use connected Google sources (Gmail, Calendar, Docs), and cites its sources — [Claude Help Center: Use research on Claude](https://support.claude.com/en/articles/11088861-using-the-research-feature)
- An advanced mode can research for up to 45 minutes before delivering a cited report. This is per launch coverage; I found no first-party confirmation in this session — [Harvard tagteam feed of launch article](https://tagteam.harvard.edu/hub_feeds/3382/feed_items/13720721/content); see also [claude.com: Claude takes research to new places](https://claude.com/resources/articles/research)
- Sources conflict on plan access. TechRadar said Max, Team or Enterprise only, while the help center says Pro and up. The help center is the more current source — [TechRadar](https://www.techradar.com/computing/artificial-intelligence/i-tried-claudes-new-research-feature-and-its-just-as-good-as-chatgpt-and-google-geminis-deep-research-features)

**Anthropic engineering: "How we built our multi-agent research system" (2025-06-13)**
- Architecture: an orchestrator-worker pattern. The LeadResearcher plans and saves its plan to memory, because context beyond 200k tokens gets truncated. It spawns subagents that search in parallel, each with its own context window. A CitationAgent then places a citation on each claim in the draft — [Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)
- Results and costs:
  - A multi-agent system (Opus 4 lead with Sonnet 4 subagents) beat single-agent Opus 4 by **90.2%** on Anthropic's internal research eval.
  - On BrowseComp, token usage explained about 80% of performance variance, and about 95% together with tool-call count and model choice.
  - Agents use about **4x** the tokens of chat. Multi-agent systems use about **15x**.
  - Parallelism cut research time by up to 90% — [Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)
- Prompting principles from the post:
  - simulate agents with the exact prompts and tools
  - give the orchestrator detailed delegation (objective, output format, tools, boundaries)
  - scale effort to query complexity
  - use distinct, well-described tools
  - let Claude rewrite tool descriptions, which cut task time by 40%
  - search broad first, then narrow
  - use extended or interleaved thinking
  - run calls in parallel
  - Source: [Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)
- Evaluation approach:
  - An LLM judge scores each output 0.0–1.0 plus pass/fail. The rubric covers factual accuracy, citation accuracy, completeness, source quality and tool efficiency.
  - Start with about 20 queries.
  - Human testers caught agents favouring SEO content farms over authoritative sources.
  - Judge the end state, not the path — [Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)

**Anthropic engineering: "Equipping agents for the real world with Agent Skills" (2025-10-16; updated 2025-12-18)**
- A skill is "organized folders of instructions, scripts, and resources that agents can discover and load dynamically."
- At launch, skills were supported in Claude.ai, Claude Code, the Agent SDK and the Developer Platform.
- On 2025-12-18 Agent Skills were published as an **open standard** at agentskills.io — [Anthropic Engineering](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

**anthropics/knowledge-work-plugins (official plugin marketplace for knowledge work and Cowork)**
- About 33.4k stars — [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins)
- Research-relevant plugins:
  - `bio-research`: literature search, genomics analysis and target prioritization. Connectors: PubMed, BioRender, bioRxiv, ClinicalTrials.gov, ChEMBL, Synapse, Wiley, Owkin, Open Targets, Benchling.
  - `data`: SQL, statistics and dashboards. Connectors: Snowflake, Databricks, BigQuery, Definite, Hex, Amplitude, Jira.
  - `enterprise-search`: Slack, Notion, Guru, Jira, Asana, Microsoft 365.
  - Source: [knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins)
- Install:
  - Add the marketplace: `claude plugin marketplace add anthropics/knowledge-work-plugins`
  - Install a plugin: `claude plugin install bio-research@knowledge-work-plugins` (same pattern for `data@…` and `enterprise-search@…`)
  - Cowork users install from claude.com/plugins.
  - Connectors live in each plugin's `.mcp.json` — [knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins)

**anthropics/claude-plugins-official (the official Claude Code plugin directory)**
- About 45.0k stars. Install with `/plugin install {plugin-name}@claude-plugins-official` or browse with `/plugin > Discover`.
- The page warns that Anthropic does not control what third-party plugins include — [claude-plugins-official](https://github.com/anthropics/claude-plugins-official)

**Claude Developer Platform skill authoring docs**
- `name`: at most 64 characters; lowercase letters, numbers and hyphens only; no XML tags; must not contain "anthropic" or "claude".
- `description`: non-empty, at most 1,024 characters, no XML tags — [platform.claude.com best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

### Inferences
- **Synced deep-research skill.** This session lists a skill named `anthropic-skills:deep-research`, synced from claude.ai. Its description reads roughly "research a topic across multiple sources … synthesize into a comprehensive narrative report … coordinates research subagents". Its bundled file `references/researcher.md` tells each subagent to:
  - use about 10–15 tool calls
  - write short queries
  - prefer primary sources
  - cite every claim inline
  - record gaps instead of fabricating
  - This is a direct observation of a local file, not public documentation. It suggests Anthropic ships its own deep-research skill to claude.ai or Cowork users as a synced or org skill, not through the public GitHub repo. I could not find a public URL for it, so treat it as unverified publicly.
- **Claude Code docs example.** The Claude Code skills docs use a skill named `deep-research` as their `context: fork` / `agent: Explore` example, but that example researches a codebase, not the web — [code.claude.com skills](https://code.claude.com/docs/en/skills)
- **Plugins vs. skills.** Anthropic's research capability is heavily connector-driven: plugins bundle MCP connectors such as PubMed and ChEMBL. Skills alone only add instructions.

### Gaps
- I could not confirm a first-party "deep-research" plugin in `anthropics/claude-plugins-community`. One search snippet mentioned it (Haiku scouts, Sonnet specialists, an Opus synthesizer, Agent Teams), but its listing site, claudeskills.info, was unreachable and a targeted search found nothing. Treat it as unverified.
- I did not check last-commit dates for the anthropics repos (gh API blocked).

## Q2. Which community skill collections are strongest for research?

### Takeaway
The strongest collections are:
- **K-Dense-AI's Scientific Agent Skills** (renamed from claude-scientific-skills; about 55k stars, 177 skills) for science and literature work
- **Imbad0202/academic-research-skills** (about 54k stars as shown) for the full academic pipeline with citation integrity gates
- **obra/superpowers** (about 306k stars) for general method skills such as brainstorming, planning and verification, but it has no research skill

Aggregator "awesome" lists and registries are useful for discovery, but their quality varies.

### Cited Findings
**K-Dense-AI/scientific-agent-skills** (formerly `claude-scientific-skills`; the old URL redirects)
- Snapshot: about 55.0k stars, 4.8k forks, **177 "ready-to-use validated skills"**, MIT license at repo level with per-skill licences in SKILL.md metadata. Release 2.72.0 removed the bundled docx, pdf, pptx and xlsx skills — [K-Dense-AI/claude-scientific-skills](https://github.com/K-Dense-AI/claude-scientific-skills)
- Categories (counts overlap):
  - Bioinformatics 32, Data Analysis & Viz 18, Scientific Communication 23, ML/AI 14
  - Research Methodology & Planning 13, Scientific Databases 13, Clinical Research & Evidence 8, and more — [same](https://github.com/K-Dense-AI/claude-scientific-skills)
- Named research skills:
  - Literature: **Literature Review**, **Paper Lookup** (PubMed, PMC, bioRxiv, medRxiv, arXiv, OpenAlex, Crossref, Semantic Scholar, CORE, Unpaywall), Paperzilla, Paperclip (full-text corpus), BGPT Paper Search, Research Lookup, **Parallel Web**, **Exa Search**
  - Writing: **Scientific Writing** (evidence-traceable), local peer review
  - Ideas: **Hypothesis Generation**, Scientific Brainstorming, HypoGeniC/HypoRefine
  - Data: **Database Lookup** (80 databases), DepMap, PrimeKG, BioServices, Biopython, gget, and more — [same](https://github.com/K-Dense-AI/claude-scientific-skills)
- Install:
  - All skills: `npx skills add K-Dense-AI/scientific-agent-skills`
  - Via GitHub CLI: `gh skill install K-Dense-AI/scientific-agent-skills`, optionally `--pin v2.71.0`
  - Cursor: `ln -s "$(pwd)" ~/.cursor/plugins/local/scientific-agent-skills`
  - Codex: `codex plugins install .`
  - Manual: `git clone https://github.com/K-Dense-AI/scientific-agent-skills.git ~/.agents/skills/scientific-agent-skills`
  - Hermes: `hermes skills tap add K-Dense-AI/scientific-agent-skills`
  - Repo tooling needs Python 3.13+ and `uv`. Per-skill dependencies are not installed automatically — check each skill's `compatibility` field — [same](https://github.com/K-Dense-AI/claude-scientific-skills)
- A directory page gives a single-skill install: `npx skills add K-Dense-AI/claude-scientific-skills --skill literature-review`. It describes that skill as covering discovery, screening, synthesis and citation management for systematic or scoping reviews — [vibeindex](https://www.vibeindex.ai/skills/k-dense-ai/claude-scientific-skills/literature-review); [mcp.directory guide](https://mcp.directory/blog/claude-literature-review-skill-guide)

**Imbad0202/academic-research-skills**
- Snapshot: about 54.2k stars, 4.1k forks; latest release **v3.24.0 on 2026-10-27**, so it is actively maintained. The star count looks high for a niche repo, but it is what the page showed — [academic-research-skills](https://github.com/imbad0202/academic-research-skills)
- Skills:
  - `deep-research`: 8 modes, including socratic, systematic-review and fact-check
  - `academic-paper`: 11 modes, including citation-check and revision
  - `academic-paper-reviewer`: 6 modes
  - `academic-pipeline`: a 10-stage orchestrator with a user checkpoint at each stage and integrity gates at Stages 2.5 and 4.5
  - `sr-screener`: screening for systematic, scoping and rapid reviews
- Citation integrity features:
  - Semantic Scholar verification (v3.3)
  - a deterministic four-index citation gate (v3.11)
  - locator anchors on every citation (v3.7.3)
  - an opt-in claim audit, `ARS_CLAIM_AUDIT=1` (v3.8)
  - live lookup of reviewer-suggested references (v3.24) — [same](https://github.com/imbad0202/academic-research-skills)
- Install:
  - Add the marketplace: `/plugin marketplace add Imbad0202/academic-research-skills`
  - Install: `/plugin install academic-research-skills`
  - Pi: `pi install git:github.com/Imbad0202/academic-research-skills`
  - Needs `ANTHROPIC_API_KEY`. Pandoc and tectonic are optional, for DOCX and APA PDF output — [same](https://github.com/imbad0202/academic-research-skills)

**obra/superpowers**
- Snapshot: about 306.4k stars and 27.3k forks. There is no dedicated research skill. Method skills that transfer to research:
  - `brainstorming`
  - `writing-plans`
  - `verification-before-completion`
  - `systematic-debugging`
  - `requesting-code-review` and `receiving-code-review`
  - `diagnosing-superpowers` — [obra/superpowers](https://github.com/obra/superpowers)
- Install:
  - Claude Code: `/plugin install superpowers@claude-plugins-official`
  - Gemini CLI: `gemini extensions install https://github.com/obra/superpowers`
  - Cursor: `/add-plugin superpowers`
  - Codex CLI: `/plugins`, then search "superpowers"
  - Copilot CLI: `copilot plugin marketplace add obra/superpowers-marketplace`
  - Qwen Code: `qwen extensions install obra/superpowers`
  - Also supported: Antigravity, Devin, Factory Droid, Grok Build, Kimi, OpenCode, Pi, Hermes, Muse — [same](https://github.com/obra/superpowers)

**Other lists and registries (discovery only)**
- **brycewang-stanford/Awesome-Agent-Skills-for-Empirical-Research**: contains a paper-review group of 8 peer-review skills, for example `skills/43-wentorai-research-plugins/skills/research/paper-review/SKILL.md` — [openskillindex](https://openskillindex.com/skills/brycewang-stanford-awesome-agent-skills-for-empirical-research-paper-review-skil)
- **affaan-m/everything-claude-code**: includes a `literature-review` skill, installed with `npx -y skills add affaan-m/everything-claude-code --skill literature-review --agent claude-code` — [claudemarketplaces](https://claudemarketplaces.com/skills/affaan-m/everything-claude-code/literature-review)
- **The claudskills.com registry**: lists `literature-review` (PubMed, arXiv, bioRxiv, Semantic Scholar), `conducting-literature-reviews-systematic` (PRISMA), and discipline-specific variants — [claudskills.com](https://claudskills.com/skills/conducting-literature-reviews-systematic/)

### Inferences
- **For science and medicine:** K-Dense, plus the Anthropic `bio-research` plugin for connectors.
- **For a humanities or social-science thesis pipeline:** Imbad0202.
- **For general web research:** one of the deep-research skills in Q3, plus superpowers' verification discipline.
- **Star-count caveat.** Counts in late 2026 look inflated across the ecosystem (for example superpowers at about 306k), possibly from bots or star farming. Use release cadence and issue activity as maturity signals, not stars alone.

### Gaps
- I could not open the individual SKILL.md files of the K-Dense literature-review or Paper Lookup skills to confirm which MCPs or APIs they call; the summaries are from the README and directories.
- I did not verify the brycewang-stanford repo URL, star count or the claudskills.com authors directly.

## Q3. Which Claude Code plugins, subagents and slash commands exist for research workflows?

### Takeaway
Several open-source deep-research skills and plugins implement Anthropic's orchestrator-worker pattern inside Claude Code: parallel subagents through the Task/Agent tool or Agent Teams, structured evidence files, and adversarial or verification passes. Maturity ranges from about 2.4k stars (Weizhena) down to toy repos with single-digit stars.

### Cited Findings
**Weizhena/Deep-Research-skills**
- About 2.4k stars, 49 commits, MIT. Supports Claude Code, OpenCode and Codex, with a human-in-the-loop two-phase flow: outline first, then investigation — [Weizhena/Deep-Research-skills](https://github.com/Weizhena/Deep-Research-skills)
- Commands: `/research` (outline of items and fields), `/research-add-items`, `/research-add-fields`, `/research-deep` (parallel agents per item), `/research-report` (JSON results to markdown) — [same](https://github.com/Weizhena/Deep-Research-skills)
- Install for Claude Code: copy `skills/research-en/*` (or `research-zh`) into `~/.claude/skills/`, then copy `agents/web-search-agent.md` and `agents/web-search-modules` into `~/.claude/agents/`, then `pip install pyyaml` — [same](https://github.com/Weizhena/Deep-Research-skills)
- Install for Codex: copy `skills/research-codex-en/*` into `~/.codex/skills/`, copy `agents-codex/web-researcher.toml` into `~/.codex/agents/`, then run `scripts/install-codex.sh`, which enables the `multi_agent` flag — [same](https://github.com/Weizhena/Deep-Research-skills)
- OpenCode needs `OPENCODE_ENABLE_EXA=1` for search — [same](https://github.com/Weizhena/Deep-Research-skills)

**Defiect/deep-research-plugin** (an immature reference design: 2 stars, 1 commit)
- Agents: `dr-lead` (Opus; orchestrates and runs adversarial review), `dr-scout` (Sonnet; wide-pass discovery), `dr-analyst` (Opus; deep reading, claim extraction, triangulation), `dr-writer` (Opus; synthesis) — [Defiect/deep-research-plugin](https://github.com/Defiect/deep-research-plugin)
- Commands: `/deep-research:run`, `:status`, `:report`, `:init` — [same](https://github.com/Defiect/deep-research-plugin)
- Quality-gate hooks: `TaskCompleted` (blocks completion without required artifacts), `TeammateIdle`, `PreCompact` (snapshots run state) — [same](https://github.com/Defiect/deep-research-plugin)
- Seven-stage pipeline: Intake/Plan, Wide-Pass Discovery, Deep Analysis, Triangulation, Synthesis, Adversarial Review, Audit/Report. Evidence is tracked in `evidence.jsonl` (supports/contradicts edges) and `audit.json` — [same](https://github.com/Defiect/deep-research-plugin)
- Install and dependencies:
  - Run with `claude --plugin-dir /path/to/deep-research-plugin`.
  - Requires Claude Code v2.1.32+ and Python 3.10+.
  - Parallelism needs `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
  - Optional MCPs: Brave, Tavily or Google Custom Search for search; Semantic Scholar and CrossRef for academic metadata — [same](https://github.com/Defiect/deep-research-plugin)

**Other repos found by search (not opened; descriptions from search results)**
- **tonyazhuuki/deep-research-skill**: a three-cycle adversarial ensemble with hypothesis-driven search, domain-specific quality gates and evidence grades. Claims about $3–15 per session and 300–800-line outputs. Supports Claude Code and Codex — [tonyazhuuki/deep-research-skill](https://github.com/tonyazhuuki/deep-research-skill)
- **mikhin/agent-skills**: includes `multi-agent-deep-research` (four researchers feed one report) plus cross-model review and adversarial consensus skills. Installable as a plugin — [mikhin/agent-skills](https://github.com/mikhin/agent-skills)
- **altmbr/claude-research-skill**: a single-file `/research` orchestrator. It splits a question into parallel workstreams using the Task tool, monitors them and synthesizes the results. You copy it into your commands directory — [altmbr/claude-research-skill](https://github.com/altmbr/claude-research-skill)
- **24601/agent-deep-research**: a deep-research CLI plus skill backed by the **Gemini Interactions API** (Gemini Deep Research). Features include local-file RAG grounding, a `--dry-run` cost estimate and adaptive polling. Claims to work with Claude Code, Amp, Codex and 30+ agents — [24601/agent-deep-research](https://github.com/24601/agent-deep-research)
- **Imbad0202 `deep-research` skill**: has fact-check and systematic-review modes and runs Semantic Scholar citation verification (see Q2) — [academic-research-skills](https://github.com/imbad0202/academic-research-skills)

**Building blocks in Claude Code**
- **Subagent files** are Markdown with YAML frontmatter, stored in `.claude/agents/` (project), `~/.claude/agents/` (user) or a plugin's `agents/`. Only `name` and `description` are required — [code.claude.com sub-agents](https://code.claude.com/docs/en/sub-agents)
- **Optional subagent fields:** `tools`, `disallowedTools`, `model` (sonnet, opus, haiku, fable, a full model ID or inherit), `skills` (preloaded), `mcpServers`, `hooks`, `permissionMode`, `maxTurns`, `memory`, `effort`, `isolation: worktree`, `background` — [same](https://code.claude.com/docs/en/sub-agents)
- **Nesting:** subagents can spawn subagents up to 3 layers deep by default. `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` changes the limit — [same](https://code.claude.com/docs/en/sub-agents)
- **Plugin layout:** `.claude-plugin/plugin.json` (manifest), `.mcp.json` (connectors), `commands/`, `skills/` and `agents/` — [knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins)

### Inferences
- The most solid choices for Claude Code users are:
  - **Weizhena** for structured, table-like comparative research across many items
  - **Imbad0202** for academic work that needs citation gates
  - the built-in or synced **`deep-research`** skill on claude.ai and Cowork
  - The Defiect, tonyazhuuki and mikhin repos are mainly design references.
- Every web deep-research skill depends on a search tool. In Claude Code that is the built-in WebSearch/WebFetch or an MCP such as Exa, Tavily, Brave, Firecrawl or Parallel. In Codex it is a separate search configuration, and in OpenCode it is Exa.

### Gaps
- I did not verify star counts or last-update dates for tonyazhuuki, mikhin, altmbr or 24601.
- I found no well-known, dedicated, standalone "citation verification" plugin. Citation checking lives inside Imbad0202 and inside Anthropic's CitationAgent pattern.

## Q4. Do equivalent formats exist in other ecosystems, and are skills portable?

### Takeaway
Yes, largely. Since Agent Skills became an open standard (2025-12-18), the SKILL.md-folder format is natively supported by OpenAI Codex, Gemini CLI, Cursor (via plugins), OpenCode, Copilot CLI and others. A plain skill with only `name` and `description` frontmatter plus markdown and scripts is portable. Subagent definitions, hooks, Claude-only frontmatter fields (such as `context: fork`) and plugin manifests are **not** portable; each tool has its own.

### Cited Findings
- **The open standard:** Agent Skills were released as an open standard for cross-platform portability (agentskills.io) on 2025-12-18 — [Anthropic Engineering](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- **Spec fields:** the packaging spec for claude.ai and the Skills API allows only six frontmatter fields: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. Other fields fail packaging there. Claude Code accepts extra fields (`context`, `agent`, `model`, `hooks`, `paths` and others) — [code.claude.com skills](https://code.claude.com/docs/en/skills)
- **OpenAI Codex**
  - Skills are folders with SKILL.md (`name` and `description` required) and optional `scripts/`, `references/`, `assets/`, plus `agents/openai.yaml` for UI metadata and dependencies.
  - Progressive disclosure: Codex sees each skill's name, description and path, and loads the full SKILL.md only when it uses the skill.
  - Invoke with `/skills` or `$skill-name`, or let Codex pick implicitly. Plugins are the installable unit — [OpenAI Codex docs: Agent Skills](https://developers.openai.com/codex/skills) (page unreachable from this session; facts from the search snippet)
  - Default location is `$CODEX_HOME/skills`, falling back to `~/.codex/skills`. `policy.allow_implicit_invocation: false` disables implicit selection — [aiweekly (secondary)](https://aiweekly.co/alerts/openai-codex-ships-skill-creator-sample-for-reusable-agent-instructions)
  - Codex subagents use TOML files in `~/.codex/agents/`, for example `web-researcher.toml`, with a `multi_agent` feature flag in `~/.codex/config.toml` — [Weizhena](https://github.com/Weizhena/Deep-Research-skills)
- **Gemini CLI**
  - Supports SKILL.md skills under the open standard, activated through an `activate_skill` tool.
  - Discovery locations: built-in, extension `skills/`, `~/.gemini/skills/` or `~/.agents/skills/`, and workspace `.gemini/skills/` or `.agents/skills/`.
  - Install with `gemini skills install <repo|path> [--scope workspace]` and list with `/skills list`.
  - Extensions can bundle skills — [Mintlify mirror of Gemini CLI docs](https://www.mintlify.com/google-gemini/gemini-cli/advanced/skills); [writing extensions](https://www.mintlify.com/google-gemini/gemini-cli/extensions/writing-extensions) (third-party mirror; check against Google's docs)
  - Extensions install with `gemini extensions install <github-url>` — [obra/superpowers](https://github.com/obra/superpowers)
- **Cursor:** loads skill collections as plugins, either through a local symlink in `~/.cursor/plugins/local/` or with `/add-plugin` — [K-Dense](https://github.com/K-Dense-AI/claude-scientific-skills); [superpowers](https://github.com/obra/superpowers)
- **Cross-agent installer:** the `npx skills add <owner/repo> [--skill X] [--agent claude-code]` CLI and `gh skill install` appear as cross-agent installers — [K-Dense](https://github.com/K-Dense-AI/claude-scientific-skills); [claudemarketplaces](https://claudemarketplaces.com/skills/affaan-m/everything-claude-code/literature-review)
- **Portability in practice:**
  - superpowers ships one repo to 16 agents (Claude Code, Codex, Cursor, Gemini CLI, Copilot CLI, OpenCode, Qwen, Kimi, Grok Build and others) — [obra/superpowers](https://github.com/obra/superpowers)
  - Weizhena keeps separate Claude, OpenCode and Codex variants of the same skill, because the subagent formats differ — [Weizhena](https://github.com/Weizhena/Deep-Research-skills)
  - The shared `~/.agents/skills/` path is used by both K-Dense's manual install and Gemini CLI — [K-Dense](https://github.com/K-Dense-AI/claude-scientific-skills); [Mintlify Gemini CLI](https://www.mintlify.com/google-gemini/gemini-cli/advanced/skills)
- **Bridge for older Gemini CLI setups:** the community `gemini-cli-skillz` extension loads Anthropic-style skills through an MCP server — [search result: intellectronica/skillz](https://docsearch.algolia.com/mcp/docs/repo/intellectronica/skillz)

### Inferences
- **For maximum portability:**
  - put the skill in `~/.agents/skills/<name>/` or the repo's `.agents/skills/`
  - use only the six spec fields
  - make scripts self-contained (Python or bash)
  - refer to tools generically ("use your web search tool") instead of Claude-only names such as `WebSearch` or `Agent`
  - keep subagent definitions as optional, per-platform adapters
- **AGENTS.md and Cursor rules are older formats.** AGENTS.md is the always-on project instruction file for Codex and others, like CLAUDE.md. Cursor rules (`.cursor/rules/*.mdc`) are always-on or glob-scoped rules. Neither has progressive disclosure, so for on-demand research procedures they are mostly superseded by skills. This comes from general knowledge and was not re-verified this session.

### Gaps
- agentskills.io and developers.openai.com could not be fetched (network allowlist), so I could not verify the exact spec text, the list of adopters, or the `skills-ref` validator.
- I did not verify Cursor's native SKILL.md support (as opposed to plugin loading) from Cursor's own docs.

## Q5. Best practices for writing a research skill, with an example skeleton

### Takeaway
Combine Anthropic's skill-authoring rules (a concise SKILL.md under 500 lines, a description that says what and when, references one level deep, scripts for deterministic steps, evals first) with the multi-agent research lessons:
- an orchestrator that writes a plan
- parallel subagents with explicit objectives, boundaries and output formats
- effort scaled to complexity
- an inline-citation rule
- a separate verification or citation pass
- a strict output template

### Cited Findings
**Authoring rules**
- Keep `SKILL.md` under 500 lines and move detail into referenced files. Keep references one level deep, and give files over 100 lines a table of contents — [platform.claude.com best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- Write descriptions in the third person, include both what the skill does and when to use it, and add specific trigger terms. Gerund names (such as `researching-topics`) are recommended — [same](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- In Claude Code, `description` plus `when_to_use` is truncated at 1,536 characters in the skill listing, so put the key use case first — [code.claude.com skills](https://code.claude.com/docs/en/skills)
- The docs give a ready-made **"Research synthesis workflow" checklist**:
  1. Read all sources
  2. Identify themes
  3. Cross-reference claims
  4. Write a structured summary
  5. Verify citations, looping back to step 3 if incomplete
  - Source: [same](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- Use **feedback loops** (validate, fix, repeat), a **plan-validate-execute** flow with intermediate verifiable files, **templates** (strict or flexible), and **fully qualified MCP tool names** (`Server:tool`) — [same](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- **Build evals first:** at least three scenarios, a baseline without the skill, and tests on Haiku, Sonnet and Opus. Iterate with a "Claude A" that writes the skill and a "Claude B" that tests it — [same](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- **Avoid time-sensitive information**; put deprecated material in an "old patterns" section — [same](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

**Claude Code mechanics**
- `context: fork` with `agent: <type>` runs the skill in a forked subagent. `allowed-tools` pre-approves tools. `` !`cmd` `` injects shell output. `$ARGUMENTS` and `$0` substitute arguments. `disable-model-invocation: true` makes the skill slash-only — [code.claude.com skills](https://code.claude.com/docs/en/skills)

**Research-specific lessons**
- Scale effort to the query (a simple fact needs one agent; complex queries need many). Give each subagent an objective, output format, tools and boundaries. Search broad first, then narrow. Run work in parallel. Use a dedicated citation step. Watch for SEO-farm sources. Grade with an LLM judge on factual accuracy, citation accuracy, completeness, source quality and tool efficiency — [Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)
- Community designs add:
  - evidence graphs with supports/contradicts edges, triangulation, adversarial review and hooks that block completion without artifacts — [Defiect](https://github.com/Defiect/deep-research-plugin)
  - human checkpoints and deterministic citation-existence gates against Semantic Scholar and other indexes — [Imbad0202](https://github.com/imbad0202/academic-research-skills)
  - an outline-then-fields JSON schema so per-item results stay comparable — [Weizhena](https://github.com/Weizhena/Deep-Research-skills)
- **Security:** install skills only from trusted sources. Audit scripts, dependencies and any instructions that reach external network sources, because malicious skills can exfiltrate data — [Anthropic Engineering](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills); [claude-plugins-official](https://github.com/anthropics/claude-plugins-official)

### Concrete example skeleton (synthesised from the sources above; not copied from any repo)

```text
web-research/
├── SKILL.md                     # orchestrator instructions (<500 lines)
├── references/
│   ├── researcher.md            # brief given to every subagent
│   ├── source-quality.md        # source tiers: primary > peer-reviewed > reputable press > blogs; red flags
│   └── report-template.md       # strict output template
├── scripts/
│   ├── check_citations.py       # every claim line has a [Source](URL); URLs resolve (HTTP 200)
│   └── dedupe_sources.py
└── agents/ (optional, Claude Code only)
    └── web-researcher.md        # subagent: tools WebSearch, WebFetch, Write; model sonnet
```

```markdown
---
name: researching-the-web
description: Runs multi-source web or literature research and writes a cited report. Use when the user asks to research, compare options, review literature, fact-check claims, or produce a report with sources.
license: MIT
compatibility: Needs a web search and fetch tool; subagent tool optional. Python 3.10+ for scripts.
allowed-tools: WebSearch WebFetch Read Write Bash(python3 *)
---

# Web research

## 1. Scope (scale effort)
- Simple fact: answer directly with 1–3 searches; no subagents.
- Comparison or multi-facet question: 3–5 subagents, one per facet.
- Broad review: 5–10 subagents; save the plan to `research/plan.md` first.

## 2. Plan
Write `research/plan.md`: the question, sub-questions, and for each subagent the objective, key questions, boundaries (what NOT to cover), and output path `research/notes/<facet>.md`.

## 3. Delegate (in parallel)
Give each subagent the contents of [references/researcher.md](references/researcher.md) plus its brief. Each one:
- starts with short, broad queries, then narrows down
- stops after about 15 tool calls
- prefers primary sources (see [references/source-quality.md](references/source-quality.md))
- writes every claim as `claim — [Source](URL)`; anything it cannot source goes under "Gaps"

## 4. Verify
Run `python3 scripts/check_citations.py research/notes/` and fix every flagged line.
For each key claim, confirm at least 2 independent sources, or mark it "single-source".
Record contradictions explicitly; never silently pick one side.

## 5. Write
Follow [references/report-template.md](references/report-template.md) exactly:
Executive summary → Findings by sub-question (inline citations) → Conflicts and uncertainty → Gaps → Source list (with access date).

## Checklist (copy and tick)
- [ ] plan saved  - [ ] notes done for each facet  - [ ] citation check passes  - [ ] contradictions noted  - [ ] report follows template
```

Example `agents/web-researcher.md` (Claude Code subagent; field names from the sub-agents docs):

```markdown
---
name: web-researcher
description: Researches one assigned facet of a question on the web and writes cited notes. Use when the research orchestrator delegates a facet.
tools: WebSearch, WebFetch, Write
model: sonnet
maxTurns: 30
---
You research only your assigned facet. Follow the brief you are given. Cite every claim inline, prefer primary sources, and list gaps instead of guessing.
```

Install the skeleton:
- Claude Code: copy the folder into `~/.claude/skills/` or the project's `.claude/skills/`.
- Codex: `~/.codex/skills/`.
- Gemini CLI or a shared location: `~/.agents/skills/`.
- Run it automatically from the description match, or with `/researching-the-web <topic>` in Claude Code or `$researching-the-web` in Codex.
- For Claude Code only, you can add `context: fork` to isolate the run.
- Path sources: [code.claude.com skills](https://code.claude.com/docs/en/skills); [Codex skills](https://developers.openai.com/codex/skills); [Gemini CLI skills (mirror)](https://www.mintlify.com/google-gemini/gemini-cli/advanced/skills)

### Inferences
- The highest-leverage parts of a research skill:
  - an explicit effort-scaling rule
  - a per-subagent brief template
  - a deterministic citation checker script, because LLM self-checks miss fabricated URLs
  - a strict report template
  - Keeping the subagent brief in `references/` lets the skill stay portable even where the subagent mechanism differs.
- `allowed-tools` with the space-separated, `Bash(...)` pattern syntax is a Claude Code convention; other agents may ignore it.

### Gaps
- I found no published benchmark comparing community deep-research skills against each other or against the claude.ai Research feature.
- I could not confirm whether the open spec allows `allowed-tools` as a space-delimited string or a list for every agent.
