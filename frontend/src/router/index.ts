import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import LoginView from '../views/LoginView.vue';
import PlotManagement from '../views/PlotManagement.vue';
import VarietyManagement from '../views/VarietyManagement.vue';
import StaffManagement from '../views/StaffManagement.vue';
import EquipmentManagement from '../views/EquipmentManagement.vue';
import FarmingOperationManagement from '../views/FarmingOperationManagement.vue';
import PlantingPlanView from '../views/PlantingPlanView.vue';
import InventoryManagement from '../views/InventoryManagement.vue';
import TraceabilityView from '../views/TraceabilityView.vue';
import CostManagement from '../views/CostManagement.vue';
import IoTMonitor from '../views/IoTMonitor.vue';
import NotificationCenter from '../views/NotificationCenter.vue';
import AlertManagement from '../views/AlertManagement.vue';
import AIAssistant from '../views/AIAssistant.vue';
import BaseMapView from '../views/BaseMapView.vue';
import FarmTaskView from '../views/FarmTaskView.vue';
import NewsView from '../views/NewsView.vue';
import SystemSettingsView from '../views/SystemSettingsView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/plots',
      name: 'Plots',
      component: PlotManagement,
      meta: { requiresAuth: true },
    },
    {
      path: '/varieties',
      name: 'Varieties',
      component: VarietyManagement,
      meta: { requiresAuth: true },
    },
    {
      path: '/staff',
      name: 'Staff',
      component: StaffManagement,
      meta: { requiresAuth: true },
    },
    {
      path: '/equipment',
      name: 'Equipment',
      component: EquipmentManagement,
      meta: { requiresAuth: true },
    },
    {
      path: '/farming-operations',
      name: 'FarmingOperations',
      component: FarmingOperationManagement,
      meta: { requiresAuth: true },
    },
    {
      path: '/planting-plans',
      name: 'PlantingPlans',
      component: PlantingPlanView,
      meta: { requiresAuth: true },
    },
    {
      path: '/inventory',
      name: 'Inventory',
      component: InventoryManagement,
      meta: { requiresAuth: true },
    },
    {
      path: '/traceability',
      name: 'Traceability',
      component: TraceabilityView,
      meta: { requiresAuth: true },
    },
    {
      path: '/costs',
      name: 'Costs',
      component: CostManagement,
      meta: { requiresAuth: true },
    },
    {
      path: '/iot',
      name: 'IoT',
      component: IoTMonitor,
      meta: { requiresAuth: true },
    },
    {
      path: '/alerts',
      name: 'Alerts',
      component: AlertManagement,
      meta: { requiresAuth: true },
    },
    {
      path: '/ai',
      name: 'AI',
      component: AIAssistant,
      meta: { requiresAuth: true },
    },
    {
      path: '/news',
      name: 'News',
      component: NewsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/base-map',
      name: 'BaseMap',
      component: BaseMapView,
      meta: { requiresAuth: true },
    },
    {
      path: '/farm-tasks',
      name: 'FarmTasks',
      component: FarmTaskView,
      meta: { requiresAuth: true },
    },
    {
      path: '/notifications',
      name: 'Notifications',
      component: NotificationCenter,
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'Settings',
      component: SystemSettingsView,
      meta: { requiresAuth: true },
    },
  ],
});

// 导航守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('access_token');
  
  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else {
    next();
  }
});

export default router;
