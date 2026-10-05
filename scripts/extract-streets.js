/**
 * 提取路段級別的房價統計
 * 用法: node extract-streets.js <input.json> [output.json]
 */

import fs from 'fs';
import { fileURLToPath } from 'url';

// 路段名提取函數
function extractStreet(address, district) {
  if (!address || !address.includes(district)) return null;
  
  // 移除縣市區前綴
  const prefixPattern = new RegExp(`.*${district}`);
  const afterDistrict = address.replace(prefixPattern, '');
  
  // 匹配路段名（支援「路N段」「街」「大道N段」格式）
  const match = afterDistrict.match(/^([^\d巷弄號]+(?:路|街|大道)(?:[一二三四五六七八九十]+段)?)/);
  if (match) {
    return match[1];
  }
  return null;
}

// 主函數
function processData(inputFile, district = '板橋區') {
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  
  // 彙總統計
  const streetStats = {};
  
  for (const sale of data.sales) {
    const street = extractStreet(sale.land_location_building_address, district);
    const price = sale.unit_price_ntd_per_square_meter;
    
    if (!street || !price || price < 50000) continue;  // 過濾異常值
    
    if (!streetStats[street]) {
      streetStats[street] = { totalPrice: 0, count: 0, prices: [] };
    }
    
    streetStats[street].totalPrice += price;
    streetStats[street].count++;
    streetStats[street].prices.push(price);
  }
  
  // 計算並輸出
  const results = [];
  for (const [street, stats] of Object.entries(streetStats)) {
    const avgPricePerM2 = stats.totalPrice / stats.count;
    const avgPricePerPing = avgPricePerM2 * 3.3058 / 10000;  // 轉換為萬/坪
    
    stats.prices.sort((a, b) => a - b);
    const medianIdx = Math.floor(stats.prices.length / 2);
    const medianPricePerM2 = stats.prices[medianIdx];
    const medianPricePerPing = medianPricePerM2 * 3.3058 / 10000;
    
    results.push({
      street,
      count: stats.count,
      avgPrice: Math.round(avgPricePerPing * 10) / 10,
      medianPrice: Math.round(medianPricePerPing * 10) / 10,
      minPrice: Math.round(Math.min(...stats.prices) * 3.3058 / 10000 * 10) / 10,
      maxPrice: Math.round(Math.max(...stats.prices) * 3.3058 / 10000 * 10) / 10,
    });
  }
  
  // 按成交量排序
  results.sort((a, b) => b.count - a.count);
  
  return results;
}

// 執行
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];
  
  if (!inputFile) {
    console.error('Usage: node extract-streets.js <input.json> [output.json]');
    process.exit(1);
  }
  
  const results = processData(inputFile);
  
  console.log('路段行情統計（按成交量排序）：\n');
  console.log('路段名\t\t成交量\t均價\t中位數\t範圍');
  console.log('─'.repeat(50));
  for (const r of results.slice(0, 20)) {
    const name = r.street.padEnd(10, '　');
    console.log(`${name}\t${r.count}\t${r.avgPrice}\t${r.medianPrice}\t${r.minPrice}-${r.maxPrice} 萬/坪`);
  }
  
  if (outputFile) {
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(`\n結果已存入: ${outputFile}`);
  }
}

export { extractStreet, processData };
