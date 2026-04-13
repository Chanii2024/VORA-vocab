import { words } from "./data/words";

/**
 * @param {string[]} interests - Optional array of interest tags to prioritize.
 * @param {object[]} dynamicWords - Additional AI-generated words.
 * @param {number[]} excludeIds - IDs of words to exclude (for session variety).
 */
export function getRandomWord(level, interests = [], dynamicWords = [], excludeIds = []) {
  // Combine static and dynamic words
  const fullPool = [...words, ...dynamicWords];
  
  // 1. Filter by level strictly first
  let levelPool = fullPool.filter((w) => w.level === level && !excludeIds.includes(w.id));
  
  // If we've seen everything in this level, reset the cycle for variety
  if (levelPool.length === 0) {
    levelPool = fullPool.filter((w) => w.level === level);
  }
  
  // Fallback to full pool if still empty
  if (levelPool.length === 0) {
    levelPool = fullPool;
  }

  // 2. Filter by interests if provided
  if (interests && interests.length > 0) {
    const interestPool = levelPool.filter((w) => 
      interests.some(interest => w.category?.toLowerCase() === interest.toLowerCase())
    );
    
    if (interestPool.length > 0 && Math.random() > 0.05) { // 95% chance for interest match
      return interestPool[Math.floor(Math.random() * interestPool.length)];
    }
  }

  // 3. Natural selection from level pool
  return levelPool[Math.floor(Math.random() * levelPool.length)];
}

/**
 * Returns a consistent word based on the current date.
 * Enhanced to include a rationale for sophisticated learning.
 */
export function getWordOfTheDay() {
  const today = new Date();
  const index = (today.getFullYear() * 365 + today.getMonth() * 31 + today.getDate()) % words.length;
  
  const word = words[index];
  return {
    ...word,
    rationale: word.rationale || "This word is a hallmark of sophisticated articulation, bridge-building between common expression and elite precision."
  };
}

/**
 * Returns a daily task object.
 */
export function getDailyTask() {
  return {
    id: "task-1",
    goal: "Match 5 Synonyms",
    reward: "Master Streak Unlock",
    description: "Connect synonyms for high-end words to prove your lexicon mastery.",
  };
}

/**
 * Returns the count of words available for a given level.
 */
export function getWordCount(level) {
  if (!level) return words.length;
  return words.filter((w) => w.level === level).length;
}

/**
 * Returns 3 options for a game (1 correct synonym, 2 distractors).
 */
export function getSynonymOptions(word, dynamicWords = []) {
  if (!word) return [];
  
  const fullPool = [...words, ...dynamicWords];
  
  // 1. Get a correct synonym
  const synonyms = word.synonyms || [];
  const correct = synonyms.length > 0 
    ? synonyms[Math.floor(Math.random() * synonyms.length)]
    : "Excellent"; // Fallback
  
  // 2. Get distractors from other words
  const otherWords = fullPool.filter(w => w.word !== word.word);
  const allOtherSynonyms = otherWords.flatMap(w => w.synonyms || []);
  const distractors = [];
  
  while (distractors.length < 2) {
    const randomSyn = allOtherSynonyms[Math.floor(Math.random() * allOtherSynonyms.length)];
    if (randomSyn && !synonyms.includes(randomSyn) && !distractors.includes(randomSyn)) {
      distractors.push(randomSyn);
    }
    
    // Safety break if pool is tiny
    if (allOtherSynonyms.length < 2) {
      distractors.push("Fine", "Good");
      break;
    }
  }
  
  // 3. Shuffle options
  return [correct, ...distractors].sort(() => Math.random() - 0.5);
}
