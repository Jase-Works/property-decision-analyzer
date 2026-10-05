/**
 * ResultsPanel - 分析結果面板
 * 顯示「現在出售」vs「持有出租」兩種情境的財務分析結果
 */

import type { AnalysisResult } from '../../types';
import { ArrowRight, Building, Wallet, Calculator } from 'lucide-react';

interface ResultsPanelProps {
  result: AnalysisResult | null;
  holdingYears: number;
}

export function ResultsPanel({ result, holdingYears }: ResultsPanelProps) {
  if (!result) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>請填寫完整資料後開始分析</p>
          <p className="text-sm mt-1">系統將計算「現在出售」與「持有出租」兩種情境</p>
        </div>
      </div>
    );
  }

  const { sellNow, holdAndRent, recommendation, breakEvenYears } = result;
  const isSellBetter = recommendation === 'sell';

  return (
    <div className="space-y-6">
      {/* 建議卡片 */}
      <div className={`rounded-xl p-6 ${isSellBetter ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}>
        <div className="text-white">
          <p className="text-sm opacity-90 mb-1">AI 分析建議</p>
          <h3 className="text-2xl font-bold mb-2">
            {isSellBetter ? '🏠 建議現在出售' : '🔑 建議持有出租'}
          </h3>
          <p className="text-white/90">
            {isSellBetter 
              ? `在${holdingYears}年分析期間內，現在出售的總報酬較高`
              : `持有${holdingYears}年後出售可獲得更高的總報酬`
            }
          </p>
          {breakEvenYears !== null && (
            <p className="mt-2 text-sm text-white/80">
              💡 損益兩平點：約 {breakEvenYears.toFixed(1)} 年
            </p>
          )}
        </div>
      </div>

      {/* 情境比較 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 現在出售 */}
        <div className={`bg-white rounded-xl shadow-sm border-2 p-6 ${isSellBetter ? 'border-orange-400' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-orange-500" />
              現在出售
            </h3>
            {isSellBetter && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                推薦
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">預估售價</span>
              <span className="font-medium">{formatMoney(sellNow.estimatedSellingPrice)} 萬</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">交易成本</span>
              <span className="font-medium text-red-600">-{formatMoney(sellNow.transactionCosts)} 萬</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">清償貸款</span>
              <span className="font-medium text-red-600">-{formatMoney(sellNow.remainingLoan)} 萬</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">房地合一稅</span>
              <span className="font-medium text-red-600">-{formatMoney(sellNow.capitalGainsTax)} 萬</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-900 font-medium">淨收入（賣房後現金）</span>
                <span className="text-xl font-bold text-gray-900">{formatMoney(sellNow.netProceeds)} 萬</span>
              </div>
            </div>
            <div className="flex justify-between bg-red-50 -mx-6 px-6 py-2">
              <span className="text-gray-600">初始投入（頭期款）</span>
              <span className="font-medium text-red-600">-{formatMoney(sellNow.initialInvestment)} 萬</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-900 font-medium">純獲利</span>
                <span className={`text-lg font-bold ${sellNow.pureProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {sellNow.pureProfit >= 0 ? '+' : ''}{formatMoney(sellNow.pureProfit)} 萬
                </span>
              </div>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-gray-600">再投資報酬（{holdingYears}年）</span>
              <span className="font-medium text-green-600">+{formatMoney(sellNow.reinvestmentReturn)} 萬</span>
            </div>
            <div className="pt-3 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-3 -mb-6 rounded-b-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">總報酬</span>
                <span className={`text-2xl font-bold ${sellNow.totalReturn >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {sellNow.totalReturn >= 0 ? '' : ''}{formatMoney(sellNow.totalReturn)} 萬
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                年化報酬率：{sellNow.annualizedReturn.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* 持有出租 */}
        <div className={`bg-white rounded-xl shadow-sm border-2 p-6 ${!isSellBetter ? 'border-blue-400' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-500" />
              持有 {holdingYears} 年後出售
            </h3>
            {!isSellBetter && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                推薦
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">累計租金收入</span>
              <span className="font-medium text-green-600">+{formatMoney(holdAndRent.totalRentalIncome)} 萬</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">累計持有成本</span>
              <span className="font-medium text-red-600">-{formatMoney(holdAndRent.totalHoldingCosts)} 萬</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">累計房貸支出</span>
              <span className="font-medium text-red-600">-{formatMoney(holdAndRent.totalMortgagePayments)} 萬</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">預估未來售價</span>
                <span className="font-medium">{formatMoney(holdAndRent.futureSellingPrice)} 萬</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">未來交易成本</span>
              <span className="font-medium text-red-600">-{formatMoney(holdAndRent.futureTransactionCosts)} 萬</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">房地合一稅（{holdingYears}年後）</span>
              <span className="font-medium text-red-600">-{formatMoney(holdAndRent.futureCapitalGainsTax)} 萬</span>
            </div>
            <div className="pt-3 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-3 -mb-6 rounded-b-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">總報酬</span>
                <span className="text-2xl font-bold text-blue-600">{formatMoney(holdAndRent.totalReturn)} 萬</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                年化報酬率：{holdAndRent.annualizedReturn.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 差額說明 */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <ArrowRight className="w-5 h-5" />
          報酬差異分析
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg">
            <p className="text-sm text-gray-500 mb-1">報酬差額</p>
            <p className={`text-2xl font-bold ${Math.abs(sellNow.totalReturn - holdAndRent.totalReturn) > 0 ? (isSellBetter ? 'text-orange-600' : 'text-blue-600') : 'text-gray-600'}`}>
              {formatMoney(Math.abs(sellNow.totalReturn - holdAndRent.totalReturn))} 萬
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {isSellBetter ? '出售較佳' : '持有較佳'}
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <p className="text-sm text-gray-500 mb-1">年化報酬率差</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.abs(sellNow.annualizedReturn - holdAndRent.annualizedReturn).toFixed(2)}%
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <p className="text-sm text-gray-500 mb-1">現金流考量</p>
            <p className="text-lg font-bold text-gray-900">
              {holdAndRent.totalRentalIncome - holdAndRent.totalHoldingCosts - holdAndRent.totalMortgagePayments > 0 
                ? '租金正現金流' 
                : '租金負現金流'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              月均：{formatMoney((holdAndRent.totalRentalIncome - holdAndRent.totalHoldingCosts - holdAndRent.totalMortgagePayments) / holdingYears / 12 * 10000, 0)} 元
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatMoney(value: number, decimals: number = 1): string {
  return value.toLocaleString('zh-TW', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  });
}
