/**
 * 房產財務試算引擎
 * 計算「現在出售」vs「持有出租」的投資報酬
 */

import type {
  PropertyData,
  FinancialData,
  ScenarioData,
  MarketData,
  AnalysisResult,
  SellNowResult,
  HoldAndRentResult,
  YearlyProjection,
} from '../types';

// ===========================================
// 常數設定
// ===========================================

/** 交易成本常數 */
const TRANSACTION_COSTS = {
  agentFeeRate: 0.04,      // 仲介費 4%（買賣雙方各 2%，此處算賣方）
  notaryFee: 3,            // 代書費（萬元）
  stampTaxRate: 0.001,     // 契稅印花稅等（0.1%）
};

/** 房地合一稅率（依持有年限） */
const CAPITAL_GAINS_TAX_RATES = {
  withinOneYear: 0.45,     // 持有 1 年內：45%
  withinTwoYears: 0.35,    // 持有 2 年內：35%
  withinFiveYears: 0.20,   // 持有 2-5 年：20%
  withinTenYears: 0.15,    // 持有 5-10 年：15%
  overTenYears: 0.10,      // 持有 10 年以上：10%
};

// ===========================================
// 輔助函數
// ===========================================

/**
 * 計算月供金額（本息攤還）
 * @param principal 貸款本金（萬元）
 * @param annualRate 年利率（%，例如 2.1）
 * @param years 貸款年限
 * @returns 月供金額（萬元）
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (principal <= 0 || years <= 0) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  
  if (monthlyRate === 0) {
    return principal / numPayments;
  }
  
  const payment = (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
  
  return payment;
}

/**
 * 計算指定年數後的剩餘本金
 */
export function calculateRemainingPrincipal(
  principal: number,
  annualRate: number,
  loanYears: number,
  elapsedYears: number
): number {
  if (principal <= 0 || loanYears <= 0) return 0;
  if (elapsedYears >= loanYears) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = loanYears * 12;
  const elapsedMonths = elapsedYears * 12;
  
  if (monthlyRate === 0) {
    return principal * (1 - elapsedMonths / totalMonths);
  }
  
  // 剩餘本金 = P * [(1+r)^n - (1+r)^k] / [(1+r)^n - 1]
  const remaining = principal * (
    (Math.pow(1 + monthlyRate, totalMonths) - Math.pow(1 + monthlyRate, elapsedMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );
  
  return Math.max(0, remaining);
}

/**
 * 計算持有年數（從購入日到現在）
 */
export function calculateHoldingYears(purchaseDate: string): number {
  if (!purchaseDate) return 0;
  
  const purchase = new Date(purchaseDate);
  const now = new Date();
  const diffYears = (now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365);
  
  return Math.max(0, diffYears);
}

/**
 * 計算房地合一稅率
 */
export function getCapitalGainsTaxRate(holdingYears: number): number {
  if (holdingYears <= 1) return CAPITAL_GAINS_TAX_RATES.withinOneYear;
  if (holdingYears <= 2) return CAPITAL_GAINS_TAX_RATES.withinTwoYears;
  if (holdingYears <= 5) return CAPITAL_GAINS_TAX_RATES.withinFiveYears;
  if (holdingYears <= 10) return CAPITAL_GAINS_TAX_RATES.withinTenYears;
  return CAPITAL_GAINS_TAX_RATES.overTenYears;
}

/**
 * 計算交易成本
 */
export function calculateTransactionCosts(sellingPrice: number): number {
  const agentFee = sellingPrice * TRANSACTION_COSTS.agentFeeRate;
  const stampTax = sellingPrice * TRANSACTION_COSTS.stampTaxRate;
  return agentFee + TRANSACTION_COSTS.notaryFee + stampTax;
}

/**
 * 計算年度持有成本
 */
export function calculateAnnualHoldingCosts(financial: FinancialData): number {
  const managementFee = financial.monthlyManagementFee * 12 / 10000; // 轉萬元
  const propertyTax = financial.annualPropertyTax / 10000;
  const landTax = financial.annualLandTax / 10000;
  const insurance = financial.annualInsurance / 10000;
  
  return managementFee + propertyTax + landTax + insurance;
}

/**
 * 計算有效年租金收入（扣除空置率）
 */
export function calculateEffectiveAnnualRent(
  monthlyRent: number,
  vacancyRate: number
): number {
  const grossAnnualRent = monthlyRent * 12 / 10000; // 轉萬元
  const effectiveRent = grossAnnualRent * (1 - vacancyRate / 100);
  return effectiveRent;
}

// ===========================================
// 主要計算函數
// ===========================================

/**
 * 計算「現在出售」情境
 * 
 * 語意：「現在出售」= 今天立刻賣
 * - 預估售價 = 當前市價（basePrice），不套用成長率
 * - 無再投資報酬（今天賣今天拿錢）
 * - 總報酬 = 純獲利
 */
export function calculateSellNow(
  property: PropertyData,
  financial: FinancialData,
  _scenario: ScenarioData, // 「現在出售」不使用情境參數，保留以維持 API 相容性
  marketData: MarketData | null
): SellNowResult {
  // 預估售價 = 當前市價（使用市場均價或購入價）
  // 「現在出售」= 今天賣，預估售價為當前市價，不套用成長率
  const basePrice = (marketData && marketData.averagePrice > 0)
    ? marketData.averagePrice * property.area
    : property.purchasePrice;
  const estimatedSellingPrice = basePrice;
  
  // 交易成本
  const transactionCosts = calculateTransactionCosts(estimatedSellingPrice);
  
  // 剩餘貸款（基於從購入到現在的實際持有年數）
  const holdingYears = calculateHoldingYears(property.purchaseDate);
  const remainingLoan = calculateRemainingPrincipal(
    financial.loanAmount,
    financial.loanInterestRate,
    financial.loanTerm,
    holdingYears
  );
  
  // 房地合一稅
  const capitalGain = estimatedSellingPrice - property.purchasePrice;
  const taxRate = getCapitalGainsTaxRate(holdingYears);
  const capitalGainsTax = capitalGain > 0 ? capitalGain * taxRate : 0;
  
  // 淨收入（賣房後拿到的現金）
  const netProceeds = estimatedSellingPrice - transactionCosts - remainingLoan - capitalGainsTax;
  
  // 初始投入（頭期款）= 購入總價 - 貸款金額
  const initialInvestment = property.purchasePrice - financial.loanAmount;
  
  // 純獲利 = 淨收入 - 初始投入
  const pureProfit = netProceeds - initialInvestment;
  
  // 「現在出售」無再投資報酬（今天賣今天拿錢）
  const reinvestmentReturn = 0;
  
  // 「現在出售」總報酬 = 純獲利（無再投資）
  const totalReturn = pureProfit;
  
  // 年化報酬率：基於從購入到現在的實際持有年數
  const annualizedReturn = initialInvestment > 0 && holdingYears > 0
    ? (Math.pow((initialInvestment + totalReturn) / initialInvestment, 1 / holdingYears) - 1) * 100
    : 0;
  
  return {
    estimatedSellingPrice,
    transactionCosts,
    remainingLoan,
    capitalGainsTax,
    netProceeds,
    initialInvestment,
    pureProfit,
    reinvestmentReturn,
    totalReturn,
    annualizedReturn,
  };
}

/**
 * 計算「持有出租」情境
 */
export function calculateHoldAndRent(
  property: PropertyData,
  financial: FinancialData,
  scenario: ScenarioData,
  marketData: MarketData | null
): HoldAndRentResult {
  const years = scenario.holdingPeriodYears;
  
  // 計算累計租金收入（考慮年增率）
  let totalRentalIncome = 0;
  let currentMonthlyRent = financial.expectedMonthlyRent;
  for (let year = 1; year <= years; year++) {
    const annualRent = calculateEffectiveAnnualRent(currentMonthlyRent, financial.vacancyRate);
    totalRentalIncome += annualRent;
    currentMonthlyRent *= (1 + scenario.rentGrowthRate / 100);
  }
  
  // 累計持有成本
  const annualHoldingCosts = calculateAnnualHoldingCosts(financial);
  const totalHoldingCosts = annualHoldingCosts * years;
  
  // 累計房貸支出
  const monthlyPayment = calculateMonthlyPayment(
    financial.loanAmount,
    financial.loanInterestRate,
    financial.loanTerm
  );
  const totalMortgagePayments = monthlyPayment * 12 * years;
  
  // 已還本金
  const currentHoldingYears = calculateHoldingYears(property.purchaseDate);
  const remainingNow = calculateRemainingPrincipal(
    financial.loanAmount,
    financial.loanInterestRate,
    financial.loanTerm,
    currentHoldingYears
  );
  const remainingFuture = calculateRemainingPrincipal(
    financial.loanAmount,
    financial.loanInterestRate,
    financial.loanTerm,
    currentHoldingYears + years
  );
  const principalRepaid = remainingNow - remainingFuture;
  
  // 未來售價（考慮房價年增率）
  let currentPrice: number;
  if (marketData && marketData.averagePrice > 0) {
    currentPrice = marketData.averagePrice * property.area;
  } else {
    currentPrice = property.purchasePrice;
  }
  const futureSellingPrice = currentPrice * Math.pow(1 + scenario.priceGrowthRate / 100, years);
  
  // 未來交易成本
  const futureTransactionCosts = calculateTransactionCosts(futureSellingPrice);
  
  // 未來房地合一稅
  const futureCapitalGain = futureSellingPrice - property.purchasePrice;
  const futureTaxRate = getCapitalGainsTaxRate(currentHoldingYears + years);
  const futureCapitalGainsTax = futureCapitalGain > 0 ? futureCapitalGain * futureTaxRate : 0;
  
  // 總報酬
  const totalReturn = 
    totalRentalIncome - 
    totalHoldingCosts - 
    totalMortgagePayments +
    (futureSellingPrice - futureTransactionCosts - remainingFuture - futureCapitalGainsTax) -
    (property.purchasePrice - financial.loanAmount); // 減去初始投入
  
  // 年化報酬率
  const initialInvestment = property.purchasePrice - financial.loanAmount;
  const annualizedReturn = initialInvestment > 0
    ? (Math.pow((initialInvestment + totalReturn) / initialInvestment, 1 / years) - 1) * 100
    : 0;
  
  return {
    totalRentalIncome,
    totalHoldingCosts,
    totalMortgagePayments,
    principalRepaid,
    futureSellingPrice,
    futureTransactionCosts,
    futureCapitalGainsTax,
    totalReturn,
    annualizedReturn,
  };
}

/**
 * 計算損益兩平年數
 */
export function calculateBreakEvenYears(
  property: PropertyData,
  financial: FinancialData,
  scenario: ScenarioData,
  marketData: MarketData | null
): number | null {
  // 二分搜尋找損益兩平點
  for (let year = 1; year <= 30; year++) {
    const testScenario = { ...scenario, holdingPeriodYears: year };
    const sellNow = calculateSellNow(property, financial, testScenario, marketData);
    const holdAndRent = calculateHoldAndRent(property, financial, testScenario, marketData);
    
    // 找到持有開始優於出售的年份
    if (holdAndRent.totalReturn >= sellNow.totalReturn) {
      return year;
    }
  }
  
  return null; // 30 年內無法達到損益兩平
}

/**
 * 生成年度預測數據
 */
export function generateYearlyProjections(
  property: PropertyData,
  financial: FinancialData,
  scenario: ScenarioData,
  marketData: MarketData | null
): YearlyProjection[] {
  const projections: YearlyProjection[] = [];
  const sellNowBase = calculateSellNow(property, financial, { ...scenario, holdingPeriodYears: 0 }, marketData);
  const initialInvestment = property.purchasePrice - financial.loanAmount;
  
  for (let year = 0; year <= scenario.holdingPeriodYears; year++) {
    const testScenario = { ...scenario, holdingPeriodYears: year };
    
    if (year === 0) {
      // Year 0: 純獲利（不含再投資，因為還沒有時間再投資）
      projections.push({
        year: 0,
        sellNowCumulative: sellNowBase.pureProfit, // 用純獲利，不是淨收入
        holdAndRentCumulative: 0,
        rentalIncome: 0,
        holdingCosts: 0,
        propertyValue: property.purchasePrice,
      });
    } else {
      const holdResult = calculateHoldAndRent(property, financial, testScenario, marketData);
      // 再投資報酬 = 淨收入 × 複利成長（把賣房所得再投資）
      const reinvestmentReturn = sellNowBase.netProceeds * (
        Math.pow(1 + scenario.alternativeInvestmentReturn / 100, year) - 1
      );
      // 總報酬 = 純獲利 + 再投資報酬
      const sellNowTotalReturn = sellNowBase.pureProfit + reinvestmentReturn;
      
      projections.push({
        year,
        sellNowCumulative: sellNowTotalReturn, // 用修正後的總報酬
        holdAndRentCumulative: holdResult.totalReturn + initialInvestment,
        rentalIncome: holdResult.totalRentalIncome / year,
        holdingCosts: holdResult.totalHoldingCosts / year,
        propertyValue: holdResult.futureSellingPrice,
      });
    }
  }
  
  return projections;
}

/**
 * 完整分析計算
 */
export function calculateAnalysis(
  property: PropertyData,
  financial: FinancialData,
  scenario: ScenarioData,
  marketData: MarketData | null
): AnalysisResult {
  const sellNow = calculateSellNow(property, financial, scenario, marketData);
  const holdAndRent = calculateHoldAndRent(property, financial, scenario, marketData);
  const breakEvenYears = calculateBreakEvenYears(property, financial, scenario, marketData);
  const yearlyProjections = generateYearlyProjections(property, financial, scenario, marketData);
  
  // 決定建議
  let recommendation: 'sell' | 'hold' | 'neutral';
  const difference = holdAndRent.totalReturn - sellNow.totalReturn;
  const threshold = Math.abs(sellNow.totalReturn) * 0.05; // 5% 門檻
  
  if (difference > threshold) {
    recommendation = 'hold';
  } else if (difference < -threshold) {
    recommendation = 'sell';
  } else {
    recommendation = 'neutral';
  }
  
  return {
    sellNow,
    holdAndRent,
    recommendation,
    breakEvenYears,
    yearlyProjections,
  };
}
