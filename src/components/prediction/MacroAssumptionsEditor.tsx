/**
 * MacroAssumptionsEditor - 總體經濟假設調整器
 * 提供 Slider 調整、情境切換、重設功能
 */

import { RotateCcw, Info } from 'lucide-react';
import type { MacroAssumptions, PredefinedScenario } from '../../types/prediction';
import { PREDEFINED_SCENARIOS } from '../../utils/predictor';

interface MacroAssumptionsEditorProps {
  assumptions: MacroAssumptions;
  scenario: PredefinedScenario;
  latestEconomicData: {
    cpiGrowthRate: number;
    salaryGrowthRate: number;
    populationGrowthRate: number;
    lastUpdated: string;
  };
  onAssumptionChange: (updates: Partial<MacroAssumptions>) => void;
  onScenarioChange: (scenario: PredefinedScenario) => void;
  onReset: () => void;
}

// Slider 範圍設定
const ASSUMPTION_BOUNDS = {
  cpiGrowthRate: { min: -2, max: 8, step: 0.1 },
  salaryGrowthRate: { min: -2, max: 10, step: 0.1 },
  populationGrowthRate: { min: -2, max: 2, step: 0.1 },
};

export function MacroAssumptionsEditor({
  assumptions,
  scenario,
  latestEconomicData,
  onAssumptionChange,
  onScenarioChange,
  onReset,
}: MacroAssumptionsEditorProps) {
  const scenarios: Array<{ key: PredefinedScenario; label: string; color: string }> = [
    { key: 'optimistic', label: '樂觀', color: 'bg-green-100 text-green-700 border-green-300' },
    { key: 'baseline', label: '基準', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { key: 'pessimistic', label: '悲觀', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { key: 'custom', label: '自訂', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  ];

  return (
    <div className="space-y-4">
      {/* 情境選擇 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          預設情境
        </label>
        <div className="flex flex-wrap gap-2">
          {scenarios.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => onScenarioChange(key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                scenario === key
                  ? `${color} border-2`
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {scenario !== 'custom' && PREDEFINED_SCENARIOS[scenario] && (
          <p className="text-xs text-gray-500 mt-1">
            {PREDEFINED_SCENARIOS[scenario].description}
          </p>
        )}
      </div>

      {/* 假設調整 Sliders */}
      <div className="space-y-4 pt-2">
        {/* 通膨率 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              通膨率 (年均)
            </label>
            <span className="text-sm font-bold text-gray-900">
              {assumptions.cpiGrowthRate.toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min={ASSUMPTION_BOUNDS.cpiGrowthRate.min}
            max={ASSUMPTION_BOUNDS.cpiGrowthRate.max}
            step={ASSUMPTION_BOUNDS.cpiGrowthRate.step}
            value={assumptions.cpiGrowthRate}
            onChange={(e) =>
              onAssumptionChange({ cpiGrowthRate: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>-2%</span>
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              實際 {latestEconomicData.cpiGrowthRate.toFixed(1)}% (主計總處 {latestEconomicData.lastUpdated})
            </span>
            <span>8%</span>
          </div>
        </div>

        {/* 薪資成長率 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              薪資成長率 (年均)
            </label>
            <span className="text-sm font-bold text-gray-900">
              {assumptions.salaryGrowthRate.toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min={ASSUMPTION_BOUNDS.salaryGrowthRate.min}
            max={ASSUMPTION_BOUNDS.salaryGrowthRate.max}
            step={ASSUMPTION_BOUNDS.salaryGrowthRate.step}
            value={assumptions.salaryGrowthRate}
            onChange={(e) =>
              onAssumptionChange({ salaryGrowthRate: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>-2%</span>
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              近 3 年平均 {latestEconomicData.salaryGrowthRate.toFixed(1)}%
            </span>
            <span>10%</span>
          </div>
        </div>

        {/* 人口變化率 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              人口變化率 (年均)
            </label>
            <span className="text-sm font-bold text-gray-900">
              {assumptions.populationGrowthRate >= 0 ? '+' : ''}
              {assumptions.populationGrowthRate.toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min={ASSUMPTION_BOUNDS.populationGrowthRate.min}
            max={ASSUMPTION_BOUNDS.populationGrowthRate.max}
            step={ASSUMPTION_BOUNDS.populationGrowthRate.step}
            value={assumptions.populationGrowthRate}
            onChange={(e) =>
              onAssumptionChange({ populationGrowthRate: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>-2%</span>
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              近 3 年平均 {latestEconomicData.populationGrowthRate.toFixed(2)}%
            </span>
            <span>+2%</span>
          </div>
        </div>
      </div>

      {/* 重設按鈕 */}
      <div className="pt-2">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          重設為基準情境
        </button>
      </div>

      {/* 提示 */}
      <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
        💡 調整假設後會即時更新預測結果。選擇預設情境可快速比較不同經濟環境下的房價走勢。
      </div>
    </div>
  );
}
