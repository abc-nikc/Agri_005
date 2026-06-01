/**
 * 24节气计算工具
 * 基于公历日期近似计算当前节气（精度±1天）
 */
const SOLAR_TERMS = [
  { name: '立春', month: 2, day: 4 },
  { name: '雨水', month: 2, day: 19 },
  { name: '惊蛰', month: 3, day: 6 },
  { name: '春分', month: 3, day: 21 },
  { name: '清明', month: 4, day: 5 },
  { name: '谷雨', month: 4, day: 20 },
  { name: '立夏', month: 5, day: 6 },
  { name: '小满', month: 5, day: 21 },
  { name: '芒种', month: 6, day: 6 },
  { name: '夏至', month: 6, day: 21 },
  { name: '小暑', month: 7, day: 7 },
  { name: '大暑', month: 7, day: 23 },
  { name: '立秋', month: 8, day: 7 },
  { name: '处暑', month: 8, day: 23 },
  { name: '白露', month: 9, day: 8 },
  { name: '秋分', month: 9, day: 23 },
  { name: '寒露', month: 10, day: 8 },
  { name: '霜降', month: 10, day: 23 },
  { name: '立冬', month: 11, day: 7 },
  { name: '小雪', month: 11, day: 22 },
  { name: '大雪', month: 12, day: 7 },
  { name: '冬至', month: 12, day: 22 },
  { name: '小寒', month: 1, day: 6 },
  { name: '大寒', month: 1, day: 20 },
];

// 节气与适宜品种映射
const TERM_VARIETY_MAP: Record<string, string[]> = {
  '立春': ['小白菜', '菠菜', '香菜'],
  '雨水': ['小白菜', '菠菜', '土豆'],
  '惊蛰': ['胡萝卜', '土豆', '番茄'],
  '春分': ['番茄', '黄瓜', '胡萝卜'],
  '清明': ['番茄', '黄瓜', '香菜'],
  '谷雨': ['番茄', '辣椒', '黄瓜', '薄荷'],
  '立夏': ['黄瓜', '薄荷'],
  '小满': ['黄瓜', '薄荷'],
  '芒种': ['薄荷'],
  '夏至': ['薄荷'],
  '小暑': [],
  '大暑': [],
  '立秋': ['小白菜', '菠菜', '香菜', '西兰花', '花椰菜'],
  '处暑': ['小白菜', '菠菜', '香菜', '西兰花', '花椰菜'],
  '白露': ['菠菜', '西兰花', '花椰菜'],
  '秋分': ['菠菜', '西兰花', '花椰菜'],
  '寒露': ['菠菜'],
  '霜降': [],
  '立冬': [],
  '小雪': [],
  '大雪': [],
  '冬至': ['小白菜', '菠菜'],
  '小寒': ['小白菜', '菠菜'],
  '大寒': ['小白菜', '菠菜'],
};

export function getCurrentSolarTerm(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  for (let i = 0; i < SOLAR_TERMS.length; i++) {
    const term = SOLAR_TERMS[i];
    const next = SOLAR_TERMS[(i + 1) % SOLAR_TERMS.length];

    // 处理跨年情况
    if (term.month === 12 && next.month === 1) {
      if ((month === 12 && day >= term.day) || (month === 1 && day < next.day)) {
        return term.name;
      }
    } else if (month === term.month && day >= term.day) {
      if (month < next.month || (month === next.month && day < next.day)) {
        return term.name;
      }
    } else if (month === next.month && day < next.day) {
      // 可能落在前一个节气和当前节气之间
      const prev = SOLAR_TERMS[(i - 1 + SOLAR_TERMS.length) % SOLAR_TERMS.length];
      if (month === prev.month && day >= prev.day) return prev.name;
    }
  }

  return '大寒'; // fallback
}

export function getRecommendedVarietiesForCurrentTerm(): string[] {
  const term = getCurrentSolarTerm();
  return TERM_VARIETY_MAP[term] || [];
}

export function getAllSolarTerms(): { name: string; month: number; day: number }[] {
  return [...SOLAR_TERMS];
}
