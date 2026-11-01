import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { History, TrendingDown, Info } from 'lucide-react';
import type { HistoricalReading } from '../../types';
import { calculateRiskScore } from '../../utils';

interface HistoricalRiskChartProps {
  data: HistoricalReading[];
}

export const HistoricalRiskChart: React.FC<HistoricalRiskChartProps> = ({ data }) => {
  const chartData = data.map((reading) => {
    const date = new Date(reading.timestamp);
    // Explicitly derive each historical score from its corresponding temperature, humidity,
    // and MQ135 raw ADC reading using the shared calculateRiskScore() formula function
    const riskScore = calculateRiskScore(reading.temperature, reading.humidity, reading.mq135Raw);
    return {
      timestamp: reading.timestamp,
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      riskScore,
    };
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs" data-testid="historical-risk-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              24-Hour Risk Index History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical environmental risk calculated locally from ESP32 telemetry records
            </p>
          </div>
        </div>

        {/* Legend Badges */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            ≤ 30 Safe Limit
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            &gt; 30 and ≤ 60 Moderate
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            &gt; 60 Danger Limit
          </span>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-72 sm:h-80 w-full pt-4" data-testid="historical-risk-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="analyticsRiskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              minTickGap={25}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#0f172a',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
              }}
              formatter={(value) => [`${value} / 100`, 'Risk Score (Locally calculated)']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            {/* Safe Classification Limit (30) */}
            <ReferenceLine
              y={30}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Safe Threshold (30)',
                fill: '#b45309',
                fontSize: 10,
                position: 'insideTopLeft',
              }}
            />
            {/* Danger Classification Limit (60) */}
            <ReferenceLine
              y={60}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Danger Threshold (60)',
                fill: '#b91c1c',
                fontSize: 10,
                position: 'insideTopLeft',
              }}
            />
            <Area
              type="monotone"
              dataKey="riskScore"
              name="Risk Score"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#analyticsRiskGrad)"
              activeDot={{ r: 5, strokeWidth: 0, fill: '#059669' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 mt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
          <span>Storage conditions remained stable throughout the 24-hour observation window.</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Info className="w-3 h-3" />
          <span>Simulated historical demonstration data</span>
        </div>
      </div>
    </div>
  );
};
