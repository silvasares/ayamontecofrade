
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
    console.error("Critical error initializing GoogleGenAI:", e);
    ai = null;
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
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
      systemInstruction: `Eres el "Asistente Cofrade Supremo de Ayamonte". Tu conocimiento es enciclopédico sobre la Semana Santa de Ayamonte (Huelva).
        
        REGLAS DE ORO:
        1. ESTILO LOCAL: Ayamonte tiene una tradición propia donde los pasos se cargan por el exterior (cargadores). Úsalo con naturalidad en tus respuestas sin necesidad de corregir al usuario de forma constante si usa otros términos, simplemente mantén el estilo ayamontino.
        2. GEOGRAFÍA: Conoces perfectamente el Barrio Alto (Parroquia del Salvador), la Ribera (Parroquia de las Angustias) y San Francisco.
        3. DEVOCIÓN: Sabes que "Padre Jesús" es el Señor de Ayamonte y que la Virgen de las Angustias es la Patrona.
        4. ESTILO: Responde con el lenguaje de un manijero o un historiador local. Eres humilde pero apasionado.
        5. ACTUALIDAD: Utiliza la búsqueda para dar datos reales de 2024/2025 si se te pregunta por horarios o meteorología.
        6. Si no sabes algo específico sobre Ayamonte, admítelo y ofrece datos históricos generales de la ciudad.`
    });

    const result = await model.generateContent(query);
    const response = await result.response;
    const text = response.text();

    // Extraer fuentes si existen (Grounding)
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = (groundingMetadata?.groundingChunks || [])
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        uri: chunk.web?.uri || "",
        title: chunk.web?.title || "Fuente oficial ayamontina"
      }))
      .filter((s: any) => s.uri !== "");

    return {
      text: text || "Lo siento, no he podido procesar esa información sobre nuestra Semana Mayor.",
      sources
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "La conexión con el archivo de la Agrupación de Cofradías ha fallado. Inténtalo de nuevo, hermano.",
      sources: []
    };
  }
};
