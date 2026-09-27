export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  source: string;
  publishDate: string;
  imageUrl?: string;
  tags: string[];
  views: number;
}

const NEWS_DATA: NewsItem[] = [
  // ===== 农业市场 =====
  {
    id: '1',
    title: '2026年全国夏粮喜获丰收 总产量预计突破1.5亿吨',
    summary: '农业农村部最新数据显示，今年夏粮生产形势总体向好，预计总产量将创历史新高。',
    content: '据农业农村部最新调度数据，2026年全国夏粮播种面积达到4.2亿亩，比上年增加300万亩。受惠于良好天气条件和科技支撑，预计夏粮总产量将突破1.5亿吨，同比增长3.2%。\n\n其中，小麦产量预计达到1.38亿吨，同比增产4.1%；夏收油菜籽产量预计达到1450万吨，增长2.8%。\n\n农业农村部相关负责人表示，今年夏粮丰收主要得益于三个方面：一是政策扶持力度持续加大，粮食生产支持政策资金超过2000亿元；二是高标准农田建设稳步推进；三是农业科技贡献率提高到66%，优良品种覆盖率超过96%。',
    category: '市场',
    source: '农业农村部',
    publishDate: '2026-06-05',
    tags: ['夏粮', '丰收', '产量', '粮食安全'],
    views: 15280
  },
  {
    id: '2',
    title: '蔬菜价格连续三周回落 大宗农产品市场供应充足',
    summary: '全国农产品批发市场监测数据显示，重点监测的28种蔬菜均价环比下降8.5%。',
    content: '据全国农产品批发市场价格监测系统数据，6月份以来，全国农产品批发市场重点监测的28种蔬菜周均价连续三周回落，累计降幅达8.5%。\n\n其中，黄瓜、西红柿、茄子等茄果类蔬菜价格降幅较大，环比下降12%~18%；叶菜类价格相对稳定。\n\n分析人士指出，蔬菜价格回落主要受季节性因素影响。随着南方露地蔬菜大量上市，市场供应量明显增加。',
    category: '市场',
    source: '全国农产品市场信息网',
    publishDate: '2026-06-03',
    tags: ['蔬菜', '价格', '市场行情', '供应'],
    views: 8930
  },
  {
    id: '3',
    title: '猪肉价格持续回暖 养殖户盈利空间逐步扩大',
    summary: '全国生猪出厂均价回升至18.5元/公斤，养殖端自繁自养头均盈利约200元。',
    content: '据中国畜牧业协会监测，6月初全国生猪出厂均价回升至18.5元/公斤，较上月同期上涨12.3%。猪粮比达到6.8:1，养殖端自繁自养头均盈利约200元。\n\n业内分析认为，猪肉价格回暖主要受三方面因素支撑：一是能繁母猪存栏量持续调整；二是夏季消费旺季即将来临；三是进口冻肉数量减少。',
    category: '市场',
    source: '中国畜牧业协会',
    publishDate: '2026-06-02',
    tags: ['猪肉', '生猪', '价格', '养殖'],
    views: 12450
  },
  // ===== 农业政策 =====
  {
    id: '4',
    title: '中央一号文件聚焦智慧农业 数字乡村建设全面提速',
    summary: '2026年中央一号文件提出，加快推动智慧农业发展，到2030年农业数字化转型取得重要进展。',
    content: '2026年中央一号文件提出，到2030年农业数字化转型取得重要进展，智慧农业技术装备水平大幅提升。\n\n主要目标包括：\n1. 建设一批国家级智慧农业示范区，物联网技术在设施农业中的覆盖率达到60%以上\n2. 农产品质量安全追溯体系实现全覆盖\n3. 农业农村大数据平台基本建成\n4. 培育10万个数字农业新型经营主体\n\n中央财政将安排专项资金200亿元用于智慧农业基础设施建设。',
    category: '政策',
    source: '新华社',
    publishDate: '2026-02-15',
    tags: ['中央一号文件', '智慧农业', '数字乡村', '政策'],
    views: 28760
  },
  {
    id: '5',
    title: '农业农村部发布设施农业现代化提升行动方案',
    summary: '方案明确到2028年设施农业面积达到4000万亩，设施农业科技进步贡献率超过70%。',
    content: '农业农村部联合科技部、财政部发布设施农业现代化提升行动方案。\n\n方案提出五项重点任务：\n1. 推广新型节能日光温室和智能连栋温室\n2. 建设设施农业数字化管理平台\n3. 研发推广设施专用新品种和新技术\n4. 完善设施农业产业链条\n5. 培养设施农业技术人才',
    category: '政策',
    source: '农业农村部',
    publishDate: '2026-05-20',
    tags: ['设施农业', '现代化', '政策', '温室'],
    views: 9800
  },
  {
    id: '6',
    title: '耕地保护新规出台 永久基本农田特殊保护制度全面实施',
    summary: '新规要求各地建立永久基本农田"田长制"，确保耕地数量不减少、质量有提升。',
    content: '自然资源部、农业农村部联合印发通知，要求各地严格落实耕地保护责任。建立省、市、县、乡、村五级"田长制"，永久基本农田重点用于粮食生产，严格控制耕地转为其他农用地。',
    category: '政策',
    source: '自然资源部',
    publishDate: '2026-04-10',
    tags: ['耕地保护', '基本农田', '田长制', '粮食安全'],
    views: 11320
  },
  // ===== 农业人事 =====
  {
    id: '7',
    title: '新农人力量：90后海归夫妻返乡创业打造智慧农场',
    summary: '毕业于荷兰瓦赫宁根大学的张明夫妇回到家乡山东寿光，用科技重新定义传统蔬菜种植。',
    content: '在山东寿光，一对90后夫妻正在用前沿科技改变传统农业的面貌。张明和妻子李雪分别毕业于荷兰瓦赫宁根大学和以色列希伯来大学，主修智慧农业和精准灌溉。\n\n2024年回国后，他们在寿光建立了50亩智慧农场，引入了以色列滴灌技术、荷兰温室控制系统和自主开发的AI决策平台。通过传感器网络实时监测，AI系统自动调节温室环境，实现了蔬菜产量提升40%、用水量减少60%、人工成本降低50%。\n\n目前，已带动周边30多家农户加入，合作种植面积超过2000亩，年产值突破5000万元。',
    category: '人事',
    source: '农民日报',
    publishDate: '2026-05-28',
    tags: ['新农人', '返乡创业', '智慧农场', '海归'],
    views: 18900
  },
  {
    id: '8',
    title: '乡村振兴带头人：村支书带领全村发展设施农业 年收入翻三倍',
    summary: '江苏连云港某村支书王大力带领村民发展智能温室种植，村集体年收入从80万增至320万。',
    content: '江苏省连云港市赣榆区某村党支部书记王大力，用五年时间带领全村发展设施农业，实现了从贫困村到富裕村的华丽转身。\n\n2019年当选村支书后，筹资建设了80亩智能温室大棚，引进以色列灌溉系统和物联网监控设备。第一批种植的番茄和黄瓜，亩均产值达到3万元，是传统露地种植的5倍。\n\n如今全村设施农业面积已扩大到500亩，村集体经济年收入从80万元增长到320万元。',
    category: '人事',
    source: '新华网',
    publishDate: '2026-05-15',
    tags: ['乡村振兴', '带头人', '设施农业', '致富'],
    views: 22100
  },
  // ===== 农业作物 =====
  {
    id: '9',
    title: '转基因耐旱玉米新品种通过国审 预计增产15%以上',
    summary: '中国农科院研发的转DREB基因耐旱玉米新品种获得国家品种审定。',
    content: '中国农业科学院作物科学研究所研发的转DREB基因耐旱玉米新品种"中单808"正式通过国家品种审定。该品种在正常水分条件下产量与对照品种相当，在干旱胁迫条件下可比对照增产15%以上，同时减少灌溉用水约30%。',
    category: '作物',
    source: '中国农业科学院',
    publishDate: '2026-05-25',
    tags: ['转基因', '玉米', '耐旱', '品种审定'],
    views: 14500
  },
  {
    id: '10',
    title: '早稻病虫害防控形势严峻 农业农村部发布紧急通知',
    summary: '据监测，今年南方稻区"两迁"害虫迁入时间早、迁入量大。',
    content: '农业农村部发布紧急通知，要求各地切实做好早稻病虫害防控工作。据监测，今年南方稻区稻飞虱、稻纵卷叶螟等"两迁"害虫迁入时间较常年偏早7~10天，迁入量是去年同期的2.3倍。',
    category: '作物',
    source: '农业农村部',
    publishDate: '2026-06-01',
    tags: ['水稻', '病虫害', '稻飞虱', '防控'],
    views: 16780
  },
  {
    id: '11',
    title: '全国大豆油料产能提升工程成效显著 大豆种植面积达2.1亿亩',
    summary: '通过推广大豆玉米带状复合种植技术，全国大豆种植面积连续三年增长。',
    content: '据农业农村部最新统计，2026年全国大豆种植面积达到2.1亿亩，比上年增加1200万亩，实现连续三年增长。大豆总产量预计达到2350万吨，同比增长8.5%。\n\n大豆产能提升的核心在于大豆玉米带状复合种植技术的推广，目前已在全国17个省区市推广面积超过3500万亩。',
    category: '作物',
    source: '中国农业信息网',
    publishDate: '2026-06-04',
    tags: ['大豆', '油料', '产能提升', '种植面积'],
    views: 10500
  },
  // ===== 农业科研 =====
  {
    id: '12',
    title: '中国农科院成功研发AI农作物病虫害识别系统 准确率达98.5%',
    summary: '基于深度学习的病虫害智能识别系统可识别300余种常见病虫害，已在20个省份试点推广。',
    content: '中国农业科学院植物保护研究所研发的AI农作物病虫害识别系统取得重大突破。该系统基于深度学习技术，可识别水稻、小麦、玉米、蔬菜等作物300余种常见病虫害，识别准确率达到98.5%。\n\n系统创新点包括：\n1. 采用多模态融合技术，综合图像、环境数据和地理位置信息\n2. 支持手机端实时拍照识别，3秒内输出诊断结果\n3. 可根据诊断结果自动生成防治方案\n\n目前已在20个省份试点推广，服务农户超过50万户，累计减少农药使用量约15%。',
    category: '科研',
    source: '中国农业科学院',
    publishDate: '2026-05-30',
    tags: ['AI', '病虫害识别', '深度学习', '科研突破'],
    views: 25600
  },
  {
    id: '13',
    title: '华中农业大学破译水稻耐盐碱关键基因 为盐碱地稻作提供新方案',
    summary: '研究团队成功克隆并验证了控制水稻耐盐碱性的关键基因SKT1，相关论文发表在Nature Genetics。',
    content: '华中农业大学水稻研究团队在Nature Genetics发表最新研究成果，成功克隆并验证了控制水稻耐盐碱性的关键基因SKT1。\n\n该基因通过调控根部的钠离子转运蛋白，显著提高水稻在盐碱胁迫条件下的存活率和产量。在盐碱浓度0.3%的试验田中，过表达SKT1的转基因水稻材料比野生型产量提高35%以上。\n\n我国盐碱地面积约15亿亩，其中可利用面积超过3亿亩。',
    category: '科研',
    source: 'Nature Genetics',
    publishDate: '2026-05-18',
    tags: ['水稻', '耐盐碱', '基因', 'Nature'],
    views: 19800
  },
  {
    id: '14',
    title: '中国农业大学发布农业碳中和路线图 提出五大关键技术路径',
    summary: '路线图提出到2060年实现农业碳中和目标，通过技术变革将农业碳排放减少80%以上。',
    content: '中国农业大学全球农业与食物系统研究院发布《中国农业碳中和路线图（2026-2060）》。\n\n路线图提出五大关键技术路径：\n1. 稻田甲烷减排技术\n2. 化肥减量增效技术\n3. 畜禽粪污资源化利用\n4. 可再生能源替代\n5. 碳汇农业技术',
    category: '科研',
    source: '中国农业大学',
    publishDate: '2026-05-22',
    tags: ['碳中和', '农业', '减排', '技术路径'],
    views: 13400
  },
  {
    id: '15',
    title: '无人农场示范项目在广东东莞启动 全程机械化+AI决策',
    summary: '该项目将实现从耕种管收到加工储运的全流程无人化作业，预计节省人工成本70%。',
    content: '农业农村部与广东省政府联合建设的全国首个"无人农场示范项目"在广东东莞正式启动。\n\n示范项目占地500亩，部署了无人拖拉机、无人插秧机、植保无人机、无人收割机等智能装备40余台（套），配合5G通信网络、北斗导航系统和AI决策平台，实现全流程无人化作业。\n\n据测算，全流程无人化可节省人工成本70%以上，作业效率提升30%。',
    category: '科研',
    source: '科技日报',
    publishDate: '2026-06-06',
    tags: ['无人农场', '智慧农业', 'AI', '5G'],
    views: 21000
  },
];

export function getNewsList(category?: string, page = 1, pageSize = 10) {
  let filtered = category && category !== '全部' ? NEWS_DATA.filter(n => n.category === category) : [...NEWS_DATA];
  filtered.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  return { items: filtered.slice(start, start + pageSize), total, page, pageSize };
}

export function getNewsById(id: string) {
  return NEWS_DATA.find(n => n.id === id);
}

export function getNewsCategories(): string[] {
  return ['全部', '市场', '政策', '人事', '作物', '科研'];
}

// ===== 动态新闻生成器 (基于当前日期生成最新资讯) =====
const DYNAMIC_TEMPLATES = [
  { category: '市场', title_tpl: '今日全国农产品批发价格指数{trend}，蔬菜均价{price}元/公斤', source: '全国农产品批发市场信息网', tags: ['价格', '农产品', '行情'] },
  { category: '市场', title_tpl: '{crop}产区价格监测：今日均价{price}元/斤，环比{trend}', source: '中国农产品价格监测系统', tags: ['价格监测', '产地行情'] },
  { category: '政策', title_tpl: '农业农村部发布《关于推进{topic}的指导意见》', source: '农业农村部', tags: ['政策', '指导意见', '农业'] },
  { category: '政策', title_tpl: '{province}出台新一轮农业补贴政策，设施农业补贴最高{amount}元/亩', source: '省级农业农村厅', tags: ['补贴', '设施农业', '惠农'] },
  { category: '作物', title_tpl: '全国{crop}病虫害发生面积达{area}万亩，防控进展通报', source: '全国农业技术推广服务中心', tags: ['病虫害', '防控', '监测'] },
  { category: '作物', title_tpl: '{crop}新品种通过国家审定，预计亩产可达{yield}公斤', source: '国家农作物品种审定委员会', tags: ['新品种', '品种审定', '产量'] },
  { category: '科研', title_tpl: '中国农科院研发新型{tech}技术，提升{metric}达{percent}%', source: '中国农业科学院', tags: ['科研', '技术突破', '创新'] },
  { category: '科研', title_tpl: '智慧农业新突破：{tech}系统在{province}试点成功', source: '科技日报', tags: ['智慧农业', '试点', '科技'] },
  { category: '人事', title_tpl: '{province}新农人带动{count}户农户发展特色种植，人均增收{amount}元', source: '农民日报', tags: ['新农人', '增收', '特色产业'] },
  { category: '市场', title_tpl: '夏粮收购进度加快，全国累计收购{grain}万吨', source: '国家粮食和物资储备局', tags: ['夏粮收购', '粮食', '储备'] },
  { category: '政策', title_tpl: '中央财政下达{amount}亿元支持高标准农田建设', source: '财政部', tags: ['财政', '高标准农田', '基建'] },
  { category: '科研', title_tpl: '农业无人机植保作业面积突破{area}万亩/日，效率再创新高', source: '农业农村部农机化司', tags: ['无人机', '植保', '农机'] },
];

const CROP_NAMES = ['小麦', '水稻', '玉米', '大豆', '番茄', '黄瓜', '辣椒', '西瓜', '草莓', '油菜'];
const PROVINCES = ['山东', '河南', '黑龙江', '四川', '湖南', '江苏', '广东', '安徽', '河北', '湖北'];
const TECHS = ['AI病虫害识别', '精准灌溉', '无人机植保', '物联网监测', '智能温室', '区块链溯源', '大数据决策'];
const TOPICS = ['高标准农田建设', '农业绿色发展', '粮食产能提升', '种业振兴', '数字农业'];

function generateDynamicNews(count: number = 8): NewsItem[] {
  const today = new Date();
  const items: NewsItem[] = [];
  const used = new Set<number>();

  for (let i = 0; i < count; i++) {
    let tplIdx: number;
    do { tplIdx = Math.floor(Math.random() * DYNAMIC_TEMPLATES.length); } while (used.has(tplIdx) && used.size < DYNAMIC_TEMPLATES.length);
    used.add(tplIdx);

    const tpl = DYNAMIC_TEMPLATES[tplIdx];
    const crop = CROP_NAMES[Math.floor(Math.random() * CROP_NAMES.length)];
    const province = PROVINCES[Math.floor(Math.random() * PROVINCES.length)];
    const tech = TECHS[Math.floor(Math.random() * TECHS.length)];

    const title = tpl.title_tpl
      .replace('{trend}', Math.random() > 0.5 ? '上涨' : '回落')
      .replace('{price}', (Math.random() * 8 + 1.5).toFixed(1))
      .replace('{crop}', crop)
      .replace('{topic}', TOPICS[Math.floor(Math.random() * TOPICS.length)])
      .replace('{province}', province)
      .replace('{amount}', (Math.floor(Math.random() * 500) + 100).toString())
      .replace('{area}', (Math.floor(Math.random() * 800) + 100).toString())
      .replace('{yield}', (Math.floor(Math.random() * 3000) + 500).toString())
      .replace('{percent}', (Math.floor(Math.random() * 30) + 10).toString())
      .replace('{tech}', tech)
      .replace('{count}', (Math.floor(Math.random() * 500) + 50).toString())
      .replace('{grain}', (Math.floor(Math.random() * 3000) + 1000).toString());

    const offsetDays = Math.floor(Math.random() * 3);
    const pubDate = new Date(today);
    pubDate.setDate(pubDate.getDate() - offsetDays);

    items.push({
      id: `dynamic-${Date.now()}-${i}`,
      title,
      summary: `${title}。据最新监测数据，相关领域呈现积极发展态势，各地积极推进相关工作。`,
      content: `${title}。\n\n据相关部门最新发布的数据，当前农业生产形势总体向好。各级农业农村部门正按照年度工作部署，扎实推进各项重点任务。\n\n专家分析指出，随着科技进步和政策支持力度加大，相关领域有望取得新的突破。建议各地结合实际情况，科学安排生产计划，确保农业稳产增效。`,
      category: tpl.category,
      source: tpl.source,
      publishDate: pubDate.toISOString().slice(0, 10),
      tags: [...tpl.tags],
      views: Math.floor(Math.random() * 20000) + 1000,
    });
  }
  return items;
}

let dynamicNewsCache: { items: NewsItem[]; timestamp: number } = { items: [], timestamp: 0 };

export function fetchLatestNews(count: number = 8): { items: NewsItem[]; fetchedAt: string } {
  const now = Date.now();
  // 缓存5分钟内不重复生成
  if (now - dynamicNewsCache.timestamp > 5 * 60 * 1000 || dynamicNewsCache.items.length === 0) {
    dynamicNewsCache.items = generateDynamicNews(count);
    dynamicNewsCache.timestamp = now;
  }
  return {
    items: dynamicNewsCache.items,
    fetchedAt: new Date(dynamicNewsCache.timestamp).toLocaleString('zh-CN'),
  };
}

export function getMergedNewsList(category?: string, page = 1, pageSize = 20) {
  const dynamic = fetchLatestNews().items;
  const all = [...dynamic, ...NEWS_DATA];
  let filtered = category && category !== '全部' ? all.filter(n => n.category === category) : all;
  // 去重（按id）
  const seen = new Set<string>();
  filtered = filtered.filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; });
  filtered.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  return { items: filtered.slice(start, start + pageSize), total, page, pageSize };
}

