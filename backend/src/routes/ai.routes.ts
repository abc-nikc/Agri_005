import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';

const router = Router();
const aiController = new AIController();

// AI 种植推荐
router.post('/planting-recommendation', aiController.plantingRecommendation.bind(aiController));

// AI 环境分析
router.get('/environment-analysis', aiController.environmentAnalysis.bind(aiController));

// AI 产量预测
router.post('/yield-prediction', aiController.yieldPrediction.bind(aiController));

// AI 病虫害诊断
router.post('/pest-diagnosis', aiController.pestDiagnosis.bind(aiController));

// AI 农事问答
router.post('/chat', aiController.chat.bind(aiController));

// AI 仪表盘洞察
router.get('/dashboard-insight', aiController.dashboardInsight.bind(aiController));

// AI 地块分析
router.get('/plot-analysis', aiController.plotAnalysis.bind(aiController));

// AI 智能排程
router.get('/smart-schedule', aiController.smartSchedule.bind(aiController));

export default router;
