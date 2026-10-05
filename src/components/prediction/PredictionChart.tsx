/**
 * PredictionChart - 房價/租金走勢預測圖表
 * 使用 recharts 繪製含信心區間的預測圖
 */

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { YearlyPrediction } from '../../types/prediction';

interface PredictionChartProps {
  historical: YearlyPrediction[];
  predicted: YearlyPrediction[];
  chartType: 'price' | 'rent';
  currentYear: number;
}

interface ChartDataPoint {
  year: number;
  value: number | null;
  predictedValue: number | null;
  confidenceLower: number | null;
  confidenceUpper: number | null;
  confidenceRange: [number, number] | null;
  isHistorical: boolean;
}

export function PredictionChart({
  historical,
  predicted,
  chartType,
  currentYear,
}: PredictionChartProps) {
  // 合併歷史和預測資料
  const chartData: ChartDataPoint[] = [];

  // 加入歷史資料
  historical.forEach((item) => {
    chartData.push({
      year: item.year,
      value: chartType === 'price' ? item.priceValue : item.rentValue,
      predictedValue: null,
      confidenceLower: null,
      confidenceUpper: null,
      confidenceRange: null,
      isHistorical: true,
    });
  });

  // 加入連接點（今年）
  if (historical.length > 0) {
    const lastHistorical = historical[historical.length - 1];
    const currentValue = chartType === 'price' ? lastHistorical.priceValue : lastHistorical.rentValue;
    
    // 更新最後一個歷史點，同時也是預測起點
    if (chartData.length > 0) {
      const lastIndex = chartData.length - 1;
      chartData[lastIndex].predictedValue = currentValue;
    }
  }

  // 加入預測資料
  predicted.forEach((item) => {
    const value = chartType === 'price' ? item.priceValue : item.rentValue;
    const lower = chartType === 'price' ? item.priceConfidenceLower : item.rentConfidenceLower;
    const upper = chartType === 'price' ? item.priceConfidenceUpper : item.rentConfidenceUpper;

    chartData.push({
      year: item.year,
      value: null,
      predictedValue: value,
      confidenceLower: lower,
      confidenceUpper: upper,
      confidenceRange: [lower, upper],
      isHistorical: false,
    });
  });

  // 格式化工具提示
  const formatValue = (value: number) => {
    if (chartType === 'price') {
      return `${value.toFixed(1)} 萬/坪`;
    }
    return `${Math.round(value).toLocaleString()} 元/月`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const dataPoint = chartData.find((d) => d.year === label);
    if (!dataPoint) return null;

    const isHistorical = dataPoint.isHistorical;
    const displayValue = dataPoint.value ?? dataPoint.predictedValue;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-gray-900 mb-1">{label} 年</p>
        <p className={isHistorical ? 'text-blue-600' : 'text-purple-600'}>
          {isHistorical ? '實際值' : '預測值'}：{displayValue !== null ? formatValue(displayValue) : '-'}
        </p>
        {!isHistorical && dataPoint.confidenceLower && dataPoint.confidenceUpper && (
          <p className="text-gray-500 text-xs mt-1">
            95% 信心區間：{formatValue(dataPoint.confidenceLower)} ~ {formatValue(dataPoint.confidenceUpper)}
          </p>
        )}
      </div>
    );
  };

  // Y 軸格式化
  const formatYAxis = (value: number) => {
    if (chartType === 'price') {
      return `${value.toFixed(0)}`;
    }
    return `${(value / 1000).toFixed(0)}K`;
  };

  // 計算 Y 軸範圍
  const allValues = chartData
    .flatMap((d) => [d.value, d.predictedValue, d.confidenceLower, d.confidenceUpper])
    .filter((v): v is number => v !== null);
  
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
            tickFormatter={formatYAxis}
            domain={[
              Math.max(0, minValue - padding),
              maxValue + padding,
            ]}
            label={{
              value: chartType === 'price' ? '萬/坪' : '元/月',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: 12, fill: '#6b7280' },
            }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(value) => <span className="text-xs">{value}</span>}
          />

          {/* 信心區間陰影 */}
          <Area
            dataKey="confidenceRange"
            stroke="none"
            fill="#c4b5fd"
            fillOpacity={0.3}
            name="95% 信心區間"
            connectNulls={false}
          />

          {/* 歷史實際值線 */}
          <Line
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 4, fill: '#2563eb' }}
            activeDot={{ r: 6 }}
            name="歷史實際值"
            connectNulls={false}
          />

          {/* 預測中線 */}
          <Line
            dataKey="predictedValue"
            stroke="#7c3aed"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: '#7c3aed' }}
            activeDot={{ r: 6 }}
            name="預測值"
            connectNulls={true}
          />

          {/* 今日標記線 */}
          <ReferenceLine
            x={currentYear}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{
              value: '今日',
              position: 'top',
              fill: '#ef4444',
              fontSize: 12,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
