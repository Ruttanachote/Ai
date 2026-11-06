# Scope SalesFlow Worker's Mail.Send to the salesflow@ mailbox only (Exchange RBAC for Applications).
# Replaces Application Access Policies. Do NOT also grant tenant-wide Mail.Send in Entra.
# Review against current Microsoft docs before running — sources disagree on which id -App takes.
param(
  [Parameter(Mandatory)] [string] $WorkerAppId,       # Application (client) id
  [Parameter(Mandatory)] [string] $WorkerObjectId,    # Enterprise application (service principal) object id
  [string] $Mailbox = 'salesflow@stream.co.th'
)

Connect-ExchangeOnline

# 1) Exchange service principal pointer for the app
New-ServicePrincipal -AppId $WorkerAppId -ObjectId $WorkerObjectId -DisplayName 'SalesFlow Worker'

# 2) Management scope containing only the shared mailbox
New-ManagementScope -Name 'SalesFlow Mailbox' -RecipientRestrictionFilter "PrimarySmtpAddress -eq '$Mailbox'"

# 3) Assign the Application Mail.Send role limited to that scope
New-ManagementRoleAssignment -App $WorkerObjectId -Role 'Application Mail.Send' -CustomResourceScope 'SalesFlow Mailbox'

# 4) Verify: allowed for salesflow@, denied for anyone else (changes can take up to ~2 hours)
Test-ServicePrincipalAuthorization -Identity $WorkerObjectId -Resource $Mailbox
Test-ServicePrincipalAuthorization -Identity $WorkerObjectId -Resource 'ceo@stream.co.th'
