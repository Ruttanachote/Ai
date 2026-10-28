# Search APIs, Scraping/Crawling Tools, and Research MCP Servers for AI Agents (as of 2026-10-28)

Method note: In this session, direct fetches to vendor sites (exa.ai, tavily.com, brave.com, and others) were blocked by the sandbox network allow-list. Only platform.claude.com could be fetched in full. Every other figure comes from WebSearch result summaries, mostly from third-party comparison blogs, and many of those are written by competing vendors such as Parallel, Keiro, Serpex, Firecrawl, You.com, and Bright Data. Treat all third-party prices as "reported, verify on the vendor page." Where a summary said a figure came from an official page (Tavily docs, Kagi pricing page, You.com announcement), that is noted. Price dates are given where sources stated them.

## 1. Search APIs for LLMs: pricing per 1k queries, free tiers, features, status

### Takeaway
Most LLM-oriented search APIs list at $5–$12 per 1k queries. Exa is about $7, Tavily about $8 pay-as-you-go, Brave $5, You.com $5, Linkup about $5, Kagi $12, and Perplexity Sonar $5–12 plus tokens. Serper ($0.30–1) and Parallel's Fast tier ($1) are the cheap SERP-style options. Microsoft retired the Bing Search API on 2025-08-11. Google's Custom Search JSON API is closed to new customers and shuts down 2027-01-01. Brave dropped its no-card free tier in early 2026 and replaced it with a $5/month credit.

### Cited Findings
**Exa (neural/embedding search; Instant/Fast/Auto/Deep modes; contents, answer, and research endpoints; date and domain filters)**
- Standard search is about $7 per 1k requests for up to 10 results, plus $1 per 1k for each result beyond 10. One source cited Exa's pricing page on 2026-09-26. The base price reportedly rose from $5 to $7 between 2025 and 2026 — [Keirolabs](https://keirolabs.cloud/blog/exa-api-pricing-2026); [fastcrw](https://fastcrw.com/blog/exa-pricing-explained)
- Instant tier is reportedly $4 per 1k. Answer is about $5 per 1k. Deep Search is about $12 per 1k (deep-lite and deep), and deep-reasoning is $15 per 1k. Contents extraction is about $1 per 1k pages per content type — [Keirolabs pricing breakdown](https://keirolabs.cloud/blogs/comparisons/exa-search-api-pricing-per-1000-requests-2026); [fastcrw comparison](https://fastcrw.com/blog/web-search-api-pricing-2026)
- Free tier reports conflict: "$10 free credits/month" versus "$20 at signup + $10/month" — [slicey.ai](https://slicey.ai/tools/exa); [hokai.io](https://hokai.io/hub/tools/exa)

**Tavily (built for agents; search, extract, crawl, map, and research endpoints)**
- Official docs: the free "Researcher" plan gives 1,000 credits per month with no card required. Pay-as-you-go is $0.008 per credit, and monthly plans run $0.0075 down to $0.005 per credit. The first paid plan, "Project," is $30 for 4,000 credits — [Tavily docs: API credits](https://docs.tavily.com/documentation/api-credits.md); [Tavily guide](https://docs.tavily.com/guides/api-credits)
- A basic search costs 1 credit (about $8 per 1k on pay-as-you-go) and an advanced search costs 2 credits. One Research call can use 4–250 credits — [Parallel article (competitor)](https://parallel.ai/articles/tavily-alternatives); [ColdIQ](https://coldiq.com/blog/tavily-pricing)
- A Parallel article claims Nebius acquired Tavily in 2026. This is unconfirmed and comes from a competitor — [Parallel](https://parallel.ai/articles/tavily-alternatives.md)

**Brave Search API (independent index; web, news, image, video, LLM Context, and Answers endpoints)**
- In February 2026 Brave removed the free tier it had offered since May 2023. All developers moved to metered billing at $5 per 1k requests, with a $5 monthly credit (about 1,000 requests). A card is required, and the free credit reportedly requires attribution to Brave — [implicator.ai](https://www.implicator.ai/brave-drops-free-search-api-tier-puts-all-developers-on-metered-billing/); [apiserpent](https://apiserpent.com/blog/free-brave-search-api); [Brave pricing docs](https://api-dashboard.search.brave.com/documentation/pricing)
- Legacy subscriptions such as the old free plan (2,000 queries/month) stay valid but do not get the LLM Context endpoint or higher rate limits. Answers costs $4 per 1k queries plus $5 per 1M input tokens and $5 per 1M output tokens — [Claude Market blog](https://claudemarket.ai/blog/brave-search-api-openclaw-guide); [Brave plans page](https://api-dashboard.search.brave.com/app/plans?tab=normal)

**Serper (Google SERP JSON)**
- Prepaid credits at about $1 down to $0.30 per 1k. The listed packs run from $50 for 50k credits to $3,750 for 12.5M credits — [kaer.ai](https://kaer.ai/blog/search-api-pricing-cost-per-1000-queries); [apiserpent SERP comparison](https://apiserpent.com/blog/serp-api-pricing-comparison)

**SerpApi (multi-engine SERP scraping, monthly plans)**
- Effective cost is reported anywhere from about $1.96 to $25 per 1k depending on plan, and the entry plan is reportedly $75/month for 5k searches. Figures vary by source — [Parallel vs SerpApi (competitor)](https://parallel.ai/compare/serpapi-vs-parallel); [Linkup blog](https://www.linkup.so/blog/what-s-the-best-alternative-to-the-bing-search-api)

**Perplexity Sonar / Search API**
- About $5–12 per 1k requests depending on search context size, plus token charges, so total cost varies — [Parallel vs Perplexity (competitor)](https://parallel.ai/articles/perplexity-search-api-vs-parallel-search-api); [Keirolabs](https://keirolabs.cloud/blogs/comparisons/ai-search-api-pricing-compared)

**Parallel.ai (agent-native search, including extraction)**
- $1 per 1k on the Turbo/Fast tiers and $5 per 1k on Basic/Advanced, both including 10 results with excerpts — [Parallel honest comparison (vendor)](https://parallel.ai/articles/the-honest-2026-comparison-web-search-apis-for-ai-agents)

**Linkup**
- Standard search is about $5–6 per 1k. Deep search is about $50–55 per 1k — [kaer.ai](https://kaer.ai/blog/search-api-pricing-cost-per-1000-queries); [Serpex alternatives](https://serpex.dev/alternatives)

**Kagi Search API**
- Kagi's official pricing page lists search at $12 per 1k requests and page extraction at $4 per 1k pages. Third-party trackers report $15–25 per 1k, so trust the official page — [Kagi API pricing](https://kagi.com/api/pricing); [Kagi API product](https://kagi.com/products/api); [costbench (conflicting)](https://costbench.com/software/ai-search-apis/kagi-search-api/)

**You.com**
- Web Search API is a flat $5 per 1k requests for up to 100 results per call. Contents API is $1 per 1k pages (from You.com's own price-cut announcement). A free tier of 1,000/month is a third-party claim — [You.com](https://you.com/resources/lower-search-api-cost); [agenticsearch.cloud](https://www.agenticsearch.cloud/posts/complete-ai-search-api-list/)

**Jina Search (s.jina.ai)**
- No official search pricing was found. Jina bills by tokens; see Reader in section 2 — [Jina Reader page](https://jina.ai/reader/)

**Google Programmable Search / Custom Search JSON API (being shut down)**
- Closed to new customers. Discontinuation was announced in January 2026, and the API stops working for existing users on 2027-01-01. Old pricing was about $5 per 1k, capped at 10k queries/day after 100 free per day. Vertex AI Search, being renamed "Agent Search," is not a drop-in replacement: it covers up to 50 domains, not the open web, and starts at about $2 per 1k — [Brave: Google API shutdown](https://brave.com/learn/google-api-shutdown/); [dev.to](https://dev.to/booyaka101/google-kills-the-custom-search-json-api-on-2027-01-01-here-is-a-self-hosted-drop-in-3nk0); [Parallel](https://parallel.ai/articles/the-best-google-custom-search-api-alternative-for-ai-agents)

**Bing Search API (retired)**
- Shut down on 2025-08-11. The retirement notice came around 2025-05-13 to 05-15; sources differ on the exact date. Microsoft's suggested path is "Grounding with Bing Search" in Azure AI Foundry at about $14 per 1k transactions. It returns LLM output with citations, not a raw results list — [Linkup blog](https://www.linkup.so/blog/what-s-the-best-alternative-to-the-bing-search-api); [cloro.dev](https://cloro.dev/blog/bing-search-api-key/); [Monid](https://monid.ai/blog/guides/bing-search-api-retired-alternatives)

**Other**
- DataForSEO SERP is reported at about $2 per 1k — [Linkup blog](https://www.linkup.so/blog/what-s-the-best-alternative-to-the-bing-search-api)
- DeepSeek launched an agent web search API at $0.75 per 1k calls (about 5 yuan) — [ppc.land](https://ppc.land/deepseek-prices-web-search-for-ai-agents-at-0-75-per-1-000-calls/)

### Inferences
- Price tiers (per 1k): cheapest SERP-style is Serper ($0.3–1), Parallel Fast ($1), DataForSEO (about $2). The mid tier for LLM-ready results is Brave, You.com, Linkup, Exa Instant, and Parallel Basic ($4–7). Premium or with answers included is Tavily pay-as-you-go ($8), Claude/OpenAI built-ins ($10), Kagi ($12), Gemini/Bing grounding ($14), and Exa Deep ($12–15).
- Exa is strongest at semantic, "find pages like this" search (papers, companies, people). Tavily is the easiest all-in-one option for agents (search plus extract, crawl, and map, with a recurring free tier). Brave has an independent index and is the cheapest major index. Serper is the cheapest way to get raw Google results.
- Anything built on Google CSE must migrate before 2027-01-01.

### Gaps
- Rate limits (QPS) per plan for Exa, Brave, Serper, Linkup, and Parallel were not found, because vendor pages were blocked.
- No independent, non-vendor accuracy benchmark was retrieved. Comparisons such as SimpleQA or FRAMES numbers came only from vendor blogs and were not captured.
- Jina s.jina.ai pricing and the current Perplexity Search API price per request are unverified.

## 2. Scraping, crawling, and extraction tools: JS, anti-bot, PDFs, pricing

### Takeaway
Firecrawl (free 1,000 credits/month; Hobby $16–19/month for 5k credits) and Jina Reader (free without a key at 20 RPM, 10M free tokens per key) are the easiest hosted URL-to-markdown options. Crawl4AI is the leading free self-hosted option (Apache-2.0). For heavy JS sites or anti-bot protection, use managed browsers: Browserbase (billed per minute), Bright Data (per GB or per record), Apify (marketplace, $5/month free usage), or Steel. Claude's own web fetch cannot render JavaScript.

### Cited Findings
- **Firecrawl:** free plan of 1,000 credits/month with no card (500 earlier in 2026, per one source) and 2 concurrent browsers. Hobby is $19/month, or $16/month billed annually, for 5,000 credits. It offers scrape, crawl, map, search, extract, and /agent endpoints — [use-apify review](https://use-apify.com/blog/firecrawl-review-2026); [scrapegraphai](https://scrapegraphai.com/blog/firecrawl-pricing); [eesel](https://www.eesel.ai/blog/firecrawl-pricing)
- **Jina Reader** (`https://r.jina.ai/<url>`): 20 RPM without a key (tracked per IP), 500 RPM with a free key, 5,000 RPM premium. Each new key gets 10M free tokens, reportedly a one-time grant. Paid per-token prices conflict (about $0.02–0.05 per 1M tokens per third parties) — [Jina Reader](https://jina.ai/reader/); [serp.fast](https://serp.fast/tools/jina-ai); [makerstack](https://makerstack.co/reviews/jina-reader-review/)
- **Crawl4AI:** free, open source under Apache 2.0; you pay only for self-hosting — [use-apify pricing guide](https://use-apify.com/blog/web-scraping-pricing-guide-all-platforms). Repo: [unclecode/crawl4ai](https://github.com/unclecode/crawl4ai) (URL from prior knowledge, not fetched this session)
- **Browserbase** (hosted headless browsers; the Stagehand SDK): reported free tier of 1,000 session minutes/month, Starter $100/month (12,500 min), Scale $300/month (50,000 min). Other sources list a $20 Developer or $99 plan, so the tiers conflict — [apiscout](https://apiscout.dev/guides/best-browser-automation-apis-2026); [proxidize](https://proxidize.com/blog/best-web-scraping-tools-for-ai-agents/)
- **Bright Data:** pay-as-you-go from about $1–1.50 per 1k records, plans from $499/month, and Browser API from about $15/GB — [Bright Data blog (vendor)](https://brightdata.com/blog/ai/best-ai-scraping-tools); [pickaxe](https://pickaxe.co/post/top-web-scraping-tools)
- **Apify** (Actor marketplace): $5 of free usage per month; entry paid plans are reported at $19–49/month — [use-apify](https://use-apify.com/blog/web-scraping-pricing-guide-all-platforms); [scrapegraphai comparison](https://scrapegraphai.com/blog/scraper-api-comparison)
- **Pricing models differ:** Browserbase bills per minute and Bright Data per GB — [apiscout](https://apiscout.dev/guides/best-browser-automation-apis-2026)
- **Claude web fetch:** "does not support websites dynamically rendered with JavaScript." For JS or interaction, Anthropic points to its browser-use tool, a client-side tool — [Claude web fetch docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool)
- **Playwright MCP** (Microsoft) drives a real browser using accessibility snapshots; see section 3 — [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)

### Inferences
- Rule of thumb: try a static fetch first (Claude web_fetch or Jina Reader), then Firecrawl or Crawl4AI for JS rendering and crawls, then Browserbase, Steel, or Bright Data for login walls, CAPTCHAs, and anti-bot protection. Bright Data and Zyte are the residential-proxy and unblocker specialists.

### Gaps
- No pricing was retrieved for Steel.dev, browser-use Cloud, Zyte API, or ScrapeGraphAI. Repos to check: [steel-dev/steel-browser](https://github.com/steel-dev/steel-browser), [browser-use/browser-use](https://github.com/browser-use/browser-use), [ScrapeGraphAI/Scrapegraph-ai](https://github.com/ScrapeGraphAI/Scrapegraph-ai) (URLs from prior knowledge, not fetched).
- How each tool handles PDFs and anti-bot protection was not verified per tool. The general understanding is that Firecrawl and Jina Reader parse PDFs to markdown, but this was not confirmed this session.

## 3. MCP servers for research: names, repos, install commands

### Takeaway
Most major vendors now offer a remote HTTP MCP endpoint, so a single `claude mcp add --transport http <name> <url>` line is enough; OAuth or an API key handles auth. The official modelcontextprotocol/servers repo keeps 7 reference servers (everything, fetch, filesystem, git, memory, sequentialthinking, time). Brave Search, Puppeteer, GitHub, Postgres, Slack, and others were moved to `servers-archived` and no longer get updates, so use the vendor-maintained replacements.

### Cited Findings
**Reference servers**
- Active in [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers): everything, fetch, filesystem, git, memory, sequentialthinking, time. They are reference implementations, not production-grade. Brave Search, Puppeteer, and others moved to `modelcontextprotocol/servers-archived`, which gets no security fixes. The MCP Registry is the successor for discovery — [startdebugging.net](https://startdebugging.net/2026/08/migrate-off-archived-mcp-reference-servers/); [archived README via glama](https://glama.ai/mcp/servers/@modelcontextprotocol/servers-archived/blob/9be4674d1ddf8c469e6461a27a337eeb65f76c2e/README.md); [DeepWiki page](https://deepwiki.com/modelcontextprotocol/servers/5.2-archived-reference-servers)
- Typical commands (UNVERIFIED this session, standard package names): `claude mcp add fetch -- uvx mcp-server-fetch`; `claude mcp add memory -- npx -y @modelcontextprotocol/server-memory`; `claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking`; `claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /path`

**Search and scraping MCPs**
- **Tavily:** `claude mcp add tavily --transport http https://mcp.tavily.com/mcp/`, then start a new session and sign in with OAuth. Alternatively, pass the key as a URL query parameter and add `--scope user` to make it global. Repo: [tavily-ai/tavily-mcp](https://github.com/tavily-ai/tavily-mcp) — [Tavily MCP docs](https://docs.tavily.com/documentation/mcp)
- **Firecrawl:** keyless remote at `https://mcp.firecrawl.dev/v2/mcp` via `claude mcp add --transport http firecrawl https://mcp.firecrawl.dev/v2/mcp`. The OAuth variant `https://mcp.firecrawl.dev/v2/mcp-oauth` gives the full tool set. Local install: `npx -y firecrawl-mcp` with `FIRECRAWL_API_KEY` — [Firecrawl docs: Claude Code](https://docs.firecrawl.dev/quickstarts/claude-code); [Firecrawl MCP docs](https://docs.firecrawl.dev/mcp-server)
- **Exa:** hosted endpoint at `https://mcp.exa.ai/mcp`, or the npm package `exa-mcp-server` with `EXA_API_KEY` — [HeyClaude](https://heyclau.de/entry/mcp/exa-mcp-server); [Firecrawl best web search MCP](https://www.firecrawl.dev/blog/best-web-search-mcp). The command `claude mcp add --transport http exa https://mcp.exa.ai/mcp` is UNVERIFIED (inferred).
- **Brave (official):** `claude mcp add brave-search --env BRAVE_API_KEY=... -- npx -y @brave/brave-search-mcp-server`. The repo is github.com/brave/brave-search-mcp-server; the old `@modelcontextprotocol/server-brave-search` is archived — [popularaitools](https://popularaitools.ai/skills/bravebrave-search-mcp-server); [Firecrawl blog](https://www.firecrawl.dev/blog/best-web-search-mcp). Community alternative: [mikechao/brave-search-mcp](https://github.com/mikechao/brave-search-mcp)
- **Perplexity (official, [perplexityai/modelcontextprotocol](https://github.com/perplexityai/modelcontextprotocol)):** local `claude mcp add perplexity --env PERPLEXITY_API_KEY="..." -- npx -y @perplexity-ai/mcp-server`; remote `claude mcp add --transport http perplexity https://api.perplexity.ai/mcp --header "Authorization: Bearer KEY"`. Without a key, it opens a browser login on first use — [Perplexity MCP docs](https://docs.perplexity.ai/docs/getting-started/integrations/mcp-server)

**Code and documentation research**
- **Context7 (Upstash, up-to-date library docs):** remote at `https://mcp.context7.com/mcp` with an `Authorization: Bearer` API key header, or the package `@upstash/context7-mcp` (pinned version 4.3.0 seen in one config). Example (UNVERIFIED exact form): `claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: ..."` — [rios0rios0 dotfiles PR](https://github.com/rios0rios0/dotfiles/pull/223); [midgard PR](https://github.com/charliebeckstrand/midgard/pull/2325)
- **DeepWiki (Cognition; free, remote, no auth, Q&A over public GitHub repos):** `claude mcp add -s user -t http deepwiki https://mcp.deepwiki.com/mcp` — [AgentsCamp](https://agentscamp.com/tools/deepwiki-mcp)
- **GitHub (official remote):** `claude mcp add --transport http github https://api.githubcopilot.com/mcp/` (note the trailing slash; OAuth on first use). Local: Docker image `ghcr.io/github/github-mcp-server` with a personal access token — [deployhq](https://www.deployhq.com/blog/best-mcp-servers-for-web-developers); [Medium/haberlah](https://medium.com/@haberlah/your-ai-coding-agent-is-only-as-good-as-its-search-engine-fba1d34c1f0c)

**Browsers**
- **Playwright MCP (Microsoft):** `claude mcp add playwright npx @playwright/mcp@latest`, or user scope: `claude mcp add playwright -s user -- npx @playwright/mcp@latest` — [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)
- **Chrome DevTools MCP (Google):** `claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest` — [shanraisshan best-practice report](https://github.com/shanraisshan/claude-code-best-practice/blob/main/reports/claude-in-chrome-v-chrome-devtools-mcp.md); [ayyaztech comparison](https://www.ayyaztech.com/blog/chrome-devtools-mcp-vs-claude-in-chrome-vs-playwright)
- **Claude in Chrome** (Anthropic's extension) is a third browser option compared against these two — [Medium comparison](https://lalatenduswain.medium.com/playwright-mcp-vs-claude-in-chrome-which-browser-testing-tool-should-you-use-in-2026-e502bee0067a)

### Inferences
- Minimal research MCP set for Claude Code: one search MCP (Exa, Tavily, or Brave), one scraper (Firecrawl, or the fetch reference server), Context7 and DeepWiki for code research, and Playwright for JS-heavy pages. Remote HTTP plus OAuth avoids local Node/Python setup and secrets in config files.
- Use `--scope user` for tools you want available in every project. Claude Desktop uses the same servers through `claude_desktop_config.json` (`"mcpServers": {"name": {"command": "npx", "args": [...], "env": {...}}}`), or adds remote ones as Connectors (general knowledge, not verified this session).

### Gaps
- YouTube transcript MCP and Reddit MCP: no source was retrieved, so repo names and commands are unverified. Community servers exist (e.g., `@kimtaeyoon83/mcp-server-youtube-transcript`), but this was not verified. The transcribe.so plugin is an alternative in this environment.
- The exact current Context7 header name and whether it needs a key is unverified; it previously worked without a key, with rate limits.
- Exa's official `claude mcp add` syntax is unverified.

## 4. Built-in model tools: Claude web search/fetch, OpenAI web search, Gemini grounding

### Takeaway
Claude web search costs $10 per 1k searches plus tokens. Claude web fetch has no extra charge (tokens only), supports PDFs, and cannot render JavaScript. Newer versions (`web_search_20260209/20260318`, `web_fetch_20260209/20260309/20260318`) add "dynamic filtering," where Claude filters results with code before they enter context, at no extra code-execution charge. OpenAI web search is about $10 per 1k ($25 per 1k for the search-preview models). Gemini grounding with Google Search is reported at $14 per 1k on Gemini 3 (with 5,000 free prompts/month) and $35 per 1k on Gemini 2.5.

### Cited Findings
- **Claude web search:** versions `web_search_20250305` (basic), `web_search_20260209` (dynamic filtering, Claude 4.6+), and `web_search_20260318` (adds `response_inclusion`). Parameters: `max_uses`, `allowed_domains` or `blocked_domains` (not both), `user_location`, `allowed_callers`. Price: "$10 USD per 1,000 searches, plus standard token costs"; errors are not billed; citations are always on — [Claude web search docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)
- Dynamic filtering runs inside code execution, with no extra charge beyond tokens. Set `allowed_callers: ["direct"]` to turn it off — [same](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)
- **Claude web fetch:** "no additional cost," tokens only. Supports text, HTML, and PDF. It does not render JavaScript. It can only fetch URLs that already appeared in the conversation (an exfiltration safeguard). Parameters: `max_content_tokens`, optional `citations`, `use_cache` (in 20260309 and later), `url_sources`. Reference sizes: an average page is about 2,500 tokens and a research PDF (500 kB) about 125,000 tokens — [Claude web fetch docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool)
- **OpenAI web search tool:** $10 per 1k calls plus content tokens; search-preview (non-reasoning) models are $25 per 1k with content tokens free — [eesel OpenAI pricing](https://www.eesel.ai/blog/openai-agents-api-pricing); [digitalapplied](https://www.digitalapplied.com/blog/web-search-apis-for-ai-agents-compared-2026)
- **Gemini grounding with Google Search:** $14 per 1k search queries on Gemini 3, with 5,000 free prompts/month; $35 per 1k grounded prompts on Gemini 2.5 (roundup dated August 2026) — [ecorpit](https://ecorpit.com/agent-web-search-api-cost-comparison-2026/); [kaer.ai](https://kaer.ai/blog/search-api-pricing-cost-per-1000-queries)

### Inferences
- In Claude Code, the built-in WebSearch and WebFetch tools are already available. External search MCPs are worth adding mainly for semantic search (Exa), crawl and extraction (Firecrawl, Tavily), JS rendering, or cheaper high-volume use.

### Gaps
- Official OpenAI and Google pricing pages were not fetched; figures are from third parties.

## 5. Document and PDF parsing tools for research

### Takeaway
For self-hosting, Docling (MIT), Marker (Apache-2.0 code, restricted weights), and MinerU (relicensed in April 2026 to a permissive Apache-based license) are the main open-source parsers. Marker v2 and MinerU score highest on olmOCR-Bench among them. Managed options include Mistral OCR (about $4–5 per 1k pages, about $2 with batch), LlamaParse ($0.00125–0.056 per page depending on mode), and Unstructured ($0.03 per page after 15k free pages/month). GROBID is still the specialist for scholarly-paper metadata and references.

### Cited Findings
- **LlamaParse:** $1.25 per 1k credits. Per page: Fast $0.00125, Cost-effective $0.00375, Agentic $0.0125, Agentic Plus $0.05625 (a 45× spread). Its ParseBench "#1" ranking is self-published — [devtoollab](https://devtoollab.com/blog/best-pdf-parsers-for-rag); [Reducto (vendor)](https://llms.reducto.ai/best-document-processing-apis-2026)
- **Mistral OCR:** about $4 per 1k pages ($2 via the Batch API); another source says $5 per 1k. The $1 per 1k figure belongs to a deprecated 2025 model. Ai2 measured it at 72.0 on olmOCR-Bench. Mistral claims OCR 3 has a 74% win rate over OCR 2 on internal tests — [devtoollab](https://devtoollab.com/blog/best-pdf-parsers-for-rag); [iotdigitaltwinplm](https://iotdigitaltwinplm.com/document-ai-ocr-vs-vision-language-models-docling-olmocr-mistral-ocr-pipeline-2026/)
- **Unstructured:** $0.03 per page pay-as-you-go after 15,000 free pages/month. Cloud OCR (Textract, Document AI, Azure Read) starts at $0.0015 per page — [Reducto](https://llms.reducto.ai/best-document-processing-apis-2026)
- **Docling:** MIT-licensed. Self-hosted cost is about $7.96 per 10k pages on an L40S (rates as of 2026-05-28), compared with about $100 on Azure Document Intelligence layout. This estimate is from a GPU vendor and covers compute only — [Spheron](https://www.spheron.network/blog/self-host-document-intelligence-docling-marker-mineru-rag-guide/)
- **MinerU:** moved from AGPL-3.0 to a custom Apache-2.0-based license on 2026-04-18. A commercial license is needed only above 100M MAU or $20M monthly revenue — [builderai.tools](https://builderai.tools/blog/pdf-parsing-for-rag-mineru-docling-marker-compared)
- **Marker:** code is Apache-2.0, but the weights restrict commercial use above $5M funding or revenue — [builderai.tools](https://builderai.tools/blog/pdf-parsing-for-rag-mineru-docling-marker-compared)
- **olmOCR-Bench:** Marker 2 (balanced) 76.0 at 2.9 pages/s on a B200; MinerU pipeline 72.7 at 0.54 pages/s; Docling 50.3 at 2.1 pages/s. On born-digital PDFs only: Marker 2 83.5, MinerU 83.3, Docling 64.0 — [MarkTechPost 2026-07-24](https://www.marktechpost.com/2026/07/24/datalab-marker-v2-vs-mineru-docling-and-liteparse-benchmark-breakdown/)

### Inferences
- For a researcher on a budget: Claude's native PDF reading (web fetch or attachment) for single papers; Docling or Marker locally for batches; Mistral OCR batch for scanned material at scale; GROBID for citation graphs.
- Suggested research stacks (synthesized from the prices above):
  - **Free / $0:** Claude Code built-in WebSearch and WebFetch (included in a Claude subscription) + Jina Reader without a key + DeepWiki + Context7 + Playwright MCP + fetch/memory/sequential-thinking reference servers + Crawl4AI and Docling locally + Tavily free (1k credits) and Firecrawl free (1k credits) for overflow.
  - **About $20–50/month:** add Exa (about $7 per 1k, semantic search) or Brave ($5 per 1k, with a $5 credit) as the main search MCP, plus Firecrawl Hobby ($16–19) for crawls. Use Serper ($0.3–1 per 1k) for raw Google results in bulk.
  - **Pro / $100+/month:** Exa Deep or Parallel or Tavily Research for deep queries, plus Perplexity Sonar for cited answers, Browserbase or Bright Data for anti-bot work, Mistral OCR or LlamaParse Agentic for documents, and Kagi ($12 per 1k) as an ad-free, high-quality index.

### Gaps
- GROBID: no 2026 source was retrieved (repo [kermitt2/grobid](https://github.com/kermitt2/grobid), from prior knowledge, Apache-2.0, free self-hosted).
- Unstructured open-source versus platform differences were not verified. No apples-to-apples cost and quality table across all parsers exists; most sources are vendor-authored.
