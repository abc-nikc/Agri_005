"use strict";
const crypto = require('crypto');
const {Client} = require('../backend/node_modules/pg');

const db = new Client({host:'localhost',port:5432,user:'postgres',password:'LZY123',database:'farm_management'});
const u = ()=>crypto.randomUUID();
const f = d=>d.toISOString().split('T')[0];
function ago(n){const d=new Date();d.setDate(d.getDate()-n);return d;}

// helper: single INSERT with only specified columns
async function ins(table,data){
  const cols=Object.keys(data);
  const vals=cols.map(k=>data[k]);
  const ph=cols.map((_,i)=>'$'+(i+1)).join(',');
  await db.query('INSERT INTO '+table+'('+cols.join(',')+') VALUES('+ph+')',vals);
}

async function main(){
  await db.connect();

  // Clean tables 7-15 only (keep 1-6)
  console.log('Cleaning tables 7-15...');
  for(const t of 'notifications,sensor_data,sales_records,cost_records,traceability_records,stocktakes,stock_transactions,inventory,farming_operations'.split(','))
    await db.query('DELETE FROM '+t);

  // Get existing IDs from database
  const plots=(await db.query("SELECT id,plot_number FROM plots")).rows;
  const vars=(await db.query("SELECT id,name FROM varieties")).rows;
  const batch=(await db.query("SELECT id,batch_number,plot_name,variety_name FROM production_batches")).rows;
  const eqs=(await db.query("SELECT id,equipment_number FROM equipment")).rows;
  const pid=p=>plots.find(r=>r.plot_number===p)?.id;
  const vid=n=>vars.find(r=>r.name===n)?.id;
  const bid=n=>batch.find(r=>r.variety_name===n)?.id;
  const eid=n=>eqs.find(r=>r.equipment_number===n)?.id;

  // ═══════════════ 7. Farming Operations ═══════════════
  console.log('7/9 FarmingOps');
  const tBid=bid('番茄'), tVid=vid('番茄'), tPlot=pid('A01');
  const cBid=bid('黄瓜'), cVid=vid('黄瓜'), cPic=pid('A02');
  const pBid=bid('辣椒'), pVid=vid('辣椒'), pPlot=pid('B01');
  const wBid=bid('西瓜'), wVid=vid('西瓜'), wPlot=pid('B02');
  const sBid=bid('草莓'), sVid=vid('草莓'), sPlot=pid('C01');

  // Each operation: only columns that apply
  // tomato: sow→fert→pest→harvest
  await ins('farming_operations',{id:u(),operation_type:'播种',plot_id:tPlot,plot_name:'A01',variety_id:tVid,variety_name:'番茄',batch_id:tBid,area:2,operator_name:'李克',operation_date:ago(89)});
  await ins('farming_operations',{id:u(),operation_type:'灌溉',plot_id:tPlot,plot_name:'A01',variety_id:tVid,variety_name:'番茄',batch_id:tBid,area:2,operator_name:'李克',operation_date:ago(84),water_duration:30,water_duration_unit:'分钟',crop_stage:'苗期'});
  await ins('farming_operations',{id:u(),operation_type:'施肥',plot_id:tPlot,plot_name:'A01',variety_id:tVid,variety_name:'番茄',batch_id:tBid,area:2,operator_name:'李克',operation_date:ago(79),fertilizer_name:'复合肥',fertilizer_amount:15,fertilizer_unit:'kg',crop_stage:'生长期',weather:'晴',temperature:25});
  await ins('farming_operations',{id:u(),operation_type:'除草',plot_id:tPlot,plot_name:'A01',variety_id:tVid,variety_name:'番茄',batch_id:tBid,area:2,operator_name:'王强',operation_date:ago(74),work_description:'人工除草'});
  await ins('farming_operations',{id:u(),operation_type:'打药',plot_id:tPlot,plot_name:'A01',variety_id:tVid,variety_name:'番茄',batch_id:tBid,area:2,operator_name:'李克',operation_date:ago(59),pesticide_name:'吡虫啉',pesticide_amount:0.5,pesticide_unit:'升',crop_stage:'花果期',weather:'阴',temperature:20});
  await ins('farming_operations',{id:u(),operation_type:'采收',plot_id:tPlot,plot_name:'A01',variety_id:tVid,variety_name:'番茄',batch_id:tBid,area:2,operator_name:'李克',operation_date:ago(5),harvest_yield:520,yield_unit:'kg',quality_grade:'一级',harvest_destination:'本地市场'});
  // cucumber: sow→fert→harvest
  await ins('farming_operations',{id:u(),operation_type:'播种',plot_id:cPic,plot_name:'A02',variety_id:cVid,variety_name:'黄瓜',batch_id:cBid,area:3,operator_name:'王强',operation_date:ago(75)});
  await ins('farming_operations',{id:u(),operation_type:'灌溉',plot_id:cPic,plot_name:'A02',variety_id:cVid,variety_name:'黄瓜',batch_id:cBid,area:3,operator_name:'李克',operation_date:ago(70),water_duration:25,water_duration_unit:'分钟',crop_stage:'苗期'});
  await ins('farming_operations',{id:u(),operation_type:'施肥',plot_id:cPic,plot_name:'A02',variety_id:cVid,variety_name:'黄瓜',batch_id:cBid,area:3,operator_name:'王强',operation_date:ago(65),fertilizer_name:'有机肥',fertilizer_amount:20,fertilizer_unit:'kg',crop_stage:'生长期',weather:'晴',temperature:28});
  await ins('farming_operations',{id:u(),operation_type:'采收',plot_id:cPic,plot_name:'A02',variety_id:cVid,variety_name:'黄瓜',batch_id:cBid,area:3,operator_name:'李克',operation_date:ago(3),harvest_yield:680,yield_unit:'kg',quality_grade:'一级',harvest_destination:'本地商超'});
  // pepper: sow→fert→pest
  await ins('farming_operations',{id:u(),operation_type:'播种',plot_id:pPlot,plot_name:'B01',variety_id:pVid,variety_name:'辣椒',batch_id:pBid,area:5,operator_name:'王强',operation_date:ago(58)});
  await ins('farming_operations',{id:u(),operation_type:'灌溉',plot_id:pPlot,plot_name:'B01',variety_id:pVid,variety_name:'辣椒',batch_id:pBid,area:5,operator_name:'李克',operation_date:ago(53),water_duration:40,water_duration_unit:'分钟',crop_stage:'苗期'});
  await ins('farming_operations',{id:u(),operation_type:'施肥',plot_id:pPlot,plot_name:'B01',variety_id:pVid,variety_name:'辣椒',batch_id:pBid,area:5,operator_name:'王强',operation_date:ago(48),fertilizer_name:'复合肥',fertilizer_amount:30,fertilizer_unit:'kg',crop_stage:'生长期',weather:'晴',temperature:30});
  await ins('farming_operations',{id:u(),operation_type:'打药',plot_id:pPlot,plot_name:'B01',variety_id:pVid,variety_name:'辣椒',batch_id:pBid,area:5,operator_name:'李克',operation_date:ago(28),pesticide_name:'吡虫啉',pesticide_amount:1,pesticide_unit:'升',crop_stage:'生长期',weather:'阴',temperature:22});
  // watermelon: sow→fert
  await ins('farming_operations',{id:u(),operation_type:'播种',plot_id:wPlot,plot_name:'B02',variety_id:wVid,variety_name:'西瓜',batch_id:wBid,area:4,operator_name:'李克',operation_date:ago(49)});
  await ins('farming_operations',{id:u(),operation_type:'灌溉',plot_id:wPlot,plot_name:'B02',variety_id:wVid,variety_name:'西瓜',batch_id:wBid,area:4,operator_name:'王强',operation_date:ago(44),water_duration:35,water_duration_unit:'分钟',crop_stage:'苗期'});
  await ins('farming_operations',{id:u(),operation_type:'施肥',plot_id:wPlot,plot_name:'B02',variety_id:wVid,variety_name:'西瓜',batch_id:wBid,area:4,operator_name:'李克',operation_date:ago(39),fertilizer_name:'有机肥',fertilizer_amount:25,fertilizer_unit:'kg',crop_stage:'伸蔓期',weather:'晴',temperature:32});
  // strawberry: transplant→fert
  await ins('farming_operations',{id:u(),operation_type:'移栽',plot_id:sPlot,plot_name:'C01',variety_id:sVid,variety_name:'草莓',batch_id:sBid,area:1,operator_name:'张农艺',operation_date:ago(28)});
  await ins('farming_operations',{id:u(),operation_type:'灌溉',plot_id:sPlot,plot_name:'C01',variety_id:sVid,variety_name:'草莓',batch_id:sBid,area:1,operator_name:'李克',operation_date:ago(23),water_duration:15,water_duration_unit:'分钟',crop_stage:'缓苗期'});
  await ins('farming_operations',{id:u(),operation_type:'施肥',plot_id:sPlot,plot_name:'C01',variety_id:sVid,variety_name:'草莓',batch_id:sBid,area:1,operator_name:'张农艺',operation_date:ago(18),fertilizer_name:'有机肥',fertilizer_amount:5,fertilizer_unit:'kg',crop_stage:'生长期',weather:'晴',temperature:26});
  console.log('  -> 21 rows');

  // ═══════════════ 8. Inventory ═══════════════
  console.log('8/9 Inventory');
  const inv={};
  const items=[
    {name:'番茄',type:'农产品',spec:'大果',qty:520,unit:'kg',loc:'冷库A',grade:'一级',exp:f(ago(-25)),min:100,rmk:'采收后入库'},
    {name:'黄瓜',type:'农产品',spec:'标准',qty:680,unit:'kg',loc:'冷库A',grade:'一级',exp:f(ago(-18)),min:100,rmk:'采收后入库'},
    {name:'辣椒',type:'农产品',qty:0,unit:'kg',min:50,rmk:'待采收'},
    {name:'复合肥',type:'农资',spec:'50kg/袋',qty:35,unit:'袋',loc:'农资仓库A',exp:f(ago(-365)),min:10,rmk:'N-P-K=15-15-15'},
    {name:'有机肥',type:'农资',spec:'40kg/袋',qty:25,unit:'袋',loc:'农资仓库A',exp:f(ago(-180)),min:10,rmk:'腐熟鸡粪'},
    {name:'吡虫啉',type:'农资',spec:'500ml/瓶',qty:16.5,unit:'瓶',loc:'农资仓库B',exp:f(ago(-300)),min:5,rmk:'10%粉剂'},
    {name:'滴灌带',type:'农资',spec:'100m/卷',qty:8,unit:'卷',loc:'农资仓库A',exp:f(ago(-730)),min:3,rmk:'16mm'},
  ];
  for(const it of items){
    inv[it.name]=u();
    await ins('inventory',{id:inv[it.name],type:it.type,name:it.name,spec:it.spec||null,quantity:it.qty,unit:it.unit,location:it.loc||null,quality_grade:it.grade||null,quality_passed:it.grade?true:null,expiry_date:it.exp||null,min_stock:it.min||50,remark:it.rmk||null});
  }
  console.log('  -> 7 rows');

  // ═══════════════ 9. Stock Transactions ═══════════════
  console.log('9/9 Transactions');
  const txns=[
    ['入库','农产品入库',inv['番茄'],'番茄',520,'kg','赵仓','赵仓','A01采收',pid('A01'),batch.find(r=>r.variety_name==='番茄')?.batch_number,ago(5),'品质一级'],
    ['入库','农产品入库',inv['黄瓜'],'黄瓜',680,'kg','赵仓','赵仓','A02采收',pid('A02'),batch.find(r=>r.variety_name==='黄瓜')?.batch_number,ago(3),'品质一级'],
    ['入库','农资采购入库',inv['复合肥'],'复合肥',50,'袋','赵仓','赵仓','农资公司',null,null,ago(85),'采购入库'],
    ['出库','农资领用出库',inv['复合肥'],'复合肥',5,'袋','李克','李克','A01施肥',pid('A01'),null,ago(79),'番茄用肥'],
    ['出库','农资领用出库',inv['复合肥'],'复合肥',10,'袋','王强','王强','B01施肥',pid('B01'),null,ago(48),'辣椒用肥'],
    ['入库','农资采购入库',inv['有机肥'],'有机肥',30,'袋','赵仓','赵仓','绿源有机',null,null,ago(80),'采购入库'],
    ['出库','农资领用出库',inv['有机肥'],'有机肥',5,'袋','王强','王强','B02施肥',pid('B02'),null,ago(39),'西瓜用肥'],
    ['入库','农资采购入库',inv['吡虫啉'],'吡虫啉',20,'瓶','赵仓','赵仓','农药公司',null,null,ago(65),'采购入库'],
    ['出库','农资领用出库',inv['吡虫啉'],'吡虫啉',0.5,'瓶','李克','李克','A01打药',pid('A01'),null,ago(59),'番茄防虫'],
    ['出库','农资领用出库',inv['吡虫啉'],'吡虫啉',1,'瓶','李克','李克','B01打药',pid('B01'),null,ago(28),'辣椒防虫'],
    ['入库','农资采购入库',inv['滴灌带'],'滴灌带',10,'卷','赵仓','赵仓','灌溉设备公司',null,null,ago(70),'采购入库'],
    ['出库','销售出库',inv['番茄'],'番茄',200,'kg','赵仓','赵仓','绿色农产品批发市场',pid('A01'),batch.find(r=>r.variety_name==='番茄')?.batch_number,ago(3),'首批销售'],
    ['出库','销售出库',inv['黄瓜'],'黄瓜',150,'kg','赵仓','赵仓','永辉超市',pid('A02'),batch.find(r=>r.variety_name==='黄瓜')?.batch_number,ago(1),'首批销售'],
  ];
  for(const row of txns){
    await ins('stock_transactions',{type:row[0],sub_type:row[1],inventory_id:row[2],item_name:row[3],quantity:row[4],unit:row[5],operator:row[6],approver:row[7],source_or_dest:row[8],plot_id:row[9],batch_number:row[10],transaction_date:row[11],remark:row[12]});
  }
  console.log('  -> 13 rows');

  // ═══════════════ 10. Stocktakes ═══════════════
  console.log('10/9 Stocktakes');
  const stks=[
    [inv['番茄'],'番茄',520,518,'kg',-2,0.0038,'正常','误差0.38%'],
    [inv['黄瓜'],'黄瓜',680,675,'kg',-5,0.0074,'正常','误差0.74%'],
    [inv['复合肥'],'复合肥',35,34.5,'袋',-0.5,0.0143,'正常','半袋已开封使用'],
    [inv['吡虫啉'],'吡虫啉',16.5,16.5,'瓶',0,0,'正常','完全匹配'],
  ];
  for(const s of stks){
    await ins('stocktakes',{type:'月度盘点',executor:'赵仓',inventory_id:s[0],item_name:s[1],system_quantity:s[2],actual_quantity:s[3],unit:s[4],discrepancy:s[5],discrepancy_rate:s[6],result:s[7],remark:s[8]});
  }
  console.log('  -> 4 rows');

  // ═══════════════ 11. Traceability ═══════════════
  console.log('11/9 Traceability');
  const tOps=JSON.stringify([
    {date:f(ago(89)),type:'播种',operator:'李克',area:2},
    {date:f(ago(84)),type:'灌溉',operator:'李克',remark:'苗期30分钟'},
    {date:f(ago(79)),type:'施肥',operator:'李克',fertilizer:'复合肥15kg'},
    {date:f(ago(74)),type:'除草',operator:'王强'},
    {date:f(ago(59)),type:'打药',operator:'李克',pesticide:'吡虫啉0.5升'},
    {date:f(ago(5)),type:'采收',operator:'李克',yield:'520kg',quality:'一级'},
  ]);
  await ins('traceability_records',{id:u(),trace_code:'TRC-A01-TOMATO-001',batch_id:tBid,batch_number:'P20260301-A01-番茄',plot_name:'A01',variety_name:'番茄',sow_date:f(ago(89)),harvest_date:f(ago(5)),area:2,operations_data:tOps,exported_at:ago(2)});
  console.log('  -> 1 row');

  // ═══════════════ 12. Costs ═══════════════
  console.log('12/9 Costs');
  const costs=[
    [pid('A01'),tBid,'种子','番茄种子',200,ago(89)],[pid('A01'),tBid,'肥料','复合肥15kg',180,ago(79)],
    [pid('A01'),tBid,'农药','吡虫啉0.5瓶',75,ago(59)],[pid('A01'),tBid,'人工','播种+施肥+采收3人日',1200,ago(5)],
    [pid('A01'),tBid,'机械','拖拉机翻耕',200,ago(90)],[pid('A02'),cBid,'种子','黄瓜种子',150,ago(75)],
    [pid('A02'),cBid,'肥料','有机肥20kg',160,ago(65)],[pid('A02'),cBid,'人工','播种+采收2.5人日',1000,ago(3)],
    [pid('B01'),pBid,'种子','辣椒种子',300,ago(58)],[pid('B01'),pBid,'肥料','复合肥30kg',360,ago(48)],
    [pid('B01'),pBid,'农药','吡虫啉1瓶',150,ago(28)],[pid('B01'),pBid,'人工','施肥+打药2人日',900,ago(58)],
    [pid('B02'),wBid,'种子','西瓜种子',250,ago(49)],[pid('B02'),wBid,'肥料','有机肥25kg',200,ago(39)],
    [pid('B02'),wBid,'人工','播种+灌溉1.5人日',600,ago(49)],[pid('C01'),sBid,'种子','草莓苗',500,ago(28)],
  ];
  for(const c of costs) await ins('cost_records',{id:u(),plot_id:c[0],batch_id:c[1],type:c[2],description:c[3],amount:c[4],date:c[5]});
  console.log('  -> 16 rows');

  // ═══════════════ 13. Sales ═══════════════
  console.log('13/9 Sales');
  await ins('sales_records',{id:u(),customer:'绿色农产品批发市场',product:'番茄',variety_name:'番茄',quantity:200,unit:'kg',unit_price:8.5,total_amount:1700,batch_id:tBid,batch_number:'P20260301-A01-番茄',payment_status:'已付款',sale_date:ago(3),salesperson:'赵仓',remark:'首批番茄'});
  await ins('sales_records',{id:u(),customer:'永辉超市',product:'黄瓜',variety_name:'黄瓜',quantity:150,unit:'kg',unit_price:6,total_amount:900,batch_id:cBid,batch_number:'P20260315-A02-黄瓜',payment_status:'已付款',sale_date:ago(1),salesperson:'赵仓',remark:'首批黄瓜'});
  await ins('sales_records',{id:u(),customer:'社区团购',product:'番茄',variety_name:'番茄',quantity:50,unit:'kg',unit_price:10,total_amount:500,batch_id:tBid,batch_number:'P20260301-A01-番茄',payment_status:'未付款',sale_date:ago(1),salesperson:'赵仓',remark:'社区直供'});
  console.log('  -> 3 rows');

  // ═══════════════ 14. IoT Sensor Data ═══════════════
  console.log('14/9 IoT Sensors...');
  const stypes=[{s:'温度',u:'℃',lo:15,hi:35},{s:'湿度',u:'%',lo:40,hi:95},{s:'土壤湿度',u:'%',lo:20,hi:80},{s:'光照',u:'lux',lo:2000,hi:80000},{s:'pH值',u:'pH',lo:5.5,hi:7.5},{s:'CO2浓度',u:'ppm',lo:350,hi:800}];
  const SE=eid('SENS-ALL');
  for(const[pnum,pid2] of [['A01',pid('A01')],['B01',pid('B01')],['C01',pid('C01')]]){
    for(const st of stypes){
      for(let h=0;h<24;h+=2){
        const t=new Date();t.setHours(h,0,0,0);
        const v=+(st.lo+Math.random()*(st.hi-st.lo)+(h>6&&h<18?5:-3)).toFixed(1);
        await ins('sensor_data',{id:u(),plot_id:pid2,device_id:'DEV-'+pnum,sensor_type:st.s,unit:st.u,value:v,recorded_at:t,equipment_id:SE});
      }
    }
  }
  console.log('  -> 216 rows');

  // ═══════════════ 15. Notifications ═══════════════
  console.log('15/9 Notifications');
  const staffs=(await db.query("SELECT id,name FROM staff")).rows;
  const sid=n=>staffs.find(r=>r.name===n)?.id;
  const notifs=[
    ['番茄批次已采收完成(520kg)，可安排销售','info','/inventory'],
    ['黄瓜批次已采收完成(680kg)，可安排销售','info','/inventory'],
    ['设备 IRRIG-B01 即将需要维护(2天内)','warning','/equipment'],
    ['复合肥库存偏低: 当前35袋，最低警戒10袋','warning','/inventory'],
    ['辣椒批次已播种58天，注意防虫害','info','/farming-operations'],
    ['收到入库通知: 番茄520kg已入库','info','/inventory'],
  ];
  const admins=[sid('系统管理员'),sid('系统管理员'),sid('张农艺'),sid('系统管理员'),sid('张农艺'),sid('赵仓')];
  for(let i=0;i<notifs.length;i++){
    const n = notifs[i];
    await ins('notifications',{id:u(),user_id:admins[i],message:n[0],is_read:false,type:n[1],link:n[2]});
  }
  console.log('  -> 6 rows');

  await db.end();
  console.log('\n✅ All 9 tables seeded!');
}
main().catch(e=>{console.error(e);process.exit(1);});
