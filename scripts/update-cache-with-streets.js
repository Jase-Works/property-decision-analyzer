/**
 * 將路段資料合併到主快取
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src', 'data');

// 讀取主快取
const mainCachePath = path.join(srcDir, 'market-data-cache.json');
const mainCache = JSON.parse(fs.readFileSync(mainCachePath, 'utf8'));

// 讀取板橋區路段資料
const banqiaoStreetsPath = path.join(__dirname, 'banqiao-streets-cache.json');
const banqiaoStreets = JSON.parse(fs.readFileSync(banqiaoStreetsPath, 'utf8'));

// 更新快取結構：在板橋區加入 streets
if (mainCache.cities['新北市'] && mainCache.cities['新北市'].districts['板橋區']) {
  mainCache.cities['新北市'].districts['板橋區'].streets = banqiaoStreets;
  console.log('已將 21 個路段資料加入板橋區');
}

// 更新生成時間和版本
mainCache.generatedAt = new Date().toISOString();
mainCache.version = '2.0.0';
mainCache.features = mainCache.features || [];
if (!mainCache.features.includes('street-level-pricing')) {
  mainCache.features.push('street-level-pricing');
}

// 儲存
fs.writeFileSync(mainCachePath, JSON.stringify(mainCache, null, 2));
console.log('\n主快取已更新:', mainCachePath);
console.log('版本:', mainCache.version);
console.log('功能:', mainCache.features);
