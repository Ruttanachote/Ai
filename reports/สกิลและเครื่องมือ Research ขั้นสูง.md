# ประกอบสแต็ก Research ขั้นสูงที่ตรวจสอบได้จริง

สแต็กที่ดีที่สุดสำหรับงาน research ขั้นสูง ณ ตุลาคม 2026 ไม่ได้มาจากสกิลตัวเดียว แต่ต้องมีสามชั้นทำงานร่วมกัน ชั้นแรกคือ**สกิลที่บังคับให้ทำงานตามวิธีวิทยา** ได้แก่ `anthropic-skills:deep-research` ที่ sync มากับ claude.ai/Cowork, **K-Dense Scientific Agent Skills** (177 สกิล) สำหรับงานวิทยาศาสตร์, **Imbad0202/academic-research-skills** สำหรับงานวิชาการที่ต้องมีด่านตรวจ citation และ **Weizhena/Deep-Research-skills** สำหรับงานเปรียบเทียบหลายรายการ ชั้นที่สองคือ**เครื่องมือดึงข้อมูล** เช่น search MCP (Exa/Tavily/Brave), scraper (Firecrawl/Jina/Crawl4AI) และ API ฐานข้อมูลวิชาการฟรี (OpenAlex, Semantic Scholar, Crossref, PubMed) ชั้นที่สามคือ**การตรวจสอบระดับ claim** ซึ่งสำคัญที่สุด เพราะงานวิจัยปี 2026 พบว่า deep research agent แต่งขึ้น URL เอง 3–13% และ claim ที่อ้างแหล่งจริงก็ถูกต้องเพียง **39–77%** แม้ในโมเดลระดับแนวหน้า ([arXiv 2604.03173](https://arxiv.org/abs/2604.03173); [arXiv 2605.06635](https://arxiv.org/html/2605.06635v1)) สกิลชั้นนำทุกตัวใช้สถาปัตยกรรมแบบ orchestrator-worker ของ Anthropic ซึ่งเอาชนะ agent เดี่ยวได้ **90.2%** แต่ใช้ token มากกว่าแชตปกติราว **15 เท่า** ([Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)) ดังนั้นต้องคุมขนาดงานให้เหมาะกับความยากของคำถาม เริ่มต้นได้ที่ **$0** ด้วย WebSearch/WebFetch ที่มีอยู่แล้วใน Claude Code ร่วมกับ MCP ฟรี และค่าใช้จ่ายราว **$20–50 ต่อเดือน** ก็พอสำหรับงานระดับมืออาชีพ รายงานนี้รวบรวมคำสั่งติดตั้ง ราคา และสแต็กแนะนำไว้ครบ

> หมายเหตุเรื่องความน่าเชื่อถือ: ราคาจำนวนมากมาจากบล็อกเปรียบเทียบของบุคคลที่สาม (บางเจ้าเป็นคู่แข่งกันเอง) เพราะในรอบวิจัยนี้เข้าหน้าเว็บผู้ขายโดยตรงไม่ได้ ควรตรวจกับหน้าราคาจริงก่อนตัดสินใจ ตัวเลขดาว GitHub เป็น snapshot วันที่ 2026-10-28 และดูเหมือนว่าทั้งระบบนิเวศมียอดดาวพองเกินจริง

---

## สกิลทุกตัวที่ดีลอกแบบเดียวกัน: lead วางแผน, subagent ค้นขนาน, แล้วแยก pass ตรวจ citation

ก่อนเลือกสกิล ควรเข้าใจรูปแบบที่สกิลเหล่านั้นนำไปใช้ก่อน Anthropic อธิบายระบบ Research ของตัวเองว่า **LeadResearcher** วางแผนแล้วบันทึกแผนไว้ใน memory เพราะ context ที่เกิน 200k token จะถูกตัดทิ้ง จากนั้นแตก **subagent** ออกไปค้นแบบขนาน แต่ละตัวมี context window ของตัวเอง และปิดท้ายด้วย **CitationAgent** ที่ผูกแหล่งอ้างอิงเข้ากับทุก claim ([Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)) ผลที่วัดได้ชัดเจน การใช้ Opus 4 เป็น lead คู่กับ Sonnet 4 เป็น subagent ชนะ Opus 4 เดี่ยว 90.2% บน eval ภายใน การค้นแบบขนานลดเวลาลงได้ถึง 90% และบน BrowseComp ปริมาณ token อธิบายความแปรปรวนของผลลัพธ์ได้ราว 80% ซึ่งหมายความว่าคุณภาพงานขึ้นกับงบที่ใช้โดยตรง ([Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system))

บทเรียนที่ใช้ได้จริงที่สุดคือ**กฎปรับขนาดงานตามความยาก** คำถามข้อเท็จจริงง่าย ๆ ใช้ agent ตัวเดียวกับ 3–10 tool call การเปรียบเทียบตรง ๆ ใช้ 2–4 subagent ตัวละ 10–15 call ส่วนงานวิจัยซับซ้อนใช้มากกว่า 10 subagent ที่แบ่งบทบาทชัดเจน ระบบรุ่นแรกเคยแตก subagent ถึง 50 ตัวสำหรับคำถามง่าย ๆ ([Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)) subagent แต่ละตัวต้องได้รับ objective, รูปแบบ output, คำแนะนำเรื่องเครื่องมือ/แหล่ง และขอบเขตที่ห้ามล้ำ ถ้าคำสั่งคลุมเครือ subagent จะทำงานซ้ำกัน ควรค้นด้วยคำค้นสั้นและกว้างก่อนแล้วค่อยแคบลง และเมื่อให้ Claude เขียนคำอธิบาย tool ของ MCP ใหม่ เวลาทำงานลดลงได้ 40% ([Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)) งานเรื่อง context engineering เสริมว่า subagent ควรส่งกลับบทสรุปขนาดราว **1,000–2,000 token** และใช้ไฟล์โน้ตภายนอก (เช่น NOTES.md) เป็นหน่วยความจำระยะยาว แทนการยัดทุกอย่างไว้ใน context ([Anthropic: Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents))

ในทางกลับกัน multi-agent ไม่เหมาะกับทุกงาน Anthropic ระบุว่ารูปแบบนี้คุ้มค่ากับงานที่มีมูลค่าสูง แตกเป็นส่วนขนานได้ และมีข้อมูลเกิน context เดียว แต่ไม่เหมาะกับงานที่ต้องแชร์ context หรือมี dependency แน่นระหว่าง agent ([Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)) การประเมินควรเริ่มจากชุดคำถามจริงราว 20 ข้อ แล้วให้ LLM judge ให้คะแนน 0.0–1.0 พร้อม pass/fail ตามเกณฑ์ 5 ข้อ ได้แก่ ความถูกต้องของข้อเท็จจริง ความถูกต้องของ citation ความครบถ้วน คุณภาพแหล่ง และประสิทธิภาพการใช้ tool ([Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)) สำหรับ agent ที่ผลลัพธ์ไม่แน่นอน ควรรายงานทั้ง pass@k และ pass^k เพราะค่าแรกจะเข้าใกล้ 100% และค่าหลังจะเข้าใกล้ 0% เมื่อ k เพิ่มขึ้น ([Anthropic: Demystifying evals](https://anthropic.com/engineering/demystifying-evals-for-ai-agents))

---

## ห้าชุดสกิลที่ควรติดตั้ง และทำไม repo ทางการของ Anthropic ไม่มีสกิล research เลย

### ฝั่ง Anthropic: ความสามารถด้าน research อยู่ใน connector ไม่ได้อยู่ใน SKILL.md

repo ทางการ `anthropics/skills` (ราว 184k ดาว) มีสกิล 19 โฟลเดอร์ เช่น pdf, xlsx, docx, skill-creator, mcp-builder และ doc-coauthoring แต่**ไม่มีสกิลด้าน research โดยเฉพาะเลย** ([anthropics/skills tree](https://github.com/anthropics/skills/tree/main/skills)) ความสามารถ research ของ Anthropic ส่งมาสี่ทางแทน ทางแรกคือฟีเจอร์ **Research** ใน claude.ai สำหรับแผน Pro/Max/Team/Enterprise ซึ่งค้นหลายรอบต่อเนื่องและดึงข้อมูลจาก Gmail/Calendar/Docs ได้ ([Claude Help Center](https://support.claude.com/en/articles/11088861-using-the-research-feature)) ทางที่สองคือบทความสถาปัตยกรรม multi-agent ที่กล่าวไปแล้ว ทางที่สามคือสกิล `anthropic-skills:deep-research` ที่ sync มากับ claude.ai/Cowork ไฟล์ `references/researcher.md` ของสกิลนี้สั่งให้ subagent ใช้ราว 10–15 tool call เลือกแหล่งปฐมภูมิ อ้างอิงทุก claim แบบ inline และบันทึกช่องว่างของข้อมูลไว้แทนการแต่งขึ้น สิ่งนี้มาจากการสังเกตไฟล์ในเครื่อง ยังไม่พบเอกสารสาธารณะ ทางที่สี่คือ marketplace **`anthropics/knowledge-work-plugins`** ที่มีปลั๊กอิน `bio-research` (connector ไปยัง PubMed, bioRxiv, ClinicalTrials.gov, ChEMBL, Open Targets, Benchling และอื่น ๆ), `data` (Snowflake, BigQuery, Databricks, Hex) และ `enterprise-search` (Slack, Notion, Jira, M365) ([knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins)) สรุปได้ว่าพลังของ Anthropic อยู่ที่ connector ที่ปลั๊กอินพ่วงมาใน `.mcp.json` ส่วนสกิลเพียงอย่างเดียวเป็นแค่คำสั่ง

```bash
# Anthropic official skills (pdf/xlsx/skill-creator ที่ใช้อ่าน paper และวิเคราะห์ข้อมูล)
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills

# Knowledge-work plugins (มี connector ฐานข้อมูลชีวการแพทย์)
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install bio-research@knowledge-work-plugins
claude plugin install data@knowledge-work-plugins
claude plugin install enterprise-search@knowledge-work-plugins
```

### ฝั่งชุมชน: K-Dense สำหรับวิทยาศาสตร์, Imbad0202 สำหรับวิชาการ, Weizhena สำหรับงานเปรียบเทียบ

**K-Dense-AI/scientific-agent-skills** (เดิมชื่อ claude-scientific-skills, ราว 55k ดาว, MIT) มี **177 สกิลที่ผ่านการตรวจสอบแล้ว** แบ่งเป็น Bioinformatics 32, Scientific Communication 23, Data Analysis & Viz 18, Research Methodology & Planning 13 และ Scientific Databases 13 ([K-Dense GitHub](https://github.com/K-Dense-AI/claude-scientific-skills)) สกิลเด่นคือ **Literature Review** (ครอบคลุม discovery, screening, synthesis และ citation management สำหรับ systematic/scoping review), **Paper Lookup** (ค้น PubMed, PMC, bioRxiv, medRxiv, arXiv, OpenAlex, Crossref, Semantic Scholar, CORE, Unpaywall), **Hypothesis Generation**, **Scientific Writing** และ **Database Lookup** ที่เข้าถึงได้ 80 ฐานข้อมูล ([K-Dense](https://github.com/K-Dense-AI/claude-scientific-skills); [mcp.directory guide](https://mcp.directory/blog/claude-literature-review-skill-guide)) ข้อควรระวังคือ repo ต้องใช้ Python 3.13+ กับ `uv` และ dependency ของแต่ละสกิลไม่ได้ติดตั้งให้อัตโนมัติ ต้องดูฟิลด์ `compatibility` ของแต่ละสกิลเอง ([K-Dense](https://github.com/K-Dense-AI/claude-scientific-skills))

**Imbad0202/academic-research-skills** (ราว 54k ดาว, ออก v3.24.0 เมื่อ 2026-10-27 จึงยังพัฒนาอยู่) เหมาะที่สุดสำหรับงานวิทยานิพนธ์หรือ paper ที่ต้องการความสมบูรณ์ของ citation ประกอบด้วยสกิล `deep-research` (8 โหมด เช่น socratic, systematic-review, fact-check), `academic-paper` (11 โหมด รวม citation-check), `academic-paper-reviewer` และ `academic-pipeline` ซึ่งเป็น orchestrator 10 ขั้นที่มี checkpoint ให้ผู้ใช้อนุมัติทุกขั้นและมี integrity gate ที่ขั้น 2.5 และ 4.5 ([academic-research-skills](https://github.com/imbad0202/academic-research-skills)) จุดแข็งเชิงเทคนิคคือตรวจ citation กับ Semantic Scholar, มี **deterministic four-index citation gate**, ใส่ locator anchor ให้ทุก citation และมี claim audit ที่เปิดใช้ได้ด้วย `ARS_CLAIM_AUDIT=1` ([academic-research-skills](https://github.com/imbad0202/academic-research-skills))

**Weizhena/Deep-Research-skills** (ราว 2.4k ดาว, MIT) ออกแบบให้มนุษย์ร่วมตัดสินใจสองช่วง คือสร้าง outline ของรายการและฟิลด์ก่อน แล้วจึงสืบค้นเชิงลึกด้วย agent ขนานหนึ่งตัวต่อหนึ่งรายการ คำสั่งที่มีคือ `/research`, `/research-add-items`, `/research-add-fields`, `/research-deep` และ `/research-report` ซึ่งทำให้ผลของแต่ละรายการเทียบกันได้เหมือนตาราง เหมาะกับงานเช่น "เปรียบเทียบ 20 เครื่องมือในหัวข้อเดียวกัน" ([Weizhena](https://github.com/Weizhena/Deep-Research-skills)) ส่วน **obra/superpowers** ไม่มีสกิล research แต่มีสกิลด้านวิธีการทำงาน เช่น `brainstorming`, `writing-plans` และ `verification-before-completion` ที่ช่วยสร้างวินัยการตรวจงานก่อนส่ง ([obra/superpowers](https://github.com/obra/superpowers))

```bash
# K-Dense Scientific Agent Skills
npx skills add K-Dense-AI/scientific-agent-skills
npx skills add K-Dense-AI/claude-scientific-skills --skill literature-review   # ติดตั้งเฉพาะสกิลเดียว
gh skill install K-Dense-AI/scientific-agent-skills --pin v2.71.0
git clone https://github.com/K-Dense-AI/scientific-agent-skills.git ~/.agents/skills/scientific-agent-skills

# Imbad0202 academic pipeline (ต้องตั้ง ANTHROPIC_API_KEY; pandoc/tectonic ใช้ export DOCX/APA PDF)
/plugin marketplace add Imbad0202/academic-research-skills
/plugin install academic-research-skills

# Weizhena (Claude Code) — คัดลอกไฟล์แบบ manual
cp -r skills/research-en/* ~/.claude/skills/
cp agents/web-search-agent.md ~/.claude/agents/ && cp -r agents/web-search-modules ~/.claude/agents/
pip install pyyaml

# superpowers (วินัยการวางแผนและตรวจสอบ)
/plugin install superpowers@claude-plugins-official
```

| ชุดสกิล | เหมาะกับ | จุดเด่นเชิงวิธีวิทยา | ความพร้อมใช้งาน |
|---|---|---|---|
| `anthropic-skills:deep-research` | งานวิจัยเว็บทั่วไปใน claude.ai/Cowork | orchestrator + subagent brief, บังคับ inline citation | sync มาให้, ไม่มีเอกสารสาธารณะ |
| K-Dense Scientific Agent Skills | วิทยาศาสตร์/ชีวการแพทย์ | 177 สกิล, เข้าถึงฐานข้อมูล 80 แห่ง | ~55k ดาว, ออก release ต่อเนื่อง |
| Imbad0202 academic-research-skills | วิทยานิพนธ์, paper, systematic review | citation gate 4 ดัชนี, human checkpoint | v3.24.0 (2026-10-27) |
| Weizhena Deep-Research-skills | เปรียบเทียบหลายรายการแบบตาราง | outline → field schema → agent ต่อรายการ | ~2.4k ดาว |
| obra/superpowers | วินัยการทำงานทุกประเภท | verification-before-completion | ~306k ดาว (น่าจะพองเกินจริง) |

ยังมี repo อื่นที่เหมาะใช้เป็น**แบบอ้างอิงการออกแบบ**มากกว่าใช้งานจริง **Defiect/deep-research-plugin** มี agent 4 บทบาท (`dr-lead` Opus, `dr-scout` Sonnet, `dr-analyst`, `dr-writer`) มี pipeline 7 ขั้นที่รวม Triangulation และ Adversarial Review เก็บหลักฐานไว้ใน `evidence.jsonl` ที่มีเส้นเชื่อมแบบ supports/contradicts และใช้ hook `TaskCompleted` บล็อกไม่ให้จบงานถ้ายังไม่มี artifact ที่กำหนด ทั้งนี้ต้องใช้ Claude Code v2.1.32+ และ `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` แต่ repo มีเพียง 2 ดาวและ 1 commit ([Defiect](https://github.com/Defiect/deep-research-plugin)) **24601/agent-deep-research** เรียก Gemini Deep Research ผ่าน Interactions API และมี `--dry-run` สำหรับประเมินค่าใช้จ่ายก่อนรัน ([24601](https://github.com/24601/agent-deep-research)) สำหรับการตรวจ citation มีสกิลเฉพาะทางคือ `citation-verifier` ของ jkitchin/skillz ที่ตรวจ DOI/arXiv/PMID กับ Crossref ([skillselion](https://skillselion.com/skills/jkitchin/skillz/citation-verifier)) และ `check-citations` ของ brycewang-stanford ที่จับ citation แบบ "chimeric" คือชื่อเรื่องจริงแต่ผู้เขียนผิด ([skillselion](https://skillselion.com/skills/brycewang-stanford/awesome-agent-skills-for-empirical-research/check-citations))

### สกิลพกพาข้ามเครื่องมือได้ แต่ subagent และ hook พกพาไม่ได้

Agent Skills กลายเป็น**มาตรฐานเปิด**ตั้งแต่ 2025-12-18 ([Anthropic Engineering](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)) ปัจจุบัน Codex, Gemini CLI, Cursor, OpenCode และ Copilot CLI อ่านโฟลเดอร์ SKILL.md ได้ superpowers จึงส่ง repo เดียวไปใช้ได้ถึง 16 agent ([obra/superpowers](https://github.com/obra/superpowers)) อย่างไรก็ตาม spec ที่ใช้ใน claude.ai และ Skills API ยอมรับ frontmatter เพียง 6 ฟิลด์ คือ `name`, `description`, `license`, `compatibility`, `metadata` และ `allowed-tools` ฟิลด์อย่าง `context: fork` หรือ `hooks` ใช้ได้เฉพาะใน Claude Code ([code.claude.com skills](https://code.claude.com/docs/en/skills)) ด้วยเหตุนี้ Weizhena จึงต้องดูแลสกิลแยกเวอร์ชันสำหรับ Claude, OpenCode และ Codex เพราะรูปแบบ subagent ของแต่ละเครื่องมือต่างกัน (Codex ใช้ไฟล์ TOML ใน `~/.codex/agents/`) ([Weizhena](https://github.com/Weizhena/Deep-Research-skills)) ถ้าต้องการให้พกพาได้สูงสุด ให้วางสกิลไว้ที่ `~/.agents/skills/` ซึ่งทั้ง K-Dense และ Gemini CLI ใช้ร่วมกัน ([Mintlify Gemini CLI mirror](https://www.mintlify.com/google-gemini/gemini-cli/advanced/skills))

---

## Deep research agent: เลือกตามความลึก ความเร็ว หรือความเป็นเจ้าของข้อมูล

### ผลิตภัณฑ์เชิงพาณิชย์ต่างกันที่ความลึกเทียบกับความเร็ว

ผู้ให้บริการหลักทุกรายมีโหมด deep research ที่ทำงานแบบเดียวกัน คือวางแผน ค้น อ่านซ้ำหลายรอบ แล้วเขียนรายงานพร้อมอ้างอิง ความแตกต่างอยู่ที่ระดับความลึกเทียบกับความเร็ว **Perplexity Deep Research** มี citation accuracy สูงสุดราว 90% บน DeepResearch Bench ขณะที่ Gemini 2.5 Pro DR มี effective citation มากที่สุดราว 111 รายการต่องาน ([arXiv 2506.11763](https://arxiv.org/html/2506.11763v1)) **Gemini Deep Research และ Deep Research Max** เปิดตัว 2026-04-21 บน Gemini 3.1 Pro ผ่าน Interactions API (agent ID `deep-research-preview-04-2026` และ `deep-research-max-preview-04-2026`) รองรับ MCP สำหรับข้อมูลส่วนตัว และมี collaborative planning ที่ให้ผู้ใช้ตรวจแผนก่อนรัน ([VentureBeat](https://venturebeat.com/technology/googles-new-deep-research-and-deep-research-max-agents-can-search-the-web-and-your-private-data); [Gemini API docs](https://ai.google.dev/gemini-api/docs/deep-research)) **OpenAI `o3-deep-research`** ผ่าน API คิด $10 ต่อ 1M input token และ $40 ต่อ 1M output token บวกค่า web search รายครั้ง ([OpenAI model docs](https://developers.openai.com/api/docs/models/o3-deep-research)) ส่วน **Claude Research** อ่านแหล่งน้อยกว่าคู่แข่งแต่เด่นด้านการสังเคราะห์ ([aitoolradar](https://aitoolradar.io/blog/deep-research-showdown)) และในการทดสอบ "Cited but Not Verified" ปี 2026 Claude Opus 4.5 ได้คะแนนความถูกต้องระดับ claim สูงสุดที่ 76.8% เทียบกับ GPT-5.4 ที่ 47.7% ([arXiv 2605.06635](https://arxiv.org/html/2605.06635v1))

| ผลิตภัณฑ์ | จุดแข็ง | ราคา / ข้อจำกัด (ส่วนใหญ่มาจากบุคคลที่สาม) |
|---|---|---|
| ChatGPT Deep Research | รายงานยาว ขัดเกลาดี ใช้เวลา 5–30 นาที | ตัวเลขปี 2025: Plus 25 งาน/เดือน, Pro 250 งาน/เดือน; หน้าปัจจุบันระบุเพียง "limited/expanded/maximum" ([whizi.io](https://whizi.io/resources/chatgpt-deep-research-limit/)) |
| Gemini DR / DR Max | ครอบคลุมกว้าง, MCP, ตรวจแผนก่อนรัน | Max รายงานว่าได้ 93.3% บน DeepSearchQA (ยังไม่ยืนยัน) ([kingy.ai](https://kingy.ai/ai-launch-tracker/gemini-deep-research-max-2026-04-21-major-update/)) |
| Perplexity Deep Research | เร็ว 2–4 นาที, citation แม่นที่สุด | โควตาขัดแย้งกัน (Pro 20/เดือน หรือ 20/วัน) ([aitoolradar](https://aitoolradar.io/guides/perplexity)) |
| Claude Research | สังเคราะห์และเชื่อมกับข้อมูลส่วนตัวผ่าน connector | แผน Pro ขึ้นไป ([Claude Help Center](https://support.claude.com/en/articles/11088861-using-the-research-feature)) |
| OpenAI API `o3-deep-research` | ฝังในแอปของตัวเอง | $10/$40 ต่อ 1M token + ค่า search ([OpenAI](https://developers.openai.com/api/docs/models/o3-deep-research)) |

### Open-source แยกเป็นสองตระกูล: framework ห่อ LLM กับโมเดลที่ฝึกด้วย RL

ตระกูลแรกคือ **framework ที่ห่อ LLM ใดก็ได้เข้ากับ search API** ส่วนตระกูลที่สองคือ **agent model ที่ฝึกแบบ end-to-end ด้วย RL และ self-host ได้** โมเดลตระกูลหลังทำคะแนน BrowseComp ได้ระดับ 70 กว่า (MiroThinker 1.7 ได้ 74.0) แต่ยังต่ำกว่าระบบปิดระดับแนวหน้าที่ได้ราว 91–92% ([MiroThinker](https://github.com/MiroMindAI/MiroThinker); [BenchLM](https://benchlm.ai/benchmarks/browsecomp)) ข้อควรรู้สำคัญคือ **LangChain open_deep_research ถูก archive เป็น read-only ตั้งแต่ 2026-08-21** จึงไม่ควรเริ่มโปรเจกต์ใหม่บนตัวนี้ ([GitHub](https://github.com/langchain-ai/open_deep_research))

| Framework | ดาว | ใช้เมื่อ | API ที่ต้องมี | คำสั่งเริ่มต้น |
|---|---|---|---|---|
| GPT Researcher | ~30.3k | ต้องการ pipeline รายงานที่มี UI (~5 นาที, ~$0.40/รัน) | OpenAI + Tavily | `pip install gpt-researcher` ([GitHub](https://github.com/assafelovic/gpt-researcher)) |
| Stanford STORM / Co-STORM | ~31.7k | บทความสำรวจสไตล์ Wikipedia, มีมนุษย์ร่วมวง | LLM ผ่าน litellm + retriever (Bing/Brave/Tavily/SearXNG…) | `pip install knowledge-storm` ([GitHub](https://github.com/stanford-oval/storm)) |
| dzhng/deep-research | ~19.8k | baseline ขนาดเล็กที่แก้ไขง่าย (breadth × depth) | Firecrawl + OpenAI | `npm install && npm start` ([GitHub](https://github.com/dzhng/deep-research)) |
| Jina node-DeepResearch | ~5.2k | หาคำตอบยาก ๆ (ไม่ใช่รายงานยาว) | Gemini/OpenAI + Jina (ฟรี 1M token) | `npm run dev "query"` ([GitHub](https://github.com/jina-ai/node-DeepResearch)) |
| Tongyi DeepResearch 30B-A3B | ~20.1k | self-host เต็มรูปแบบ, Apache-2.0, ค่ารันถูก | Serper + Jina + DashScope | `bash run_react_infer.sh` ([GitHub](https://github.com/Alibaba-NLP/DeepResearch)) |
| MiroThinker 1.7 | ~8.4k | self-host, context 256K, ใช้ tool ได้ถึง 300 ครั้ง | Serper + Jina + E2B | `uv sync` แล้ว `uv run python main.py …` ([GitHub](https://github.com/MiroMindAI/MiroThinker)) |

แทบทุก framework ต้องพึ่ง search/scrape API แบบเสียเงิน เช่น Tavily, Serper, Firecrawl หรือ Jina API ตัวนี้จึงเป็นค่าใช้จ่ายประจำที่แท้จริงและเป็นตัวกำหนดคุณภาพแหล่งข้อมูล ส่วนคะแนน benchmark ควรอ่านอย่างระมัดระวัง BrowseComp ใกล้อิ่มตัวแล้วและวัดเพียงความสามารถตามหาคำตอบสั้น ๆ แบบ multi-hop บน DeepResearch Bench อันดับ 8 แรกห่างกันไม่ถึง 2.4 คะแนน แต่ citation accuracy ต่างกันถึง 50 คะแนน ([benchmarklist](https://benchmarklist.com/benchmarks/deepresearch_bench/)) และมีงานวิจัยบางชิ้นต้องตัดตัวชี้วัด FACT ทิ้ง เพราะหน้าที่อ้างอิงกลายเป็น 404 จนทำซ้ำผลไม่ได้ ([AgentDisCo arXiv 2605.11732](https://arxiv.org/pdf/2605.11732)) ถ้างานต้องการรายงานที่เชื่อถือได้ ตัวชี้วัด citation faithfulness สำคัญกว่าคะแนน BrowseComp

---

## Search API ราคา $0.30–$15 ต่อ 1k query และ MCP ที่ติดตั้งได้ในบรรทัดเดียว

### ตลาด search API เปลี่ยนแรงในปี 2025–2026

สามเหตุการณ์ที่ผู้สร้าง research agent ต้องรู้ เหตุการณ์แรก **Bing Search API ปิดตัวแล้วเมื่อ 2025-08-11** ตัวทดแทนที่ Microsoft แนะนำคือ "Grounding with Bing Search" ซึ่งคืนผลเป็นคำตอบจาก LLM ไม่ใช่รายการผลค้นดิบ ราคาราว $14 ต่อ 1k ([Linkup blog](https://www.linkup.so/blog/what-s-the-best-alternative-to-the-bing-search-api)) เหตุการณ์ที่สอง **Google Custom Search JSON API ปิดรับลูกค้าใหม่แล้วและจะหยุดทำงาน 2027-01-01** ([Brave: Google API shutdown](https://brave.com/learn/google-api-shutdown/)) เหตุการณ์ที่สาม **Brave ยกเลิก free tier ในเดือนกุมภาพันธ์ 2026** แล้วเปลี่ยนเป็นคิดตามการใช้ที่ $5 ต่อ 1k พร้อมเครดิตฟรี $5 ต่อเดือน ซึ่งต้องผูกบัตร ([implicator.ai](https://www.implicator.ai/brave-drops-free-search-api-tier-puts-all-developers-on-metered-billing/))

| Search API | ราคาต่อ 1k | Free tier | ใช้เมื่อ |
|---|---|---|---|
| Serper (Google SERP) | ~$0.30–1 | – | ผล Google ดิบปริมาณมาก ([kaer.ai](https://kaer.ai/blog/search-api-pricing-cost-per-1000-queries)) |
| Parallel Fast/Basic | $1 / $5 | – | ค้นแบบ agent-native (ข้อมูลจากผู้ขายเอง) ([Parallel](https://parallel.ai/articles/the-honest-2026-comparison-web-search-apis-for-ai-agents)) |
| Brave | $5 | เครดิต $5/เดือน | index อิสระ ราคาถูก ([Brave docs](https://api-dashboard.search.brave.com/documentation/pricing)) |
| You.com | $5 (สูงสุด 100 ผล/ครั้ง) | – | ได้ผลจำนวนมากต่อครั้ง ([You.com](https://you.com/resources/lower-search-api-cost)) |
| Exa | ~$7 (Instant $4, Deep $12, deep-reasoning $15) | $10/เดือน (รายงานขัดแย้งกัน) | ค้นเชิงความหมาย: paper, บริษัท, บุคคล ([Keirolabs](https://keirolabs.cloud/blog/exa-api-pricing-2026)) |
| Tavily | ~$8 PAYG (basic 1 credit, advanced 2) | 1,000 credit/เดือน ไม่ต้องผูกบัตร | ครบในตัว: search + extract + crawl + map ([Tavily docs](https://docs.tavily.com/documentation/api-credits.md)) |
| Claude web search | $10 + token | – | มีในตัว, citation เปิดเสมอ ([Claude docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)) |
| Kagi | $12 (extract $4/1k หน้า) | – | index คุณภาพสูง ไม่มีโฆษณา ([Kagi pricing](https://kagi.com/api/pricing)) |
| Gemini grounding | $14 (Gemini 3, ฟรี 5,000 prompt/เดือน) | มี | ระบบนิเวศ Google ([ecorpit](https://ecorpit.com/agent-web-search-api-cost-comparison-2026/)) |
| Linkup Deep | ~$50–55 | – | ค้นเชิงลึกแบบ premium ([Serpex](https://serpex.dev/alternatives)) |

เครื่องมือที่มีอยู่แล้วใน Claude มักถูกมองข้าม **web fetch ของ Claude ไม่มีค่าใช้จ่ายเพิ่ม** (จ่ายแค่ token) อ่าน PDF ได้ แต่**เรนเดอร์ JavaScript ไม่ได้** และ fetch ได้เฉพาะ URL ที่ปรากฏในบทสนทนาแล้ว เพื่อกันข้อมูลรั่วไหล ([Claude web fetch docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool)) เวอร์ชัน `web_search_20260209` และ `web_fetch_20260209` ขึ้นไปมี **dynamic filtering** ที่ให้ Claude เขียนโค้ดกรองผลค้นก่อนนำเข้า context โดยไม่คิดค่า code execution เพิ่ม ซึ่งช่วยประหยัด token ได้มาก ([Claude code execution docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool); [Simon Willison](https://simonwillison.net/2026/Feb/17/dynamic-filtering/)) ใน Claude Code จึงควรเพิ่ม search MCP ภายนอกเฉพาะเมื่อต้องการค้นเชิงความหมาย (Exa), crawl/extract (Firecrawl, Tavily), เรนเดอร์ JS หรือใช้ปริมาณสูงด้วยต้นทุนต่ำ

### Scraper แบ่งเป็นสามระดับตามความยากของหน้าเว็บ

ลำดับที่แนะนำคือเริ่มจาก fetch แบบ static (Claude web_fetch หรือ Jina Reader) ถ้าเป็นหน้า JS หรือต้อง crawl ให้ใช้ Firecrawl หรือ Crawl4AI ถ้าเจอ login wall, CAPTCHA หรือ anti-bot ให้ใช้ Browserbase หรือ Bright Data **Jina Reader** (`https://r.jina.ai/<url>`) ใช้ได้โดยไม่ต้องมี key ที่ 20 RPM และ key ฟรีได้ 10M token ([Jina Reader](https://jina.ai/reader/)) **Firecrawl** ให้ฟรี 1,000 credit ต่อเดือน และแผน Hobby ราคา $16–19 ต่อเดือนสำหรับ 5,000 credit ([use-apify review](https://use-apify.com/blog/firecrawl-review-2026)) **Crawl4AI** เป็น open source ภายใต้ Apache-2.0 จ่ายแค่ค่า host เอง ([use-apify pricing guide](https://use-apify.com/blog/web-scraping-pricing-guide-all-platforms)) **Browserbase** คิดเงินตามนาทีที่ใช้ browser (มีรายงานว่าฟรี 1,000 นาที และ Starter $100) ส่วน **Bright Data** คิดตาม GB หรือตาม record (Browser API ราว $15/GB) ([apiscout](https://apiscout.dev/guides/best-browser-automation-apis-2026); [Bright Data](https://brightdata.com/blog/ai/best-ai-scraping-tools))

### คำสั่งติดตั้ง MCP สำหรับ research

repo อ้างอิงทางการ `modelcontextprotocol/servers` เหลือ server อ้างอิงเพียง 7 ตัว (everything, fetch, filesystem, git, memory, sequentialthinking, time) ส่วน Brave Search, Puppeteer, GitHub และอื่น ๆ ถูกย้ายไป `servers-archived` ซึ่งไม่ได้รับ security fix อีกแล้ว **จึงควรเปลี่ยนไปใช้ server ที่ผู้ขายดูแลเอง** ([startdebugging.net](https://startdebugging.net/2026/08/migrate-off-archived-mcp-reference-servers/)) ผู้ขายรายใหญ่ส่วนใหญ่มี remote HTTP endpoint แล้ว จึงเพิ่มได้ด้วยคำสั่งบรรทัดเดียวและยืนยันตัวตนผ่าน OAuth

```bash
# --- Search ---
claude mcp add tavily --transport http https://mcp.tavily.com/mcp/ --scope user      # OAuth ในเซสชันใหม่
claude mcp add --transport http exa https://mcp.exa.ai/mcp                           # (รูปแบบคำสั่งยังไม่ยืนยัน) หรือ npm: exa-mcp-server + EXA_API_KEY
claude mcp add brave-search --env BRAVE_API_KEY=xxx -- npx -y @brave/brave-search-mcp-server
claude mcp add perplexity --env PERPLEXITY_API_KEY="xxx" -- npx -y @perplexity-ai/mcp-server
claude mcp add --transport http perplexity https://api.perplexity.ai/mcp --header "Authorization: Bearer KEY"

# --- Scraping / browser ---
claude mcp add --transport http firecrawl https://mcp.firecrawl.dev/v2/mcp           # keyless; /v2/mcp-oauth = tool ครบชุด
claude mcp add playwright -s user -- npx @playwright/mcp@latest                      # หน้า JS-heavy
claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest

# --- Code & docs research ---
claude mcp add -s user -t http deepwiki https://mcp.deepwiki.com/mcp                 # ฟรี ไม่ต้อง auth: ถาม-ตอบ repo GitHub สาธารณะ
claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: xxx"   # (รูปแบบ header ยังไม่ยืนยัน)
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# --- Reference servers (ชื่อแพ็กเกจมาตรฐาน, ยังไม่ยืนยันในรอบนี้) ---
claude mcp add fetch -- uvx mcp-server-fetch
claude mcp add memory -- npx -y @modelcontextprotocol/server-memory
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
```

แหล่งของคำสั่ง: Tavily ([docs](https://docs.tavily.com/documentation/mcp)), Firecrawl ([docs](https://docs.firecrawl.dev/quickstarts/claude-code)), Perplexity ([docs](https://docs.perplexity.ai/docs/getting-started/integrations/mcp-server)), Playwright ([microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)), DeepWiki ([AgentsCamp](https://agentscamp.com/tools/deepwiki-mcp)), Brave ([Firecrawl blog](https://www.firecrawl.dev/blog/best-web-search-mcp)) ใช้ `--scope user` กับเครื่องมือที่ต้องการให้ใช้ได้ทุกโปรเจกต์

### ตัวแยก PDF: Marker และ MinerU นำบน olmOCR-Bench

สำหรับงานที่ต้องอ่านเอกสารจำนวนมาก บน olmOCR-Bench **Marker 2 ได้ 76.0** (2.9 หน้า/วินาที), **MinerU ได้ 72.7** และ **Docling ได้ 50.3** ([MarkTechPost](https://www.marktechpost.com/2026/07/24/datalab-marker-v2-vs-mineru-docling-and-liteparse-benchmark-breakdown/)) เรื่องใบอนุญาตก็ต้องดู MinerU เปลี่ยนจาก AGPL เป็นใบอนุญาตที่อิง Apache-2.0 เมื่อ 2026-04-18 ส่วน weights ของ Marker จำกัดการใช้เชิงพาณิชย์สำหรับองค์กรที่มีทุนหรือรายได้เกิน $5M ([builderai.tools](https://builderai.tools/blog/pdf-parsing-for-rag-mineru-docling-marker-compared)) บริการแบบ managed มีให้เลือกสามตัว **Mistral OCR** ราว $4 ต่อ 1k หน้า ($2 ถ้าใช้ batch), **LlamaParse** $0.00125–0.056 ต่อหน้า (ห่างกัน 45 เท่าตามโหมด) และ **Unstructured** $0.03 ต่อหน้าหลังจากใช้ฟรี 15k หน้าต่อเดือน ([devtoollab](https://devtoollab.com/blog/best-pdf-parsers-for-rag); [Reducto](https://llms.reducto.ai/best-document-processing-apis-2026))

---

## ฐานข้อมูลวิชาการฟรีห้าตัว ร่วมกับ Zotero 8 และ MCP ที่เชื่อมเข้า Claude

### API ฟรีที่เป็นกระดูกสันหลังของงานวิชาการ

**OpenAlex บังคับใช้ API key (ฟรี) ตั้งแต่ 13 ก.พ. 2026** และเปลี่ยนมาใช้งบประมาณการใช้งาน key ฟรีได้งบราว $1 ต่อวัน ส่วนการเรียกโดยไม่มี key ได้เพียงราว $0.01 ต่อวัน การ lookup รายการเดี่ยวไม่เสียงบ ($0) แต่ search เสีย $0.001 และ semantic/full-text เสีย $0.01 ต่อครั้ง ดังนั้น agent ควรใช้ singleton/filter และ cache ผลไว้แทนการ search ซ้ำ ([OpenAlex docs](https://developers.openalex.org/api-reference/authentication); [rate-limit doc](https://developers.openalex.org/api-reference/rate-limits/check-rate-limit-status.md)) OpenAlex ยังเผยแพร่ "API Guide for LLMs" ไว้โดยเฉพาะ ([docs](https://docs.openalex.org/api-guide-for-llms))

| ฐานข้อมูล | Rate limit / key | หมายเหตุ |
|---|---|---|
| OpenAlex | key ฟรี (บังคับ), งบ ~$1/วัน, สูงสุด 100 req/s | ดูแล Unpaywall ด้วย ([OpenAlex](https://developers.openalex.org/api-reference/authentication)) |
| Semantic Scholar | มี key: 1 RPS; ไม่มี key: ใช้ pool รวม 1,000 RPS | ไม่มี key จะเจอ 429 บ่อย ([S2 API](https://semanticscholar.org/product/api)) |
| Crossref | polite pool (`mailto=`): DOI เดี่ยว 10 req/s, list 3 req/s (เริ่ม 1 ธ.ค. 2025) | ตรวจ DOI ได้ถูกที่สุด ([Crossref blog](https://crossref.org/blog/announcing-changes-to-rest-api-rate-limits/)) |
| PubMed E-utilities | ไม่มี key 3 req/s, มี key 10 req/s | ([NLM](https://support.nlm.nih.gov/knowledgebase/article/KA-05318/en-us)) |
| Unpaywall | ต้องส่ง `email=`, ไม่เกิน ~100k/วัน | หา PDF แบบ open access ([Unpaywall](https://unpaywall.org/api/v2)) |
| Scopus | key ฟรีสำหรับงานวิชาการ แต่ view=FULL ต้องมีสมาชิกสถาบัน | ([Elsevier](https://www.elsevier.support/dataasaservice/answer/overview-of-elsevier-apis)) |
| Web of Science Starter | token ฟรี 1 ต่อคน (~5,000 req/วัน ตามเอกสารบุคคลที่สาม) | ([Clarivate](https://developer.clarivate.com/apis/wos-starter)) |
| ThaiJO (TCI) | ทำงานบน OJS, มีทรัพยากร OAI-PMH | สำคัญสำหรับวรรณกรรมไทยที่ OpenAlex/S2 ครอบคลุมน้อย ([ThaiJO](https://www.tci-thaijo.org/en/pages/download)) |

สำหรับผู้วิจัยไทย ThaiJO เป็นแพลตฟอร์มวารสารกลางของประเทศที่ศูนย์ TCI ดูแลบน Open Journal Systems ([ThaiJO About](https://www.tci-thaijo.org/en/pages/about)) เนื่องจากเป็น OJS แต่ละวารสารจึงน่าจะมี endpoint OAI-PMH มาตรฐานที่ `/index.php/<journal>/oai` สำหรับ harvest ข้อมูล แต่ต้องตรวจทีละวารสาร และยังไม่พบ API สาธารณะของ TCI ส่วน Google Scholar ยังไม่มี API ทางการ

### เครื่องมือ AI literature review: หลักฐานหนุน Elicit และ OpenScholar มากที่สุด

**Elicit** มีหลักฐานอิสระรองรับดีที่สุด งาน Hilkenmeier et al. 2025 ทดสอบกับ 43 งานวิจัย 602 จุดข้อมูล พบว่าความแม่นยำในการ extract ข้อมูลอยู่ที่ **81.4% เทียบกับมนุษย์ 86.7%** ซึ่งไม่ต่างกันอย่างมีนัยสำคัญ และเมื่อ Elicit กับมนุษย์ตอบตรงกัน ถูกต้อง 100% ([PMC 40102714](https://pmc.ncbi.nlm.nih.gov/articles/pmid/40102714)) แต่การ extract ซ้ำข้ามบัญชีให้ค่าตรงกัน 90% ขณะที่ quote ที่ใช้สนับสนุนตรงกันเพียง 46% และเหตุผลตรงกันเพียง 30% ([EcoEvoRxiv](https://ecoevorxiv.org/repository/view/9909/)) จึงควรใช้ Elicit เป็นผู้ตรวจคนที่สองเท่านั้น ด้านราคา Elicit Pro ราว $49 ต่อผู้ใช้ต่อเดือน (ข้อมูลจาก aggregator) มี workflow systematic review ที่ screen ได้ราว 5,000 paper ([CostBench](https://costbench.com/software/ai-research-tools/elicit)) **OpenScholar** (UW + Ai2) ตีพิมพ์ใน Nature เมื่อ 4 ก.พ. 2026 ดึงข้อมูลจาก paper open access 45M ชิ้น งานนี้พบว่า GPT-4o แต่ง citation ขึ้นเอง 78–90% ในการทดลอง ขณะที่ OpenScholar มีความถูกต้องของ citation ใกล้เคียงผู้เชี่ยวชาญ และเปิดทั้งโมเดลและ datastore ให้ใช้ ([Newswise/UW](https://www.newswise.com/articles/in-a-study-ai-model-openscholar-synthesizes-scientific-research-and-cites-sources-as-accurately-as-human-experts); [The Scientist](https://www.the-scientist.com/openscholar-an-ai-tool-for-scientific-literature-search-outperforms-chatgpt-and-other-llms-74060)) ในทางตรงข้าม **Consensus** (Pro ราว $10/เดือน) มีรายงานว่า search sensitivity อยู่ที่ราว 39–40% เมื่อเทียบกับการค้นแบบดั้งเดิมในสองงานศึกษา และ SciSpace ยังไม่มีงานศึกษาความแม่นยำอิสระเลย ([CASRAI](https://casrai.org/compare/elicit-vs-consensus)) Ai2 ยังมี **ScholarQA** ที่ใช้ฟรีและ open source ([Ai2 blog](https://allenai.org/blog/ai2-scholarqa)) ข้อสรุปจากหลักฐานคือระบบที่ดึงข้อมูลจากคลัง paper จริง (OpenScholar, PaperQA, Scholar Gateway) ปลอดภัยกว่าการให้ LLM จำ citation เองอย่างชัดเจน

### Systematic review: ASReview ฟรี, Rayyan ราคาถูก, Covidence เป็นมาตรฐานแบบเสียเงิน

**ASReview** เป็น open source ที่ใช้ active learning ช่วย screen มีรายงานว่าลดภาระงานได้ 70–90% แต่ตัวเลขนี้ยังไม่ได้ตรวจยืนยัน ([researchgold](https://researchgold.org/blog/best-systematic-review-software-tools)) **Rayyan** ราคา $4.99–8.33 ต่อ seat ต่อเดือน แผนฟรีทำได้ 3 review แต่ไม่มี PRISMA diagram และฟีเจอร์ AI (ResearchPilot) มีเฉพาะแผนสถาบัน ([AI Agent Index](https://theaiagentindex.com/agents/rayyan)) **Covidence** ราว $339 ต่อ review ต่อปี และทดลองใช้ได้สูงสุด 500 record ([CASRAI](https://casrai.org/guides/covidence)) workflow ที่ป้องกันข้อโต้แย้งได้มีขั้นตอนดังนี้ ลงทะเบียน protocol ค้นผ่าน API (PubMed, OpenAlex, Scopus/WoS) แล้วบันทึก log สำหรับ PRISMA ตัดรายการซ้ำใน Zotero screen ด้วย ASReview หรือ Rayyan โดยมีมนุษย์สองคน ใช้ Elicit ช่วย extract แล้วให้มนุษย์ตรวจ และปิดท้ายด้วย PRISMA 2020 flow diagram

### Zotero 8 คือศูนย์กลาง และ MCP วิชาการที่ควรติดตั้ง

**Zotero 8 ออกเมื่อ 22 ม.ค. 2026** มาพร้อม citation dialog แบบรวม note tab และรองรับ Linux ARM โดยออกเวอร์ชันใหม่ทุก 6–10 สัปดาห์ ([Zotero blog](https://www.zotero.org/blog/zotero-8/)) Zotero เชื่อมเข้า Claude ได้ผ่าน **54yyyu/zotero-mcp** ซึ่งค้นในคลัง อ่าน full-text ดึง annotation จาก PDF และสร้าง note ได้ **กับดักสำคัญคือแพ็กเกจ PyPI ของ fork นี้ชื่อ `zotero-mcp-server`** ถ้ารัน `uvx zotero-mcp` จะได้ server อีกตัวที่ทำได้น้อยกว่า ([mcp.directory guide](https://mcp.directory/blog/zotero-mcp-complete-guide-2026)) ฝั่ง connector ทางการ Claude for Life Sciences มี PubMed และ Wiley Scholar Gateway ([Anthropic news](https://www.anthropic.com/news/claude-for-life-sciences?lang=us))

```bash
# arXiv (เก็บ paper ไว้ที่ ~/.arxiv-mcp-server/papers)
claude mcp add --transport stdio --scope user arxiv -- uvx arxiv-mcp-server

# Zotero (ต้องใช้ Zotero 7+ local API, Python 3.10+) — ระวังชื่อแพ็กเกจ
uv tool install zotero-mcp-server
zotero-mcp setup            # ตั้งค่า Claude Desktop ให้อัตโนมัติ

# Multi-source paper search (arXiv, PubMed, bioRxiv, medRxiv, Google Scholar, Semantic Scholar)
#   repo: github.com/openags/paper-search-mcp  (ปิดแหล่ง Sci-Hub ไว้ เพราะมีความเสี่ยงทางกฎหมาย)
# Semantic Scholar: zongmin-yu/semantic-scholar-fastmcp-mcp-server (ใส่ key ของตัวเองเพื่อเลี่ยง 429)
# PubMed/Entrez: QuentinCody/entrez-mcp-server   |   Unpaywall: dam2452/unpaywall-mcp
# Ai2 Asta: streamable-HTTP https://asta-tools.allen.ai/mcp/v1  (header x-api-key; ข้อมูลมือสอง)
```

แหล่งที่มา: arxiv-mcp-server ([Algolia mirror](https://docsearch.algolia.com/mcp/docs/repo/blazickjp/arxiv-mcp-server)), paper-search-mcp ([mcpservers.org](https://mcpservers.org/en/servers/openags/paper-search-mcp)), Semantic Scholar MCP ([Glama](https://glama.ai/mcp/servers/@zongmin-yu/semantic-scholar-fastmcp-mcp-server/blob/580ed5ab5d51f15d9788e8bc7f56195e0b1558a6/semantic_scholar/utils/http.py)), Asta ([skills.sh](https://www.skills.sh/agents365-ai/365-skills/asta-skill)) MCP ของบุคคลที่สามรันด้วยสิทธิ์ของเครื่องเรา จึงควร pin เวอร์ชันและใช้ API key ของตัวเองเสมอ

---

## ลิงก์ที่ยังเปิดได้ไม่ได้แปลว่าเนื้อหาถูก: ต้องตรวจที่ระดับ claim

ปัญหาที่ใหญ่ที่สุดของ research ด้วย AI ไม่ใช่ URL ปลอม แต่เป็น**การอ้างหน้าเว็บที่มีอยู่จริงและเกี่ยวข้องกับหัวข้อ ทั้งที่หน้านั้นไม่ได้สนับสนุน claim** งาน Rao, Wong, Callison-Burch (เม.ย. 2026) พบว่า URL ถูกแต่งขึ้น 3–13% และเปิดไม่ได้ 5–18% โดย deep research agent แต่ง URL ในอัตราสูงกว่า LLM ที่ใช้ search ธรรมดา ทั้งนี้จำนวน citation ที่มากขึ้นไม่ได้ลดอัตราความผิดพลาดต่อ citation เลย ([arXiv 2604.03173](https://arxiv.org/abs/2604.03173)) ส่วนงาน "Cited but Not Verified" ที่ทดสอบ 14 โมเดลพบว่าลิงก์ใช้ได้และเกี่ยวข้องกับหัวข้อในอัตราสูง แต่ข้อเท็จจริงที่อ้างถูกต้องเพียง 39–77% ([arXiv 2605.06635](https://arxiv.org/html/2605.06635v1)) ReportBench แยกความผิดพลาดเป็นสองแบบ คือ *statement hallucination* (claim บิดเนื้อหาของแหล่งจริง) และ *citation hallucination* (อ้างอิงที่ไม่มีอยู่จริง) และพบกรณีที่ OpenAI Deep Research อ้างงานของผู้เขียนที่ไม่ได้อยู่ใน paper นั้น ([ReportBench](https://arxiv.org/pdf/2508.15804)) นอกจากนี้ Anthropic สังเกตว่า agent ชอบเลือก **SEO content farm** มากกว่าแหล่งที่น่าเชื่อถือ จนต้องเพิ่ม heuristic เรื่องคุณภาพแหล่งไว้ใน prompt ([Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system))

การตรวจ DOI อย่างเดียวจึงไม่พอ เครื่องมือต้องเทียบชื่อเรื่อง ผู้เขียน และปี กับ metadata จาก Crossref, OpenAlex หรือ S2 แต่แม้แต่เครื่องมือเฉพาะทางก็มีจุดอ่อน งานของ Badalova & Mayr (2026) ประเมิน CheckIfExist, HalluCiteChecker, Hallucinator, HalRef และ RefChecker แล้วพบว่าทุกตัวถูกจำกัดด้วยความผิดพลาดในการแยก reference, metadata ที่ไม่ครบ และช่องว่างของฐานข้อมูล ([arXiv 2607.22693](https://arxiv.org/pdf/2607.22693)) ที่น่ากังวลกว่าคือมีรายงานว่า GPT-5.2 ตีธง citation ที่ถูกต้องว่าเป็น hallucination เกือบครึ่ง ([The Decoder](https://the-decoder.com/?p=32935)) **จึงไม่ควรให้ LLM ตัดสินเพียงลำพัง** เครื่องมือที่ใช้ได้มี CheckIfExist (open source, ตรวจ BibTeX แบบ batch กับ Crossref/S2/OpenAlex) ([arXiv 2602.15871](https://arxiv.org/abs/2602.15871)) และ Citation Guard MCP ที่ resolve DOI แล้วเทียบชื่อเรื่องกับ OpenAlex/Crossref ([Glama](https://glama.ai/mcp/servers/n6dyi7grlv))

จากหลักฐานข้างต้น pipeline การตรวจสอบที่แนะนำเรียงจากถูกไปแพงได้หกชั้น ชั้นแรกคือ**ตรวจลิงก์แบบ deterministic** โดย resolve ทุก URL ถ้าไม่ได้ให้ fallback ไปที่ Wayback และตรวจ DOI กับ doi.org/Crossref ขั้นนี้ขั้นเดียวลดลิงก์เสียหรือลิงก์ปลอมได้มาก ([arXiv 2604.03173](https://arxiv.org/abs/2604.03173)) ชั้นที่สองคือ**ตรวจว่าแหล่งสนับสนุน claim จริงหรือไม่** โดย fetch หน้าแล้วถามโมเดลอีกตัวให้ยก quote ที่สนับสนุน หรือตอบ NOT FOUND ชั้นที่สามคือ **Chain-of-Verification แบบ factored** ซึ่งตั้งคำถามตรวจสอบแล้วตอบแยกโดยไม่ให้เห็น draft จึงไม่ลอกความผิดพลาดของ draft มา ([ACL Findings 2024](https://preview.aclanthology.org/add_acl24_videos/2024.findings-acl.212)) ชั้นที่สี่คือ**ให้ subagent ตรวจแบบปฏิปักษ์**ใน context ใหม่ โดยใช้แนว Analysis of Competing Hypotheses และต้องเรียก tool ได้จริง เพราะ judge ที่อ่านอย่างเดียวพลาดความผิดพลาดด้านข้อเท็จจริงและเวลา ([DREAM](https://hyper.ai/de/papers/2602.18940)) ชั้นที่ห้าคือ**รันซ้ำ 2–3 ครั้ง**สำหรับตัวเลขสำคัญ แล้วตีธงจุดที่ผลไม่ตรงกัน ชั้นสุดท้ายคือ**มนุษย์ตรวจด้วย SIFT** (Stop, Investigate, Find better coverage, Trace) และ lateral reading ซึ่งงานวิจัยของ Stanford พบว่านักตรวจข้อเท็จจริงมืออาชีพที่อ่านแบบนี้จับข้อมูลชวนเข้าใจผิดได้ดีกว่านักประวัติศาสตร์และนักศึกษา Stanford ([ACRL C&RL News](https://crln.acrl.org/index.php/crlnews/article/view/26143/34085); [College of DuPage SIFT](https://library.cod.edu/evaluating/SIFT)) กฎง่าย ๆ ที่ใช้ได้คือ claim ที่ข้อสรุปต้องพึ่งพา ต้องมีแหล่งอิสระอย่างน้อยสองแหล่งที่ไม่ได้อ้างกันเอง หรือมีแหล่งปฐมภูมิหนึ่งแหล่ง

การค้นด้วยมือยังมีบทบาทในการเข้าถึงเอกสารปฐมภูมิ operator ของ Google ที่ยังใช้ได้ในปี 2026 คือ `site:`, `filetype:`, `intitle:`, `inurl:`, `"exact phrase"`, `-exclude`, `OR` และ `before:`/`after:` ส่วน `cache:`, `link:` และ `info:` ใช้ไม่ได้แล้ว ให้ใช้ Wayback Machine หรือ archive.today แทน cache ([meshworld 2026](https://meshworld.in/blog/cheatsheets/google-search-operators-cheatsheet/); [GreenGeeks](https://www.greengeeks.com/blog/google-search-operators-full-list-and-examples/)) สำหรับงาน OSINT แนวทางของ Bellingcat คือสืบย้อนวัสดุไปถึงต้นทาง เพราะการ re-upload ทำให้ metadata หายไป และหาแหล่งอื่นมายืนยัน ([IJNet](https://ijnet.org/en/story/fundamentals-open-source-intelligence-journalists)) ส่วน Berkeley Protocol เป็นมาตรฐานด้านการเก็บรักษาหลักฐานดิจิทัล ([Barnard OSINT guide](https://guides.library.barnard.edu/misinformation/osint))

---

## ตัวเลขต้องมาจากโค้ด ส่วนความจำระยะยาวเก็บใน vault ที่ agent อ่านได้

กฎข้อเดียวที่สำคัญที่สุดของชั้นวิเคราะห์คือ **LLM ห้ามคำนวณในข้อความร้อยแก้ว** สถิติทุกตัวในรายงานต้องมาจากโค้ดที่ทำซ้ำได้ ผ่าน Jupyter หรือ code execution ของ Claude ด้วย pandas, Polars หรือ DuckDB และต้องบันทึกแหล่งข้อมูลไว้ code execution ของ Claude ใช้ฟรีเมื่อทำงานร่วมกับ web search/fetch และทำหน้าที่กรองผลก่อนนำเข้า context ด้วย ([Claude code execution docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool)) **NotebookLM** เหมาะเป็นชั้นตรวจสอบแบบคลังปิด ให้อัปโหลดแหล่งปฐมภูมิที่ตรวจแล้วเข้าไป แล้วถามว่าแหล่งเหล่านั้นยืนยัน claim หรือไม่ มีรายงานว่าใส่แหล่งได้ 50 ต่อ notebook ในแผนฟรี 300 ในแผน AI Pro และ 600 ในแผน Ultra (ตัวเลขยังขัดแย้งกัน ควรตรวจกับ Google) ([DigitalOcean](https://www.digitalocean.com/resources/articles/what-is-notebooklm)) สำหรับงานเชิงคุณภาพ ATLAS.ti มี AI Coding (beta) ที่เสนอโครงสร้าง code ข้ามเอกสารได้ แต่ผู้วิจัยยังต้องเป็นเจ้าของ codebook และตรวจทุกข้อเสนอเอง ([Delve](https://delvetool.com/blog/ai-features-in-qda-software)) ส่วน NVivo เหมาะกับงาน mixed-methods ที่มนุษย์ควบคุมเข้มงวด แต่ฟีเจอร์ AI จำกัดกว่า ทั้งนี้แหล่งข้อมูลที่ประเมินสองตัวนี้เป็นผู้ขายคู่แข่ง ([Energent](https://www.energent.ai/use-cases/en/compare/ai-tools-for-thematic-analysis))

ด้านความจำระยะยาว **Obsidian เชื่อมกับ Claude ผ่าน MCP ของชุมชน**ที่ใช้ปลั๊กอิน Local REST API ข้อมูลจึงอยู่ในเครื่องทั้งหมด บาง server มีมากกว่า 35 tool เช่น frontmatter, backlink และ full-text search ([SMU Libraries](https://library.smu.edu.sg/topics-insights/what-if-your-ai-could-read-your-notes-claude-desktop-obsidian-mcp); [Glama Obsidian](https://glama.ai/mcp/best/obsidian)) รูปแบบที่แนะนำคือเขียนโน้ตหนึ่งไฟล์ต่อหนึ่งแหล่ง (citation, quote พร้อม locator, ผลประเมิน SIFT) และหนึ่งไฟล์ต่อหนึ่ง claim ที่ลิงก์ไปยังแหล่ง แล้วให้ agent อ่านเขียนผ่าน MCP ซึ่งตรงกับหลัก "external memory" ที่ Anthropic ใช้ในระบบของตัวเอง

---

## สแต็กแนะนำสามระดับ พร้อม workflow และโครงสกิลที่สร้างเองได้

### สามระดับงบประมาณ

| ชั้น | ฟรี ($0) | มืออาชีพ (~$20–50/เดือน) | ขั้นสูงสุด ($100+/เดือน) |
|---|---|---|---|
| สกิล/ปลั๊กอิน | `deep-research` (sync), K-Dense, Imbad0202, Weizhena, superpowers | เหมือนกัน + `bio-research`/`data` plugins | เหมือนกัน + สกิลที่สร้างเองพร้อม eval |
| Deep research agent | Claude Research (มีในแผน Pro), GPT Researcher/STORM self-host | + ChatGPT Plus หรือ Perplexity Pro สำหรับ cross-check | + Gemini DR Max API / `o3-deep-research`, Tongyi/MiroThinker self-host |
| Search | Claude WebSearch ในตัว, Tavily ฟรี 1k, Exa ฟรี | Exa (~$7/1k) หรือ Brave ($5/1k) เป็นหลัก, Serper สำหรับปริมาณมาก | + Exa Deep/Parallel/Tavily Research, Perplexity Sonar, Kagi |
| Scrape/เอกสาร | WebFetch, Jina Reader, Crawl4AI, Firecrawl ฟรี, Docling/Marker local, Playwright MCP | + Firecrawl Hobby ($16–19) | + Browserbase/Bright Data, Mistral OCR, LlamaParse Agentic |
| วิชาการ | OpenAlex, S2, Crossref, PubMed, Unpaywall, arXiv MCP, ThaiJO OAI | + Consensus Pro (~$10) หรือ Elicit (ใช้แผนฟรีก่อน) | + Elicit Pro (~$49), Covidence (~$339/review), Scopus/WoS ผ่านสถาบัน |
| อ้างอิง/ตรวจสอบ | Zotero 8 + zotero-mcp, CheckIfExist, ASReview | + Rayyan ($4.99–8.33/seat) | + citation gate ใน pipeline อัตโนมัติ |
| วิเคราะห์/ความจำ | Claude code execution, DuckDB/Polars, Obsidian MCP, NotebookLM ฟรี | + NotebookLM AI Pro | + ATLAS.ti/NVivo สำหรับงานเชิงคุณภาพ |

ราคาในตารางสังเคราะห์จากแหล่งในหัวข้อก่อนหน้า ([Tavily](https://docs.tavily.com/documentation/api-credits.md); [Keirolabs](https://keirolabs.cloud/blog/exa-api-pricing-2026); [Firecrawl review](https://use-apify.com/blog/firecrawl-review-2026); [CostBench Elicit](https://costbench.com/software/ai-research-tools/elicit); [CASRAI Covidence](https://casrai.org/guides/covidence)) ผู้ใช้ส่วนใหญ่ควรเริ่มจากชั้นฟรี แล้วเพิ่ม Exa หรือ Brave เป็น search หลักเมื่อพบว่าผลค้นเชิงความหมายไม่พอ การจ่ายเงินมากขึ้นได้ความกว้างของแหล่งข้อมูล แต่ไม่ได้ความถูกต้องมาโดยอัตโนมัติ ความถูกต้องมาจากชั้นตรวจสอบเท่านั้น

### Workflow อ้างอิงหกขั้น

pipeline ที่แนะนำสำหรับ Claude ประกอบด้วยหกบทบาท **Scoper** ถามคำถามเพื่อขยายความ แล้วเขียน research brief ที่ระบุคำถาม คำถามย่อย ขอบเขต วันตัดข้อมูล และรูปแบบผลงาน **Lead** แตกงานเป็นคำถามย่อย 3–8 ข้อที่ไม่ทับซ้อนกัน เลือกงบตามกฎปรับขนาดงาน แล้วบันทึกแผนลงไฟล์ **Researcher subagent** หลายตัวทำงานขนาน ตัวละราว 10–15 tool call และเขียนโน้ตลงไฟล์ตาม schema "ข้อค้นพบพร้อม URL / ข้อสันนิษฐาน / ช่องว่าง" **Verifier** รันการตรวจหกชั้นข้างต้น **Writer** เขียนจากโน้ตที่ตรวจแล้วเท่านั้น โดยแยกส่วนความไม่แน่นอนไว้ชัดเจน และ **Eval** ใช้ชุดคำถามมาตรฐาน 20 ข้อขึ้นไปกับ rubric ห้าเกณฑ์ เพื่อคุมต้นทุน ให้ lead เป็นโมเดลระดับ Opus และ subagent เป็นระดับ Sonnet จำกัดจำนวน subagent และ tool call ต่อคำถาม และเปิด dynamic filtering ไว้เพื่อกัน HTML ดิบไม่ให้เข้า context ([Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system); [Anthropic context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents))

### โครงสกิล research ที่สร้างเองได้

ถ้าต้องการสกิลที่ปรับให้เข้ากับงานของตัวเอง ให้ทำตามกฎการเขียนสกิลของ Anthropic คือ SKILL.md ไม่เกิน 500 บรรทัด อ้างอิงไฟล์ลึกเพียงชั้นเดียว เขียน `description` บอกทั้งว่าสกิลทำอะไรและใช้เมื่อไร (ไม่เกิน 1,024 ตัวอักษร และใน Claude Code จะถูกตัดที่ 1,536 ตัวอักษรรวม `when_to_use`) และสร้าง eval อย่างน้อยสามสถานการณ์ก่อนเขียนสกิล ([platform.claude.com best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices); [code.claude.com skills](https://code.claude.com/docs/en/skills)) ใช้ `skill-creator` ของ Anthropic ช่วย benchmark การ trigger ได้ ([anthropics/skills](https://github.com/anthropics/skills)) จุดที่ให้ผลคุ้มที่สุดคือสคริปต์ตรวจ citation แบบ deterministic เพราะการให้ LLM ตรวจตัวเองพลาด URL ที่แต่งขึ้น

```text
web-research/
├── SKILL.md                     # คำสั่ง orchestrator (<500 บรรทัด)
├── references/
│   ├── researcher.md            # brief ที่ส่งให้ subagent ทุกตัว
│   ├── source-quality.md        # ลำดับชั้นแหล่ง: ปฐมภูมิ > peer-reviewed > สื่อน่าเชื่อถือ > บล็อก; สัญญาณอันตราย
│   └── report-template.md       # แม่แบบรายงานแบบเข้มงวด
├── scripts/
│   ├── check_citations.py       # ทุก claim มี [Source](URL) และ URL ตอบ HTTP 200
│   └── dedupe_sources.py
└── agents/web-researcher.md     # (เฉพาะ Claude Code) tools: WebSearch, WebFetch, Write; model: sonnet
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
1. Scope: simple fact → 1–3 searches, no subagents; comparison → 3–5 subagents; broad review → 5–10 subagents + research/plan.md
2. Plan: research/plan.md — question, sub-questions, per-subagent objective, boundaries, output path
3. Delegate in parallel with references/researcher.md; ≤15 tool calls; every claim as `claim — [Source](URL)`; unknowns → Gaps
4. Verify: python3 scripts/check_citations.py research/notes/ ; ≥2 independent sources or mark "single-source"; record contradictions
5. Write with references/report-template.md: summary → findings → conflicts → gaps → sources (with access date)
```

วางโฟลเดอร์ไว้ที่ `~/.claude/skills/` สำหรับ Claude Code, `~/.codex/skills/` สำหรับ Codex หรือ `~/.agents/skills/` สำหรับ Gemini CLI และใช้ร่วมกันข้ามเครื่องมือ แล้วเรียกด้วย `/researching-the-web <topic>` ใน Claude Code หรือ `$researching-the-web` ใน Codex ([code.claude.com skills](https://code.claude.com/docs/en/skills)) ก่อนติดตั้งสกิลจากภายนอกทุกครั้ง ต้องอ่านสคริปต์และคำสั่งที่เรียกเครือข่ายก่อน เพราะสกิลที่เป็นอันตรายสามารถส่งข้อมูลออกไปได้ และ Anthropic ระบุชัดว่าไม่ได้ควบคุมเนื้อหาของปลั๊กอินบุคคลที่สาม ([Anthropic Engineering](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills); [claude-plugins-official](https://github.com/anthropics/claude-plugins-official))

---

## Conclusion

ข้อค้นพบที่เปลี่ยนวิธีคิดมากที่สุดคือ ช่วงปี 2025–2026 ความได้เปรียบได้ย้ายจาก "ใครค้นได้มากกว่า" ไปเป็น "ใครตรวจได้เข้มกว่า" แล้ว ข้อนี้มีหลักฐานสามชุด BrowseComp อิ่มตัวที่ราว 92% ขณะที่ความถูกต้องระดับ claim ยังค้างอยู่ที่ 39–77% จำนวน citation ไม่สัมพันธ์กับคุณภาพ และ LLM ที่ใช้เป็นผู้ตรวจก็ตีธงผิดได้เกือบครึ่ง ข้อสรุปเชิงปฏิบัติคือ ส่วนที่มีค่าที่สุดในสแต็ก research ไม่ใช่ search API ราคาแพงหรือ deep research agent ตัวใหม่ แต่คือ**ด่านตรวจแบบ deterministic** (สคริปต์ resolve URL/DOI แล้วจับคู่ metadata) ต่อด้วย**การตรวจว่าแหล่งสนับสนุน claim จริงโดยโมเดลที่ไม่เห็น draft** สกิลที่ฝังกลไกนี้ไว้แล้ว เช่น citation gate ของ Imbad0202 จึงคุ้มค่ากว่าสกิลที่เพียงแตก subagent ได้มากกว่า

ภาพรวมของระบบนิเวศก็บอกทิศทางเช่นกัน Anthropic เลือกส่งความสามารถ research ผ่าน connector และปลั๊กอินแทน SKILL.md มาตรฐานเปิดทำให้สกิลพกพาข้ามเครื่องมือได้ แต่ subagent กับ hook ยังผูกกับแพลตฟอร์ม และ API สำคัญ (Bing, Google CSE, LangChain ODR, free tier ของ Brave) ปิดตัวหรือเปลี่ยนเงื่อนไขภายในปีเดียว ผู้ที่สร้าง workflow ระยะยาวจึงควรแยกชั้นเครื่องมือออกจากชั้นวิธีวิทยา ให้ brief, rubric และสคริปต์ตรวจอยู่ใน `references/` และ `scripts/` ที่ไม่ขึ้นกับผู้ขาย แล้วถือว่า search/scrape provider เป็นชิ้นส่วนที่เปลี่ยนได้ สำหรับผู้วิจัยไทย ช่องว่างที่ยังไม่มีใครเติมคือ MCP หรือสกิลสำหรับ ThaiJO/TCI ผ่าน OAI-PMH ซึ่งเป็นโอกาสในการสร้างเครื่องมือเองที่คุ้มค่า เพราะฐานข้อมูลสากลยังครอบคลุมวรรณกรรมไทยได้น้อย
