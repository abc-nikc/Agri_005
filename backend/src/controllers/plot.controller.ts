import { Request, Response } from 'express';
import { PlotService } from '../services/plot.service';
import { validateRequest, schemas } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const plotService = new PlotService();

/**
 * 获取所有地块
 * GET /api/v1/plots
 */
export const getAllPlots = async (req: Request, res: Response) => {
  try {
    const plots = await plotService.findAll();
    res.json({ data: plots });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || '获取地块列表失败',
      code: 'PLOT_FETCH_ERROR',
    });
  }
};

/**
 * 获取单个地块
 * GET /api/v1/plots/:id
 */
export const getPlotById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plot = await plotService.findById(id);

    if (!plot) {
      return res.status(404).json({
        error: '地块不存在',
        code: 'PLOT_NOT_FOUND',
      });
    }

    res.json({ data: plot });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || '获取地块失败',
      code: 'PLOT_FETCH_ERROR',
    });
  }
};

/**
 * 创建地块
 * POST /api/v1/plots
 */
export const createPlot = async (req: Request, res: Response) => {
  try {
    const plotData = req.body;
    const plot = await plotService.create(plotData);

    res.status(201).json({
      message: '地块创建成功',
      data: plot,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || '创建地块失败',
      code: 'PLOT_CREATE_ERROR',
    });
  }
};

/**
 * 更新地块
 * PUT /api/v1/plots/:id
 */
export const updatePlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plotData = req.body;
    const plot = await plotService.update(id, plotData);

    res.json({
      message: '地块更新成功',
      data: plot,
    });
  } catch (error: any) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({
        error: error.message,
        code: 'PLOT_NOT_FOUND',
      });
    }

    res.status(400).json({
      error: error.message || '更新地块失败',
      code: 'PLOT_UPDATE_ERROR',
    });
  }
};

/**
 * 删除地块
 * DELETE /api/v1/plots/:id
 */
export const deletePlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await plotService.delete(id);

    res.json({
      message: '地块删除成功',
    });
  } catch (error: any) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({
        error: error.message,
        code: 'PLOT_NOT_FOUND',
      });
    }

    res.status(500).json({
      error: error.message || '删除地块失败',
      code: 'PLOT_DELETE_ERROR',
    });
  }
};

/**
 * 获取地块统计信息
 * GET /api/v1/plots/statistics
 */
export const getPlotStatistics = async (req: Request, res: Response) => {
  try {
    const statistics = await plotService.getStatistics();
    res.json({ data: statistics });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || '获取统计信息失败',
      code: 'PLOT_STATISTICS_ERROR',
    });
  }
};
