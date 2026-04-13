"use server";

import { createClient } from "@/lib/supabase/server";
import { words as staticWords } from "@/lib/data/words";

/**
 * Fetches all necessary data for the VORA Vault analytics hub.
 */
export async function fetchVaultData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    // 1. Fetch Profile for XP, Level, and Streak
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 2. Fetch Progress for specific word mastery
    const { data: progress } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', user.id);

    // 3. Process analytics
    const masteredWords = [];
    const labWords = [];
    const categoryStats = {};
    
    // Group all words (static + any dynamic if we had them)
    const allWords = [...staticWords]; // Simplified for now
    
    progress.forEach(p => {
      const wordObj = allWords.find(w => w.word === p.word_id);
      if (wordObj) {
        const entry = { ...wordObj, ...p };
        
        // Mastery threshold: 75%
        if (p.success_rate >= 75) {
          masteredWords.push(entry);
        } else {
          labWords.push(entry);
        }

        // Category stats
        const cat = wordObj.category || 'General';
        if (!categoryStats[cat]) {
          categoryStats[cat] = { total: 0, success: 0 };
        }
        categoryStats[cat].total += 1;
        categoryStats[cat].success += (p.success_rate / 100);
      }
    });

    // Format category breakdown
    const formattedCategories = Object.keys(categoryStats).map(cat => ({
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      rate: Math.round((categoryStats[cat].success / categoryStats[cat].total) * 100)
    })).sort((a, b) => b.rate - a.rate);

    // Calculate overall mastery
    // For MVP, mastery is (mastered_words / total_words_seen)
    const overallMastery = progress.length > 0 
      ? Math.round((masteredWords.length / progress.length) * 100) 
      : 0;

    // Determine VORA Rank
    // Simple logic: Thresholds + Level
    const ranks = {
      "Beginner": "Artisan",
      "Intermediate": "Sleuth",
      "Elite": "Detective",
      "Master": "Orator"
    };
    const rankPrefix = ranks[profile.current_level] || "Scholar";
    const voraRank = profile.xp > 5000 ? `Senior ${rankPrefix}` : rankPrefix;

    return {
      profile: {
        ...profile,
        voraRank,
        avatarInitials: profile.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()
      },
      mastery: {
        overall: overallMastery,
        masteredCount: masteredWords.length,
        labCount: labWords.length,
        totalSeen: progress.length
      },
      categories: formattedCategories.slice(0, 5), // Top 5
      words: {
        mastered: masteredWords.slice(0, 50),
        lab: labWords.slice(0, 50)
      }
    };
  } catch (error) {
    console.error("Vault Data Error:", error);
    return null;
  }
}
