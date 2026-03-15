# Cloudflare Workers 环境变量设置脚本 (PowerShell)
# 用于将 .env 文件中的敏感变量设置到 Cloudflare Workers

Write-Host "开始设置 Cloudflare Workers 环境变量..." -ForegroundColor Green
Write-Host ""

# 从 .env 文件读取变量
if (Test-Path .env) {
    Get-Content .env | Where-Object { $_ -notmatch '^#' } | ForEach-Object {
        if ($_ -match '^([^=]+)=(.+)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
} else {
    Write-Host "错误：.env 文件不存在" -ForegroundColor Red
    exit 1
}

# 设置敏感变量
Write-Host "设置敏感变量..." -ForegroundColor Yellow

$apiToken = [System.Environment]::GetEnvironmentVariable("API_TOKEN")
$wxSecret = [System.Environment]::GetEnvironmentVariable("WX_SECRET")

if ($apiToken) {
    Write-Host "设置 API_TOKEN..." -ForegroundColor Cyan
    $apiToken | wrangler secret put API_TOKEN
} else {
    Write-Host "警告：API_TOKEN 未设置" -ForegroundColor Yellow
}

if ($wxSecret) {
    Write-Host "设置 WX_SECRET..." -ForegroundColor Cyan
    $wxSecret | wrangler secret put WX_SECRET
} else {
    Write-Host "警告：WX_SECRET 未设置" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "敏感变量设置完成" -ForegroundColor Green
Write-Host ""
Write-Host "非敏感变量可以通过以下命令设置：" -ForegroundColor Yellow
Write-Host "wrangler secret put WX_APPID" -ForegroundColor White
Write-Host "wrangler secret put WX_USERID" -ForegroundColor White
Write-Host "wrangler secret put WX_TEMPLATE_ID" -ForegroundColor White
Write-Host "wrangler secret put WX_BASE_URL" -ForegroundColor White
Write-Host ""
Write-Host "或者直接编辑 wrangler.toml 文件添加 [vars] 配置" -ForegroundColor Yellow
