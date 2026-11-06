# Grant SalesFlow Worker write access to ONE SharePoint site (Sites.Selected).
# Run as an admin whose token has Sites.FullControl.All (e.g. via Graph PowerShell, delegated).
# Review before running — not executed against a real tenant by the authors.
param(
  [Parameter(Mandatory)] [string] $SiteUrl,          # https://stream.sharepoint.com/sites/StreamProjects
  [Parameter(Mandatory)] [string] $WorkerClientId,
  [string] $WorkerDisplayName = 'SalesFlow Worker',
  [ValidateSet('read', 'write')] [string] $Role = 'write'
)

Connect-MgGraph -Scopes 'Sites.FullControl.All' -NoWelcome

$uri = [Uri] $SiteUrl
$site = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/v1.0/sites/$($uri.Host):$($uri.AbsolutePath)"
Write-Host "Site id: $($site.id)"

$body = @{
  roles = @($Role)
  grantedToIdentities = @(@{ application = @{ id = $WorkerClientId; displayName = $WorkerDisplayName } })
} | ConvertTo-Json -Depth 5

Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/sites/$($site.id)/permissions" -Body $body -ContentType 'application/json'

# Verify
Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/v1.0/sites/$($site.id)/permissions" |
  Select-Object -ExpandProperty value | Format-Table id, roles
