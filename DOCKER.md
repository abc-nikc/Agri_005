# 农场管家系统 - Docker 快速启动指南

本指南将帮助您使用 Docker 快速启动农场管家系统。

## 系统要求

- **Docker Desktop**: v4.0 或更高版本
  - [Windows 下载](https://www.docker.com/products/docker-desktop/)
  - [macOS 下载](https://www.docker.com/products/docker-desktop/)
  - Linux: 使用包管理器安装 `docker` 和 `docker-compose`

## 快速启动步骤

### 1. 安装 Docker Desktop

1. 访问 [Docker 官网](https://www.docker.com/products/docker-desktop/)
2. 下载并安装 Docker Desktop
3. 启动 Docker Desktop
4. 验证安装:
   ```powershell
   docker --version
   docker-compose --version
   ```

### 2. 配置环境变量

1. 在项目根目录创建 `.env` 文件:
   ```powershell
   Copy-Item .env.example .env
   ```

2. 编辑 `.env` 文件，根据需要修改配置

### 3. 启动所有服务

```powershell
docker-compose up -d
```

这将启动以下服务:
- MySQL (端口 3306)
- InfluxDB (端口 8086)
- Redis (端口 6379)
- MQTT Broker (端口 1883)
- 后端服务 (端口 3000)
- 前端服务 (端口 5173)
- Adminer (端口 8080, 可选)

### 4. 查看服务状态

```powershell
docker-compose ps
```

### 5. 查看日志

```powershell
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 6. 访问应用

- **前端应用**: http://localhost:5173
- **后端 API**: http://localhost:3000/api/v1
- **数据库管理 (Adminer)**: http://localhost:8080
  - 系统: MySQL
  - 服务器: mysql
  - 用户名: root
  - 密码: password
  - 数据库: farm_management

### 7. 停止服务

```powershell
docker-compose down
```

## 数据库初始化

### 运行数据库迁移

```bash
docker-compose exec backend npm run migration:run
```

### 插入种子数据

```bash
docker-compose exec backend npm run seed
```

## 开发模式

### 进入后端容器

```bash
docker-compose exec backend sh
```

### 进入前端容器

```bash
docker-compose exec frontend sh
```

### 重启特定服务

```bash
docker-compose restart backend
docker-compose restart frontend
```

## 常见问题解决

### 问题 1: 端口已被占用

**解决方法**:
1. 修改 `docker-compose.yml` 中的端口映射
2. 或停止占用端口的服务

### 问题 2: 数据库连接失败

**解决方法**:
1. 检查 MySQL 容器是否正在运行:
   ```bash
   docker-compose ps mysql
   ```
2. 查看 MySQL 日志:
   ```bash
   docker-compose logs mysql
   ```

### 问题 3: 前端无法连接后端

**解决方法**:
1. 检查后端服务是否正在运行:
   ```bash
   docker-compose ps backend
   ```
2. 检查后端日志:
   ```bash
   docker-compose logs backend
   ```
3. 检查前端环境变量 `VITE_API_BASE_URL` 是否正确

## 生产环境部署

### 1. 修改环境变量

编辑 `.env` 文件，设置生产环境配置:
```env
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
REFRESH_TOKEN_SECRET=your-production-refresh-secret
```

### 2. 构建并启动服务

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3. 配置反向代理 (可选)

使用 Nginx 或 Traefik 作为反向代理，配置 SSL 证书

## 备份与恢复

### 备份数据库

```bash
docker-compose exec mysql mysqldump -u root -p farm_management > backup.sql
```

### 恢复数据库

```bash
docker-compose exec -T mysql mysql -u root -p farm_management < backup.sql
```

## 清理

### 停止并删除容器

```bash
docker-compose down
```

### 停止并删除容器、网络、卷

```bash
docker-compose down -v
```

### 删除所有未使用的 Docker 资源

```bash
docker system prune -a
```

## 下一步

成功启动项目后，您可以:

1. 访问前端应用，使用默认账号登录
2. 探索各个功能模块
3. 查看 API 文档 (如果使用 Swagger)
4. 配置 MQTT 设备连接
5. 设置 InfluxDB 数据源

## 获取帮助

如果遇到问题，请:

1. 查看服务日志: `docker-compose logs -f`
2. 检查容器状态: `docker-compose ps`
3. 查看 Docker Desktop 仪表盘
4. 在项目 Issues 中搜索类似问题
5. 创建新的 Issue 描述您的问题

---

**祝您使用愉快！**
