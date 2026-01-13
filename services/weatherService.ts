
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

    // Forzamos el uso de Google Search para consultar AEMET en tiempo real
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} }] as any
    });

    const prompt = `Actúa como un experto meteorólogo. Busca en la web oficial de AEMET (aemet.es) la predicción meteorológica para Ayamonte (Huelva) para hoy y los próximos 4 días.
    Es fundamental que los datos provengan de AEMET.
    
    Devuelve estrictamente un JSON array con 5 objetos (hoy + 4 días) con estas claves exactas:
    [
      {"dayName": "HOY", "temp": 22, "condition": "Despejado", "icon": "☀️"},
      {"dayName": "MIE", "temp": 21, "condition": "Nubes altas", "icon": "🌤️"},
      ...
    ]
    
    Usa códigos de 3 letras en español para los días (LUN, MAR, MIE, JUE, VIE, SAB, DOM). 
    Si hay probabilidad de lluvia según AEMET, refléjalo en la condición e icono (🌧️).
    Responde SOLO con el JSON array, sin texto adicional ni bloques de código.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Limpieza de cualquier texto extra que la IA pueda añadir
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
    console.error("Gemini Weather Error (AEMET search):", error);
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
      condition: 'Datos AEMET no disponibles',
      icon: i % 2 === 0 ? '☀️' : '⛅'
    });
  }
  return forecast;
};
