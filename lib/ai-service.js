import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEN_AI_KEY || process.env.GOOGLE_GEN_AI_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Generates a sophisticated vocabulary word using Gemini 1.5 Flash.
 */
export async function generateDailyWord() {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are the VORA Intelligence, a luxury linguistic tutor. 
      Generate a sophisticated, "Master Level" vocabulary word.
      Provide the output in valid JSON format with the following keys:
      word, phonetic, definition, etymology (brief), exampleSentence, synonyms (array), rationale (a 1-sentence deep dive into the word's nuance).
      
      Respond ONLY with the JSON block.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON if needed (sometimes AI wraps it in backticks)
    const jsonString = text.replace(/```json|```/gi, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Vora Intelligence Error (generateDailyWord):", error);
    return null;
  }
}

/**
 * Validates a user's sentence for a given word.
 */
export async function validateContext(word, userSentence) {
  if (!genAI) return { correct: true, feedback: "VORA Intelligence is offline. Proceed with instinct." };

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are a luxury English tutor for the VORA app. Focus on elegant articulation and sophisticated mastery.
      The user's word is: "${word}". 
      Their sentence is: "${userSentence}". 

      Analyze if the usage of the word is correct in context, grammar, and sophistication. 
      If yes, the status is "SUCCESS". 
      If no, the status is "FAILURE" and you must provide a brief, elegant explanation of why and how to improve.

      Provide your response ONLY in valid JSON format exactly matching this structure:
      {
        "status": "SUCCESS" or "FAILURE",
        "rationale": "Explanation of why it failed, or a congratulatory subtle note of approval if it succeeded."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON if needed (sometimes AI wraps it in backticks)
    const jsonString = text.replace(/```json|```/gi, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Vora Intelligence Error (validateContext):", error);
    return { correct: false, feedback: "The Intelligence layer is momentarily clouded. Please try again." };
  }
}

/**
 * Analyzes a mistake made in the Time Attack sprint.
 * Explains why the user's selected choice is fundamentally different or less accurate than the correct synonym.
 */
export async function analyzeMistake(word, correctSynonym, userChoice) {
  if (!genAI) return { rationale: "VORA Intelligence is currently offline. Please verify that your GOOGLE_GEN_AI_KEY is correctly configured in your environment." };

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are the VORA Intelligence, an elite and luxurious linguistic tutor.
      The user was tested on the word "${word}". 
      The most accurate synonym is "${correctSynonym}". 
      The user incorrectly selected "${userChoice}".

      Explain briefly and elegantly (max 2 sentences) why "${userChoice}" lacks the nuanced meaning of "${word}" compared to "${correctSynonym}".
      Keep the tone sophisticated, direct, and slightly academic.

      Respond ONLY in valid JSON format matching this structure:
      {
        "rationale": "Your explanation here"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON
    const jsonString = text.replace(/```json|```/gi, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Vora Intelligence Error (analyzeMistake):", error);
    return { rationale: "The subtle distinctions escape the current processing parameters." };
  }
}

/**
 * Synthesizes a batch of bespoke vocabulary based on user tier and specific interests.
 */
export async function generateContextualLexicon(level, interests = [], count = 5) {
  if (!genAI) return [];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const interestStr = interests.length > 0 ? interests.join(", ") : "general sophisticated linguistics";
    const prompt = `
      You are the VORA Intelligence, a luxury linguistic architect. 
      Generate exactly ${count} sophisticated vocabulary words for a "${level}" learner.
      The words MUST be highly relevant to these interests: ${interestStr}.
      
      For each word, provide:
      - word
      - phonetic
      - definition
      - exampleSentence
      - synonyms (array of exactly 3 words)
      - category (one of: ${interests.length > 0 ? interests[0] : 'academic'})
      - level (must be "${level}")
      
      Provide the output ONLY as a valid JSON array of objects.
      Respond ONLY with the raw JSON array.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonString = text.replace(/```json|```/gi, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Vora Intelligence Error (generateContextualLexicon):", error);
    return [];
  }
}

/**
 * Professional sentence validation for Context Climber.
 */
export async function validateSentence(word, userSentence) {
  if (!genAI) return { status: "SUCCESS", feedback: "VORA Intelligence is currently offline. Proceed with instinct." };

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are a professional English tutor for the VORA app. Focus on elegant articulation and sophisticated mastery.
      Evaluate the following sentence for the word '${word}'.
      
      Sentence: '${userSentence}'
      
      Criteria:
      - Is the word used correctly in context?
      - Is the grammar sound?
      - Is the usage sophisticated or could it be more 'Master Class'?
      
      Provide your response ONLY in valid JSON format exactly matching this structure:
      {
        "status": "SUCCESS" or "FAILURE",
        "feedback": "A short, encouraging explanation of why it works or how to fix it."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonString = text.replace(/```json|```/gi, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Vora Intelligence Error (validateSentence):", error);
    return { status: "FAILURE", feedback: "The Intelligence layer is momentarily clouded. Please try again." };
  }
}
/**
 * Generates three progressive clues for the Detective game.
 */
export async function generateDetectiveClues(word) {
  if (!genAI) {
    return {
      clue1: "A cryptic hint regarding the word's essence is currently obscured.",
      clue2: "A moderate suggestion about the word's synonym or usage.",
      clue3: "A direct description that points almost directly to the word."
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are the VORA Intelligence, an elite linguistic detective.
      The target word is: "${word}".
      
      Generate 3 distinct clues for the user to guess this word:
      - Clue 1 (Vague/Cryptic): A deep etymological hint, a metaphorical riddle, or a very broad abstraction. (Max 15 words)
      - Clue 2 (Moderate): A synonym, common collocation, or a specific usage context. (Max 15 words)
      - Clue 3 (Obvious): A near-definition or a very common everyday example. (Max 15 words)
      
      Respond ONLY in valid JSON format matching this structure:
      {
        "clue1": "...",
        "clue2": "...",
        "clue3": "..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonString = text.replace(/```json|```/gi, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Vora Intelligence Error (generateDetectiveClues):", error);
    return {
      clue1: "The word's shadows are deep and cryptic.",
      clue2: "A common relative of this word is often used in formal speech.",
      clue3: "It is a term used to describe something of this nature."
    };
  }
}
