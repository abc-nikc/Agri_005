import { Request, Response } from 'express';
import { TraceabilityService } from '../services/traceability.service';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const service = new TraceabilityService();

// FR-028: 消费者扫码查询（无需认证）
export const publicTrace = async (req: Request, res: Response) => {
  try {
    const record = await service.getByCode(req.params.code);
    if (!record) return res.status(404).json({ error: '追溯码不存在' });
    // 只返回非敏感数据
    res.json({
      data: {
        traceCode: record.traceCode,
        batchNumber: record.batchNumber,
        plotName: record.plotName,
        varietyName: record.varietyName,
        sowDate: record.sowDate,
        harvestDate: record.harvestDate,
        area: record.area,
        operationsData: record.operationsData,
        inputsData: record.inputsData,
      },
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
};

// 列表（认证）
export const list = [
  authenticate, authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (_req: Request, res: Response) => {
    try { res.json({ data: await service.findAll() }); } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
];

// FR-027: 生成追溯码
export const generate = [
  authenticate, authorize(['系统管理员', '农艺师']),
  async (req: Request, res: Response) => {
    try {
      const record = await service.generateTrace(req.body.batchId, (req as any).user?.username);
      res.status(201).json({ data: record });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
];

// FR-029: 导出PDF报告
export const exportReport = [
  authenticate, authorize(['系统管理员', '农艺师']),
  async (req: Request, res: Response) => {
    try {
      const html = await service.exportReport(req.params.code, (req as any).user?.username);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
];
