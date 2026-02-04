import { WeatherData } from '../types';

const CACHE_KEY = 'ac_weather_cache_openmeteo_v1';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes cache for better accuracy

// Ayamonte, Huelva coordinates
const LAT = 37.2152;
const LON = -7.4055;

export const getAyamonteWeather = async (): Promise<WeatherData[]> => {
  // 1. Check Cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) return data;
    }
  } catch (e) { }

  try {
    // 2. Fetch from Open-Meteo (Real-time & Reliable)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weathercode,temperature_2m_max&current_weather=true&timezone=Europe%2FMadrid`
    );

    if (!response.ok) throw new Error('Weather API error');

    const rawData = await response.json();
    const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const now = new Date();

    const forecast: WeatherData[] = rawData.daily.time.slice(0, 5).map((dateStr: string, i: number) => {
      const date = new Date(dateStr);
      const isToday = i === 0;
      const code = rawData.daily.weathercode[i];
      const temp = Math.round(isToday ? rawData.current_weather.temperature : rawData.daily.temperature_2m_max[i]);

      const { icon, condition } = getWeatherInfo(code);

      return {
        dayName: isToday ? 'HOY' : days[date.getDay()],
        temp,
        condition,
        icon
      };
    });

    // 3. Save to Cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: forecast
    }));

    return forecast;

  } catch (error) {
    console.error("Weather Service Error:", error);
    return getFallbackWeather();
  }
};

/**
 * Maps WMO Weather interpretation codes (WW) to Icons and Descriptions
 * https://open-meteo.com/en/docs
 */
const getWeatherInfo = (code: number): { icon: string; condition: string } => {
  if (code === 0) return { icon: "☀️", condition: "Despejado" };
  if (code >= 1 && code <= 3) return { icon: "🌤️", condition: "Nubosidad variable" };
  if (code === 45 || code === 48) return { icon: "🌫️", condition: "Niebla" };
  if (code >= 51 && code <= 55) return { icon: "🌦️", condition: "Llovizna" };
  if (code >= 61 && code <= 65) return { icon: "🌧️", condition: "Lluvia" };
  if (code >= 71 && code <= 77) return { icon: "❄️", condition: "Nieve" };
  if (code >= 80 && code <= 82) return { icon: "🌦️", condition: "Chubascos" };
  if (code >= 95) return { icon: "⛈️", condition: "Tormenta" };
  return { icon: "☁️", condition: "Nublado" };
};

const getFallbackWeather = (): WeatherData[] => {
  const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const now = new Date();
  const forecast: WeatherData[] = [];
  for (let i = 0; i < 5; i++) {
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + i);
    forecast.push({
      dayName: i === 0 ? 'HOY' : days[futureDate.getDay()],
      temp: 15,
      condition: 'Consultando...',
      icon: '☁️'
    });
  }
  return forecast;
};
