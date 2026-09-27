# 农场管家系统 - 快速启动指南

本指南将帮助您在本地快速启动农场管家系统。

## 系统要求

- **操作系统**: Windows 10/11, macOS, 或 Linux
- **Node.js**: v18.0.0 或更高版本
- **MySQL**: v8.0 或更高版本
- **InfluxDB**: v2.7 或更高版本 (可选，用于时序数据)
- **Redis**: v6.0 或更高版本 (可选，用于缓存)
- **MQTT Broker**: 如 Mosquitto (可选，用于物联网设备通信)

## Windows 系统安装步骤

### 1. 安装 Node.js

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本 (推荐 v20.x)
3. 运行安装程序，按默认选项安装
4. 安装完成后，打开新的 PowerShell 窗口，验证安装:
   ```powershell
   node --version
   npm --version
   ```

### 2. 安装 MySQL

1. 访问 [MySQL 下载页](https://dev.mysql.com/downloads/installer/)
2. 下载 MySQL Installer (推荐 v8.0.x)
3. 运行安装程序:
   - 安装 MySQL Server 与 MySQL Shell/Client
   - 设置 root 密码（记住此密码，后续需要用到）
   - 保持默认端口 3306
   - 保持默认其他选项
4. 安装完成后，验证安装:
   ```powershell
   mysql --version
   ```

### 3. 安装 InfluxDB (可选)

1. 访问 [InfluxDB 下载页](https://portal.influxdata.com/downloads/)
2. 下载 Windows 版本的 InfluxDB
3. 解压到合适位置 (如 `C:\influxdb`)
4. 以管理员身份打开 PowerShell，运行:
   ```powershell
   cd C:\influxdb
   .\influxd.exe
   ```
5. 在另一个 PowerShell 窗口中，运行以下命令初始化:
   ```powershell
   .\influx.exe setup
   ```
   按照提示设置组织名称、桶名称和认证令牌

### 4. 创建项目数据库

1. 打开 PowerShell，连接到 MySQL:
   ```powershell
   mysql -u root -p
   ```
   (输入安装时设置的密码)

2. 创建数据库:
   ```sql
   CREATE DATABASE farm_management;
   \q
   ```

## 项目安装与启动

### 1. 解压项目文件

将项目文件解压到合适的位置 (如 `D:\Codebuddy\CodeBuddy\nyjc`)

### 2. 配置后端环境变量

1. 在 `backend` 目录中创建 `.env` 文件:
   ```powershell
   cd D:\Codebuddy\CodeBuddy\nyjc\backend
   Copy-Item .env.example .env
   ```

2. 编辑 `.env` 文件，修改以下配置:
   ```env
   # 修改为您的 MySQL 账号和密码
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=YOUR_PASSWORD
   DB_NAME=farm_management
   
   # 如果使用 InfluxDB，请修改以下配置
   INFLUX_TOKEN=YOUR_INFLUX_TOKEN
   INFLUX_ORG=YOUR_INFLUX_ORG
   ```

### 3. 安装后端依赖

```powershell
cd D:\Codebuddy\CodeBuddy\nyjc\backend
npm install
```

### 4. 运行数据库迁移

```powershell
cd D:\Codebuddy\CodeBuddy\nyjc\backend
npm run migration:run
```

### 5. 种子数据 (可选)

```powershell
cd D:\Codebuddy\CodeBuddy\nyjc\backend
npm run seed
```

这将创建默认用户账号和10种常见蔬菜品种。

### 6. 配置前端环境变量

1. 在 `frontend` 目录中创建 `.env` 文件:
   ```powershell
   cd D:\Codebuddy\CodeBuddy\nyjc\frontend
   Copy-Item .env.example .env
   ```

2. 保持默认配置即可

### 7. 安装前端依赖

```powershell
cd D:\Codebuddy\CodeBuddy\nyjc\frontend
npm install
```

### 8. 启动后端服务器

打开第一个 PowerShell 窗口:
```powershell
cd D:\Codebuddy\CodeBuddy\nyjc\backend
npm run dev
```

成功后，您将看到:
```
[INFO] Server listening on port 3000
[INFO] Environment: development
[INFO] API Base URL: http://localhost:3000/api/v1
[INFO] Connected to MySQL database
```

### 9. 启动前端服务器

打开第二个 PowerShell 窗口:
```powershell
cd D:\Codebuddy\CodeBuddy\nyjc\frontend
npm run dev
```

成功后，您将看到:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 10. 访问应用

1. 打开浏览器，访问 `http://localhost:5173/`
2. 您将看到登录页面
3. 使用以下默认账号之一登录:

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 系统管理员 |
| manager | manager123 | 农艺师 |
| operator | operator123 | 操作员 |
| observer | observer123 | 只读观察者 |

## 常见问题解决

### 问题 1: npm 命令无法识别

**原因**: Node.js 未正确安装或环境变量未配置

**解决方法**:
1. 重新安装 Node.js
2. 确保安装时勾选 "Add to PATH" 选项
3. 重启 PowerShell 窗口

### 问题 2: 无法连接到 MySQL

**原因**: MySQL 服务未启动或密码错误

**解决方法**:
1. 检查 MySQL 服务是否运行:
   ```powershell
   Get-Service *mysql*
   ```
2. 如果服务未运行，启动它:
   ```powershell
   Get-Service *mysql* | Start-Service
   ```
3. 检查 `.env` 文件中的数据库密码是否正确

### 问题 3: 端口 3000 或 5173 已被占用

**原因**: 其他应用程序正在使用这些端口

**解决方法**:
1. 查找占用端口的进程:
   ```powershell
   netstat -ano | findstr :3000
   netstat -ano | findstr :5173
   ```
2. 结束占用端口的进程，或修改项目配置使用其他端口

### 问题 4: 数据库迁移失败

**原因**: 数据库连接失败或迁移文件错误

**解决方法**:
1. 检查数据库连接配置
2. 确保数据库 `farm_management` 已创建
3. 检查迁移文件是否有语法错误

## 生产环境部署

### 后端部署

1. 构建后端:
   ```powershell
   cd backend
   npm run build
   ```

2. 启动生产服务器:
   ```powershell
   npm run start
   ```

### 前端部署

1. 构建前端:
   ```powershell
   cd frontend
   npm run build
   ```

2. 将 `dist` 目录中的文件部署到 Web 服务器 (如 Nginx, Apache)

## 项目结构概述

```
nyjc/
├── backend/          # 后端代码 (Node.js + TypeScript)
├── frontend/         # 前端代码 (Vue 3 + TypeScript)
├── scripts/          # 数据库种子数据和脚本
├── docker/           # Docker 配置 (可选)
├── specs/            # 项目规范文档
├── README.md         # 项目说明文档
└── QUICKSTART.md     # 本快速启动指南
```

## 下一步

成功启动项目后，您可以:

1. 探索各个功能模块 (地块、品种、员工、设备管理)
2. 查看仪表盘统计数据
3. 尝试创建、编辑和删除记录
4. 阅读 `README.md` 了解更多信息
5. 查看 `specs/` 目录中的规范文档

## 获取帮助

如果遇到问题，请:

1. 查看 `README.md` 中的详细说明
2. 检查 `.env` 配置文件是否正确
3. 查看控制台输出的错误信息
4. 在项目 Issues 中搜索类似问题
5. 创建新的 Issue 描述您的问题

---

**祝您使用愉快！**
