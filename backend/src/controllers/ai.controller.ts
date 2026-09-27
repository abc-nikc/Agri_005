import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';

/**
 * AI 智能助手 Controller
 */
export class AIController {

  /** AI 种植推荐 */
  async plantingRecommendation(req: Request, res: Response) {
    try {
      const { plotId, varietyId, area, season } = req.body;
      const result = await aiService.plantingRecommendation({ plotId, varietyId, area: Number(area), season });
      res.json({ success: true, data: { recommendation: result } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'AI 服务异常' });
    }
  }

  /** AI 环境分析 */
  async environmentAnalysis(req: Request, res: Response) {
    try {
      const { plotId } = req.query;
      const result = await aiService.environmentAnalysis(plotId as string);
      res.json({ success: true, data: { analysis: result } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'AI 服务异常' });
    }
  }

  /** AI 产量预测 */
  async yieldPrediction(req: Request, res: Response) {
    try {
      const { plotId, varietyId, batchId } = req.body;
      const result = await aiService.yieldPrediction({ plotId, varietyId, batchId });
      res.json({ success: true, data: { prediction: result } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'AI 服务异常' });
    }
  }

  /** AI 病虫害诊断 */
  async pestDiagnosis(req: Request, res: Response) {
    try {
      const { symptoms, plotId, varietyName } = req.body;
      if (!symptoms) {
        return res.status(400).json({ success: false, error: '请描述症状信息' });
      }
      const result = await aiService.pestDiagnosis({ symptoms, plotId, varietyName });
      res.json({ success: true, data: { diagnosis: result } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'AI 服务异常' });
    }
  }

  /** AI 农事问答 */
  async chat(req: Request, res: Response) {
    try {
      const { message, context } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, error: '请输入问题' });
      }
      const result = await aiService.chat({ message, context });
      res.json({ success: true, data: { reply: result } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'AI 服务异常' });
    }
  }

  /** AI 仪表盘洞察 */
  async dashboardInsight(req: Request, res: Response) {
    try {
      const result = await aiService.dashboardInsight();
      res.json({ success: true, data: { insight: result } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'AI 服务异常' });
    }
  }

  /** AI 地块分析 */
  async plotAnalysis(req: Request, res: Response) {
    try {
      const { plotId } = req.query;
      if (!plotId) return res.status(400).json({ success: false, error: '请指定地块ID' });
      const result = await aiService.plotAnalysis(plotId as string);
      res.json({ success: true, data: { analysis: result } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'AI 服务异常' });
    }
  }

  /** AI 智能排程 */
  async smartSchedule(req: Request, res: Response) {
    try {
      const result = await aiService.smartSchedule();
      res.json({ success: true, data: { schedule: result } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'AI 服务异常' });
    }
  }
}
