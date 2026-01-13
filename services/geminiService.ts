
import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  const keys = [
    (import.meta as any).env?.VITE_GEMINI_API_KEY,
    (process.env as any)?.VITE_GEMINI_API_KEY,
    (process.env as any)?.GEMINI_API_KEY
  ];

  for (const key of keys) {
    if (key && key !== "undefined" && key !== "null" && key.length > 10) {
      return key;
    }
  }
  return null;
};

const apiKey = getApiKey();
let ai: any = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI(apiKey);
  } catch (e) {
    console.error("Error initializing Gemini:", e);
  }
}



export interface AssistantResponse {
  text: string;
  sources: { uri: string; title: string }[];
}

export const askCofradeAssistant = async (query: string): Promise<AssistantResponse> => {
  try {
    if (!ai) {
      return {
        text: "El asistente no está configurado correctamente (falta la API Key). contacta con el administrador.",
        sources: []
      };
    }
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.7 },
      systemInstruction: `Eres el "Asistente Cofrade Supremo de Ayamonte"...` // ... (simplificado para el reemplazo)
    });

    const result = await model.generateContent(query);
    const response = result.response;


    const text = response.text || "Lo siento, no he podido procesar esa información sobre nuestra Semana Mayor.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        uri: chunk.web?.uri || "",
        title: chunk.web?.title || "Fuente oficial ayamontina"
      }))
      .filter(s => s.uri !== "");

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "La conexión con el archivo de la Agrupación de Cofradías ha fallado. Inténtalo de nuevo, hermano.",
      sources: []
    };
  }
};
