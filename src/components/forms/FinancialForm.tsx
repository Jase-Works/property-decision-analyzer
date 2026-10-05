/**
 * FinancialForm - 財務資料輸入表單
 * 讓使用者輸入貸款、成本、租金等財務相關資訊
 * 支援智慧預設值與進階設定摺疊功能
 */

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import type { FinancialData, PropertyData, MarketData } from '../../types';

interface FinancialFormProps {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
  propertyData?: PropertyData;
  marketData?: MarketData | null;
}

/**
 * 計算智慧預設值
 */
function getSmartDefaults(propertyData?: PropertyData, marketData?: MarketData | null): Partial<FinancialData> {
  const defaults: Partial<FinancialData> = {
    loanInterestRate: 2.1,      // 央行基準利率參考
    loanTerm: 30,                // 主流房貸年限
    vacancyRate: 5,              // 市場統計常見值
    annualInsurance: 3000,       // 住宅火險地震險
  };

  // 根據房產資料計算進階預設值
  if (propertyData) {
    // 管理費：每坪 100 元/月
    if (propertyData.area > 0) {
      defaults.monthlyManagementFee = Math.round(propertyData.area * 100);
    }

    // 房屋稅：約總價 0.1%（萬元轉元）
    if (propertyData.purchasePrice > 0) {
      defaults.annualPropertyTax = Math.round(propertyData.purchasePrice * 100); // 萬元 × 100 = 0.1% 轉元
    }

    // 地價稅：約總價 0.05%（萬元轉元）
    if (propertyData.purchasePrice > 0) {
      defaults.annualLandTax = Math.round(propertyData.purchasePrice * 50); // 萬元 × 50 = 0.05% 轉元
    }
  }

  // 從市場資料帶入預期月租金
  if (marketData?.averageRent && marketData.averageRent > 0) {
    defaults.expectedMonthlyRent = marketData.averageRent;
  }

  return defaults;
}

export function FinancialForm({ data, onChange, propertyData, marketData }: FinancialFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [defaultsApplied, setDefaultsApplied] = useState(false);

  // 當房產資料或市場資料變更時，自動填入智慧預設值
  useEffect(() => {
    const smartDefaults = getSmartDefaults(propertyData, marketData);
    let hasChanges = false;
    const newData = { ...data };

    // 只填入尚未設定的欄位
    Object.entries(smartDefaults).forEach(([key, value]) => {
      const field = key as keyof FinancialData;
      // 如果欄位是 0 或未設定，自動填入預設值
      if (value !== undefined && (!data[field] || data[field] === 0)) {
        (newData as Record<string, number>)[field] = value as number;
        hasChanges = true;
      }
    });

    if (hasChanges && !defaultsApplied) {
      onChange(newData);
      setDefaultsApplied(true);
    }
  }, [propertyData?.area, propertyData?.purchasePrice, marketData?.averageRent]);

  const handleChange = (field: keyof FinancialData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  // 取得智慧預設值用於提示
  const smartDefaults = getSmartDefaults(propertyData, marketData);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
        財務資料
      </h2>
      
      {/* 智慧預設值提示 */}
      <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">已自動填入市場合理預設值，您可依需求調整</span>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* 貸款資訊區塊 */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3 pb-2 border-b">貸款資訊</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 貸款金額 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                貸款金額（萬元） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={data.loanAmount || ''}
                onChange={(e) => handleChange('loanAmount', parseFloat(e.target.value) || 0)}
                placeholder="例如：1000"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 貸款利率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                貸款利率（%）
              </label>
              <input
                type="number"
                value={data.loanInterestRate || ''}
                onChange={(e) => handleChange('loanInterestRate', parseFloat(e.target.value) || 0)}
                placeholder={`預設 ${smartDefaults.loanInterestRate}%`}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                央行基準利率參考
              </p>
            </div>

            {/* 貸款年限 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                貸款年限（年）
              </label>
              <input
                type="number"
                value={data.loanTerm || ''}
                onChange={(e) => handleChange('loanTerm', parseInt(e.target.value) || 0)}
                placeholder={`預設 ${smartDefaults.loanTerm} 年`}
                min="1"
                max="40"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* 月供試算 */}
          {data.loanAmount > 0 && data.loanInterestRate > 0 && data.loanTerm > 0 && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                預估月供：
                <span className="font-semibold text-gray-900 ml-1">
                  {calculateMonthlyPayment(data.loanAmount, data.loanInterestRate, data.loanTerm).toLocaleString()} 元
                </span>
              </p>
            </div>
          )}
        </div>

        {/* 持有成本區塊（精簡版） */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3 pb-2 border-b">持有成本</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 管理費 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                每月管理費（元）
              </label>
              <input
                type="number"
                value={data.monthlyManagementFee || ''}
                onChange={(e) => handleChange('monthlyManagementFee', parseInt(e.target.value) || 0)}
                placeholder={smartDefaults.monthlyManagementFee ? `預設 ${smartDefaults.monthlyManagementFee.toLocaleString()}` : '例如：3000'}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                依坪數×100 元估算
              </p>
            </div>

            {/* 房屋稅 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                年房屋稅（元）
              </label>
              <input
                type="number"
                value={data.annualPropertyTax || ''}
                onChange={(e) => handleChange('annualPropertyTax', parseInt(e.target.value) || 0)}
                placeholder={smartDefaults.annualPropertyTax ? `預設 ${smartDefaults.annualPropertyTax.toLocaleString()}` : '例如：12000'}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                約總價 0.1%
              </p>
            </div>

            {/* 地價稅 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                年地價稅（元）
              </label>
              <input
                type="number"
                value={data.annualLandTax || ''}
                onChange={(e) => handleChange('annualLandTax', parseInt(e.target.value) || 0)}
                placeholder={smartDefaults.annualLandTax ? `預設 ${smartDefaults.annualLandTax.toLocaleString()}` : '例如：5000'}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                約總價 0.05%
              </p>
            </div>
          </div>
        </div>

        {/* 租金收入區塊 */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3 pb-2 border-b">租金收入</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 預期月租金 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                預期月租金（元）
              </label>
              <input
                type="number"
                value={data.expectedMonthlyRent || ''}
                onChange={(e) => handleChange('expectedMonthlyRent', parseInt(e.target.value) || 0)}
                placeholder={smartDefaults.expectedMonthlyRent ? `預設 ${smartDefaults.expectedMonthlyRent.toLocaleString()}` : '例如：25000'}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {marketData?.averageRent && (
                <p className="text-xs text-blue-600 mt-1">
                  📊 市場行情：{marketData.averageRent.toLocaleString()} 元/月
                </p>
              )}
            </div>

            {/* 空置率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                預估空置率（%）
              </label>
              <input
                type="number"
                value={data.vacancyRate || ''}
                onChange={(e) => handleChange('vacancyRate', parseFloat(e.target.value) || 0)}
                placeholder={`預設 ${smartDefaults.vacancyRate}%`}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                一般住宅建議 5-10%
              </p>
            </div>
          </div>

          {/* 年租金收入試算 */}
          {data.expectedMonthlyRent > 0 && (
            <div className="mt-2 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">
                預估年租金收入：
                <span className="font-semibold text-green-700 ml-1">
                  {Math.round(data.expectedMonthlyRent * 12 * (1 - (data.vacancyRate || 0) / 100)).toLocaleString()} 元
                </span>
                <span className="text-gray-500 ml-1">（扣除空置）</span>
              </p>
            </div>
          )}
        </div>

        {/* 進階設定（可摺疊） */}
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showAdvanced ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            進階設定
          </button>

          {showAdvanced && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 保險費 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    年保險費（元）
                  </label>
                  <input
                    type="number"
                    value={data.annualInsurance || ''}
                    onChange={(e) => handleChange('annualInsurance', parseInt(e.target.value) || 0)}
                    placeholder={`預設 ${smartDefaults.annualInsurance?.toLocaleString()}`}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    住宅火險地震險參考
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 計算月供金額（本息均攤）
 */
function calculateMonthlyPayment(loanAmount: number, interestRate: number, years: number): number {
  const principal = loanAmount * 10000; // 轉換為元
  const monthlyRate = interestRate / 100 / 12;
  const months = years * 12;
  
  if (monthlyRate === 0) {
    return Math.round(principal / months);
  }
  
  const payment = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / 
                  (Math.pow(1 + monthlyRate, months) - 1);
  
  return Math.round(payment);
}
