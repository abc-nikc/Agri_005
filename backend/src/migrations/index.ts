// 数据库迁移框架入口文件
// 使用 TypeORM 的迁移功能

export const migrationBasePath = __dirname;

// 迁移脚本命名规则：{timestamp}-{description}.ts
// 例如：1700000000000-CreatePlotsTable.ts

export interface Migration {
  up(queryRunner: any): Promise<void>;
  down(queryRunner: any): Promise<void>;
}
