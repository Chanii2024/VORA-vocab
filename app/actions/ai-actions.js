"use server";

import { validateSentence } from "@/lib/ai-service";
import { createClient } from "@/lib/supabase/server";

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
 * Updates the user's progress in the persistent sanctuary.
 */
export async function syncProgression(wordObj, isSuccess) {
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
      newXp += 50;
      newStreak += 1;
      // Bonus for milestones
      if (newStreak % 5 === 0) newXp += 100;
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
