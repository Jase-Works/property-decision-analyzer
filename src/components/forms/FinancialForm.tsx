/**
 * FinancialForm - 財務資料輸入表單
 * 讓使用者輸入貸款、成本、租金等財務相關資訊
 */

import type { FinancialData } from '../../types';

interface FinancialFormProps {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
}

export function FinancialForm({ data, onChange }: FinancialFormProps) {
  const handleChange = (field: keyof FinancialData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
        財務資料
      </h2>
      
      <div className="space-y-6">
        {/* 貸款資訊區塊 */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3 pb-2 border-b">貸款資訊</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 貸款金額 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                貸款金額（萬元）
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
                placeholder="例如：2.1"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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
                placeholder="例如：30"
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

        {/* 成本費用區塊 */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3 pb-2 border-b">持有成本</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 管理費 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                每月管理費（元）
              </label>
              <input
                type="number"
                value={data.monthlyManagementFee || ''}
                onChange={(e) => handleChange('monthlyManagementFee', parseInt(e.target.value) || 0)}
                placeholder="例如：3000"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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
                placeholder="例如：12000"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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
                placeholder="例如：5000"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 保險費 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                年保險費（元）
              </label>
              <input
                type="number"
                value={data.annualInsurance || ''}
                onChange={(e) => handleChange('annualInsurance', parseInt(e.target.value) || 0)}
                placeholder="例如：3000"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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
                placeholder="例如：25000"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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
                placeholder="例如：5"
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
