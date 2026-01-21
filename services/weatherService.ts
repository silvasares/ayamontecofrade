
import { GoogleGenerativeAI } from "@google/generative-ai";
import { WeatherData } from '../types';

// Cambiamos la clave de caché para FORZAR a todos los navegadores a borrar los datos viejos
const CACHE_KEY = 'ac_weather_cache_v5_final';
const CACHE_EXPIRY = 30 * 60 * 1000; // Reducimos a 30 min para mayor frescura

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

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === "undefined") return getFallbackWeather();

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      tools: [{ googleSearch: {} }] as any
    });

    const prompt = `Consulta AEMET.es para Ayamonte (Huelva) HOY y próximos 4 días.
    DEVUELVE SÓLO UN JSON ARRAY COMO ESTE:
    [{"dayName": "HOY", "temp": 14, "condition": "Lluvia", "icon": "🌧️"}, ...]
    
    REGLA CRÍTICA: La temperatura debe ser SOLO el número de grados Celsius (ejemplo: 14). 
    JAMÁS pongas la probabilidad de lluvia junto al número. Si el número es mayor de 40, está MAL.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);

    if (jsonMatch) {
      let data = JSON.parse(jsonMatch[0]);
      if (Array.isArray(data)) {
        const finalData = data.slice(0, 5).map(item => {
          let t = 15; // Valor por defecto sensato

          // Extraemos el número real por si la IA se equivoca
          const rawTemp = item.temp.toString();
          const match = rawTemp.match(/\d+/);
          if (match) {
            t = parseInt(match[0]);
          }

          // Si el número es > 40 (imposible ahora), cogemos solo los dos últimos dígitos
          // Ejemplo: 715 (70% lluvia, 15 grados) -> se queda con 15
          if (t > 40) {
            t = parseInt(t.toString().slice(-2));
          }

          // Último filtro de seguridad cofrade
          if (t < 0 || t > 35) t = 14;

          return {
            ...item,
            temp: t,
          };
        });

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: finalData
          }));
        } catch (e) { }

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
      temp: 14,
      condition: 'Consultando AEMET...',
      icon: '🌦️'
    });
  }
  return forecast;
};
