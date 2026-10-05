/**
 * 合併多批次資料並分析路段統計
 */
import fs from 'fs';
import path from 'path';

const district = '板橋區';

// 提取路段名
function extractStreet(address) {
  if (!address || !address.includes(district)) return null;
  const after = address.replace(/.*板橋區/, '');
  // 支援「路N段」「街」「大道N段」格式
  const match = after.match(/^([^\d巷弄號]+(?:路|街|大道)(?:[一二三四五六七八九十]+段)?)/);
  return match ? match[1] : null;
}

// 讀取並合併所有批次
const allSales = [];
for (let i = 1; i <= 10; i++) {
  const filename = `banqiao-raw-${i}.json`;
  if (!fs.existsSync(filename)) break;
  
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  allSales.push(...data.sales);
  console.log(`讀取 ${filename}: ${data.sales.length} 筆`);
}

console.log(`\n總計: ${allSales.length} 筆交易\n`);

// 按路段分組
const streetStats = {};
for (const sale of allSales) {
  const street = extractStreet(sale.land_location_building_address);
  const price = sale.unit_price_ntd_per_square_meter;
  
  if (!street) continue;
  
  if (!streetStats[street]) {
    streetStats[street] = { count: 0, prices: [], buildingTypes: {} };
  }
  
  streetStats[street].count++;
  
  if (price && price > 50000) {
    streetStats[street].prices.push(price);
  }
  
  // 記錄建物類型
  const btype = sale.building_type || '未知';
  streetStats[street].buildingTypes[btype] = (streetStats[street].buildingTypes[btype] || 0) + 1;
}

// 計算統計並排序
const results = [];
for (const [street, stats] of Object.entries(streetStats)) {
  if (stats.prices.length < 3) continue; // 至少 3 筆才有統計意義
  
  const prices = stats.prices.sort((a, b) => a - b);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const medianIdx = Math.floor(prices.length / 2);
  const medianPrice = prices[medianIdx];
  
  // 找出最常見的建物類型
  const topType = Object.entries(stats.buildingTypes)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  results.push({
    street,
    avgPrice: Math.round(avgPrice * 3.3058 / 10000 * 10) / 10,
    medianPrice: Math.round(medianPrice * 3.3058 / 10000 * 10) / 10,
    minPrice: Math.round(Math.min(...prices) * 3.3058 / 10000 * 10) / 10,
    maxPrice: Math.round(Math.max(...prices) * 3.3058 / 10000 * 10) / 10,
    count: stats.prices.length,
    dominantType: topType
  });
}

// 按成交量排序
results.sort((a, b) => b.count - a.count);

// 輸出統計表
console.log('板橋區路段行情統計（按成交量排序）\n');
console.log('路段'.padEnd(14) + '\t成交\t均價\t中位數\t範圍\t\t\t主要類型');
console.log('─'.repeat(80));

for (const r of results.slice(0, 30)) {
  const range = `${r.minPrice}-${r.maxPrice}`;
  console.log(
    r.street.padEnd(12) + '\t' +
    r.count + '\t' +
    r.avgPrice + '\t' +
    r.medianPrice + '\t' +
    range.padEnd(15) + '\t' +
    r.dominantType.substring(0, 12)
  );
}

// 生成快取格式
const cacheFormat = {};
for (const r of results) {
  cacheFormat[r.street] = {
    avgPrice: r.avgPrice,
    medianPrice: r.medianPrice,
    minPrice: r.minPrice,
    maxPrice: r.maxPrice,
    count: r.count
  };
}

// 儲存為快取格式
const outputFile = 'banqiao-streets-cache.json';
fs.writeFileSync(outputFile, JSON.stringify(cacheFormat, null, 2));
console.log(`\n\n路段快取已儲存至: ${outputFile}`);
console.log(`共 ${Object.keys(cacheFormat).length} 個路段`);
