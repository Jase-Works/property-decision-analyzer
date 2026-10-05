# 房價走勢與租金走勢預測模型設計文件

**專案**: 房產持有決策分析器 (Property Decision Analyzer)  
**設計日期**: 2026-10-06  
**版本**: 1.0  
**目的**: 設計一個可預測未來房價與租金走勢的功能，納入使用者指定的總體經濟因子

---

## 1. 設計概述

本功能目標為預測**房價走勢**（property price trend）與**租金走勢**（rent trend），並整合以下使用者指定的總體經濟因子：

- 通膨率（CPI）
- 生育率（Total Fertility Rate）
- 最低薪資（Minimum Wage）
- 平均薪資（Average Salary）
- 薪資中位數（Median Salary）

### 1.1 設計原則

1. **純前端實作**：利用現有 React + recharts 技術棧，不需後端服務
2. **資料透明**：所有預測數據來源與假設必須明確揭露
3. **不確定性誠實呈現**：預測隨時間範圍增加，信心區間必須擴大
4. **使用者可調整**：允許使用者修改總體經濟假設進行情境分析

---

## 2. 資料來源對應（依 Phase 3 調查結果）

根據 `open-data-api-research.md` 的調查，台灣政府開放資料**無法在瀏覽器端直接呼叫**（無 CORS 支援）。因此採用**靜態資料嵌入 + 定期更新**策略。

### 2.1 資料對應表

| 使用者指定因子 | 資料來源 | 瀏覽器可呼叫 | 實作方案 | 更新頻率 |
|--------------|---------|-------------|---------|---------|
| **通膨率 (CPI)** | 主計總處物價統計 | ❌ | 靜態 JSON 嵌入 | 每月更新 build |
| **生育率** | 內政部戶政司 | ❌ | 靜態 JSON 嵌入 | 每年更新 build |
| **最低薪資** | 勞動部公告 | ❌ | 靜態 JSON 嵌入 | 每年更新 build |
| **平均薪資** | 主計總處薪資統計 | ❌ | 靜態 JSON 嵌入 | 每月更新 build |
| **薪資中位數** | 主計總處受僱員工薪資調查 | ❌ | 靜態 JSON 嵌入 | 每年更新 build |
| **房價歷史** | funraise MCP / 實價登錄 | ⚠️ MCP 限定 | MCP Cache + 靜態 fallback | 每季更新 build |
| **租金歷史** | funraise MCP / 實價登錄 | ⚠️ MCP 限定 | MCP Cache + 靜態 fallback | 每季更新 build |

### 2.2 資料檔案結構

```
src/data/
├── economic/
│   ├── cpi.json              # 消費者物價指數歷史 (2010-2026)
│   ├── minWage.json          # 基本工資歷年變化
│   └── salary.json           # 平均薪資與中位數
├── demographic/
│   └── fertility.json        # 生育率歷史 (2000-2025)
└── property/
    ├── priceIndex.json       # 台北/新北各區房價指數歷史 (分區)
    └── rentIndex.json        # 台北/新北各區租金指數歷史 (分區)
```

### 2.3 資料格式範例

```typescript
// src/data/economic/cpi.json
{
  "lastUpdated": "2026-09",
  "source": "主計總處消費者物價指數",
  "baseYear": 2021,
  "data": [
    { "year": 2015, "month": 12, "cpi": 98.2, "yoyChange": 0.3 },
    { "year": 2016, "month": 12, "cpi": 99.6, "yoyChange": 1.4 },
    // ... 每年至少年底數據，有月資料則更完整
    { "year": 2026, "month": 9, "cpi": 108.5, "yoyChange": 2.1 }
  ]
}

// src/data/economic/salary.json
{
  "lastUpdated": "2026-08",
  "source": "主計總處薪資與生產力統計",
  "data": [
    {
      "year": 2020,
      "averageMonthly": 54320,   // 平均月薪 (元)
      "medianMonthly": 42000,    // 中位數月薪 (元)
      "minWageMonthly": 23800,   // 基本工資 (元)
      "minWageHourly": 158       // 時薪
    },
    // ...
  ]
}

// src/data/demographic/fertility.json
{
  "lastUpdated": "2025",
  "source": "內政部戶政司人口統計",
  "data": [
    { "year": 2015, "totalFertilityRate": 1.18, "births": 213598, "population": 23492074 },
    { "year": 2016, "totalFertilityRate": 1.17, "births": 208440, "population": 23539816 },
    // ...
    { "year": 2025, "totalFertilityRate": 0.87, "births": 135000, "population": 23350000 }
  ]
}

// src/data/property/priceIndex.json
{
  "lastUpdated": "2026-Q2",
  "source": "內政部住宅價格指數 + funraise MCP",
  "baseQuarter": "2021Q1",
  "regions": {
    "taipei": {
      "overall": [
        { "quarter": "2021Q1", "index": 100.0, "pricePerPing": 72.5 },
        { "quarter": "2026Q2", "index": 118.5, "pricePerPing": 85.9 }
      ],
      "districts": {
        "xinyi": [/* 區域級別資料 */],
        "daan": [/* ... */]
        // 台北市 12 區
      }
    },
    "newTaipei": {
      "overall": [/* ... */],
      "districts": {
        "banqiao": [/* ... */],
        // 新北市 29 區
      }
    }
  }
}
```

### 2.4 資料缺口與處理策略

| 缺口類型 | 處理策略 |
|---------|---------|
| 月薪資無即時 API | 用年度資料內插 + 假設月均等 |
| 路段級房價無歷史序列 | 使用區級指數乘以路段/區比值 |
| 未來總體經濟假設 | 提供多個情境預設值，使用者可調整 |
| funraise MCP 不可用時 | Fallback 到靜態 priceIndex.json |

---

## 3. 預測演算法設計

### 3.1 演算法選擇：加權多因子線性迴歸（Weighted Multi-Factor Linear Regression）

**選擇理由**：

1. **可在瀏覽器執行**：不需 Python/ML 框架，純 JavaScript 可實作
2. **可解釋性高**：每個因子的權重可直接呈現給使用者
3. **運算速度快**：即時互動無延遲
4. **資料需求低**：10-15 年歷史資料足以訓練
5. **recharts 已具備**：專案已有圖表庫

**替代方案比較**：

| 方案 | 優點 | 缺點 | 結論 |
|-----|-----|-----|-----|
| 簡單移動平均 | 最簡單 | 無法納入多因子 | ❌ 不採用 |
| 多因子線性迴歸 | 可解釋、可實作 | 假設線性關係 | ✅ 採用 |
| ARIMA | 時序預測經典 | 需要複雜實作 | ❌ 過度設計 |
| 機器學習 (XGBoost) | 精準度高 | 需後端、黑箱 | ❌ 不適合純前端 |

### 3.2 預測模型公式

#### 3.2.1 房價預測模型

```
未來房價增長率(t) = β₀ + β₁×CPI變化率 + β₂×薪資成長率 + β₃×人口變化率 + ε

其中：
- β₀：基礎漂移項（歷史平均房價漲幅）
- β₁：通膨敏感係數（房價對通膨的反應）
- β₂：薪資敏感係數（購買力對房價的影響）
- β₃：人口敏感係數（需求面對房價的影響，生育率為領先指標）
- ε：殘差項（模型未解釋的變異）
```

**經驗係數（基於台灣房市歷史研究）**：

| 係數 | 建議初始值 | 來源 / 理由 |
|-----|-----------|------------|
| β₀ | 2.5% | 2010-2025 年全台房價年均漲幅 |
| β₁ | 0.8 | 房價通膨彈性約 0.8（房價漲幅約為 CPI 的 0.8 倍） |
| β₂ | 1.2 | 薪資上漲 1% → 房價約漲 1.2%（購買力效應） |
| β₃ | 0.3 | 人口下降 1% → 長期房價約降 0.3%（需求減少） |

#### 3.2.2 租金預測模型

```
未來租金增長率(t) = γ₀ + γ₁×CPI變化率 + γ₂×薪資成長率 + γ₃×房價漲幅(t-1) + ε

其中：
- γ₀：基礎漂移項（歷史平均租金漲幅）
- γ₁：通膨敏感係數
- γ₂：薪資敏感係數（租客支付能力）
- γ₃：房價落後效應（房價上漲會推升租金，但有時滯）
```

**經驗係數**：

| 係數 | 建議初始值 | 來源 / 理由 |
|-----|-----------|------------|
| γ₀ | 1.5% | 2010-2025 年全台租金年均漲幅（低於房價） |
| γ₁ | 0.6 | 租金對通膨反應較房價遲緩 |
| γ₂ | 0.8 | 租客支付能力受薪資影響 |
| γ₃ | 0.2 | 房價上漲 1% → 租金約漲 0.2%（房東轉嫁但有限） |

### 3.3 信心區間計算

預測不確定性隨時間增加，採用**扇形展開**的信心區間：

```typescript
// 信心區間計算
function calculateConfidenceInterval(
  baseValue: number,
  yearFromNow: number,
  annualGrowthRate: number,
  confidenceLevel: 0.90 | 0.95
): { lower: number; upper: number; central: number } {
  // 預測值
  const central = baseValue * Math.pow(1 + annualGrowthRate / 100, yearFromNow);
  
  // 標準誤差隨時間增加（假設每年增加 2% 的不確定性）
  const annualUncertainty = 0.02; // 2%
  const cumulativeUncertainty = annualUncertainty * Math.sqrt(yearFromNow);
  
  // Z 值
  const zScore = confidenceLevel === 0.95 ? 1.96 : 1.645;
  
  // 信心區間
  const margin = central * cumulativeUncertainty * zScore;
  
  return {
    central,
    lower: central - margin,
    upper: central + margin,
  };
}
```

**信心區間特性**：

| 預測年數 | 95% 信心區間寬度 | 解讀 |
|---------|-----------------|------|
| 1 年 | ±4% | 相對可靠 |
| 3 年 | ±7% | 中等不確定性 |
| 5 年 | ±9% | 高不確定性 |
| 10 年 | ±13% | 僅供參考，不應作為決策依據 |

### 3.4 演算法限制與誠實揭露

**模型假設（使用者必須理解）**：

1. **線性假設**：模型假設各因子與房價/租金呈線性關係，實際可能有非線性效應
2. **歷史外推**：基於過去 10-15 年資料，假設未來模式類似
3. **不考慮黑天鵝**：無法預測重大政策變化、疫情、戰爭等
4. **區域差異簡化**：同一區內不同路段仍有差異

**必須在 UI 揭露的警語**：

```
⚠️ 預測聲明
本預測僅供參考，基於歷史資料與總體經濟假設推算。
實際房價/租金受多種因素影響，可能與預測有顯著差異。
預測時間越長，不確定性越高。
本工具不構成投資建議。
```

---

## 4. UI 呈現方式設計

### 4.1 預測結果面板（新增區塊）

在現有 `ResultsPanel.tsx` 下方新增 `PredictionPanel.tsx`：

```
┌─────────────────────────────────────────────────────────────┐
│  📈 房價與租金走勢預測                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [1年▼] [3年] [5年] [10年]    預測時間範圍選擇                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │        房價走勢圖（recharts AreaChart）              │   │
│  │        - 中線：預測值                                │   │
│  │        - 陰影區：95% 信心區間                        │   │
│  │        - 歷史實際值 vs 預測值                        │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📊 預測摘要                                                │
│  ┌─────────────┬─────────────┬─────────────┐              │
│  │ 房價        │ 租金        │ 租金報酬率   │              │
│  │ +8.5%       │ +5.2%       │ 2.8%→2.5%  │              │
│  │ (3年累計)   │ (3年累計)   │ (預估下降)  │              │
│  └─────────────┴─────────────┴─────────────┘              │
│                                                             │
│  ▶ 總體經濟假設（點擊展開/調整）                              │
│                                                             │
│  ⚠️ 預測聲明：本預測僅供參考... [詳細]                        │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 總體經濟假設調整器（展開區塊）

```
┌─────────────────────────────────────────────────────────────┐
│  ▼ 總體經濟假設                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  預設情境：[樂觀▼] [基準] [悲觀] [自訂]                        │
│                                                             │
│  通膨率 (年均)                                               │
│  [======●========] 2.1%  (資料來源：主計總處 2026/09)        │
│                                                             │
│  薪資成長率 (年均)                                           │
│  [====●==========] 2.5%  (2020-2025 平均)                   │
│                                                             │
│  人口變化率 (年均)                                           │
│  [●==============] -0.3% (生育率 0.87 推估)                  │
│                                                             │
│  [重設為預設] [套用並重新預測]                                 │
│                                                             │
│  💡 說明：調整假設後會即時更新預測結果                          │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 圖表設計

使用 recharts `ComposedChart` 實現：

```typescript
// PredictionChart.tsx 概念
<ComposedChart data={predictionData}>
  {/* 信心區間陰影 */}
  <Area
    dataKey="upperBound"
    stackId="confidence"
    fill="#93c5fd"
    fillOpacity={0.3}
  />
  <Area
    dataKey="lowerBound"
    stackId="confidence"
    fill="#ffffff"
    fillOpacity={1}
  />
  
  {/* 歷史實際值 */}
  <Line
    dataKey="historicalValue"
    stroke="#1e40af"
    strokeWidth={2}
    dot={true}
  />
  
  {/* 預測中線 */}
  <Line
    dataKey="predictedValue"
    stroke="#3b82f6"
    strokeWidth={2}
    strokeDasharray="5 5"
    dot={false}
  />
  
  {/* 今日標記 */}
  <ReferenceLine x="2026" stroke="#ef4444" label="今日" />
</ComposedChart>
```

### 4.4 整合現有 App 的方式

```
App.tsx
├── PropertyForm
├── FinancialForm  
├── ScenarioForm
├── ResultsPanel (現有)
│   ├── SellNowResult
│   ├── HoldAndRentResult
│   └── ComparisonChart
├── **PredictionPanel (新增)** ← 新元件
│   ├── TimeRangeSelector
│   ├── PredictionChart
│   ├── PredictionSummary
│   └── MacroAssumptionsEditor
└── MarketDataPanel
```

---

## 5. 預測時間範圍設計

### 5.1 可選時間範圍

| 時間範圍 | 用途 | 信心度 | UI 標示 |
|---------|-----|-------|--------|
| **1 年** | 短期決策（賣/租轉換） | 高 | ⭐⭐⭐ |
| **3 年** | 中期規劃（持有 vs 出售） | 中 | ⭐⭐ |
| **5 年** | 長期投資評估 | 低 | ⭐ |
| **10 年** | 極長期參考 | 極低 | ⚠️ 僅供參考 |

### 5.2 信心度隨時間衰減

```typescript
// 信心度計算
function getConfidenceRating(years: number): {
  stars: 1 | 2 | 3;
  label: string;
  color: string;
} {
  if (years <= 1) {
    return { stars: 3, label: '相對可靠', color: 'green' };
  } else if (years <= 3) {
    return { stars: 2, label: '中等不確定性', color: 'yellow' };
  } else if (years <= 5) {
    return { stars: 1, label: '高不確定性', color: 'orange' };
  } else {
    return { stars: 1, label: '僅供參考', color: 'red' };
  }
}
```

### 5.3 預設時間範圍

預設選擇 **3 年**，因為：
1. 與現有 `ScenarioForm` 的 `holdingPeriodYears` 預設值一致
2. 一般房產投資週期約 3-5 年
3. 3 年內的預測仍有參考價值

---

## 6. 預設情境設計

提供三種預設情境，讓使用者快速比較：

### 6.1 樂觀情境 (Optimistic)

```typescript
const OPTIMISTIC_SCENARIO: MacroAssumptions = {
  cpiGrowthRate: 1.5,        // 低通膨
  salaryGrowthRate: 4.0,     // 高薪資成長
  populationGrowthRate: 0.0, // 人口持平
  priceGrowthRate: 4.5,      // 房價穩定上漲
  rentGrowthRate: 3.0,       // 租金跟漲
};
```

### 6.2 基準情境 (Baseline)

```typescript
const BASELINE_SCENARIO: MacroAssumptions = {
  cpiGrowthRate: 2.0,         // 溫和通膨
  salaryGrowthRate: 2.5,      // 一般薪資成長
  populationGrowthRate: -0.3, // 人口緩降
  priceGrowthRate: 2.5,       // 房價溫和上漲
  rentGrowthRate: 1.5,        // 租金緩漲
};
```

### 6.3 悲觀情境 (Pessimistic)

```typescript
const PESSIMISTIC_SCENARIO: MacroAssumptions = {
  cpiGrowthRate: 3.0,         // 高通膨
  salaryGrowthRate: 1.0,      // 薪資停滯
  populationGrowthRate: -0.8, // 人口快速下降
  priceGrowthRate: 0.0,       // 房價持平
  rentGrowthRate: 0.5,        // 租金微漲
};
```

---

## 7. 技術實作規格

### 7.1 新增檔案清單

```
src/
├── data/
│   ├── economic/
│   │   ├── cpi.json           # 新增
│   │   ├── salary.json        # 新增
│   │   └── minWage.json       # 新增
│   ├── demographic/
│   │   └── fertility.json     # 新增
│   └── property/
│       ├── priceIndex.json    # 新增
│       └── rentIndex.json     # 新增
├── types/
│   └── prediction.ts          # 新增：預測相關型別
├── utils/
│   └── predictor.ts           # 新增：預測演算法
├── components/
│   └── prediction/
│       ├── index.ts           # 新增
│       ├── PredictionPanel.tsx          # 新增：主面板
│       ├── PredictionChart.tsx          # 新增：圖表
│       ├── MacroAssumptionsEditor.tsx   # 新增：假設調整器
│       └── PredictionDisclaimer.tsx     # 新增：警語元件
└── hooks/
    └── usePrediction.ts       # 新增：預測 hook
```

### 7.2 型別定義 (prediction.ts)

```typescript
// src/types/prediction.ts

/** 總體經濟假設 */
export interface MacroAssumptions {
  cpiGrowthRate: number;          // 通膨率 (%)
  salaryGrowthRate: number;       // 薪資成長率 (%)
  populationGrowthRate: number;   // 人口變化率 (%)
  // 使用者可覆寫以下預測值
  priceGrowthRateOverride?: number;  // 房價成長率覆寫 (%)
  rentGrowthRateOverride?: number;   // 租金成長率覆寫 (%)
}

/** 預設情境類型 */
export type PredefinedScenario = 'optimistic' | 'baseline' | 'pessimistic' | 'custom';

/** 預測時間範圍 */
export type PredictionHorizon = 1 | 3 | 5 | 10;

/** 單年預測結果 */
export interface YearlyPrediction {
  year: number;                   // 年份 (2026, 2027, ...)
  // 房價
  priceIndex: number;             // 房價指數 (基期=100)
  priceValue: number;             // 房價絕對值 (萬/坪)
  priceConfidenceLower: number;   // 95% 下界
  priceConfidenceUpper: number;   // 95% 上界
  // 租金
  rentIndex: number;              // 租金指數
  rentValue: number;              // 租金絕對值 (元/月)
  rentConfidenceLower: number;
  rentConfidenceUpper: number;
  // 衍生指標
  grossYield: number;             // 毛租金報酬率 (%)
}

/** 完整預測結果 */
export interface PredictionResult {
  city: string;
  district: string;
  horizon: PredictionHorizon;
  scenario: PredefinedScenario;
  assumptions: MacroAssumptions;
  // 歷史資料 (用於圖表顯示)
  historical: YearlyPrediction[];
  // 預測資料
  predicted: YearlyPrediction[];
  // 摘要
  summary: {
    cumulativePriceChange: number;  // 累計房價變化 (%)
    cumulativeRentChange: number;   // 累計租金變化 (%)
    endingGrossYield: number;       // 期末毛報酬率 (%)
    confidenceRating: 1 | 2 | 3;    // 信心度評級
  };
  // 元資料
  generatedAt: string;              // ISO timestamp
  dataSourceVersions: {
    cpi: string;
    salary: string;
    priceIndex: string;
    rentIndex: string;
  };
}

/** 歷史經濟資料 */
export interface HistoricalEconomicData {
  cpi: Array<{ year: number; month?: number; value: number; yoy: number }>;
  salary: Array<{ year: number; average: number; median: number; minWage: number }>;
  fertility: Array<{ year: number; rate: number; births: number }>;
}

/** 歷史房產資料 */
export interface HistoricalPropertyData {
  priceIndex: Array<{ quarter: string; index: number; pricePerPing: number }>;
  rentIndex: Array<{ quarter: string; index: number; rentPerMonth: number }>;
}
```

### 7.3 預測引擎核心 (predictor.ts)

```typescript
// src/utils/predictor.ts

import type {
  MacroAssumptions,
  PredictionHorizon,
  PredictionResult,
  YearlyPrediction,
} from '../types/prediction';

// 模型係數
const MODEL_COEFFICIENTS = {
  price: {
    beta0: 2.5,   // 基礎漂移
    beta1: 0.8,   // CPI 敏感度
    beta2: 1.2,   // 薪資敏感度
    beta3: 0.3,   // 人口敏感度
  },
  rent: {
    gamma0: 1.5,
    gamma1: 0.6,
    gamma2: 0.8,
    gamma3: 0.2,  // 房價落後效應
  },
};

/**
 * 計算預測房價成長率
 */
export function predictPriceGrowthRate(assumptions: MacroAssumptions): number {
  const { beta0, beta1, beta2, beta3 } = MODEL_COEFFICIENTS.price;
  
  return (
    beta0 +
    beta1 * assumptions.cpiGrowthRate +
    beta2 * assumptions.salaryGrowthRate +
    beta3 * assumptions.populationGrowthRate
  );
}

/**
 * 計算預測租金成長率
 */
export function predictRentGrowthRate(
  assumptions: MacroAssumptions,
  priceGrowthRate: number
): number {
  const { gamma0, gamma1, gamma2, gamma3 } = MODEL_COEFFICIENTS.rent;
  
  return (
    gamma0 +
    gamma1 * assumptions.cpiGrowthRate +
    gamma2 * assumptions.salaryGrowthRate +
    gamma3 * priceGrowthRate
  );
}

/**
 * 計算信心區間
 */
export function calculateConfidenceInterval(
  centralValue: number,
  yearFromNow: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  const annualUncertainty = 0.02;
  const cumulativeStdDev = annualUncertainty * Math.sqrt(yearFromNow);
  const zScore = confidenceLevel === 0.95 ? 1.96 : 1.645;
  const margin = centralValue * cumulativeStdDev * zScore;
  
  return {
    lower: Math.max(0, centralValue - margin),
    upper: centralValue + margin,
  };
}

/**
 * 生成完整預測
 */
export function generatePrediction(
  city: string,
  district: string,
  currentPricePerPing: number,
  currentMonthlyRent: number,
  horizon: PredictionHorizon,
  assumptions: MacroAssumptions
): PredictionResult {
  // 計算成長率
  const priceGrowthRate = assumptions.priceGrowthRateOverride 
    ?? predictPriceGrowthRate(assumptions);
  const rentGrowthRate = assumptions.rentGrowthRateOverride 
    ?? predictRentGrowthRate(assumptions, priceGrowthRate);
  
  const currentYear = new Date().getFullYear();
  const predicted: YearlyPrediction[] = [];
  
  for (let y = 1; y <= horizon; y++) {
    const priceValue = currentPricePerPing * Math.pow(1 + priceGrowthRate / 100, y);
    const rentValue = currentMonthlyRent * Math.pow(1 + rentGrowthRate / 100, y);
    
    const priceCI = calculateConfidenceInterval(priceValue, y);
    const rentCI = calculateConfidenceInterval(rentValue, y);
    
    // 毛報酬率 = 年租金 / (房價每坪 × 假設30坪)
    const annualRent = rentValue * 12;
    const propertyValue = priceValue * 30 * 10000; // 30坪，轉元
    const grossYield = (annualRent / propertyValue) * 100;
    
    predicted.push({
      year: currentYear + y,
      priceIndex: (priceValue / currentPricePerPing) * 100,
      priceValue,
      priceConfidenceLower: priceCI.lower,
      priceConfidenceUpper: priceCI.upper,
      rentIndex: (rentValue / currentMonthlyRent) * 100,
      rentValue,
      rentConfidenceLower: rentCI.lower,
      rentConfidenceUpper: rentCI.upper,
      grossYield,
    });
  }
  
  // 計算摘要
  const lastPrediction = predicted[predicted.length - 1];
  const cumulativePriceChange = ((lastPrediction.priceValue / currentPricePerPing) - 1) * 100;
  const cumulativeRentChange = ((lastPrediction.rentValue / currentMonthlyRent) - 1) * 100;
  
  return {
    city,
    district,
    horizon,
    scenario: 'custom',
    assumptions,
    historical: [], // 由呼叫端填入
    predicted,
    summary: {
      cumulativePriceChange,
      cumulativeRentChange,
      endingGrossYield: lastPrediction.grossYield,
      confidenceRating: horizon <= 1 ? 3 : horizon <= 3 ? 2 : 1,
    },
    generatedAt: new Date().toISOString(),
    dataSourceVersions: {
      cpi: '2026-09',
      salary: '2026-08',
      priceIndex: '2026-Q2',
      rentIndex: '2026-Q2',
    },
  };
}
```

---

## 8. 錯誤處理與邊界情況

### 8.1 資料不可用情況

| 情況 | 處理方式 |
|-----|---------|
| 靜態資料檔遺失 | 顯示錯誤訊息，停用預測功能 |
| 使用者未選縣市/區域 | 使用全市平均值 |
| 區域無歷史資料 | 使用縣市級資料 + 警告訊息 |
| MCP 不可用 | Fallback 到靜態資料 |

### 8.2 輸入驗證

```typescript
// 總體經濟假設範圍驗證
const ASSUMPTION_BOUNDS = {
  cpiGrowthRate: { min: -5, max: 10 },
  salaryGrowthRate: { min: -5, max: 15 },
  populationGrowthRate: { min: -3, max: 3 },
};
```

---

## 9. 更新機制設計

### 9.1 靜態資料更新流程

```
┌────────────────────────────────────────────────────────────┐
│                    Build Time (CI/CD)                       │
├────────────────────────────────────────────────────────────┤
│  1. scripts/update-economic-data.ts                         │
│     - 從主計總處下載最新 CPI CSV                              │
│     - 從內政部下載最新人口統計                                 │
│     - 轉換為 JSON 格式                                       │
│     - 寫入 src/data/economic/*.json                         │
│                                                            │
│  2. scripts/update-property-data.ts                         │
│     - 從實價登錄批次下載取得最新季度資料                        │
│     - 聚合為區域級指數                                        │
│     - 寫入 src/data/property/*.json                         │
│                                                            │
│  3. npm run build                                           │
│     - JSON 檔案被 bundle 進 app                              │
└────────────────────────────────────────────────────────────┘
```

### 9.2 更新排程建議

| 資料類型 | 更新頻率 | 觸發時機 |
|---------|---------|---------|
| CPI | 每月 | 主計總處公布後 (每月 5 日左右) |
| 薪資 | 每月 | 主計總處公布後 |
| 生育率 | 每年 | 年度統計公布後 (約 2 月) |
| 房價指數 | 每季 | 內政部公布後 (約季末後 45 天) |
| 租金指數 | 每季 | 同上 |

---

## 10. 附錄：模型係數校正方法

若未來有更多資料，可用最小平方法（OLS）校正係數：

```typescript
// 簡化版 OLS 實作（純前端）
function fitLinearRegression(
  y: number[],      // 房價年增率歷史
  X: number[][]     // [CPI變化, 薪資變化, 人口變化] 多年
): number[] {
  // ... 矩陣運算實作
  // 回傳 [beta0, beta1, beta2, beta3]
}
```

**初始係數來源**：
- β₁ (CPI 敏感度) 參考：Lin & Huang (2018) 台灣房價與通膨關係研究
- β₂ (薪資敏感度) 參考：內政部住宅需求動向調查
- β₃ (人口敏感度) 參考：日本少子化對房價影響經驗

---

*設計文件完成*
