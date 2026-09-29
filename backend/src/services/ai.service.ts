import { AppDataSource } from '../config/database';
import { SensorData } from '../models/sensor-data.entity';
import { ProductionBatch } from '../models/production-batch.entity';
import { PlantingPlan } from '../models/planting-plan.entity';
import { Variety } from '../models/variety.entity';
import { Plot } from '../models/plot.entity';
import { FarmingOperation } from '../models/farming-operation.entity';
import { Staff } from '../models/staff.entity';
import { FarmTask } from '../models/farm-task.entity';
import { Equipment } from '../models/equipment.entity';
import { getCurrentSolarTerm, getRecommendedVarietiesForCurrentTerm } from '../utils/solar-term';

const https = require('https');
const http = require('http');

function fmtDate(d: any): string {
  if (!d) return '';
  if (typeof d === 'string') return d.split('T')[0];
  try { return new Date(d).toISOString().split('T')[0]; } catch { return ''; }
}

// ====== 配置 ======
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
// AI_API_KEY 为统一配置名；兼容早期部署中使用的 ZHIPU_API_KEY。
const AI_API_KEY = process.env.AI_API_KEY || process.env.ZHIPU_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'glm-4-flash';

function isAIConfigured(): boolean {
  return !!AI_API_KEY;
}

function callAIHttp(messages: { role: string; content: string }[], temperature = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(AI_BASE_URL);
    const postData = JSON.stringify({ model: AI_MODEL, messages, temperature, max_tokens: 4096 });
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    const transport = url.protocol === 'http:' ? http : https;
    const req = transport.request(options, (res: any) => {
      let data = '';
      res.on('data', (chunk: any) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json?.error) reject(new Error(json.error.message || 'AI API 错误'));
          else resolve(json?.choices?.[0]?.message?.content || 'AI 暂时无法回复');
        } catch { reject(new Error('AI 响应解析失败')); }
      });
    });
    req.on('error', (err: any) => reject(err));
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('AI 请求超时')); });
    req.write(postData);
    req.end();
  });
}

// ====== 系统提示词 ======
const SYSTEM_PROMPT = `你是"农场管家"智慧农业物联网平台的 AI 农业专家助手。你拥有丰富的现代农业、作物学、土壤学、气象学和植物保护知识。

系统功能：物联网监测(温湿度/光照/土壤湿度/CO2/pH)、地块管理、种植计划、品种管理、农事操作、设备控制、预警、成本核算、溯源、农事任务管理、数字地图。

回答要求：
1. 专业、准确、实用，基于农业科学原理
2. 给出具体的操作建议和数据指标
3. 结合用户提供的系统数据进行针对性分析
4. 使用 Markdown 格式，层次分明
5. 如需列表，使用编号列表`;

// ====== 通用对话接口 ======
interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string; }

async function callAI(messages: ChatMessage[], temperature = 0.7): Promise<string> {
  if (!isAIConfigured()) {
    const userMsg = messages[messages.length - 1]?.content || '';
    return expertAnalysisEngine(userMsg);
  }
  try {
    return await callAIHttp(messages, temperature);
  } catch (err: any) {
    console.error('[AI] API call failed:', err.message);
    const userMsg = messages[messages.length - 1]?.content || '';
    return expertAnalysisEngine(userMsg);
  }
}

// ====== 数据查询工具函数 ======

async function getLatestSensors(plotId?: string): Promise<any[]> {
  try {
    const repo = AppDataSource.getRepository(SensorData);
    const qb = repo.createQueryBuilder('s')
      .where(`s.recorded_at = (SELECT MAX(s2.recorded_at) FROM sensor_data s2 WHERE s2.device_id = s.device_id AND s2.sensor_type = s.sensor_type)`);
    if (plotId) qb.andWhere('s.plot_id = :plotId', { plotId });
    return await qb.getRawMany();
  } catch { return []; }
}

async function getSensorTrend24h(plotId?: string): Promise<Record<string, { max: number; min: number; avg: number; count: number }>> {
  try {
    const repo = AppDataSource.getRepository(SensorData);
    const qb = repo.createQueryBuilder('s')
      .where('s.recorded_at >= :dayAgo', { dayAgo: new Date(Date.now() - 24 * 3600000).toISOString() });
    if (plotId) qb.andWhere('s.plot_id = :plotId', { plotId });
    qb.orderBy('s.recorded_at', 'DESC').limit(500);
    const rows = await qb.getRawMany();
    const result: Record<string, { max: number; min: number; avg: number; count: number }> = {};
    for (const r of rows) {
      const type = r.s_sensor_type || r.sensor_type;
      const val = Number(r.s_value || r.value);
      if (isNaN(val)) continue;
      if (!result[type]) result[type] = { max: val, min: val, avg: val, count: 1 };
      else {
        const c = result[type];
        c.max = Math.max(c.max, val);
        c.min = Math.min(c.min, val);
        c.count++;
        c.avg = (c.avg * (c.count - 1) + val) / c.count;
      }
    }
    return result;
  } catch { return {}; }
}

async function getActiveBatches() {
  try { return await AppDataSource.getRepository(ProductionBatch).find({ where: [{ status: '进行中' }, { status: '育苗中' }], order: { createdAt: 'DESC' } }); }
  catch { return []; }
}

async function getAllPlots() {
  try { return await AppDataSource.getRepository(Plot).find(); }
  catch { return []; }
}

async function getAllVarieties() {
  try { return await AppDataSource.getRepository(Variety).find({ where: { isActive: true } }); }
  catch { return []; }
}

async function getRecentOperations(limit = 20) {
  try { return await AppDataSource.getRepository(FarmingOperation).find({ order: { operationDate: 'DESC' }, take: limit }); }
  catch { return []; }
}

async function getPendingTasks() {
  try { return await AppDataSource.getRepository(FarmTask).find({ where: [{ status: '待执行' }, { status: '执行中' }], order: { scheduledDate: 'ASC' } }); }
  catch { return []; }
}

async function getAllEquipment() {
  try { return await AppDataSource.getRepository(Equipment).find(); }
  catch { return []; }
}

async function getAllStaff() {
  try { return await AppDataSource.getRepository(Staff).find({ where: { isActive: true } }); }
  catch { return []; }
}

// ====== 农业专家知识库（内置规则引擎） ======

/** 品种数据库 — 典型产量、适宜环境、常见病虫害 */
const VARIETY_DB: Record<string, { category: string; yieldPerMu: [number, number]; optTemp: [number, number]; optSoilMoisture: [number, number]; optPH: [number, number]; growthDays: [number, number]; pests: string[]; diseases: string[] }> = {
  '辣椒': { category: '茄果类', yieldPerMu: [2000, 4000], optTemp: [20, 30], optSoilMoisture: [40, 60], optPH: [6.0, 7.0], growthDays: [90, 150], pests: ['蚜虫', '白粉虱', '棉铃虫'], diseases: ['疫病', '炭疽病', '病毒病'] },
  '番茄': { category: '茄果类', yieldPerMu: [4000, 8000], optTemp: [18, 28], optSoilMoisture: [40, 65], optPH: [6.0, 7.5], growthDays: [100, 140], pests: ['蚜虫', '白粉虱', '斑潜蝇'], diseases: ['晚疫病', '灰霉病', '叶霉病', '青枯病'] },
  '黄瓜': { category: '瓜类', yieldPerMu: [5000, 10000], optTemp: [22, 32], optSoilMoisture: [45, 65], optPH: [5.5, 7.0], growthDays: [60, 100], pests: ['蚜虫', '白粉虱', '瓜绢螟'], diseases: ['霜霉病', '白粉病', '枯萎病', '细菌性角斑病'] },
  '茄子': { category: '茄果类', yieldPerMu: [3000, 6000], optTemp: [22, 30], optSoilMoisture: [40, 60], optPH: [6.0, 7.5], growthDays: [90, 130], pests: ['红蜘蛛', '茶黄螨', '蚜虫'], diseases: ['绵疫病', '褐纹病', '黄萎病'] },
  '西瓜': { category: '瓜类', yieldPerMu: [2500, 5000], optTemp: [25, 35], optSoilMoisture: [40, 55], optPH: [5.5, 7.0], growthDays: [80, 120], pests: ['蚜虫', '瓜绢螟', '小菜蛾'], diseases: ['枯萎病', '炭疽病', '白粉病', '蔓枯病'] },
  '草莓': { category: '浆果类', yieldPerMu: [1500, 3000], optTemp: [15, 25], optSoilMoisture: [50, 70], optPH: [5.5, 6.5], growthDays: [60, 90], pests: ['蚜虫', '红蜘蛛', '蓟马'], diseases: ['灰霉病', '白粉病', '炭疽病', '根腐病'] },
  '生菜': { category: '叶菜类', yieldPerMu: [1500, 3000], optTemp: [15, 22], optSoilMoisture: [50, 70], optPH: [6.0, 7.0], growthDays: [30, 50], pests: ['蚜虫', '菜青虫'], diseases: ['霜霉病', '软腐病', '灰霉病'] },
  '白菜': { category: '叶菜类', yieldPerMu: [3000, 6000], optTemp: [15, 25], optSoilMoisture: [50, 65], optPH: [6.5, 7.5], growthDays: [50, 80], pests: ['蚜虫', '菜青虫', '小菜蛾'], diseases: ['软腐病', '霜霉病', '病毒病'] },
  '水稻': { category: '粮食类', yieldPerMu: [400, 700], optTemp: [25, 32], optSoilMoisture: [80, 100], optPH: [5.0, 6.5], growthDays: [120, 160], pests: ['稻飞虱', '二化螟', '稻纵卷叶螟'], diseases: ['稻瘟病', '纹枯病', '稻曲病'] },
  '玉米': { category: '粮食类', yieldPerMu: [400, 800], optTemp: [24, 32], optSoilMoisture: [50, 70], optPH: [5.5, 7.0], growthDays: [90, 130], pests: ['玉米螟', '蚜虫'], diseases: ['大斑病', '小斑病', '茎腐病'] },
};

/** 节气农事知识 */
const TERM_FARMING: Record<string, { activities: string[]; warnings: string[] }> = {
  '小寒': { activities: ['温室保温管理', '越冬蔬菜防寒', '检修大棚设施', '堆肥沤制'], warnings: ['注意极端低温冻害', '雪灾预防'] },
  '大寒': { activities: ['温室加温', '越冬作物防冻', '春耕准备', '种子选购'], warnings: ['严寒天气防护'] },
  '立春': { activities: ['春季整地', '育苗播种准备', '温室育苗', '越冬作物追肥'], warnings: ['倒春寒风险'] },
  '雨水': { activities: ['早春蔬菜播种', '果树修剪', '温室通风管理', '排水沟清理'], warnings: ['连阴雨天气'] },
  '惊蛰': { activities: ['露地蔬菜播种', '虫害预防喷药', '果树追肥', '越冬作物田间管理'], warnings: ['病虫害开始活跃'] },
  '春分': { activities: ['春耕春播', '地膜覆盖', '大棚定植', '中耕除草'], warnings: ['气温不稳防倒春寒'] },
  '清明': { activities: ['露地定植', '直播播种', '肥水管理', '苗期管理'], warnings: ['晚霜冻害', '春风防风'] },
  '谷雨': { activities: ['移栽定植', '追肥浇水', '病虫害防治', '中耕松土'], warnings: ['雨水增多防涝'] },
  '立夏': { activities: ['追肥促长', '整枝打杈', '病虫害监测', '田间排水'], warnings: ['高温开始，注意通风'] },
  '小满': { activities: ['灌溉管理', '追施膨果肥', '防治病虫害', '疏花疏果'], warnings: ['干热风', '蚜虫高发'] },
  '芒种': { activities: ['采收早熟作物', '夏播播种', '病虫害综合防治', '水分管理'], warnings: ['梅雨季开始', '高温高湿病害高发'] },
  '夏至': { activities: ['遮阳降温', '防涝排水', '果实采收', '夏播管理'], warnings: ['暴雨洪涝', '高温热害'] },
  '小暑': { activities: ['抗旱灌溉', '遮阳防暑', '病虫害防控', '伏天播种'], warnings: ['伏旱高温', '台风暴雨'] },
  '大暑': { activities: ['加强灌溉', '通风降温', '采收管理', '追肥促壮'], warnings: ['极端高温', '雷暴天气'] },
  '立秋': { activities: ['秋季整地', '秋播准备', '追施攻果肥', '病虫害防治'], warnings: ['秋老虎高温'] },
  '处暑': { activities: ['秋播蔬菜', '温室育苗', '采收管理', '田间清理'], warnings: ['秋季多雨'] },
  '白露': { activities: ['秋播定植', '越冬作物准备', '堆肥沤制', '病虫害预防'], warnings: ['昼夜温差加大'] },
  '秋分': { activities: ['秋季播种', '田间管理', '温室管理', '采收秋果'], warnings: ['秋雨连绵防涝'] },
  '寒露': { activities: ['露地采收', '温室定植', '冬季作物播种', '设施加固'], warnings: ['初霜冻害'] },
  '霜降': { activities: ['大棚覆盖', '保温管理', '采收储藏', '土壤改良'], warnings: ['霜冻'] },
  '立冬': { activities: ['温室保温', '冬耕晒垡', '越冬管理', '种子储藏'], warnings: ['寒潮降温'] },
  '小雪': { activities: ['温室加温管理', '越冬蔬菜防寒', '设施维护', '清园消毒'], warnings: ['大雪防压棚'] },
  '大雪': { activities: ['防寒防冻', '温室管理', '堆肥管理', '农机保养'], warnings: ['大雪防压棚'] },
  '冬至': { activities: ['温室保温', '越冬管理', '农闲学习', '来年规划'], warnings: ['严寒防冻'] },
};

/** 症状-病害知识库 */
const SYMPTOM_DB: Array<{ symptoms: string[]; diseases: string[]; confidence: number; treatment: string }> = [
  { symptoms: ['黄色斑点', '叶斑', '褐斑'], diseases: ['炭疽病(80%)', '叶斑病(60%)', '褐斑病(40%)'], confidence: 0.8, treatment: '用嘧菌酯或苯醚甲环唑喷施，间隔7-10天，连续2-3次。清除病叶，加强通风。' },
  { symptoms: ['白色粉末', '白粉', '粉状'], diseases: ['白粉病(90%)', '白绢病(20%)'], confidence: 0.9, treatment: '用三唑酮或醚菌酯喷施，重点喷叶背。降低种植密度，增加通风光照。' },
  { symptoms: ['叶片卷曲', '卷叶', '卷缩'], diseases: ['蚜虫危害(70%)', '病毒病(50%)', '缺水(40%)'], confidence: 0.7, treatment: '检查叶背是否有蚜虫，用吡虫啉或啶虫脒防治。如是病毒病需拔除病株。' },
  { symptoms: ['灰霉', '灰色霉斑', '腐烂'], diseases: ['灰霉病(90%)', '菌核病(30%)'], confidence: 0.9, treatment: '用嘧霉胺或腐霉利喷施。降低湿度至70%以下，及时摘除病花病果。' },
  { symptoms: ['枯萎', '萎蔫', '发黄下垂'], diseases: ['枯萎病(70%)', '青枯病(50%)', '根腐病(40%)'], confidence: 0.7, treatment: '检查茎基部有无褐色病斑。用恶霉灵灌根，嫁接防病，实行轮作。' },
  { symptoms: ['霜霉', '叶背霉层', '水浸状斑'], diseases: ['霜霉病(90%)', '疫病(30%)'], confidence: 0.9, treatment: '用霜脲氰或烯酰吗啉喷施，重点喷叶背。控制湿度，发病前用波尔多液预防。' },
  { symptoms: ['蚜虫', '蜜露', '虫'], diseases: ['蚜虫(90%)'], confidence: 0.9, treatment: '用黄板诱杀，吡虫啉或啶虫脒喷施。保护瓢虫等天敌。' },
  { symptoms: ['红蜘蛛', '螨', '叶面失绿'], diseases: ['红蜘蛛(85%)', '茶黄螨(50%)'], confidence: 0.85, treatment: '用阿维菌素或螺螨酯喷施，重点喷叶背。增加空气湿度可抑制红蜘蛛。' },
  { symptoms: ['根腐', '烂根', '基部腐烂'], diseases: ['根腐病(80%)', '立枯病(40%)'], confidence: 0.8, treatment: '用恶霉灵+甲霜灵灌根。降低土壤湿度，避免大水漫灌。播种前用多菌灵拌种。' },
];

// ====== 核心：本地智能分析引擎（专家系统） ======

async function expertAnalysisEngine(query: string): Promise<string> {
  const q = query.toLowerCase();
  const [sensors, plots, batches, varieties, operations, tasks, trend, equipment, staff] = await Promise.all([
    getLatestSensors(), getAllPlots(), getActiveBatches(), getAllVarieties(),
    getRecentOperations(10), getPendingTasks(), getSensorTrend24h(), getAllEquipment(), getAllStaff()
  ]);

  const term = getCurrentSolarTerm();
  const termInfo = TERM_FARMING[term] || { activities: [], warnings: [] };
  const now = new Date().toLocaleDateString('zh-CN');
  const today = new Date();

  // 提取前缀标记（如 "[YIELD_PREDICTION]" ）
  let forcedType = '';
  const typeMatch = query.match(/^\[(\w+)\]/);
  if (typeMatch) {
    forcedType = typeMatch[1];
    query = query.substring(query.indexOf(']') + 1);
  }

  // 解析传感器数据
  const sensorMap: Record<string, { val: number; unit: string; deviceId: string; plotId?: string; plotNumber?: string }[]> = {};
  for (const s of sensors) {
    const type = s.s_sensor_type || s.sensor_type;
    const val = Number(s.s_value || s.value);
    if (isNaN(val)) continue;
    const plot = plots.find(p => p.id === s.plot_id);
    if (!sensorMap[type]) sensorMap[type] = [];
    sensorMap[type].push({ val, unit: s.s_unit || s.unit || '', deviceId: s.device_id, plotId: s.plot_id, plotNumber: plot?.plotNumber || (plot as any)?.plot_number });
  }
  const avg = (type: string) => {
    const arr = sensorMap[type] || [];
    return arr.length ? arr.reduce((a, b) => a + b.val, 0) / arr.length : NaN;
  };
  const avg2 = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN;
  const deviceNames = (plotId: string) => {
    const devices = equipment.filter(e => e.associatedPlotId === plotId);
    return devices.length > 0 ? devices.map(e => e.equipmentNumber).join(', ') : '无关联设备';
  };

  // ===== 产量预测（放在环境前面，因为产量context里可能包含"环境"）=====
  if (forcedType === 'YIELD' || q.includes('产量') || q.includes('预测') || q.includes('采收') || q.includes('收获')) {
    // 产量预测逻辑
    if (batches.length === 0) return '📊 暂无活跃种植批次，无法进行产量预测。请先创建种植计划。';
    let report = '# 🌾 产量预测分析报告\n\n';
    report += `📅 ${now}（${term}）\n\n`;
    for (const b of batches) {
      const vi = getVarietyInfo(b.varietyName);
      const plot = plots.find(p => p.id === b.plotId);
      if (!vi) continue;
      const area = Number(b.area) || (plot ? Number(plot.area) : 1);
      const plantDate = (b as any).sowDate ? new Date((b as any).sowDate) : null;
      const harvestDate = b.estimatedHarvestDate ? new Date(b.estimatedHarvestDate) : null;
      const growthDays = plantDate ? Math.floor((today.getTime() - plantDate.getTime()) / 86400000) : vi.growthDays[1] / 2;
      const growthRatio = Math.min(1, growthDays / vi.growthDays[1]);
      // 环境修正因子
      const plotSensors = sensors.filter(s => s.plot_id === b.plotId);
      const pTemps = plotSensors.filter(s => (s.s_sensor_type || s.sensor_type) === 'temperature').map(s => Number(s.s_value || s.value)).filter(v => !isNaN(v));
      const pSoils = plotSensors.filter(s => (s.s_sensor_type || s.sensor_type) === 'soil_moisture').map(s => Number(s.s_value || s.value)).filter(v => !isNaN(v));
      const envFactor = 1 + (pTemps.length > 0 ? (avg2(pTemps) < vi.optTemp[0] || avg2(pTemps) > vi.optTemp[1] ? -0.15 : 0.05) : 0)
        + (pSoils.length > 0 ? (avg2(pSoils) < vi.optSoilMoisture[0] || avg2(pSoils) > vi.optSoilMoisture[1] ? -0.1 : 0.05) : 0);
      const yieldLow = Math.round(vi.yieldPerMu[0] * area * envFactor * growthRatio * 0.9);
      const yieldHigh = Math.round(vi.yieldPerMu[1] * area * envFactor * growthRatio * 1.1);
      const yieldExpected = Math.round((yieldLow + yieldHigh) / 2);
      report += `## ${b.varietyName}（${plot ? plot.plotNumber : '未知地块'}）\n\n`;
      report += `| 项目 | 数据 |\n|------|------|\n`;
      report += `| 种植面积 | ${area}亩 |\n`;
      report += `| 品种 | ${b.varietyName}（${vi.category}）|\n`;
      report += `| 已生长天数 | ${growthDays}天（进度${(growthRatio * 100).toFixed(0)}%）|\n`;
      report += `| 参考亩产 | ${vi.yieldPerMu[0]}~${vi.yieldPerMu[1]}kg |\n`;
      report += `| 环境修正 | ${(envFactor * 100).toFixed(0)}% |\n\n`;
      report += `### 预测结果\n\n`;
      report += `- **预计总产**: ${yieldLow}~${yieldHigh}kg（期望值 ${yieldExpected}kg）\n`;
      report += `- **预计亩产**: ${Math.round(yieldExpected / area)}kg\n`;
      if (envFactor < 0.9) report += `- ⚠️ 环境条件偏差较大，实际产量可能偏低\n`;
      if (growthRatio < 0.3) report += `- 🌱 当前处于苗期，预测不确定性较大\n`;
      if (harvestDate) report += `- 📅 预计采收: ${harvestDate.toLocaleDateString('zh-CN')}\n`;
      report += '\n';
    }
    report += '### 提升产量建议\n\n';
    report += '- 保持适宜的温湿度环境，避免极端天气影响\n';
    report += '- 按时追肥，保证营养供给充足\n';
    report += '- 加强病虫害防治，减少损失\n';
    report += '- 合理灌溉，保持土壤湿度在适宜范围\n';
    return report;
  }

  // ===== 环境分析 =====
  if (q.includes('温度') || q.includes('湿度') || q.includes('环境') || q.includes('分析') || q.includes('监测') || q.includes('传感器')) {
    const tempAvg = avg('temperature');
    const humAvg = avg('humidity');
    const soilAvg = avg('soil_moisture');
    const lightAvg = avg('light');
    const co2Avg = avg('co2');
    const phAvg = avg('ph');

    let report = `# 🌡️ ${now} 农业环境智能分析报告\n> 节气：${term} | 数据来源：${sensors.length}个传感器实时采集\n\n`;

    // 综合评估
    let score = 100;
    let riskItems: string[] = [];
    let warningItems: string[] = [];
    let goodItems: string[] = [];

    // 温度分析
    if (!isNaN(tempAvg)) {
      const tempArr = sensorMap['temperature'] || [];
      const tMax = Math.max(...tempArr.map(t => t.val));
      const tMin = Math.min(...tempArr.map(t => t.val));
      const tVolatility = tempAvg > 0 ? ((tMax - tMin) / tempAvg * 100) : 0;

      if (tempAvg >= 20 && tempAvg <= 28) { goodItems.push(`温度 ${tempAvg.toFixed(1)}°C 处于作物最佳生长区间(20-28°C)`); }
      else if (tempAvg > 28 && tempAvg <= 35) { warningItems.push(`温度 ${tempAvg.toFixed(1)}°C 偏高，作物生长受抑制，需通风降温`); score -= 10; }
      else if (tempAvg > 35) { riskItems.push(`温度 ${tempAvg.toFixed(1)}°C 严重超标！高温热害风险，立即启动遮阳+喷水降温`); score -= 30; }
      else if (tempAvg < 15 && tempAvg >= 10) { warningItems.push(`温度 ${tempAvg.toFixed(1)}°C 偏低，喜温作物生长缓慢`); score -= 10; }
      else if (tempAvg < 10) { riskItems.push(`温度 ${tempAvg.toFixed(1)}°C 过低！冻害风险，立即启用加温设备`); score -= 25; }

      if (tVolatility > 80) { warningItems.push(`24h温度波动 ${tVolatility.toFixed(0)}%（${tMin.toFixed(1)}~${tMax.toFixed(1)}°C），昼夜温差过大，注意保温调控`); }
    }

    // 空气湿度分析
    if (!isNaN(humAvg)) {
      const humArr = sensorMap['humidity'] || [];
      const hMax = Math.max(...humArr.map(h => h.val));

      if (humAvg >= 50 && humAvg <= 75) { goodItems.push(`空气湿度 ${humAvg.toFixed(1)}% 适宜`); }
      else if (humAvg > 75 && humAvg <= 85) { warningItems.push(`空气湿度 ${humAvg.toFixed(1)}% 偏高，真菌病害风险增加`); score -= 8; }
      else if (humAvg > 85) { riskItems.push(`空气湿度 ${humAvg.toFixed(1)}% 严重过高！真菌病害爆发条件成熟（霜霉病、灰霉病、疫病）`); score -= 25; }
      else if (humAvg < 40) { warningItems.push(`空气湿度 ${humAvg.toFixed(1)}% 偏低，可能引起植株萎蔫`); score -= 8; }

      if (hMax > 90) { warningItems.push(`最高湿度 ${hMax.toFixed(1)}%，注意结露引发叶面病害`); }
    }

    // 土壤湿度分析
    if (!isNaN(soilAvg)) {
      const soilArr = sensorMap['soil_moisture'] || [];
      const drySensors = soilArr.filter(s => s.val < 30);
      const wetSensors = soilArr.filter(s => s.val > 75);

      if (soilAvg >= 35 && soilAvg <= 65) { goodItems.push(`土壤湿度 ${soilAvg.toFixed(1)}% 适宜`); }
      else if (soilAvg < 35 && soilAvg >= 20) { warningItems.push(`土壤湿度 ${soilAvg.toFixed(1)}% 偏干，需适量灌溉`); score -= 10; }
      else if (soilAvg < 20) { riskItems.push(`土壤湿度 ${soilAvg.toFixed(1)}% 严重干旱！作物枯萎风险`); score -= 25; }
      else if (soilAvg > 75) { warningItems.push(`土壤湿度 ${soilAvg.toFixed(1)}% 过湿，根系缺氧风险，需排水`); score -= 10; }

      if (drySensors.length > 0) {
        riskItems.push(`${drySensors.length}个传感器检测到土壤干旱（<30%）：${drySensors.map(s => `${s.plotNumber || s.deviceId || '未知地块'}(${s.val.toFixed(1)}%)`).join('、')}，需立即灌溉`);
      }
      if (wetSensors.length > 0) {
        warningItems.push(`${wetSensors.length}个传感器土壤过湿（>75%）：${wetSensors.map(s => `${s.plotNumber || s.deviceId || '未知地块'}(${s.val.toFixed(1)}%)`).join('、')}`);
      }
    }

    // 光照分析
    if (!isNaN(lightAvg)) {
      if (lightAvg > 30000 && lightAvg < 80000) { goodItems.push(`光照 ${lightAvg.toFixed(0)} lux 充足`); }
      else if (lightAvg >= 80000) { warningItems.push(`光照 ${lightAvg.toFixed(0)} lux 过强，注意遮阳防止日灼`); score -= 5; }
      else if (lightAvg < 30000 && lightAvg > 10000) { warningItems.push(`光照 ${lightAvg.toFixed(0)} lux 偏弱，光合作用不足`); score -= 8; }
      else if (lightAvg <= 10000) { riskItems.push(`光照 ${lightAvg.toFixed(0)} lux 严重不足，需补光`); score -= 15; }
    }

    // CO2分析
    if (!isNaN(co2Avg)) {
      if (co2Avg >= 300 && co2Avg <= 800) { goodItems.push(`CO2 ${co2Avg.toFixed(0)} ppm 正常`); }
      else if (co2Avg > 800 && co2Avg <= 1200) { warningItems.push(`CO2 ${co2Avg.toFixed(0)} ppm 偏高，注意通风`); score -= 5; }
      else if (co2Avg > 1200) { riskItems.push(`CO2 ${co2Avg.toFixed(0)} ppm 过高，需立即通风换气`); score -= 10; }
    }

    // pH分析
    if (!isNaN(phAvg)) {
      if (phAvg >= 6.0 && phAvg <= 7.5) { goodItems.push(`土壤pH ${phAvg.toFixed(1)} 适宜`); }
      else if (phAvg < 6.0) { warningItems.push(`土壤pH ${phAvg.toFixed(1)} 偏酸，建议施用石灰或草木灰调理`); score -= 8; }
      else if (phAvg > 7.5) { warningItems.push(`土壤pH ${phAvg.toFixed(1)} 偏碱，建议施用硫磺粉或有机酸调理`); score -= 8; }
    }

    // 综合评级
    const level = score >= 85 ? '优秀' : score >= 70 ? '良好' : score >= 50 ? '一般' : score >= 30 ? '较差' : '危险';
    const levelEmoji = score >= 85 ? '🟢' : score >= 70 ? '🔵' : score >= 50 ? '🟡' : score >= 30 ? '🟠' : '🔴';
    report += `## 综合环境评级：${levelEmoji} ${level}（${score}/100分）\n\n`;

    // 传感器数据汇总
    report += `## 📊 传感器实时数据\n\n| 指标 | 平均值 | 范围 | 状态 |\n|------|--------|------|------|\n`;
    if (!isNaN(tempAvg)) {
      const ta = sensorMap['temperature'] || [];
      const s = tempAvg >= 20 && tempAvg <= 28 ? '✅适宜' : tempAvg > 35 ? '🔴超标' : '⚠️偏差';
      report += `| 温度 | ${tempAvg.toFixed(1)}°C | ${Math.min(...ta.map(t=>t.val)).toFixed(1)}~${Math.max(...ta.map(t=>t.val)).toFixed(1)}°C | ${s} |\n`;
    }
    if (!isNaN(humAvg)) {
      const ha = sensorMap['humidity'] || [];
      const s = humAvg >= 50 && humAvg <= 75 ? '✅适宜' : humAvg > 85 ? '🔴过高' : '⚠️偏差';
      report += `| 空气湿度 | ${humAvg.toFixed(1)}% | ${Math.min(...ha.map(h=>h.val)).toFixed(1)}~${Math.max(...ha.map(h=>h.val)).toFixed(1)}% | ${s} |\n`;
    }
    if (!isNaN(soilAvg)) {
      const sa = sensorMap['soil_moisture'] || [];
      const s = soilAvg >= 35 && soilAvg <= 65 ? '✅适宜' : soilAvg < 20 ? '🔴干旱' : '⚠️偏差';
      report += `| 土壤湿度 | ${soilAvg.toFixed(1)}% | ${Math.min(...sa.map(s=>s.val)).toFixed(1)}~${Math.max(...sa.map(s=>s.val)).toFixed(1)}% | ${s} |\n`;
    }
    if (!isNaN(lightAvg)) report += `| 光照 | ${lightAvg.toFixed(0)} lux | - | ${lightAvg > 30000 ? '✅充足' : '⚠️不足'} |\n`;
    if (!isNaN(co2Avg)) report += `| CO2 | ${co2Avg.toFixed(0)} ppm | - | ${co2Avg <= 800 ? '✅正常' : '⚠️偏高'} |\n`;
    if (!isNaN(phAvg)) report += `| 土壤pH | ${phAvg.toFixed(1)} | - | ${phAvg >= 6 && phAvg <= 7.5 ? '✅适宜' : '⚠️需调理'} |\n`;

    // 风险预警
    if (riskItems.length > 0) {
      report += `\n## 🚨 风险预警（需立即处理）\n\n`;
      for (const item of riskItems) { report += `- ${item}\n`; }
    }

    // 警告
    if (warningItems.length > 0) {
      report += `\n## ⚠️ 注意事项\n\n`;
      for (const item of warningItems) { report += `- ${item}\n`; }
    }

    // 良好指标
    if (goodItems.length > 0) {
      report += `\n## ✅ 正常指标\n\n`;
      for (const item of goodItems) { report += `- ${item}\n`; }
    }

    // 节气农事建议
    if (termInfo.warnings.length > 0) {
      report += `\n## 📅 节气提醒（${term}）\n\n`;
      for (const w of termInfo.warnings) { report += `- ${w}\n`; }
      report += `\n**${term}时节推荐农事：** ${termInfo.activities.join('、')}\n`;
    }

    // AI 调控建议
    report += `\n## 💡 智能调控建议\n\n`;
    const suggestions: string[] = [];
    if (!isNaN(tempAvg) && tempAvg > 30) suggestions.push('1. **降温措施**：开启遮阳网(遮光率50-70%)，启动湿帘风机降温系统，棚顶喷水降温');
    if (!isNaN(tempAvg) && tempAvg < 15) suggestions.push('1. **保温措施**：关闭通风口，启用加温设备，覆盖双层保温膜');
    if (!isNaN(humAvg) && humAvg > 80) suggestions.push(`${suggestions.length + 1}. **除湿措施**：加强通风换气，减少灌溉频次，使用除湿机或生石灰吸湿`);
    if (!isNaN(soilAvg) && soilAvg < 30) suggestions.push(`${suggestions.length + 1}. **灌溉措施**：立即滴灌补水，每亩灌水10-15m³，清晨或傍晚灌溉最佳`);
    if (!isNaN(soilAvg) && soilAvg > 70) suggestions.push(`${suggestions.length + 1}. **排水措施**：检查排水沟是否畅通，暂停灌溉，中耕松土促进水分蒸发`);
    if (!isNaN(lightAvg) && lightAvg < 20000) suggestions.push(`${suggestions.length + 1}. **补光措施**：使用补光灯每天补光4-6小时，选用红蓝光谱LED`);
    if (batches.length > 0) {
      suggestions.push(`${suggestions.length + 1}. **作物管理**：当前${batches.length}个批次进行中（${batches.map(b => b.varietyName).join('、')}），请结合以上环境数据安排相应农事操作`);
    }
    if (suggestions.length === 0) suggestions.push('1. 当前环境条件整体良好，保持日常监测即可');
    for (const s of suggestions) report += `${s}\n`;

    report += `\n> 💡 配置 AI API Key（智谱GLM/DeepSeek/Ollama）可获得更深入的个性化分析`;
    return report;
  }

  // ===== 灌溉分析 =====
  if (q.includes('灌溉') || q.includes('浇水') || q.includes('土壤湿度') || q.includes('水分') || q.includes('干旱')) {
    const soilArr = sensorMap['soil_moisture'] || [];
    const humAvg = avg('humidity');
    const tempAvg = avg('temperature');

    let report = `# 💧 智能灌溉决策分析\n> ${now} | 节气：${term}\n\n`;

    // 每个地块的土壤湿度详情
    const plotSoilMap: Record<string, { avg: number; sensors: any[] }> = {};
    for (const s of soilArr) {
      const pid = s.plotId || 'unknown';
      if (!plotSoilMap[pid]) plotSoilMap[pid] = { avg: 0, sensors: [] };
      plotSoilMap[pid].sensors.push(s);
    }
    for (const pid of Object.keys(plotSoilMap)) {
      const p = plotSoilMap[pid];
      p.avg = p.sensors.reduce((a, b) => a + b.val, 0) / p.sensors.length;
    }

    // 灌溉决策表
    report += `## 📊 各地块灌溉状态\n\n| 地块 | 土壤湿度 | 状态 | 灌溉建议 | 灌溉量 |\n|------|----------|------|----------|--------|\n`;
    const irrigationPlan: { plotId: string; plotNumber: string; urgency: string; amount: string; reason: string }[] = [];

    for (const [pid, data] of Object.entries(plotSoilMap)) {
      const plot = plots.find(p => p.id === pid);
      const name = plot?.plotNumber || pid;
      const batch = batches.find(b => b.plotId === pid);
      let status, action, amount;

      if (data.avg < 20) {
        status = '🔴严重干旱'; action = '立即灌溉'; amount = '15-20m³/亩';
        irrigationPlan.push({ plotId: pid, plotNumber: name, urgency: '紧急', amount, reason: `土壤湿度${data.avg.toFixed(1)}%，严重低于作物萎蔫点` });
      } else if (data.avg < 30) {
        status = '🟠干旱'; action = '尽快灌溉'; amount = '10-15m³/亩';
        irrigationPlan.push({ plotId: pid, plotNumber: name, urgency: '高', amount, reason: `土壤湿度${data.avg.toFixed(1)}%，低于适宜下限` });
      } else if (data.avg < 40) {
        status = '🟡偏干'; action = '适量灌溉'; amount = '8-10m³/亩';
        irrigationPlan.push({ plotId: pid, plotNumber: name, urgency: '中', amount, reason: `土壤湿度${data.avg.toFixed(1)}%，低于最佳区间` });
      } else if (data.avg <= 65) {
        status = '🟢适宜'; action = '暂不灌溉'; amount = '-';
      } else if (data.avg <= 75) {
        status = '🔵偏湿'; action = '暂停灌溉'; amount = '-';
      } else {
        status = '🔴过湿'; action = '需排水'; amount = '-';
        irrigationPlan.push({ plotId: pid, plotNumber: name, urgency: '高', amount: '需排水', reason: `土壤湿度${data.avg.toFixed(1)}%，根系缺氧风险` });
      }

      const batchInfo = batch ? ` ${batch.varietyName}` : '';
      report += `| ${name}${batchInfo} | ${data.avg.toFixed(1)}% | ${status} | ${action} | ${amount} |\n`;
    }

    // 灌溉执行计划
    if (irrigationPlan.length > 0) {
      report += `\n## 🔧 灌溉执行计划（按优先级排序）\n\n`;
      irrigationPlan.sort((a, b) => a.urgency === '紧急' ? -1 : b.urgency === '紧急' ? 1 : a.urgency === '高' ? -1 : 1);
      for (let i = 0; i < irrigationPlan.length; i++) {
        const p = irrigationPlan[i];
        const batch = batches.find(b => b.plotId === p.plotId);
        const varietyInfo = batch ? getVarietyInfo(batch.varietyName) : null;
        report += `### ${i + 1}. ${p.plotNumber} — ${p.urgency === '紧急' ? '🚨' : '⚠️'} ${p.amount}\n`;
        report += `- **原因：** ${p.reason}\n`;
        if (batch) report += `- **种植作物：** ${batch.varietyName}（${batch.area}亩）\n`;
        if (varietyInfo) report += `- **该品种适宜土壤湿度：** ${varietyInfo.optSoilMoisture[0]}~${varietyInfo.optSoilMoisture[1]}%\n`;
        report += `- **关联设备：** ${deviceNames(p.plotId)}\n`;
        if (p.amount !== '需排水') {
          report += `- **建议灌溉时间：** 明日清晨6:00-8:00（蒸发损失最小）\n`;
          report += `- **灌溉方式：** 滴灌为佳，避免大水漫灌\n`;
        }
        report += `\n`;
      }
    }

    // 环境因素分析
    report += `## 📋 环境影响因素\n\n`;
    if (!isNaN(tempAvg)) {
      if (tempAvg > 30) report += `- **高温（${tempAvg.toFixed(1)}°C）：** 蒸发量增大，灌溉频次需增加30%\n`;
      else if (tempAvg < 15) report += `- **低温（${tempAvg.toFixed(1)}°C）：** 蒸发量减小，减少灌溉频次，水温需提温至20°C以上\n`;
      else report += `- **温度适中（${tempAvg.toFixed(1)}°C）：** 正常灌溉量即可\n`;
    }
    if (!isNaN(humAvg)) {
      if (humAvg > 80) report += `- **高湿度（${humAvg.toFixed(1)}%）：** 灌溉后加强通风，避免叶面结露\n`;
      else if (humAvg < 40) report += `- **低湿度（${humAvg.toFixed(1)}%）：** 可适当增加灌溉量\n`;
    }

    // 近期灌溉记录
    const recentIrr = operations.filter(o => o.operationType === '灌溉').slice(0, 5);
    if (recentIrr.length > 0) {
      report += `\n## 📝 近期灌溉记录\n\n`;
      for (const o of recentIrr) {
        report += `- ${fmtDate(o.operationDate)} ${o.plotName || ''} ${o.waterAmount || ''}${o.waterUnit || ''} ${o.remark || ''}\n`;
      }
    }

    report += `\n> 💡 配置 AI API Key 可获得更精准的智能灌溉决策`;
    return report;
  }

  // ===== 病虫害诊断 =====
  if (forcedType === 'PEST' || q.includes('病虫害') || q.includes('虫害') || q.includes('病害') || q.includes('虫') || q.includes('病') || q.includes('防治') || q.includes('症状')) {
    const tempAvg = avg('temperature');
    const humAvg = avg('humidity');

    // 提取症状关键词
    const symptomKeywords = q.replace(/病虫害|虫害|病害|防治|诊断|分析|智能|帮我|查看|检查|当前/g, '').trim();

    let report = `# 🐛 病虫害智能诊断报告\n> ${now} | 当前环境：温度 ${isNaN(tempAvg) ? '无数据' : tempAvg.toFixed(1) + '°C'}，湿度 ${isNaN(humAvg) ? '无数据' : humAvg.toFixed(1) + '%'} | 节气：${term}\n\n`;

    // 环境风险评估
    report += `## 📊 当前环境病害风险\n\n`;
    let riskScore = 0;

    // 高温高湿风险评估
    if (!isNaN(tempAvg) && !isNaN(humAvg)) {
      if (tempAvg > 28 && humAvg > 75) {
        riskScore = 90;
        report += `**综合风险等级：🔴 极高（${riskScore}/100）**\n\n`;
        report += `当前 **高温(${tempAvg.toFixed(1)}°C) + 高湿(${humAvg.toFixed(1)}%)** 是真菌病害爆发的典型条件。\n\n`;
        report += `| 风险因子 | 当前值 | 危险阈值 | 风险 |\n|----------|--------|----------|------|\n`;
        report += `| 温度 | ${tempAvg.toFixed(1)}°C | >28°C | 🔴 超标 |\n`;
        report += `| 湿度 | ${humAvg.toFixed(1)}% | >75% | 🔴 超标 |\n`;
        report += `| 昼夜温差 | - | - | ${tempAvg > 30 ? '🔴 较大' : '🟡 适中'} |\n\n`;
      } else if (tempAvg > 25 && humAvg > 65) {
        riskScore = 60;
        report += `**综合风险等级：🟡 中高（${riskScore}/100）**\n\n`;
        report += `温度(${tempAvg.toFixed(1)}°C)和湿度(${humAvg.toFixed(1)}%)均偏高，病害风险上升。\n\n`;
      } else {
        riskScore = 25;
        report += `**综合风险等级：🟢 低（${riskScore}/100）**\n\n`;
        report += `当前环境条件总体不利于病害爆发。\n\n`;
      }
    }

    // 当前种植品种的风险分析
    if (batches.length > 0) {
      report += `## 🌱 当前种植品种病害风险\n\n`;
      for (const b of batches) {
        const vi = getVarietyInfo(b.varietyName);
        const elapsed = b.sowDate ? Math.ceil((Date.now() - new Date(b.sowDate).getTime()) / 86400000) : 0;

        report += `### ${b.varietyName}（${b.plotName}，${b.area}亩，已生长${elapsed}天）\n\n`;
        if (vi) {
          // 根据环境判断哪些病虫害风险最高
          let highRiskPests: string[] = [];
          let highRiskDiseases: string[] = [];

          if (!isNaN(tempAvg) && !isNaN(humAvg)) {
            if (tempAvg > 25 && humAvg > 70) {
              highRiskDiseases = vi.diseases.filter(d => ['霜霉病', '疫病', '灰霉病', '白粉病', '炭疽病'].some(k => d.includes(k)));
              highRiskPests = vi.pests;
            } else if (tempAvg > 28) {
              highRiskDiseases = vi.diseases.filter(d => ['病毒病', '枯萎病'].some(k => d.includes(k)));
              highRiskPests = vi.pests.filter(p => ['蚜虫', '红蜘蛛', '白粉虱'].some(k => p.includes(k)));
            }
          }

          if (highRiskDiseases.length > 0) {
            report += `**高风险病害：**\n`;
            for (const d of highRiskDiseases) report += `- 🔴 ${d}\n`;
          }
          if (vi.diseases.length > highRiskDiseases.length) {
            report += `\n**一般风险病害：**\n`;
            for (const d of vi.diseases) {
              if (!highRiskDiseases.includes(d)) report += `- 🟡 ${d}\n`;
            }
          }
          if (highRiskPests.length > 0) {
            report += `\n**活跃虫害：**\n`;
            for (const p of highRiskPests) report += `- 🟠 ${p}\n`;
          }
          report += `\n**该品种适宜环境：** 温度${vi.optTemp[0]}~${vi.optTemp[1]}°C，土壤湿度${vi.optSoilMoisture[0]}~${vi.optSoilMoisture[1]}%，pH${vi.optPH[0]}~${vi.optPH[1]}\n`;
        } else {
          report += `暂无该品种的详细病虫害数据库，建议进行日常巡检观察。\n`;
        }
        report += `\n`;
      }
    }

    // 症状匹配诊断
    if (symptomKeywords.length > 0) {
      report += `## 🔍 基于症状的智能诊断\n\n`;
      report += `> 症状描述："${symptomKeywords}"\n\n`;

      const matchedDiseases: Array<{ match: number; info: typeof SYMPTOM_DB[0] }> = [];
      for (const entry of SYMPTOM_DB) {
        let matchCount = 0;
        for (const kw of entry.symptoms) {
          if (symptomKeywords.includes(kw)) matchCount++;
        }
        if (matchCount > 0) matchedDiseases.push({ match: matchCount / entry.symptoms.length, info: entry });
      }
      matchedDiseases.sort((a, b) => b.match - a.match);

      if (matchedDiseases.length > 0) {
        for (let i = 0; i < Math.min(3, matchedDiseases.length); i++) {
          const m = matchedDiseases[i];
          report += `### 诊断结果 #${i + 1}（匹配度 ${(m.match * 100).toFixed(0)}%）\n\n`;
          report += `**可能病害：** ${m.info.diseases.join(' / ')}\n\n`;
          report += `**治疗方案：** ${m.info.treatment}\n\n`;
        }
      } else {
        report += `未在知识库中匹配到精确症状，以下为通用诊断建议：\n\n`;
        report += `1. 拍摄病变部位照片，对比农业病虫害图鉴\n`;
        report += `2. 检查叶片正反面、茎基部、根部\n`;
        report += `3. 关注是否有虫粪、蜜露、丝网等痕迹\n`;
        report += `4. 观察病害扩散速度和范围\n\n`;
      }
    }

    // 综合防治建议
    report += `## 🛡️ 综合防治方案\n\n`;
    report += `### 预防措施\n`;
    report += `1. **农业防治：** 合理轮作、选用抗病品种、合理密植、加强通风透光\n`;
    report += `2. **物理防治：** 黄板诱杀蚜虫/白粉虱、杀虫灯诱杀、防虫网阻隔\n`;
    report += `3. **生物防治：** 释放天敌（瓢虫控制蚜虫、赤眼蜂控制螟虫）、使用生物农药（苏云金杆菌、枯草芽孢杆菌）\n\n`;

    if (riskScore > 50) {
      report += `### 当前紧急措施（环境风险高）\n`;
      report += `1. **立即通风**：将棚内湿度降至75%以下，温度降至28°C以下\n`;
      report += `2. **预防性喷药**：使用保护性杀菌剂（代森锰锌、百菌清）进行预防\n`;
      report += `3. **清除病残体**：及时摘除病叶、病果，带出田外销毁\n`;
      report += `4. **减少叶面水分**：避免喷灌，改用滴灌；不在傍晚浇水\n`;
    }

    report += `\n> 💡 描述具体症状（如"叶片有黄色斑点"）可获得更精准的诊断。配置 API Key 可启用 AI 深度分析。`;
    return report;
  }

  // ===== 产量预测 =====
  if (q.includes('产量') || q.includes('预测') || q.includes('采收') || q.includes('收获')) {
    let report = `# 📈 智能产量预测分析\n> ${now} | 节气：${term}\n\n`;

    if (batches.length === 0) {
      report += `当前无活跃种植批次，无法进行产量预测。\n\n`;
      report += `请在种植计划中创建种植批次后，系统将自动跟踪生长进度并预测产量。\n`;
      return report;
    }

    for (const b of batches) {
      if (!b.sowDate || !b.estimatedHarvestDate) continue;
      const totalDays = Math.ceil((new Date(b.estimatedHarvestDate).getTime() - new Date(b.sowDate).getTime()) / 86400000);
      const elapsed = Math.ceil((Date.now() - new Date(b.sowDate).getTime()) / 86400000);
      const daysLeft = Math.max(0, totalDays - elapsed);
      const progress = Math.min(100, Math.round((elapsed / totalDays) * 100));

      const vi = getVarietyInfo(b.varietyName);
      const plot = plots.find(p => p.id === b.plotId);
      const plotSensors = sensors.filter(s => s.plotId === b.plotId);
      const tempArr = plotSensors.filter(s => (s.s_sensor_type || s.sensor_type) === 'temperature');
      const soilArr = plotSensors.filter(s => (s.s_sensor_type || s.sensor_type) === 'soil_moisture');
      const humArr = plotSensors.filter(s => (s.s_sensor_type || s.sensor_type) === 'humidity');
      const tempAvg = tempArr.length ? tempArr.reduce((a: number, s: any) => a + Number(s.s_value || s.value), 0) / tempArr.length : NaN;
      const soilAvg = soilArr.length ? soilArr.reduce((a: number, s: any) => a + Number(s.s_value || s.value), 0) / soilArr.length : NaN;
      const humAvg = humArr.length ? humArr.reduce((a: number, s: any) => a + Number(s.s_value || s.value), 0) / humArr.length : NaN;

      report += `## ${b.varietyName} — ${b.plotName}（${b.area}亩）\n\n`;
      report += `| 指标 | 数值 |\n|------|------|\n`;
      report += `| 生长进度 | ${progress}%（已${elapsed}天/总${totalDays}天，还剩${daysLeft}天） |\n`;
      report += `| 播种日期 | ${fmtDate(b.sowDate)} |\n`;
      report += `| 预计采收 | ${fmtDate(b.estimatedHarvestDate)} |\n`;
      if (vi) report += `| 品种类型 | ${vi.category} |\n`;
      if (plot) report += `| 土壤类型 | ${plot.soilType || '未知'} |\n`;
      if (!isNaN(tempAvg)) report += `| 地块温度 | ${tempAvg.toFixed(1)}°C |\n`;
      if (!isNaN(soilAvg)) report += `| 土壤湿度 | ${soilAvg.toFixed(1)}% |\n`;
      if (!isNaN(humAvg)) report += `| 空气湿度 | ${humAvg.toFixed(1)}% |\n`;
      report += `\n`;

      // 产量预测模型
      let yieldLow: number, yieldHigh: number, yieldExpected: number;
      let envFactors: string[] = [];

      if (vi) {
        // 基础产量区间
        yieldLow = vi.yieldPerMu[0];
        yieldHigh = vi.yieldPerMu[1];
        yieldExpected = (yieldLow + yieldHigh) / 2;

        // 环境修正因子
        let envModifier = 1.0;

        // 温度修正
        if (!isNaN(tempAvg)) {
          if (tempAvg >= vi.optTemp[0] && tempAvg <= vi.optTemp[1]) {
            envFactors.push(`✅ 温度${tempAvg.toFixed(1)}°C在最佳区间(${vi.optTemp[0]}~${vi.optTemp[1]}°C)`);
          } else {
            const deviation = Math.min(Math.abs(tempAvg - vi.optTemp[0]), Math.abs(tempAvg - vi.optTemp[1]));
            const penalty = Math.min(0.3, deviation * 0.02);
            envModifier *= (1 - penalty);
            envFactors.push(`⚠️ 温度${tempAvg.toFixed(1)}°C偏离最佳区间，产量影响-${(penalty * 100).toFixed(0)}%`);
          }
        }

        // 土壤湿度修正
        if (!isNaN(soilAvg)) {
          if (soilAvg >= vi.optSoilMoisture[0] && soilAvg <= vi.optSoilMoisture[1]) {
            envFactors.push(`✅ 土壤湿度${soilAvg.toFixed(1)}%适宜`);
          } else {
            const penalty = soilAvg < vi.optSoilMoisture[0]
              ? Math.min(0.25, (vi.optSoilMoisture[0] - soilAvg) * 0.01)
              : Math.min(0.2, (soilAvg - vi.optSoilMoisture[1]) * 0.008);
            envModifier *= (1 - penalty);
            envFactors.push(`⚠️ 土壤湿度${soilAvg.toFixed(1)}%${soilAvg < vi.optSoilMoisture[0] ? '偏低' : '偏高'}，产量影响-${(penalty * 100).toFixed(0)}%`);
          }
        }

        // 生长进度修正（早期有更多提升空间）
        if (progress < 30) envModifier *= 0.85;
        else if (progress < 50) envModifier *= 0.92;
        else if (progress < 70) envModifier *= 0.97;
        else if (progress > 90) envModifier *= 1.02;

        yieldLow = Math.round(yieldLow * envModifier * b.area);
        yieldHigh = Math.round(yieldHigh * envModifier * b.area);
        yieldExpected = Math.round((yieldLow + yieldHigh) / 2);

        report += `### 📊 产量预测\n\n`;
        report += `| 预测类型 | 预测产量（kg） |\n|----------|----------------|\n`;
        report += `| 乐观估计 | ${yieldHigh.toLocaleString()} |\n`;
        report += `| **预期产量** | **${yieldExpected.toLocaleString()}** |\n`;
        report += `| 保守估计 | ${yieldLow.toLocaleString()} |\n`;
        report += `| 预期亩产 | ${(yieldExpected / b.area).toFixed(0)} kg/亩 |\n`;
        report += `\n`;

        report += `### 📋 环境影响分析\n\n`;
        for (const f of envFactors) report += `- ${f}\n`;

        // 提升产量建议
        report += `\n### 💡 提升产量建议\n\n`;
        if (!isNaN(tempAvg) && tempAvg > vi.optTemp[1]) report += `1. **降温**：温度超出最佳范围${(tempAvg - vi.optTemp[1]).toFixed(1)}°C，建议遮阳通风\n`;
        if (!isNaN(tempAvg) && tempAvg < vi.optTemp[0]) report += `1. **保温**：温度低于最佳范围${(vi.optTemp[0] - tempAvg).toFixed(1)}°C，建议加温覆盖\n`;
        if (!isNaN(soilAvg) && soilAvg < vi.optSoilMoisture[0]) report += `1. **灌溉**：土壤湿度偏低，增加灌溉频次和量\n`;
        if (progress < 50) report += `2. **追肥**：当前处于生长前期，追施氮肥促长\n`;
        if (progress >= 50 && progress < 80) report += `2. **追肥**：处于生长旺盛期，追施钾肥促果实膨大\n`;
        report += `3. **病虫害防控**：定期巡检，及时防治病虫害减少损失\n`;
        if (daysLeft <= 14) report += `4. **采收准备**：${daysLeft}天后可采收，提前准备采收工具和存储设施\n`;
      } else {
        report += `该品种(${b.varietyName})暂无详细产量数据库。\n`;
        report += `\n**粗略估计：** 按一般蔬菜亩产2000~4000kg估算，${b.area}亩总产约${(2000 * b.area).toLocaleString()}~${(4000 * b.area).toLocaleString()}kg。\n`;
      }
      report += `\n---\n\n`;
    }

    report += `> 💡 配置 AI API Key 可获得更精准的产量预测（考虑历史数据、气象预报等多维因素）`;
    return report;
  }

  // ===== 种植规划 =====
  if (q.includes('种植') || q.includes('品种') || q.includes('播种') || q.includes('计划') || q.includes('安排')) {
    const idlePlots = plots.filter(p => p.status === '闲置');
    const usedPlots = plots.filter(p => p.status !== '闲置');
    const rec = getRecommendedVarietiesForCurrentTerm();

    let report = `# 🌱 智能种植规划分析\n> ${now} | 节气：${term}\n\n`;

    // 地块利用分析
    const totalArea = plots.reduce((a, p) => a + p.area, 0);
    const usedArea = usedPlots.reduce((a, p) => a + p.area, 0);
    const idleArea = idlePlots.reduce((a, p) => a + p.area, 0);
    const utilization = totalArea > 0 ? (usedArea / totalArea * 100) : 0;

    report += `## 📊 地块利用概况\n\n`;
    report += `| 类型 | 地块数 | 面积 | 占比 |\n|------|--------|------|------|\n`;
    report += `| 🟢 使用中 | ${usedPlots.length}块 | ${usedArea.toFixed(1)}亩 | ${utilization.toFixed(0)}% |\n`;
    report += `| ⚪ 闲置 | ${idlePlots.length}块 | ${idleArea.toFixed(1)}亩 | ${(100 - utilization).toFixed(0)}% |\n`;
    report += `| 合计 | ${plots.length}块 | ${totalArea.toFixed(1)}亩 | 100% |\n\n`;

    if (utilization < 60) report += `> ⚠️ 地块利用率仅${utilization.toFixed(0)}%，有${idleArea.toFixed(1)}亩土地闲置，建议合理安排种植计划。\n\n`;

    // 节气种植建议
    report += `## 📅 节气种植建议（${term}）\n\n`;
    if (rec.length > 0) {
      report += `**当前节气推荐品种：** ${rec.join('、')}\n\n`;
      for (const name of rec) {
        const vi = getVarietyInfo(name);
        if (vi) {
          report += `### ${name}（${vi.category}）\n\n`;
          report += `- **生长周期：** ${vi.growthDays[0]}~${vi.growthDays[1]}天\n`;
          report += `- **预期亩产：** ${vi.yieldPerMu[0]}~${vi.yieldPerMu[1]}kg\n`;
          report += `- **适宜温度：** ${vi.optTemp[0]}~${vi.optTemp[1]}°C\n`;
          report += `- **适宜土壤湿度：** ${vi.optSoilMoisture[0]}~${vi.optSoilMoisture[1]}%\n`;
          report += `- **适宜pH：** ${vi.optPH[0]}~${vi.optPH[1]}\n`;
          report += `- **注意病虫害：** ${vi.pests.join('、')}\n`;
          report += `- **注意病害：** ${vi.diseases.join('、')}\n\n`;
        }
      }
    }

    // 节气农事
    if (termInfo.activities.length > 0) {
      report += `## 🌾 ${term}时节农事活动\n\n`;
      for (const a of termInfo.activities) report += `- ${a}\n`;
    }
    if (termInfo.warnings.length > 0) {
      report += `\n**⚠️ 注意事项：**\n`;
      for (const w of termInfo.warnings) report += `- ${w}\n`;
    }

    // 空闲地块适配分析
    if (idlePlots.length > 0) {
      report += `\n## 🏗️ 空闲地块种植方案\n\n`;
      const tempAvg = avg('temperature');
      for (const p of idlePlots) {
        report += `### ${p.plotNumber}（${p.area}亩，${p.soilType || '未知土壤'}）\n\n`;
        const plotSensors = sensors.filter(s => s.plotId === p.id);
        const plotSoil = plotSensors.filter(s => (s.s_sensor_type || s.sensor_type) === 'soil_moisture');
        const plotPH = plotSensors.filter(s => (s.s_sensor_type || s.sensor_type) === 'ph');
        const soilAvg = plotSoil.length ? plotSoil.reduce((a: number, s: any) => a + Number(s.s_value || s.value), 0) / plotSoil.length : NaN;
        const phAvg = plotPH.length ? plotPH.reduce((a: number, s: any) => a + Number(s.s_value || s.value), 0) / plotPH.length : NaN;

        // 推荐品种匹配
        const suitable: string[] = [];
        for (const [name, vi] of Object.entries(VARIETY_DB)) {
          if (!isNaN(tempAvg) && (tempAvg < vi.optTemp[0] - 5 || tempAvg > vi.optTemp[1] + 5)) continue;
          if (!isNaN(phAvg) && (phAvg < vi.optPH[0] - 0.5 || phAvg > vi.optPH[1] + 0.5)) continue;
          suitable.push(name);
        }
        if (suitable.length > 0) {
          report += `**环境适宜品种：** ${suitable.join('、')}\n`;
          if (!isNaN(soilAvg)) report += `当前土壤湿度：${soilAvg.toFixed(1)}%\n`;
          if (!isNaN(phAvg)) report += `当前土壤pH：${phAvg.toFixed(1)}\n`;
        }
        report += `\n`;
      }
    }

    // 活跃批次管理建议
    if (batches.length > 0) {
      report += `## 📋 活跃种植批次管理\n\n`;
      for (const b of batches) {
        const elapsed = b.sowDate ? Math.ceil((Date.now() - new Date(b.sowDate).getTime()) / 86400000) : 0;
        const daysLeft = b.estimatedHarvestDate ? Math.max(0, Math.ceil((new Date(b.estimatedHarvestDate).getTime() - Date.now()) / 86400000)) : 0;
        report += `- **${b.varietyName}**（${b.plotName}，${b.area}亩）— 已生长${elapsed}天，${daysLeft > 0 ? `预计${daysLeft}天后采收` : '已到采收期'}\n`;
      }
    }

    report += `\n> 💡 配置 AI API Key 可获得更精准的个性化种植方案`;
    return report;
  }

  // ===== 任务/派工/排程 =====
  if (q.includes('任务') || q.includes('派工') || q.includes('安排') || q.includes('计划') || q.includes('工作') || q.includes('农事') || q.includes('排程')) {
    let report = `# 📝 农事任务智能分析与排程\n> ${now} | 节气：${term}\n\n`;

    // 现有任务概况
    report += `## 📊 任务概况\n\n`;
    const highTasks = tasks.filter(t => t.priority === 'high');
    const medTasks = tasks.filter(t => t.priority === 'medium');
    const lowTasks = tasks.filter(t => t.priority === 'low');
    const unassigned = tasks.filter(t => !t.assigneeId);
    const overdue = tasks.filter(t => t.scheduledDate && new Date(t.scheduledDate) < today && t.status !== '已完成');

    report += `| 类型 | 数量 |\n|------|------|\n`;
    report += `| 总任务 | ${tasks.length} |\n`;
    report += `| 🔴 紧急 | ${highTasks.length} |\n`;
    report += `| 🟡 一般 | ${medTasks.length} |\n`;
    report += `| 🟢 低优 | ${lowTasks.length} |\n`;
    report += `| ⚠️ 未派工 | ${unassigned.length} |\n`;
    if (overdue.length > 0) report += `| 🚨 逾期 | ${overdue.length} |\n`;
    report += `\n`;

    // AI 生成本周排程
    report += `## 📅 AI 本周农事排程建议\n\n`;

    const scheduleItems: { day: string; task: string; priority: string; plot: string; assignee?: string; reason: string }[] = [];
    const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const dayIndex = Math.min(today.getDay() === 0 ? 6 : today.getDay() - 1, 6);

    // 基于环境异常生成紧急任务
    const drySensors = sensors.filter(s => (s.s_sensor_type || s.sensor_type) === 'soil_moisture' && Number(s.s_value || s.value) < 25);
    const highTempSensors = sensors.filter(s => (s.s_sensor_type || s.sensor_type) === 'temperature' && Number(s.s_value || s.value) > 35);

    if (drySensors.length > 0) {
      for (const s of drySensors.slice(0, 3)) {
        const plot = plots.find(p => p.id === s.plotId);
        scheduleItems.push({
          day: dayNames[dayIndex], task: '紧急灌溉', priority: '🔴紧急',
          plot: plot?.plotNumber || '未知地块',
          reason: `土壤湿度${Number(s.s_value || s.value).toFixed(1)}%，严重干旱`
        });
      }
    }
    if (highTempSensors.length > 0) {
      scheduleItems.push({
        day: dayNames[dayIndex], task: '启动降温措施', priority: '🔴紧急',
        plot: '全场', reason: `温度超过35°C`
      });
    }

    // 基于批次生长阶段生成任务
    for (const b of batches) {
      if (!b.sowDate || !b.estimatedHarvestDate) continue;
      const elapsed = Math.ceil((Date.now() - new Date(b.sowDate).getTime()) / 86400000);
      const total = Math.ceil((new Date(b.estimatedHarvestDate).getTime() - new Date(b.sowDate).getTime()) / 86400000);
      const progress = Math.min(100, Math.round(elapsed / total * 100));
      const plot = plots.find(p => p.id === b.plotId);
      const plotName = plot?.plotNumber || b.plotName || '未知';

      if (progress < 15) {
        scheduleItems.push({ day: dayNames[dayIndex], task: `${b.varietyName}苗期管理（补苗、保温保湿）`, priority: '🟡重要', plot: plotName, reason: '刚播种/定植，苗期管理关键' });
      } else if (progress < 35) {
        scheduleItems.push({ day: dayNames[Math.min(dayIndex + 1, 6)], task: `${b.varietyName}追肥+除草`, priority: '🟡重要', plot: plotName, reason: '生长前期需追施氮肥促进生长' });
      } else if (progress < 65) {
        scheduleItems.push({ day: dayNames[Math.min(dayIndex + 1, 6)], task: `${b.varietyName}整枝+病虫害巡查`, priority: '🟡重要', plot: plotName, reason: '生长旺盛期需整枝和病害防控' });
      } else if (progress < 85) {
        scheduleItems.push({ day: dayNames[Math.min(dayIndex + 2, 6)], task: `${b.varietyName}追施钾肥+减少灌溉`, priority: '🟢普通', plot: plotName, reason: '成熟期追钾促果实膨大' });
      } else {
        scheduleItems.push({ day: dayNames[Math.min(dayIndex + 2, 6)], task: `${b.varietyName}采收准备`, priority: '🟡重要', plot: plotName, reason: '即将/已到采收期' });
      }
    }

    // 节气农事
    if (termInfo.activities.length > 0) {
      for (let i = 0; i < Math.min(3, termInfo.activities.length); i++) {
        scheduleItems.push({
          day: dayNames[Math.min(dayIndex + i, 6)],
          task: termInfo.activities[i],
          priority: '🟢普通',
          plot: '全场',
          reason: `${term}时节推荐农事`
        });
      }
    }

    // 按天输出
    const byDay: Record<string, typeof scheduleItems> = {};
    for (const item of scheduleItems) {
      if (!byDay[item.day]) byDay[item.day] = [];
      byDay[item.day].push(item);
    }

    for (const day of Object.keys(byDay)) {
      report += `### ${day}\n\n`;
      for (const item of byDay[day]) {
        report += `- ${item.priority} **${item.task}** → ${item.plot}\n`;
        report += `  - ${item.reason}\n`;
      }
      report += `\n`;
    }

    // 工人分配建议
    if (staff.length > 0) {
      report += `## 👷 工人分配建议\n\n`;
      const unassignedTasks = tasks.filter(t => !t.assigneeId && t.status !== '已完成');
      if (unassignedTasks.length > 0) {
        for (let i = 0; i < Math.min(unassignedTasks.length, staff.length); i++) {
          report += `- **${staff[i].name}**（${staff[i].businessDivision || staff[i].systemRole || '未分组'}）→ ${unassignedTasks[i].title}\n`;
        }
        if (unassignedTasks.length > staff.length) {
          report += `\n⚠️ 任务数(${unassignedTasks.length})多于工人数(${staff.length})，建议优先分配紧急任务\n`;
        }
      } else {
        report += `所有待办任务均已分配工人。\n`;
      }
    }

    report += `\n> 💡 配置 AI API Key 可启用更智能的排程优化（考虑工人技能、历史效率、天气预报等）`;
    return report;
  }

  // ===== 设备分析 =====
  if (q.includes('设备') || q.includes('维护') || q.includes('保养') || q.includes('维修')) {
    let report = `# 🔧 设备状态智能分析\n> ${now}\n\n`;

    if (equipment.length === 0) {
      report += `暂无设备数据。\n`;
      return report;
    }

    const byStatus: Record<string, typeof equipment> = {};
    for (const e of equipment) {
      if (!byStatus[e.status]) byStatus[e.status] = [];
      byStatus[e.status].push(e);
    }

    report += `## 📊 设备概况\n\n`;
    report += `| 状态 | 数量 | 占比 |\n|------|------|------|\n`;
    for (const [status, items] of Object.entries(byStatus)) {
      const icon = status === '正常' ? '🟢' : status === '故障' ? '🔴' : '🟡';
      report += `| ${icon} ${status} | ${items.length}台 | ${(items.length / equipment.length * 100).toFixed(0)}% |\n`;
    }
    report += `\n`;

    // 保养到期
    const needMaintenance = equipment.filter(e => e.nextMaintenanceDate && new Date(e.nextMaintenanceDate) <= new Date(Date.now() + 7 * 8640000));
    if (needMaintenance.length > 0) {
      report += `## ⚠️ 保养提醒\n\n`;
      for (const e of needMaintenance) {
        const days = Math.ceil((new Date(e.nextMaintenanceDate!).getTime() - Date.now()) / 86400000);
        const plot = plots.find(p => p.id === e.associatedPlotId);
        report += `- **${e.equipmentNumber}**（${e.type}）${plot ? ` → ${plot.plotNumber}` : ''} — ${days <= 0 ? '🚨 已过期' : `${days}天后到期`}\n`;
      }
    }

    report += `\n> 💡 定期保养可延长设备寿命，建议建立保养日历`;
    return report;
  }

  // ===== 通用回复 =====
  let report = `# 🌾 农场管家 — 智能助手\n> ${now} | 节气：${term}\n\n`;

  report += `## 📊 农场概况\n\n`;
  report += `- 地块：${plots.length}块 / ${plots.reduce((a, p) => a + p.area, 0).toFixed(1)}亩\n`;
  report += `- 活跃批次：${batches.length}个（${batches.map(b => b.varietyName).join('、') || '暂无'}）\n`;
  report += `- 品种库：${varieties.length}个\n`;
  report += `- 待办任务：${tasks.length}个\n`;
  report += `- 设备：${equipment.length}台\n`;
  report += `- 工人：${staff.length}人\n`;

  if (sensors.length > 0) {
    report += `\n## 🌡️ 最新环境数据\n\n`;
    for (const type of Object.keys(sensorMap)) {
      const items = sensorMap[type];
      const avgVal = items.reduce((a, b) => a + b.val, 0) / items.length;
      report += `- **${type}**: 平均${avgVal.toFixed(1)} ${items[0]?.unit || ''}（${items.length}个传感器）\n`;
    }
  }

  if (termInfo.warnings.length > 0) {
    report += `\n## ⚠️ 节气提醒（${term}）\n\n`;
    for (const w of termInfo.warnings) report += `- ${w}\n`;
  }

  report += `\n## 💡 我可以帮你分析\n\n`;
  report += `输入以下关键词获取专业分析：\n`;
  report += `- 输入 **环境/温度/湿度** → 获取环境数据综合分析报告\n`;
  report += `- 输入 **灌溉/浇水/干旱** → 获取智能灌溉决策\n`;
  report += `- 输入 **病虫害/症状** → 获取病虫害诊断（可描述具体症状）\n`;
  report += `- 输入 **产量/预测/采收** → 获取产量预测分析\n`;
  report += `- 输入 **种植/品种/播种** → 获取种植规划建议\n`;
  report += `- 输入 **任务/排程/派工** → 获取农事排程建议\n`;
  report += `- 输入 **设备** → 获取设备状态分析\n\n`;
  report += `所有分析均基于系统 **真实数据** 动态生成。\n`;

  return report;
}

/** 查找品种数据库 */
function getVarietyInfo(name: string) {
  if (!name) return null;
  for (const [key, info] of Object.entries(VARIETY_DB)) {
    if (name.includes(key) || key.includes(name)) return info;
  }
  return null;
}

// ====== 业务 AI 功能（均通过 callAI，有 API Key 用大模型，无则用专家引擎）======

async function chat(params: { message: string; context?: string }): Promise<string> {
  const [sensors, plots, batches, tasks] = await Promise.all([getLatestSensors(), getAllPlots(), getActiveBatches(), getPendingTasks()]);
  const term = getCurrentSolarTerm();

  let systemCtx = `${SYSTEM_PROMPT}\n\n当前农场实时数据：\n`;
  systemCtx += `- 节气: ${term}\n`;
  systemCtx += `- 地块: ${plots.length}块（总面积${plots.reduce((a, p) => a + p.area, 0).toFixed(1)}亩）\n`;
  systemCtx += `- 活跃批次: ${batches.length}个（${batches.map(b => `${b.varietyName}(${b.plotName}/${b.area}亩)`).join('、')}）\n`;
  systemCtx += `- 待办任务: ${tasks.length}个（紧急${tasks.filter(t => t.priority === 'high').length}个）\n`;

  if (sensors.length > 0) {
    const byType: Record<string, number[]> = {};
    for (const s of sensors) {
      const type = s.s_sensor_type || s.sensor_type;
      const val = Number(s.s_value || s.value);
      if (!isNaN(val)) { if (!byType[type]) byType[type] = []; byType[type].push(val); }
    }
    systemCtx += `- 环境: ${Object.entries(byType).map(([t, v]) => `${t}平均${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1)}`).join(', ')}\n`;
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemCtx },
    { role: 'user', content: params.message },
  ];

  return await callAI(messages, 0.7);
}

async function getEnvironmentAnalysis(plotId?: string): Promise<string> {
  const sensors = await getLatestSensors(plotId);
  const trend = await getSensorTrend24h(plotId);
  const plotsData = await getAllPlots();

  let contextInfo = `请分析以下农业环境数据并给出专业建议：\n\n`;
  if (sensors.length > 0) {
    contextInfo += '传感器实时数据:\n';
    for (const s of sensors) {
      const plot = plotsData.find(p => p.id === s.plot_id);
      contextInfo += `- ${(s.s_sensor_type || s.sensor_type)}: ${s.s_value || s.value} ${s.s_unit || s.unit || ''} (设备: ${s.device_id}${plot ? ', 地块: ' + plot.plotNumber : ''})\n`;
    }
  }
  if (Object.keys(trend).length > 0) {
    contextInfo += '\n24h数据趋势:\n';
    for (const [type, t] of Object.entries(trend)) {
      contextInfo += `- ${type}: 最高${t.max.toFixed(1)}, 最低${t.min.toFixed(1)}, 平均${t.avg.toFixed(1)}\n`;
    }
  }
  if (!sensors.length) return '暂无传感器数据，无法进行环境分析。';

  if (!isAIConfigured()) {
    return expertAnalysisEngine('环境分析');
  }
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + '\n\n你是农业环境分析专家。根据传感器数据评估当前农业环境状况，分析数据趋势，指出异常，并给出具体的环境调控建议。使用Markdown格式输出，包含表格和分类。' },
    { role: 'user', content: contextInfo },
  ];
  return await callAIHttp(messages, 0.5);
}

async function getYieldPrediction(params: { plotId?: string; varietyId?: string; batchId?: string }): Promise<string> {
  const batchesData = await getActiveBatches();
  let contextInfo = '请预测以下种植的产量：\n\n';

  if (params.batchId) {
    const batch = batchesData.find(b => b.id === params.batchId);
    if (batch) {
      const vi = getVarietyInfo(batch.varietyName);
      contextInfo += `品种: ${batch.varietyName} (${vi?.category || '未知'})\n`;
      contextInfo += `地块: ${batch.plotName}, 面积: ${batch.area}亩\n`;
      contextInfo += `播种: ${batch.sowDate}, 预计采收: ${batch.estimatedHarvestDate}\n`;
      if (vi) {
        contextInfo += `品种典型亩产: ${vi.yieldPerMu[0]}~${vi.yieldPerMu[1]}kg\n`;
        contextInfo += `最佳生长温度: ${vi.optTemp[0]}~${vi.optTemp[1]}°C\n`;
        contextInfo += `最佳土壤湿度: ${vi.optSoilMoisture[0]}~${vi.optSoilMoisture[1]}%\n`;
      }
    }
  }

  const latestSensors = await getLatestSensors(params.plotId);
  if (latestSensors.length > 0) {
    contextInfo += '\n当前环境数据:\n';
    for (const s of latestSensors.slice(0, 6)) {
      contextInfo += `- ${(s.s_sensor_type || s.sensor_type)}: ${s.s_value || s.value} ${s.s_unit || s.unit || ''}\n`;
    }
  }

  if (!params.batchId && batchesData.length > 0) {
    contextInfo += '\n所有活跃批次:\n';
    for (const b of batchesData) {
      const elapsed = b.sowDate ? Math.ceil((Date.now() - new Date(b.sowDate).getTime()) / 86400000) : 0;
      const vi = getVarietyInfo(b.varietyName);
      contextInfo += `- ${b.varietyName}(${b.plotName}/${b.area}亩) 已${elapsed}天${vi ? ` 典型亩产${vi.yieldPerMu[0]}~${vi.yieldPerMu[1]}kg` : ''}\n`;
    }
  }

  if (!isAIConfigured()) {
    return expertAnalysisEngine('[YIELD]产量预测');
  }
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + '\n\n你是农业产量预测专家。根据品种特性、生长进度、环境条件预测产量。要求给出具体的亩产和总产数据（给出区间），分析影响因素，提出提升产量的具体措施。使用Markdown格式。' },
    { role: 'user', content: contextInfo },
  ];
  return await callAIHttp(messages, 0.5);
}

async function getPestDiagnosis(params: { symptoms: string; plotId?: string; varietyName?: string }): Promise<string> {
  let contextInfo = `请诊断以下病虫害问题：\n\n`;
  contextInfo += `症状描述: ${params.symptoms}\n`;
  if (params.varietyName) {
    const vi = getVarietyInfo(params.varietyName);
    contextInfo += `作物品种: ${params.varietyName}`;
    if (vi) contextInfo += ` (${vi.category})，该品种常见病害: ${vi.diseases.join('、')}，常见虫害: ${vi.pests.join('、')}`;
    contextInfo += '\n';
  }

  const plotSensors = await getLatestSensors(params.plotId);
  if (plotSensors.length > 0) {
    contextInfo += '\n当前环境数据:\n';
    for (const s of plotSensors.slice(0, 6)) {
      contextInfo += `- ${(s.s_sensor_type || s.sensor_type)}: ${s.s_value || s.value} ${s.s_unit || s.unit || ''}\n`;
    }
  }

  if (!isAIConfigured()) {
    return expertAnalysisEngine('[PEST]病虫害 ' + params.symptoms);
  }
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + '\n\n你是植保专家。根据症状描述和环境数据诊断病虫害。要求：1）列出前3个可能的病害/虫害并给出置信度 2）分析诊断依据 3）给出具体防治方案（药剂名称+用量+用法） 4）给出预防措施。使用Markdown格式。' },
    { role: 'user', content: contextInfo },
  ];
  return await callAIHttp(messages, 0.4);
}

async function getPlantingRecommendation(params: { plotId?: string; varietyId?: string; area?: number; season?: string }): Promise<string> {
  let contextInfo = '请为以下条件制定种植方案：\n\n';
  const term = getCurrentSolarTerm();
  const rec = getRecommendedVarietiesForCurrentTerm();
  contextInfo += `当前节气: ${term}\n节气推荐品种: ${rec.join('、') || '暂无'}\n`;

  const plotsData = await getAllPlots();
  const idlePlots = plotsData.filter(p => p.status === '闲置');
  if (idlePlots.length > 0) {
    contextInfo += `\n空闲地块: ${idlePlots.map(p => `${p.plotNumber}(${p.area}亩/${p.soilType || '未知'})`).join(', ')}\n`;
  }

  if (params.plotId) {
    const plot = plotsData.find(p => p.id === params.plotId);
    if (plot) contextInfo += `\n目标地块: ${plot.plotNumber} ${plot.area}亩 ${plot.soilType || '未知土壤'} ${plot.region}\n`;
  }

  const varietiesData = await getAllVarieties();
  if (params.varietyId) {
    const variety = varietiesData.find(v => v.id === params.varietyId);
    if (variety) {
      const vi = getVarietyInfo(variety.name);
      contextInfo += `\n目标品种: ${variety.name}(${variety.category})\n`;
      if (vi) {
        contextInfo += `典型亩产: ${vi.yieldPerMu[0]}~${vi.yieldPerMu[1]}kg\n`;
        contextInfo += `最佳条件: 温度${vi.optTemp[0]}~${vi.optTemp[1]}°C 土壤湿度${vi.optSoilMoisture[0]}~${vi.optSoilMoisture[1]}% pH${vi.optPH[0]}~${vi.optPH[1]}\n`;
      }
    }
  }

  if (!isAIConfigured()) {
    return expertAnalysisEngine('种植 ' + contextInfo);
  }
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + '\n\n你是种植规划专家。根据地块条件、环境数据和节气信息，给出详细的种植建议。包括：1）品种选择及理由 2）最佳播种时间 3）种植密度 4）水肥管理方案 5）预期产量 6）风险提示及应对。使用Markdown格式。' },
    { role: 'user', content: contextInfo },
  ];
  return await callAIHttp(messages, 0.6);
}

async function getDashboardInsight(): Promise<string> {
  const [sensors, batches, plots, tasks] = await Promise.all([
    getLatestSensors(), getActiveBatches(), getAllPlots(), getPendingTasks()
  ]);
  const term = getCurrentSolarTerm();
  const anomalies: string[] = [];
  for (const s of sensors) {
    const type = s.s_sensor_type || s.sensor_type;
    const val = Number(s.s_value || s.value);
    if (type === 'temperature' && val > 35) anomalies.push(`温度${val.toFixed(1)}°C过高`);
    if (type === 'soil_moisture' && val < 25) anomalies.push(`土壤湿度${val.toFixed(1)}%过低`);
    if (type === 'humidity' && val > 85) anomalies.push(`湿度${val.toFixed(1)}%过高`);
  }

  let contextInfo = `农场概况（${term}）：\n`;
  contextInfo += `进行中批次: ${batches.length}个（${batches.map(b => `${b.varietyName}/${b.area}亩`).join('、')}）\n`;
  contextInfo += `地块利用: ${plots.filter(p => p.status !== '闲置').length}/${plots.length}\n`;
  contextInfo += `待办任务: ${tasks.length}个（紧急${tasks.filter(t => t.priority === 'high').length}个）\n`;
  if (anomalies.length) contextInfo += `异常: ${anomalies.join('、')}\n`;

  if (!isAIConfigured()) {
    return expertAnalysisEngine('任务排程');
  }
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + '\n\n请根据农场数据生成简洁日报洞察：1）整体状态评估（1句话） 2）需关注事项（最多3条） 3）今日操作建议（最多3条）。总字数200字以内。' },
    { role: 'user', content: contextInfo },
  ];
  return await callAIHttp(messages, 0.6);
}

async function getPlotAnalysis(plotId: string): Promise<string> {
  const plot = (await getAllPlots()).find(p => p.id === plotId);
  if (!plot) return '未找到该地块信息';

  const [sensors, batches, operations, tasks] = await Promise.all([
    getLatestSensors(plotId), getActiveBatches(), getRecentOperations(10), getPendingTasks()
  ]);
  const plotBatches = batches.filter(b => b.plotId === plotId);
  const plotOps = operations.filter(o => o.plotId === plotId);
  const plotTasks = tasks.filter(t => t.plotId === plotId);

  let contextInfo = `地块：${plot.plotNumber} | ${plot.area}亩 | ${plot.soilType || '未知土壤'} | ${plot.region} | 状态: ${plot.status}\n\n`;
  if (sensors.length) {
    contextInfo += '传感器数据:\n';
    for (const s of sensors) contextInfo += `  ${(s.s_sensor_type || s.sensor_type)}: ${s.s_value || s.value} ${s.s_unit || s.unit || ''}\n`;
  }
  if (plotBatches.length) {
    contextInfo += '\n种植批次:\n';
    for (const b of plotBatches) {
      const elapsed = Math.ceil((Date.now() - new Date(b.sowDate).getTime()) / 86400000);
      contextInfo += `  ${b.varietyName} 已${elapsed}天 预计${fmtDate(b.estimatedHarvestDate)}采收\n`;
    }
  }
  if (plotTasks.length) contextInfo += `\n待办任务: ${plotTasks.map(t => t.title).join(', ')}\n`;

  if (!isAIConfigured()) {
    return expertAnalysisEngine('环境分析 ' + plot.plotNumber);
  }
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + '\n\n你是农业数据分析师。给出地块综合分析：1）状态评估 2）环境分析 3）种植情况 4）管理建议 5）注意事项。使用Markdown格式。' },
    { role: 'user', content: contextInfo },
  ];
  return await callAIHttp(messages, 0.5);
}

async function getSmartSchedule(): Promise<string> {
  const [batches, sensors, plots, tasks, staff] = await Promise.all([
    getActiveBatches(), getLatestSensors(), getAllPlots(), getPendingTasks(), getAllStaff()
  ]);
  const term = getCurrentSolarTerm();

  let contextInfo = `请生成本周农事排程（${term}）：\n\n`;
  contextInfo += `活跃批次(${batches.length}个):\n`;
  for (const b of batches) {
    if (!b.sowDate || !b.estimatedHarvestDate) continue;
    const elapsed = Math.ceil((Date.now() - new Date(b.sowDate).getTime()) / 86400000);
    const total = Math.ceil((new Date(b.estimatedHarvestDate).getTime() - new Date(b.sowDate).getTime()) / 86400000);
    contextInfo += `  ${b.varietyName}(${b.plotName}) ${b.area}亩 进度${Math.round(elapsed / total * 100)}% 已${elapsed}天/总${total}天\n`;
  }

  contextInfo += `\n现有待办(${tasks.length}个):\n`;
  for (const t of tasks.slice(0, 10)) {
    contextInfo += `  ${t.priority === 'high' ? '紧急' : t.priority === 'medium' ? '一般' : '低优'} ${t.title} ${t.assigneeName || '未派工'} ${fmtDate(t.scheduledDate) || '未排期'}\n`;
  }

  contextInfo += `\n可用工人(${staff.length}人): ${staff.map(s => `${s.name}(${s.businessDivision || s.systemRole || '未分组'})`).join(', ')}\n`;

  const drySensors = sensors.filter(s => (s.s_sensor_type || s.sensor_type) === 'soil_moisture' && Number(s.s_value || s.value) < 30);
  const highTemp = sensors.filter(s => (s.s_sensor_type || s.sensor_type) === 'temperature' && Number(s.s_value || s.value) > 35);
  if (drySensors.length) contextInfo += `\n紧急: ${drySensors.length}个传感器土壤干旱\n`;
  if (highTemp.length) contextInfo += `紧急: ${highTemp.length}个传感器高温\n`;

  if (!isAIConfigured()) {
    return expertAnalysisEngine('任务排程');
  }
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + '\n\n你是农场排程专家。生成本周最优农事计划：1）按优先级排列 2）每个任务指明名称、地块、类型、建议执行人、建议日期 3）考虑环境异常 4）考虑作物生长阶段 5）合理分配工人。使用Markdown表格和编号列表格式。' },
    { role: 'user', content: contextInfo },
  ];
  return await callAIHttp(messages, 0.5);
}

// ====== 导出 ======
export class AIService {
  async plantingRecommendation(params: Parameters<typeof getPlantingRecommendation>[0]) {
    return getPlantingRecommendation(params);
  }
  async environmentAnalysis(plotId?: string) {
    return getEnvironmentAnalysis(plotId);
  }
  async yieldPrediction(params: Parameters<typeof getYieldPrediction>[0]) {
    return getYieldPrediction(params);
  }
  async pestDiagnosis(params: Parameters<typeof getPestDiagnosis>[0]) {
    return getPestDiagnosis(params);
  }
  async chat(params: Parameters<typeof chat>[0]) {
    return chat(params);
  }
  async dashboardInsight() {
    return getDashboardInsight();
  }
  async plotAnalysis(plotId: string) {
    return getPlotAnalysis(plotId);
  }
  async smartSchedule() {
    return getSmartSchedule();
  }
  isConfigured() { return isAIConfigured(); }
}

export const aiService = new AIService();
