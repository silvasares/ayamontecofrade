
import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let ai: any = null;

if (apiKey && apiKey !== "undefined") {
  try {
    ai = new GoogleGenAI({ apiKey });
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
    if (!ai) {
      return {
        text: "El asistente no está configurado correctamente (falta la API Key). contacta con el administrador.",
        sources: []
      };
    }

    // Cambiamos a 'gemini-pro' para máxima compatibilidad
    const response = await ai.models.generateContent({
      model: 'gemini-pro',
      contents: query,
      config: {
        systemInstruction: `Eres el "Asistente Cofrade Supremo de Ayamonte". Tu conocimiento es enciclopédico sobre la Semana Santa de Ayamonte (Huelva).
        
        REGLAS DE ORO:
        1. ESTILO LOCAL: Los pasos se cargan por el exterior (cargadores).
        2. GEOGRAFÍA: Conoces el Barrio Alto, la Ribera y San Francisco.
        3. DEVOCIÓN: El Señor de Ayamonte es Padre Jesús y la Patrona es la Virgen de las Angustias.
        4. ESTILO: Responde con pasión cofrade, como un manijero ayamontino.`,
        temperature: 0.7,
      }
    });

    const text = response.text || "Lo siento, no he podido procesar esa información sobre nuestra Semana Mayor.";
    return { text, sources: [] };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "La conexión con el archivo de la Agrupación de Cofradías ha fallado. Inténtalo de nuevo, hermano.",
      sources: []
    };
  }
};
