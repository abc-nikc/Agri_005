import { MigrationInterface, QueryRunner, Table, Column, Index } from 'typeorm';

export class CreateBaseTables1234567890 implements MigrationInterface {
  name = 'CreateBaseTables1234567890';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 创建地块表
    await queryRunner.createTable(
      new Table({
        name: 'plots',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'plot_number',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'area',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'current_variety_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'idle'",
          },
          {
            name: 'soil_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'region',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new Index('IDX_PLOT_NUMBER', ['plot_number']),
          new Index('IDX_PLOT_STATUS', ['status']),
        ],
      })
    );

    // 创建品种表
    await queryRunner.createTable(
      new Table({
        name: 'varieties',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'sowing_season',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'planting_density',
            type: 'integer',
          },
          {
            name: 'fertilization_rate',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'watering_frequency',
            type: 'integer',
          },
          {
            name: 'growth_cycle',
            type: 'integer',
          },
          {
            name: 'safety_interval',
            type: 'integer',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new Index('IDX_VARIETY_NAME', ['name']),
          new Index('IDX_VARIETY_CATEGORY', ['category']),
        ],
      })
    );

    // 创建员工表
    await queryRunner.createTable(
      new Table({
        name: 'staff',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'username',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'system_role',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'business_division',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'total_work_hours',
            type: 'integer',
            default: 0,
          },
          {
            name: 'contact_phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new Index('IDX_STAFF_USERNAME', ['username']),
          new Index('IDX_STAFF_ROLE', ['system_role']),
        ],
      })
    );

    // 创建设备表
    await queryRunner.createTable(
      new Table({
        name: 'equipment',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'equipment_number',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'正常'",
          },
          {
            name: 'associated_plot_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'next_maintenance_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'mqtt_topic',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new Index('IDX_EQUIPMENT_NUMBER', ['equipment_number']),
          new Index('IDX_EQUIPMENT_STATUS', ['status']),
        ],
      })
    );

    // 创建通知表
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'is_read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new Index('IDX_NOTIFICATION_USER', ['user_id']),
          new Index('IDX_NOTIFICATION_READ', ['is_read']),
        ],
      })
    );

    // 添加外键约束
    await queryRunner.createForeignKey('plots', {
      columnNames: ['current_variety_id'],
      referencedTableName: 'varieties',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    });

    await queryRunner.createForeignKey('equipment', {
      columnNames: ['associated_plot_id'],
      referencedTableName: 'plots',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    });
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // 删除外键
    const equipmentTable = await queryRunner.getTable('equipment');
    const plotTable = await queryRunner.getTable('plots');
    
    if (equipmentTable) {
      const equipmentFk = equipmentTable.foreignKeys.find(fk => fk.columnNames.includes('associated_plot_id'));
      if (equipmentFk) {
        await queryRunner.dropForeignKey('equipment', equipmentFk);
      }
    }
    
    if (plotTable) {
      const plotFk = plotTable.foreignKeys.find(fk => fk.columnNames.includes('current_variety_id'));
      if (plotFk) {
        await queryRunner.dropForeignKey('plots', plotFk);
      }
    }

    // 删除表
    await queryRunner.dropTable('notifications');
    await queryRunner.dropTable('equipment');
    await queryRunner.dropTable('staff');
    await queryRunner.dropTable('varieties');
    await queryRunner.dropTable('plots');
  }
}
