-- 农场管家系统 MySQL 8.0 初始化脚本
-- Docker 首次创建数据卷时以 root 身份执行。

CREATE DATABASE IF NOT EXISTS farm_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'farm_user'@'%' IDENTIFIED BY 'farm_password';
GRANT ALL PRIVILEGES ON farm_management.* TO 'farm_user'@'%';
FLUSH PRIVILEGES;

ALTER DATABASE farm_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

SELECT 'MySQL database initialization completed.' AS message;
