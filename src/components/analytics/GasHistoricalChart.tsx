import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Activity, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { GasHistoricalPoint } from '../../types/spoilage.ts';

interface GasHistoricalChartProps {
  data: GasHistoricalPoint[];
  baseline: number | null;
  warningThresholdPercent?: number;
}

export const GasHistoricalChart: React.FC<GasHistoricalChartProps> = ({
  data,
  baseline,
  warningThresholdPercent = 15,
}) => {
  const chartData = data.map((pt) => {
    const time = new Date(pt.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return {
      time,
      rawGas: pt.rawGas,
      temperature: pt.temperature,
      humidity: pt.humidity,
      deviation: pt.deviationPercent,
      isStale: pt.isStale,
      direction: pt.direction,
      signedDifference: pt.signedDifference,
      isDemo: pt.isDemo,
    };
  });

  // Calculate upper/lower deviation reference levels if baseline exists
  const upperWarning = baseline ? Math.round(baseline * (1 + warningThresholdPercent / 100)) : null;
  const lowerWarning = baseline ? Math.max(0, Math.round(baseline * (1 - warningThresholdPercent / 100))) : null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/70">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Chamber Gas Trend vs. Baseline
              </h3>
              <p className="text-xs text-slate-500">
                MQ135 raw ADC counts over time relative to calibrated fresh-food baseline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{chartData.length} recorded samples</span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <Activity className="w-8 h-8 text-slate-300 mb-2" />
            <span className="text-xs font-semibold text-slate-600">No telemetry recorded yet</span>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
              Valid readings from Virtual Pin V2 will be recorded automatically as telemetry arrives.
            </p>
          </div>
        ) : (
          <div className="h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  domain={['dataMin - 100', 'dataMax + 100']}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-slate-200 shadow-md text-xs space-y-1">
                          <div className="font-semibold text-slate-800 pb-1 border-b border-slate-100 flex items-center justify-between gap-4">
                            <span>{item.time}</span>
                            <div className="flex items-center gap-1.5">
                              {item.isDemo && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  [DEMO]
                                </span>
                              )}
                              {item.isStale && (
                                <span className="text-[10px] text-amber-600 font-normal">Cached</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-4 font-mono">
                            <span className="text-purple-700">Raw Gas (V2):</span>
                            <span className="font-bold text-slate-900">{item.rawGas} ADC</span>
                          </div>
                          {baseline !== null && (
                            <div className="flex items-center justify-between gap-4 font-mono text-slate-600">
                              <span>Baseline:</span>
                              <span>{baseline} ADC</span>
                            </div>
                          )}
                          {item.signedDifference !== null && item.signedDifference !== undefined && (
                            <div className="flex items-center justify-between gap-4 font-mono text-slate-700">
                              <span>Gas Shift (G-B):</span>
                              <span className="font-bold flex items-center gap-1">
                                {item.signedDifference > 0 ? `+${item.signedDifference}` : item.signedDifference} ADC
                                {item.direction === 'increased' && <TrendingUp className="w-3 h-3 text-amber-600 inline" />}
                                {item.direction === 'decreased' && <TrendingDown className="w-3 h-3 text-sky-600 inline" />}
                                {item.direction === 'unchanged' && <Minus className="w-3 h-3 text-slate-400 inline" />}
                              </span>
                            </div>
                          )}
                          {item.deviation !== null && item.deviation !== undefined && (
                            <div className="flex items-center justify-between gap-4 font-mono text-purple-700">
                              <span>Deviation (D):</span>
                              <span className="font-bold">{item.deviation}%</span>
                            </div>
                          )}
                          {item.temperature !== undefined && (
                            <div className="flex items-center justify-between gap-4 font-mono text-slate-500 text-[11px] pt-0.5 border-t border-slate-100">
                              <span>Context:</span>
                              <span>{item.temperature}°C / {item.humidity}% RH</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={28}
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '4px' }}
                />
                {baseline !== null && (
                  <ReferenceLine
                    y={baseline}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value: `Baseline: ${baseline}`,
                      position: 'insideTopRight',
                      fill: '#059669',
                      fontSize: 10,
                    }}
                  />
                )}
                {upperWarning !== null && (
                  <ReferenceLine
                    y={upperWarning}
                    stroke="#f59e0b"
                    strokeDasharray="2 2"
                    strokeOpacity={0.7}
                  />
                )}
                {lowerWarning !== null && (
                  <ReferenceLine
                    y={lowerWarning}
                    stroke="#f59e0b"
                    strokeDasharray="2 2"
                    strokeOpacity={0.7}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="rawGas"
                  name="Raw Gas (MQ135 ADC)"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#8b5cf6' }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Green dashed line: Confirmed Fresh-Food Baseline (B)</span>
        <span>Amber dashed: ±{warningThresholdPercent}% Warning Band</span>
      </div>
    </div>
  );
};
