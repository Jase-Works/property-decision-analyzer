/**
 * 分析板橋區路段資料
 */
import fs from 'fs';

const district = '板橋區';

// Extract street function
function extractStreet(address) {
  if (!address || !address.includes(district)) return null;
  const after = address.replace(/.*板橋區/, '');
  const match = after.match(/^([^\d巷弄號]+(?:路|街|大道)(?:[一二三四五六七八九十]+段)?)/);
  return match ? match[1] : null;
}

// Read data
const data = JSON.parse(fs.readFileSync('banqiao-raw-1.json', 'utf8'));
console.log(`讀取 ${data.sales.length} 筆交易資料\n`);

// Group by street
const streetStats = {};
for (const sale of data.sales) {
  const street = extractStreet(sale.land_location_building_address);
  const price = sale.unit_price_ntd_per_square_meter;
  if (!street) continue;
  if (!streetStats[street]) streetStats[street] = { count: 0, prices: [] };
  streetStats[street].count++;
  if (price && price > 50000) streetStats[street].prices.push(price);
}

// Sort and print
const sorted = Object.entries(streetStats)
  .sort((a, b) => b[1].count - a[1].count);

console.log('路段\t\t\t交易量\t有價格\t均價(萬/坪)');
console.log('─'.repeat(50));
for (const [name, stats] of sorted.slice(0, 25)) {
  const avg = stats.prices.length > 0
    ? (stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length * 3.3058 / 10000).toFixed(1)
    : 'N/A';
  console.log(`${name.padEnd(14)}\t${stats.count}\t${stats.prices.length}\t${avg}`);
}

// Generate cache format
console.log('\n\n=== 快取格式輸出 ===\n');
const cacheFormat = {};
for (const [street, stats] of sorted) {
  if (stats.prices.length < 2) continue; // 需至少 2 筆才有統計意義
  const prices = stats.prices.sort((a, b) => a - b);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const medianPrice = prices[Math.floor(prices.length / 2)];
  
  cacheFormat[street] = {
    avgPrice: Math.round(avgPrice * 3.3058 / 10000 * 10) / 10,
    medianPrice: Math.round(medianPrice * 3.3058 / 10000 * 10) / 10,
    minPrice: Math.round(Math.min(...prices) * 3.3058 / 10000 * 10) / 10,
    maxPrice: Math.round(Math.max(...prices) * 3.3058 / 10000 * 10) / 10,
    count: stats.prices.length
  };
}

console.log(JSON.stringify(cacheFormat, null, 2));
console.log(`\n共 ${Object.keys(cacheFormat).length} 個路段有足夠資料`);
