
import { GoogleGenerativeAI } from "@google/generative-ai";
import { WeatherData } from '../types';

const CACHE_KEY = 'ac_weather_cache';
const CACHE_EXPIRY = 2 * 60 * 60 * 1000;

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

    const prompt = `Consulta AEMET para Ayamonte (Huelva) para HOY martes y los próximos 4 días.
    
    Genera un JSON con este formato exacto:
    [
      {"dayName": "HOY", "temp": 14, "condition": "Lluvia", "icon": "🌧️"},
      ...
    ]
    REGLAS IMPORTANTES:
    1. El campo "temp" debe ser SOLO el número de la temperatura máxima prevista en grados Celsius.
    2. NO concatenes la probabilidad de lluvia con la temperatura. 
    3. Asegúrate de que los días sean: HOY, MIE, JUE, VIE, SAB.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);

    if (jsonMatch) {
      let data = JSON.parse(jsonMatch[0]);
      if (Array.isArray(data)) {
        const finalData = data.slice(0, 5).map(item => {
          let t = typeof item.temp === 'string' ? parseInt(item.temp) : item.temp;

          // FILTRO DE SEGURIDAD: Si la temperatura es absurda (>50), 
          // probablemente la IA concatenó datos. Intentamos sacar los últimos dos dígitos.
          if (t > 50) {
            t = parseInt(t.toString().slice(-2));
          }

          return {
            ...item,
            temp: t,
          };
        });

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
      temp: 14 + i,
      condition: 'Ajustando...',
      icon: '🌤️'
    });
  }
  return forecast;
};
