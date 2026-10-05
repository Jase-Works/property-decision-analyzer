# 表單欄位簡化分析報告

**專案**: 房產持有決策分析器 (Property Decision Analyzer)  
**分析日期**: 2026-10-05  
**分析目的**: 識別必填欄位、選填欄位、可自動帶入欄位，簡化使用者輸入負擔

---

## 1. 執行摘要

經分析計算引擎 (`calculator.ts`) 與三個表單元件 (`PropertyForm.tsx`、`FinancialForm.tsx`、`ScenarioForm.tsx`)，發現：

- **目前表單欄位總數**: 22 個
- **真正必填（計算無法進行）**: 6 個
- **有合理預設值可用**: 9 個
- **可從公開資料自動帶入**: 4 個
- **進階選填（隱藏於展開區）**: 3 個

**建議最小必填欄位組**：
1. 縣市 (city)
2. 區域 (district)
3. 建坪 (area)
4. 購入總價 (purchasePrice)
5. 購入日期 (purchaseDate)
6. 貸款金額 (loanAmount)

其餘欄位可使用「智慧預設值」或「從公開資料自動帶入」，讓使用者僅需審閱/微調。

---

## 2. 欄位分類總表

### 2.1 房產基本資料 (PropertyForm)

| 欄位 | 目前標記 | 實際分類 | 預設來源 | 簡化建議 |
|------|----------|----------|----------|----------|
| `propertyType` 房產類型 | 必填 | **選填** | 預設「中古屋」(existing) | 移至進階區，預設中古屋 |
| `city` 縣市 | 必填 | **必填** | — | 維持必填 |
| `district` 區域 | 必填 | **必填** | — | 維持必填 |
| `address` 地址 | 選填 | **選填** | 使用者輸入 | 維持選填，可用於路段行情比對 |
| `area` 建坪 | 必填 | **必填** | — | 維持必填 |
| `purchasePrice` 購入總價 | 必填 | **必填** | — | 維持必填 |
| `purchaseDate` 購入日期 | 必填 | **必填** | — | 維持必填 |
| `expectedDeliveryDate` 預計交屋日 | 條件顯示 | **選填** | 預設購入日+2年 | 預售屋時自動帶入預設 |
| `buildingAge` 屋齡 | 條件顯示 | **選填** | 區域平均屋齡 or 0 | 非預售屋時預設 15 年 |

**分析依據**：
- `city`、`district`、`area`、`purchasePrice`：計算引擎在 `calculateSellNow()` 和 `calculateHoldAndRent()` 中直接使用，無法計算
- `purchaseDate`：用於計算持有年數 (`calculateHoldingYears()`) 和房地合一稅率，必要
- `propertyType`：僅用於 UI 條件顯示，不影響核心計算
- `buildingAge`：目前計算引擎完全未使用此欄位

---

### 2.2 財務資料 (FinancialForm)

| 欄位 | 目前標記 | 實際分類 | 預設來源 | 簡化建議 |
|------|----------|----------|----------|----------|
| `loanAmount` 貸款金額 | 無標記 | **必填** | — | 標記為必填（影響月供、剩餘本金計算） |
| `loanInterestRate` 貸款利率 | 無標記 | **可預填** | 央行公告基準利率+加碼 (~2.1%) | 預設 2.1%，來源：央行購屋貸款利率 |
| `loanTerm` 貸款年限 | 無標記 | **可預填** | 常見值 30 年 | 預設 30 年 |
| `monthlyManagementFee` 管理費 | 無標記 | **可預填** | 依坪數估算 (80~120元/坪) | 預設 `area × 100` 元 |
| `annualPropertyTax` 房屋稅 | 無標記 | **可預填** | 依總價估算 (~0.1%) | 預設 `purchasePrice × 0.001` 萬元 |
| `annualLandTax` 地價稅 | 無標記 | **可預填** | 依總價估算 (~0.05%) | 預設 `purchasePrice × 0.0005` 萬元 |
| `annualInsurance` 保險費 | 無標記 | **選填** | 估算值 ~3000元/年 | 預設 3000 元，移至進階區 |
| `expectedMonthlyRent` 預期月租金 | 無標記 | **可從市場資料帶入** | FUNRAISE MCP `avgRent` | 自動從市場資料帶入 |
| `vacancyRate` 空置率 | 無標記 | **可預填** | 市場統計常見值 5% | 預設 5%（已實作） |

**分析依據**：
- `loanAmount`：影響 `calculateMonthlyPayment()`、`calculateRemainingPrincipal()`，為計算核心
- `loanInterestRate`、`loanTerm`：有合理市場預設值
- 持有成本欄位：在 `calculateAnnualHoldingCosts()` 中使用，但皆可從公式估算
- `expectedMonthlyRent`：可直接使用市場資料中的 `averageRent`

---

### 2.3 情境假設 (ScenarioForm)

| 欄位 | 目前標記 | 實際分類 | 預設來源 | 簡化建議 |
|------|----------|----------|----------|----------|
| `holdingPeriodYears` 持有年數 | 無標記 | **有預設** | 常見投資週期 5 年 | 預設 5 年（已實作） |
| `priceGrowthRate` 房價年增率 | 無標記 | **可從公開資料帶入** | 主計總處/內政部房價指數 | 串接政府統計 API |
| `rentGrowthRate` 租金年增率 | 無標記 | **可從公開資料帶入** | 主計總處租金指數 | 串接政府統計 API |
| `inflationRate` 通膨率 | 無標記 | **可從公開資料帶入** | 主計總處 CPI | 串接政府統計 API |
| `alternativeInvestmentReturn` 替代投資報酬率 | 無標記 | **有預設** | 大盤長期報酬 ~5-7% | 預設 5%（已實作） |

**分析依據**：
- 情境假設欄位皆有合理預設值
- 部分可從政府公開資料 API 取得最新值

---

## 3. 公開資料來源建議

### 3.1 可串接的政府 Open Data / API

| 資料項目 | 來源 | API/網址 | 更新頻率 |
|----------|------|----------|----------|
| **通膨率 (CPI)** | 主計總處 | [政府資料開放平台](https://data.gov.tw/dataset/6065) | 月 |
| **房價指數** | 內政部不動產資訊平台 | [住宅價格指數](https://pip.moi.gov.tw/V3/E/SCRE0201.aspx) | 季 |
| **租金指數** | 主計總處物價統計 | [租金類指數](https://www.stat.gov.tw/ct.asp?xItem=37407&CtNode=3566) | 月 |
| **購屋貸款利率** | 中央銀行 | [五大銀行購屋貸款利率](https://www.cbc.gov.tw/tw/cp-522-150155-88E2D-1.html) | 月 |
| **基本工資/平均薪資** | 勞動部/主計總處 | [勞動統計查詢網](https://statdb.mol.gov.tw/) | 年/月 |
| **生育率** | 內政部戶政司 | [人口統計資料](https://www.ris.gov.tw/app/portal/346) | 年 |

### 3.2 已有資料來源 (FUNRAISE MCP Cache)

目前已快取的資料包含：
- 區域/路段均價 (`pricePerPing`)
- 區域平均租金 (`avgRent`, `rentPerPing`)
- 毛租金報酬率 (`grossYield`)
- 成交量 (`transactionCount`)

---

## 4. 簡化方案建議

### 4.1 必填欄位（最小集）

使用者**必須**手動輸入的欄位：

```
1. city         縣市
2. district     區域
3. area         建坪（坪）
4. purchasePrice 購入總價（萬元）
5. purchaseDate  購入日期
6. loanAmount    貸款金額（萬元）
```

### 4.2 智慧預設值欄位

系統自動帶入合理預設值，使用者可微調：

| 欄位 | 預設值 | 計算邏輯 |
|------|--------|----------|
| `propertyType` | `'existing'` | 中古屋最常見 |
| `loanInterestRate` | `2.1` | 央行基準利率參考 |
| `loanTerm` | `30` | 主流房貸年限 |
| `monthlyManagementFee` | `area × 100` | 每坪 100 元/月 |
| `annualPropertyTax` | `purchasePrice × 10` (元) | 約總價 0.1% |
| `annualLandTax` | `purchasePrice × 5` (元) | 約總價 0.05% |
| `annualInsurance` | `3000` | 住宅火險地震險 |
| `vacancyRate` | `5` | 市場統計常見值 |
| `holdingPeriodYears` | `5` | 常見投資週期 |
| `alternativeInvestmentReturn` | `5` | 大盤長期報酬 |

### 4.3 從市場資料自動帶入

選擇縣市/區域後，自動從 FUNRAISE MCP Cache 帶入：

| 欄位 | 來源 |
|------|------|
| `expectedMonthlyRent` | `marketData.averageRent` |
| `priceGrowthRate` | `marketData.priceYoYChange` |
| `rentGrowthRate` | `marketData.rentYoYChange` |

### 4.4 進階選項區（摺疊隱藏）

以下欄位建議移至「進階設定」區塊，預設收合：

- `buildingAge` 屋齡
- `annualInsurance` 保險費
- `expectedDeliveryDate` 預計交屋日（預售屋）
- `inflationRate` 通膨率（進階使用者調整）

---

## 5. UI 改造建議

### 5.1 新表單結構

```
┌─────────────────────────────────────────────┐
│ 📍 快速輸入（地址貼上即自動填縣市區域）        │
├─────────────────────────────────────────────┤
│ 房產基本資料（必填）                          │
│   ☐ 縣市*  ☐ 區域*  ☐ 建坪*                 │
│   ☐ 購入總價*  ☐ 購入日期*                   │
├─────────────────────────────────────────────┤
│ 貸款資訊                                     │
│   ☐ 貸款金額*                               │
│   ☐ 利率 [2.1%] ☐ 年限 [30年]  ← 已帶預設    │
├─────────────────────────────────────────────┤
│ 📊 市場資料（自動帶入）                       │
│   預期月租金: $25,000 (板橋區平均)            │
│   房價年增率: 2.5%                           │
│   租金年增率: 1.5%                           │
│   [可編輯/覆寫]                              │
├─────────────────────────────────────────────┤
│ ▶ 進階設定（點擊展開）                        │
│   └ 房產類型、屋齡、管理費、稅費、保險...     │
└─────────────────────────────────────────────┘
│ [開始分析] ←────────────────────────────────│
```

### 5.2 漸進式揭露 (Progressive Disclosure)

1. **第一層（必填）**：僅顯示 6 個必填欄位
2. **第二層（市場資料）**：選好縣市後自動帶入，使用者可微調
3. **第三層（進階設定）**：預設摺疊，點擊展開

---

## 6. 實作優先順序

| 優先級 | 項目 | 工作量 | 影響 |
|--------|------|--------|------|
| P0 | 實作智慧預設值（財務欄位） | 小 | 減少 8 個欄位輸入 |
| P1 | 市場資料自動帶入租金/漲幅 | 小 | 減少 3 個欄位輸入 |
| P2 | UI 重組：進階區摺疊 | 中 | 視覺簡化 |
| P3 | 串接政府 Open Data API（通膨、利率） | 大 | 數據準確度提升 |

---

## 7. 附錄：計算引擎欄位使用分析

### 7.1 `calculateSellNow()` 使用的欄位

```typescript
// 必用
property.purchasePrice       // 計算資本利得
property.area               // 計算預估售價
property.purchaseDate       // 計算持有年數、稅率

financial.loanAmount        // 剩餘本金
financial.loanInterestRate  // 剩餘本金
financial.loanTerm          // 剩餘本金

scenario.holdingPeriodYears // 再投資年限
scenario.alternativeInvestmentReturn // 再投資報酬

marketData.averagePrice     // 預估售價（如有）
```

### 7.2 `calculateHoldAndRent()` 使用的欄位

```typescript
// 上述全部，加上：
financial.expectedMonthlyRent   // 租金收入
financial.vacancyRate           // 有效租金
financial.monthlyManagementFee  // 持有成本
financial.annualPropertyTax     // 持有成本
financial.annualLandTax         // 持有成本
financial.annualInsurance       // 持有成本

scenario.priceGrowthRate        // 未來售價
scenario.rentGrowthRate         // 租金成長
```

### 7.3 計算引擎未使用的欄位

```typescript
property.propertyType          // 僅 UI 條件顯示
property.address               // 僅用於路段行情比對
property.expectedDeliveryDate  // 未使用
property.buildingAge           // 未使用

scenario.inflationRate         // 目前計算未使用（未來可用於實質報酬率計算）
```

---

*報告完成*
