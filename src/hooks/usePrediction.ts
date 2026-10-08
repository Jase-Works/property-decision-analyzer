/**
 * usePrediction - 房價/租金預測 Hook
 * 管理總體經濟假設、情境切換、時間範圍選擇
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  MacroAssumptions,
  PredefinedScenario,
  PredictionHorizon,
  PredictionResult,
} from '../types/prediction';
import type { MarketData, ScenarioData } from '../types';
import {
  generatePrediction,
  getScenarioAssumptions,
  getLatestEconomicData,
} from '../utils/predictor';

interface UsePredictionProps {
  city: string;
  district: string;
  currentPricePerPing: number;
  currentMonthlyRent: number;
  propertyArea: number;
  /** 使用者輸入的情境假設（可選），若提供則會覆蓋成長率 */
  scenarioData?: ScenarioData;
}

interface UsePredictionReturn {
  /** 預測結果 */
  prediction: PredictionResult | null;
  /** 目前選擇的情境 */
  scenario: PredefinedScenario;
  /** 目前的總體經濟假設 */
  assumptions: MacroAssumptions;
  /** 目前的預測時間範圍 */
  horizon: PredictionHorizon;
  /** 是否正在計算 */
  isCalculating: boolean;
  /** 錯誤訊息 */
  error: string | null;
  /** 最新經濟數據（用於顯示） */
  latestEconomicData: ReturnType<typeof getLatestEconomicData>;
  /** 是否正在使用 scenarioData 的成長率覆蓋 */
  isUsingScenarioOverrides: boolean;
  /** 切換情境 */
  setScenario: (scenario: PredefinedScenario) => void;
  /** 更新假設 */
  updateAssumptions: (updates: Partial<MacroAssumptions>) => void;
  /** 重設為預設假設 */
  resetAssumptions: () => void;
  /** 設定預測時間範圍 */
  setHorizon: (horizon: PredictionHorizon) => void;
  /** 重新計算預測 */
  recalculate: () => void;
}

/**
 * 從 scenarioData 建立包含成長率覆蓋的 MacroAssumptions
 */
function createAssumptionsWithOverrides(
  baseAssumptions: MacroAssumptions,
  scenarioData?: ScenarioData
): MacroAssumptions {
  if (!scenarioData) {
    return baseAssumptions;
  }
  
  return {
    ...baseAssumptions,
    // 使用 scenarioData 的成長率作為覆蓋值
    priceGrowthRateOverride: scenarioData.priceGrowthRate,
    rentGrowthRateOverride: scenarioData.rentGrowthRate,
  };
}

export function usePrediction(props: UsePredictionProps): UsePredictionReturn {
  const { city, district, currentPricePerPing, currentMonthlyRent, propertyArea, scenarioData } = props;

  // 狀態
  const [scenario, setScenarioState] = useState<PredefinedScenario>('baseline');
  const [assumptions, setAssumptions] = useState<MacroAssumptions>(() => {
    const baseAssumptions = getScenarioAssumptions('baseline');
    return createAssumptionsWithOverrides(baseAssumptions, scenarioData);
  });
  const [horizon, setHorizonState] = useState<PredictionHorizon>(3);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 取得最新經濟數據
  const latestEconomicData = useMemo(() => getLatestEconomicData(), []);

  // 判斷是否正在使用 scenarioData 的覆蓋值
  const isUsingScenarioOverrides = useMemo(() => {
    return !!(
      scenarioData &&
      (assumptions.priceGrowthRateOverride !== undefined ||
        assumptions.rentGrowthRateOverride !== undefined)
    );
  }, [scenarioData, assumptions.priceGrowthRateOverride, assumptions.rentGrowthRateOverride]);

  // 當 scenarioData 變更時，同步更新假設中的成長率覆蓋
  useEffect(() => {
    if (scenarioData) {
      setAssumptions(prev => ({
        ...prev,
        priceGrowthRateOverride: scenarioData.priceGrowthRate,
        rentGrowthRateOverride: scenarioData.rentGrowthRate,
      }));
    }
  }, [scenarioData?.priceGrowthRate, scenarioData?.rentGrowthRate]);

  // 執行預測計算
  const calculatePrediction = useCallback(() => {
    // 驗證輸入
    if (!city || !district) {
      setError('請先選擇縣市和區域');
      setPrediction(null);
      return;
    }
    if (!currentPricePerPing || currentPricePerPing <= 0) {
      setError('請輸入有效的房價資料');
      setPrediction(null);
      return;
    }
    if (!currentMonthlyRent || currentMonthlyRent <= 0) {
      setError('請輸入有效的租金資料');
      setPrediction(null);
      return;
    }
    if (!propertyArea || propertyArea <= 0) {
      setError('請輸入有效的坪數');
      setPrediction(null);
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const result = generatePrediction(
        city,
        district,
        currentPricePerPing,
        currentMonthlyRent,
        propertyArea,
        horizon,
        assumptions,
        scenario
      );
      setPrediction(result);
    } catch (err) {
      console.error('Prediction calculation error:', err);
      setError('預測計算發生錯誤');
      setPrediction(null);
    } finally {
      setIsCalculating(false);
    }
  }, [city, district, currentPricePerPing, currentMonthlyRent, propertyArea, horizon, assumptions, scenario]);

  // 切換情境
  const setScenario = useCallback((newScenario: PredefinedScenario) => {
    setScenarioState(newScenario);
    if (newScenario !== 'custom') {
      setAssumptions(getScenarioAssumptions(newScenario));
    }
  }, []);

  // 更新假設（自動切換到 custom 情境）
  const updateAssumptions = useCallback((updates: Partial<MacroAssumptions>) => {
    setAssumptions(prev => ({ ...prev, ...updates }));
    setScenarioState('custom');
  }, []);

  // 重設為預設假設
  const resetAssumptions = useCallback(() => {
    setAssumptions(getScenarioAssumptions('baseline'));
    setScenarioState('baseline');
  }, []);

  // 設定時間範圍
  const setHorizon = useCallback((newHorizon: PredictionHorizon) => {
    setHorizonState(newHorizon);
  }, []);

  // 重新計算
  const recalculate = useCallback(() => {
    calculatePrediction();
  }, [calculatePrediction]);

  return {
    prediction,
    scenario,
    assumptions,
    horizon,
    isCalculating,
    error,
    latestEconomicData,
    isUsingScenarioOverrides,
    setScenario,
    updateAssumptions,
    resetAssumptions,
    setHorizon,
    recalculate,
  };
}

/**
 * 簡化版 Hook，用於只需要顯示預測結果的情境
 */
export function usePredictionSimple(
  marketData: MarketData | null,
  propertyArea: number
): {
  prediction: PredictionResult | null;
  isReady: boolean;
} {
  const city = marketData?.city || '';
  const district = marketData?.district || '';
  const pricePerPing = marketData?.averagePrice || 0;
  const monthlyRent = marketData?.averageRent || 0;

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  // 當市場資料變更時自動計算
  useMemo(() => {
    if (!city || !district || !pricePerPing || !monthlyRent || !propertyArea) {
      setPrediction(null);
      return;
    }

    try {
      const result = generatePrediction(
        city,
        district,
        pricePerPing,
        monthlyRent,
        propertyArea,
        3, // 預設 3 年
        getScenarioAssumptions('baseline'),
        'baseline'
      );
      setPrediction(result);
    } catch (err) {
      console.error('Prediction calculation error:', err);
      setPrediction(null);
    }
  }, [city, district, pricePerPing, monthlyRent, propertyArea]);

  const isReady = !!prediction && !!marketData;

  return { prediction, isReady };
}
