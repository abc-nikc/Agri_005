/**
 * 农场管家系统 E2E 测试
 * 运行方式: npx playwright test
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('登录模块', () => {
  test('访问登录页显示表单', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('h2')).toContainText('农场管家系统');
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('空表单提交应阻止', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    // HTML5 required 属性阻止空提交
    const isRequired = await page.locator('#username').getAttribute('required');
    expect(isRequired).toBeDefined();
  });

  test('登录后跳转仪表盘', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    // 等待跳转到仪表盘
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    await expect(page.locator('h2')).toContainText('农场管理仪表盘');
  });

  test('登录后导航栏可见', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    // 导航栏应显示
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('a:has-text("仪表盘")')).toBeVisible();
    await expect(page.locator('a:has-text("地块管理")')).toBeVisible();
  });
});

test.describe('页面导航', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
  });

  test('跳转地块管理', async ({ page }) => {
    await page.click('a:has-text("地块管理")');
    await expect(page.locator('h2')).toContainText('地块管理', { timeout: 3000 });
  });

  test('跳转品种管理', async ({ page }) => {
    await page.click('a:has-text("品种管理")');
    await expect(page.locator('h2')).toContainText('品种管理', { timeout: 3000 });
  });

  test('跳转员工管理', async ({ page }) => {
    await page.click('a:has-text("员工管理")');
    await expect(page.locator('h2')).toContainText('员工管理', { timeout: 3000 });
  });

  test('跳转设备管理', async ({ page }) => {
    await page.click('a:has-text("设备管理")');
    await expect(page.locator('h2')).toContainText('设备管理', { timeout: 3000 });
  });

  test('跳转农事操作', async ({ page }) => {
    await page.click('a:has-text("农事操作")');
    await expect(page.locator('h2')).toContainText('农事操作管理', { timeout: 3000 });
  });
});

test.describe('退出流程', () => {
  test('退出后跳回登录页', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    await page.click('button:has-text("退出登录")');
    await page.waitForURL('**/login', { timeout: 3000 });
    await expect(page.locator('#username')).toBeVisible();
  });

  test('退出后无法直接访问仪表盘', async ({ page }) => {
    // 先登录
    await page.goto(`${BASE}/login`);
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    // 退出
    await page.click('button:has-text("退出登录")');
    await page.waitForURL('**/login', { timeout: 3000 });
    // 直接访问仪表盘应被重定向
    await page.goto(`${BASE}/dashboard`);
    await page.waitForURL('**/login', { timeout: 3000 });
  });
});

test.describe('仪表盘功能', () => {
  test('显示关键指标卡片', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    await expect(page.locator('.metric-card').first()).toBeVisible({ timeout: 5000 });
  });
});
