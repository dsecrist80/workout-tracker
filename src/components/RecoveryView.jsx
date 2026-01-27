// components/RecoveryView.jsx
// =====================================================
// Enhanced Recovery Metrics & Analytics Component
// =====================================================

import React, { useState } from 'react';
import { StatusCards } from './recovery/StatusCards';
import { MetricChart } from './recovery/MetricChart';
import { MuscleReadinessGrid } from './recovery/MuscleReadinessGrid';
import { RecoveryInsights } from './recovery/RecoveryInsights';
import { useRecoveryData } from '../hooks/useRecoveryData';
import { getWeeklySummary } from '../utils/volumeAnalysis';

/**
 * Enhanced Recovery view component with multi-metric analytics
 */
export function RecoveryView({
  muscleReadiness,
  systemicReadiness,
  weeklyStimulus,
  localFatigue,
  lastWorkoutDate,
  workouts,
  stimulusHistory = [],
  readinessHistory = [],
  theme
}) {
  // Chart controls
  const [timeframe, setTimeframe] = useState(8);
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [metricView, setMetricView] = useState('volume');
  const [chartType, setChartType] = useState('line');

  // Get weekly summary
  const weeklySummary = getWeeklySummary(workouts);

  // Build historical data using custom hook
  const { historicalData, chartData, trend, metricInfo } = useRecoveryData({
    workouts,
    readinessHistory,
    stimulusHistory,
    weeklyStimulus,
    localFatigue,
    timeframe,
    selectedMuscle,
    metricView,
    theme
  });

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 animate-fadeIn">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Recovery & Training Analytics</h1>

      {/* Current Status Cards */}
      <StatusCards
        systemicReadiness={systemicReadiness}
        muscleReadiness={muscleReadiness}
        weeklyStimulus={weeklyStimulus}
        weeklySummary={weeklySummary}
        theme={theme}
      />

      {/* Metric Chart with Controls */}
      <MetricChart
        chartData={chartData}
        chartType={chartType}
        metricView={metricView}
        metricInfo={metricInfo}
        trend={trend}
        timeframe={timeframe}
        selectedMuscle={selectedMuscle}
        theme={theme}
        onMetricChange={setMetricView}
        onTimeframeChange={setTimeframe}
        onMuscleChange={setSelectedMuscle}
        onChartTypeChange={setChartType}
      />

      {/* Muscle Readiness Grid */}
      <MuscleReadinessGrid
        muscleReadiness={muscleReadiness}
        weeklyStimulus={weeklyStimulus}
        selectedMuscle={selectedMuscle}
        onMuscleSelect={setSelectedMuscle}
        theme={theme}
      />

      {/* Recovery Insights & Recommendations */}
      <RecoveryInsights
        muscleReadiness={muscleReadiness}
        systemicReadiness={systemicReadiness}
        trend={trend}
        lastWorkoutDate={lastWorkoutDate}
        theme={theme}
      />
    </div>
  );
}

export default RecoveryView;