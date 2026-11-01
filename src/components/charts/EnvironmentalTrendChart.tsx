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
import type { HistoricalReading } from '../../types';

interface EnvironmentalTrendChartProps {
  data: HistoricalReading[];
}

export const EnvironmentalTrendChart: React.FC<EnvironmentalTrendChartProps> = ({ data }) => {
  const chartData = data.map((reading) => {
    const date = new Date(reading.timestamp);
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: reading.temperature,
      humidity: reading.humidity,
    };
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Environmental Telemetry Trend (24h)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Temperature (V0) and Relative Humidity (V1) demonstration timeline
          </p>
        </div>
        <div className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 self-start sm:self-center">
          24 Hourly Points
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full" data-testid="environmental-trend-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              minTickGap={25}
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
                if (name === 'Humidity (%)') return [`${value} % RH`, 'Humidity (V1)'];
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
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              yAxisId="humidity"
              type="monotone"
              dataKey="humidity"
              name="Humidity (%)"
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

