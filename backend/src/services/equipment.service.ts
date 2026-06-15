import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Equipment } from '../models/equipment.entity';
import { Staff } from '../models/staff.entity';
import { NotificationService } from './notification.service';

export class EquipmentService {
  private equipmentRepository: Repository<Equipment>;
  private notificationService: NotificationService;

  constructor() {
    this.equipmentRepository = AppDataSource.getRepository(Equipment);
    this.notificationService = new NotificationService();
  }

  /**
   * 获取所有设备（含关联地块编号，支持筛选）
   */
  async findAll(filters?: any): Promise<any[]> {
    let sql = `
      SELECT 
        eq.id, eq.equipment_number AS equipmentNumber,
        eq.type, eq.status,
        eq.associated_plot_id AS associatedPlotId,
        eq.next_maintenance_date AS nextMaintenanceDate,
        eq.mqtt_topic AS mqttTopic,
        eq.created_at AS createdAt, eq.updated_at AS updatedAt,
        p.plot_number AS associatedPlotNumber
      FROM equipment eq
      LEFT JOIN plots p ON p.id = eq.associated_plot_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.type) { sql += ' AND eq.type = ?'; params.push(filters.type); }
    if (filters?.status) { sql += ' AND eq.status = ?'; params.push(filters.status); }
    if (filters?.associated_plot_id) { sql += ' AND eq.associated_plot_id = ?'; params.push(filters.associated_plot_id); }

    sql += ' ORDER BY eq.equipment_number ASC';
    return await this.equipmentRepository.query(sql, params);
  }

  /**
   * 根据 ID 获取设备
   */
  async findById(id: string): Promise<Equipment | null> {
    return await this.equipmentRepository.findOne({
      where: { id },
    });
  }

  /**
   * 创建设备
   */
  async create(equipmentData: Partial<Equipment>): Promise<Equipment> {
    // 验证设备编号唯一性
    const existing = await this.equipmentRepository.findOne({
      where: { equipmentNumber: equipmentData.equipmentNumber },
    });

    if (existing) {
      throw new Error(`设备编号 ${equipmentData.equipmentNumber} 已存在`);
    }

    // 验证维护日期（只比较日期部分，忽略时分秒）
    if (equipmentData.nextMaintenanceDate) {
      const mDate = new Date(equipmentData.nextMaintenanceDate + 'T12:00:00');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (mDate.getTime() < today.getTime()) {
        throw new Error('下次维护日期不能早于今天');
      }
    }

    const equipment = this.equipmentRepository.create(equipmentData);
    return await this.equipmentRepository.save(equipment);
  }

  /**
   * 更新设备
   */
  async update(id: string, equipmentData: Partial<Equipment>): Promise<Equipment> {
    const equipment = await this.findById(id);
    
    if (!equipment) {
      throw new Error('设备不存在');
    }

    // 验证设备编号唯一性（如果修改了编号）
    if (equipmentData.equipmentNumber && equipmentData.equipmentNumber !== equipment.equipmentNumber) {
      const existing = await this.equipmentRepository.findOne({
        where: { equipmentNumber: equipmentData.equipmentNumber },
      });

      if (existing) {
        throw new Error(`设备编号 ${equipmentData.equipmentNumber} 已存在`);
      }
    }

    // 验证维护日期（只比较日期部分，忽略时分秒）
    if (equipmentData.nextMaintenanceDate) {
      const mDate = new Date(equipmentData.nextMaintenanceDate + 'T12:00:00');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (mDate.getTime() < today.getTime()) {
        throw new Error('下次维护日期不能早于今天');
      }
    }

    Object.assign(equipment, equipmentData);
    return await this.equipmentRepository.save(equipment);
  }

  /**
   * 删除设备
   */
  async delete(id: string): Promise<void> {
    const result = await this.equipmentRepository.delete(id);
    
    if (result.affected === 0) {
      throw new Error('设备不存在');
    }
  }

  /**
   * 获取维护提醒（返回需要维护的设备列表）
   */
  async getMaintenanceAlerts(): Promise<Equipment[]> {
    const equipment = await this.findAll();
    const now = new Date();
    const alertThresholdDays = 3;

    return equipment.filter(eq => {
      if (!eq.nextMaintenanceDate) return false;
      const days = Math.ceil((new Date(eq.nextMaintenanceDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= alertThresholdDays;
    });
  }

  // Aliases for controller compatibility
  async getEquipment(filters?: any): Promise<any[]> { return this.findAll(filters); }
  async getEquipmentById(id: string): Promise<Equipment | null> { return this.findById(id); }
  async createEquipment(data: Partial<Equipment>): Promise<Equipment> { return this.create(data); }
  async updateEquipment(id: string, data: Partial<Equipment>): Promise<Equipment> { return this.update(id, data); }
  async deleteEquipment(id: string): Promise<void> { return this.delete(id); }

  /**
   * 更新设备状态
   */
  async updateStatus(id: string, status: string): Promise<Equipment> {
    const equipment = await this.findById(id);
    if (!equipment) throw new Error('设备不存在');
    const validStatuses = ['正常', '维护中', '故障'];
    if (!validStatuses.includes(status)) throw new Error(`无效的状态：${status}`);
    equipment.status = status;
    return await this.equipmentRepository.save(equipment);
  }

  /**
   * 启动定时维护提醒检测（每30分钟）
   */
  startMaintenanceChecker(): void {
    const check = async () => {
      try {
        const alerts = await this.getMaintenanceAlerts();
        if (alerts.length > 0) {
          const staffRepo = AppDataSource.getRepository(Staff);
          const admins = await staffRepo.find({ where: { systemRole: '系统管理员', isActive: true } });
          for (const a of alerts) {
            const days = Math.ceil((new Date(a.nextMaintenanceDate!).getTime() - Date.now()) / 86400000);
            for (const admin of admins) {
              await this.notificationService.sendNotification(admin.id, `设备 ${a.equipmentNumber} 需${days}天内维护`, { type: 'maintenance', link: '/equipment' });
            }
          }
          console.log(`[Maintenance] ${alerts.length} devices need maintenance, notified admins`);
        }
      } catch (e: any) { /* 静默处理 */ }
    };
    check(); // 启动时立即检测
    setInterval(check, 30 * 60 * 1000);
    console.log('[Maintenance] Checker started (every 30min)');
  }
}

export const equipmentService = new EquipmentService();
