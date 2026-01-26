import { GoogleGenerativeAI } from "@google/generative-ai";
import { WeatherData } from '../types';

const CACHE_KEY = 'ac_weather_cache_v7';
const CACHE_EXPIRY = 60 * 60 * 1000;

export const getAyamonteWeather = async (): Promise<WeatherData[]> => {
  let cached = null;
  try {
    cached = localStorage.getItem(CACHE_KEY);
  } catch (e) { }

  if (cached) {
    try {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) return data;
    } catch (e) { }
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (import.meta.env as any).GEMINI_API_KEY;
  if (!apiKey || apiKey === "undefined") return getFallbackWeather();

  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `Actúa como un experto meteorólogo para Ayamonte, Huelva.
    Consulta el tiempo para HOY y los próximos 4 días.
    DEVUELVE ÚNICAMENTE UN ARRAY JSON con este formato exacto:
    [{"dayName": "HOY", "temp": 14, "condition": "Soleado", "icon": "☀️"}, ...]
    Asegúrate de que 'temp' sea un número.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);

    if (jsonMatch) {
      let data = JSON.parse(jsonMatch[0]);
      if (Array.isArray(data)) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data
        }));
        return data.slice(0, 5);
      }
    }
    return getFallbackWeather();
  } catch (error) {
    console.error("Weather Error:", error);

    // Intento con 1.5 si el 2.5 falla
    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Weather for Ayamonte, Huelva in JSON format");
      const response = await result.response;
      const jsonMatch = response.text().match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e2) { }

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
      temp: 15,
      condition: 'Variable',
      icon: '🌦️'
    });
  }
  return forecast;
};
