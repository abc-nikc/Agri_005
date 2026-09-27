# 农场管家系统 - 一键启动脚本
# 使用方法: 在项目根目录运行 .\start-all.ps1

Write-Host "=== 农场管家系统 - 启动 ===" -ForegroundColor Green

# 确保 MySQL 运行
Write-Host "[1/3] 检查 MySQL..." -ForegroundColor Cyan
$mysqlService = Get-Service -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match 'mysql' -or $_.DisplayName -match 'mysql'
} | Select-Object -First 1
if ($mysqlService) {
    if ($mysqlService.Status -ne 'Running') {
        Start-Service -Name $mysqlService.Name
    }
    Write-Host "MySQL OK ($($mysqlService.Name))" -ForegroundColor Green
} elseif (-not (Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue)) {
    Write-Host "未检测到 MySQL。请安装 MySQL 8.0，或使用 'docker compose up -d --build' 启动完整环境。" -ForegroundColor Red
    exit 1
}

# 启动后端
Write-Host "[2/3] 启动后端 (端口 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoProfile", "-Command", "Set-Location '$PWD\backend'; npm run dev" -WindowStyle Hidden
Start-Sleep -Seconds 8
Write-Host "后端 OK (http://localhost:3001)" -ForegroundColor Green

# 启动前端
Write-Host "[3/3] 启动前端 (端口 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoProfile", "-Command", "Set-Location '$PWD\frontend'; npm run dev" -WindowStyle Hidden
Start-Sleep -Seconds 3
Write-Host "前端 OK (http://localhost:5173)" -ForegroundColor Green

Write-Host ""
Write-Host "=== 启动完成! ===" -ForegroundColor Green
Write-Host "前端: http://localhost:5173" -ForegroundColor Yellow
Write-Host "后端: http://localhost:3001/api/v1" -ForegroundColor Yellow
Write-Host "登录: admin / admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "种子数据: cd backend ; npx ts-node ../scripts/seed-full.ts" -ForegroundColor Gray
