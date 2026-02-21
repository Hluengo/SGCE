$ErrorActionPreference = "Stop"

if (-not $env:GITHUB_TOKEN) {
  throw "Missing GITHUB_TOKEN environment variable."
}

$remoteUrl = git remote get-url origin
if (-not $remoteUrl) {
  throw "Could not read origin remote URL."
}

if ($remoteUrl -match "github\.com[:/](?<owner>[^/]+)/(?<repo>[^/.]+)(\.git)?$") {
  $owner = $Matches.owner
  $repo = $Matches.repo
} else {
  throw "Could not parse GitHub owner/repo from origin: $remoteUrl"
}

$headers = @{
  Authorization = "Bearer $($env:GITHUB_TOKEN)"
  Accept        = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
}

$payload = @{
  required_status_checks = @{
    strict   = $true
    contexts = @("quality-gate")
  }
  enforce_admins = $true
  required_pull_request_reviews = @{
    required_approving_review_count = 1
    dismiss_stale_reviews           = $true
    require_code_owner_reviews      = $false
    require_last_push_approval      = $false
  }
  restrictions = $null
  required_linear_history = $false
  allow_force_pushes = $false
  allow_deletions = $false
  block_creations = $false
  required_conversation_resolution = $true
  lock_branch = $false
  allow_fork_syncing = $false
}

$branches = @("main", "develop")
foreach ($branch in $branches) {
  $uri = "https://api.github.com/repos/$owner/$repo/branches/$branch/protection"
  Write-Host "Applying branch protection to $owner/$repo:$branch"
  Invoke-RestMethod -Method Put -Uri $uri -Headers $headers -Body ($payload | ConvertTo-Json -Depth 10) -ContentType "application/json" | Out-Null
}

Write-Host "Branch protection applied successfully for main and develop."
