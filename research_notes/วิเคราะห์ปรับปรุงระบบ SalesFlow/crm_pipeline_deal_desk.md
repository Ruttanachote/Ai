# CRM Pipeline Management & Deal Desk / Price Approval: Best Practices vs Stream SalesFlow

> Method note: Done 2026-11-06. This session's network blocked full-page fetches of salesforce.com/trailhead, learn.microsoft.com, knowledge.hubspot.com and salesforceben.com (DNS not allowed), so the findings below come from search-result extracts of those pages plus practitioner/vendor sources. Treat feature details as needing a check against the live docs before they go into a spec. Vendor-blog statistics are flagged where used.
>
> Baseline (what SalesFlow has today, from `salesflow/docs/system-analysis.md` and `src/data/model.ts`):
> - Stages: Opportunity (10–20%) → Pipeline (40–50%) → Forecast (70–80%) → Rebidding (70–80%) → Close Win/Lose. `prob` is a **display string range**, not a number. There is **no forecast category**, no required-fields-per-stage beyond "quotation approved before leaving Pipeline" and "PO/Contract file before Close Win".
> - `Project` has a single `revenue`, `cost`, `budget`, optional `expectedClose`, `bidDue`, free-text `customer` / `endUser`, `sm`, `sale`, `collaborators: string[]` (no % split), `history[]` (stage, note, at, by).
> - `Team(annualTarget)` only. No per-rep or per-period quota, no forecast snapshots or manager adjustments.
> - Approval: `ApprovalRequest(version, snapshot{revenue,cost,gp}, status)` + sequential `ApprovalStep(order, approverId, status, note, decidedAt)`. Routing by GP% and value (e.g. GP<25% or >฿20M → CFO). Reject needs a reason. The file is locked while pending. Hourly job for "approver overdue".
> - Close Lose requires a reason **only when reopening** (Lose→Pipeline). There is no structured loss-reason code and no competitor field.

---

## 1. Stage design: exit criteria, probability vs forecast category, weighted pipeline, aging, stalled deals

### Takeaway
Mature CRMs separate three things that SalesFlow currently merges into one `stage` + display `prob` string: (a) **stage** (process position, with required fields to exit), (b) **probability** (a number per stage, used for weighted pipeline), and (c) **forecast category** (Pipeline / Best Case / Commit / Closed / Omitted), which the rep can override and which drives forecast rollups. SalesFlow should store a numeric probability, add a forecast-category field, enforce exit criteria per stage, and track time-in-stage with stalled-deal alerts.

### Cited Findings
- In Salesforce, probability is controlled by the Stage field: each stage picklist value has a set %, and each stage also maps to a **Forecast Category**. Users can change the forecast category on an opportunity **without changing its stage**. — [Salesforce Ben: Forecast Categories](https://www.salesforceben.com/forecast-categories-in-salesforce-everything-you-need-to-know/) (via search extract); [Marks Group: What is a Salesforce forecast category](https://www.marksgroup.net/blog/what-is-a-salesforce-forecast-category/)
- Common convention (not a Salesforce default): Pipeline = <50% probability, Best Case = 50–75%, Commit = 75–99%, Closed = Closed Won only. Salesforce added a "Most Likely" category in Winter '22. — [Salesforce Ben](https://www.salesforceben.com/forecast-categories-in-salesforce-everything-you-need-to-know/) (search extract; exact default list not verified)
- Stage-to-category mapping is configured in Setup > Object Manager > Opportunity > Fields & Relationships > Forecast Category. — [Salesforce Ben](https://www.salesforceben.com/forecast-categories-in-salesforce-everything-you-need-to-know/) (search extract)
- HubSpot's default forecast categories are Pipeline, Best case, Most likely, Commit (and Closed won). "Automate forecast categories" updates the category when the deal stage changes. Category meaning follows its **position in the order**, not its name. — [HubSpot KB: Set up the forecast tool](https://knowledge.hubspot.com/forecast/set-up-the-forecast-tool)
- HubSpot **weighted amount** = Amount × Deal probability, and this is the default forecast display for users with Forecast permissions. A legacy "Forecast probability" property could be set manually or by workflow (accounts created before 20 Mar 2024). — [HubSpot KB: Set up the forecast tool](https://knowledge.hubspot.com/forecast/set-up-the-forecast-tool)
- Practitioner distinction: *deal probability* is set automatically by stage and used for financial forecasting, while *forecast probability* is set manually by the rep and shows rep confidence. — [Babelquest: How to use the forecasting tool in HubSpot](https://www.babelquest.co.uk/en/hubspot-hacks/how-to-use-the-forecasting-tool-in-hubspot)
- **Salesforce Path**: each stage step can highlight **up to 5 key fields** and up to **1,000 characters of "Guidance for Success"**. Hovering a stage shows how long the record has been in it. Key fields are not enforced on their own, so admins pair them with **validation rules** that require the fields when the stage advances. — [Salesforce Help: Path overview](https://help.salesforce.com/apex/HTViewHelpDoc?id=path_overview.htm); [Trailhead: Visualize success with Path and Kanban](https://trailhead.salesforce.com/content/learn/modules/leads_opportunities_lightning_experience/visualize-success-with-path-and-kanban); [Open Exam Prep: Sales Processes, Path](https://open-exam-prep.com/study-guides/salesforce-admin/sales-marketing-service-and-support-applications/sales-processes-path-products-price-books-and-forecasting)
- HubSpot enforces required deal-stage properties when an existing deal **moves** between stages, but not when a deal is **created** directly in a later stage. Users report this as a loophole. — [HubSpot Community: Mandatory properties on deal stages skipped at creation](https://community.hubspot.com/t5/HubSpot-Ideas/Mandatory-properties-on-Deal-STAGES-get-skipped-when-creating-a/idc-p/578789/highlight/true)
- If reps can move stages freely, approvals can be bypassed. Stage permissions must reflect approval rules, for example a dedicated "Approval Status" property that gates the stage. — [InsideA: How to require deal approvals in HubSpot](https://insidea.com/blog/hubspot/kb/how-to-require-deal-approvals-in-hubspot-crm/)
- Stage-duration trending: Salesforce field history has retention limits (vendor claim: 18–24 months, max 20 tracked fields per object). The suggested workaround is **periodic snapshots** of opportunity data. — [Coefficient (vendor)](https://coefficient.io/use-cases/salesforce-field-history-tracking-limitations)

### Inferences
- **Gap: probability is a string range ("40–50%")**, so weighted pipeline cannot be computed. Store `probability: number` (default from stage, e.g. Opp 15, Pipeline 45, Forecast 75) and compute `weightedRevenue = revenue × probability`.
- **Gap: no forecast category.** Add `forecastCategory: 'pipeline' | 'best_case' | 'commit' | 'closed' | 'omitted'`, defaulted from the stage and overridable by SM/head with a reason in history. This keeps "how far in the process" separate from "how confident we are". Suggested mapping: Opportunity → Pipeline, Pipeline → Pipeline/Best Case, Forecast → Commit, Rebidding → Best Case, Win → Closed, Lose → Omitted.
- **Design smell: Rebidding is a sales motion (public tender / e-bidding), not a confidence level**, yet it sits as a stage with the same 70–80% as Forecast. Consider making `salesMotion: 'direct' | 'tender'` (or `isBidding`) an attribute with bid-specific fields (`bidDue`, `bidSubmittedAt`, `bidResultAnnouncedAt`, `bidBondAmount`, `bidPrice`) instead of a stage, or keep it as a stage but give it its own probability and category.
- **Exit criteria per stage** (Path-style, enforced server-side like the existing transition rules), for example:
  - Opportunity→Pipeline: customer (account) set, end user, project type, est. revenue, expected close date, at least one contact with a role.
  - Pipeline→Forecast/Rebidding: approved quotation (exists), budget confirmed, decision maker identified, competitor(s) known, close date within the FY.
  - →Close Win: PO/Contract file (exists), final contract value, booking date, and a variance check vs the approved quote (see §3).
  - →Close Lose: loss reason code (required), winning competitor, lost price if known.
  - Apply the same rules at **create** and at **edit** to avoid the HubSpot loophole where a record is created directly in a late stage.
- **Stage aging:** add `stageEnteredAt` (derivable from StageHistory) and show "days in stage" on the card. Add per-stage SLA thresholds in Settings (e.g. Opportunity > 60 days, Pipeline > 90 days) that drive a **stalled-deal** flag and notify the SM and head. Other stall signals: `expectedClose` in the past while the deal is still open, no update or `nextStep` change for N days.
- Add a **"Guidance for Success" text + key fields per stage** in Settings and show them on the stage rail. This is cheap and helps new SMs.

### Gaps
- Could not open official Salesforce Help for the exact current default forecast-category list or the Path field limits (pages blocked). The 5 fields / 1,000 characters figures come from search extracts.
- No authoritative benchmark for stage-SLA days in IT system-integration deals was found.

---

## 2. Forecasting: quotas, rollups, manager adjustments, snapshots, win/loss reasons

### Takeaway
Leading CRMs make forecasting a **period-based, hierarchical, adjustable, and versioned** artifact: quotas per owner per period, rollups up the team hierarchy by forecast category, manager adjustments with a reason and history, and scheduled **snapshots** to compare "what we said then vs now". SalesFlow only has `Team.annualTarget` and live dashboards, so there is no accountability over time.

### Cited Findings
- Dynamics 365: a **quota** is a target amount for a specific owner over a given time frame, set in the forecast configuration, and the progress bar is calculated against it. Quotas can be uploaded per period using an Excel template. — [Microsoft Learn: View a forecast](https://learn.microsoft.com/en-gb/dynamics365/sales/view-forecasts); [Microsoft Learn: Describe forecasting](https://learn.microsoft.com/en-us/training/modules/explore-forecasting-pipeline-analytics-dynamics-365-sales/2-describe-forecasting)
- Dynamics 365's default forecast rolls up along the **sales-team (user) hierarchy**, with Opportunity as the rollup entity. Managers review Committed and Best Case rollups vs quota. — [Microsoft Learn: Describe forecasting](https://learn.microsoft.com/en-us/training/modules/explore-forecasting-pipeline-analytics-dynamics-365-sales/2-describe-forecasting)
- Dynamics 365 **adjustments**: editable columns are enabled with "Allow adjustments". Adjustment history is viewable, users can drill to the underlying opportunities and **record reasons**, and adjustments can be reverted to an older value. — [Microsoft Learn: Adjust values in a forecast](https://learn.microsoft.com/en-gb/dynamics365/sales/adjust-values-in-forecast); [Release plan 2020 wave 1: Improve and adjust forecast accuracy](https://learn.microsoft.com/en-us/dynamics365-release-plan/2020wave1/dynamics365-sales/improve-adjust-forecast-accuracy)
- Dynamics 365 **snapshots** (premium feature): schedule them as often as once every 24 hours, or trigger them before or after adjustment periods. Comparing snapshots shows changes in forecast values and the records behind them (trend/flow chart). — [Microsoft Learn: View a forecast](https://learn.microsoft.com/en-ca/dynamics365/sales/view-forecasts); [Inogic: Enhanced trend and flow chart](https://www.inogic.com/blog/2022/10/enhanced-trend-and-flow-chart-in-sales-forecasting-within-dynamics-365-crm/)
- Dynamics 365 forecasting requires Sales Enterprise or Premium. — [Microsoft Learn: View a forecast](https://learn.microsoft.com/de-de/dynamics365/sales/view-forecasts)
- HubSpot: reps can **manually submit** their own forecast amount for a period (pencil icon). A status indicator flags reps who haven't updated their forecast within a configurable window (default 8 days, max 31). Changing the forecast period resets goals and submissions. — [HubSpot KB: Set up the forecast tool](https://knowledge.hubspot.com/forecast/set-up-the-forecast-tool)
- Salesforce Collaborative Forecasts rolls up by forecast category and supports manager adjustments. Opportunity splits can feed forecasts (see §4). — [Perficient: Collaborative forecasting earns its name](https://blogs.perficient.com/2014/07/24/collaborative-forecasting-earns-its-name) (older source)
- Win/loss practice: use a **small required picklist of 8–12 loss reason codes** on Closed Lost, plus a required **"Primary competitor"** when a competitor-related code is chosen. Block closing without these fields (validation rule). Avoid free text as the primary capture. — [Octave: GTM Engineer's guide to closed-lost analysis](https://www.octavehq.com/post/gtm-engineers-guide-to-closed-lost-analysis); [Saber: Loss reasons](https://www.saber.app/glossary/loss-reasons)
- Separate the buyer's stated reason from the observed reason. When they disagree, the observed one is usually actionable. Weight losses by value, not just count, and review quarterly. — [Octave](https://www.octavehq.com/post/gtm-engineers-guide-to-closed-lost-analysis); [Aptitude 8: Closed lost reason](https://www.aptitude8.com/blog/closed-lost-reason-is-a-growth-hack-metric-you-should-be-tracking)
- **Don't reopen closed-lost records.** Create a new linked opportunity so historical win-rate math stays clean. — [Octave](https://www.octavehq.com/post/gtm-engineers-guide-to-closed-lost-analysis) (practitioner opinion)
- Caution: vendor claims about win-rate uplift from win/loss programs vary widely (from 2–3% to "up to 50%", attributed to Gartner), and one source claims "competitor" is the most over-reported loss reason (~17% truly competitive). These figures are weakly sourced. — [Octave](https://www.octavehq.com/post/gtm-engineers-guide-to-closed-lost-analysis); [Prospeo: Closed won vs closed lost](https://prospeo.io/s/closed-won-vs-closed-lost)

### Inferences
- **New entities:**
  - `Quota(ownerType: 'user'|'team', ownerId, period: 'YYYY-Qn'|'YYYY-MM', metric: 'booking'|'gp'|'revenue', amount)`. Thai SIs often set both booking and GP targets, so allow more than one metric. Upload via Excel template to match how heads work today.
  - `ForecastSubmission(ownerId, period, category, amount, submittedAt, note)` for SM self-calls (Commit / Best Case) and `ForecastAdjustment(managerId, targetOwnerId, period, category, originalAmount, adjustedAmount, reason, at)`. Show "System (sum of deals)" vs "SM call" vs "Head adjusted" side by side.
  - `PipelineSnapshot(takenAt, projectId, stage, forecastCategory, probability, revenue, gp, expectedClose, ownerId, team)`: a weekly job (e.g. Monday 06:00), plus month and quarter-end snapshots that are kept permanently. This enables waterfall/flow reports (new, pushed, pulled-in, won, lost, value changed) and slippage KPIs (§6). It is cheap to build on the existing hourly background job.
- Rollup path: SM → DT sub-team (DT4-1) → DT group (DT4) → company, which matches the existing `Team.parentCode`.
- **Loss capture gap:** today a reason is required only when **reopening** a lost deal. It should be required when **closing as lost**: `lossReason` (code), `lossReasonDetail`, `winningCompetitorId`, `winningPrice` (public tender results in Thailand are often published, so the winning bid price is often obtainable), and `lostAtStage`. Add a matching `winReason` code for Close Win.
- Reconsider "Head reopens Close Lose → Pipeline". The best-practice view is to create a new linked opportunity (`reopenedFromId`) rather than mutate the closed record, or at least to keep the original close in the snapshot and history so win-rate math stays clean. This applies especially to re-tendered government projects (the TOR is re-issued).

### Gaps
- Could not verify current Salesforce Collaborative Forecasts details from official docs (blocked). The only source found is an older 2014 partner blog.
- No reliable industry data on optimal snapshot frequency. Weekly is a common practitioner choice but has no citable source here.

---

## 3. Deal desk / price approval

### Takeaway
SalesFlow already has the core: threshold-based routing, a version snapshot, a lock during approval, and a reason required on reject. The gaps vs mature CPQ/deal-desk tooling are **parallel steps, approval groups, delegation/out-of-office, SLA escalation, recall, "smart" re-approval (skip approvers whose conditions didn't change), approval validity/expiry, a re-approval trigger when the won/PO value differs from the approved quote, and multi-dimensional thresholds** (discount vs list price, payment terms, warranty length, penalty clauses, not just GP% and value).

### Cited Findings
- Salesforce CPQ **Advanced Approvals** support **parallel and sequential** approvals. A **chain** links several approval rules that must happen in sequence. Native Salesforce approval processes are linear. — [Salto: Salesforce CPQ Advanced Approval guide](https://salto.io/blog-posts/salesforce-cpq-advanced-approval-guide); [Jade Global](https://www.jadeglobal.com/blog/increase-velocity-using-salesforce-cpq-advanced-approvals); [Trailhead: Advanced Approvals](https://trailhead.salesforce.com/content/learn/modules/salesforce-cpq-features/advanced-approvals-aom)
- **Smart Approvals**: on resubmission, the system decides whether re-approval is needed based on prior decisions and what changed in the quote. Approvers who already approved and whose conditions are unaffected are skipped. A rule-level option, **"Reevaluate Smart Approvals Individually"**, forces re-approval when any single smart condition's tested value changes. — [Trailhead: Use Smart Approvals to evaluate changes](https://trailhead.salesforce.com/ja/content/learn/modules/advanced-approvals-for-admins/use-smart-approvals-to-evaluate-changes); [Medium: Introducing approvals in Salesforce CPQ](https://medium.com/tech-career-nuggets/introducing-approvals-in-salesforce-cpq-29d82cfd458d)
- Advanced Approvals works on opportunities and quotes by default and can be enabled on other objects. — [Salto](https://salto.io/blog-posts/salesforce-cpq-advanced-approval-guide)
- Salesforce standard approval processes: records pending approval are **locked by default**, and only admins (and optionally the current approver) can edit them. **Recall** is controlled by `allowRecall`; if it is false, only admins can recall. A recall unlocks the record and resets its status. **Delegated approvers** can act only if the step sets `allowDelegate`. A delegate is an alternate chosen by the assigned approver for out-of-office coverage. — [Salesforce Metadata API: ApprovalProcess](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_approvalprocess.htm); [Open Exam Prep: Approval actions & locking](https://open-exam-prep.com/study-guides/sf-platform-app-builder/complex-automation-approvals/approval-actions-locking)
- Salesforce approval steps can route to the **next approver from a hierarchy field** (e.g. Manager) automatically. — [Salesforce Metadata API: ApprovalProcess](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_approvalprocess.htm)
- Analogue (ServiceNow, not Salesforce): **escalation** to a designated approver when a step isn't completed within an admin-defined window. Recall cancels pending steps and returns the quote to editable. — [ServiceNow docs: Approving or rejecting quotes](https://www.servicenow.com/docs/r/order-management/approving-or-rejecting-quotes.html). I found no Salesforce-specific escalation documentation.
- HubSpot quote approvals are configured in Settings → Objects → Quotes → Approvals. Conditions evaluate **quote-level properties**, not line items, so line-item logic must be rolled up into a quote/deal property first. Approver feedback is stored in `hs_feedback`. API-created quotes start as draft. — [Babelquest: Conditional quote approvals in HubSpot](https://www.babelquest.co.uk/en/hubspot-hacks/how-to-set-up-conditional-quote-approvals-in-hubspot); [HubSpot Developers: Quotes API](https://developers.hubspot.com/docs/api-reference/latest/crm/objects/quotes/guide.md); [HubSpot KB: Quote properties](https://knowledge.hubspot.com/quotes/quote-properties)
- Deal-desk matrix design (practitioner sources):
  - Set thresholds on **total contract value**, not annual value, because multi-year concessions compound.
  - Use several dimensions: discount depth, **margin impact**, deal size, risk factors (public sector/regulated customer, unusual **payment terms**). Payment terms get their own ladder.
  - Separate ownership: the **CFO owns the margin floor** and the sales head / deal desk owns the discount cap.
  - Measure approval cycle time, discount trend, share of deals at standard terms, and contracts signed with unapproved terms (target ~0). An approval rate above ~95% suggests thresholds are too low (rubber-stamping).
  - Review thresholds regularly.
  — [Kognitos: Deal desk](https://www.kognitos.com/blog/deal-desk/); [Ratio: Deal desk glossary](https://www.ratiotech.com/glossary/deal-desk); [Monetizely: Pricing approval workflow](https://www.getmonetizely.com/articles/the-pricing-approval-workflow-streamlining-decision-making-in-saas-deal-management); [eChai Ventures: deal desk without slowing everything down](https://echai.ventures/gtm/gtm-sales-process/how-do-i-put-a-deal-desk-and-discount-approvals-in-place-without-slowing-everything-down)
  - Caveat: these are vendor/practitioner blogs. The percentage bands they give are illustrative, not standards.

### Inferences
- **Approval matrix as data**, not hard-coded: `ApprovalRule(id, priority, conditions[{field, op, value}], approverType: 'user'|'role'|'teamHead'|'group', approverRef, stepGroup, mode: 'sequential'|'parallel_all'|'parallel_any', slaHours, escalateToRef, active, effectiveFrom)`. Condition fields:
  - `gpPercent`, `totalContractValue` (incl. MA years), `discountFromListPct` (HW/SW vs distributor price)
  - `manDayRateBelowStandard`, `contingencyPct`, `otReservePct`
  - `paymentTermDays`, `advancePaymentPct`, `penaltyRatePerDay` (ค่าปรับรายวัน, common in Thai government contracts), `warrantyMonths` above standard
  - `customerSector` (government/SOE), `isTender`, `bidBondRequired`
- **Parallel steps:** for example, Head DT and Head of Pre-sale/Technical review at the same time, then CFO. Use `ApprovalStep.stepGroup` + `mode`. The existing `order` field becomes the group order.
- **Delegation:** `ApproverDelegation(approverId, delegateId, from, to, reason)`. Routing checks it at assignment time, and the audit trail records "approved by X on behalf of Y". This could integrate with Outlook automatic replies / Entra manager, but a manual delegation setting is enough for an MVP.
- **SLA/escalation:** per-step `dueAt` (e.g. 24 business hours). The existing hourly job sends a reminder at 50%, escalates to `escalateToRef` (e.g. the approver's manager or exec) at 100%, and logs it. Show "waiting X hours" on the รออนุมัติราคา page. Use Thai business-day calendars (public holidays) for the SLA clock.
- **Recall:** the SM can withdraw a pending request (unlocks the file and records `recalledAt`) instead of waiting for a reject.
- **Smart re-approval:** on resubmission (v2, v3), compute a diff of the snapshot fields. Keep prior approvals whose rule conditions are still satisfied with the same or a better value (e.g. GP went up), and only re-route the steps whose triggering values worsened. Store `ApprovalStep.carriedFromRequestId`.
- **Approval validity and change-after-approval** (this is the most important integrity gap):
  - Add `approvedValidUntil` (e.g. 30–60 days, matching the quotation validity / ยืนราคา period).
  - After approval, any change to the Excel named ranges (`Total_Revenue`, `Total_COGS`, `GP_Percent`) creates a new SharePoint version. The system should detect a **SharePoint version newer than the approved version ID** and mark the approval `stale`, block "ส่งใบเสนอราคาให้ Sale", and require resubmission.
  - At Close Win, compare the PO/contract value with the approved quotation. If the variance exceeds a tolerance (e.g. revenue −X% or GP below the approved GP), require **post-award re-approval**. The quotation Sales sends may be re-negotiated by Sales, who don't use the system.
- **Audit trail:** `ApprovalEvent(requestId, stepId, actorId, onBehalfOfId, action: submit|approve|reject|recall|delegate|escalate|reassign|comment, channel: 'email_actionable'|'web', at, ip/userAgent, snapshotHash)`. Record the channel because Outlook Actionable Messages are used. Hash the snapshot plus the SharePoint versionId so later disputes can be resolved.
- **Lock scope:** lock both the Excel file and the project's commercial fields (revenue, cost, expectedClose, customer) while pending, which matches Salesforce default behavior.
- **Deal desk KPIs** for the Settings/Exec dashboard: median approval time per step, % approved first time, rejections by reason, discount/GP distribution by team, % of won deals whose PO value ≠ approved value.

### Gaps
- Could not read official Salesforce Advanced Approvals docs for delegation/escalation specifics (blocked). The escalation pattern cited is ServiceNow's.
- No Thai-specific deal-desk benchmarks (typical GP floors for Thai SIs) were found.

---

## 4. Multi-team split credit and revenue recognition timing

### Takeaway
Salesforce models shared credit with **Opportunity Teams + Opportunity Splits**: a **revenue split** must total 100% and is what counts toward quota, while an **overlay split** credits supporting members and may exceed 100%. SalesFlow's `collaborators: string[]` cannot attribute revenue to multiple DT teams. Separately, CRMs distinguish **booking** (contract signed) from **revenue/billing schedules** over time. SalesFlow's milestones/payment terms exist only post-sale, so the forecast can't show when cash or revenue lands.

### Cited Findings
- Salesforce **revenue splits** credit people directly responsible for revenue and **must total 100%**. **Overlay splits** credit supporting members, can total any percentage including over 100%, and don't count toward the revenue split. Admins can enable custom split types (up to 3 more). — [Trailhead: Sell as a team and split the credit](https://trailhead.salesforce.com/content/learn/modules/leads_opportunities_lightning_experience/sell-as-a-team-and-split-the-credit); [Salesforce Team Selling Implementation Guide (PDF)](https://resources.docs.salesforce.com/242/latest/en-us/sfdc/pdf/team_selling_implementation_guide.pdf); [Salesforce Ben: How to use opportunity splits](https://www.salesforceben.com/how-to-use-opportunity-splits-in-salesforce/)
- The opportunity owner must stay in place for splits. A member can't be in both the revenue and overlay splits on the same opportunity (as described in integration docs). — [Celigo docs](https://docs.celigo.com/hc/en-us/articles/360049993551); [Salesforce Tutorial: Opportunity splits](https://www.salesforcetutorial.com/opportunity-splits)
- Product-level splits exist (third party) to split credit by line item when teams sell different products on one deal. — [Grazitti: Opportunity product splits](https://grazitti.com/blog/opportunity-product-splits-how-it-enables-fair-revenue-split-for-opportunities-with-multiple-products)
- Dynamics 365 lets you add **stakeholders, sales team members, and competitors** to an opportunity. — [Microsoft Learn: Add stakeholders, sales team, and competitors](https://learn.microsoft.com/en-us/dynamics365/sales/add-stakeholder)
- Salesforce **product schedules**: quantity schedules and revenue schedules represent payment/delivery cycles. When both exist, quantity is calculated first. The native schedules spread revenue evenly. Third-party apps add S-curve/pro-rata templates and re-adjust schedules when the close date changes. — [Salesforce Products cheatsheet (PDF)](https://resources.docs.salesforce.com/206/latest/en-us/sfdc/pdf/salesforce_products_cheatsheet.pdf); [West Monroe: Forecasting monthly revenue in Salesforce](https://blog.westmonroepartners.com/forecasting-monthly-revenue-in-salesforce-com/); [G2: GSP Product Schedules](https://www.g2.com/products/gsp-product-schedules/reviews)
- Bookings = value of contracts secured; billings = value invoiced; revenue = recognized per accounting rules. Comparing the billing forecast with bookings helps plan cash. — [Rework: Bookings vs revenue vs billings](https://resources.rework.com/libraries/pipeline-management/bookings-vs-revenue); [Hyperbots: Bookings vs billings](https://www.hyperbots.com/glossary/bookings-vs-billings)

### Inferences
- **`OpportunitySplit(projectId, teamCode, userId?, splitType: 'revenue'|'overlay', percent, amount, gpAmount, reason, approvedBy)`.** Validate that revenue splits sum to exactly 100% at stage ≥ Forecast. Dashboards and quota attainment use split amounts, not the full deal value, to avoid double counting when DT4-1 and DT2-3 both work a project. Overlay is for pre-sale/architect or specialist teams that need credit without inflating the company total.
- Optionally split by **Cost Sheet section** (e.g. HW/SW reselling credited to team A, development man-days to team B). The Cost Sheet already itemizes these, so the split could be derived from named ranges per team (`Rev_DT4`, `Rev_DT2`).
- **Booking vs revenue timing:** add `bookingDate` (PO/contract date = Close Win), `contractValue`, and a pre-sale **`RevenueSchedule(projectId, period, type: 'billing'|'revenue', amount, basis: 'milestone'|'monthly'|'one_time')`**. Seed it from the Cost Sheet/TOR payment terms (งวดงาน) during Forecast, then convert it to the post-sale `Milestone.paymentAmount` at Handover. For เช่าซื้อ (lease) and MA types, use a monthly/annual straight-line schedule. This lets executives see "booking this year" vs "billing this year" vs "next-year carry-over". Thai SIs are often measured on both.
- Quota metric should state which basis it uses (booking vs billing) per `Quota.metric`.

### Gaps
- No primary source found on how Thai SIs typically recognize revenue for multi-year projects under TFRS 15. This needs finance input and is outside CRM docs.
- Could not verify the current Salesforce edition/availability of custom split types (blocked).

---

## 5. Competitor tracking, account hierarchy (customer vs end user), contact roles

### Takeaway
CRMs model customers as **Account records** (with a parent hierarchy and partner relationships), people as **Contacts linked to opportunities with roles and one primary**, and competitors as **related records on the opportunity**. SalesFlow stores `customer` and `endUser` as free text and has no contacts or competitors. That blocks per-customer history, MA renewal targeting, and competitive win-rate analysis.

### Cited Findings
- Salesforce **contact roles** specify the part a person plays in an account, case, contract, or opportunity (e.g. Decision Maker, Business User, Executive Sponsor). An opportunity has **one primary contact**, but a contact can be primary on many opportunities. Creating an opportunity from a contact makes that contact primary, but no role is assigned automatically. — [Salesforce Help: Contact roles](https://help.salesforce.com/HTViewHelpDoc?id=contactroles.htm); [Salesforce API: OpportunityContactRole](https://developer.salesforce.com/docs/atlas.en-us.222.0.api.meta/api/sforce_api_objects_opportunitycontactrole.htm)
- Salesforce **partner** relationships: the `Partner` object links an account to an opportunity (or account to account) with a **Role** (e.g. Consultant, Distributor) defined in `PartnerRole`, each with a reverse role. `IsPrimary` marks one primary partner per opportunity, and setting a new primary clears the old one. — [Salesforce Object Reference: Partner](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_partner.htm); [Salesforce Object Reference: AccountPartner](https://developer.salesforce.com/docs/atlas.en-us.250.0.object_reference.meta/object_reference/sforce_api_objects_accountpartner.htm)
- Dynamics 365 lets you add **competitors** (organizations competing for the opportunity) and **stakeholders** to an opportunity. — [Microsoft Learn: Add stakeholders, sales team, and competitors](https://learn.microsoft.com/en-us/dynamics365/sales/add-stakeholder)
- Loss practice: require a "Primary competitor" when a competitor loss code is selected. — [Octave](https://www.octavehq.com/post/gtm-engineers-guide-to-closed-lost-analysis)

### Inferences
- **`Account(id, name, taxId, type: 'customer'|'end_user'|'partner'|'vendor'|'competitor', sector: 'government'|'soe'|'enterprise'|..., parentAccountId)`.** Replace the free-text `customer`/`endUser` with `customerAccountId` (the entity issuing the PO, e.g. a prime contractor or distributor) and `endUserAccountId` (the agency using the system). Use the parent hierarchy for ministry → department → agency or group → subsidiary. Thai tax ID (เลขประจำตัวผู้เสียภาษี 13 digits) is a natural dedupe key.
- **`ProjectPartner(projectId, accountId, role: 'prime_contractor'|'subcontractor'|'distributor'|'principal_vendor'|'consortium', isPrimary)`**: important for SI deals where Stream is a subcontractor or partners with a principal (e.g. vendor deal registration).
- **`Contact(accountId, name, title, email, phone)` + `ProjectContactRole(projectId, contactId, role: 'decision_maker'|'economic_buyer'|'technical_evaluator'|'user'|'procurement'|'tor_committee'|'inspection_committee', isPrimary)`**. The TOR/inspection committee (คณะกรรมการ TOR / ตรวจรับ) roles are specific to Thai public procurement. Handover and MA reuse these contacts (the MA renewal notice letter needs a named recipient).
- **`ProjectCompetitor(projectId, competitorAccountId, bidPrice?, strengths, weaknesses, status: 'active'|'won'|'lost'|'withdrew')`**, with `isWinner` captured at Close Lose. For e-bidding, public results let you record all bid prices. This enables win rate vs each competitor and price-gap analysis.
- **Account 360 page:** all projects, total won value, active MA, warranty end dates, open opportunities. This directly supports the MA renewal flow already designed.

### Gaps
- Did not find an official Salesforce source for a native competitor object in current Sales Cloud (the standard "Competitors" related list exists historically but wasn't verified here).

---

## 6. Key pipeline KPIs

### Takeaway
The standard set is win rate, average deal size, sales cycle length, pipeline coverage (pipeline ÷ remaining quota), pipeline velocity, slippage (close-date push-outs), and stage conversion. Sources agree on the formulas but **not on start/end definitions or benchmarks**, so SalesFlow must define each one explicitly. Several metrics (slippage, cycle length, conversion) need the snapshot and stage-history data recommended above.

### Cited Findings
- **Pipeline coverage** = pipeline value ÷ quota. The target ratio ≈ 1 ÷ historical win rate (about 4× at a 25% win rate), plus a buffer for slippage. 4:1 coverage with a 15% win rate still misses quota. — [Abmatic: Pipeline coverage ratio](https://blog.abmatic.ai/what-is-pipeline-coverage-ratio); [Landbase (2026)](https://www.landbase.com/blog/pipeline-coverage-ratio-calculate-2026); [Salesmotion: Pipeline coverage guide](https://salesmotion.io/blog/pipeline-coverage-ratio-guide)
- **Win rate** = wins ÷ total opportunities (closed). One source cites a 20–30% enterprise benchmark, with <20% a red flag (not universal). — [Avoma: Sales pipeline metrics](https://www.avoma.com/blog/sales-pipeline-metrics); [Pipedrive: Sales pipeline metrics](https://www.pipedrive.com/en/blog/sales-pipeline-metrics)
- **Sales cycle length** definitions differ: entry into pipeline → close (won or lost), SQL → closed-won, or total days to close ÷ deals closed. Segment by deal size for it to be meaningful. — [Avoma](https://www.avoma.com/blog/sales-pipeline-metrics); [CaptivateIQ: Sales pipeline metrics](https://www.captivateiq.com/blog/sales-pipeline-metrics); [Pipedrive](https://www.pipedrive.com/en/blog/sales-pipeline-metrics)
- **Pipeline velocity** = (qualified opportunities × average deal size × win rate) ÷ sales cycle length. — [Pipedrive](https://www.pipedrive.com/en/blog/sales-pipeline-metrics); [Bitrix24: Sales KPIs that predict growth](https://www.bitrix24.eu/articles/beyond-the-revenue-number-sales-kpis-that-actually-predict-growth.php)
- **Slippage** = deals pushed to a future period, which reduces effective coverage. There is no standard formula. — [Weflow: Pipeline coverage audit](https://www.weflow.ai/blog/pipeline-coverage-audit); [Prospeo: Sales operations KPIs](https://prospeo.io/s/sales-operations-kpis)
- All of these metrics depend on clean data. — [Trellus: Pipeline coverage](https://www.trellus.ai/learning-center/pipeline-coverage)
- (Most KPI sources are vendor blogs. Formulas are consistent across them, but benchmarks are not authoritative.)

### Inferences
Proposed SalesFlow KPI definitions (per SM, DT team, project type, sector, sales motion direct vs tender):
- **Win rate (count & value)** = Won ÷ (Won + Lost) for deals closed in the period. Exclude Cancelled and track it separately. Report win rate per competitor and for tender vs direct.
- **Stage conversion** = % of deals entering stage N that reach stage N+1 (from StageHistory).
- **Sales cycle** = `createdAt` (Opportunity) → close date, median, segmented by type and size band. Also report **time in each stage**.
- **Coverage** = open pipeline (Pipeline + Best Case + Commit) with `expectedClose` in the period ÷ (quota − won-to-date). Also show weighted coverage.
- **Forecast accuracy** = actual won ÷ Commit snapshot at period start (needs snapshots).
- **Slippage** = value of deals whose `expectedClose` moved out of the period between snapshots ÷ value forecast at period start. Also count close-date changes per deal (a field like `closeDatePushCount` to flag "serial pushers").
- **Approval KPIs** (from §3): approval cycle time, first-pass approval %, GP% approved vs GP% at Close Win vs actual GP after delivery. The last closes the loop with the PM baseline already designed.
- **Data-hygiene indicators**: open deals with past `expectedClose`, missing next step, days since last update.

### Gaps
- No Thai or SI-industry-specific benchmarks (win rate, cycle length, coverage) were found in reliable sources.
