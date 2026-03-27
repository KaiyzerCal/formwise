# Bioneer Gamification System

Complete gamification suite with points, levels, achievements, leaderboards, and streaks.

## Components Overview

### 1. **Points & XP System**
- **Location**: `lib/gamificationEngine.js`
- **Points Awarded For**:
  - `SESSION_COMPLETE`: 100 XP per session
  - `PERSONAL_BEST`: 50 XP bonus for beating previous form score
  - `PERFECT_REP`: 10 XP per rep with 95+ score
  - `ZERO_FAULT_SET`: 75 XP for 10+ reps with zero faults
  - `STREAK_DAY`: 25 XP for maintaining daily streak
  - `EXERCISE_MASTERY`: 150 XP for achieving 85+ avg
  - `ELITE_MASTERY`: 200 XP for achieving 90+ avg

**Integration**: Points are automatically awarded when sessions are saved in `LiveSession`.

### 2. **Level Progression**
- 50 levels total (MAX_LEVEL = 50)
- Thresholds defined in `LEVEL_THRESHOLDS` array
- Progress tracked in `UserProfile` entity
- Level-up toasts & confetti on rank increase

**Functions**:
- `calculateLevel(totalXP)` — Calculate level from XP
- `getXPToNextLevel(currentXP, level)` — Get XP needed for next level
- `getLevelProgress(totalXP, level)` — Get 0-100% progress bar

### 3. **Achievements**
- **Location**: `lib/achievements.js`
- 12 achievements with emoji badges
- Examples: FIRST_STEP 🚀, CONSISTENT 🔥, PERFECTIONIST 💎, ELITE 🏆
- Auto-awarded via `checkAndAwardAchievements()` after sessions

**Earned Achievements Storage**: `UserAchievement` entity

### 4. **Leaderboard**
- **Component**: `components/bioneer/gamification/LeaderboardPanel.jsx`
- Top 10 global rankings by XP
- Shows user rank even if outside top 10
- Displays: Rank, Level, XP, Sessions, Streak

**Data**: Fetches from `UserProfile` entity sorted by `xp_total`

### 5. **Streaks**
- **Type**: Daily workout streaks
- Automatically tracked in `UserProfile.current_streak`
- Updated via `recordSession()` in `lib/retentionEngine.js`
- Broken when user misses a day

**Display Component**: `StreakCounter.jsx` (compact widget)

### 6. **UI Components**

#### XPProgressCard
- Displays current level and progress bar
- Shows XP needed for next level
- Responsive, animated

#### LeaderboardPanel
- Top 10 users with medal emojis (🥇🥈🥉)
- User's rank highlighted
- Sessions & streak info per user

#### StreakCounter
- Animated flame icon for active streaks
- Shows current day count
- Compact size for dashboard widget

#### SessionRewardScreen
- Shows session points earned
- Calculates bonuses dynamically
- Integrated into post-session flow

## Entities Used

### UserProfile
```javascript
{
  xp_total: 0,           // Total XP earned
  level: 1,              // Current level (1-50)
  total_sessions: 0,     // Session count
  current_streak: 0,     // Days in current streak
  longest_streak: 0,     // Longest streak achieved
  last_session_date: "",  // ISO timestamp
}
```

### UserAchievement
```javascript
{
  achievement_id: "FIRST_STEP",
  title: "FIRST STEP",
  earned_at: "2025-03-27T..."
}
```

## Integration Points

### 1. Session Completion
File: `pages/LiveSession`
```javascript
// Points awarded automatically
awardSessionPoints(sessionWithVideo)
```

### 2. Achievement Check
File: `pages/LiveSession`
```javascript
// Run after every session
checkAndAwardAchievements()
```

### 3. Achievements Page
File: `pages/Achievements`
Shows:
- XP progress card with level
- All achievements (earned/locked)
- Global leaderboard
- Stats (badges earned, completion %)

### 4. Dashboard Integration
Add `StreakCounter` to home dashboard for quick streak visibility.

## How to Use

### Award Points Manually
```javascript
import { awardPoints } from '@/lib/gamificationEngine';

const result = await awardPoints(150, 'Custom Reason');
// result = { xp: 1250, level: 5, pointsEarned: 150 }
```

### Get Leaderboard
```javascript
import { getLeaderboard, getUserRank } from '@/lib/gamificationEngine';

const top10 = await getLeaderboard(10);
const userRank = await getUserRank('user@example.com');
```

### Check User Level
```javascript
import { calculateLevel, getLevelProgress } from '@/lib/gamificationEngine';

const level = calculateLevel(1500); // Returns 5
const progress = getLevelProgress(1500, 5); // Returns 0-100%
```

## Visual Design

All components use Bioneer design tokens:
- Gold (#C9A227) for primary highlights
- Dark surface (#0c0c0c) for backgrounds
- Monospace fonts for UI text
- Framer Motion for smooth animations

## Performance Notes

- Point awards are fire-and-forget (non-blocking)
- Leaderboard fetches top 500 users, filtered client-side
- Achievements checked after every session
- Streaks tracked per user, updated on session save

## Future Enhancements

- Weekly leaderboards (reset each week)
- Seasonal challenges & time-limited badges
- Social sharing of achievements
- Milestone rewards (unlock special content at level 25, 50, etc.)
- Achievement rarity tiers (common, rare, legendary)