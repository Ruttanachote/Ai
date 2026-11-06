# Microsoft 365 integration for Stream SalesFlow (Entra ID, SharePoint/Graph, Excel Workbook API, Outlook Actionable Messages, Exchange mail, Teams)

> **Method note.** learn.microsoft.com and most blogs were blocked from this session's network. I read the Microsoft Learn pages from their public GitHub source repos instead: `microsoftgraph/microsoft-graph-docs-contrib` (HEAD commit 2026-10-31), `OfficeDev/outlook-dev-docs` (pages dated May–June 2026) and `MicrosoftDocs/entra-docs`. Each citation links to the published Learn URL for that source file. Exchange Online "RBAC for Applications" could not be read first-hand (its docs repo did not clone), so those claims rest on search snippets and blogs and are marked as such.
>
> **Design under review** (`salesflow/docs/system-analysis.md` §3.2, §3.3, §6):
> - Identity: SSO with `openid profile User.Read` plus App Roles.
> - SharePoint: `Sites.Selected` on the site "Stream Projects".
> - Excel: `Files.ReadWrite` to copy `CostSheet_Quotation_2569.xlsx` and read the named ranges `Total_Revenue`, `Total_COGS`, `GP_Percent` and `OT_Reserve`.
> - Mail: `Mail.Send` from the shared mailbox `salesflow@`.
> - Teams: `OnlineMeetings.ReadWrite` and `ChannelMessage.Send`.
> - Approvals: Outlook Actionable Messages with Approve/Return buttons.
> - Sales: the Quotation tab converted to PDF and sent to Sales.
> - Scheduling: hourly background jobs.

## 1. Entra ID: App Roles vs security groups, token claims, group overage, multi-role users

### Takeaway
Use App Roles, defined on the SalesFlow app registration, as the RBAC source of truth. They arrive in the `roles` claim, are not subject to group overage, and a user with several roles gets all of them in the array. Assigning *groups* to App Roles needs Entra ID P1/P2, and nested groups are not honoured. If the app reads raw `groups` claims instead, it must handle the overage case of 200 groups for JWT.

### Cited Findings
- App roles are defined on the app registration. Users, groups or apps assigned to a role receive it in the `roles` claim of ID and access tokens. The role's "Value" is the exact string the code checks and can't contain spaces. — [Add app roles (Learn)](https://learn.microsoft.com/entra/identity-platform/howto-add-app-roles-in-apps)
- Microsoft says Entra groups and app roles "aren't mutually exclusive; they can be used together". — [Add app roles](https://learn.microsoft.com/entra/identity-platform/howto-add-app-roles-in-apps)
- Disabling an app role does *not* remove existing assignments, and the role "will continue to pass in the token(s)". You must remove the assignments to revoke it. — [Add app roles](https://learn.microsoft.com/entra/identity-platform/howto-add-app-roles-in-apps)
- Limit: 700 permission definitions (app roles plus exposed scopes) per application, and a separate 1,200-entry manifest limit. — [Add app roles](https://learn.microsoft.com/entra/identity-platform/howto-add-app-roles-in-apps)
- If a service principal is added to a group and the group is assigned an app role, Entra does not add the `roles` claim to that service principal's tokens. — [Add app roles](https://learn.microsoft.com/entra/identity-platform/howto-add-app-roles-in-apps)
- Group-based assignment to an enterprise app or app role requires Entra ID P1 or P2. Nested group memberships aren't supported; the assignment "doesn't cascade to nested groups". — [Assign users and groups (Learn)](https://learn.microsoft.com/entra/identity/enterprise-apps/assign-user-or-group-access-portal)
- Group overage: if a user is in more than 150 groups (SAML) or 200 groups (JWT), Entra omits the `groups` claim. It emits `_claim_names`/`_claim_sources` (or `hasgroups`), and the app must call Graph (`/users/{id}/getMemberObjects` or `memberOf`) to resolve membership. — [Access token claims reference](https://learn.microsoft.com/entra/identity-platform/access-token-claims-reference)
- `wids` carries tenant-wide directory roles, which are not app roles. — [Access token claims reference](https://learn.microsoft.com/entra/identity-platform/access-token-claims-reference)

### Inferences
- Recommended mapping:
  - Create App Roles: `SM`, `Sales`, `PMO`, `PM`, `DT`, `Approver.GM`, `Approver.CFO`, `Exec`, `Admin`.
  - Assign roles to Entra security groups if the tenant has P1 (Business Premium includes P1). Otherwise assign users directly.
  - Keep data-scope rules in the app DB: "which projects can this SM see" and approval thresholds by GP/value. App Roles say *what kind* of user someone is, not *which records* they can see.
- Multi-role users (e.g., an SM who is also an approver) receive multiple strings in `roles`. Authorize as the union of the roles, but block self-approval in business logic: the approver must not equal the submitter.
- Role changes only take effect when a new token is issued. Ordinary ID/access tokens last about 60–90 minutes. For sensitive actions such as approve, re-validate against Graph or the DB, or force re-authentication.
- Server-side enforcement (§1 of the design) must read `roles` from the validated token, not from the UI.
- Delegated `openid profile User.Read` is enough for SSO. Background jobs need a separate confidential client with application permissions, or the same app with a certificate credential.

### Gaps
- I did not verify the current default token lifetimes or Continuous Access Evaluation (CAE) behaviour for custom APIs in 2026.

## 2. SharePoint / OneDrive via Graph: Sites.Selected, folders, template copy, versions, lock, retention, change detection

### Takeaway
`Sites.Selected` is the right least-privilege scope, and it is now joined by finer `Lists.`/`ListItems.`/`Files.SelectedOperations.Selected` scopes. All Selected scopes support both delegated and application modes. Granting them takes three steps (consent, grant, token) and needs a highly privileged admin to make the site-level grant.

Folder creation, template copy (asynchronous), version listing and restore, check-out/check-in, and retention labels with record lock all have Graph endpoints. Two pitfalls:
- **Change notifications on SharePoint/OneDrive for Business drives only work at the drive root, and they fire on any change.** Use them only as a trigger, then call `delta` to find what changed.
- **Copying a file does not copy metadata, and version history is copied only on request.**

### Cited Findings
**Selected permission model (status as of Oct 2026 docs)**
- Scopes:
  - `Sites.Selected`: site collection.
  - `Lists.SelectedOperations.Selected`: list or library.
  - `ListItems.SelectedOperations.Selected`: items, files, folders.
  - `Files.SelectedOperations.Selected`: files or library folders.

  "All Selected scopes now support delegated and application modes." — [Overview of Selected permissions (Learn)](https://learn.microsoft.com/graph/permissions-selected-overview)
- Three steps are required:
  1. Admin consent of the scope in Entra.
  2. A grant: `POST /sites/{siteId}/permissions` with `roles` (`read` | `write` | `owner` | `fullcontrol`) and `grantedToIdentities[].application.id`. Lists use `/lists/{id}/permissions`, items `/listitem/permissions`, files `/driveItem/permissions`.
  3. A token that contains the scope.

  Missing any step means no access. — [Selected overview](https://learn.microsoft.com/graph/permissions-selected-overview)
- Making a **site** grant requires `Sites.FullControl.All`, because a Sites.Selected grant can confer full control. List-level grants can be made by an app holding Sites.Selected plus FullControl/Owner on that site. — [Selected overview](https://learn.microsoft.com/graph/permissions-selected-overview)
- The response flags `grantedToIdentities` as deprecated in favour of `grantedToIdentitiesV2`. — [Selected overview](https://learn.microsoft.com/graph/permissions-selected-overview)
- Assigning app permissions at list, item, folder or file level **breaks inheritance** and counts toward the unique-permissions limits. Site-level grants do not break inheritance. — [Selected overview](https://learn.microsoft.com/graph/permissions-selected-overview)
- Delegated + Selected = the intersection of user and app permissions. App-only = the grant alone. Revoking a Sites.* consent does not remove a separately granted Lists.* grant. — [Selected overview](https://learn.microsoft.com/graph/permissions-selected-overview)
- A Sites.Selected grant on a parent site is inherited by its child sites. — [michev.info blog](https://michev.info/blog/post/6074/granular-permissions-for-working-with-files-list-items-and-lists-added-to-the-graph-api) (secondary). The PnP cmdlet `Grant-PnPEntraIDAppSitePermission` can also make the grant. — via [fast.io summary](https://fast.io/resources/sharepoint-mcp-sites-selected.md) (secondary)
- Note: the per-API permission tables still list `Files.ReadWrite.All` / `Sites.ReadWrite.All` as "least privileged" for app-only copy, convert and checkout. Those tables do not list Selected scopes, but the Selected overview says any scope presented in the token is honoured by SharePoint/OneDrive. — [driveItem copy](https://learn.microsoft.com/graph/api/driveitem-copy), [Selected overview](https://learn.microsoft.com/graph/permissions-selected-overview)

**Folders and template copy**
- Create a folder with `POST /drives/{drive-id}/items/{parent-id}/children` and body `{ "name": "...", "folder": {}, "@microsoft.graph.conflictBehavior": "fail|rename|replace" }`. — [Create folder (Learn)](https://learn.microsoft.com/graph/api/driveitem-post-children)
- Copy with `POST /drives/{id}/items/{id}/copy`:
  - It is **asynchronous**: the response is `202 Accepted` with a `Location` monitor URL to poll.
  - It supports `childrenOnly` for copying a folder template, and `@microsoft.graph.conflictBehavior`, where `replace` works for files only.
  - It is limited to 30,000 items.
  - **Metadata isn't retained**, including custom columns.
  - Versions are copied only with `includeAllVersionHistory=true`. There is a known bug: that flag is ignored when `name` is also passed.

  — [driveItem copy (Learn, 2025-09-23)](https://learn.microsoft.com/graph/api/driveitem-copy)

**Versions, restore, lock**
- `GET /drives/{id}/items/{id}/versions` lists versions. Whether a version is created per edit, per save, manually or never depends on configuration. Older versions may be trimmed under admin version-limit settings. — [List versions (Learn)](https://learn.microsoft.com/graph/api/driveitem-list-versions)
- Restore with `POST /drives/{driveId}/items/{itemId}/versions/{version-id}/restoreVersion`. App-only permission: Files.ReadWrite.All. — [restoreVersion (Learn)](https://learn.microsoft.com/graph/api/driveitemversion-restoreversion)
- Check out with `POST /drives/{driveId}/items/{itemId}/checkout`, which prevents others from editing; `checkin` releases it. App-only permission: Files.ReadWrite.All. — [checkout (Learn)](https://learn.microsoft.com/graph/api/driveitem-checkout)
- Retention labels:
  - Endpoints: `PATCH /drives/{id}/items/{id}/retentionLabel` to set, plus get and remove.
  - `retentionLabelSettings` includes `behaviorDuringRetentionPeriod` (`retain`, `retainAsRecord`, `retainAsRegulatoryRecord`…) and a read-write `isRecordLocked`.

  — [setRetentionLabel](https://learn.microsoft.com/graph/api/driveitem-setretentionlabel), [retentionLabelSettings](https://learn.microsoft.com/graph/api/resources/retentionlabelsettings)

**Detecting file saves**
- Change-notification subscriptions on driveItem for OneDrive for Business/SharePoint:
  - Requires Files.Read.All, delegated or app.
  - "On OneDrive for Business, you can subscribe to only the root folder."
  - Drive root and list notifications support only `changeType=updated`.

  — [Create subscription (Learn)](https://learn.microsoft.com/graph/api/subscription-post-subscriptions), [subscription resource](https://learn.microsoft.com/graph/api/resources/subscription)
- Maximum subscription lifetime is 42,300 minutes (under 30 days) for driveItem and for SharePoint list. Subscriptions must be renewed. `clientState` is at most 128 characters and is used to verify origin. — [Subscription lifetime include](https://learn.microsoft.com/graph/change-notifications-overview), [subscription resource](https://learn.microsoft.com/graph/api/resources/subscription)
- Delta: `GET /drives/{id}/root/delta` returns pages and then an `@odata.deltaLink`. Store the link and call it later. `token=latest` gets a fresh cursor without enumerating. App-only permission: Files.Read.All. — [driveItem delta (Learn)](https://learn.microsoft.com/graph/api/driveitem-delta)

### Inferences
- **Grant process.** An admin runs a one-time grant script, for example Graph PowerShell or PnP using an admin identity with Sites.FullControl.All:

  ```
  POST /sites/{streamProjectsSiteId}/permissions
  { "roles": ["write"], "grantedToIdentities": [{ "application": { "id": "<SalesFlow-app-id>" } }] }
  ```

  `write` is enough for creating folders, copying and versioning. Request `fullcontrol` only if the app must break inheritance and set per-folder ACLs to "lock" stage folders, as design §3.1 implies.
- **Stage-folder "locking" (§3.1).** Per-folder unique permissions are the likely approach. Graph `POST /driveItem/invite` and `DELETE /permissions` manage sharing links and grants, but full SharePoint group/role-inheritance control is easier via SharePoint REST (`breakroleinheritance`). Either way it needs owner/fullcontrol on the site. A simpler option: keep the folders unlocked and enforce stage rules in the app, or create the stage folders only when the project reaches that stage. The latter avoids unique-permission sprawl and is the cheapest.
- **Versioning (§3.2).** On "submit for approval":
  1. Read `GET /items/{id}` (eTag, cTag, lastModified).
  2. Read `/versions` and record the latest `version.id` (e.g., "5.0") together with the eTag and the named-range snapshot in the DB.
  3. Optionally copy the file to an immutable `Submitted/OPP-69-xxxx_v2.xlsx` and apply a retention label with `retainAsRecord` (record lock). This guarantees the approved artefact survives version trimming.

  Version IDs alone are fragile: versions can be trimmed by version-limit or auto-trim policies.
- **Locking during approval.** Check-out by the app's identity blocks co-authors, but Excel Online co-authoring and check-out interact awkwardly, and libraries that require check-out disable co-authoring. Alternatives:
  - Temporarily switch the app's grant or the file's permissions to read-only for SM. This requires fullcontrol.
  - Treat the snapshot copy as the approved artefact and let the live file keep changing. This is the most robust.
- **Detecting saves.** Subscribe once to the document library (drive root, or the list via `/sites/{id}/lists/{id}`). On each notification, call the stored `deltaLink`, filter items under the project folders whose `file.mimeType` is xlsx, then re-read the named ranges, debounced by roughly 1–2 minutes because autosave produces many events. Renew subscriptions with a daily job; the limit is under 30 days. Keep a fallback poll of the delta link in the hourly job. A webhook endpoint must be public HTTPS; if hosting is internal-only, use polling of `delta` alone.

### Gaps
- I could not confirm whether webhook subscriptions on drive root work with a *Sites.Selected-only* app-only token. The subscription doc lists Files.Read.All / Sites.Read.All only. Needs a test.
- Unique-permission service limits (numbers) were not retrieved.
- Version limit or auto-trim defaults for 2026 SharePoint libraries were not retrieved.

## 3. Excel Workbook API: sessions, named ranges, throttling, size, concurrency, app-only, PDF export

### Takeaway
**The biggest pitfall: the Graph docs list *Application* (app-only) permissions as "Not supported" for `createSession` and for `names/{name}/range`.** Only delegated `Files.ReadWrite` is listed. The design's background-job reads of named ranges with an app-only `Sites.Selected` token are therefore not a documented, supported path. Read them in a delegated context, either on the user's own save or submit, or with a service account. Alternatively, parse the .xlsx yourself.

Other constraints:
- Sessions expire after about 5 minutes (persistent) or about 7 minutes (non-persistent) of inactivity.
- Excel throttling is 1,500 requests per 10 seconds per app per tenant, and Microsoft advises **sequential** requests per workbook.
- PDF conversion via `?format=pdf` works for xlsx but has a **2 MB source-file limit**, and there is no documented parameter to pick a single sheet.

### Cited Findings
- File type: only Office Open XML workbooks are supported; `.xls` is not. Files must be on OneDrive for Business or SharePoint, not consumer OneDrive. Access is via `/drives/{id}/items/{id}/workbook/` or a path. — [Excel resource (Learn)](https://learn.microsoft.com/graph/api/resources/excel)
- The Excel resource doc lists only `Files.Read` / `Files.ReadWrite`. — [Excel resource](https://learn.microsoft.com/graph/api/resources/excel)
- Permission tables:
  - `workbook: createSession`: Delegated (work or school) `Files.ReadWrite`; **Application: Not supported**.
  - `nameditem: range`: Delegated `Files.ReadWrite`; **Application: Not supported**.

  — [createSession](https://learn.microsoft.com/graph/api/workbook-createsession), [nameditem range](https://learn.microsoft.com/graph/api/nameditem-range)
- Session modes:
  - Persistent (`persistChanges:true`): changes saved.
  - Non-persistent: a temporary server copy, lost when the session expires.
  - Sessionless: works, but is inefficient for multiple calls.

  Use the header `workbook-session-id`. An expired session returns 404. "Typically the persistent session expires after about 5 minutes of inactivity. Non persistent session expires after about 7 minutes." — [Excel resource](https://learn.microsoft.com/graph/api/resources/excel)
- Long-running `createSession`: send `Prefer: respond-async`. The response is 202 with a `Location` to poll, ideally about every 30 seconds and never more than 4 minutes apart. Session creation for large workbooks can be slow. — [Excel best practices](https://learn.microsoft.com/graph/workbook-best-practice)
- Named items: `GET .../workbook/names` lists names, and `GET .../workbook/names/{name}/range` returns the range (values, text, address). — [Excel resource](https://learn.microsoft.com/graph/api/resources/excel), [nameditem range](https://learn.microsoft.com/graph/api/nameditem-range)
- Throttling: any Excel request is limited to 5,000 per 10 seconds per app across all tenants and **1,500 per 10 seconds per app per tenant**. Excel throttling also depends on workbook complexity, so honour `Retry-After`. — [Throttling limits: Excel](https://learn.microsoft.com/graph/throttling-limits), [best practices](https://learn.microsoft.com/graph/workbook-best-practice)
- Microsoft does not recommend parallelising requests to the same workbook. Concurrent writes cause throttling, timeouts, and "merge conflict (when concurrent sessions are involved)". Send requests sequentially per workbook. — [best practices](https://learn.microsoft.com/graph/workbook-best-practice)
- Error codes related to concurrent editors:
  - `accessConflict`: "another client has locked the workbook for edit".
  - `invalidSessionAccessConflict`.
  - `invalidSessionRestricted`.
  - `accessDenied`, e.g., writing to locked cells.

  502/503 errors in sessionful requests need specific handling. — [Excel error handling](https://learn.microsoft.com/graph/workbook-error-handling)
- PDF conversion:
  - `GET /drives/{id}/items/{id}/content?format=pdf` returns a 302 to a short-lived pre-authenticated URL.
  - Supported sources include xls, xlsx and xlsm.
  - **"The maximum size limit for files to use format conversion is 2 MB."**
  - App-only permission: Files.ReadWrite.All.
  - The only documented parameters are `format`, plus `width`/`height` for jpg. There is no sheet selector.

  — [Download in another format (Learn)](https://learn.microsoft.com/graph/api/driveitem-get-content-format)
- General Graph limit: 130,000 requests per 10 seconds per app across all tenants. — [Throttling limits](https://learn.microsoft.com/graph/throttling-limits)

### Inferences
- **App-only conflict.** Reading named ranges from a background job app-only is a documented-unsupported path. Community reports exist of the workbook API working app-only on SharePoint, but they are not authoritative and I did not verify them; treat them as unsupported. Options, ranked:
  1. **Delegated read on user action.** When the SM clicks "Sync numbers" or "Submit for approval", the web app calls Graph with the SM's delegated token. It reads `GET .../workbook/names/Total_Revenue/range?$select=values`, sessionless, or in a single non-persistent session for 4–6 names. Use JSON batching only with care, given the sequential advice. This fits the "read after save" flow and avoids app-only entirely. Add delegated `Files.ReadWrite` or a Selected scope to the SPA/API. Delegated + Sites.Selected intersects with the user's own rights.
  2. **Server-side parse.** Download the file bytes (`/content`, which works app-only with a Selected grant) and read the defined names with a library: openpyxl (Python), ClosedXML/EPPlus (.NET) or ExcelJS (Node). A pitfall: the library reads the **cached** formula results the last saving client stored. Excel Online saves calculated values, so this is generally fine, but it never recalculates.
  3. A service-account delegated token. This is a refresh-token-based service user, which is weaker security and needs MFA or Conditional Access exclusions. Not recommended.
- **Concurrency with Excel Online.** Reads during co-authoring generally work. Writes from the API while users edit risk `accessConflict` or merge conflicts. Make the app **read-only** against the workbook: never write cells via the API.
- **Template robustness.** Named ranges can be renamed or deleted by users. Validate on every read:
  - All expected names exist.
  - Each is a single cell with a numeric value.
  - The template version is recorded, for example in a hidden `Meta!TemplateVersion` name.
  - Workbook/worksheet protection is set on the Summary/Calc areas.
- **PDF of the Quotation tab only (§3.3 step 6).** The format=pdf endpoint converts the whole workbook, typically all visible sheets with their print areas; per-sheet behaviour is not documented. It is also capped at 2 MB, which is easily exceeded once logos or images are added. Options:
  - (a) Make a temporary copy, delete or hide the other sheets, convert, then delete the copy. Deleting sheets requires a delegated workbook session (`DELETE /worksheets/{id}`), which is not app-only.
  - (b) Recommended: generate the quotation PDF in the app from the approved snapshot data with an HTML-to-PDF or report template. The PDF then matches exactly what was approved, has Thai font control, and needs no 2 MB limit or Excel dependency.
  - (c) Keep a separate Quotation .docx/.xlsx template filled by the app, then convert it.
- File-size and calculation limits for Excel Online and the Graph workbook API were not found in the retrieved docs; see Gaps.

### Gaps
- An official workbook-size limit for the Graph Excel API was not found.
- Whether `?format=pdf` honours hidden sheets or print areas is not documented; needs a test.
- Whether app-only Workbook API calls actually work in 2026 despite the "Not supported" table was not tested.

## 4. Alternative: cost lines in the app DB (generate Excel) vs Excel as source of truth

### Takeaway
Excel-as-source-of-truth suits the estimators' existing habits, but it makes the app depend on fragile cell names, delegated-only APIs and post-hoc snapshotting. A hybrid is the pragmatic 2026 choice:
- Excel stays the editing surface.
- The app extracts and **stores an immutable numeric snapshot**, along with a file copy or record, at each submission.
- Approvals, baselines and PDFs are driven from the snapshot.

A longer-term move is structured cost lines in the DB, which is what the PM baseline and lessons-learned features in §4 of the design need anyway.

### Cited Findings
- The constraints that drive this choice come from §3: delegated-only Workbook API, session expiry, sequential-per-workbook advice, conflict errors while others edit, and the PDF size limit. — [Excel resource](https://learn.microsoft.com/graph/api/resources/excel), [best practices](https://learn.microsoft.com/graph/workbook-best-practice), [error handling](https://learn.microsoft.com/graph/workbook-error-handling), [format conversion](https://learn.microsoft.com/graph/api/driveitem-get-content-format)
- Copying a file loses metadata, and versions can be trimmed by admin settings. — [driveItem copy](https://learn.microsoft.com/graph/api/driveitem-copy), [List versions](https://learn.microsoft.com/graph/api/driveitem-list-versions)

### Inferences
- **Excel as source of truth.**
  - Pros: zero retraining; formulas are flexible; the full audit trail lives in SharePoint versions; offline/desktop Excel works too.
  - Cons: the app knows only the numbers you name; there is no line-level reporting (man-day by role across projects, actual vs plan per line) without parsing; template drift; delegated-only reads; versions can be trimmed; the PDF depends on Excel conversion.
- **DB as source of truth (generate Excel for export).**
  - Pros: line-level analytics and baselines for the PM module; server-enforced validation (contingency %, OT reserve); approval diffs line by line; easy PDF generation.
  - Cons: you must rebuild an editing grid UI (AG Grid or Handsontable); users lose free-form Excel; Excel export is one-way.
- **Hybrid (recommended phase 1).**
  - Keep Excel.
  - Add a structured `Lines` table (an Excel *table*, `GET .../workbook/tables/{name}/rows` delegated, or parsed server-side) besides the named totals.
  - Snapshot both into the DB on submit.
  - Make the approved snapshot the baseline.

  This keeps habits and enables §4 baselines.

### Gaps
- No sources were found on industry practice specific to Thai IT integrators. This section is engineering judgment.

## 5. Outlook Actionable Messages (2026 status) and alternatives

### Takeaway
Actionable Messages are **still supported in 2026**, but changed:
- The legacy External Access Token (EAT) was retired; **only Entra ID tokens work since June 8, 2026**.
- Registration is self-service, with "Organization" scope approved by the tenant's Exchange or Global admin.
- Cards must use Adaptive Cards with `Action.Execute`; an upgrade to 1.4+ makes `Action.Http` buttons disappear.
- Practical limits: actions can't be taken on messages older than one month; it doesn't work in mobile-browser OWA; it breaks behind Mimecast-style gateways; the sender needs SPF/DKIM or signed cards.

For an internal approval flow it is viable. Always pair it with an in-app approval link as a fallback, and consider Teams Adaptive Cards or Power Automate Approvals as alternatives.

### Cited Findings
- "Actionable Messages use Microsoft Entra ID–based token authentication. The transition from legacy (EAT) authentication completed on June 8, 2026. Legacy authentication is no longer supported. Integrations that have not been updated … no longer function." — [Outlook dev docs include (2026-06-22)](https://learn.microsoft.com/outlook/actionable-messages/); timeline also in [MC1189663 (merill)](https://mc.merill.net/message/MC1189663) and [M365 Admin (handsontek)](https://m365admin.handsontek.net/retirement-external-access-token-actionable-messages-moving-microsoft-entra-authentication/) (secondary; earlier notice said March 31, 2026, revised to May 15 → June 8, 2026)
- Onboarding portal refreshed with a new URL, rolling out June 2026. — [M365 Admin (handsontek)](https://m365admin.handsontek.net/outlook-actionable-messages-onboarding-portal-refresh-new-experience-updated-url/) (secondary)
- Registration happens through the Actionable Email Developer Dashboard (`aka.ms/ActionableMessagesPortal`). — [Developer dashboard (2026-06-10)](https://learn.microsoft.com/outlook/actionable-messages/email-dev-dashboard)
  - Scopes are Test Users, which auto-approves; Organization, which routes to the tenant's Exchange or Global admin; and Global, which Microsoft reviews.
  - Activation takes up to 24 hours.
  - You declare static sender addresses, e.g., `salesflow@…`.
  - You can submit only one scope per request.
- Entra token setup:
  1. Register a single-tenant Entra app for org/test scope.
  2. Expose a scope.
  3. Authorize the Actions client app ID `48af08dc-f6d2-435f-b2a7-069abd99c086` for that scope.
  4. Enter the Entra application ID in the provider registration, using "Migrate to MSEntra" for existing ones.
  5. Validate incoming tokens as standard Entra access tokens.

  — [Enable Entra token for AM](https://learn.microsoft.com/outlook/actionable-messages/enable-entra-token-for-actionable-messages)
- Older security doc (legacy, pre-Entra), kept for context:
  - The service must verify the bearer JWT on each action POST: `iss` `https://substrate.office.com/sts/`, `aud` the service base URL, and the `sender` claim.
  - The OpenID metadata is at `https://substrate.office.com/sts/common/.well-known/openid-configuration`.
  - Include a "Limited Purpose Token" in the URL.
  - Emails must pass SPF/DKIM or use signed card payloads (JWS).

  — [Security requirements](https://learn.microsoft.com/outlook/actionable-messages/security-requirements)
- Clients: supported in Outlook on the web, M365 Apps Current, Monthly Enterprise and Semi-Annual channels, Mac and iOS. **Not** supported in Office Professional Plus (Click-to-Run), on-prem OWA, or OWA in a mobile browser. Dark mode doesn't change rendering. — [AM overview (2026-05-27)](https://learn.microsoft.com/outlook/actionable-messages/)
- FAQ:
  - Upgrading cards to Adaptive Card 1.4+ requires `Action.Execute` instead of `Action.Http`, or the buttons disappear.
  - At most 10 actionable emails can be open at once.
  - **Actions are not possible on messages more than a month old.**
  - Mimecast-type services break AM.
  - Global-scope updates go via `onboardoam@microsoft.com` and take about two weeks.

  — [AM FAQ (2026-06-10)](https://learn.microsoft.com/outlook/actionable-messages/actionable-messages-faq)
- Teams: Office 365 Connectors and the Incoming Webhook in Teams were retired in 2026; Workflows (Power Automate) is the replacement. The final date is unclear across sources (March 31, April 30, or May 18–22, 2026). — [MS Q&A](https://learn.microsoft.com/en-us/answers/questions/5854971/will-teams-incoming-webhooks-stop-delivering-alert), [Argo CD docs](https://argo-cd.readthedocs.io/en/latest/operator-manual/notifications/services/teams/), [Infonaligy](https://www.infonaligy.com/blog/teams-connectors-retirement-power-automate-migration) (secondary, conflicting dates)

### Inferences
- **Implementing AM for SalesFlow.**
  - Send via Graph `sendMail` from `salesflow@` with HTML that embeds `<script type="application/adaptivecard+json">`. Use originator ID and Adaptive Card `Action.Execute` (or `Action.Http`).
  - Register the provider at "Organization" scope with sender `salesflow@<domain>` and the target URL base `https://salesflow.<domain>/api/am/`.
  - Validate the Entra token: issuer is the tenant, `aud` is your app ID URI, `appid`/`azp` is the AM Actions client `48af08dc-…`. Then map the acting user (`upn`/`oid` in the token) to the approver expected for that step. **Never trust IDs in the card body alone.**
  - Make the action idempotent with a one-time approval token in the payload and a check that the version is still current.
  - Return the `CARD-UPDATE-IN-BODY` / refresh card to show the "Approved by X at T" state.
  - Return-for-revision requires a reason: use an `Input.Text` with `isRequired`.
- **Fallbacks are required**:
  - The one-month action expiry.
  - Mobile browsers.
  - External mail gateways.
  - Executives using unsupported clients.

  Every email must include a deep link `https://salesflow/approvals/{id}` that uses SSO, and the in-app approval is the canonical path.
- **Alternatives, ranked for this context:**
  1. **Teams Adaptive Card through a bot (Teams app plus Azure Bot, `Action.Execute`, Universal Actions).** It works on mobile, needs no AM registration, and runs on the app's own backend. Proactive messages need the app installed for each approver, deployed via admin policy. More build effort.
  2. **Power Automate Approvals.** The app calls a flow via HTTP trigger; Approvals shows in Teams and Outlook with mobile support; the flow calls back the app API. Low code, with its own audit trail. Licensing: standard connectors are included with M365, but the HTTP trigger is a *premium* connector and needs Power Automate Premium; I did not verify 2026 pricing. Approval data lives in Dataverse.
  3. **Plain email with signed deep links** (Graph sendMail). The simplest and works everywhere, but needs a click-through to the web app.
- Recommendation: phase 1 uses option 3 plus the in-app page. Phase 2 adds AM at Organization scope, or a Teams bot if executives live in Teams mobile.

### Gaps
- Not verified: whether AM's Entra-token flow changed claim names in 2026, e.g., whether a `sender` claim is still present.
- Exact 2026 Power Automate Premium pricing was not retrieved.
- An official Microsoft statement on the 2026 final Teams connector cut-off date was not retrieved.

## 6. Sending mail from a shared mailbox with Graph (Mail.Send + Exchange RBAC for Applications)

### Takeaway
Use the **application** `Mail.Send` permission to send as `salesflow@` with `POST /users/salesflow@domain/sendMail`. Then scope it with **Exchange Online RBAC for Applications**, which has replaced Application Access Policies. Assign the role "Application Mail.Send" to the app's Exchange service principal with a management scope containing only the shared mailbox.

**Do not** also grant tenant-wide Entra `Mail.Send` admin consent, or the app can send as anyone. Outlook limits apply per app per mailbox: 10,000 requests per 10 minutes and 4 concurrent requests.

### Cited Findings
- Endpoint `POST /users/{id | userPrincipalName}/sendMail`. Permissions: Delegated `Mail.Send`; Application `Mail.Send`. It supports JSON with `fileAttachment` in the same call, or MIME. `saveToSentItems` defaults to true. — [user: sendMail (Learn)](https://learn.microsoft.com/graph/api/user-sendmail)
- Outlook throttling per app per mailbox: 10,000 API requests per 10 minutes, **4 concurrent requests**, and 150 MB upload per 5 minutes. JSON batches to Outlook execute four at a time. — [Throttling limits: Outlook](https://learn.microsoft.com/graph/throttling-limits)
- Microsoft Learn's Application Access Policies page says they are replaced by RBAC for Applications. RBAC for Apps "replaces Application Access Policies" and fixes over-privileged tenant-wide grants. Caveat: AutoDiscover can't be accessed with RBAC application roles. — [Learn: application access policies](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-access-policies), [Learn: Application RBAC](https://learn.microsoft.com/sv-se/exchange/permissions-exo/application-rbac), [icewolf blog, 2025-12-03](https://blog.icewolf.ch/archive/2025/12/03/exchange-online-app-access-policies-are-replaced-by-RBAC-for-applications/) (read via search snippets; Learn page not fetched directly)
- Pattern:
  1. `New-ServicePrincipal -AppId <EntraAppId> -ObjectId <EnterpriseAppObjectId>` in EXO.
  2. Create the scope: `New-ManagementScope -Name SalesFlowMbx -RecipientRestrictionFilter "PrimarySmtpAddress -eq 'salesflow@domain'"`, or use an admin unit or group.
  3. `New-ManagementRoleAssignment -App <SP id> -Role "Application Mail.Send" -CustomResourceScope SalesFlowMbx`.

  RBAC assignment is evaluated first, and Entra Mail.Send consent should *not* be granted tenant-wide. Propagation is reported as up to about 2 hours by one source and immediate by another. Test with `Test-ServicePrincipalAuthorization`. — [Office365ITPros, 2026-02-17](https://office365itpros.com/2026/02/17/mail-send-rbac-for-applications/amp/), [WPO365 tutorial](https://tutorials.wpo365.com/courses/email-configure-microsoft-graph-mailer/lessons/restricting-application-access-using-role-based-access-control-in-exchange-online/), [Jan Bakker](https://janbakker.tech/a-love-story-about-role-based-access-control-for-applications-in-exchange-online-managed-identities-entra-id-admin-units-and-graph-api/) (secondary; sources disagree on which ID `-App` takes)

### Inferences
- Shared mailboxes need no license (below 50 GB) and app-only sending as the mailbox itself works. If users should send "on behalf of" themselves from the app, use delegated Mail.Send plus Send As rights on the shared mailbox.
- **Attachments.** Inline `fileAttachment` in sendMail is limited to about 3 MB per request (my recollection of Graph guidance; not verified this session). For a larger quotation PDF, either create a draft with an upload session or send a SharePoint sharing link instead of attaching.
- For AM emails, the sender must exactly match the registered provider sender, and the domain must have SPF/DKIM aligned (§5).
- Customer-facing notices (warranty expiry, §5 of the design) go to external recipients. Configure DMARC alignment, and consider a separate mailbox, e.g., `noreply@` or `ma@`, with its own scope.

### Gaps
- The official Learn RBAC for Applications page could not be fetched.
- The exact `-App` parameter semantics and propagation time are unverified; the sources conflict.
- The Graph sendMail attachment size threshold was not verified.

## 7. Teams: online meetings for handover, channel messages

### Takeaway
Two corrections to design §6:
- **`ChannelMessage.Send` is delegated-only.** App-only posting to channels is supported only for migration (`Teamwork.Migrate.All`), so a background job cannot post channel notifications through Graph as the app. Use a Teams bot, Workflows (Power Automate) "post to channel" webhooks (incoming webhooks/O365 connectors were retired in 2026), or delegated posts on user action.
- **App-only online meeting creation needs a Teams Application Access Policy** (`New-/Grant-CsApplicationAccessPolicy`) for the organizer users. For a handover meeting that shows on calendars, create a calendar **event** with `isOnlineMeeting=true` (`Calendars.ReadWrite`) instead of a standalone `onlineMeeting`.

### Cited Findings
- `POST /me/onlineMeetings` or `/users/{userId}/onlineMeetings`:
  - Creates a **standalone meeting not on any calendar**.
  - For transcripts or calendar presence, Microsoft points to Create event with an online meeting.
  - App permission requires an admin-created application access policy granted to the user.

  — [Create onlineMeeting (Learn)](https://learn.microsoft.com/graph/api/application-post-onlinemeetings)
- Policy cmdlets: `New-CsApplicationAccessPolicy -Identity <name> -AppIds <ids>`, then `Grant-CsApplicationAccessPolicy -PolicyName <name> -Identity <userObjectId>` (or `-Global`). Changes take up to 30 minutes to apply. — [Online meeting application access policy (Learn)](https://learn.microsoft.com/graph/cloud-communication-online-meeting-application-access-policy)
- The legacy `POST /app/onlineMeetings` path (`application-post-onlinemeetings` permissions include) shows Delegated `OnlineMeetings.ReadWrite`, Application "Not supported". This is from the doc source; the per-user path with the policy is the supported app-only route. — [permissions include (Learn)](https://learn.microsoft.com/graph/api/application-post-onlinemeetings)
- `POST /teams/{id}/channels/{id}/messages`: Delegated `ChannelMessage.Send`; Application `Teamwork.Migrate.All` only, and "Application permissions are only supported for migration". — [channel: post messages (Learn)](https://learn.microsoft.com/graph/api/channel-post-messages)
- Teams throttling:
  - Channel message POST: 50 rps per app per tenant, **1 rps per channel**, 1 rps per user.
  - A sustained-rate check at about 83% of the listed values also applies.

  — [Throttling limits: Teams](https://learn.microsoft.com/graph/throttling-limits)

### Inferences
- **Handover meeting.** Use `POST /users/{pmUpn}/events` with attendees (SM, PM, DT lead) and `"isOnlineMeeting": true, "onlineMeetingProvider": "teamsForBusiness"`. Do it delegated as the PMO user who clicks "Schedule handover", which needs only delegated `Calendars.ReadWrite`. App-only is possible with application `Calendars.ReadWrite`, scoped with Exchange RBAC for Applications ("Application Calendars.ReadWrite") to PMO mailboxes. Store the returned `onlineMeeting.joinUrl` and event ID.
- **Team-channel notifications.** Options:
  - (a) A Teams bot via Azure Bot Service with proactive messages. This is the robust choice, with Adaptive Cards and actions.
  - (b) A Workflows "When a Teams webhook request is received" flow URL per channel, which is cheap. Treat the URL as a secret.
  - (c) Graph `chatMessage` delegated, only on user action.

  Drop `ChannelMessage.Send` (application) from the design.

### Gaps
- I did not verify the Workflows webhook payload limits or 2026 licensing.
- The Teams bot RSC (resource-specific consent) options for channel posting were not researched in depth.

## 8. Throttling, retries, audit logging, data residency/PDPA for Thailand

### Takeaway
Build one Graph client wrapper with:
- `Retry-After`-aware exponential backoff on 429/503/504.
- A per-workbook sequential queue.
- Per-mailbox concurrency of at most 4.
- Idempotency keys.

Every Graph write and every approval decision goes to an append-only audit table, and the M365 Unified Audit Log covers the M365 side. **Microsoft 365 has no in-country Thailand data residency yet.** Thailand is a "future" local region, so a Thai tenant's data is typically in the Asia-Pacific geography, e.g., Singapore or Hong Kong. That is acceptable under PDPA with appropriate cross-border safeguards, but it should be documented.

### Cited Findings
- Graph global limit: 130,000 requests per 10 seconds per app. The first limit hit triggers throttling, and only requests exceeding it are throttled. — [Throttling limits](https://learn.microsoft.com/graph/throttling-limits)
- Service-specific limits:
  - Excel: 1,500 per 10 s per tenant.
  - Outlook: 10,000 per 10 min and 4 concurrent requests per mailbox.
  - Teams channel POST: 1 rps per channel.
  - SharePoint/OneDrive: governed by SharePoint's "Avoid getting throttled or blocked" guidance (resource-unit based).

  — [Throttling limits](https://learn.microsoft.com/graph/throttling-limits)
- Excel: honour `Retry-After`. Errors such as `accessConflict` should not be retried until resolved. — [Excel error handling](https://learn.microsoft.com/graph/workbook-error-handling)
- Microsoft 365 data residency docs list Thailand under "Future Local Region Geography", together with Greece, Kuwait and Saudi Arabia. Thailand is not in the current APAC list, which covers Australia, Hong Kong, India, Indonesia, Japan, Malaysia, New Zealand, Singapore and South Korea. — [M365 data residency overview (Learn)](https://learn.microsoft.com/en-us/microsoft-365/enterprise/m365-dr-overview) (via search snippet, page about Feb 2026)
- Microsoft announced its first Thailand datacenter region in May 2024. An April 2026 report describes an investment of over $1B and expected support for Azure and M365 in-country. No go-live date was confirmed. — [Yahoo Finance/Reuters](https://finance.yahoo.com/news/microsoft-open-first-regional-data-041636177.html?.tsrc=rss), [BrandSpurNG (Apr 2026)](https://brandspurng.com/2026/04/07/microsoft-announces-over-1-billion-thailand-cloud-and-ai-investment-to-expand-data-infrastructure-and-digital-economy/) (secondary)

### Inferences
- **Retry policy.**
  - Retry on 429, 503 and 504 using `Retry-After`; otherwise backoff 2^n with jitter, capped at about 5 attempts.
  - Never auto-retry non-idempotent sendMail without a dedupe key. Store an outbox row first, then send, then mark it sent. That is the "transactional outbox" pattern.
  - Copy and long-running createSession: poll the `Location` header.
  - Use JSON batching (`/$batch`, at most 20 requests) for reads across many projects, with `dependsOn` for ordering where needed.
- **Hourly jobs.** Warranty notices, SLA checks and approver escalations read the DB, not Graph, so they barely touch throttling. Keep Graph calls to sendMail and occasional delta polling.
- **Audit.**
  - The app's audit table records who, what, when, the old and new value, the Graph request ID (`request-id`/`client-request-id` headers), the version ID and eTag.
  - Approval records store the token's `oid` and `upn`, the timestamp and the channel (web, AM or Teams).
  - On the M365 side, the Purview Unified Audit Log captures SharePoint file access/modification and Exchange sends by the app. Retention defaults to 180 days for Audit Standard; I did not verify the 2026 value.
- **Security baseline.**
  - Use a certificate credential, or a managed identity / federated credential if hosted on Azure, rather than client secrets.
  - Use separate app registrations for (a) user SSO/delegated and (b) background app-only.
  - Least privilege: Sites.Selected (write) on one site, Mail.Send scoped by Exchange RBAC to `salesflow@`, no `*.All` app permissions.
  - Use Conditional Access for users. Use Workload Identities Premium only if you want CA on the service principal.
  - Validate all inbound callbacks: Graph webhooks with `validationToken` and `clientState`; AM actions with the Entra token.
- **PDPA.**
  - Customer contact data (names, emails, phones) is personal data.
  - Keep the processing record (RoPA), the DPA with Microsoft (the Microsoft Products and Services DPA), the legal basis (contract or legitimate interest for B2B contacts), retention periods per folder type, and deletion procedures.
  - Cross-border transfer to Singapore or HK datacenters needs appropriate safeguards under the PDPA cross-border rules; the Microsoft DPA and SCCs are commonly relied on. This is my inference, not legal advice, and it was not verified against PDPC notifications this session.
  - Check the tenant's actual data location in M365 admin center → Settings → Org settings → Organization profile → Data location.

### Gaps
- PDPC (Thailand) cross-border transfer notifications (2023/2024) were not retrieved, so their applicability to Microsoft DPA/SCCs is unverified.
- Purview audit retention defaults for 2026 were not verified.
- SharePoint resource-unit numbers per tenant size were not retrieved.

---

### Recommended architecture summary (synthesis of the above; inference)
1. **Identity.**
   - App reg A, "SalesFlow Web": delegated `openid profile offline_access User.Read`, plus a delegated `Files.ReadWrite` or Selected scope for workbook reads. App Roles are defined here and assigned to groups (P1).
   - App reg B, "SalesFlow Worker": certificate credential, app-only `Sites.Selected` (granted `write` on "Stream Projects") and `Mail.Send` scoped via Exchange RBAC for Applications to `salesflow@`. Add `Calendars.ReadWrite` scoped to PMO mailboxes only if app-created meetings are required.
2. **SharePoint.**
   - On project create, the Worker creates `/OPP-69-xxxx/` and copies a folder template with `copy` + `childrenOnly:true` (async; poll the monitor).
   - On Pipeline, the Worker copies the xlsx template and renames it after the copy completes.
   - Stage locking is enforced in the app rather than by per-folder ACLs, to avoid unique-permission sprawl.
3. **Excel.** The SM edits in Excel Online. "Sync/Submit" in the web app reads the named ranges and a Lines table with the **user's delegated token**, one sequential call per name or a single session. A fallback is server-side parsing of downloaded bytes. A drive-root webhook plus `delta` raises a "numbers changed since last sync" badge.
4. **Submit.**
   - Snapshot the numbers, the version ID and the eTag in the DB.
   - Copy the file to `Submitted/vN` and apply a retainAsRecord retention label (lock).
   - Approval state lives in the DB.
5. **Approval delivery.** Phase 1 sends an email with a deep link via Graph sendMail, plus an in-app inbox. Phase 2 adds Actionable Messages (Organization scope, Entra token, `Action.Execute`), or a Teams bot or Power Automate Approvals.
6. **Quotation PDF.** Generated by the app from the approved snapshot with an HTML-to-PDF template and Thai fonts, stored back to the `Quotation` folder, and emailed with an attachment or link. This avoids the format=pdf 2 MB limit and whole-workbook conversion.
7. **Teams.** Handover is a calendar event with `isOnlineMeeting` (delegated by the PMO). Channel alerts go through a Teams bot or Workflows webhook. Drop app-only `ChannelMessage.Send`.
8. **Ops.** A Graph wrapper handles retry, backoff, outbox and audit. A daily job renews subscriptions, which last under 30 days. An hourly scheduler is DB-driven.
