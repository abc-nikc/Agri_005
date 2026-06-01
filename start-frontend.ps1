# 农场管家系统 - 前端启动脚本
# 使用方法: 在 PowerShell 中运行 ./start-frontend.ps1

Write-Host "========================================" -ForegroundColor Green
Write-Host "   农场管家系统 - 前端启动脚本" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 检查 Node.js 是否安装
Write-Host "检查 Node.js 安装..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js 已安装: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js 未安装，请先安装 Node.js (v18 或更高版本)" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Cyan
    Read-Host "按 Enter 键退出"
    exit 1
}

# 检查 npm 是否可用
Write-Host "检查 npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm 已安装: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm 不可用，请重新安装 Node.js" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}

# 进入前端目录
$frontendPath = Join-Path $PSScriptRoot "frontend"
if (-not (Test-Path $frontendPath)) {
    Write-Host "✗ 前端目录不存在: $frontendPath" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}

Set-Location $frontendPath
Write-Host "✓ 已进入前端目录: $frontendPath" -ForegroundColor Green

# 检查 .env 文件是否存在
$envFile = Join-Path $frontendPath ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "⚠ .env 文件不存在，正在从 .env.example 创建..." -ForegroundColor Yellow
    $envExample = Join-Path $frontendPath ".env.example"
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "✓ 已创建 .env 文件" -ForegroundColor Green
    } else {
        Write-Host "✗ .env.example 文件不存在，无法创建 .env 文件" -ForegroundColor Red
    }
}

# 检查依赖是否已安装
$nodeModulesPath = Join-Path $frontendPath "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "安装前端依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ 依赖安装失败" -ForegroundColor Red
        Read-Host "按 Enter 键退出"
        exit 1
    }
    Write-Host "✓ 依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "✓ 依赖已安装" -ForegroundColor Green
}

# 启动前端服务器
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   正在启动前端服务器..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "前端服务器将在 http://localhost:5173 启动" -ForegroundColor Cyan
Write-Host "请确保后端服务器已在 http://localhost:3000 运行" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Yellow
Write-Host ""

npm run dev
