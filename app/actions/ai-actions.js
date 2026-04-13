"use server";

import { validateSentence, generateDetectiveClues } from "@/lib/ai-service";
import { createClient } from "@/lib/supabase/server";
import { getRandomWord } from "@/lib/word-utils";

/**
 * Server Action to validate a user's contextual sentence usage.
 */
export async function validateUserSentence(word, sentence) {
  if (!word || !sentence) {
    return { status: "FAILURE", feedback: "Linguistic mastery requires both a word and its context." };
  }

  // Artificial sanctuary delay for premium UX
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    const response = await validateSentence(word, sentence);
    return response;
  } catch (error) {
    console.error("AI Action Error:", error);
    return { status: "FAILURE", feedback: "The subtle nuances of the lexicon are currently obscured. Please try again." };
  }
}

/**
 * Server Action for the Detective Game: Fetches a word and generates clues.
 */
export async function fetchDetectiveChallenge(level, interests, dynamicPool = []) {
  try {
    const wordObj = getRandomWord(level, interests, dynamicPool);
    if (!wordObj) throw new Error("No words available for this tier.");

    const clues = await generateDetectiveClues(wordObj.word);
    
    // Return clues and word metadata, but hide the word itself
    return {
      wordId: wordObj.id,
      clues,
      level: wordObj.level,
      category: wordObj.category,
      // We'll reveal the actual word only on success
      hiddenWord: wordObj.word
    };
  } catch (error) {
    console.error("Detective Action Error:", error);
    return null;
  }
}

/**
 * Server Action for the Detective Game: Resolves if a guess is correct.
 */
export async function resolveDetectiveCase(wordId, guess, revealedCount, hiddenWord) {
  const isCorrect = guess.toLowerCase().trim() === hiddenWord.toLowerCase().trim();
  
  if (isCorrect) {
    // Scoring logic: 1 clue=50, 2 clues=25, 3 clues=10
    const xpMap = { 1: 50, 2: 25, 3: 10 };
    const xpEarned = xpMap[revealedCount] || 10;
    
    // Sync with progression
    const sync = await syncProgression({ word: hiddenWord }, true, xpEarned);
    return { correct: true, xpEarned, sync };
  }

  return { correct: false };
}

/**
 * Updates the user's progress in the persistent sanctuary.
 */
export async function syncProgression(wordObj, isSuccess, customXp = 50) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { guest: true };

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, needs_review, streak_count')
      .eq('id', user.id)
      .single();

    let newXp = (profile?.xp || 0);
    let newStreak = (profile?.streak_count || 0);
    let newReview = [...(profile?.needs_review || [])];

    if (isSuccess) {
      newXp += customXp;
      newStreak += 1;
      // Bonus for milestones
      if (newStreak % 5 === 0) newXp += 100;

      // Update progress table
      const { data: progress } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('word_id', wordObj.word)
        .single();
      
      if (progress) {
        await supabase
          .from('progress')
          .update({ 
            total_attempts: progress.total_attempts + 1,
            success_rate: Math.round(((progress.success_rate * progress.total_attempts) + 100) / (progress.total_attempts + 1)),
            last_practiced: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('word_id', wordObj.word);
      } else {
        await supabase
          .from('progress')
          .insert({
            user_id: user.id,
            word_id: wordObj.word,
            total_attempts: 1,
            success_rate: 100,
            last_practiced: new Date().toISOString()
          });
      }
    } else {
      newStreak = 0;
      if (!newReview.some(w => w.word === wordObj.word)) {
        newReview.push(wordObj);
      }
    }

    await supabase
      .from('profiles')
      .update({ 
        xp: newXp, 
        streak_count: newStreak,
        needs_review: newReview
      })
      .eq('id', user.id);

    return { success: true, newXp, newStreak };
  } catch (error) {
    console.error("Sync Error:", error);
    return { success: false };
  }
}
