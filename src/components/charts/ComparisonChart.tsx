/**
 * ComparisonChart - 情境比較圖表
 * 使用 Recharts 繪製「現在出售」vs「持有出租」的累積報酬比較圖
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { AnalysisResult } from '../../types';

interface ComparisonChartProps {
  result: AnalysisResult | null;
  holdingYears: number;
}

interface ChartDataPoint {
  year: number;
  sellNow: number;
  holdAndRent: number;
}

export function ComparisonChart({ result, holdingYears }: ComparisonChartProps) {
  if (!result) {
    return null;
  }

  // 生成每年的數據點
  const chartData: ChartDataPoint[] = generateChartData(result, holdingYears);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📈 累積報酬比較
      </h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="year"
              tickFormatter={(value) => `第${value}年`}
              stroke="#666"
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => `${value}萬`}
              stroke="#666"
              fontSize={12}
            />
            <Tooltip
              labelFormatter={(label) => `第 ${label} 年`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <Legend
              formatter={(value) => (value === 'sellNow' ? '現在出售（再投資）' : '持有出租')}
            />
            
            {/* 損益兩平線 */}
            {result.breakEvenYears !== null && (
              <ReferenceLine
                x={Math.round(result.breakEvenYears)}
                stroke="#9ca3af"
                strokeDasharray="5 5"
                label={{
                  value: '損益兩平',
                  position: 'top',
                  fill: '#6b7280',
                  fontSize: 12,
                }}
              />
            )}
            
            <Line
              type="monotone"
              dataKey="sellNow"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#f97316' }}
              name="sellNow"
            />
            <Line
              type="monotone"
              dataKey="holdAndRent"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#3b82f6' }}
              name="holdAndRent"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span>現在出售：淨收入投入替代投資（如 ETF）的累積報酬</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>持有出租：租金收入 - 持有成本 + 房價增值</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 生成圖表數據點
 * 計算每年的累積報酬
 */
function generateChartData(result: AnalysisResult, holdingYears: number): ChartDataPoint[] {
  const { sellNow, holdAndRent, yearlyProjections } = result;
  const data: ChartDataPoint[] = [];

  // 第 0 年（當下）
  data.push({
    year: 0,
    sellNow: sellNow.netProceeds, // 現在出售的淨收入
    holdAndRent: 0, // 持有尚未產生報酬
  });

  // 如果有詳細的年度預測，使用它
  if (yearlyProjections && yearlyProjections.length > 0) {
    yearlyProjections.forEach((proj, index) => {
      data.push({
        year: index + 1,
        sellNow: proj.sellNowCumulative,
        holdAndRent: proj.holdAndRentCumulative,
      });
    });
  } else {
    // 否則使用線性插值
    const sellNowYearlyReturn = (sellNow.totalReturn - sellNow.netProceeds) / holdingYears;
    const holdAndRentYearlyReturn = holdAndRent.totalReturn / holdingYears;

    for (let year = 1; year <= holdingYears; year++) {
      data.push({
        year,
        sellNow: sellNow.netProceeds + sellNowYearlyReturn * year,
        holdAndRent: holdAndRentYearlyReturn * year,
      });
    }
  }

  return data;
}
