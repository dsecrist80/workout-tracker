// components/recovery/MetricChart.jsx
import React from 'react';
import { MUSCLES } from '../../constants/muscles';

export function MetricChart({
  chartData,
  chartType,
  metricView,
  metricInfo,
  trend,
  timeframe,
  selectedMuscle,
  theme,
  onMetricChange,
  onTimeframeChange,
  onMuscleChange,
  onChartTypeChange
}) {
  const maxValue = Math.max(...chartData.map(d => d.value), 1);
  const minValue = Math.min(...chartData.map(d => d.value), 0);
  const valueRange = maxValue - minValue || 1;

  return (
    <>
      {/* Chart Controls */}
      <div className="mb-6 p-5 bg-slate-50 rounded-lg border-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700">Metric</label>
            <div className="grid grid-cols-2 gap-2">
              {['volume', 'fatigue', 'stimulus', 'efficiency'].map(metric => (
                <button
                  key={metric}
                  onClick={() => onMetricChange(metric)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    metricView === metric
                      ? `${theme?.primary || 'bg-blue-600'} text-white shadow-md`
                      : 'bg-white hover:bg-slate-100 border-2'
                  }`}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700">Timeframe</label>
            <div className="grid grid-cols-4 gap-2">
              {[4, 8, 12, 16].map(weeks => (
                <button
                  key={weeks}
                  onClick={() => onTimeframeChange(weeks)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    timeframe === weeks
                      ? `${theme?.primary || 'bg-blue-600'} text-white shadow-md`
                      : 'bg-white hover:bg-slate-100 border-2'
                  }`}
                >
                  {weeks}w
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700">Muscle Group</label>
            <select
              value={selectedMuscle}
              onChange={(e) => onMuscleChange(e.target.value)}
              className="w-full px-3 py-2 border-2 rounded-lg text-sm font-medium bg-white"
            >
              <option value="all">All Muscles</option>
              {MUSCLES.map(muscle => (
                <option key={muscle} value={muscle}>{muscle}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700">Chart Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['line', 'bar'].map(type => (
                <button
                  key={type}
                  onClick={() => onChartTypeChange(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    chartType === type
                      ? `${theme?.primary || 'bg-blue-600'} text-white shadow-md`
                      : 'bg-white hover:bg-slate-100 border-2'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Info Banner */}
      <div className={`mb-6 p-4 bg-gradient-to-r ${theme?.light || 'from-slate-50 to-blue-50'} border-2 ${theme?.primary.split(' ')[0].replace('bg-', 'border-') || 'border-blue-200'} rounded-lg`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-bold text-lg" style={{ color: metricInfo.color }}>
              {metricInfo.label}
            </div>
            <div className="text-sm text-slate-600">{metricInfo.description}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Trend</div>
            <div className={`text-lg font-bold ${
              trend.direction === 'increasing' ? 'text-green-600' :
              trend.direction === 'decreasing' ? 'text-red-600' :
              'text-slate-600'
            }`}>
              {trend.direction === 'increasing' ? '↗' : trend.direction === 'decreasing' ? '↘' : '→'}
              {' '}{Math.abs(parseFloat(trend.change))}%
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-8 p-5 bg-white border-2 rounded-lg shadow-sm">
        {chartData.length > 0 && chartData.some(d => d.value > 0) ? (
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-slate-600 text-right pr-2">
              <span>{maxValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
              <span>{(maxValue * 0.75).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
              <span>{(maxValue * 0.5).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
              <span>{(maxValue * 0.25).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
              <span>{minValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
            </div>

            <div className="ml-20 mr-4">
              <svg viewBox="0 0 500 250" className="w-full" style={{ height: '250px' }}>
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={250 - (ratio * 250)}
                    x2="500"
                    y2={250 - (ratio * 250)}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                ))}

                {chartType === 'line' ? (
                  <>
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={metricInfo.color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={metricInfo.color} stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={[
                        '0,250',
                        ...chartData.map((d, i) => {
                          const x = chartData.length > 1 ? (i / (chartData.length - 1)) * 500 : 250;
                          const y = 250 - (((d.value - minValue) / valueRange) * 250);
                          return `${x},${y}`;
                        }),
                        `${chartData.length > 1 ? 500 : 250},250`
                      ].join(' ')}
                      fill="url(#areaGradient)"
                    />

                    {chartData.length > 1 && (
                      <polyline
                        points={chartData.map((d, i) => {
                          const x = (i / (chartData.length - 1)) * 500;
                          const y = 250 - (((d.value - minValue) / valueRange) * 250);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke={metricInfo.color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {chartData.map((d, i) => {
                      const x = chartData.length > 1 ? (i / (chartData.length - 1)) * 500 : 250;
                      const y = 250 - (((d.value - minValue) / valueRange) * 250);
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="6" fill="white" stroke={metricInfo.color} strokeWidth="3" />
                          <title>{d.week}: {d.value.toLocaleString(undefined, { maximumFractionDigits: 1 })} {metricInfo.unit}</title>
                        </g>
                      );
                    })}
                  </>
                ) : (
                  chartData.map((d, i) => {
                    const barWidth = 500 / chartData.length * 0.8;
                    const x = (i / chartData.length) * 500 + (500 / chartData.length * 0.1);
                    const height = ((d.value - minValue) / valueRange) * 250;
                    const y = 250 - height;
                    
                    return (
                      <g key={i}>
                        <rect x={x} y={y} width={barWidth} height={height} fill={metricInfo.color} opacity="0.8" rx="3" />
                        <title>{d.week}: {d.value.toLocaleString(undefined, { maximumFractionDigits: 1 })} {metricInfo.unit}</title>
                      </g>
                    );
                  })
                )}
              </svg>

              <div className="flex justify-between mt-2 text-xs text-slate-600">
                {chartData.map((d, i) => {
                  const shouldShow = i === 0 || i === chartData.length - 1 || 
                                    (chartData.length > 8 && i % Math.floor(chartData.length / 4) === 0);
                  return (
                    <span key={i} className={shouldShow ? '' : 'invisible'}>
                      {d.week}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">
            {selectedMuscle === 'all' 
              ? 'Complete more workouts to see trends' 
              : `No ${selectedMuscle} data in this timeframe`}
          </p>
        )}
      </div>
    </>
  );
}