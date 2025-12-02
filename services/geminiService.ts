import { GoogleGenAI } from "@google/genai";
import { SimulationState } from '../types';

// Initialize Gemini Client
// API Key is expected to be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getConfigurationHint = async (state: SimulationState): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const prompt = `
      You are a helpful Chemistry Tutor assisting a student with filling a Molecular Orbital (MO) diagram for ${state.molecule.formula} (${state.molecule.name}).
      
      Current State:
      - Total electrons needed: ${state.molecule.totalElectrons}
      - Electrons placed so far: ${state.orbitals.reduce((acc, o) => acc + o.electrons, 0)}
      - Bond Order: ${state.bondOrder}
      
      The student is asking for a hint. 
      Briefly analyze their progress. 
      If they have placed the wrong number of electrons, tell them.
      If they violated Hund's rule (pairing before filling degenerate orbitals), point it out.
      If they violated Aufbau (filling higher energy before lower), point it out.
      Otherwise, give a hint about the next orbital to fill.
      
      Keep the hint short (max 2 sentences) and encouraging. Do not simply give the answer.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Check the energy levels and ensure you follow the Aufbau principle.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ensure you are filling orbitals from bottom to top (Aufbau) and placing one electron in each degenerate orbital before pairing (Hund's Rule).";
  }
};

export const getChallengeHint = async (molecules: string[]): Promise<string> => {
    try {
        const modelId = 'gemini-2.5-flash';
        const prompt = `
          Compare the stability of these species: ${molecules.join(', ')}.
          Provide a subtle hint about their bond orders and how adding/removing electrons from antibonding orbitals affects stability.
          Do not give the direct answer order. Max 2 sentences.
        `;
    
        const response = await ai.models.generateContent({
          model: modelId,
          contents: prompt,
        });
    
        return response.text || "Think about Bond Order = (Bonding - Antibonding) / 2";
      } catch (error) {
        return "Hint unavailable.";
      }
}
