
import { GoogleGenAI } from "@google/genai";
import { WeatherData } from '../types';

const CACHE_KEY = 'ac_weather_cache';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutos

export const getAyamonteWeather = async (): Promise<WeatherData[]> => {
  // Intentar cargar desde caché
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_EXPIRY) {
      return data;
    }
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Search for the current weather and 5-day forecast for Ayamonte, Huelva, Spain. Provide the response as a valid JSON array of objects with keys: dayName (string: 'HOY' for the first, then 3-letter Spanish day codes like 'JUE', 'VIE', 'SAB', 'DOM', 'LUN'), temp (number, current or max temperature in Celsius), condition (short string), and icon (single weather emoji). Provide exactly 5 days.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        uri: chunk.web?.uri || "",
        title: chunk.web?.title || "Fuente de información meteorológica"
      }))
      .filter(s => s.uri !== "");

    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        if (Array.isArray(data)) {
          const finalData = data.slice(0, 5).map((item, idx) => ({
            ...item,
            sources: idx === 0 ? sources : undefined
          }));

          // Guardar en caché
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: finalData
          }));

          return finalData;
        }
      } catch (e) {
        console.error("Failed to parse weather JSON:", e);
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
    const dayIndex = futureDate.getDay();
    forecast.push({
      dayName: i === 0 ? 'HOY' : days[dayIndex],
      temp: 18 + i,
      condition: 'Variable',
      icon: i % 2 === 0 ? '☀️' : '⛅'
    });
  }
  return forecast;
};
