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

// 节气与适宜品种映射（覆盖数据库中所有品种）
const TERM_VARIETY_MAP: Record<string, string[]> = {
  '立春': ['小白菜', '菠菜', '香菜', '生菜', '芹菜'],
  '雨水': ['小白菜', '菠菜', '土豆', '胡萝卜', '白萝卜'],
  '惊蛰': ['胡萝卜', '土豆', '番茄', '茄子', '辣椒'],
  '春分': ['番茄', '黄瓜', '茄子', '冬瓜', '辣椒'],
  '清明': ['番茄', '黄瓜', '西瓜', '草莓', '玉米'],
  '谷雨': ['番茄', '辣椒', '黄瓜', '西瓜', '草莓', '玉米'],
  '立夏': ['黄瓜', '西瓜', '草莓', '玉米', '薄荷'],
  '小满': ['黄瓜', '西瓜', '草莓', '薄荷', '辣椒'],
  '芒种': ['草莓', '薄荷', '黄瓜', '辣椒'],
  '夏至': ['薄荷', '草莓', '小白菜', '菠菜'],
  '小暑': ['小白菜', '菠菜'],
  '大暑': ['小白菜', '菠菜', '生菜'],
  '立秋': ['小白菜', '菠菜', '香菜', '西兰花', '花椰菜', '芹菜', '白萝卜'],
  '处暑': ['小白菜', '菠菜', '香菜', '西兰花', '花椰菜', '生菜', '胡萝卜'],
  '白露': ['菠菜', '西兰花', '花椰菜', '白萝卜', '胡萝卜'],
  '秋分': ['菠菜', '西兰花', '花椰菜', '白萝卜', '芹菜'],
  '寒露': ['菠菜', '小白菜', '生菜', '芹菜'],
  '霜降': ['小白菜', '菠菜', '生菜'],
  '立冬': ['小白菜', '菠菜'],
  '小雪': ['小白菜', '菠菜'],
  '大雪': ['小白菜', '菠菜'],
  '冬至': ['小白菜', '菠菜', '香菜'],
  '小寒': ['小白菜', '菠菜', '生菜'],
  '大寒': ['小白菜', '菠菜'],
};

export function getCurrentSolarTerm(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 从前往后找：记录最后一个 "当前日期 >= 节气日期" 的节气
  // 注意：1月节气(小寒/大寒)代表下一年，在非1月时应跳过
  let bestIdx = -1;
  for (let i = 0; i < SOLAR_TERMS.length; i++) {
    const t = SOLAR_TERMS[i];
    // 1月节气在2-12月属于"明年"，不属于当前循环，跳过
    if (t.month === 1 && month >= 2) continue;
    if (month > t.month || (month === t.month && day >= t.day)) {
      bestIdx = i;
    }
  }

  if (bestIdx >= 0) return SOLAR_TERMS[bestIdx].name;

  // 年初(1月1日~小寒/1月6日之前) → 返回上一年最后一个节气
  return SOLAR_TERMS[SOLAR_TERMS.length - 1].name;
}

export function getRecommendedVarietiesForCurrentTerm(): string[] {
  const term = getCurrentSolarTerm();
  return TERM_VARIETY_MAP[term] || [];
}

export function getAllSolarTerms(): { name: string; month: number; day: number }[] {
  return [...SOLAR_TERMS];
}
