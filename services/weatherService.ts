
import { GoogleGenerativeAI } from "@google/generative-ai";
import { WeatherData } from '../types';

const CACHE_KEY = 'ac_weather_cache';
const CACHE_EXPIRY = 30 * 60 * 1000;

export const getAyamonteWeather = async (): Promise<WeatherData[]> => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) return data;
    } catch (e) { }
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === "undefined") return getFallbackWeather();

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Configuramos el modelo con herramientas de búsqueda para datos reales
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} }] as any
    });

    const prompt = `Busca el tiempo actual y la previsión para los próximos 5 días en Ayamonte (Huelva, España), coordenadas 37.21, -7.40. 
    Devuelve estrictamente un JSON array con este formato: 
    [{"dayName": "HOY", "temp": 18, "condition": "Soleado", "icon": "☀️"}, ...]
    Asegúrate de que los datos sean reales para hoy y los próximos días de 2026 de fuentes como AEMET.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);

    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      if (Array.isArray(data)) {
        const finalData = data.slice(0, 5).map(item => ({
          ...item,
          temp: typeof item.temp === 'string' ? parseInt(item.temp) : item.temp,
        }));

        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: finalData
        }));

        return finalData;
      }
    }
    return getFallbackWeather();
  } catch (error) {
    console.error("Gemini Weather Error:", error);
    return getFallbackWeather();
  }
};

const getFallbackWeather = (): WeatherData[] => {
  const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
  const now = new Date();
  const forecast: WeatherData[] = [];
  for (let i = 0; i < 5; i++) {
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + i);
    forecast.push({
      dayName: i === 0 ? 'HOY' : days[futureDate.getDay()],
      temp: 18 + i,
      condition: 'Variable (Fallback)',
      icon: i % 2 === 0 ? '☀️' : '⛅'
    });
  }
  return forecast;
};
