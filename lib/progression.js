/**
 * VORA Progression Logic
 * Calculates XP, Level Thresholds, and Elevation Triggers.
 */

export const LEVEL_HIERARCHY = ["Beginner", "Intermediate", "Elite", "Master"];

/**
 * Calculates if a user is eligible for "Elevation" (Level up).
 * Rules: Accuracy > 85% over the last 50 words.
 */
export function checkElevationEligibility(history) {
  if (!history || history.length < 50) {
    return { 
      eligible: false, 
      reason: "Insufficient data points. Continue practicing.",
      progress: (history?.length || 0) / 50
    };
  }

  const last50 = history.slice(-50);
  const correctCount = last50.filter(entry => entry.isCorrect).length;
  const accuracy = (correctCount / 50) * 100;

  return {
    eligible: accuracy >= 85,
    accuracy: Math.round(accuracy),
    count: history.length,
    threshold: 85
  };
}

/**
 * Calculates XP gained from a game session.
 */
export function calculateXPGain(score, streak) {
  const base = score * 1.5;
  const bonus = streak > 5 ? streak * 2 : 0;
  return Math.floor(base + bonus);
}

/**
 * Returns the XP required to clear the current level.
 */
export function getXPForNextLevel(currentLevel) {
  const thresholds = {
    "Beginner": 500,
    "Intermediate": 1500,
    "Elite": 5000,
    "Master": 10000
  };
  return thresholds[currentLevel] || 1000;
}

/**
 * Returns the next level in the hierarchy.
 */
export function getNextLevel(currentLevel) {
  const index = LEVEL_HIERARCHY.indexOf(currentLevel);
  if (index === -1 || index === LEVEL_HIERARCHY.length - 1) return currentLevel;
  return LEVEL_HIERARCHY[index + 1];
}
