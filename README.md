# Workout Tracker - Modular Architecture

A comprehensive workout tracking application with intelligent fatigue management, progression recommendations, and program building capabilities.

## 📁 Project Structure

```
workout-tracker/
├── src/
│   ├── constants/
│   │   ├── muscles.js              # Muscle groups & categories
│   │   ├── exerciseTypes.js        # Exercise type definitions
│   │   └── config.js               # App configuration
│   │
│   ├── utils/
│   │   ├── fatigueCalculations.js  # Fatigue & recovery algorithms
│   │   ├── progressionLogic.js     # Progression recommendations
│   │   ├── muscleGroups.js         # Muscle group helpers
│   │   ├── exercisePresets.js      # Default exercise library
│   │   ├── dateHelpers.js          # Date formatting & calendar
│   │   └── volumeAnalysis.js       # Volume trends & analytics
│   │
│   ├── services/
│   │   ├── storage.js              # LocalStorage wrapper
│   │   └── database.js             # Firebase abstraction
│   │
│   ├── hooks/
│   │   ├── useAuth.js              # User authentication
│   │   ├── useRestTimer.js         # Rest timer logic
│   │   ├── useExercises.js         # Exercise CRUD operations
│   │   ├── useWorkouts.js          # Workout data & operations
│   │   ├── usePrograms.js          # Program management
│   │   └── useFatigue.js           # Fatigue tracking logic
│   │
│   ├── components/
│   │   ├── shared/
│   │   │   ├── SetEditor.jsx       # Reusable set input
│   │   │   ├── ProgressionCard.jsx # Progression advice display
│   │   │   └── MuscleReadiness.jsx # Readiness visualization
│   │   │
│   │   ├── LoginScreen.jsx         # Login/auth UI
│   │   ├── SessionView.jsx         # Session logging UI
│   │   ├── HistoryView.jsx         # Workout history & calendar
│   │   ├── RecoveryView.jsx        # Recovery metrics & readiness
│   │   ├── ExercisesView.jsx       # Exercise library management
│   │   └── ProgramsView.jsx        # Program builder & management
│   │
│   ├── App.jsx                     # Main application component
│   └── index.js                    # Module exports
│
└── README.md
```

## 🚀 Quick Start

### Basic Usage

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
```

### Using Individual Hooks

```javascript
import { useAuth, useWorkouts, useFatigue } from './hooks';

function MyComponent() {
  const { userId, username, login, logout } = useAuth();
  const { workouts, addWorkout } = useWorkouts(userId);
  const { muscleReadiness, systemicReadiness } = useFatigue(userId);

  // Your component logic
}
```

### Using Utility Functions

```javascript
import { getProgression, calculateFatigue } from './utils';

const progression = getProgression(
  exerciseId,
  exercises,
  workouts,
  muscleReadiness,
  systemicReadiness,
  weeklyStimulus
);
```

## 🎯 Key Features

### 1. **Intelligent Fatigue Management**
- Tracks local muscle fatigue and systemic fatigue
- Time-based recovery calculations
- Automatic deload detection
- Perceived fatigue and soreness logging

### 2. **Smart Progression System**
- AI-powered load recommendations
- Performance trend analysis
- Readiness-based progression
- Volume optimization

### 3. **Program Builder**
- Create custom training programs
- Multi-day program support
- Exercise prescriptions (sets/reps/RIR)
- Active program tracking with auto-advancement

### 4. **Comprehensive Analytics**
- Workout history with calendar view
- Volume trends (4-week analysis)
- Personal records tracking
- Muscle-specific volume tracking

### 5. **Exercise Library**
- 40+ preset exercises
- Custom exercise creation
- Muscle group categorization
- Axial loading tracking

## 💾 Data Architecture

### Storage Layers

1. **LocalStorage** (via `storageService`)
   - User credentials
   - Active program state
   - Quick access data

2. **Firebase** (via `databaseService`)
   - Exercise library (shared)
   - Training programs (shared)
   - Workout history (user-specific)
   - Fatigue state (user-specific)

### Data Flow

```
User Action → Component → Hook → Service → Database
                ↓
            State Update
                ↓
            Re-render
```

## 🎨 Component Usage Examples

### SessionView

```javascript
<SessionView
  exercises={exercises}
  workouts={workouts}
  muscleReadiness={muscleReadiness}
  systemicReadiness={systemicReadiness}
  weeklyStimulus={weeklyStimulus}
  activeProgram={activeProgram}
  currentDayIndex={currentDayIndex}
  onSessionComplete={handleSessionComplete}
  onLoadProgramDay={handleLoadProgramDay}
  useRestTimer={() => restTimer}
/>
```

### ProgressionCard

```javascript
<ProgressionCard
  progression={{
    advice: 'progress',
    readiness: 'high',
    suggestion: 'Increase weight by 5lbs',
    muscleReadiness: 0.92,
    systemicReadiness: 0.88
  }}
/>
```

### MuscleReadiness

```javascript
<MuscleReadiness
  muscleReadiness={muscleReadiness}
  weeklyStimulus={weeklyStimulus}
  showStimulus={true}
  layout="grid"
/>
```

## 🔧 Configuration

### Fatigue Settings

```javascript
// constants/config.js
export const FATIGUE_CONFIG = {
  LOCAL_RECOVERY_RATE: 0.15,      // 15% per day
  SYSTEMIC_RECOVERY_RATE: 0.12,   // 12% per day
  BASE_FATIGUE_PER_SET: 0.033,
  AXIAL_LOAD_MULTIPLIER: 1.5,
  PROGRESSION_THRESHOLD: 0.85,
  DELOAD_THRESHOLD: 0.6
};
```

### Progression Settings

```javascript
export const PROGRESSION_CONFIG = {
  UPPER_BODY_INCREMENT: 2.5,      // lbs
  LOWER_BODY_INCREMENT: 5,        // lbs
  MIN_SETS_PER_WEEK: 10,
  MAX_SETS_PER_WEEK: 20,
  OPTIMAL_SETS_PER_WEEK: 15
};
```

## 📊 Hook Reference

### useAuth()

```javascript
const {
  userId,           // Current user ID
  username,         // Username
  isAuthenticated,  // Auth status
  isLoading,        // Loading state
  login,            // Login function
  logout            // Logout function
} = useAuth();
```

### useWorkouts(userId)

```javascript
const {
  workouts,                    // Array of workouts
  isLoading,                   // Loading state
  addWorkout,                  // Add single workout
  addSession,                  // Add session (multiple exercises)
  getWorkoutsForExercise,      // Query by exercise
  getWorkoutStats,             // Statistics
  exportWorkouts,              // Export as JSON
  importWorkouts               // Import from JSON
} = useWorkouts(userId);
```

### useFatigue(userId)

```javascript
const {
  muscleReadiness,             // Readiness per muscle (0-1)
  systemicReadiness,           // Overall readiness (0-1)
  weeklyStimulus,              // Sets per muscle this week
  processWorkoutSession,       // Update from session
  getDeloadRecommendation,     // Check if deload needed
  getRecoveryTimeline          // Estimate recovery time
} = useFatigue(userId);
```

### usePrograms(userId)

```javascript
const {
  programs,                    // All programs
  activeProgram,               // Currently active program
  currentDayIndex,             // Current day in program
  addProgram,                  // Create program
  startProgram,                // Activate program
  stopProgram,                 // Deactivate program
  advanceToNextDay,            // Move to next day
  getCurrentDay                // Get current day data
} = usePrograms(userId);
```

## 🧪 Testing

### Example Test

```javascript
import { calculateSetFatigue } from './utils/fatigueCalculations';

test('calculates set fatigue correctly', () => {
  const set = { w: 100, r: 10, rir: 2 };
  const result = calculateSetFatigue(set, 'compound_upper', false);
  
  expect(result.localFatigue).toBeGreaterThan(0);
  expect(result.systemicFatigue).toBeGreaterThan(0);
});
```

## 🎨 Styling

The application uses **Tailwind CSS** for styling. All components use utility classes from Tailwind's core library.

### Customization

```javascript
// Modify button styles
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
  Custom Button
</button>
```

## 🚨 Error Handling

All service operations include error handling:

```javascript
try {
  await databaseService.saveCollection('exercises', exercises);
} catch (error) {
  console.error('Save failed:', error);
  // Handle error (show notification, retry, etc.)
}
```

## 📱 Mobile Support

All components are fully responsive:
- Touch-friendly buttons (larger tap targets)
- Swipe gestures for set deletion
- Mobile-optimized layouts
- Responsive grid systems

## 🔐 Security

- User data is scoped by userId
- No sensitive data in localStorage
- Firebase security rules recommended
- Input validation on all forms

## 🎯 Best Practices

1. **Always check authentication** before accessing user data
2. **Use error boundaries** to catch component errors
3. **Debounce auto-save** operations to reduce database writes
4. **Validate user input** before saving
5. **Provide loading states** for better UX

## 📈 Performance Optimization

- Lazy load views (React.lazy)
- Memoize expensive calculations
- Debounced auto-save (1 second)
- Efficient re-renders with proper dependencies

## 🤝 Contributing

When adding new features:
1. Create utilities in `/utils`
2. Create hooks for state management
3. Create reusable components in `/components/shared`
4. Add exports to `index.js`
5. Update this README

## 📄 License

MIT License - feel free to use in your own projects!

---

**Total Lines of Code:** ~5000+  
**Total Files:** 27  
**Bundle Size:** ~150KB (estimated)  
**Supported Browsers:** Modern browsers (Chrome, Firefox, Safari, Edge)
