"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateEventWithAI(promptText: string, existingTags: string[], availableSkills: string[]) {
  if (!promptText || promptText.trim().length < 10) {
    throw new Error("Prompt too short");
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `
    You are an AI assistant for a volunteer matching platform.
    A user has provided a rough idea for an event. Extract and infer the details to fully populate an event creation form.

    User's rough idea: "${promptText}"

    Available System Tags (Prioritize using these, but you can create 1 or 2 new ones if highly relevant): ${JSON.stringify(existingTags)}
    Available Valid Skills (You MUST ONLY select from this exact list, or return an empty array): ${JSON.stringify(availableSkills)}

    Return a valid JSON object with EXACTLY the following keys and data types:
    {
      "title": "string (A catchy, clear title)",
      "description": "string (A polished, detailed description of the event based on the user's idea)",
      "address": "string (The location, if mentioned. Otherwise empty string)",
      "volunteerHours": "string (Number of hours, estimated from description. Default to '0' if unknown)",
      "compensationOptions": "string (Comma separated perks like 'Free lunch, T-shirt'. Empty string if none)",
      "maxVolunteers": "string (Estimated capacity as a number string like '10'. Default to '1' if unknown)",
      "tags": ["string", "string"],
      "requiredSkills": ["string", "string"] // MUST ONLY match the provided Available Valid Skills
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("AI Event Generation Error:", error);
    throw new Error("Failed to parse AI response");
  }
}