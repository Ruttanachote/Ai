# PSA / ITSM best practices for project delivery, resource management and warranty/MA renewal: gaps in Stream SalesFlow

Baseline read first: `/home/user/Ai/salesflow/docs/system-analysis.md` (sections 4, 5, 7) and the prototype views (`DeliveryPanel.vue`, `WorkloadView.vue`, `MaView.vue`, `MaPanel.vue`, `data/model.ts`). The current design has these pieces:
- Handover checklist, PMO assigns PM and DT team by looking at the Workload heatmap, baseline from the approved Cost Sheet
- Milestone Gantt with payment per milestone (`Milestone{name,start,end,progress,payment,paid}`), Task board with estHours/spent, weekly Timesheet
- Workload heatmap (person × week, planned hours against a flat 40 h, with fixed colour bands: 1–15, 16–31, 32–40, >40)
- Project health (Schedule / Effort / Payment RAG), Risk log `Risk(level, description, mitigation, owner, status)`, `ChangeRequest(title, manDays, cost, status)`, lessons learned at close
- Warranty radar (≤30 / 31–90 / >90 days), notices at 90/60/30/7/0 days, notice letter template
- Tickets P1/P2/P3/CR with a fixed SLA text ("P1 4 h · P2 8 h · P3 3 working days") and one `dueAt` per ticket
- Quarterly SLA report, MA renewal as a new MA-type project with `parentId`, Asset/License register, reasons for not renewing

Network note: learn.microsoft.com and deltek.com could not be fetched from this session (DNS blocked), so the Microsoft and SPI findings come from search-result summaries of those pages, not full-page reads. The report writer should treat exact field names as indicative.

## Sales→delivery handover (handover template, baseline budget from quote, sold vs planned vs actual)

### Takeaway
Mature practice treats handover as a validation gate rather than a list of steps, and it carries the sold financials into delivery as a locked baseline that planned and actual figures are measured against. SalesFlow has the checklist and the Cost Sheet baseline. It is missing three things:
- explicit "sold / planned (current baseline) / actual / forecast" columns
- a baseline revision history driven by change requests
- a sales-accuracy feedback loop after handover

### Cited Findings
- A handoff checklist is "a validation tool" that confirms critical information is complete before kickoff. It ensures scope, timelines, financials and expectations are defined before work begins. — [Birdview PSA](https://birdviewpsa.com/blog/sales-to-delivery-handoff-checklist-consulting/)
- When the CRM creates the project, the budget may be prefilled from the deal value. Teams should verify it rather than re-enter it, because the budget is "the financial backbone" that delivery is measured against. — [Teamwork.com](https://www.teamwork.com/blog/pipeline-to-project-handoff/)
- The delivery checklist includes finalising and baselining the project plan, then comparing planned hours and budget against actuals throughout delivery. — [DEV/Taskford](https://dev.to/taskford/project-delivery-checklist-for-professional-services-teams-3609)
- Commercial items to hand over: total cost, payment schedule, change-order process. — [ONES](https://ones.com/blog/?p=1078205)
- Post-handoff review: the delivery lead gives structured feedback to sales on whether the handoff document was accurate and whether there were surprises. — [Bitrix24](https://www.bitrix24.com/amp/articles/service-delivery-handoff-context-dying-after-closed-won.html)
- WorldCC publishes a bid-to-delivery handover checklist covering key information, commitments, risks and obligations transferred at contract award (members only, not read). — [WorldCC](https://www.worldcc.com/resource/tips---checklists---bid-to-delivery-handover-checklist--pdf.html)
- In Project Operations, invoicing is allowed only after the quote is won and becomes a Project contract. Invoice schedules can be defined on quote lines and carried to contract lines. — [MS Learn – invoice schedule on quote line](https://learn.microsoft.com/vi-vn/dynamics365/project-operations/sales/invoice-schedule-quote-line); [MS Learn – contract line invoice schedules](https://learn.microsoft.com/en-us/dynamics365/project-operations/sales/invoice-schedules-contract-line)

### Inferences
- **Gap: three-column financial model.** Add `Baseline(projectId, version, source[quote|CR], revenue, cost, manDays, hwSw, otReserve, contingency, approvedAt)`. Show it as sold (approved quote snapshot, already in `ApprovalRequest.snapshot`), current baseline (sold + approved CRs), actual-to-date (timesheet hours × cost rate + PO/PA actuals), and EAC/forecast. Today the doc says "baseline from Cost Sheet" but `Project` has only a flat `budget`, `revenue` and `cost`.
- **Gap: handover data captured as structured fields, not only a checklist.** Fields to capture:
  - Promised commitments from presale (free text plus tags)
  - Penalty/LD clauses (rate per day, cap)
  - Warranty term and SLA tier sold
  - Acceptance criteria per milestone
  - Customer stakeholders with roles
  - Known risks carried from presale (seed the RAID log)
  - Payment terms (seed the milestones)

  These seed downstream records, so nobody types them twice.
- **Gap: pre-filled milestones.** Carry the payment-term schedule from the Quotation tab into the Milestones at handover, the same way MS carries a quote-line invoice schedule into the contract line.
- **Gap: handover quality score.** Delivery rates the handover (complete / missing items / surprises) after about 2–4 weeks. This feeds SM coaching and Cost Sheet template tuning, alongside lessons learned.

### Gaps
- No source found that formally defines "sold vs re-baselined budget" governance (when a re-baseline is allowed). Treat CR-driven re-baselining as practitioner convention.

## PSA capabilities: resource requests, soft/hard booking, skills, capacity vs demand (pipeline-weighted), utilization, timesheet approval

### Takeaway
PSA tools separate demand (resource requests by role or skill) from supply (bookings). They distinguish tentative (soft) from committed (hard) bookings and forecast capacity against demand, including pipeline demand. SalesFlow's heatmap only shows planned hours of named people against a flat 40 h. It has no requests, no booking status, no role/skill demand, no pipeline demand and no utilization metric.

### Cited Findings
- **Soft vs hard booking in MS Project Operations.**
  - A soft booking adds the resource to the team but keeps their capacity open for other projects.
  - A hard booking consumes capacity. Only hard-booked resources can be assigned to tasks, within their hard-booked hours.
  - Soft converts to hard via the Schedule Board (Change Status → Hard) or Confirm on the Team tab. Generic resources can't be soft-booked.

  — [MS Learn – soft-book requirements](https://learn.microsoft.com/en-us/dynamics365/project-operations/psa/resource-management-softbook-requirements); [MS Learn – soft book FAQ](https://learn.microsoft.com/en-us/dynamics365/project-operations/psa/faq-soft-book); [MS Learn – booking status](https://learn.microsoft.com/en-us/dynamics365/project-operations/resource-management/booking-status)
- **Resource requests.** In centralized mode, PMs request resources "with specific characteristics" (role, skills, hours, dates). Resource managers propose matching resources. A confirmed proposal becomes a hard booking, and a declined one has no impact. A PM can also hard-book directly without a request. — [MS Learn – manage resource requests](https://learn.microsoft.com/en-us/dynamics365/project-operations/psa/manage-resource-requests); [GitHub MS docs – submit resource requests](https://github.com/MicrosoftDocs/dynamics-365-project-operations/blob/main/articles/psa/submit-resource-requests.md)
- **Kantata pipeline planning.** Kantata markets planning "for resource demand in your project pipeline", factoring in future pipeline to model timing, demand and profitability, plus always-current bench and capacity data. No public doc confirmed probability-weighting mechanics. — [Kantata resource forecasting](https://www.kantata.com/product/resource-forecasting-software); [Kantata resource management](https://kantata.com/product/resource-management)
- **SPI 2026 PS Maturity Benchmark (2025 data).**
  - Average billable utilization fell to 66.4% in 2025, down from 68.9% in 2024, the lowest SPI has recorded.
  - Revenue growth was 5.2%, against the 10% SPI considers healthy.
  - Utilization and project overrun are among the five KPIs SPI says predict profitability.

  — [Deltek (SPI sponsor) – 5 KPIs](https://www.deltek.com/en/resources/articles/5-kpis-from-the-spi-professional-services-maturity-benchmark-report-every-pso-must-track-for-sustainable-growth); [SAPinsider](https://sapinsider.org/articles/5-kpis-from-the-spi-professional-services-maturity-benchmark-report-every-pso-must-track-for-sustainable-growth/)
- **Conflicting utilization targets.** Deltek cites a 75% target. SAPinsider says Level 5 (Optimized) firms exceed 80%. SAPinsider also claims PSOs managing all five KPIs together achieve more than 20% revenue growth. — [Deltek](https://www.deltek.com/en/resources/articles/5-kpis-from-the-spi-professional-services-maturity-benchmark-report-every-pso-must-track-for-sustainable-growth); [SAPinsider](https://sapinsider.org/articles/5-kpis-from-the-spi-professional-services-maturity-benchmark-report-every-pso-must-track-for-sustainable-growth/)
- **Benchmark scope.** The 2025 edition was SPI's 18th annual benchmark. A secondary source says it surveyed 403 firms. SPI tracks more than 160 metrics, with KPI definitions in the report appendix (paid, $2,495). — [SPI Research](https://spiresearch.com/the-18th-annual-professional-services-maturity-benchmark-report-is-out-now/); [Servantium (secondary)](https://servantium-website.pages.dev/blog/the-utilization-crisis-2025.html); [SPI](https://spiresearch.com/?p=233)
- **Kantata podcast** on the 2025 benchmark takeaways (transcript). — [Kantata podcast ep. 88](https://kantata.com/podcast/key-takeaways-from-the-2025-ps-maturity-benchmark-report/transcript)

### Inferences
- **Gap: ResourceRequest entity.** Proposed shape: `ResourceRequest(projectId, role, skills[], team, hoursPerWeek|totalHours, start, end, status[draft|submitted|proposed|fulfilled|declined], requestedBy, resourceManagerId)`. PMO acts as the resource manager. This fits the doc's "PMO assigns PM + DT team".
- **Gap: Booking with a status.** Proposed shape: `Booking(userId, projectId, week, hours, status[soft|hard|proposed], source[presale|delivery|MA])`.
  - Presale PoC work and Close-Win projects not yet handed over show as soft. They appear hatched on the heatmap and don't count against capacity unless a "include soft" toggle is on.
  - Only hard-booked people can be assigned Tasks.
  - The prototype already mixes "Presale PoC" and "(Handover)" rows in `WorkloadView.vue`; booking status would make that distinction explicit.
- **Gap: per-person capacity.** Replace the flat 40 h with `capacityHours` per person per week, minus leave and Thai public holidays (a work calendar). Add a non-project allocation (MA on-call, internal).
- **Gap: pipeline-weighted demand.** This is the system's natural advantage, because the pipeline lives in the same app.
  - Demand = Σ(Cost Sheet man-days by role × stage probability) for Forecast/Rebidding projects, spread over the expected start..end. Stage probability is already defined as Opportunity 10–20%, Pipeline 40–50%, Forecast/Rebidding 70–80%.
  - Show a team-level chart of capacity vs hard + soft + weighted pipeline demand by month and role.
  - Kantata only markets this; the probability-weighting formula is a design proposal, not a vendor-documented feature.
- **Gap: skills matrix.** Proposed shape: `UserSkill(userId, skill, level 1–5, certifiedUntil)`. Use it to match requests, and track certification expiry (relevant for vendor-partner status).
- **Gap: utilization KPIs.**
  - Billable utilization = billable hours ÷ available hours.
  - Productive utilization includes presale and internal project hours.
  - Timesheet lines need `billable:boolean` and `activityType[project|presale|MA ticket|internal|leave]`.
  - Use SPI's 66.4% average as a reference point and a configurable target (e.g. 70–75%), with a note that targets vary by source.
- **Gap: timesheet approval workflow.**
  - Timesheet states: draft → submitted → approved/rejected by PM.
  - Lock approved weeks.
  - Report missing timesheets, flagging anyone with no submission by Monday noon.

  This is a standard PSA pattern, but no source was retrieved for it in this session (see Gaps).

### Gaps
- Could not fetch Kantata, Certinia, Autotask or Planview docs on skills matrices, timesheet approval rules or utilization definitions; only marketing pages were found. Timesheet approval and skills-matrix recommendations rest on general PSA convention, not cited vendor docs.
- The full SPI KPI list (all five) and definitions are paywalled. Only utilization, project overrun and revenue growth were confirmed via secondary sources.

## Earned value, budget burn, project health RAG, change requests, milestone billing & revenue recognition, status reports, lessons learned

### Takeaway
Use EVM (PV, EV, AC, SPI, CPI, EAC, TCPI) computed from milestones, task progress and timesheet cost as the objective basis of RAG health, with documented, fixed thresholds. Treat change requests as baseline adjustments. Support both milestone-based and progress-based billing, plus over-time revenue recognition (cost-to-cost) for TFRS 15. The current SalesFlow health (Schedule / Effort / Payment) has no formulas, thresholds or forecast.

### Cited Findings
- **EVM formulas.**
  - CPI = EV/AC and SPI = EV/PV.
  - EAC = BAC/CPI for typical variance. Alternatives are EAC = AC + (BAC−EV) at planned rate, EAC = AC + (BAC−EV)/(CPI×SPI), or EAC = AC + bottom-up ETC when scope changes.
  - TCPI = (BAC−EV)/(BAC−AC) against BAC, or (EAC−EV)/(EAC−AC) against EAC. A value above 1 means remaining work is harder to finish on budget.

  — [Rework EVM](https://resources.rework.com/libraries/project-management/earned-value-management); [4PMTI EAC](https://www.4pmti.com/learn/forecasting-projects-in-progress-with-eac-2/); [SAS EVM macros](https://support.sas.com/documentation/cdl/en/orpmug/67521/HTML/default/orpmug_evm_details02.htm)
- **RAG thresholds (no universal standard).**
  - Birdview defaults both CPI and SPI thresholds to 1. One index below threshold means moderate risk (amber). Both below means high risk (red).
  - Micro Focus PPM lets admins set separate red and yellow thresholds for CPI and SPI.

  — [Birdview help](https://help.birdviewpsa.com/hc/en-us/articles/115001822251); [Micro Focus PPM Cost & EV health policy](https://ppm-fedex.saas.microfocus.com/itg/pdf/manual/Content/UG/PjMUG/cost-n-earned-value-health-policy.htm)
- **RAG governance.** Define RAG criteria at planning time and document them. Changing thresholds mid-project to avoid a Red status is a governance failure. Thresholds should be context-dependent. — [Institute of Project Management](https://instituteprojectmanagement.com/blog/rag-status-in-project-management/); [Deltek RAG](https://www.deltek.com/resources/articles/rag-status/)
- No source found sets 0.9/0.95 as standard cutoffs. They are a convention to configure. — (search found none; see Birdview and Micro Focus above for configurable defaults)
- **Milestone and progress billing in MS Project Operations.**
  - Fixed-price contract lines carry a milestone-based invoice schedule, either generated periodically or added manually.
  - Fixed-price lines can instead use a progress-based schedule (percent complete).
  - A "Fixed Price Milestones" view lists all milestones across contracts, so finance can mark them ready to invoice. This is the billing backlog.

  — [MS Learn – invoice schedules contract line](https://learn.microsoft.com/en-us/dynamics365/project-operations/pro/sales/invoice-schedules-contract-line-sales); [MS Learn – progress-based billing](https://learn.microsoft.com/en-us/dynamics365/release-plan/2023wave2/finance-supply-chain/dynamics365-project-operations/progress-based-billing-fixed-price-contracts); [MS Learn – billing backlog](https://learn.microsoft.com/en-us/dynamics365/project-operations/pro/proforma-invoicing/manage-billing-backlog-sales)
- **Revenue recognition (IFRS 15 / TFRS 15).**
  - Cost-to-cost input method: progress = costs incurred to date ÷ total estimated costs, applied to the contract price. Example: £100k of £1m estimated cost means 10% of revenue is recognised.
  - Software projects may measure progress by hours incurred against budgeted hours.
  - Cost overruns can inflate revenue under input methods, so estimates need continual review.

  — [BDO UK](https://www.uk-acc.bdo.global/en-gb/insights/business-edge/business-edge-2018/ifrs-15-how-to-measure-revenue-recognised-over-time); [BDO TMT](https://www.au-tst2.bdo.global/en-au/insights/digital-technology/ifrs-15-for-the-tmt-industries-timing-of-revenue-recognition); [beancount](https://beancount.io/blog/2026/10/28/input-vs-output-methods-progress-long-term-contracts-guide)
- **Thai regulator material.** An SEC Thailand auditor seminar (Sep 2021) covers over-time vs point-in-time recognition and input-method examples. It states the views are the presenters' own, and one worked example has an arithmetic inconsistency. Forvis Mazars Thailand summarises TFRS 15. — [SEC Thailand deck](https://www.sec.or.th/TH/Documents/Auditor/auditor-seminar-sep2564.pdf); [Forvis Mazars TH](https://www.forvismazars.com/th/en/insights/doing-business-in-thailand/accounting/tfrs-15-revenue-from-contracts-with-customers3)

### Inferences
- **Gap: EVM per project, computed weekly.**
  - BAC = baseline cost (or man-days).
  - PV = sum of baseline cost of milestones/tasks scheduled to date.
  - EV = Σ(task estHours × % complete × rate), or milestone weight × progress.
  - AC = approved timesheet hours × cost rate + actual PO costs.
  - Show SPI, CPI, EAC, VAC (= BAC − EAC), TCPI and a burn chart (baseline, actual and forecast cumulative cost).
  - The existing `estHours`/`spent` in `Task` make Effort-based EV feasible now.
- **Gap: rule-based RAG, configured in Settings.**
  - Schedule: SPI ≥ 0.95 green, 0.85–0.95 amber, < 0.85 red, or any payment milestone past due by more than N days.
  - Cost: CPI with the same bands, or GP-at-completion falling below the approved GP minus X pts.
  - Payment: invoiced-but-unpaid more than 30/60 days.
  - Scope: open CRs pending more than N days.
  - Add a manual PM override with mandatory reason, plus a history of RAG per week.
  - The thresholds are a configurable proposal; the sources say there is no standard.
- **Gap: CR fields.** The current `ChangeRequest` has `title, manDays, cost, status`. Add:
  - requestedBy (customer/internal), reason, scheduleImpactDays, priceToCustomer, GP of the CR
  - approval chain (internal price approval reusing the existing approval engine, plus customer sign-off document)
  - link to the baseline version created, and billing milestone added
  - flag whether it becomes a new sales opportunity
- **Gap: milestone fields.** The current `Milestone` lacks:
  - `billingPercent` or amount
  - `acceptanceDocId` (inspection doc)
  - `invoiceNo`, `invoicedAt`, `dueAt` (credit term), `paidAt`
  - `penaltyPerDay`, retention amount
  - status [planned|delivered|accepted|invoiced|paid]

  Add a portfolio "billing backlog" view for finance: milestones accepted but not invoiced.
- **Gap: revenue recognition fields.** Add a `revRecMethod[point-in-time at acceptance|over-time cost-to-cost|milestone]` per project, or per line for mixed HW/SW/service deals. Add a monthly snapshot `RevenueRecognized(projectId, period, percentComplete, revenueToDate)` for finance. The Thai SI context, with HW resale plus implementation, often splits into point-in-time HW and over-time services; this split is an inference, so it needs confirmation with the company's auditor.
- **Gap: weekly status report.** Generate it from data: RAG per dimension, % complete, SPI/CPI, upcoming milestones, top RAID items, decisions needed. Store a snapshot per week (currently only "meeting minutes / weekly report" as files).
- **Gap: structured lessons learned.** Fields: category (estimate, scope, customer, vendor, technical), variance of actual vs sold man-days by role, recommendation, and template-update owner. Feed variance back into the Cost Sheet template (the doc already aims for this).

### Gaps
- No Thai-specific guidance on IT SI revenue recognition was retrieved beyond the general TFRS 15 material.
- Could not retrieve Project Operations' project-status fields (learn.microsoft.com blocked).

## Risk & issue management (RAID logs)

### Takeaway
A RAID log keeps four distinct record types (Risks, Assumptions, Issues, Dependencies) with owner, status and review date. Risks are scored by probability × impact. SalesFlow's `Risk(level, description, mitigation, owner, status)` covers only risks, has no scoring, and doesn't separate issues.

### Cited Findings
- **What a RAID log covers.** Risks, assumptions, issues and dependencies. Risk scoring uses just probability and impact, which is shallower than a full risk register but covers assumptions and dependencies. — [PlayCode RAID template](https://playcode.io/blog/raid-log-template)
- **Core fields.** A short description, owner, status, review date, and likelihood/impact plus mitigation. Assumptions record the impact if they prove invalid. Dependencies cover external and internal delivery dependencies. — [The Digital Project Manager](https://thedigitalprojectmanager.com/project-management/raid-log/); [UK LGA RAID guidance](https://lb2.local.gov.uk/sites/default/files/documents/3.10%20RAID%20Log%20Guidance.docx); [PMWorld360](https://www.pmworld360.com/?p=38020)
- **Ambiguity of the letters.** Some teams read A/D as Actions/Decisions, so the template should state which meaning it uses. — [The Digital Project Manager](https://thedigitalprojectmanager.com/project-management/raid-log/)

### Inferences
- **Gap: RAID entity.** Proposed shape: `RaidItem(projectId, type[risk|assumption|issue|dependency|decision], title, description, probability 1–5, impact 1–5, score=P×I, category[schedule|cost|scope|vendor|customer|technical], ownerId, response[avoid|mitigate|transfer|accept], mitigation, contingency, dueDate, reviewDate, status, raisedAt, closedAt, linkedCR, linkedMilestone)`.
- Add a portfolio heatmap (P×I) and escalation: score ≥ 15, or an issue open past its due date, notifies the Head of DT.
- Risks carried from presale (Cost Sheet contingency rationale) seed the log at handover.
- Track a risk→issue conversion when a risk materialises.

### Gaps
- No single authoritative (PMI) RAID field standard was retrieved; the fields above are a synthesis of templates.

## ITSM SLA (ServiceNow / ITIL 4): priority matrix, response vs resolution, business hours, pause, breach escalation, reporting; knowledge base; problem management

### Takeaway
Mature ITSM derives priority from impact × urgency and runs separate response and resolution SLA timers per ticket. Each timer has its own schedule (business hours vs 24×7), pause conditions (e.g. awaiting customer or vendor), and warnings at 50% and 75% before the breach. Incidents link to problems, known errors and knowledge articles. SalesFlow has one fixed SLA text, one `dueAt`, and no pause, calendar, escalation, knowledge base or problem records.

### Cited Findings
- **ServiceNow SLA model.**
  - An SLA definition is a template holding start, stop, pause and resume conditions, duration and schedule. Each ticket gets `task_sla` timing records.
  - Types are Response (time to first respond) and Resolution (time to resolve).
  - The schedule (`cmn_schedule`) defines the business time counted. With no schedule, the clock runs 24×7.

  — [ServiceNow Fluent SLA API docs](https://www.servicenow.com/docs/r/zUlSbxoxKPAWFDGUdAoSCw/bhljRzZsOOYk8M_F9ekPTQ); [ServiceNow community practitioner guide](https://www.servicenow.com/community/community-central-forum/the-complete-practitioner-s-guide-to-servicenow-slas-from/m-p/3453748)
- **Pause, stop and retroactive start.**
  - Pause condition examples: state = On Hold, awaiting user info, or awaiting vendor.
  - Resume happens when a resume condition matches, or when the pause condition no longer matches.
  - The stop condition (Resolved/Closed) marks the SLA met if it is reached before the duration expires.
  - Retroactive start subtracts prior paused time.
  - Example: P2 on an "8-5 Weekdays" schedule.

  — [ServiceNow Fluent SLA API](https://www.servicenow.com/docs/r/zUlSbxoxKPAWFDGUdAoSCw/bhljRzZsOOYk8M_F9ekPTQ); [S2 Labs](https://s2-labs.com/servicenow-admin/creating-configuring-sla-definitions/)
- **Breach warnings.** The Default SLA Workflow fires a warning event (`sla.warning.parm`) at 50% and 75%, and the breach at 100% is a separate event. Flow Designer can add percentage timers (e.g. 25/50/75) that email the assignee or manager. — [ServiceNow community](https://www.servicenow.com/community/developer-forum/sla-reached-notification-for-50-75-100/m-p/3472455); [ServiceNow community](https://www.servicenow.com/community/developer-forum/to-create-the-alert-notifications-pertaining-to-the-incidents/td-p/3474047)
- **ConnectWise PSA agreements.**
  - An agreement's SLA sets response and resolution targets for linked tickets and can override the default SLA.
  - Agreement "additions" hold the billed items and covered assets.
  - Pause SLA timers for statuses like "Waiting on Customer".

  — [BetterInvoice ConnectWise docs](https://betterinvoice-website.pages.dev/docs/connectwise/agreements/agreement-tab); [ConnectWise SLAs](https://www.connectwise.com/platform/psa/slas)
- **Priority matrix.** Priority = f(Impact, Urgency), typically a 3×3 grid: High/High = P1, Low/Low = P4, with some matrices adding a P5 for planning. ITIL does not prescribe minute values; targets come from the contract. — [InvGate](https://blog.invgate.com/itil-priority-matrix); [IT Process Maps](https://wiki.en.it-processmaps.com/index.php/Checklist_Incident_Priority); [PagerDuty](https://www.pagerduty.com/resources/digital-operations/learn/incident-priority-matrix/)
- **Example SLA targets (vendor, illustrative).**
  - Insight: P1 15 min response / 4 h resolution; P2 1 h / 8 h; P3 4 h / 72 h.
  - InvGate: P1 10 min / 4 h; P2 15 min / 8 h; P3 1 h / 2 working days; P4 4 h / 5 working days.

  — [Insight service levels](https://insight.com/en_US/help/managed-services-service-levels-and-requests.html); [InvGate](https://blog.invgate.com/itil-priority-matrix)
- **Problem management and known errors.**
  - A known error is a problem with an understood root cause and a workaround, but no permanent fix yet.
  - ITIL 4 brought back problem and error control. Fixes go through change enablement.

  — [IT Process Maps – Problem Mgmt](https://wiki.en.it-processmaps.com/index.php/Problem_Management); [InvGate ITIL 4 problem mgmt](https://blog.invgate.com/problem-management-in-an-itil-4-world)
- **KCS link.** A knowledge article becomes the known-error record once the cause is added. Trend analysis can use KCS article reuse counts instead of incident classification. — [Global Knowledge](https://www.globalknowledge.com/en-us/resources/articles/problem-management-and-knowledge-management)
- **Problem management metrics.** Incident recurrence rate, problem closure rate, time to identify a known error, % of incidents linked to a problem, and average incidents per known problem. — [HDI SupportWorld](https://www.thinkhdi.com/library/supportworld/2021/metrics-of-problem-management); [Global Knowledge](https://www.globalknowledge.com/en-us/resources/articles/problem-management-and-knowledge-management)

### Inferences
- **Gap: SLA policy per contract, not hard-coded.** Proposed shape: `SlaPolicy(id, name, calendarId, targets[{priority, responseMins, resolutionMins, workaroundMins?}], pauseStatuses[], coverage[8x5|24x7])`. Link it to `Warranty`/MA agreement (`Warranty.slaPolicy` already exists as a placeholder). Each MA renewal can carry a different tier.
- **Gap: business calendar.** Proposed shape: `Calendar(workdays, hours 08:30–17:30, Thai public holidays per year, customer-specific holidays)`. The SLA clock uses business minutes.
- **Gap: two timers per ticket.** Proposed shape: `TicketSla(ticketId, type[response|resolution], target, startedAt, pausedMins, breachAt, stage[in_progress|paused|met|breached], warnedAt50, warnedAt75)`. Replace the single `dueAt`. Pause on status "รอลูกค้า" (waiting for customer) or "รอ Vendor" (waiting for vendor), or a vendor RMA.
- **Gap: priority derived from an impact × urgency picker.** Impact choices: entire system / department / single user. Urgency choices: business stopped / degraded / workaround. Keep CR as a separate ticket type (service request / change), not a priority. Today P1/P2/P3/CR mixes priority with type.
- **Gap: escalation ladder.** Notify the assignee at 50%, the MA lead at 75%, and the Head of DT and the SM at breach (via Teams/Outlook). The existing hourly job is too coarse for a P1 15-min response; that needs a near-real-time job (e.g. 1–5 min).
- **Gap: SLA report fields** for the quarterly report and renewal evidence:
  - tickets by priority and category
  - % response met, % resolution met
  - MTTR, backlog age, reopen rate
  - top recurring issues, problems raised and closed
  - CSAT per ticket (if collected)
  - uptime (if monitored)
- **Gap: knowledge base and problem records.**
  - `KbArticle(projectId/product, symptom, cause, workaround, resolution, reuseCount)`
  - `Problem(projectId, rootCause, status, linkedTickets[], knownError:boolean, fixViaCR)`
  - Recurring tickets on the same project and component prompt a "Raise Problem" action.
  - KB articles from the warranty phase carry into MA projects via `parentId`.
- **Gap: ticket intake.** The doc has email → ticket. Also capture: reporter, channel, affected asset (from the Asset register), contract/MA coverage check (is the customer in warranty or MA or neither, and so billable?), and on-site vs remote.

### Gaps
- ITIL 4 Practice Guide text was not retrieved. The definitions above come from secondary training and vendor sources.

## Warranty / contract management & renewals: lead times, auto-renewal, renewal KPIs, MA pricing (% of contract), asset/license expiry, customer health score

### Takeaway
Renewal practice works back from the notice deadline, not the end date. It starts 90–120 days out with staged alerts and tracks renewal rate (GRR/NRR) as the KPI. MA pricing is commonly anchored to a percentage of original value; the software industry norm is 18–22% per year of license value. Health scoring combines support signals with usage and commercial signals. SalesFlow's 90/60/30/7 cadence is aligned with practice. Gaps are the renewal-pipeline KPIs, pricing guidance, the notice deadline, contract terms (auto-renew, escalation), and a health score.

### Cited Findings
- **Track the notice deadline.** The date that protects you is the last day to give non-renewal notice, not the expiry date. — [Vaquill](https://www.vaquill.ai/blog/contract-renewal-tracking)
- **Alert timing.**
  - Automated alerts at 30, 60 and 90 days before each renewal.
  - Start reviews 60–90 days before expiration, and 120+ days for high-value contracts.
  - Zycus stages alerts at 120, 90 and 30 days before the deadline.
  - Start large enterprise renewals 120+ days out.

  — [ContractSafe](https://www.contractsafe.com/blog/blog/contract-renewal-best-practices); [Zycus](https://www.zycus.com/glossary/wp-json/wp/v2/posts/115260); [Rework](https://resources.rework.com/libraries/post-sale-management/renewal-strategy-framework)
- **Notice periods.** Typically 30–90 days before expiration: 60 days is the enterprise standard, 90 days is buyer-friendly, and notice periods have been shrinking. — [CloudNuro](https://www.cloudnuro.ai/blog/saas-auto-renewal-clause)
- **Auto-renew review.** Review auto-renew clauses quarterly. — [ContractSafe](https://www.contractsafe.com/blog/blog/contract-renewal-best-practices)
- **Maintenance pricing norms.**
  - 18–22% of the initial license fee per year is the long-standing standard.
  - Some vendors charge more: Oracle Premier 22%, SAP Standard 19% / Enterprise 22%, IBM 20–25%, Microsoft SA 25–29%. These figures come from a vendor-benchmark site that sells negotiation services.
  - Rates have crept up from about 15–18% historically to 20%+.
  - Basing the percentage on the discounted (net) price, and capping annual escalation, are common negotiation levers.

  — [Forrester 2010](https://www.forrester.com/blogs/10-06-29-software_maintenance_fees_may_not_be_invulnerable_to_change_after_all/); [VendorBenchmark](https://vendorbenchmark.com/glossary/software-maintenance-support-fees); [Avasant](https://avasant.com/report/high-software-maintenance-fees-and-what-to-do-about-them/); [InformationWeek](https://www.informationweek.com/software/software-maintenance-fees-time-for-this-model-to-change/d/d-id/1075860); [GSA ITVMO](https://itvmo.gsa.gov/assets/files/Software-Maintenance-Negotiations-Best-Practices.pdf)
- **Renewal KPIs.**
  - GRR excludes expansion and cannot exceed 100%. NRR includes upsell and expansion.
  - SaaS Capital 2025 medians: NRR 96%, GRR 80%, both rising with contract value.
  - Top-tier targets: GRR 85–95%, NRR ≥ 110–120%.

  — [Klipfolio](https://www.klipfolio.com/metrics/difference/net-revenue-retention-rate-vs-gross-revenue-retention-rate/); [GigRadar citing SaaS Capital](https://gigradar.io/blog/net-revenue-retention); [Alexander Jarvis](https://www.alexanderjarvis.com/?p=112389); [Drivetrain](https://www.drivetrain.ai/strategic-finance-glossary/what-is-gross-revenue-retention-formula-benchmarks)
- **ConnectWise agreement renewal.** Copying an agreement carries over additions, work roles, work types and attachments, and resets start, end and billing dates. Third-party tools add renewal-date dashboards. — [BetterInvoice ConnectWise](https://betterinvoice-website.pages.dev/docs/connectwise/agreements/using-agreements); [ZenContract](https://marketplace.connectwise.com/zencontract)
- **Customer health score.**
  - Components: usage, engagement, support health and commercial signals. One illustrative weighting is 40% usage / 25% engagement / 20% support.
  - Support signals that matter more than raw ticket count: severity, SLA breaches, first-response time, resolution time, reopen rate, escalations.
  - Low ticket volume can mean the customer has disengaged.
  - Normalise by account size or seats.
  - Weak usage or rising tickets near renewal is a red flag.

  — [Saber](https://www.saber.app/glossary/health-score); [Giva](https://www.givainc.com/blog/customer-health-score-help-desk-data/); [Pedowitz Group](https://www.pedowitzgroup.com/why-connect-tickets-to-customer-health-scoring?hsLang=en); [Planhat](https://planhat.com/customer-success/health)

### Inferences
- **Gap: renewal record with contract terms.** Proposed shape: `ServiceContract(projectId, type[warranty|MA], start, end, noticeDays, noticeDeadline = end − noticeDays, autoRenew:boolean, escalationPct, coverage[8x5|24x7], slaPolicyId, coveredAssets[], value, billingFrequency[annual|quarterly])`. Alerts key off `noticeDeadline` when the customer must give notice. Thai government customers usually need a new procurement cycle, so lead time may need to be 120+ days to fit budget and procurement; this is an inference to validate with the SMs.
- **Gap: MA pricing helper.** On the MA quotation, suggest the price as a configurable % of the original contract, per component:
  - SW license support at 18–22% (pass-through vendor quote)
  - service MA at X% of implementation value
  - HW at vendor extended-warranty cost + margin

  Show prior-year MA value and uplift %. The 18–22% norm applies to software licenses; there is no cited norm for SI service MA, so make the rate configurable.
- **Gap: renewal pipeline view.**
  - Columns: due in 120/90/60/30 days; quoted; verbal yes; PO received; renewed; lost.
  - Renewal amount = prior-year value, with uplift tracked.
  - KPIs per team and SM:
    - renewal rate by count
    - GRR, and NRR including upsell or scope added
    - % renewed before expiry (no coverage gap)
    - average days from quote to PO
    - lost reasons (already in the doc)
- **Gap: coverage gap tracking.** If the MA PO arrives after warranty end, flag the ticket as "out of coverage" (billable or goodwill) and record the gap days.
- **Gap: asset / license register fields.** `Asset(projectId, type[HW|SW license|subscription|cert], vendor, model/SKU, serial/key, qty, location, vendorWarrantyEnd, licenseEnd, supportContractNo, vendorSupportLevel, cost, resaleValue)`. Group expiries by customer so one renewal quote bundles them (co-terming). Feed vendor-renewal costs into the MA Cost Sheet.
- **Gap: customer/project health score.** This feeds the 90-day internal review (the doc's "usage summary"). Inputs:
  - SLA breach count and % met
  - P1 count
  - reopen rate
  - ticket trend vs the previous quarter
  - payment delays (from milestones)
  - CSAT
  - executive-contact recency

  Use it to prioritise renewal attention.
- **Gap: MA project inheritance.** On renewal, the MA-type project should copy the asset list, SLA policy, KB articles and open problems, besides customer, team and contacts. It should also link a `renewalOf` contract and increment `renewalCount`.

### Gaps
- No services- or SI-specific renewal-rate benchmarks were found (only SaaS GRR/NRR).
- No source was found on typical MA fee % for Thai system integrators or for custom-development maintenance (as opposed to software licenses).
- Auto-renewal legality for Thai government contracts was not researched.

## Typical KPIs for each phase

### Takeaway
Each phase should have a small, formula-defined KPI set computed from the system's own data. Most inputs already exist in the SalesFlow model (milestones, tasks, timesheets, tickets, warranty dates). What is missing is the definitions and storage of the derived metrics.

### Cited Findings
- **Delivery and firm level.** SPI tracks utilization (2025 average 66.4% billable), project overrun and revenue growth (5.2% vs 10% healthy) as profitability predictors. — [Deltek/SPI](https://www.deltek.com/en/resources/articles/5-kpis-from-the-spi-professional-services-maturity-benchmark-report-every-pso-must-track-for-sustainable-growth)
- **Schedule and cost.** SPI, CPI, EAC, TCPI. — [Rework EVM](https://resources.rework.com/libraries/project-management/earned-value-management)
- **Service and ticket.** Response and resolution SLA attainment by priority. — [ServiceNow SLA API](https://www.servicenow.com/docs/r/zUlSbxoxKPAWFDGUdAoSCw/bhljRzZsOOYk8M_F9ekPTQ)
- **Problem management.** Incident recurrence rate, % incidents linked to a problem, time to identify a known error. — [HDI](https://www.thinkhdi.com/library/supportworld/2021/metrics-of-problem-management)
- **Renewal.** GRR, NRR, renewal rate. — [Klipfolio](https://www.klipfolio.com/metrics/difference/net-revenue-retention-rate-vs-gross-revenue-retention-rate/)

### Inferences
Proposed KPI set per phase. Formulas are a design proposal unless cited above.
- **Handover**
  - Days from Close Win to Handover complete
  - % checklist complete at kickoff
  - Handover quality score
  - Days from Close Win to first billable hour
- **Delivery (project)**
  - SPI, CPI, EAC vs sold cost
  - GP% sold vs forecast vs actual
  - % milestones on time
  - Open CR count and value
  - RAID: open high-score risks, overdue issues
- **Delivery (portfolio and resource)**
  - Billable utilization and productive utilization per person and team
  - Timesheet compliance %
  - Bench hours
  - Capacity vs demand (hard + soft + weighted pipeline) for the next 12 weeks
  - % projects Red / Amber
- **Billing**
  - Billing backlog (accepted not invoiced)
  - DSO / overdue receivables per milestone
  - Penalty incurred
- **Warranty and MA**
  - % response SLA met, % resolution SLA met per priority
  - MTTR, backlog age, reopen rate
  - Tickets per project per month
  - Recurrence rate, % tickets linked to KB/problem
  - CSAT
- **Renewal**
  - Renewal rate (count and value)
  - GRR / NRR
  - % renewed before expiry, coverage-gap days
  - Average MA uplift %
  - Lost-reason distribution
  - MA revenue as % of original project value
- **Close**
  - Actual vs sold man-days variance by role
  - Lessons captured, Cost Sheet template updates made

### Gaps
- No vendor-neutral, cited target values exist for most per-phase KPIs (e.g. timesheet compliance, handover lead time). Targets should be set internally after a baseline period, and the report should say so.
