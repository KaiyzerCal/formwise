/**
 * Achievement unlock definitions — maps achievement IDs to specific feature unlocks
 */

export const ACHIEVEMENT_UNLOCKS = {
  FIRST_STEP: {
    feature: 'technique_compare',
    label: 'TechniqueCompare page access',
  },
  CONSISTENT: {
    feature: 'full_analytics_default',
    label: 'Full Analytics expanded by default',
  },
  PERFECTIONIST: {
    feature: 'personal_best_showcase',
    label: 'Personal Best showcase card on home screen',
  },
  FORM_FREAK: {
    feature: 'personalized_coaching_focus',
    label: 'AXIS personalized coaching focus card',
  },
  ELITE: {
    feature: 'leaderboard_visibility',
    label: 'Leaderboard visibility — your score appears publicly',
  },
  IRON_WILL: {
    feature: '50_session_retrospective',
    label: '50-session retrospective from AXIS',
  },
};

export function getUnlockDescription(achievementId) {
  return ACHIEVEMENT_UNLOCKS[achievementId]?.label || null;
}

export function hasUnlock(earnedIds, feature) {
  return Object.entries(ACHIEVEMENT_UNLOCKS).some(
    ([id, u]) => u.feature === feature && earnedIds.has(id)
  );
}