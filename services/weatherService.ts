
import { GoogleGenerativeAI } from "@google/generative-ai";
import { WeatherData } from '../types';

const CACHE_KEY = 'ac_weather_cache';
const CACHE_EXPIRY = 2 * 60 * 60 * 1000; // Aumentamos a 2 horas para evitar bloqueos

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
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} }] as any
    });

    const prompt = `URGENTE: Consulta AEMET o fuentes oficiales para el tiempo en Ayamonte (Huelva) HOY martes 13 de enero de 2026 y los próximos 4 días.
    
    Genera un JSON con este formato exacto:
    [
      {"dayName": "HOY", "temp": [TEMPERATURA_ACTUAL], "condition": "[TEXTO_AEMET]", "icon": "[EMOJI]"},
      {"dayName": "MIE", "temp": [TEMP], "condition": "...", "icon": "..."},
      {"dayName": "JUE", "temp": [TEMP], "condition": "...", "icon": "..."},
      {"dayName": "VIE", "temp": [TEMP], "condition": "...", "icon": "..."},
      {"dayName": "SAB", "temp": [TEMP], "condition": "...", "icon": "..."}
    ]
    Asegúrate de que los días sean correlativos a partir de hoy martes. NO inventes los datos, usa los de la búsqueda.`;

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
    return getFallbackWeather(); // Solo si falla el parseo
  } catch (error) {
    console.error("Gemini Weather Error:", error);
    return getFallbackWeather();
  }
};

const getFallbackWeather = (): WeatherData[] => {
  const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
  const now = new Date();
  const forecast: WeatherData[] = [];

  // Corregimos la lógica de los días para que no se repitan
  for (let i = 0; i < 5; i++) {
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + i);
    const dayName = i === 0 ? 'HOY' : days[futureDate.getDay()];

    forecast.push({
      dayName: dayName,
      temp: 18,
      condition: 'Ajustando predicción...',
      icon: '🔄'
    });
  }
  return forecast;
};
