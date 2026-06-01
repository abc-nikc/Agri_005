import { Request, Response, NextFunction } from 'express';
import { equipmentService } from '../services/equipment.service';

export class EquipmentController {
  // 获取设备列表
  async getEquipment(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, status, plot_id } = req.query;
      const filters: any = {};
      
      if (type) filters.type = type;
      if (status) filters.status = status;
      if (plot_id) filters.associated_plot_id = plot_id;

      const equipment = await equipmentService.getEquipment(filters);
      res.json({
        success: true,
        data: equipment,
        message: '获取设备列表成功',
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取单个设备
  async getEquipmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const equipment = await equipmentService.getEquipmentById(id);
      
      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: '设备不存在',
        });
      }

      res.json({
        success: true,
        data: equipment,
        message: '获取设备详情成功',
      });
    } catch (error) {
      next(error);
    }
  }

  // 创建设备
  async createEquipment(req: Request, res: Response, next: NextFunction) {
    try {
      const equipmentData = req.body;
      const equipment = await equipmentService.createEquipment(equipmentData);
      
      res.status(201).json({
        success: true,
        data: equipment,
        message: '创建设备成功',
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新设备
  async updateEquipment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const equipmentData = req.body;
      
      const equipment = await equipmentService.updateEquipment(id, equipmentData);
      
      res.json({
        success: true,
        data: equipment,
        message: '更新设备成功',
      });
    } catch (error) {
      next(error);
    }
  }

  // 删除设备
  async deleteEquipment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await equipmentService.deleteEquipment(id);
      
      res.json({
        success: true,
        message: '删除设备成功',
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取维护提醒
  async getMaintenanceAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = await equipmentService.getMaintenanceAlerts();
      
      res.json({
        success: true,
        data: alerts,
        message: '获取维护提醒成功',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const equipmentController = new EquipmentController();
