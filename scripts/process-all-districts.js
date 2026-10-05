/**
 * 處理所有行政區的原始資料，提取路段統計並更新快取
 * Phase 1: 11個行政區 (台北市6 + 新北市5)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawDataDir = path.join(__dirname, 'raw-data');
const srcDir = path.join(__dirname, '..', 'src', 'data');
const mainCachePath = path.join(srcDir, 'market-data-cache.json');

// 行政區配置
const DISTRICTS = {
  '台北市': ['大安區', '信義區', '中山區', '松山區', '內湖區', '士林區'],
  '新北市': ['中和區', '永和區', '新店區', '三重區', '蘆洲區']
};

// 提取路段名
function extractStreet(address, district) {
  if (!address) return null;
  
  // 找到行政區後面的部分
  const districtIndex = address.indexOf(district);
  if (districtIndex === -1) return null;
  
  const after = address.substring(districtIndex + district.length);
  // 支援「路N段」「街」「大道N段」格式
  const match = after.match(/^([^\d巷弄號]+(?:路|街|大道)(?:[一二三四五六七八九十]+段)?)/);
  return match ? match[1] : null;
}

// 處理單個行政區
function processDistrict(city, district) {
  console.log(`\n處理 ${city} ${district}...`);
  
  const allSales = [];
  
  // 讀取4個批次
  for (let i = 1; i <= 4; i++) {
    const filename = path.join(rawDataDir, `${district}-${i}.json`);
    if (!fs.existsSync(filename)) {
      console.log(`  警告: ${filename} 不存在`);
      continue;
    }
    
    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (data.sales) {
      allSales.push(...data.sales);
      console.log(`  讀取 ${district}-${i}.json: ${data.sales.length} 筆`);
    }
  }
  
  console.log(`  總計: ${allSales.length} 筆交易`);
  
  // 按路段分組
  const streetStats = {};
  for (const sale of allSales) {
    const street = extractStreet(sale.land_location_building_address, district);
    const price = sale.unit_price_ntd_per_square_meter;
    
    if (!street) continue;
    
    // 過濾異常價格（太低可能是停車位或其他非住宅）
    if (!price || price < 50000) continue;
    
    if (!streetStats[street]) {
      streetStats[street] = { prices: [] };
    }
    
    streetStats[street].prices.push(price);
  }
  
  // 計算統計，只保留 >= 3 筆交易的路段
  const results = {};
  let totalStreets = 0;
  let qualifiedStreets = 0;
  
  for (const [street, stats] of Object.entries(streetStats)) {
    totalStreets++;
    if (stats.prices.length < 3) continue;
    qualifiedStreets++;
    
    const prices = stats.prices.sort((a, b) => a - b);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const medianIdx = Math.floor(prices.length / 2);
    const medianPrice = prices.length % 2 === 0
      ? (prices[medianIdx - 1] + prices[medianIdx]) / 2
      : prices[medianIdx];
    
    // 轉換為萬/坪
    const toWanPerPing = (p) => Math.round(p * 3.3058 / 10000 * 10) / 10;
    
    results[street] = {
      avgPrice: toWanPerPing(avgPrice),
      medianPrice: toWanPerPing(medianPrice),
      minPrice: toWanPerPing(Math.min(...prices)),
      maxPrice: toWanPerPing(Math.max(...prices)),
      count: prices.length
    };
  }
  
  console.log(`  發現路段: ${totalStreets} 個，符合條件 (>=3筆): ${qualifiedStreets} 個`);
  
  return results;
}

// 主流程
console.log('========================================');
console.log('Phase 1: 處理11個行政區路段資料');
console.log('========================================');

// 讀取現有快取
const mainCache = JSON.parse(fs.readFileSync(mainCachePath, 'utf8'));

// 統計
const summary = { cities: {} };

// 處理每個行政區
for (const [city, districts] of Object.entries(DISTRICTS)) {
  summary.cities[city] = { districts: {}, totalStreets: 0 };
  
  for (const district of districts) {
    const streets = processDistrict(city, district);
    const streetCount = Object.keys(streets).length;
    
    // 更新快取
    if (!mainCache.cities[city]) {
      mainCache.cities[city] = { districts: {} };
    }
    if (!mainCache.cities[city].districts[district]) {
      mainCache.cities[city].districts[district] = {};
    }
    
    mainCache.cities[city].districts[district].streets = streets;
    
    // 記錄統計
    summary.cities[city].districts[district] = streetCount;
    summary.cities[city].totalStreets += streetCount;
  }
}

// 更新元資料
mainCache.generatedAt = new Date().toISOString();
mainCache.version = '2.1.0';
mainCache.features = mainCache.features || [];
if (!mainCache.features.includes('street-level-pricing')) {
  mainCache.features.push('street-level-pricing');
}

// 儲存快取
fs.writeFileSync(mainCachePath, JSON.stringify(mainCache, null, 2));

// 輸出摘要
console.log('\n========================================');
console.log('處理完成摘要');
console.log('========================================');

let grandTotal = 0;
for (const [city, data] of Object.entries(summary.cities)) {
  console.log(`\n${city}:`);
  for (const [district, count] of Object.entries(data.districts)) {
    console.log(`  ${district}: ${count} 個路段`);
  }
  console.log(`  小計: ${data.totalStreets} 個路段`);
  grandTotal += data.totalStreets;
}

console.log(`\n總計: ${grandTotal} 個路段`);
console.log(`\n快取已更新: ${mainCachePath}`);
console.log(`版本: ${mainCache.version}`);
console.log(`功能: ${mainCache.features.join(', ')}`);
