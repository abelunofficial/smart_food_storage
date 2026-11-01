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
import type { HistoricalReading } from '../../types';
import { calculateRiskScore } from '../../utils';

interface RiskTrendChartProps {
  data: HistoricalReading[];
}

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ data }) => {
  const chartData = data.map((reading) => {
    const date = new Date(reading.timestamp);
    const riskScore = calculateRiskScore(reading.temperature, reading.humidity, reading.mq135Raw);
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      riskScore,
    };
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Storage Environmental Risk Index (24h)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Firmware formula output over 24 hours with classification thresholds (does not prove food spoilage)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ≤ 30 Safe
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            &gt; 30 &amp; ≤ 60 Moderate
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            &gt; 60 Danger
          </span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full" data-testid="risk-trend-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
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
              formatter={(value) => [`${value} / 100`, 'Risk Index (Locally calculated)']}
            />
            {/* Classification Threshold Reference Lines */}
            <ReferenceLine
              y={30}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{ value: 'Safe Limit (30)', fill: '#d97706', fontSize: 10, position: 'insideTopLeft' }}
            />
            <ReferenceLine
              y={60}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: 'Danger Limit (60)', fill: '#dc2626', fontSize: 10, position: 'insideTopLeft' }}
            />
            <Area
              type="monotone"
              dataKey="riskScore"
              name="Risk Score"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#riskAreaGrad)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
