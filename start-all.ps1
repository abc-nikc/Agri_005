# 农场管家系统 - 一键启动脚本
# 使用方法: 在项目根目录运行 .\start-all.ps1

Write-Host "=== 农场管家系统 - 启动 ===" -ForegroundColor Green

# 确保 PostgreSQL 运行
Write-Host "[1/3] 启动 PostgreSQL..." -ForegroundColor Cyan
net start postgresql-x64-15 2>$null
Write-Host "PostgreSQL OK" -ForegroundColor Green

# 启动后端
Write-Host "[2/3] 启动后端 (端口 3001)..." -ForegroundColor Cyan
$env:PATH += ";D:\Node"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; `$env:PATH += ';D:\Node'; npm run dev" -WindowStyle Minimized
Start-Sleep -Seconds 8
Write-Host "后端 OK (http://localhost:3001)" -ForegroundColor Green

# 启动前端
Write-Host "[3/3] 启动前端 (端口 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; `$env:PATH += ';D:\Node'; .\node_modules\.bin\vite.cmd --port 5173" -WindowStyle Minimized
Start-Sleep -Seconds 3
Write-Host "前端 OK (http://localhost:5173)" -ForegroundColor Green

Write-Host ""
Write-Host "=== 启动完成! ===" -ForegroundColor Green
Write-Host "前端: http://localhost:5173" -ForegroundColor Yellow
Write-Host "后端: http://localhost:3001/api/v1" -ForegroundColor Yellow
Write-Host "登录: admin / admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "种子数据: cd backend ; npx ts-node ../scripts/seed-full.ts" -ForegroundColor Gray
