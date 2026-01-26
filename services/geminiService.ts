
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (import.meta.env as any).GEMINI_API_KEY;
let genAI: any = null;

if (apiKey && apiKey !== "undefined" && apiKey.trim() !== "") {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (e) {
    console.error("Gemini Setup Error:", e);
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
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.7 },
      systemInstruction: "Eres el 'Asistente Cofrade Supremo de Ayamonte'. Tu conocimiento es enciclopédico sobre la Semana Santa de Ayamonte (Huelva). Responde con pasión cofrade, usando términos locales como 'cargadores' y mencionando los barrios (Barrio Alto, Ribera, San Francisco)."
    });

    const result = await model.generateContent(query);
    const response = await result.response;
    return { text: response.text(), sources: [] };
  } catch (error: any) {
    console.error("Gemini Error:", error);

    // Fallback sistemático si el modelo 2.5 falla o no es reconocido en esta región/entorno
    try {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await fallbackModel.generateContent(query);
      const response = await result.response;
      return { text: response.text(), sources: [] };
    } catch (e2) {
      console.error("Double failure:", e2);
    }

    return {
      text: "La conexión con el archivo de la Agrupación de Cofradías ha fallado. Revisa tu conexión a internet o la configuración de la clave API.",
      sources: []
    };
  }
};
