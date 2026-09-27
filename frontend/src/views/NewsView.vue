<template>
  <div class="news-page">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">📰 农业资讯中心</h2>
        <p class="page-desc">汇集农业市场动态、政策法规、人事资讯、作物信息和科研前沿</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :loading="refreshing" @click="fetchLatest" round>
          <el-icon><Refresh /></el-icon> 获取最新资讯
        </el-button>
        <span v-if="lastFetchedAt" class="fetch-time">最近更新: {{ lastFetchedAt }}</span>
      </div>
    </div>
    <div class="category-bar">
      <button v-for="cat in categories" :key="cat" :class="['cat-btn', { active: activeCategory === cat }]" @click="activeCategory = cat; loadNews()">
        {{ cat === '全部' ? '📋 全部' : cat === '市场' ? '📈 市场' : cat === '政策' ? '📜 政策' : cat === '人事' ? '👤 人事' : cat === '作物' ? '🌱 作物' : '🔬 科研' }}
      </button>
    </div>
    <div class="news-grid" v-loading="loading">
      <div v-for="item in newsList" :key="item.id" class="news-card" @click="openDetail(item)">
        <div class="card-category" :class="'cat-' + item.category">{{ item.category }}</div>
        <h3 class="card-title">{{ item.title }}</h3>
        <p class="card-summary">{{ item.summary }}</p>
        <div class="card-footer">
          <span class="card-source">{{ item.source }}</span>
          <span class="card-date">{{ item.publishDate }}</span>
          <span class="card-views">👁 {{ formatViews(item.views) }}</span>
        </div>
        <div class="card-tags">
          <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="tag">#{{ tag }}</span>
        </div>
      </div>
    </div>
    <div v-if="!loading && newsList.length === 0" class="empty-state">
      <span class="empty-icon">📭</span><p>暂无相关资讯</p>
    </div>
    <el-dialog v-model="showDetail" :title="detailItem?.title || ''" width="700px" top="5vh">
      <div v-if="detailItem" class="news-detail">
        <div class="detail-meta">
          <span class="detail-cat" :class="'cat-' + detailItem.category">{{ detailItem.category }}</span>
          <span class="detail-source">{{ detailItem.source }}</span>
          <span class="detail-date">{{ detailItem.publishDate }}</span>
          <span class="detail-views">👁 {{ detailItem.views }} 次阅读</span>
        </div>
        <div class="detail-content" v-html="formattedContent"></div>
        <div class="detail-tags">
          <span v-for="tag in detailItem.tags" :key="tag" class="tag">#{{ tag }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiClient } from '../services/api-client';
import { ElMessage } from 'element-plus';

interface NewsItem { id: string; title: string; summary: string; content: string; category: string; source: string; publishDate: string; tags: string[]; views: number; }

const categories = ref<string[]>(['全部', '市场', '政策', '人事', '作物', '科研']);
const activeCategory = ref('全部');
const newsList = ref<NewsItem[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const showDetail = ref(false);
const detailItem = ref<NewsItem | null>(null);
const lastFetchedAt = ref('');

const formattedContent = computed(() => { if (!detailItem.value) return ''; return detailItem.value.content.replace(/\n/g, '<br>'); });
const formatViews = (v: number) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toString();

const loadNews = async (includeLatest = true) => {
  loading.value = true;
  try {
    const params: any = { page: 1, pageSize: 30 };
    if (activeCategory.value !== '全部') params.category = activeCategory.value;
    if (includeLatest) params.latest = 'true';
    const res = await apiClient.get('/news', { params });
    newsList.value = res.data.data?.items || [];
  } catch (e) { console.error(e); } finally { loading.value = false; }
};

const fetchLatest = async () => {
  refreshing.value = true;
  try {
    const res = await apiClient.get('/news/latest');
    const result = res.data.data;
    lastFetchedAt.value = result.fetchedAt;
    // 重新加载合并后的列表
    await loadNews(true);
    ElMessage.success(`已获取最新资讯 ${result.items?.length || 0} 条`);
  } catch (e: any) {
    ElMessage.error('获取最新资讯失败: ' + e.message);
  } finally { refreshing.value = false; }
};

const openDetail = (item: NewsItem) => { detailItem.value = item; showDetail.value = true; };
onMounted(() => loadNews(true));
</script>

<style scoped>
.news-page { padding: 0; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 1.5rem; font-weight: 800; margin: 0 0 6px; background: linear-gradient(135deg, var(--color-primary), #dc2626); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.page-desc { font-size: 0.85rem; color: var(--color-text-muted); margin: 0; }
.header-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.fetch-time { font-size: 0.75rem; color: var(--color-text-muted); }
.category-bar { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
.cat-btn { padding: 8px 20px; border: 1px solid var(--color-border); border-radius: 20px; background: #fff; cursor: pointer; font-size: 0.85rem; font-weight: 500; color: var(--color-text-secondary); transition: all var(--transition-fast); font-family: var(--font-family); }
.cat-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.cat-btn.active { background: linear-gradient(135deg, var(--color-primary), #6366f1); color: #fff; border-color: transparent; box-shadow: 0 4px 15px rgba(16,185,129,0.3); }
.news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; min-height: 200px; }
.news-card { background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--color-border-light); padding: 1.5rem; cursor: pointer; transition: all var(--transition-base); position: relative; overflow: hidden; }
.news-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.08); border-color: var(--color-primary); }
.card-category { position: absolute; top: 0; right: 16px; padding: 4px 12px; border-radius: 0 0 8px 8px; font-size: 0.72rem; font-weight: 700; color: #fff; letter-spacing: 1px; }
.cat-市场 { background: linear-gradient(135deg, #f59e0b, #d97706); }
.cat-政策 { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.cat-人事 { background: linear-gradient(135deg, #10b981, #059669); }
.cat-作物 { background: linear-gradient(135deg, #84cc16, #65a30d); }
.cat-科研 { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.card-title { font-size: 1rem; font-weight: 700; color: var(--color-text); margin: 0.5rem 0 0.75rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-summary { font-size: 0.82rem; color: var(--color-text-secondary); line-height: 1.6; margin: 0 0 1rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.card-footer { display: flex; align-items: center; gap: 12px; font-size: 0.75rem; color: var(--color-text-muted); padding-top: 0.75rem; border-top: 1px solid var(--color-border-light); }
.card-views { margin-left: auto; }
.card-tags { display: flex; gap: 6px; margin-top: 0.75rem; flex-wrap: wrap; }
.tag { font-size: 0.7rem; color: var(--color-primary); background: rgba(16,185,129,0.06); padding: 2px 8px; border-radius: 10px; }
.empty-state { text-align: center; padding: 4rem; color: var(--color-text-muted); }
.empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
.detail-meta { display: flex; align-items: center; gap: 16px; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border-light); font-size: 0.82rem; color: var(--color-text-muted); flex-wrap: wrap; }
.detail-cat { padding: 3px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; color: #fff; }
.detail-views { margin-left: auto; }
.detail-content { font-size: 0.95rem; line-height: 1.8; color: var(--color-text); }
.detail-tags { display: flex; gap: 8px; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border-light); flex-wrap: wrap; }
</style>
