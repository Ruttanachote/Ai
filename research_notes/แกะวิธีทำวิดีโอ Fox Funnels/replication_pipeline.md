# Replicating an AI-Driven Funnel/Marketing Video Pipeline (Fox Funnels-style), late 2026

> Research date: 2026-11-01. Method note: fox-funnels.com, heygen.com and cinerads.com could not be fetched (the session's network sandbox blocks those hosts). Most findings come from web-search result summaries of the pages cited. Many sources are vendor or affiliate blogs (e.g. Creatify writing about HeyGen/Arcads pricing, Submagic writing about Opus Clip), so treat prices as indicative and **check each vendor's pricing page before budgeting**. Where sources disagreed, both versions are noted.

## Q0. What does Fox Funnels itself use?

### Takeaway
Nothing could be confirmed. The site was unreachable from this session, and a web search for "Fox Funnels" returned no indexed agency by that name, only unrelated firms with similar names.

### Cited Findings
- A search for "Fox Funnels" agency video turned up only unrelated companies (Fox Agency, a B2B tech PR firm; Fox and Roach, a real-estate brokerage; Seven Figure Agency's "Ultimate Agency Funnel"). None was a funnel/video agency called Fox Funnels. — [Fox Agency](https://frontify.com/en/partners/fox-agency); [Seven Figure Agency](https://sevenfigureagency.com/successful-agency-funnels/)

### Inferences
- Fox Funnels is probably a small or regional (possibly Thai) agency with little search footprint. The rest of these notes therefore describe the industry-standard stack it most likely resembles.

### Gaps
- Any tools Fox Funnels names on its site. To close this, allow fox-funnels.com in the session's network settings and re-fetch, or have the user paste the page text.

## Q1. Which tools are used at each stage, and what do they cost?

### Takeaway
The standard 2026 stack is:
1. An LLM (Claude/ChatGPT) for angles and scripts.
2. ElevenLabs (or a local TTS vendor) for voice.
3. An avatar or UGC tool (HeyGen, Arcads, Creatify) or a generative video model (Veo 3.1, Kling 3.0) for footage. Sora 2's API appears to have been retired in Sept 2026.
4. Submagic, Opus Clip or CapCut for captions and editing.
5. Creatomate, Shotstack or ffmpeg for templated bulk rendering.

Entry plans run roughly $15–$110/month per tool. Video-model APIs cost about $0.03–$0.40 per second of output.

### Cited Findings
**Avatar / talking-head**
- HeyGen 2026: free tier (3 videos/mo, watermark), Creator about $29/mo, Pro usually listed at $49/mo (one source says $99), Business $149/mo, Enterprise custom. The Team plan was deprecated in Jan 2026 and replaced by Business. Unused credits roll over one billing cycle. API access is billed separately from subscriptions. — [Creatify on HeyGen pricing](https://creatify.ai/blog/heygen-pricing-(2026)-plans-and-what-you-ll-actually-pay); [eesel](https://eesel.ai/blog/heygen-pricing); [Arcade](https://www.arcade.software/post/heygen-pricing)
- HeyGen's current flagship avatar model is marketed as "Avatar V". — [HeyGen translate page](https://www.heygen.com/translate/thai-to-english)

**AI UGC actors**
- Arcads has no public pricing page (arcads.ai/pricing returns a 404). Prices appear only inside the app.
  - Reported tiers: Lite $29 (1,800 credits); Starter $110 list (8,000 credits); Creator $220 (16,000 credits); Pro $550 (48,000 credits). A limited-time 30% promo seen on Aug 24, 2026 showed $77/$154/$385.
  - A talking-actor ad costs 800 credits per minute per actor, and each clip rounds up to a full minute. A captioned one-actor ad costs about 880 credits.
  - Credits are refunded on technical failures.
  - — [Creatify on Arcads pricing](https://creatify.ai/blog/arcads-pricing-(2026)-plans-credits-and-what-you-ll-actually-pay); [eesel](https://eesel.ai/blog/arcads-ai-pricing); [Wireflow](https://www.wireflow.ai/blog/arcads-pricing)
- Entry prices conflict: Dupple says Arcads costs "from $99/mo". — [Dupple](https://dupple.com/tools/arcads-ai)
- Comparative entry prices per eesel: Creatify $19, Zeely $25, Arcads $110, MagicUGC $149 per month. — [eesel](https://eesel.ai/blog/arcads-ai-pricing)

**Generative video models (APIs)**
- Sora 2 cost $0.10/s (720p), and Sora 2 Pro cost up to $0.70/s (1080p). The OpenAI API sunset date was **Sept 24, 2026**, so Sora 2 is likely unavailable via API now. **Treat any Sora-based tutorials as outdated.** — [invideo AI video model pricing (Aug 2026)](https://invideo.io/blog/ai-video-model-pricing); [modelslab](https://modelslab.com/blog/api/veo-3-1-vs-kling-3-sora-2-ai-video-api-cost-2026)
- Veo 3.1 on Vertex AI: about $0.20/s without audio and $0.40/s with audio. Veo 3.1 Fast is about $0.10/s, and Veo 3.1 Lite about $0.05/s at 1080p. A $0.03/s figure for Lite at 720p is unconfirmed. — [invideo](https://invideo.io/blog/ai-video-model-pricing); [cometapi](https://www.cometapi.com/ai-video-api-pricing/)
- Kling 3.0 bills per 5s or 10s clip rather than per second. Resellers quote about $0.07–$0.14/s, but these are not official Kling rates. — [aireiter Kling 3 pricing](https://aireiter.com/blog/kling-3-api-pricing-guide-2026)

**Voice**
- ElevenLabs bills 1 credit per character on Multilingual v2/v3. A July 2026 table lists these plans: Starter $6 (60k chars), Creator $22 (220k), Pro $99 (990k), Scale $299 (2.99M). Another source lists a $990 Business tier. — [invideo TTS pricing (Aug 2026)](https://invideo.io/blog/ai-voice-model-pricing/); [Fora Soft](https://www.forasoft.com/learn/ai-for-video-engineering/articles-ai/elevenlabs-pricing-voice-cloning-no-fakes-act)
- The v3 API is about $100 per 1M characters, pay-as-you-go. One timeline reports a "v3 Conversational" voice at half price, plus an Oct 2026 "Eleven v4" launch with a 20% TTS price cut (**unverified, one source only**). — [usagepricing timeline](https://www.usagepricing.com/blueprint/activity/elevenlabs-2026-09-28-v3-conversational-dubbing-v2); [LLM Reference](https://www.llmreference.com/model/eleven-v3/elevenlabs)

**Editing / captions / clipping**
- Submagic: free plan available; paid plans run $19/mo (Starter) to $88/mo. — [costbench](https://costbench.com/software/ai-video-editing-saas/submagic/); [typito](https://typito.com/blog/submagic-alternative-submagic-ai-review/)
- Opus Clip: free tier gives 90 min/mo with a watermark; paid plans start around $15/mo (about $14.50/mo billed annually). — [Bytecap comparison](https://www.bytecap.io/blog/opusclip-vs-submagic-vs-bytecap-2026); [Submagic on Opus pricing](https://www.submagic.co/blog/opus-clips-pricing)
- One roundup calls the "mature 2026 stack" Opus Clip for clip-picking, Submagic for polish, and Vizard for bulk overflow. Captions.ai is positioned for face-to-camera creators. — [Bytecap](https://www.bytecap.io/blog/opusclip-vs-submagic-vs-bytecap-2026)

**Programmatic rendering**
- Shotstack:
  - Pay-as-you-go is $0.30 per rendered minute.
  - Subscriptions start at $39/mo (about $0.20/min). The Scale plan is $199 for 2,000 credits (about $0.10/min, 4K allowed). A 10k-credit pack is $700 (about $0.07/min).
  - Credits are lost on cancel.
  - — [Shotstack pricing](https://shotstack.io/pricing/); [Wireflow](https://www.wireflow.ai/blog/shotstack-pricing)
- Creatomate:
  - Credits scale with resolution, fps and length. The $41 entry tier yields about 144 min at 720p ($0.28/min), falling to about $0.06/min on large tiers.
  - It gets expensive at 4K (up to about $1.93/min).
  - Renders are hosted for 30 days.
  - — [Creatomate blog](https://creatomate.com/blog/the-best-video-generation-apis); [Wireflow comparison](https://www.wireflow.ai/blog/creatomate-vs-shotstack); [Banuba](https://www.banuba.com/blog/creatomate-alternative)
- TikTok's own free **Symphony** suite generates AI avatars and voiceovers inside TikTok Ads Manager. — [commonthreadco](https://commonthreadco.com/blogs/coachs-corner/tiktok-ai-ad-disclosure-rules-ecommerce-2026)

### Inferences
- A lean starter stack costs roughly **$150–$300/month**: Claude or ChatGPT ($20) + ElevenLabs Creator ($22) + HeyGen Creator ($29) or Creatify ($19) + Submagic ($19–$39) + CapCut (free or low-cost), plus pay-per-second Veo/Kling usage for B-roll.
- An agency stack adds Arcads ($110+), HeyGen Business ($149), and a Shotstack or Creatomate subscription ($39–$199) for templated bulk rendering.
- For highest volume at lowest marginal cost, self-hosted ffmpeg or Remotion avoids per-minute fees. No pricing was gathered for Remotion's company license.

### Gaps
- Official prices for Synthesia, Creatify (full tiers), Captions.ai, Higgsfield, Runway, CapCut Pro, Descript and Remotion were not retrieved because of the tool-call budget and the network block.
- HeyGen's official pricing page could not be fetched; the figures above come from third parties.

## Q2. What script frameworks are standard for VSLs and short ads?

### Takeaway
For short ads, the workhorses are AIDA and PAS, with the hook (first 3–5 s) treated as its own unit. For long-form VSLs, the reference is Jon Benson's "3X VSL Formula" (Benson is widely credited with inventing the VSL). Its exact steps were not found in a primary source.

### Cited Findings
- AIDA (Attention, Interest, Desire, Action) is "a simple four-step flow" usable for almost anything. — [Crazy Egg AIDA vs PAS](https://www.crazyegg.com/blog/aida-vs-pas/)
- PAS (Problem, Agitate, Solution): agitation is "the most overlooked step". — [Crazy Egg](https://www.crazyegg.com/blog/aida-vs-pas/)
- For short-form video, AIDA and PAS are cited as the two most reliable frameworks. — [Billo ad script formulas](https://billo.app/?p=13340)
- "The only job of a good hook is to earn you another three to five seconds." — [Hooked.so](https://www.hooked.so/blog/script-for-advertising)
- Jon Benson is credited with inventing the video sales letter. His method is branded the "3X VSL Formula" and taught via courses. (The same site includes dubious bio claims, so use it with caution.) — [Born To Influence](https://borntoinfluence.com/jonbenson/)
- Benson has more recently argued that AI-written content underperforms when it lacks persuasion grounded in audience values. — [Podcast transcript](https://podcasts.happyscribe.com/right-about-now-legendary-business-advice/why-ai-content-isn-t-converting-john-benson-on-persuasion-values-what-actually-converts)

### Inferences
- A practical template for LLM prompting:
  - **Short ad (15–45 s):** Hook (0–3 s) → Problem → Agitate → Solution/product demo → Proof (testimonial or number) → CTA.
  - **VSL (3–20 min):** Pattern-interrupt hook → story/problem → "big idea" or unique mechanism → proof → offer stack → guarantee → urgency → CTA (repeated).
- Agencies typically keep the body fixed and generate many hooks (10–20 per script) for testing, consistent with the variant workflows in Q3.

### Gaps
- No primary source gave the step-by-step "3X VSL Formula" or a canonical hook-formula list (e.g. call-out, negative, curiosity, statistic). This would need Benson's own material or creator videos.

## Q3. How do agencies automate high-volume variant creation?

### Takeaway
The dominant pattern is n8n (or Make/Zapier) orchestrating several steps:
1. A Google Sheet acts as the brief/content database.
2. An LLM writes N script/hook variants.
3. An image model (NanoBanana) creates a consistent character or product frame.
4. Veo 3.1, Kling or HeyGen generates the video clips via API (often through fal.ai).
5. ffmpeg (or Creatomate/Shotstack) stitches and captions the output into 9:16 ads.

Paid templates sell for about $20.

### Cited Findings
- One n8n pipeline chains NanoBanana Pro, Veo 3.1, FFmpeg and fal.ai to make 60-second ads with a consistent character. For volume, the Veo 3.1 block is duplicated 7–8 times, with dialogue and context passed along while the character frame stays fixed. — [Stork.ai](https://www.stork.ai/blog/ko/this-ai-creates-perfect-60-second-ads); [aireiter n8n + Veo3 + NanoBanana](https://aireiter.com/blog/ai-ugc-ads-automation-no-code-workflow-n8n-veo3)
- Templates treat the video model as swappable: "swap the Sora 2 generation section with any AI video API: Veo 3, Runway, Kling AI, HeyGen". HeyGen is used where pre-defined avatar characters are needed. — [growwstacks](https://growwstacks.com/blog/ai-ugc-video-ads-veo-n8n/); [Gumroad template](https://elitesolutions1.gumroad.com/l/AIUGCAd)
- Some templates return up to 3 finished, captioned 9:16 UGC ads per submission. Another uses o3 for scripts and Google Sheets as the database to "spin 10–20 variants from one winning script in minutes". — [videobgremover n8n](https://videobgremover.com/n8n/ugc-ad-generator); [Automation Exchange](https://theautomationexchange.beehiiv.com/p/issue-44-krystian-s-ai-video-ad-agent)
- A claimed $1/video cost is a seller claim, not verified. — [aireiter](https://aireiter.com/blog/ai-ugc-ads-automation-no-code-workflow-n8n-veo3)

### Inferences
- A replicable architecture:
  1. Intake form or Sheet row (product, offer, audience, angle).
  2. LLM node generates angles → scripts → hook variants in JSON.
  3. TTS (ElevenLabs API) or native audio (Veo 3.1 with audio).
  4. Avatar/video API (HeyGen API or Arcads, or Veo/Kling via fal.ai).
  5. Template render (Creatomate/Shotstack JSON template, or ffmpeg/Remotion) with captions, logo and CTA end-card.
  6. Upload to Drive.
  7. Optionally push to Meta/TikTok via their Ads APIs. Not researched here.
- **Sora-based templates must be ported** because the Sora 2 API was retired in Sept 2026.

### Gaps
- No primary documentation was retrieved on Meta Marketing API or TikTok API bulk-upload automation, or on how agencies structure creative tests (e.g. ABO/CBO, Advantage+ creative testing).

## Q4. Cost and time per video: AI agency vs traditional production

### Takeaway
AI UGC/avatar videos cost about **$1–$30 per video** in tool spend. A human UGC creator costs about **$150–$500** per video, or about $350–$800 once labor is included. AI waste (rejected generations) and review time narrow the gap. No controlled performance comparison was found.

### Cited Findings
- Human creator videos typically cost $150–$500. One roundup puts the average creator deliverable at about $198 in 2025, down 44% year over year. — [Cinerads cost breakdown](https://www.cinerads.com/blog/cost-ugc-creator-vs-ai); [knowlify](https://knowlify.com/articles/ai-ugc-vs-creator-ugc-cost)
- AI UGC estimates: about $5–$30 per video in one analysis; about $1–$12 per short avatar video on published plan pricing (Oct 2026) versus about $100–$200 per creator video in another. — [invideo AI UGC vs creators](https://invideo.io/blog/ai-ugc-ads-vs-hiring-creators/); [thesocialoutline](https://thesocialoutline.com/blog/ai-ugc-cost)
- Hidden creator labor (about $100–$200 at $50/hr) pushes a $200 video to about $350–$800 in total. — [knowlify](https://knowlify.com/articles/how-much-does-ugc-cost)
- One vendor-affiliated source says about 85% of generated clips are rejected before final assembly, so benchmarks should count discarded generations. — [segwise](https://segwise.ai/blog/ai-ugc-vs-human-ugc-meta-ads-roas-2026)
- For a single authenticity-critical hero ad, a creator may still be worth the premium. None of the sources ran a controlled AI-vs-creator test, and a claimed "47% CTR lift" is vendor-cited. — [segwise](https://segwise.ai/blog/ai-ugc-vs-human-ugc-meta-ads-roas-2026); [adcreate](https://adcreate.com/blog/ai-ugc-video-generation-replacing-traditional-ugc)
- One Shopify-focused guide claims 30 AI UGC ads produced in an hour (vendor claim). — [oakgen](https://oakgen.ai/blog/ai-ugc-ads-shopify-30-in-an-hour)
- Guidance on pricing AI UGC services to clients exists, from AI-UGC-as-a-service sources. — [motionbox](https://motionbox.io/blog/how-much-to-charge-clients-for-ai-ugc-ads); [ciela](https://ciela.ai/blogs/ai-ugc-as-a-service-for-agencies)

### Inferences
- Worked examples:
  - **30 s Arcads ad:** rounds up to one minute = 800–880 credits. On Starter (8,000 credits at $110) that is about $11–$12 per ad.
  - **30 s Veo 3.1 Fast clip:** about $3.
  - **Shotstack render:** about $0.10–$0.30.
- Use "cost per *usable/launched* ad" (total spend ÷ ads launched) as the KPI.

### Gaps
- No reliable time-per-video benchmarks (hours of human editing per AI ad) from independent sources.
- No traditional long-form VSL production cost figures were found.

## Q5. Legal and platform considerations (AI disclosure, likeness)

### Takeaway
Meta, TikTok and Thailand's consumer-protection regulator all now expect disclosure of realistic AI-generated ad content. Both platforms auto-detect C2PA metadata. Using a real person's likeness or voice without consent (fake doctor or celebrity endorsements) is the highest-risk practice. Sources are mostly secondary, so verify against official policy pages.

### Cited Findings
**Meta**
- AI creative is allowed; the policy is about disclosure, not prohibition. If C2PA metadata shows third-party AI generation or editing, Meta auto-applies an "AI info" label. Ads made with Meta's own generative tools are also auto-labeled. — [almcorp](https://almcorp.com/news/meta-ai-labels-facebook-instagram-ads-disclosure-2026/); [commonthreadco](https://commonthreadco.com/blogs/coachs-corner/meta-ai-ad-labels-mandatory-disclosure-ecommerce-2026)
- When there is no C2PA metadata and the content is photorealistic synthetic media, advertisers are expected to use Meta's built-in AI disclosure control. The label appears under "About this ad". — [Cinerads Meta policy](https://www.cinerads.com/blog/ai-ugc-facebook-ad-policy)
- Political and social-issue ads require explicit AI disclosure. Sources disagree on whether minor edits need a label. — [novoads](https://novoads.ai/en/blog/ai-ad-label-rules-2026); [1clickreport](https://www.1clickreport.com/blog/meta-ad-policy-changes-2026-compliance-guide)

**TikTok**
- Reported: on **July 21, 2026**, TikTok updated its ad policies to require disclosure labels on AI-generated content in ads, including avatar ads. It uses C2PA to auto-detect AI material made elsewhere. — [commonthreadco TikTok](https://commonthreadco.com/blogs/coachs-corner/tiktok-ai-ad-disclosure-rules-ecommerce-2026); [Stellar Search](https://www.stellarsearch.co.uk/insight/tiktoks-ai-ad-disclosure-rules-are-live-what-brands-running-ai-creative-need-to-do-now)
- Mechanism: an AI-generated content toggle or "AI Disclosure" tag at the ad level in Ads Manager, or a visible on-creative label. Minor edits (colour, crop, reframing) and AI captions are reportedly exempt. — [novoads TikTok](https://novoads.ai/en/blog/tiktok-ai-ad-disclosure-rules); [auditsocials](https://auditsocials.com/blog/tiktok-ai-content-disclosure-rules-2026)
- Conflict: one guide claims photoreal avatar product reviews need no label, contradicting most other sources. Some sources say AI-generated endorsements or public-figure endorsements are banned regardless of labeling. — [kompozy](https://kompozy.io/guides/ai-ugc-ads-for-tiktok); [pixo](https://pixo.video/blog/tiktok-ai-label-compliance-guide)
- A March 2026 report argued that TikTok's enforcement of AI ad rules was failing in practice. — [ainauten](https://news.ainauten.com/en/story/tiktoks-policy-for-ai-ads-isnt-working)

**Likeness / voice**
- Voice cloning and likeness consent are discussed in relation to the US NO FAKES Act. — [Fora Soft](https://www.forasoft.com/learn/ai-for-video-engineering/articles-ai/elevenlabs-pricing-voice-cloning-no-fakes-act)
- Example of the risk: in Malaysia, a TikTok account promoted health products using a well-known medical expert's AI-cloned voice and likeness without consent. — [Marketing Magazine MY](https://marketingmagazine.com.my/?p=129573)

### Inferences
- Agency SOPs should:
  - Tick the platform AI-disclosure toggle on every avatar or generated ad.
  - Never clone a real person without written consent.
  - Use only stock avatars licensed for commercial ad use (check each tool's terms).
  - Avoid fake "doctor" or "customer testimonial" framing that implies a real endorser.

### Gaps
- Official Meta Transparency Center and TikTok Ads policy text could not be fetched; the details above come from secondary sources.
- EU AI Act Article 50 dates were not verified (the Cinerads page was blocked).
- Each avatar tool's license terms for ads were not reviewed.

## Q6. Thai-market specifics

### Takeaway
Thai TTS is supported by ElevenLabs and by local vendors (Botnoi, iApp). HeyGen handles Thai input for translation, but Thai avatar speech output was not confirmed. Thailand's Office of the Consumer Protection Board (OCPB) has guidelines **already in force** requiring labels on AI-generated or AI-edited ad content, alongside the existing FDA pre-approval rules for health products.

### Cited Findings
- ElevenLabs markets Thai text-to-speech on dedicated pages. — [ElevenLabs Thai TTS](https://elevenlabs.io/text-to-speech/thai)
- iApp (a Thai vendor) offers Thai TTS and claims "Excellent" Thai quality while listing ElevenLabs as having "No Thai support". That contradicts ElevenLabs' own pages, so the comparison is biased or outdated. — [iApp guide](https://iapp.co.th/blog/ai-voice-technology-thailand-guide); [iApp TTS docs](https://iapp.co.th/docs/speech/text-to-speech)
- Botnoi Voice: over 200 AI voices in more than 20 languages including ASEAN languages, positioned for marketing voice-overs. — [AWS Marketplace listing](https://aws.amazon.com/marketplace/pp/prodview-36kove2muvo2g)
- Other options: Fliki (4 Thai voices, routes to providers including ElevenLabs), Atlabs (Thai voices with tone controls), AI Studios (Thai TTS). — [Fliki](https://fliki.ai/voices/thai); [Atlabs](https://www.atlabs.ai/de/features/ai-voiceovers/thai); [AI Studios](https://www.aistudios.com/ja/text-to-speech/thai-thailand)
- A user reported severe static or noise in Google's Thai TTS output (AI Studio/API). — [Google AI forum](https://discuss.ai.google.dev/t/bug-severe-audio-quality-degradation-static-noise-for-thai-tts-output-ai-studio-api-since-dec-10-18-00-ict/112236)
- HeyGen recognizes Thai audio, creates editable Thai transcripts, and translates to English (subtitles or voiceover). — [HeyGen Thai→English](https://www.heygen.com/translate/thai-to-english)
- **Thai OCPB AI ad guidelines:**
  - Issued under the Consumer Protection Act; in force with no grace period.
  - Apply to AI-generated content and to partially AI-edited or enhanced images and videos, across digital, social, print and TV.
  - Require labels such as "Real image or simulation edited using AI".
  - Size, quantity and composition shown must match what the customer receives.
  - — [Tilleke & Gibbins](https://www.tilleke.com/insights/thailands-advertising-guidelines-targeting-ai-generated-content/2/); [Mondaq](https://www.mondaq.com/new-technology/1759528/thailands-advertising-guidelines-targeting-ai-generated-content); [LexBangkok](https://lexbangkok.com/thailand-ai-advertising-regulations-2026/)
- Existing pre-approval rules (e.g. health-product advertising) still apply alongside the disclosure rules. A **draft** Thai AI Act (released July 2, 2026) would add AI-content transparency requirements; it is not yet law. — [Tilleke](https://www.tilleke.com/insights/thailands-advertising-guidelines-targeting-ai-generated-content/3/); [LexBangkok](https://lexbangkok.com/thailand-ai-advertising-regulations-2026/)

### Inferences
- For Thai ads:
  - Script in Thai with Claude or GPT, then have a native speaker edit (tone particles, slang).
  - A/B test Thai voice across ElevenLabs v3, Botnoi and iApp with native listeners.
  - Prefer avatar tools that accept an uploaded Thai audio track for lip-sync, which reduces dependence on built-in Thai TTS.
  - Put the OCPB-style Thai AI label on-screen in addition to the platform toggles.
- Health, beauty and supplement offers, which are common in Thai funnels, also need Thai FDA ad approval.

### Gaps
- Not confirmed: Thai avatar speech output in HeyGen, Synthesia, Arcads, Creatify or Captions.
- No sources found on Thai TikTok or Facebook ad creative norms (e.g. live-commerce style, TikTok Shop affiliate videos, typical lengths and hooks).
- No sources found on Thai enforcement against deepfake celebrity endorsements.
