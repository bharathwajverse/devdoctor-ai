# ==============================================================================
# devdoctor-ai — Push to GitHub Helper Script
# Target Repository: https://github.com/bharathwajverse/devdoctor-ai.git
# ==============================================================================

Write-Host "🩺 devdoctor-ai — Pushing all commits to GitHub..." -ForegroundColor Cyan

# Verify git remote
$remoteUrl = git remote get-url origin
Write-Host "📡 Remote Origin: $remoteUrl" -ForegroundColor Yellow

# Push main branch
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed all commits to https://github.com/bharathwajverse/devdoctor-ai" -ForegroundColor Green
    Write-Host "⭐ Check your repo at: https://github.com/bharathwajverse/devdoctor-ai" -ForegroundColor Cyan
} else {
    Write-Host "❌ Push failed. Please verify your GitHub personal access token or SSH key permissions." -ForegroundColor Red
    Write-Host "Tip: You can authenticate with GitHub CLI by running: gh auth login" -ForegroundColor Yellow
}
