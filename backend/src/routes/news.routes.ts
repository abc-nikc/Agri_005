import { Router, Request, Response } from 'express';
import { getNewsList, getNewsById, getNewsCategories, fetchLatestNews, getMergedNewsList } from '../services/news.service';

const router = Router();

// GET / — 新闻列表
router.get('/', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const includeLatest = req.query.latest === 'true';
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const data = includeLatest
    ? getMergedNewsList(category, page, pageSize)
    : getNewsList(category, page, pageSize);
  res.json({ success: true, data });
});

// GET /latest — 获取最新资讯（必须在 /:id 之前）
router.get('/latest', (_req: Request, res: Response) => {
  const result = fetchLatestNews();
  res.json({ success: true, data: result });
});

// GET /categories — 获取分类列表（必须在 /:id 之前）
router.get('/categories', (_req: Request, res: Response) => {
  res.json({ success: true, data: getNewsCategories() });
});

// GET /:id — 获取单条新闻详情（排除关键字路由）
router.get('/:id(\\d+|dynamic-[\\w-]+)', (req: Request, res: Response) => {
  const news = getNewsById(req.params.id);
  if (!news) return res.status(404).json({ success: false, error: '新闻不存在' });
  res.json({ success: true, data: news });
});

export default router;
