
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let genAI: any = null;

if (apiKey && apiKey !== "undefined") {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (e) {
    console.error("Error al instanciar Gemini:", e);
  }
}

export interface AssistantResponse {
  text: string;
  sources: { uri: string; title: string }[];
}

export const askCofradeAssistant = async (query: string): Promise<AssistantResponse> => {
  try {
    if (!genAI) {
      return {
        text: "El asistente no está configurado correctamente (falta la API Key). contacta con el administrador.",
        sources: []
      };
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.7 },
      systemInstruction: "Eres el 'Asistente Cofrade Supremo de Ayamonte'. Tu conocimiento es enciclopédico sobre la Semana Santa de Ayamonte (Huelva). Responde con pasión cofrade, usando términos locales como 'cargadores' y mencionando los barrios (Barrio Alto, Ribera, San Francisco)."
    });

    const result = await model.generateContent(query);
    const response = await result.response;
    const text = response.text();

    return { text, sources: [] };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "La conexión con el archivo de la Agrupación de Cofradías ha fallado. Inténtalo de nuevo, hermano.",
      sources: []
    };
  }
};
