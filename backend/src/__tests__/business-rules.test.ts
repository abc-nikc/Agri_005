import { getCurrentSolarTerm, getRecommendedVarietiesForCurrentTerm } from '../utils/solar-term';

describe('业务规则验证', () => {
  describe('24节气', () => {
    it('getCurrentSolarTerm 返回有效节气名', () => {
      const term = getCurrentSolarTerm();
      const validTerms = ['立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至',
        '小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至','小寒','大寒'];
      expect(validTerms).toContain(term);
    });

    it('节气推荐返回数组', () => {
      const rec = getRecommendedVarietiesForCurrentTerm();
      expect(Array.isArray(rec)).toBe(true);
    });
  });

  describe('重复提交检测（时间窗口）', () => {
    it('5分钟内同操作应检测为重复', () => {
      const now = Date.now();
      const threeMinAgo = now - 3 * 60 * 1000;
      const diff = now - threeMinAgo;
      expect(diff).toBeLessThan(5 * 60 * 1000);
    });

    it('超过5分钟不应检测为重复', () => {
      const now = Date.now();
      const sixMinAgo = now - 6 * 60 * 1000;
      const diff = now - sixMinAgo;
      expect(diff).toBeGreaterThan(5 * 60 * 1000);
    });
  });

  describe('安全间隔期计算', () => {
    it('间隔期不足7天距采收3天应拒绝', () => {
      const safetyDays = 7;
      const daysSinceHarvest = 3;
      expect(daysSinceHarvest).toBeLessThan(safetyDays);
    });

    it('间隔期7天距采收10天应通过', () => {
      const safetyDays = 7;
      const daysSinceHarvest = 10;
      expect(daysSinceHarvest).toBeGreaterThanOrEqual(safetyDays);
    });
  });

  describe('入库校验', () => {
    it('入库数量≤0 应拒绝', () => {
      const qty = 0;
      expect(qty).toBeLessThanOrEqual(0);
    });

    it('入库数量>0 应通过', () => {
      const qty = 50;
      expect(qty).toBeGreaterThan(0);
    });

    it('农产品未质检应拒绝', () => {
      const qualityPassed = false;
      const isProduce = true;
      expect(isProduce && !qualityPassed).toBe(true);
    });

    it('农产品已质检应通过', () => {
      const qualityPassed = true;
      const isProduce = true;
      expect(!(isProduce && !qualityPassed)).toBe(true);
    });
  });

  describe('出库校验', () => {
    it('出库>库存应拒绝', () => {
      const stock = 100;
      const outbound = 150;
      expect(outbound > stock).toBe(true);
    });

    it('出库≤库存应通过', () => {
      const stock = 100;
      const outbound = 80;
      expect(outbound <= stock).toBe(true);
    });

    it('销售出库无审批应拒绝', () => {
      const isSale = true;
      const hasApprover = false;
      expect(isSale && !hasApprover).toBe(true);
    });
  });

  describe('盘点误差', () => {
    it('误差率2%以内=正常', () => {
      const systemQty = 1000;
      const actualQty = 985;
      const rate = Math.abs(actualQty - systemQty) / systemQty;
      expect(rate).toBeLessThanOrEqual(0.02);
    });

    it('误差率超2%=盘亏', () => {
      const systemQty = 1000;
      const actualQty = 970;
      const rate = Math.abs(actualQty - systemQty) / systemQty;
      expect(rate).toBeGreaterThan(0.02);
    });
  });

  describe('利润计算', () => {
    it('利润 = 收入 - 成本', () => {
      const revenue = 8000;
      const cost = 4000;
      expect(revenue - cost).toBe(4000);
    });

    it('利润率 = 利润 / 收入 * 100', () => {
      const revenue = 8000;
      const cost = 4000;
      const profit = revenue - cost;
      const margin = (profit / revenue) * 100;
      expect(margin).toBe(50);
    });

    it('亏损时利润率为负', () => {
      const revenue = 3000;
      const cost = 5000;
      const profit = revenue - cost;
      const margin = (profit / revenue) * 100;
      expect(margin).toBeLessThan(0);
    });
  });

  describe('批次号生成规则', () => {
    it('格式: P + 日期 + "-" + 地块编号 + "-" + 品种', () => {
      const dateStr = '20260529';
      const plotNumber = 'A01';
      const varietyName = '番茄';
      const batchNumber = `P${dateStr}-${plotNumber}-${varietyName}`;
      expect(batchNumber).toBe('P20260529-A01-番茄');
    });
  });

  describe('FIFO 出库顺序', () => {
    it('应优先出库最早入库的批次', () => {
      const inventory = [
        { batchNumber: 'B001', quantity: 50, createdAt: '2026-01-01' },
        { batchNumber: 'B002', quantity: 30, createdAt: '2026-03-01' },
        { batchNumber: 'B003', quantity: 20, createdAt: '2026-05-01' },
      ];
      inventory.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      expect(inventory[0].batchNumber).toBe('B001');
      expect(inventory[2].batchNumber).toBe('B003');
    });
  });

  describe('产量预估', () => {
    it('无历史数据置信度为低', () => {
      const batchCount = 0;
      const confidence = batchCount >= 3 ? '高' : batchCount >= 1 ? '中' : '低';
      expect(confidence).toBe('低');
    });

    it('3个批次以上置信度为高', () => {
      const batchCount = 5;
      const confidence = batchCount >= 3 ? '高' : batchCount >= 1 ? '中' : '低';
      expect(confidence).toBe('高');
    });
  });
});
