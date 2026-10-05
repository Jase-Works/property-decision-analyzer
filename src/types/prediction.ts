/**
 * 房價/租金預測功能 - TypeScript 類型定義
 * 根據 prediction-model-design.md § 7.2
 */

/** 總體經濟假設 */
export interface MacroAssumptions {
  /** 通膨率 (年均 %) */
  cpiGrowthRate: number;
  /** 薪資成長率 (年均 %) */
  salaryGrowthRate: number;
  /** 人口變化率 (年均 %) */
  populationGrowthRate: number;
  /** 房價成長率覆寫 (%)，若設定則忽略模型計算 */
  priceGrowthRateOverride?: number;
  /** 租金成長率覆寫 (%)，若設定則忽略模型計算 */
  rentGrowthRateOverride?: number;
}

/** 預設情境類型 */
export type PredefinedScenario = 'optimistic' | 'baseline' | 'pessimistic' | 'custom';

/** 預測時間範圍 (年) */
export type PredictionHorizon = 1 | 3 | 5 | 10;

/** 單年預測結果 */
export interface YearlyPrediction {
  /** 年份 (2026, 2027, ...) */
  year: number;
  /** 是否為歷史資料 */
  isHistorical: boolean;
  // 房價
  /** 房價指數 (基期=100) */
  priceIndex: number;
  /** 房價絕對值 (萬/坪) */
  priceValue: number;
  /** 房價 95% 信心區間下界 */
  priceConfidenceLower: number;
  /** 房價 95% 信心區間上界 */
  priceConfidenceUpper: number;
  // 租金
  /** 租金指數 (基期=100) */
  rentIndex: number;
  /** 租金絕對值 (元/月) */
  rentValue: number;
  /** 租金 95% 信心區間下界 */
  rentConfidenceLower: number;
  /** 租金 95% 信心區間上界 */
  rentConfidenceUpper: number;
  // 衍生指標
  /** 毛租金報酬率 (%) */
  grossYield: number;
}

/** 預測摘要 */
export interface PredictionSummary {
  /** 累計房價變化 (%) */
  cumulativePriceChange: number;
  /** 累計租金變化 (%) */
  cumulativeRentChange: number;
  /** 期末毛報酬率 (%) */
  endingGrossYield: number;
  /** 信心度評級 (1-3 星) */
  confidenceRating: 1 | 2 | 3;
  /** 信心度說明 */
  confidenceLabel: string;
}

/** 完整預測結果 */
export interface PredictionResult {
  /** 縣市 */
  city: string;
  /** 區域 */
  district: string;
  /** 預測時間範圍 */
  horizon: PredictionHorizon;
  /** 使用的情境 */
  scenario: PredefinedScenario;
  /** 總體經濟假設 */
  assumptions: MacroAssumptions;
  /** 歷史資料 (用於圖表顯示) */
  historical: YearlyPrediction[];
  /** 預測資料 */
  predicted: YearlyPrediction[];
  /** 摘要 */
  summary: PredictionSummary;
  /** 生成時間 (ISO timestamp) */
  generatedAt: string;
  /** 資料來源版本 */
  dataSourceVersions: {
    cpi: string;
    salary: string;
    fertility: string;
  };
}

/** 歷史經濟資料（從 JSON 讀取） */
export interface HistoricalCpiData {
  year: number;
  cpi: number;
  yoyChange: number;
}

export interface HistoricalSalaryData {
  year: number;
  averageMonthly: number;
  medianMonthly: number;
  minWageMonthly: number;
  minWageHourly: number;
}

export interface HistoricalFertilityData {
  year: number;
  totalFertilityRate: number;
  births: number;
  population: number;
}

/** 歷史經濟資料彙整 */
export interface HistoricalEconomicData {
  cpi: HistoricalCpiData[];
  salary: HistoricalSalaryData[];
  fertility: HistoricalFertilityData[];
  lastUpdated: {
    cpi: string;
    salary: string;
    fertility: string;
  };
}

/** 信心度評級資訊 */
export interface ConfidenceRating {
  stars: 1 | 2 | 3;
  label: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
}

/** 預設情境定義 */
export interface ScenarioDefinition {
  name: string;
  nameEn: string;
  description: string;
  assumptions: MacroAssumptions;
}
