const { useState, useEffect } = React;

function WorkoutTracker() {
    // State - User
    const [ready, setReady] = useState(false);
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState('');
    const [showLogin, setShowLogin] = useState(false);
    
    // State - Data
    const [exercises, setExercises] = useState([]);
    const [workouts, setWorkouts] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [activeProgram, setActiveProgram] = useState(null);
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    
    // State - UI
    const [view, setView] = useState('session');
    const [selDate, setSelDate] = useState(null);
    
    // State - Exercise Builder
    const [name, setName] = useState('');
    const [type, setType] = useState('compound_upper');
    const [axial, setAxial] = useState(false);
    const [prim, setPrim] = useState([]);
    const [sec, setSec] = useState([]);
    const [ter, setTer] = useState([]);
    const [showAdv, setShowAdv] = useState(false);
    
    // State - Session
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selEx, setSelEx] = useState('');
    const [sets, setSets] = useState([]);
    const [input, setInput] = useState({ w: '', r: '', rir: '' });
    const [session, setSession] = useState([]);
    const [restTimer, setRestTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [repsRef, setRepsRef] = useState(null);
    const [rirRef, setRirRef] = useState(null);
    const [swipeStart, setSwipeStart] = useState(null);
    
    // State - Programs
    const [progName, setProgName] = useState('');
    const [progDays, setProgDays] = useState([]);
    const [currentDay, setCurrentDay] = useState({ name: '', exercises: [] });
    
    // State - Fatigue
    const [localFatigue, setLocalFatigue] = useState({});
    const [systemicFatigue, setSystemicFatigue] = useState(0);
    const [weeklyStimulus, setWeeklyStimulus] = useState({});
    const [muscleReadiness, setMuscleReadiness] = useState({});
    const [systemicReadiness, setSystemicReadiness] = useState(1.0);
    const [perceivedFatigue, setPerceivedFatigue] = useState(5);
    const [muscleSoreness, setMuscleSoreness] = useState({});
    const [showFatigueLog, setShowFatigueLog] = useState(false);
    const [lastWorkoutDate, setLastWorkoutDate] = useState(null);

    // Initialize
    useEffect(() => {
        const init = () => {
            if (window.firebaseReady) {
                try {
                    const storedUserId = localStorage.getItem('userId');
                    const storedUsername = localStorage.getItem('username');
                    if (storedUserId && storedUsername) {
                        setUserId(storedUserId);
                        setUsername(storedUsername);
                        loadUserData(storedUserId);
                    } else {
                        setShowLogin(true);
                    }
                } catch(e) {
                    setShowLogin(true);
                }
                setReady(true);
            }
        };
        
        if (window.firebaseReady) init();
        else window.addEventListener('firebaseReady', init);
    }, []);

    // Rest timer
    useEffect(() => {
        let interval;
        if (timerActive && restTimer > 0) {
            interval = setInterval(() => setRestTimer(t => t - 1), 1000);
        } else if (restTimer === 0) {
            setTimerActive(false);
        }
        return () => clearInterval(interval);
    }, [timerActive, restTimer]);

    // Database functions
    const save = async (col, data) => {
        try {
            await window.dbSetDoc(window.dbDoc(window.db, col, 'data'), { items: data });
        } catch(e) { console.error(e); }
    };

    const saveUserData = async (col, data) => {
        if (!userId) return;
        try {
            await window.dbSetDoc(window.dbDoc(window.db, col, userId), { items: data, userId });
        } catch(e) { console.error(e); }
    };

    const load = async (col, setter, defaultFn) => {
        try {
            const snap = await window.dbGetDocs(window.dbCollection(window.db, col));
            if (!snap.empty) {
                snap.forEach(d => { if (d.data().items) setter(d.data().items); });
            } else if (defaultFn) defaultFn();
        } catch(e) {
            console.error(e);
            if (defaultFn) defaultFn();
        }
    };

    const loadUserData = async (uid) => {
        load('exercises', setExercises, () => {
            const presets = window.loadPresets();
            setExercises(presets);
            save('exercises', presets);
        });
        load('programs', setPrograms);
        
        try {
            const workoutsSnap = await window.dbGetDocs(window.dbCollection(window.db, 'workouts'));
            const userWorkouts = [];
            workoutsSnap.forEach(d => {
                if (d.data().userId === uid && d.data().items) {
                    userWorkouts.push(...d.data().items);
                }
            });
            setWorkouts(userWorkouts);
        } catch(e) { console.error(e); }

        loadFatigueState(uid);
        
        try {
            const ap = localStorage.getItem(`ap_${uid}`);
            const cdi = localStorage.getItem(`cdi_${uid}`);
            if (ap) setActiveProgram(JSON.parse(ap));
            if (cdi) setCurrentDayIndex(parseInt(cdi));
        } catch(e) {}
    };

    const loadFatigueState = async (uid) => {
        if (!uid) uid = userId;
        if (!uid) return;
        
        try {
            const snap = await window.dbGetDocs(window.dbCollection(window.db, 'fatigue'));
            if (!snap.empty) {
                snap.forEach(d => {
                    if (d.id === uid) {
                        const data = d.data();
                        if (data.localFatigue) setLocalFatigue(data.localFatigue);
                        if (data.systemicFatigue !== undefined) setSystemicFatigue(data.systemicFatigue);
                        if (data.weeklyStimulus) setWeeklyStimulus(data.weeklyStimulus);
                        if (data.lastWorkoutDate) setLastWorkoutDate(data.lastWorkoutDate);
                    }
                });
            }
        } catch(e) { console.error(e); }
    };

    const saveFatigueState = async () => {
        if (!userId) return;
        try {
            await window.dbSetDoc(window.dbDoc(window.db, 'fatigue', userId), {
                localFatigue,
                systemicFatigue,
                weeklyStimulus,
                lastWorkoutDate,
                userId
            });
        } catch(e) { console.error(e); }
    };

    // User functions
    const handleLogin = () => {
        if (!username.trim()) return alert('Enter a username');
        const uid = username.toLowerCase().replace(/[^a-z0-9]/g, '_');
        setUserId(uid);
        try {
            localStorage.setItem('userId', uid);
            localStorage.setItem('username', username);
        } catch(e) {}
        setShowLogin(false);
        loadUserData(uid);
    };

    const handleLogout = () => {
        try {
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            localStorage.removeItem(`ap_${userId}`);
            localStorage.removeItem(`cdi_${userId}`);
        } catch(e) {}
        setUserId(null);
        setUsername('');
        setWorkouts([]);
        setLocalFatigue({});
        setSystemicFatigue(0);
        setWeeklyStimulus({});
        setMuscleReadiness({});
        setSystemicReadiness(1.0);
        setLastWorkoutDate(null);
        setActiveProgram(null);
        setCurrentDayIndex(0);
        setSession([]);
        setShowLogin(true);
    };

    // Exercise functions
    const toggle = (m, role) => {
        if (role === 'primary') {
            setPrim(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
            setSec(s => s.filter(x => x !== m));
            setTer(t => t.filter(x => x !== m));
        } else if (role === 'secondary') {
            setSec(s => s.includes(m) ? s.filter(x => x !== m) : [...s, m]);
            setPrim(p => p.filter(x => x !== m));
            setTer(t => t.filter(x => x !== m));
        } else if (role === 'tertiary') {
            setTer(t => t.includes(m) ? t.filter(x => x !== m) : [...t, m]);
            setPrim(p => p.filter(x => x !== m));
            setSec(s => s.filter(x => x !== m));
        }
    };

    const saveEx = () => {
        if (!name || prim.length === 0) return alert('Enter name and select primary muscles');
        const id = exercises.length > 0 ? Math.max(...exercises.map(e => e.id)) + 1 : 1;
        const updated = [...exercises, { id, name, type, axial, prim, sec, ter }];
        setExercises(updated);
        save('exercises', updated);
        setName(''); setPrim([]); setSec([]); setTer([]); setAxial(false); setShowAdv(false);
    };

    const delEx = (id) => {
        const updated = exercises.filter(e => e.id !== id);
        setExercises(updated);
        save('exercises', updated);
    };

    // Session functions
    const addSet = () => {
        if (!input.w || !input.r || input.rir === '') return alert('Fill all fields');
        setSets([...sets, { w: parseFloat(input.w), r: parseInt(input.r), rir: parseInt(input.rir) }]);
        setInput({ w: input.w, r: '', rir: '' });
        setRestTimer(120);
        setTimerActive(true);
        if (repsRef) setTimeout(() => repsRef.focus(), 100);
    };
const handleTouchStart = (e, index) => {
    setSwipeStart({ x: e.touches[0].clientX, index });
};

const handleTouchEnd = (e, index) => {
    if (!swipeStart || swipeStart.index !== index) return;
    
    const swipeEnd = e.changedTouches[0].clientX;
    const swipeDistance = swipeStart.x - swipeEnd;
    
    // If swiped left more than 50px, delete the set
    if (swipeDistance > 50) {
        setSets(sets.filter((_, idx) => idx !== index));
    }
    
    setSwipeStart(null);
};
    
    const addToSess = () => {
        if (!selEx || sets.length === 0) return alert('Select exercise and add sets');
        const ex = exercises.find(e => e.id == selEx);
        if (!ex) return;
        setSession([...session, { ...ex, sets: [...sets], id: Date.now() }]);
        setSets([]);
        setInput({ w: '', r: '', rir: '' });
        setSelEx('');
        setRestTimer(0);
        setTimerActive(false);
    };

    const finish = () => {
        if (session.length === 0) return alert('Add exercises');
        const w = [...session.map(e => ({ ...e, date })), ...workouts];
        setWorkouts(w);
        saveUserData('workouts', w);
        
        const result = window.updateFatigueFromSession(session, date, {
            localFatigue, systemicFatigue, weeklyStimulus, 
            perceivedFatigue, muscleSoreness, lastWorkoutDate
        });
        
        setLocalFatigue(result.localFatigue);
        setSystemicFatigue(result.systemicFatigue);
        setWeeklyStimulus(result.weeklyStimulus);
        setMuscleReadiness(result.muscleReadiness);
        setSystemicReadiness(result.systemicReadiness);
        setLastWorkoutDate(result.lastWorkoutDate);
        
        saveFatigueState();
        setSession([]);
        
        if (activeProgram) {
            const nextIndex = (currentDayIndex + 1) % activeProgram.days.length;
            setCurrentDayIndex(nextIndex);
            try { 
                localStorage.setItem(`cdi_${userId}`, nextIndex.toString()); 
            } catch(e) {}
        }
        alert('Saved!');
    };

    const handleExSelect = (exId) => {
        setSelEx(exId);
        setSets([]);
        setInput({ w: '', r: '', rir: '' });
        setRestTimer(0);
        setTimerActive(false);
        
        const prev = workouts.filter(w => w.id == exId).sort((a, b) => new Date(b.date) - new Date(a.date));
        const prevPerf = prev.length > 0 ? prev[0] : null;
        if (prevPerf && prevPerf.sets && prevPerf.sets.length > 0) {
            setInput({ w: prevPerf.sets[0].w.toString(), r: '', rir: '' });
        }
    };

    // Program functions
    const addExToDay = (exId) => {
        const ex = exercises.find(e => e.id == exId);
        if (!ex) return;
        setCurrentDay({...currentDay, exercises: [...currentDay.exercises, { ...ex, sets: 3, reps: 10, rir: 2, exId: ex.id }]});
    };

    const updateExInDay = (idx, field, value) => {
        const updated = [...currentDay.exercises];
        updated[idx][field] = parseInt(value);
        setCurrentDay({...currentDay, exercises: updated});
    };

    const saveDayToProg = () => {
        if (!currentDay.name || currentDay.exercises.length === 0) return alert('Add day name and exercises');
        setProgDays([...progDays, { ...currentDay, id: Date.now() }]);
        setCurrentDay({ name: '', exercises: [] });
    };

    const saveProgram = () => {
        if (!progName || progDays.length === 0) return alert('Add program name and days');
        const prog = { id: Date.now(), name: progName, days: progDays };
        const updated = [...programs, prog];
        setPrograms(updated);
        save('programs', updated);
        setProgName('');
        setProgDays([]);
        alert('Program saved!');
    };

    const startProgram = (progId) => {
        const prog = programs.find(p => p.id === progId);
        if (!prog) return;
        setActiveProgram(prog);
        setCurrentDayIndex(0);
        try {
            localStorage.setItem(`ap_${userId}`, JSON.stringify(prog));
            localStorage.setItem(`cdi_${userId}`, '0');
        } catch(e) {}
        alert(`Started: ${prog.name}`);
    };

    const loadNextDay = () => {
        if (!activeProgram || activeProgram.days.length === 0) return alert('No active program');
        const day = activeProgram.days[currentDayIndex];
        
        const loaded = day.exercises.map(ex => {
            const base = exercises.find(e => e.id == ex.exId || e.id == ex.id);
            return base ? { ...base, prescribedSets: ex.sets, prescribedReps: ex.reps, prescribedRir: ex.rir } : null;
        }).filter(e => e !== null);

        if (loaded.length === 0) return alert('Exercise templates not found');

        setSelEx(loaded[0].id);
        setView('session');
        alert(`Loaded: ${day.name} (Day ${currentDayIndex + 1}/${activeProgram.days.length})`);
    };

    // Render - Loading
    if (!ready) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-2xl">Loading...</div>
            </div>
        );
    }

    // Render - Login
    if (showLogin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
                    <h1 className="text-3xl font-bold mb-2 text-center">Workout Tracker</h1>
                    <p className="text-slate-600 text-center mb-6">Enter your username to continue</p>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                        placeholder="Username" 
                        className="w-full px-4 py-3 border rounded-lg mb-4 text-lg"
                        autoFocus
                    />
                    <button 
                        onClick={handleLogin} 
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700"
                    >
                        Continue
                    </button>
                    <p className="text-xs text-slate-500 text-center mt-4">
                        Your workouts and progress are private. Exercises and programs are shared.
                    </p>
                </div>
            </div>
        );
    }

    // Render - Main App
    // Note: Due to length limits, the full UI views will need to be added
    // This is a working skeleton that can be expanded
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-white">
                        <span className="text-sm opacity-75">Logged in as:</span>
                        <span className="ml-2 font-semibold">{username}</span>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="text-white text-sm opacity-75 hover:opacity-100 underline"
                    >
                        Logout
                    </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button onClick={() => setView('session')} className={`py-4 rounded-lg font-semibold text-lg ${view === 'session' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}>Session</button>
                    <button onClick={() => setView('history')} className={`py-4 rounded-lg font-semibold text-lg ${view === 'history' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}>History</button>
                    <button onClick={() => setView('recovery')} className={`py-3 rounded-lg font-semibold ${view === 'recovery' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}>Recovery</button>
                    <button onClick={() => setView('exercises')} className={`py-3 rounded-lg font-semibold ${view === 'exercises' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}>Exercises</button>
                    <button onClick={() => setView('programs')} className={`py-3 rounded-lg font-semibold col-span-2 ${view === 'programs' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}>Programs</button>
                </div>

{view === 'session' && (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
        <h1 className="text-3xl font-bold mb-4 sm:mb-6">Log Session</h1>
        
        <button 
            onClick={() => setShowFatigueLog(!showFatigueLog)}
            className="w-full mb-4 py-3 px-4 bg-slate-100 rounded-lg text-base font-semibold"
        >
            {showFatigueLog ? 'Hide' : '+ Log'} Fatigue &amp; Soreness
        </button>

        {showFatigueLog && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border">
                <h3 className="font-semibold mb-4 text-lg">How do you feel today?</h3>
                
                <div className="mb-6">
                    <label className="block text-base font-medium mb-3">
                        Overall Fatigue: {perceivedFatigue}/10
                    </label>
                    <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={perceivedFatigue}
                        onChange={(e) => setPerceivedFatigue(parseInt(e.target.value))}
                        className="w-full h-3"
                    />
                    <div className="flex justify-between text-sm text-slate-600 mt-2">
                        <span>Energized</span>
                        <span>Neutral</span>
                        <span>Exhausted</span>
                    </div>
                </div>

                <div>
                    <label className="block text-base font-medium mb-3">Muscle Soreness (0-10)</label>
                    <div className="grid grid-cols-2 gap-3">
                        {window.MUSCLES.map(m => (
                            <div key={m} className="flex items-center gap-3">
                                <span className="text-base w-20 font-medium">{m}</span>
                                <input 
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={muscleSoreness[m] || 0}
                                    onChange={(e) => setMuscleSoreness({...muscleSoreness, [m]: parseInt(e.target.value) || 0})}
                                    className="flex-1 px-3 py-2 border rounded-lg text-base text-center"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
        
        {activeProgram && (
            <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                <div className="flex justify-between items-center gap-3">
                    <div>
                        <div className="font-semibold text-purple-900 text-lg">{activeProgram.name}</div>
                        <div className="text-base text-purple-700">Day {currentDayIndex + 1} of {activeProgram.days.length}: {activeProgram.days[currentDayIndex].name}</div>
                    </div>
                    <button onClick={loadNextDay} className="bg-purple-600 text-white px-5 py-3 rounded-lg text-base font-semibold whitespace-nowrap">
                        Load Day
                    </button>
                </div>
            </div>
        )}
        
        <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="w-full px-4 py-3 border-2 rounded-lg mb-4 text-lg" 
        />
        
        {exercises.length === 0 ? (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
                <p className="mb-4 text-lg">No exercises</p>
                <button onClick={() => setView('exercises')} className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold">Create Exercises</button>
            </div>
        ) : (
            <>
                <select 
                    value={selEx} 
                    onChange={(e) => handleExSelect(e.target.value)} 
                    className="w-full px-4 py-4 border-2 rounded-lg mb-4 text-lg font-medium"
                >
                    <option value="">Choose exercise...</option>
                    {Object.entries(window.exByMuscle(exercises)).map(([muscle, exs]) => (
                        <optgroup key={muscle} label={muscle}>
                            {exs.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </optgroup>
                    ))}
                </select>

                {selEx && (() => {
                    const prev = workouts.filter(w => w.id == selEx).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                    const selExObj = exercises.find(e => e.id == selEx);
                    const hasPrescribed = selExObj && selExObj.prescribedSets;
                    const prog = window.getProgression(selEx, exercises, workouts, muscleReadiness, systemicReadiness, weeklyStimulus);
                    
                    return (
                        <>
                            {prog && prog.advice !== 'first_time' && (
                                <div className={`border-2 rounded-lg p-4 mb-4 ${
                                    prog.readiness === 'deload' ? 'bg-orange-100 border-orange-300' :
                                    prog.readiness === 'high' ? 'bg-green-50 border-green-200' :
                                    prog.readiness === 'low' ? 'bg-red-50 border-red-200' :
                                    'bg-yellow-50 border-yellow-200'
                                }`}>
                                    <div className="text-base font-bold mb-2">
                                        {
                                            prog.advice === 'deload' ? '🔄 DELOAD NEEDED' :
                                            prog.advice === 'progress' ? '📈 Progress' :
                                            prog.advice === 'reduce' ? '⚠️ Reduce Load' :
                                            '➡️ Maintain'
                                        }
                                    </div>
                                    <div className="text-sm mb-2 leading-relaxed">{prog.suggestion}</div>
                                    {prog.reason && <div className="text-sm font-semibold mb-2 text-orange-700">{prog.reason}</div>}
                                    <div className="text-sm opacity-75">
                                        Muscle: {(prog.muscleReadiness * 100).toFixed(0)}% | 
                                        System: {(prog.systemicReadiness * 100).toFixed(0)}%
                                    </div>
                                </div>
                            )}
                            
                            {hasPrescribed && (
                                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
                                    <div className="text-base font-semibold text-purple-900">Program Prescription</div>
                                    <div className="text-sm text-purple-800">
                                        {selExObj.prescribedSets} sets × {selExObj.prescribedReps} reps @ {selExObj.prescribedRir} RIR
                                    </div>
                                </div>
                            )}
                            {prev && prev.sets && prev.sets.length > 0 && (
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                                    <div className="text-base font-semibold text-blue-900 mb-1">Last Performance ({new Date(prev.date).toLocaleDateString()})</div>
                                    <div className="text-sm text-blue-800">
                                        {prev.sets.map((s, i) => (
                                            <span key={i}>{i > 0 && ', '}{s.w}lb × {s.r} @ {s.rir}RIR</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {timerActive && restTimer > 0 && (
                                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center mb-4">
                                    <div className="text-base font-semibold text-green-900 mb-2">Rest Timer</div>
                                    <div className="text-5xl font-bold text-green-700">{window.formatTime(restTimer)}</div>
                                </div>
                            )}

                           {sets.length > 0 && (
    <div className="bg-slate-50 p-4 rounded-lg mb-4 border-2">
        {sets.map((s, i) => (
            <div key={i} className="flex justify-between items-center text-base mb-2 py-2 border-b last:border-b-0">
                                            <span className="font-semibold">Set {i+1}: {s.w}lb × {s.r} @ {s.rir}RIR</span>
                                            <button onClick={() => setSets(sets.filter((_, idx) => idx !== i))} className="text-red-500 text-2xl px-2">×</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Weight (lbs)</label>
                                    <input 
                                        type="number" 
                                        step="0.5" 
                                        value={input.w} 
                                        onChange={(e) => setInput({...input, w: e.target.value})} 
                                        placeholder="lbs" 
                                        className="w-full px-4 py-4 border-2 rounded-lg text-lg text-center font-semibold" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Reps</label>
                                    <input 
                                        ref={(el) => setRepsRef(el)}
                                        type="number" 
                                        value={input.r} 
                                        onChange={(e) => setInput({...input, r: e.target.value})} 
                                        onKeyPress={(e) => { if (e.key === 'Enter' && rirRef) rirRef.focus(); }}
                                        placeholder="reps" 
                                        className="w-full px-4 py-4 border-2 rounded-lg text-lg text-center font-semibold" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">RIR</label>
                                    <input 
                                        ref={(el) => setRirRef(el)}
                                        type="number" 
                                        value={input.rir} 
                                        onChange={(e) => setInput({...input, rir: e.target.value})} 
                                        onKeyPress={(e) => { if (e.key === 'Enter' && input.w && input.r && input.rir !== '') addSet(); }}
                                        placeholder="RIR" 
                                        className="w-full px-4 py-4 border-2 rounded-lg text-lg text-center font-semibold" 
                                    />
                                </div>
                            </div>

                            <button onClick={addSet} className="w-full bg-blue-600 text-white py-5 rounded-lg mb-3 font-bold text-xl">+ Add Set</button>
                            <button onClick={addToSess} className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg" disabled={sets.length === 0}>✓ Finish Exercise</button>
                        </>
                    );
                })()}
            </>
        )}

        {session.length > 0 && (
            <div className="mt-8 border-t-2 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Session ({session.length})</h2>
                    <button onClick={finish} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg">Finish</button>
                </div>
                {session.map((ex, i) => (
                    <div key={i} className="border-2 p-4 rounded-lg mb-3 bg-slate-50">
                        <div className="font-bold text-lg mb-2">{ex.name}</div>
                        {ex.sets.map((s, j) => <div key={j} className="text-sm py-1">Set {j+1}: {s.w}lb × {s.r} @ {s.rir}RIR</div>)}
                    </div>
                ))}
            </div>
        )}
    </div>
)}

{view === 'exercises' && (
    <div className="bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-4">Exercises</h1>
        
        <div className="space-y-3 mb-6 pb-6 border-b">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Exercise name" className="w-full px-3 py-2 border rounded" />
            
            <div className="grid grid-cols-2 gap-3">
                <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 border rounded">
                    {Object.entries(window.TYPES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
                <label className="flex items-center gap-2 border rounded px-3 py-2">
                    <input type="checkbox" checked={axial} onChange={(e) => setAxial(e.target.checked)} />
                    <span className="text-sm">Axially Loaded</span>
                </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {window.MUSCLES.map(m => (
                    <button key={m} onClick={() => toggle(m, 'primary')} className={`px-2 py-1 text-sm rounded border ${prim.includes(m) ? 'bg-blue-600 text-white' : 'bg-white'}`}>{m}</button>
                ))}
            </div>

            <button onClick={() => setShowAdv(!showAdv)} className="text-sm text-blue-600">{showAdv ? 'Hide' : '+ Add'} Secondary/Tertiary</button>

            {showAdv && (
                <>
                    <div>
                        <label className="text-xs font-semibold block mb-1">Secondary Muscles</label>
                        <div className="grid grid-cols-3 gap-2">
                            {window.MUSCLES.map(m => (
                                <button key={m} onClick={() => toggle(m, 'secondary')} className={`px-2 py-1 text-xs rounded border ${sec.includes(m) ? 'bg-green-600 text-white' : 'bg-white'}`}>{m}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold block mb-1">Tertiary Muscles</label>
                        <div className="grid grid-cols-3 gap-2">
                            {window.MUSCLES.map(m => (
                                <button key={m} onClick={() => toggle(m, 'tertiary')} className={`px-2 py-1 text-xs rounded border ${ter.includes(m) ? 'bg-purple-600 text-white' : 'bg-white'}`}>{m}</button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <button onClick={saveEx} className="w-full bg-blue-600 text-white py-2 rounded">Save Exercise</button>
        </div>

        <div>
            <div className="flex gap-2 mb-3">
                <button onClick={() => {
                    const presets = window.loadPresets();
                    setExercises(presets);
                    save('exercises', presets);
                }} className="text-blue-600 underline text-sm">Load Presets</button>
            </div>
            <h2 className="font-bold mb-3">All Exercises ({exercises.length})</h2>
            {exercises.map(ex => (
                <div key={ex.id} className="border p-3 rounded mb-2 flex justify-between">
                    <div>
                        <div className="font-semibold">{ex.name}</div>
                        <div className="text-xs text-slate-600">{ex.prim.join(', ')}</div>
                    </div>
                    <button onClick={() => delEx(ex.id)} className="text-red-500">🗑️</button>
                </div>
            ))}
        </div>
    </div>
)}

{view === 'history' && (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
        <h2 className="text-3xl font-bold mb-6">History</h2>
        
        {workouts.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-lg">No workout history yet</p>
        ) : (
            <>
                <div className="mb-8">
                    <h3 className="font-semibold mb-4 text-xl">
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                            <div key={d} className="text-center font-semibold text-xs sm:text-sm py-2">{d}</div>
                        ))}
                        {window.getDays().map((day, i) => {
                            if (!day) return <div key={i} />;
                            const dk = window.fmtDate(day);
                            const dw = workouts.filter(w => w.date === dk);
                            const isToday = dk === new Date().toISOString().split('T')[0];
                            
                            return (
                                <button
                                    key={i}
                                    onClick={() => dw.length && setSelDate(dk)}
                                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm sm:text-base ${
                                        dw.length ? 'bg-green-100 hover:bg-green-200 cursor-pointer font-semibold' : 'bg-slate-50'
                                    } ${isToday ? 'ring-2 ring-blue-500' : ''} ${selDate === dk ? 'ring-2 ring-purple-500' : ''}`}
                                >
                                    <span>{day.getDate()}</span>
                                    {dw.length > 0 && <span className="text-xs text-green-700 font-bold">{dw.length}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {selDate && (
                    <div className="border-t-2 pt-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl sm:text-2xl font-bold">
                                {new Date(selDate + 'T12:00:00').toLocaleDateString('en-US', { 
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </h3>
                            <button onClick={() => setSelDate(null)} className="px-4 py-2 bg-slate-200 rounded-lg text-sm font-semibold">Close</button>
                        </div>
                        
                        <div className="space-y-4">
                            {workouts.filter(w => w.date === selDate).map((w, i) => (
                                <div key={i} className="border-2 p-5 rounded-lg bg-slate-50">
                                    <div className="font-bold text-lg mb-3">{w.name}</div>
                                    {w.sets.map((s, j) => (
                                        <div key={j} className="text-base text-slate-700 py-1">
                                            Set {j+1}: <span className="font-semibold">{s.w}lb × {s.r}</span> @ {s.rir}RIR
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </>
        )}
    </div>
)}

{view === 'programs' && (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Programs</h1>
        
        {activeProgram && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="font-bold text-green-900">Active: {activeProgram.name}</div>
                        <div className="text-sm text-green-700">Day {currentDayIndex + 1} of {activeProgram.days.length}</div>
                    </div>
                    <button 
                        onClick={() => {
                            setActiveProgram(null);
                            setCurrentDayIndex(0);
                            try {
                                localStorage.removeItem(`ap_${userId}`);
                                localStorage.removeItem(`cdi_${userId}`);
                            } catch(e) {}
                        }} 
                        className="text-sm text-red-600"
                    >
                        Stop
                    </button>
                </div>
            </div>
        )}
        
        <div className="space-y-4 mb-6 pb-6 border-b">
            <h3 className="font-semibold text-lg sm:text-xl">Create Program</h3>
            <input 
                type="text" 
                value={progName} 
                onChange={(e) => setProgName(e.target.value)} 
                placeholder="Program name (e.g., Push Pull Legs)" 
                className="w-full px-4 py-3 border-2 rounded-lg text-base" 
            />
            
            <div className="border-2 rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold mb-4 text-base sm:text-lg">Build Training Day</h3>
                <input 
                    type="text" 
                    value={currentDay.name} 
                    onChange={(e) => setCurrentDay({...currentDay, name: e.target.value})} 
                    placeholder="Day name (e.g., Upper A, Push, Legs)" 
                    className="w-full px-4 py-3 border-2 rounded-lg mb-4 text-base" 
                />
                
                {exercises.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                        <button onClick={() => setView('exercises')} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold">Create Exercises</button>
                    </div>
                ) : (
                    <>
                        <select 
                            onChange={(e) => { if (e.target.value) { addExToDay(e.target.value); e.target.value = ''; } }} 
                            className="w-full px-4 py-3 border-2 rounded-lg mb-4 text-base" 
                            value=""
                        >
                            <option value="">+ Add exercise to day...</option>
                            {Object.entries(window.exByMuscle(exercises)).map(([muscle, exs]) => (
                                <optgroup key={muscle} label={muscle}>
                                    {exs.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                                </optgroup>
                            ))}
                        </select>

                        {currentDay.exercises.length > 0 && (
                            <div className="space-y-3 mb-4">
                                {currentDay.exercises.map((ex, i) => (
                                    <div key={i} className="bg-white p-4 rounded-lg border-2">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="font-semibold text-base">{ex.name}</span>
                                            <button onClick={() => setCurrentDay({...currentDay, exercises: currentDay.exercises.filter((_, idx) => idx !== i)})} className="text-red-500 text-xl px-2">×</button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-sm font-semibold block mb-1">Sets</label>
                                                <input type="number" value={ex.sets} onChange={(e) => updateExInDay(i, 'sets', e.target.value)} className="w-full px-3 py-2 border-2 rounded-lg text-base text-center font-semibold" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold block mb-1">Reps</label>
                                                <input type="number" value={ex.reps} onChange={(e) => updateExInDay(i, 'reps', e.target.value)} className="w-full px-3 py-2 border-2 rounded-lg text-base text-center font-semibold" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold block mb-1">RIR</label>
                                                <input type="number" value={ex.rir} onChange={(e) => updateExInDay(i, 'rir', e.target.value)} className="w-full px-3 py-2 border-2 rounded-lg text-base text-center font-semibold" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button onClick={saveDayToProg} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-base">✓ Add Day to Program</button>
                    </>
                )}
            </div>

            {progDays.length > 0 && (
                <div className="border-2 rounded-lg p-4">
                    <h3 className="font-semibold mb-4 text-base sm:text-lg">Program Days ({progDays.length})</h3>
                    {progDays.map((day, i) => (
                        <div key={i} className="mb-4 p-4 bg-slate-50 rounded-lg border">
                            <div className="flex justify-between items-start mb-3">
                                <div className="font-bold text-base">{day.name}</div>
                                <button onClick={() => setProgDays(progDays.filter((_, idx) => idx !== i))} className="text-red-500 text-xl">🗑️</button>
                            </div>
                            {day.exercises.map((ex, j) => (
                                <div key={j} className="text-sm text-slate-600 py-1">• {ex.name} - {ex.sets}×{ex.reps} @ {ex.rir}RIR</div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            <button onClick={saveProgram} className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg" disabled={progDays.length === 0}>Save Program</button>
        </div>

        <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Saved Programs ({programs.length})</h2>
            {programs.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No programs yet</p>
            ) : (
                <div className="space-y-4">
                    {programs.map(prog => (
                        <div key={prog.id} className="border-2 p-5 rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="font-bold text-xl">{prog.name}</div>
                                <button 
                                    onClick={() => startProgram(prog.id)} 
                                    className="bg-green-600 text-white px-5 py-2 rounded-lg text-base font-semibold"
                                    disabled={activeProgram && activeProgram.id === prog.id}
                                >
                                    {activeProgram && activeProgram.id === prog.id ? '✓ Active' : 'Start'}
                                </button>
                            </div>
                            <div className="space-y-3">
                                {prog.days.map((day, i) => (
                                    <div key={i} className="pl-4 border-l-4 border-blue-500">
                                        <div className="font-semibold text-base mb-1">Day {i + 1}: {day.name}</div>
                                        {day.exercises.map((ex, j) => (
                                            <div key={j} className="text-sm text-slate-600">• {ex.name} - {ex.sets}×{ex.reps} @ {ex.rir}RIR</div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
)}

{view === 'recovery' && (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Recovery Status</h1>

        <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
            <h2 className="font-bold text-xl mb-4">Systemic Readiness</h2>
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                        <div 
                            className={`h-full transition-all ${
                                systemicReadiness > 0.85 ? 'bg-green-500' :
                                systemicReadiness > 0.65 ? 'bg-yellow-500' :
                                systemicReadiness > 0.50 ? 'bg-orange-500' :
                                'bg-red-500'
                            }`}
                            style={{width: `${systemicReadiness * 100}%`}}
                        ></div>
                    </div>
                </div>
                <div className="text-3xl font-bold">
                    {(systemicReadiness * 100).toFixed(0)}%
                </div>
            </div>
            {systemicReadiness < 0.6 && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-sm">
                    ⚠️ <strong>Systemic Deload Needed:</strong> Reduce sets 40-60%, increase RIR +2-3, remove/reduce axial lifts
                </div>
            )}
        </div>

        <div className="mb-8">
            <h2 className="font-bold text-xl mb-4">Muscle Readiness</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {window.MUSCLES.map(m => {
                    const readiness = muscleReadiness[m] || 1.0;
                    const stimulus = weeklyStimulus[m] || 0;
                    return (
                        <div key={m} className="border-2 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-base">{m}</span>
                                <span className="text-lg font-bold">{(readiness * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-2">
                                <div 
                                    className={`h-full transition-all ${
                                        readiness > 0.85 ? 'bg-green-500' :
                                        readiness > 0.65 ? 'bg-yellow-500' :
                                        readiness > 0.50 ? 'bg-orange-500' :
                                        'bg-red-500'
                                    }`}
                                    style={{width: `${readiness * 100}%`}}
                                ></div>
                            </div>
                            <div className="text-sm text-slate-600">
                                Weekly stimulus: {stimulus.toFixed(2)}
                            </div>
                            {readiness < 0.6 && (
                                <div className="mt-2 text-sm text-red-700 font-semibold">
                                    ⚠️ Local deload needed
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {lastWorkoutDate && (
            <div className="p-4 bg-slate-50 border-2 rounded-lg mb-6">
                <p className="text-base text-slate-700">
                    <strong>Last workout:</strong> {new Date(lastWorkoutDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                    Recovery is calculated automatically based on time since last session
                </p>
            </div>
        )}

        <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h3 className="font-bold text-lg mb-3">Readiness Guide</h3>
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-base"><strong>&gt;85%:</strong> Ready to progress</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-base"><strong>65-85%:</strong> Maintain current load</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-base"><strong>50-65%:</strong> Reduce intensity</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-base"><strong>&lt;50%:</strong> Deload needed</span>
                </div>
            </div>
        </div>
    </div>
)}
            </div>
        </div>
    );
}

ReactDOM.render(<WorkoutTracker />, document.getElementById('root'));
