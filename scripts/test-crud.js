const http = require('http');
const crypto = require('crypto');

const BASE = 'localhost';
const PORT = 3001;
let token;

function r(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const opts = {
      hostname: BASE, port: PORT, path: '/api/v1' + path, method,
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const req = http.request(opts, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function login() {
  const res = await r('POST', '/auth/login', { username: 'admin', password: 'admin123' });
  token = res.body.accessToken;
  console.log('Login:', token ? 'OK' : 'FAIL');
}

async function testCreateDelete(entity, path, createData) {
  // Create
  const cRes = await r('POST', '/' + path, createData);
  const ok = cRes.status === 201;
  console.log(`${entity}: CREATE ${ok ? '✅ 201' : '❌ ' + cRes.status + ' ' + (cRes.body?.error || cRes.body)}`);

  // Delete
  if (ok && cRes.body?.data?.id) {
    const dRes = await r('DELETE', '/' + path + '/' + cRes.body.data.id);
    const dOk = dRes.status === 200;
    console.log(`${entity}: DELETE ${dOk ? '✅ 200' : '❌ ' + dRes.status}`);
  } else if (ok && cRes.body?.id) {
    const dRes = await r('DELETE', '/' + path + '/' + cRes.body.id);
    const dOk = dRes.status === 200;
    console.log(`${entity}: DELETE ${dOk ? '✅ 200' : '❌ ' + dRes.status}`);
  } else if (!ok) {
    console.log(`${entity}: SKIP delete (create failed)`);
  }
}

async function main() {
  await login();
  if (!token) return;

  console.log('\n=== 增删测试 ===\n');

  // 1. Plot
  await testCreateDelete('地块', 'plots', { plotNumber: 'TEST-PLOT', area: 1.5, region: 'D区', status: '闲置' });

  // 2. Variety
  await testCreateDelete('品种', 'varieties', { name: '测试品种-' + Date.now(), category: '叶菜类', sowingSeason: ['春'], plantingDensity: 1000, growthCycle: 30, safetyInterval: 5 });

  // 3. Staff
  await testCreateDelete('员工', 'staff', { name: '测试员工', username: 'testuser-' + Date.now().toString(36), password: 'abc12345', systemRole: '操作员', businessDivision: '测试' });

  // 4. Equipment
  await testCreateDelete('设备', 'equipment', { equipmentNumber: 'EQ-TEST-' + Date.now().toString(36), type: '灌溉设备', status: '正常' });

  // 5. Planting Plan - needs existing plot and variety
  const plots = await r('GET', '/plots');
  const vars = await r('GET', '/varieties');
  if (plots.body?.data?.[0] && vars.body?.data?.[0]) {
    await testCreateDelete('种植计划', 'planting-plans', {
      plotId: plots.body.data[0].id, plotName: plots.body.data[0].plotNumber,
      varietyId: vars.body.data[0].id, varietyName: vars.body.data[0].name,
      plannedSowDate: '2026-06-05', plannedHarvestDate: '2026-09-05', area: 2, status: '待执行'
    });
  }

  // 6. Production Batch
  if (plots.body?.data?.[0] && vars.body?.data?.[0]) {
    await testCreateDelete('生产批次', 'production-batches', {
      plotId: plots.body.data[0].id, varietyId: vars.body.data[0].id, varietyName: vars.body.data[0].name,
      sowDate: '2026-06-01', estimatedHarvestDate: '2026-09-01', area: 1.5
    });
  }

  // 7. Farming Operation
  const batches = await r('GET', '/production-batches');
  if (plots.body?.data?.[0] && batches.body?.data?.[0]) {
    await testCreateDelete('农事操作', 'farming-operations', {
      operationType: '播种', plotId: plots.body.data[0].id, operatorName: '测试',
      operationDate: new Date().toISOString(), area: 1, batchId: batches.body.data[0].id
    });
  }

  // 8. Cost
  await testCreateDelete('成本', 'costs/costs', { type: '种子', description: '测试成本', amount: 100, date: new Date().toISOString().slice(0, 10) });

  // 9. Sale
  await testCreateDelete('销售', 'costs/sales', { customer: '测试客户', varietyName: '番茄', quantity: 10, unit: 'kg', unitPrice: 5, totalAmount: 50, saleDate: new Date().toISOString().slice(0, 10), paymentStatus: '已付款', salesperson: '测试' });

  // 10. Inventory
  await testCreateDelete('库存', 'inventory/agricultural-inputs', { type: '农资', name: '测试农资-' + Date.now(), quantity: 10, unit: '袋' });

  // 11. System Settings
  const stRes = await r('GET', '/settings');
  if (stRes.body?.data?.[0]) {
    const key = stRes.body.data[0].settingKey;
    const putRes = await r('PUT', '/settings/' + key, { value: '10' });
    console.log('系统设置: UPDATE ' + key + ' ' + (putRes.status === 200 ? '✅ 200' : '❌ ' + putRes.status));
    const resetRes = await r('PUT', '/settings/' + key, { value: stRes.body.data[0].settingValue });
    console.log('系统设置: RESET ' + key + ' ' + (resetRes.status === 200 ? '✅ 200' : '❌ ' + resetRes.status));
  }

  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);
