# 农场管家系统 - 后端启动脚本
# 使用方法: 在 PowerShell 中运行 ./start-backend.ps1

Write-Host "========================================" -ForegroundColor Green
Write-Host "   农场管家系统 - 后端启动脚本" -ForegroundColor Green
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

# 进入后端目录
$backendPath = Join-Path $PSScriptRoot "backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "✗ 后端目录不存在: $backendPath" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}

Set-Location $backendPath
Write-Host "✓ 已进入后端目录: $backendPath" -ForegroundColor Green

# 检查 .env 文件是否存在
$envFile = Join-Path $backendPath ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "⚠ .env 文件不存在，正在从 .env.example 创建..." -ForegroundColor Yellow
    $envExample = Join-Path $backendPath ".env.example"
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "✓ 已创建 .env 文件，请编辑它以配置您的环境" -ForegroundColor Green
        Write-Host "  重要: 请修改 DATABASE_URL 和 DB_PASSWORD 为您的数据库密码" -ForegroundColor Cyan
    } else {
        Write-Host "✗ .env.example 文件不存在，无法创建 .env 文件" -ForegroundColor Red
    }
}

# 检查依赖是否已安装
$nodeModulesPath = Join-Path $backendPath "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "安装后端依赖..." -ForegroundColor Yellow
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

# 检查数据库是否可连接
Write-Host "检查数据库连接..." -ForegroundColor Yellow
Write-Host "确保 PostgreSQL 服务正在运行" -ForegroundColor Cyan
Write-Host "如果连接失败，请检查:" -ForegroundColor Cyan
Write-Host "  1. PostgreSQL 服务是否启动" -ForegroundColor Cyan
Write-Host "  2. .env 文件中的数据库配置是否正确" -ForegroundColor Cyan
Write-Host "  3. 数据库 farm_management 是否已创建" -ForegroundColor Cyan

# 启动后端服务器
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   正在启动后端服务器..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Yellow
Write-Host ""

npm run dev
