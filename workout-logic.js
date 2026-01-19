// Constants
const TYPES = {
    compound_lower: { C: 1.3, name: 'Compound Lower' },
    compound_upper: { C: 1.0, name: 'Compound Upper' },
    isolation: { C: 0.4, name: 'Isolation' }
};

const MUSCLES = ['Quads', 'Hams', 'Glutes', 'Calves', 'Chest', 'Back', 'Shoulders', 'Bi', 'Tri', 'Forearms', 'Abs', 'LowBack'];

const RECOVERY_RATES = {
    'Quads': 0.15, 'Hams': 0.15, 'Glutes': 0.15, 'Calves': 0.20,
    'Chest': 0.18, 'Back': 0.16, 'Shoulders': 0.14,
    'Bi': 0.20, 'Tri': 0.20, 'Forearms': 0.22,
    'Abs': 0.25, 'LowBack': 0.12
};
const SYSTEMIC_RECOVERY_RATE = 0.18;

// Make constants available globally
window.TYPES = TYPES;
window.MUSCLES = MUSCLES;
window.RECOVERY_RATES = RECOVERY_RATES;
window.SYSTEMIC_RECOVERY_RATE = SYSTEMIC_RECOVERY_RATE;

// Utility Functions
window.est1RM = (weight, reps, rir) => {
    const rpe = 10 - rir;
    const totalReps = reps / (1.0278 - 0.0278 * rpe);
    return weight * (1 + totalReps / 30);
};

window.formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
};

window.fmtDate = (d) => d.toISOString().split('T')[0];

// Fatigue Calculation Functions
window.stimulusPerSet = (set, ex, muscle) => {
    const effort = Math.exp(-0.2 * set.rir);
    const loadFactor = set.w / window.est1RM(set.w, set.r, set.rir);
    
    let roleMultiplier = 0;
    if (ex.prim && ex.prim.includes(muscle)) roleMultiplier = 1.0;
    else if (ex.sec && ex.sec.includes(muscle)) roleMultiplier = 0.5;
    else if (ex.ter && ex.ter.includes(muscle)) roleMultiplier = 0.25;

    return effort * loadFactor * roleMultiplier;
};

window.localFatiguePerSet = (set, ex, muscle) => {
    const baseFatigue = set.w * set.r;
    
    let roleMultiplier = 0;
    if (ex.prim && ex.prim.includes(muscle)) roleMultiplier = 1.0;
    else if (ex.sec && ex.sec.includes(muscle)) roleMultiplier = 0.5;
    else if (ex.ter && ex.ter.includes(muscle)) roleMultiplier = 0.25;

    const axialMultiplier = ex.axial ? 1.3 : 1.0;

    return baseFatigue * roleMultiplier * axialMultiplier;
};

window.systemicFatiguePerSet = (set, ex) => {
    const isCompound = ex.type !== 'isolation';
    if (!isCompound) return 0;

    return set.w * set.r * (ex.axial ? 1.5 : 1.0);
};

window.applyRecovery = (lastWorkoutDate, localFatigue, systemicFatigue, currentDate) => {
    if (!lastWorkoutDate) return { localFatigue, systemicFatigue };
    
    const daysSince = Math.floor((new Date(currentDate) - new Date(lastWorkoutDate)) / (1000 * 60 * 60 * 24));
    if (daysSince <= 0) return { localFatigue, systemicFatigue };

    const newLocalFatigue = {...localFatigue};
    Object.keys(newLocalFatigue).forEach(muscle => {
        for (let i = 0; i < daysSince; i++) {
            newLocalFatigue[muscle] *= Math.exp(-RECOVERY_RATES[muscle] || 0.15);
        }
    });

    let newSysFatigue = systemicFatigue;
    for (let i = 0; i < daysSince; i++) {
        newSysFatigue *= Math.exp(-SYSTEMIC_RECOVERY_RATE);
    }

    return { localFatigue: newLocalFatigue, systemicFatigue: newSysFatigue };
};

window.updateFatigueFromSession = (sessionExercises, sessionDate, currentState) => {
    const { localFatigue, systemicFatigue, weeklyStimulus, perceivedFatigue, muscleSoreness } = currentState;
    
    const recovered = window.applyRecovery(currentState.lastWorkoutDate, localFatigue, systemicFatigue, sessionDate);
    
    const newLocalFatigue = {...recovered.localFatigue};
    const newWeeklyStimulus = {...weeklyStimulus};
    let newSysFatigue = recovered.systemicFatigue;

    sessionExercises.forEach(ex => {
        ex.sets.forEach(set => {
            (ex.prim || []).forEach(m => {
                const stimulus = window.stimulusPerSet(set, ex, m);
                const fatigue = window.localFatiguePerSet(set, ex, m);
                
                newWeeklyStimulus[m] = (newWeeklyStimulus[m] || 0) + stimulus;
                newLocalFatigue[m] = (newLocalFatigue[m] || 0) + fatigue * 0.001;
            });

            (ex.sec || []).forEach(m => {
                const stimulus = window.stimulusPerSet(set, ex, m);
                const fatigue = window.localFatiguePerSet(set, ex, m);
                
                newWeeklyStimulus[m] = (newWeeklyStimulus[m] || 0) + stimulus;
                newLocalFatigue[m] = (newLocalFatigue[m] || 0) + fatigue * 0.001;
            });

            (ex.ter || []).forEach(m => {
                const stimulus = window.stimulusPerSet(set, ex, m);
                const fatigue = window.localFatiguePerSet(set, ex, m);
                
                newWeeklyStimulus[m] = (newWeeklyStimulus[m] || 0) + stimulus;
                newLocalFatigue[m] = (newLocalFatigue[m] || 0) + fatigue * 0.001;
            });

            newSysFatigue += window.systemicFatiguePerSet(set, ex) * 0.0001;
        });
    });

    const perceivedCorrection = (perceivedFatigue - 5) * 0.1;
    newSysFatigue += perceivedCorrection;

    Object.keys(newLocalFatigue).forEach(muscle => {
        const sorenessCorrection = (muscleSoreness[muscle] || 0) * 0.05;
        newLocalFatigue[muscle] *= (1 + sorenessCorrection);
    });

    const newMuscleReadiness = {};
    Object.keys(newLocalFatigue).forEach(m => {
        newMuscleReadiness[m] = Math.exp(-newLocalFatigue[m]);
    });
    
    const newSystemicReadiness = Math.exp(-newSysFatigue);

    return {
        localFatigue: newLocalFatigue,
        systemicFatigue: newSysFatigue,
        weeklyStimulus: newWeeklyStimulus,
        muscleReadiness: newMuscleReadiness,
        systemicReadiness: newSystemicReadiness,
        lastWorkoutDate: sessionDate
    };
};

window.getProgression = (exId, exercises, workouts, muscleReadiness, systemicReadiness, weeklyStimulus) => {
    if (!exId) return null;
    
    const ex = exercises.find(e => e.id == exId);
    if (!ex) return null;
    
    const prev = workouts.filter(w => w.id == exId).sort((a, b) => new Date(b.date) - new Date(a.date));
    const prevPerf = prev.length > 0 ? prev[0] : null;
    
    if (!prevPerf || !prevPerf.sets || prevPerf.sets.length === 0) return { advice: 'first_time' };
    
    const muscles = [...(ex.prim || []), ...(ex.sec || [])];
    const avgReadiness = muscles.length > 0 
        ? muscles.reduce((sum, m) => sum + (muscleReadiness[m] || 1.0), 0) / muscles.length
        : 1.0;
    
    const isAxialComp = ex.type !== 'isolation' && ex.axial;
    
    const avgStimulus = muscles.length > 0
        ? muscles.reduce((sum, m) => sum + (weeklyStimulus[m] || 0), 0) / muscles.length
        : 0;
    
    const localDeloadNeeded = avgReadiness < 0.6 && avgStimulus < 0.5;
    const systemicDeloadNeeded = systemicReadiness < 0.6;
    
    if (localDeloadNeeded || systemicDeloadNeeded) {
        return {
            advice: 'deload',
            suggestion: isAxialComp 
                ? 'DELOAD: Reduce weight 10-15% OR increase RIR by 2-3, reduce sets by 30-50%' 
                : 'DELOAD: Increase RIR by 2, reduce sets by 30-40%',
            readiness: 'deload',
            muscleReadiness: avgReadiness,
            systemicReadiness,
            reason: localDeloadNeeded ? 'Local fatigue high' : 'Systemic fatigue high'
        };
    }
    
    if (avgReadiness > 0.85 && systemicReadiness > 0.85) {
        return {
            advice: 'progress',
            suggestion: 'Increase weight by 2.5-5lbs or add 1 rep',
            readiness: 'high',
            muscleReadiness: avgReadiness,
            systemicReadiness
        };
    } else if (avgReadiness < 0.65 || systemicReadiness < 0.65) {
        return {
            advice: 'reduce',
            suggestion: isAxialComp 
                ? 'Reduce weight 5-10% or increase RIR by 1-2' 
                : 'Increase RIR by 1-2 or reduce 1 set',
            readiness: 'low',
            muscleReadiness: avgReadiness,
            systemicReadiness
        };
    } else {
        return {
            advice: 'maintain',
            suggestion: 'Match previous performance',
            readiness: 'moderate',
            muscleReadiness: avgReadiness,
            systemicReadiness
        };
    }
};

window.getDays = () => {
    const t = new Date();
    const y = t.getFullYear(), mo = t.getMonth();
    const f = new Date(y, mo, 1), l = new Date(y, mo + 1, 0);
    const d = [], s = f.getDay();
    for (let i = 0; i < s; i++) d.push(null);
    for (let i = 1; i <= l.getDate(); i++) d.push(new Date(y, mo, i));
    return d;
};

window.exByMuscle = (exercises) => {
    const g = {};
    exercises.forEach(ex => {
        ex.prim.forEach(m => {
            if (!g[m]) g[m] = [];
            g[m].push(ex);
        });
    });
    return g;
};

window.loadPresets = () => {
    return [
        { id: 1, name: 'Barbell Squat', type: 'compound_lower', axial: true, prim: ['Quads', 'Glutes'], sec: ['Hams'], ter: [] },
        { id: 2, name: 'Bench Press', type: 'compound_upper', axial: false, prim: ['Chest'], sec: ['Tri', 'Shoulders'], ter: [] },
        { id: 3, name: 'Deadlift', type: 'compound_lower', axial: true, prim: ['Hams', 'LowBack', 'Glutes'], sec: [], ter: [] },
        { id: 4, name: 'Overhead Press', type: 'compound_upper', axial: true, prim: ['Shoulders'], sec: ['Tri'], ter: [] },
        { id: 5, name: 'Barbell Row', type: 'compound_upper', axial: false, prim: ['Back'], sec: ['Bi'], ter: [] },
        { id: 6, name: 'Pull-ups', type: 'compound_upper', axial: false, prim: ['Back'], sec: ['Bi'], ter: [] },
        { id: 7, name: 'Romanian Deadlift', type: 'compound_lower', axial: true, prim: ['Hams'], sec: ['Glutes', 'LowBack'], ter: [] },
        { id: 8, name: 'Leg Press', type: 'compound_lower', axial: false, prim: ['Quads', 'Glutes'], sec: [], ter: [] },
        { id: 9, name: 'Dumbbell Bench', type: 'compound_upper', axial: false, prim: ['Chest'], sec: ['Tri', 'Shoulders'], ter: [] },
        { id: 10, name: 'Lat Pulldown', type: 'compound_upper', axial: false, prim: ['Back'], sec: ['Bi'], ter: [] },
        { id: 11, name: 'Leg Curl', type: 'isolation', axial: false, prim: ['Hams'], sec: [], ter: [] },
        { id: 12, name: 'Leg Extension', type: 'isolation', axial: false, prim: ['Quads'], sec: [], ter: [] },
        { id: 13, name: 'Bicep Curl', type: 'isolation', axial: false, prim: ['Bi'], sec: [], ter: [] },
        { id: 14, name: 'Tricep Extension', type: 'isolation', axial: false, prim: ['Tri'], sec: [], ter: [] },
        { id: 15, name: 'Lateral Raise', type: 'isolation', axial: false, prim: ['Shoulders'], sec: [], ter: [] },
        { id: 16, name: 'Calf Raise', type: 'isolation', axial: false, prim: ['Calves'], sec: [], ter: [] }
    ];
};
