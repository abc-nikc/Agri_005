import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Equipment } from '../models/equipment.entity';
import { NotificationService } from './notification.service';

export class EquipmentService {
  private equipmentRepository: Repository<Equipment>;
  private notificationService: NotificationService;

  constructor() {
    this.equipmentRepository = AppDataSource.getRepository(Equipment);
    this.notificationService = new NotificationService();
  }

  /**
   * 获取所有设备
   */
  async findAll(): Promise<Equipment[]> {
    return await this.equipmentRepository.find({
      order: { equipmentNumber: 'ASC' },
    });
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

    // 验证维护日期
    if (equipmentData.nextMaintenanceDate) {
      const maintenanceDate = new Date(equipmentData.nextMaintenanceDate);
      if (maintenanceDate < new Date()) {
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

    // 验证维护日期
    if (equipmentData.nextMaintenanceDate) {
      const maintenanceDate = new Date(equipmentData.nextMaintenanceDate);
      if (maintenanceDate < new Date()) {
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
  async getEquipment(filters?: any): Promise<Equipment[]> { return this.findAll(); }
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
}

export const equipmentService = new EquipmentService();
