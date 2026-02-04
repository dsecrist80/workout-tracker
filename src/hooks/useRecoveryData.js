// hooks/useRecoveryData.js
import { useMemo } from 'react';
import { MUSCLES } from '../constants/muscles';

/**
 * Custom hook for processing recovery and training data
 */
export function useRecoveryData({
  workouts,
  readinessHistory,
  stimulusHistory,
  weeklyStimulus,
  localFatigue,
  timeframe,
  selectedMuscle,
  metricView,
  theme
}) {
  /**
   * Build historical data from workouts and fatigue history
   */
  const historicalData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = timeframe - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      const weekData = {
        week: i === 0 ? 'This week' : `${i}w ago`,
        weekLabel: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date: weekStart.toISOString().split('T')[0],
        volume: {},
        fatigue: {},
        stimulus: {},
        efficiency: {}
      };
      
      // Calculate volume from workouts
      const weekWorkouts = workouts.filter(w => {
        const wDate = new Date(w.date);
        return wDate >= weekStart && wDate < weekEnd;
      });
      
      MUSCLES.forEach(muscle => {
        let muscleVolume = 0;
        weekWorkouts.forEach(workout => {
          const baseVolume = (workout.sets || []).reduce((sum, set) => sum + (set.w * set.r), 0);
          
          if (workout.prim && workout.prim.includes(muscle)) {
            muscleVolume += baseVolume * 1.0;
          }
          if (workout.sec && workout.sec.includes(muscle)) {
            muscleVolume += baseVolume * 0.6;
          }
          if (workout.ter && workout.ter.includes(muscle)) {
            muscleVolume += baseVolume * 0.3;
          }
        });
        
        weekData.volume[muscle] = muscleVolume;
        
        // Get fatigue from history - use LATEST entry in the week
        const weekHistoryEntries = readinessHistory.filter(h => {
          const hDate = new Date(h.date);
          return hDate >= weekStart && hDate < weekEnd;
        });
        
        // Sort by date descending and take the latest
        const weekHistory = weekHistoryEntries.length > 0 
          ? weekHistoryEntries.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
          : null;
        
        // Fatigue chart: Use muscle soreness as a proxy (0-10 scale)
        // Or we could calculate from readiness if available
        if (weekHistory && weekHistory.muscleSoreness && weekHistory.muscleSoreness[muscle]) {
          weekData.fatigue[muscle] = weekHistory.muscleSoreness[muscle] / 10; // Normalize to 0-1
        } else if (i === 0) {
          // Current week - use actual fatigue
          weekData.fatigue[muscle] = localFatigue[muscle] || 0;
        } else {
          weekData.fatigue[muscle] = 0;
        }
        
        // Get stimulus from history - use LATEST entry in the week
        const weekStimulusEntries = stimulusHistory.filter(h => {
          const hDate = new Date(h.date);
          return hDate >= weekStart && hDate < weekEnd;
        });
        
        console.log(`Week ${i} (${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}):`, {
          weekStimulusEntries: weekStimulusEntries.length,
          dates: weekStimulusEntries.map(e => e.date)
        });
        
        // Sort by date descending and take the latest
        const weekStimulus = weekStimulusEntries.length > 0
          ? weekStimulusEntries.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
          : null;
        
        if (weekStimulus && weekStimulus.stimulus) {
          weekData.stimulus[muscle] = weekStimulus.stimulus[muscle] || 0;
        } else if (i === 0) {
          weekData.stimulus[muscle] = weeklyStimulus[muscle] || 0;
        } else {
          weekData.stimulus[muscle] = 0;
        }
        
        // Calculate efficiency
        const fatigue = weekData.fatigue[muscle] || 0.001;
        const stimulus = weekData.stimulus[muscle] || 0;
        weekData.efficiency[muscle] = fatigue > 0 ? stimulus / fatigue : 0;
      });
      
      data.push(weekData);
    }
    
    return data;
  }, [workouts, readinessHistory, stimulusHistory, weeklyStimulus, localFatigue, timeframe]);

  /**
   * Get chart data based on selections
   */
  const chartData = useMemo(() => {
    return historicalData.map(week => {
      let value = 0;
      
      if (selectedMuscle === 'all') {
        const values = MUSCLES.map(m => week[metricView][m] || 0);
        value = values.reduce((a, b) => a + b, 0);
        if (metricView === 'efficiency') {
          value = value / MUSCLES.length;
        }
      } else {
        value = week[metricView][selectedMuscle] || 0;
      }
      
      return {
        week: week.week,
        weekLabel: week.weekLabel,
        value: value
      };
    });
  }, [historicalData, selectedMuscle, metricView]);

  /**
   * Calculate trend
   */
  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'stable', change: 0 };
    
    const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
    const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;
    
    const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    const direction = change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable';
    
    return { direction, change: change.toFixed(1) };
  }, [chartData]);

  /**
   * Get metric info
   */
  const metricInfo = useMemo(() => {
    const info = {
      volume: { 
        label: 'Volume (lbs)', 
        color: theme?.primary.includes('blue') ? '#2563eb' :
               theme?.primary.includes('green') ? '#16a34a' :
               theme?.primary.includes('purple') ? '#9333ea' :
               theme?.primary.includes('orange') ? '#ea580c' :
               theme?.primary.includes('red') ? '#dc2626' :
               theme?.primary.includes('indigo') ? '#4f46e5' :
               theme?.primary.includes('pink') ? '#db2777' :
               theme?.primary.includes('teal') ? '#0d9488' : '#2563eb',
        unit: 'lbs',
        description: 'Total weight × reps lifted'
      },
      fatigue: { 
        label: 'Fatigue Index', 
        color: '#dc2626',
        unit: '',
        description: 'Accumulated fatigue (logarithmic scale)'
      },
      stimulus: { 
        label: 'Stimulus (sets)', 
        color: '#16a34a',
        unit: 'sets',
        description: 'Effective training volume'
      },
      efficiency: { 
        label: 'Stimulus:Fatigue Ratio', 
        color: '#9333ea',
        unit: '',
        description: 'Training efficiency (higher is better)'
      }
    };
    return info[metricView];
  }, [metricView, theme]);

  return {
    historicalData,
    chartData,
    trend,
    metricInfo
  };
}