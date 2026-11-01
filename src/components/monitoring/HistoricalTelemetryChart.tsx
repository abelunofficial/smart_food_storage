import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { HistoricalReading, TelemetryTimeRange } from '../../types';

interface HistoricalTelemetryChartProps {
  data: HistoricalReading[];
  timeRange: TelemetryTimeRange;
  onTimeRangeChange: (range: TelemetryTimeRange) => void;
  loading?: boolean;
}

export const HistoricalTelemetryChart: React.FC<HistoricalTelemetryChartProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
  loading = false,
}) => {
  const chartData = data.map((reading) => {
    const date = new Date(reading.timestamp);
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: reading.temperature,
      humidity: reading.humidity,
      gasRaw: reading.mq135Raw,
    };
  });

  const timeRanges: Array<{ id: TelemetryTimeRange; label: string }> = [
    { id: '1h', label: '1 Hour' },
    { id: '6h', label: '6 Hours' },
    { id: '24h', label: '24 Hours' },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Environmental Telemetry History
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Temperature (°C) and Humidity (% RH) logged across selected interval
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-center">
          {timeRanges.map((range) => {
            const isSelected = timeRange === range.id;
            return (
              <button
                key={range.id}
                type="button"
                onClick={() => onTimeRangeChange(range.id)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  isSelected
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                aria-pressed={isSelected}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-72 sm:h-80 w-full relative" data-testid="live-telemetry-chart">
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
            <span className="text-xs font-medium text-slate-500">Updating timeline...</span>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              minTickGap={20}
            />
            {/* Left Y-Axis: Temperature */}
            <YAxis
              yAxisId="temp"
              orientation="left"
              stroke="#0284c7"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              unit="°"
            />
            {/* Right Y-Axis: Humidity */}
            <YAxis
              yAxisId="humidity"
              orientation="right"
              stroke="#2563eb"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              domain={[55, 75]}
              unit="%"
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
              formatter={(value, name) => {
                if (name === 'Temperature (°C)') return [`${value} °C`, 'Temperature (V0)'];
                if (name === 'Humidity (% RH)') return [`${value} % RH`, 'Humidity (V1)'];
                return [value, name];
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              height={32}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingBottom: '8px' }}
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temperature"
              name="Temperature (°C)"
              stroke="#0284c7"
              strokeWidth={2}
              dot={{ r: 3, fill: '#0284c7' }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="humidity"
              type="monotone"
              dataKey="humidity"
              name="Humidity (% RH)"
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#2563eb' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Sourced from centralized historical mock dataset</span>
        <span className="font-mono">{data.length} telemetry points</span>
      </div>
    </div>
  );
};

