/**
 * predictor.ts - 房價/租金預測引擎
 * 根據 prediction-model-design.md § 3 和 § 7.3
 * 使用加權多因子線性迴歸模型
 */

import type {
  MacroAssumptions,
  PredictionHorizon,
  PredictionResult,
  YearlyPrediction,
  PredefinedScenario,
  ConfidenceRating,
  ScenarioDefinition,
} from '../types/prediction';

// 匯入靜態資料
import cpiData from '../data/economic/cpi.json';
import salaryData from '../data/economic/salary.json';
import fertilityData from '../data/demographic/fertility.json';

// ===========================================
// 模型係數（根據 prediction-model-design.md § 3.2）
// ===========================================

/** 房價預測模型係數 */
const PRICE_MODEL = {
  /** 基礎漂移項（歷史平均房價漲幅 %） */
  beta0: 2.5,
  /** 通膨敏感係數（房價對 CPI 的反應） */
  beta1: 0.8,
  /** 薪資敏感係數（購買力對房價的影響） */
  beta2: 1.2,
  /** 人口敏感係數（需求面對房價的影響） */
  beta3: 0.3,
};

/** 租金預測模型係數 */
const RENT_MODEL = {
  /** 基礎漂移項（歷史平均租金漲幅 %） */
  gamma0: 1.5,
  /** 通膨敏感係數 */
  gamma1: 0.6,
  /** 薪資敏感係數（租客支付能力） */
  gamma2: 0.8,
  /** 房價落後效應（房價上漲會推升租金） */
  gamma3: 0.2,
};

/** 信心區間參數 */
const CONFIDENCE_PARAMS = {
  /** 每年不確定性累積率 */
  annualUncertainty: 0.02, // 2%
  /** 95% 信心區間 Z 值 */
  zScore95: 1.96,
};

// ===========================================
// 預設情境
// ===========================================

/** 樂觀情境 */
export const OPTIMISTIC_SCENARIO: ScenarioDefinition = {
  name: '樂觀',
  nameEn: 'optimistic',
  description: '低通膨、高薪資成長、人口持平',
  assumptions: {
    cpiGrowthRate: 1.5,
    salaryGrowthRate: 4.0,
    populationGrowthRate: 0.0,
  },
};

/** 基準情境 */
export const BASELINE_SCENARIO: ScenarioDefinition = {
  name: '基準',
  nameEn: 'baseline',
  description: '溫和通膨、一般薪資成長、人口緩降',
  assumptions: {
    cpiGrowthRate: 2.0,
    salaryGrowthRate: 2.5,
    populationGrowthRate: -0.3,
  },
};

/** 悲觀情境 */
export const PESSIMISTIC_SCENARIO: ScenarioDefinition = {
  name: '悲觀',
  nameEn: 'pessimistic',
  description: '高通膨、薪資停滯、人口快速下降',
  assumptions: {
    cpiGrowthRate: 3.0,
    salaryGrowthRate: 1.0,
    populationGrowthRate: -0.8,
  },
};

/** 所有預設情境 */
export const PREDEFINED_SCENARIOS: Record<Exclude<PredefinedScenario, 'custom'>, ScenarioDefinition> = {
  optimistic: OPTIMISTIC_SCENARIO,
  baseline: BASELINE_SCENARIO,
  pessimistic: PESSIMISTIC_SCENARIO,
};

// ===========================================
// 預測函數
// ===========================================

/**
 * 計算預測房價年成長率
 */
export function predictPriceGrowthRate(assumptions: MacroAssumptions): number {
  const { beta0, beta1, beta2, beta3 } = PRICE_MODEL;
  
  // 如果使用者有覆寫值，直接使用
  if (assumptions.priceGrowthRateOverride !== undefined) {
    return assumptions.priceGrowthRateOverride;
  }
  
  // 多因子線性迴歸公式
  return (
    beta0 +
    beta1 * assumptions.cpiGrowthRate +
    beta2 * assumptions.salaryGrowthRate +
    beta3 * assumptions.populationGrowthRate
  );
}

/**
 * 計算預測租金年成長率
 */
export function predictRentGrowthRate(
  assumptions: MacroAssumptions,
  priceGrowthRate: number
): number {
  const { gamma0, gamma1, gamma2, gamma3 } = RENT_MODEL;
  
  // 如果使用者有覆寫值，直接使用
  if (assumptions.rentGrowthRateOverride !== undefined) {
    return assumptions.rentGrowthRateOverride;
  }
  
  // 多因子線性迴歸公式（含房價落後效應）
  return (
    gamma0 +
    gamma1 * assumptions.cpiGrowthRate +
    gamma2 * assumptions.salaryGrowthRate +
    gamma3 * priceGrowthRate
  );
}

/**
 * 計算 95% 信心區間
 */
export function calculateConfidenceInterval(
  centralValue: number,
  yearFromNow: number
): { lower: number; upper: number } {
  const { annualUncertainty, zScore95 } = CONFIDENCE_PARAMS;
  
  // 標準誤差隨時間增加（平方根法則）
  const cumulativeStdDev = annualUncertainty * Math.sqrt(yearFromNow);
  const margin = centralValue * cumulativeStdDev * zScore95;
  
  return {
    lower: Math.max(0, centralValue - margin),
    upper: centralValue + margin,
  };
}

/**
 * 取得信心度評級
 */
export function getConfidenceRating(years: number): ConfidenceRating {
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

/**
 * 生成歷史資料點（用於圖表顯示）
 */
function generateHistoricalData(
  currentPricePerPing: number,
  currentMonthlyRent: number,
  propertyArea: number
): YearlyPrediction[] {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 5;
  const historical: YearlyPrediction[] = [];
  
  // 反推歷史價格（假設過去 5 年平均年增率約 3%）
  const historicalPriceGrowth = 0.03;
  const historicalRentGrowth = 0.015;
  
  for (let i = 0; i <= 5; i++) {
    const year = startYear + i;
    const yearsAgo = 5 - i;
    
    // 反推歷史價格
    const priceValue = currentPricePerPing / Math.pow(1 + historicalPriceGrowth, yearsAgo);
    const rentValue = currentMonthlyRent / Math.pow(1 + historicalRentGrowth, yearsAgo);
    
    // 計算毛報酬率
    const annualRent = rentValue * 12;
    const propertyValue = priceValue * propertyArea * 10000;
    const grossYield = propertyValue > 0 ? (annualRent / propertyValue) * 100 : 0;
    
    historical.push({
      year,
      isHistorical: true,
      priceIndex: (priceValue / currentPricePerPing) * 100,
      priceValue,
      priceConfidenceLower: priceValue,
      priceConfidenceUpper: priceValue,
      rentIndex: (rentValue / currentMonthlyRent) * 100,
      rentValue,
      rentConfidenceLower: rentValue,
      rentConfidenceUpper: rentValue,
      grossYield,
    });
  }
  
  return historical;
}

/**
 * 生成完整預測
 * 
 * @param city - 縣市
 * @param district - 區域
 * @param currentPricePerPing - 目前每坪單價（萬元）
 * @param currentMonthlyRent - 目前月租金（元）
 * @param propertyArea - 房屋坪數
 * @param horizon - 預測時間範圍（年）
 * @param assumptions - 總體經濟假設
 * @param scenario - 使用的情境類型
 */
export function generatePrediction(
  city: string,
  district: string,
  currentPricePerPing: number,
  currentMonthlyRent: number,
  propertyArea: number,
  horizon: PredictionHorizon,
  assumptions: MacroAssumptions,
  scenario: PredefinedScenario = 'custom'
): PredictionResult {
  // 計算成長率
  const priceGrowthRate = predictPriceGrowthRate(assumptions);
  const rentGrowthRate = predictRentGrowthRate(assumptions, priceGrowthRate);
  
  const currentYear = new Date().getFullYear();
  const predicted: YearlyPrediction[] = [];
  
  // 生成預測年資料
  for (let y = 1; y <= horizon; y++) {
    const priceValue = currentPricePerPing * Math.pow(1 + priceGrowthRate / 100, y);
    const rentValue = currentMonthlyRent * Math.pow(1 + rentGrowthRate / 100, y);
    
    const priceCI = calculateConfidenceInterval(priceValue, y);
    const rentCI = calculateConfidenceInterval(rentValue, y);
    
    // 毛報酬率 = 年租金 / 房屋總價
    const annualRent = rentValue * 12;
    const propertyValue = priceValue * propertyArea * 10000; // 轉換為元
    const grossYield = propertyValue > 0 ? (annualRent / propertyValue) * 100 : 0;
    
    predicted.push({
      year: currentYear + y,
      isHistorical: false,
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
  
  // 生成歷史資料
  const historical = generateHistoricalData(
    currentPricePerPing,
    currentMonthlyRent,
    propertyArea
  );
  
  // 計算摘要
  const lastPrediction = predicted[predicted.length - 1];
  const cumulativePriceChange = ((lastPrediction.priceValue / currentPricePerPing) - 1) * 100;
  const cumulativeRentChange = ((lastPrediction.rentValue / currentMonthlyRent) - 1) * 100;
  const confidenceRating = getConfidenceRating(horizon);
  
  return {
    city,
    district,
    horizon,
    scenario,
    assumptions,
    historical,
    predicted,
    summary: {
      cumulativePriceChange,
      cumulativeRentChange,
      endingGrossYield: lastPrediction.grossYield,
      confidenceRating: confidenceRating.stars,
      confidenceLabel: confidenceRating.label,
    },
    generatedAt: new Date().toISOString(),
    dataSourceVersions: {
      cpi: cpiData.lastUpdated,
      salary: salaryData.lastUpdated,
      fertility: fertilityData.lastUpdated,
    },
  };
}

/**
 * 取得預設情境的假設值
 */
export function getScenarioAssumptions(scenario: PredefinedScenario): MacroAssumptions {
  if (scenario === 'custom') {
    return { ...BASELINE_SCENARIO.assumptions };
  }
  return { ...PREDEFINED_SCENARIOS[scenario].assumptions };
}

/**
 * 取得最新的歷史經濟數據（用於顯示）
 */
export function getLatestEconomicData(): {
  cpiGrowthRate: number;
  salaryGrowthRate: number;
  populationGrowthRate: number;
  lastUpdated: string;
} {
  const cpiRecords = cpiData.data as Array<{ year: number; cpi: number; yoyChange: number }>;
  const salaryRecords = salaryData.data as Array<{ year: number; averageMonthly: number }>;
  const fertilityRecords = fertilityData.data as Array<{ year: number; population: number }>;
  
  // 取得最新的 CPI 年增率
  const latestCpi = cpiRecords[cpiRecords.length - 1];
  
  // 計算近 3 年薪資平均成長率
  const recentSalaries = salaryRecords.slice(-4);
  let salaryGrowthSum = 0;
  for (let i = 1; i < recentSalaries.length; i++) {
    const growth = ((recentSalaries[i].averageMonthly - recentSalaries[i - 1].averageMonthly) / recentSalaries[i - 1].averageMonthly) * 100;
    salaryGrowthSum += growth;
  }
  const avgSalaryGrowth = salaryGrowthSum / (recentSalaries.length - 1);
  
  // 計算近 3 年人口平均變化率
  const recentPop = fertilityRecords.slice(-4);
  let popGrowthSum = 0;
  for (let i = 1; i < recentPop.length; i++) {
    const growth = ((recentPop[i].population - recentPop[i - 1].population) / recentPop[i - 1].population) * 100;
    popGrowthSum += growth;
  }
  const avgPopGrowth = popGrowthSum / (recentPop.length - 1);
  
  return {
    cpiGrowthRate: latestCpi?.yoyChange || 2.0,
    salaryGrowthRate: Math.round(avgSalaryGrowth * 10) / 10,
    populationGrowthRate: Math.round(avgPopGrowth * 10) / 10,
    lastUpdated: cpiData.lastUpdated,
  };
}
