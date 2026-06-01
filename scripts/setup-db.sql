-- 农场管家系统数据库初始化脚本
-- 创建数据库和用户（如果不存在）

-- 创建用户
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'farm_user') THEN
    CREATE USER farm_user WITH PASSWORD 'farm_password';
  END IF;
END
$$;

-- 创建数据库
SELECT 'CREATE DATABASE farm_management OWNER farm_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'farm_management');

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE farm_management TO farm_user;

-- 连接到 farm_management 数据库
\c farm_management;

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 用于模糊搜索

-- 创建索引优化扩展
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 设置时区
SET TIME ZONE 'Asia/Shanghai';

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 授予 schema 权限
GRANT ALL ON SCHEMA public TO farm_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO farm_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO farm_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO farm_user;

-- 创建审计日志表（先创建，因为其他表需要外键引用）
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_ip INET,
  action_type VARCHAR(100) NOT NULL,
  action_params JSONB,
  target_entity VARCHAR(100),
  target_id UUID,
  before_state JSONB,
  after_state JSONB,
  result VARCHAR(20) NOT NULL CHECK (result IN ('成功', '失败', '异常')),
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建审计日志索引
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action_type);

-- 创建系统配置表
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  value_type VARCHAR(20) NOT NULL CHECK (value_type IN ('integer', 'float', 'string', 'boolean')),
  description TEXT,
  is_editable BOOLEAN DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认配置
INSERT INTO system_settings (setting_key, setting_value, value_type, description) VALUES
('duplicate_submit_interval', '5', 'integer', '重复提交间隔（分钟）'),
('stocktake_variance_threshold', '2.0', 'float', '盘点误差率阈值（%）'),
('expiry_alert_days', '30', 'integer', '效期预警提前天数'),
('low_stock_threshold', '100', 'integer', '低库存预警阈值（可分级配置）'),
('maintenance_alert_days', '3', 'integer', '设备维护提前提醒天数')
ON CONFLICT (setting_key) DO NOTHING;

-- 创建更新时间触发器
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE audit_logs IS '审计日志表 - 所有关键操作不可删除、不可篡改';
COMMENT ON TABLE system_settings IS '系统配置参数表 - 可配置阈值';

-- 完成提示
SELECT '数据库初始化完成！' AS message;
