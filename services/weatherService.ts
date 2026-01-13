
import { GoogleGenAI } from "@google/genai";
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
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-pro",
      contents: "Dame el tiempo de Ayamonte, Huelva, para los próximos 5 días en este formato JSON exacto (solo el JSON): [{\"dayName\": \"HOY\", \"temp\": 18, \"condition\": \"Soleado\", \"icon\": \"☀️\"}, ...]. Usa códigos de 3 letras para los días (LUN, MAR, etc).",
      config: { temperature: 0.1 },
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);

    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      if (Array.isArray(data)) {
        const finalData = data.slice(0, 5).map(item => ({
          ...item,
          temp: typeof item.temp === 'string' ? parseInt(item.temp) : item.temp,
        }));
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: finalData }));
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
      condition: 'Variable',
      icon: i % 2 === 0 ? '☀️' : '⛅'
    });
  }
  return forecast;
};
