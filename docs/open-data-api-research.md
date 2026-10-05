# 台灣政府開放資料 API 研究報告

**調查日期**: 2026-10-06  
**用途**: property-decision-analyzer 房價走勢與租金預測功能  
**目標資料**: 通膨率 (CPI)、生育率、薪資數據、租金行情

---

## 摘要

| 資料類型 | 主管機關 | 瀏覽器端可直接呼叫 | 建議方案 |
|---------|---------|-------------------|---------|
| 通膨率 (CPI) | 主計總處 | ❌ 無公開 JSON API | 使用靜態 CSV/JSON 或第三方 |
| 生育率 | 內政部戶政司 | ❌ 無公開 JSON API | 使用靜態資料 |
| 薪資數據 | 主計總處 | ❌ 無公開 JSON API | 使用靜態 CSV/JSON |
| 租金行情 | 內政部實價登錄 | ❌ 需 proxy 或 MCP | 使用 MCP / 批次下載 |

**結論**: 台灣政府開放資料多以 CSV/Excel 下載為主，**沒有可直接在瀏覽器端呼叫的公開 REST API**（無 CORS 支援）。建議方案為：

1. **靜態資料嵌入**: 將歷史資料以 JSON 格式嵌入前端
2. **定期更新**: 透過 build script 定期抓取最新 CSV 轉換
3. **MCP 整合**: 部分資料可透過已有的 funraise MCP 取得

---

## 1. 通膨率 (CPI) — 主計總處

### 資料來源

- **主管機關**: 行政院主計總處 (DGBAS)
- **官方網站**: https://www.dgbas.gov.tw/
- **統計資料庫**: https://www.stat.gov.tw/

### 資料取得方式

| 方式 | URL 模式 | 格式 | API Key |
|-----|---------|------|---------|
| 統計資料查詢 | https://www.stat.gov.tw/ (互動式查詢) | Excel/CSV | 不需要 |
| 物價統計月報 PDF | https://ws.dgbas.gov.tw/public/data/dgbas03/bs3/book/... | PDF | 不需要 |
| 政府資料開放平臺 | https://data.gov.tw/ (搜尋「消費者物價指數」) | CSV | 不需要 |

### CORS 狀態

❌ **無法在瀏覽器端直接呼叫**

- 主計總處網站沒有提供公開的 REST API
- 資料以互動式查詢頁面 + 下載檔案為主
- 無 CORS headers 支援

### 建議方案

```javascript
// 方案 A: 靜態嵌入近 10 年 CPI 資料
const CPI_DATA = [
  { year: 2015, cpi: 98.2, inflationRate: 0.3 },
  { year: 2016, cpi: 99.6, inflationRate: 1.4 },
  // ... 每季度/年度更新一次
];

// 方案 B: 使用第三方 API (如 Trading Economics)
// https://tradingeconomics.com/taiwan/consumer-price-index-cpi
// 需要付費 API Key
```

### 更新頻率

- CPI 每月公布
- 建議 app 每月更新一次靜態資料

---

## 2. 生育率 — 內政部戶政司

### 資料來源

- **主管機關**: 內政部戶政司
- **官方網站**: https://www.ris.gov.tw/
- **統計專區**: https://www.ris.gov.tw/app/portal/346

### 資料取得方式

| 方式 | URL | 格式 | API Key |
|-----|-----|------|---------|
| 人口統計年報 | https://www.ris.gov.tw/app/portal/346 | Excel/PDF | 不需要 |
| 政府資料開放平臺 | https://data.gov.tw/ (搜尋「出生」「人口」) | CSV | 不需要 |

### CORS 狀態

❌ **無法在瀏覽器端直接呼叫**

- 內政部戶政司網站提供 PDF/Excel 下載，無 REST API
- 人口統計資料每年公布

### 建議方案

```javascript
// 靜態嵌入歷年生育率資料
const FERTILITY_DATA = [
  { year: 2015, totalFertilityRate: 1.18, births: 213598 },
  { year: 2016, totalFertilityRate: 1.17, births: 208440 },
  // ... 每年更新一次
];
```

### 更新頻率

- 年度統計，每年公布
- 建議 app 每年更新一次

---

## 3. 薪資數據 — 主計總處

### 資料來源

- **主管機關**: 行政院主計總處
- **相關統計**: 
  - 薪資與生產力統計
  - 受僱員工動向調查
  - 國民所得統計

### 可取得的薪資指標

| 指標 | 資料來源 | 更新頻率 |
|-----|---------|---------|
| 基本工資/最低薪資 | 勞動部公告 | 每年 (1/1 生效) |
| 平均薪資 | 主計總處「薪資與生產力統計」 | 每月 |
| 薪資中位數 | 主計總處「受僱員工薪資調查」 | 每年 |

### 資料取得方式

| 方式 | URL | 格式 | API Key |
|-----|-----|------|---------|
| 中華民國統計資訊網 | https://www.stat.gov.tw/ | Excel/CSV | 不需要 |
| 國民所得統計 | https://ws.dgbas.gov.tw/ (各式 PDF) | PDF | 不需要 |
| 政府資料開放平臺 | https://data.gov.tw/ | CSV | 不需要 |

### CORS 狀態

❌ **無法在瀏覽器端直接呼叫**

### 建議方案

```javascript
// 基本工資歷年變化 (每年更新)
const MIN_WAGE_DATA = [
  { year: 2024, monthly: 27470, hourly: 183 },
  { year: 2025, monthly: 28590, hourly: 190 },
  { year: 2026, monthly: 29500, hourly: 197 }, // 預估
];

// 平均薪資與中位數 (每年更新)
const SALARY_DATA = [
  { year: 2024, averageMonthly: 57718, medianMonthly: 44300 },
  { year: 2025, averageMonthly: 59200, medianMonthly: 45500 }, // 預估
];
```

---

## 4. 租金行情 — 內政部實價登錄

### 資料來源

- **主管機關**: 內政部地政司
- **實價登錄查詢**: https://lvr.land.moi.gov.tw/
- **不動產資訊平台**: https://pip.moi.gov.tw/ (經常無法存取)

### 資料取得方式

| 方式 | 說明 | 格式 | API Key |
|-----|-----|------|---------|
| 實價登錄網站互動查詢 | lvr.land.moi.gov.tw | 網頁 | 不需要 |
| 季度批次下載 | plvr.land.moi.gov.tw | CSV | 不需要 |
| 內政資料開放平臺 | data.moi.gov.tw | CSV | 不需要 |
| **funraise MCP** | 已整合的 MCP 服務 | JSON | 已設定 |

### CORS 狀態

❌ **官方網站無法在瀏覽器端直接呼叫**

- 實價登錄網站需要透過瀏覽器自動化 (Playwright) 爬取
- 批次下載為 CSV 檔案

### 現有解決方案

#### 方案 A: funraise MCP (已整合) ✅ 推薦

Jase 的 Kiro 環境已安裝 funraise MCP，可直接查詢：

```
funraise::actual-price-rental__search_actual_rentals  // 租賃行情
funraise::actual-price-sale__search_actual_sales      // 買賣行情
funraise::actual-price-presale__search_presales       // 預售屋
```

**優點**: 即時資料、已設定、結構化 JSON  
**限制**: 需要透過 MCP protocol 呼叫，無法直接在純前端使用

#### 方案 B: mcp-tw-lvr (PyPI)

```bash
# 安裝
uv tool install mcp-tw-lvr

# 查詢範例
query_real_price_tool(
  city = "台北市",
  town = "信義區",
  query_type = "rent",  # 租賃
  start_year = 114,
  end_year = 115
)
```

**優點**: 免費、即時  
**限制**: 每次查詢約 15-20 秒 (Playwright 爬取)

#### 方案 C: baodao-skill (AI Agent 技能)

```bash
npx --yes skills add tahodev/baodao-skill --skill taiwan-real-estate -g
```

使用內政部實價登錄季度批次下載，提供全台買賣/預售屋/租賃成交資料。

**優點**: 免金鑰、穩定  
**限制**: 批次資料，非即時 (每季更新)

### 建議方案

對於純前端 React App：

```javascript
// 方案 1: 前端用靜態聚合資料 (推薦)
const RENT_INDEX_DATA = {
  taipei: {
    xinyi: { medianRent: 1200, avgRent: 1350, yearOverYear: 3.2 },
    daan: { medianRent: 1400, avgRent: 1550, yearOverYear: 2.8 },
    // ...
  },
  newTaipei: {
    banqiao: { medianRent: 850, avgRent: 920, yearOverYear: 4.1 },
    // ...
  }
};

// 方案 2: 搭配後端 proxy (若日後有 backend)
// 後端定期透過 MCP 或爬蟲更新資料，前端呼叫後端 API
```

---

## 5. 政府資料開放平臺 (data.gov.tw) 總覽

### API 規格

政府資料開放平臺本身提供資料集搜尋，但：

- 各資料集的 API 格式不統一
- 多數資料集僅提供 CSV/Excel 下載連結
- 少數提供 JSON API 的資料集，CORS 政策不一

### 參考資源

| 資源 | URL | 說明 |
|-----|-----|------|
| 政府資料開放平臺 | https://data.gov.tw/ | 4.9萬+ 資料集 |
| 共通性 API 規範 | law.moda.gov.tw | OpenAPI Spec 指引 |
| awesome-opendata-taiwan-gov | github.com/onlinemad/... | 開放資料懶人包 |
| baodao-skill | github.com/tahodev/... | AI Agent 技能組合 |

---

## 6. 實作建議

### 對於純前端 React App (無 backend)

```
┌─────────────────────────────────────────────────────────┐
│                    Build Time                            │
├─────────────────────────────────────────────────────────┤
│  1. 從政府 CSV 下載原始資料                               │
│  2. Node.js script 轉換為 JSON                           │
│  3. 嵌入 src/data/*.json                                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Runtime                               │
├─────────────────────────────────────────────────────────┤
│  前端直接 import JSON 資料                                │
│  定期 (每月/每季) rebuild 更新資料                         │
└─────────────────────────────────────────────────────────┘
```

### 靜態資料檔案結構

```
src/data/
├── economic/
│   ├── cpi.json              # 消費者物價指數 (月更新)
│   ├── salary.json           # 薪資數據 (年更新)
│   └── minWage.json          # 基本工資 (年更新)
├── demographic/
│   └── fertility.json        # 生育率 (年更新)
└── property/
    └── rentIndex.json        # 租金指數 (季更新，聚合資料)
```

### 更新腳本範例

```javascript
// scripts/update-economic-data.js
// 每月 CI/CD 執行，從政府 CSV 下載最新資料並轉換為 JSON

const fs = require('fs');
const Papa = require('papaparse');

// 從 data.gov.tw 下載 CPI CSV
// 轉換為 JSON
// 寫入 src/data/economic/cpi.json
```

---

## 7. 不確定性與待驗證項目

以下項目需要實際 runtime 測試才能確認：

| 項目 | 不確定性 | 驗證方式 |
|-----|---------|---------|
| data.gov.tw API CORS | 各資料集 CORS 政策不一 | 實際 fetch 測試 |
| funraise MCP 涵蓋範圍 | 是否包含完整租金資料 | 查詢測試 |
| 實價登錄批次下載穩定性 | URL 格式可能變動 | 定期監控 |

### 建議下一步

1. **Phase 4** 中實作靜態資料嵌入，優先使用已有的 funraise MCP 查詢租金
2. 建立 build script 定期更新經濟/人口統計資料
3. 若未來有 backend 需求，可考慮 serverless function 作為 proxy

---

## 參考來源

- [政府資料開放平臺](https://data.gov.tw/)
- [行政院主計總處](https://www.dgbas.gov.tw/)
- [內政部戶政司](https://www.ris.gov.tw/)
- [內政部實價登錄](https://lvr.land.moi.gov.tw/)
- [awesome-opendata-taiwan-gov](https://github.com/onlinemad/awesome-opendata-taiwan-gov)
- [baodao-skill](https://github.com/tahodev/baodao-skill)
- [mcp-tw-lvr](https://github.com/asgard-ai-platform/mcp-tw-lvr)

---

*本報告內容基於 2026-10-06 的調查結果。政府開放資料政策可能變動，建議定期檢視。*
