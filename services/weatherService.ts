
import { GoogleGenAI } from "@google/genai";
import { WeatherData } from '../types';

const CACHE_KEY = 'ac_weather_cache';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutos

export const getAyamonteWeather = async (): Promise<WeatherData[]> => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return data;
      }
    } catch (e) { }
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === "undefined") return getFallbackWeather();

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Usamos la sintaxis correcta: ai.models.generateContent
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Search for the current weather and 5-day forecast for Ayamonte, Huelva, Spain. Provide the response as a valid JSON array of objects with keys: dayName (string: 'HOY' for the first, then 3-letter Spanish day codes like 'JUE', 'VIE', 'SAB', 'DOM', 'LUN'), temp (number, current or max temperature in Celsius), condition (short string), and icon (single weather emoji). Provide exactly 5 days.",
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1
      },
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
      condition: 'Variable',
      icon: i % 2 === 0 ? '☀️' : '⛅'
    });
  }
  return forecast;
};
