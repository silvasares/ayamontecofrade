
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, Bot, X, ExternalLink, Calendar, Newspaper, Map as MapIcon, Sparkles, AlertCircle, Bell, ShieldCheck, Lock, Navigation, CloudSun, Search, CloudRain, Check, Share2 } from 'lucide-react';
import { getAyamonteWeather } from '../services/weatherService';
import { WeatherData, Paso, Day, Brotherhood, DaySchedule } from '../types';

interface Props {
  pasos: Paso[];
  news: any[];
  defaultCover: string;
  departureStatus: string;
  brotherhoods: Brotherhood[];
  days?: DaySchedule[];
}

// Obtiene la hora actual en España (Europe/Madrid)
const getSpainTime = (): Date => {
  const now = new Date();
  const spainTimeStr = now.toLocaleString("sv-SE", { timeZone: "Europe/Madrid" }).replace(' ', 'T');
  return new Date(spainTimeStr);
};

const getMinutes = (timeStr: string) => {
  if (!timeStr) return -1;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Intenta parsear fechas en formato DD/MM/YYYY o ISO
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

const formatDate = (dateStr: string): string => {
  const d = parseDate(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
};

const getDayIndex = (dayName: string): number => {
  const map: Record<string, number> = {
    [Day.DOMINGO_RAMOS]: 0,
    [Day.DOMINGO_RESURRECCION]: 0,
    [Day.LUNES_SANTO]: 1,
    [Day.MARTES_SANTO]: 2,
    [Day.MIERCOLES_SANTO]: 3,
    [Day.JUEVES_SANTO]: 4,
    [Day.VIERNES_SANTO]: 5,
    [Day.MADRUGA]: 5,
    [Day.VIERNES_DOLORES]: 5,
    [Day.SABADO_PASION]: 6,
    [Day.SABADO_SANTO]: 6
  };
  return map[dayName] ?? 0;
};

const getDayCode = (dayName: string): string => {
  const d = dayName.toLowerCase();
  if (d.includes('lunes')) return 'LUN';
  if (d.includes('martes')) return 'MAR';
  if (d.includes('miercoles') || d.includes('miércoles')) return 'MIÉ';
  if (d.includes('jueves')) return 'JUE';
  if (d.includes('viernes')) return 'VIE';
  if (d.includes('sabado') || d.includes('sábado')) return 'SÁB';
  if (d.includes('domingo')) return 'DOM';
  if (d.includes('madruga') || d.includes('madrugá')) return 'VIE';
  return '';
};

const isSameDate = (date1: Date, dateStr?: string) => {
  if (!dateStr) return false;
  const d2 = parseDate(dateStr);
  if (!d2) return false;
  return date1.getFullYear() === d2.getFullYear() &&
    date1.getMonth() === d2.getMonth() &&
    date1.getDate() === d2.getDate();
};

const PublicHome: React.FC<Props> = ({ pasos, news, defaultCover, departureStatus, brotherhoods, days }) => {
  const [forecast, setForecast] = useState<WeatherData[]>([]);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [now, setNow] = useState(getSpainTime());
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(() => {
    try {
      return typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default';
    } catch (e) {
      return false;
    }
  });
  const [aiQuery, setAiQuery] = useState('');
  const navigate = useNavigate();

  // Determinar si estamos en ventana de Semana Santa (máx 5 días antes de la primera procesión)
  const isNearSemanaSanta = useMemo(() => {
    if (!days || days.length === 0) return false;
    const now = new Date();
    for (const d of days) {
      if (d.date) {
        const eventDate = new Date(d.date);
        const diffMs = eventDate.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays >= -1 && diffDays <= 5) return true;
      }
    }
    return false;
  }, [days]);

  useEffect(() => {
    if (isNearSemanaSanta) {
      getAyamonteWeather().then(data => {
        setForecast(data);
        setLoadingWeather(false);
      });
    } else {
      setLoadingWeather(false);
    }
    const interval = setInterval(() => setNow(getSpainTime()), 30000);
    return () => clearInterval(interval);
  }, [isNearSemanaSanta]);

  const handleRequestPermission = async () => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await window.Notification.requestPermission();
        if (permission === 'granted') {
          alert("¡Gracias! Ahora recibirás avisos de última hora en tu móvil.");
        }
      } else {
        alert("Las notificaciones no están soportadas en este dispositivo.");
      }
    } catch (e) {
      console.error("Error formalizing notification permission", e);
    }
    setShowNotificationBanner(false);
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiQuery.trim()) {
      navigate('/assistant', { state: { initialQuery: aiQuery } });
    }
  };

  // Helper function to get the correct day from brotherhood if possible
  const getPasoDay = (paso: Paso) => {
    if (!brotherhoods || brotherhoods.length === 0) return paso.day;
    const linkedBrotherhood = brotherhoods.find(b =>
      b.id === paso.brotherhood_id ||
      b.name === paso.brotherhood
    );
    return linkedBrotherhood ? linkedBrotherhood.day : paso.day;
  };

  // Filtrar las noticias que realmente deben mostrarse
  const visibleNews = useMemo(() => {
    const nowTime = now.getTime();
    return news
      .filter(item => {
        if (item.publish_date) {
          const pDate = new Date(item.publish_date);
          if (pDate.getTime() > nowTime) return false;
        }

        // Filtrar noticias pasadas (Fecha de actividad < Hoy)
        if (item.publishedAt) {
          const eventDate = new Date(item.publishedAt);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          eventDate.setHours(0, 0, 0, 0); // Comparar solo fechas
          if (eventDate < today) return false;
        }

        return true;
      })
      .slice(0, 4);
  }, [news, now]);

  const { activePasos, nextPaso } = useMemo(() => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const getOrderIndex = (dayName: string): number => {
      // 1. Intentar buscar en 'days' (DB)
      if (days && days.length > 0) {
        const d = days.find(day => day.name === dayName);
        if (d) return d.order_index;
      }

      // 2. Fallback mapa estático
      const map: Record<string, number> = {
        [Day.VIERNES_DOLORES]: 0,
        [Day.SABADO_PASION]: 1,
        [Day.DOMINGO_RAMOS]: 2,
        [Day.LUNES_SANTO]: 3,
        [Day.MARTES_SANTO]: 4,
        [Day.MIERCOLES_SANTO]: 5,
        [Day.JUEVES_SANTO]: 6,
        [Day.MADRUGA]: 7,
        [Day.VIERNES_SANTO]: 8,
        [Day.SABADO_SANTO]: 9,
        [Day.DOMINGO_RESURRECCION]: 10
      };
      return map[dayName] ?? 99; // 99 para días desconocidos (final de la lista)
    };

    // Determinar si HOY es un día de procesión específico
    let currentOrderIndex = -1;
    // 1. Buscamos coincidencia exacta de fecha
    if (days && days.length > 0) {
      const todaySchedule = days.find(d => d.date && isSameDate(now, d.date));
      if (todaySchedule) {
        currentOrderIndex = todaySchedule.order_index;
      }
    }

    // 2. Si no hay fecha exacta configurada, intentamos inferir por día de la semana (fallback débil)
    // Solo si estamos "cerca" de Semana Santa o asumiendo que estamos en ella si se usa la app
    if (currentOrderIndex === -1 && (!days || days.every(d => !d.date))) {
      // Mapa reverso básico solo para días únicos (Lunes-Jueves y Sábado)
      // Domingo y Viernes son ambiguos (Dolores/Santo/Resurrección), se asume el primero por defecto si no hay fechas
      const dayOfWeek = now.getDay(); // 0 Dom, 1 Lun...
      const weekMap: Record<number, number> = {
        1: 3, // Lunes Santo
        2: 4, // Martes Santo
        3: 5, // Miercoles Santo
        4: 6, // Jueves Santo (o Madrugá noche)
        6: 9, // Sábado Santo (o Pasión - ambigüedad)
      };
      if (weekMap[dayOfWeek] !== undefined) {
        currentOrderIndex = weekMap[dayOfWeek];
      }
    }

    const active = pasos.filter(p => {
      // 1. Priority: Manual override on Paso
      if (p.eventDate) {
        const isToday = isSameDate(now, p.eventDate);
        const start = getMinutes(p.startTime);
        const end = getMinutes(p.arrivalTime);
        const crossesMidnight = end < start;

        if (isToday) {
          if (crossesMidnight) return currentMinutes >= start;
          return currentMinutes >= start && currentMinutes < end;
        }
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (isSameDate(yesterday, p.eventDate) && crossesMidnight) {
          return currentMinutes < end;
        }
        return false;
      }

      const realDayName = getPasoDay(p);

      // 2. Check if the DaySchedule has a specific date assigned
      if (days && days.length > 0) {
        const daySchedule = days.find(d => d.name === realDayName);
        if (daySchedule && daySchedule.date) {
          const isToday = isSameDate(now, daySchedule.date);
          const start = getMinutes(p.startTime);
          const end = getMinutes(p.arrivalTime);
          const crossesMidnight = end < start;

          if (isToday) {
            if (crossesMidnight) return currentMinutes >= start;
            return currentMinutes >= start && currentMinutes < end;
          }

          // Handle "Madrugá" or overlapping
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const isYesterdayEvent = isSameDate(yesterday, daySchedule.date);

          if (isYesterdayEvent && crossesMidnight) {
            return currentMinutes < end;
          }
          return false;
        }
      }

      // 3. Fallback: Day Index match (Standard weekly schedule)
      const pDayIdx = getDayIndex(realDayName);
      const currentDayIdx = now.getDay();
      if (pDayIdx !== currentDayIdx) return false;

      const start = getMinutes(p.startTime);
      const end = getMinutes(p.arrivalTime);
      if (start === -1 || end === -1) return false;
      if (end < start) return currentMinutes >= start || currentMinutes < end;
      else return currentMinutes >= start && currentMinutes < end;
    });

    let candidates = pasos.filter(p => !active.find(a => a.id === p.id));

    candidates.sort((a, b) => {
      const dayNameA = getPasoDay(a);
      const dayNameB = getPasoDay(b);
      const idxA = getOrderIndex(dayNameA);
      const idxB = getOrderIndex(dayNameB);

      if (idxA !== idxB) {
        // Si HOY es un día de procesión identificado:
        // Los días con índice < hoy ya pasaron (se van al final -> next year weights)
        // Los días con índice > hoy son futuro cercano (weight 0)

        let weightA = 0;
        let weightB = 0;

        if (currentOrderIndex !== -1) {
          if (idxA < currentOrderIndex) weightA = 1000;
          if (idxB < currentOrderIndex) weightB = 1000;
        } else {
          // Si hoy NO es un día de procesión, hay que saber si estamos ANTES o DESPUÉS de todo
          // Usamos la fecha del primer día como referencia si existe
          const firstDay = days?.find(d => d.order_index === 0);
          if (firstDay && firstDay.date) {
            const firstDate = new Date(firstDay.date);
            // Si hoy es después del inicio (y no coincidió con ningún día), asumimos que estamos POST-Semana Santa o en huecos
            // Si estamos antes, el orden natural (0,1,2...) es correcto.
            // Si estamos después (ej. Mayo), todo es futuro (próximo año), orden natural ok.
            // Simplificación: Orden natural siempre gana si no estamos "dentro" de la semana.
          }
        }

        return (idxA + weightA) - (idxB + weightB);
      }

      // Si es el Mismo Día (mismo OrderIndex)
      const startA = getMinutes(a.startTime);
      const startB = getMinutes(b.startTime);

      // Si es HOY (y no está activo porque está en candidates):
      // Puede ser que no haya empezado (Futuro Hoy) o que ya haya terminado (Pasado Hoy -> Next Year)
      if (idxA === currentOrderIndex) {
        const passedA = startA < currentMinutes; // Ya pasó la hora de salida
        const passedB = startB < currentMinutes;

        // Priorizar los que NO han pasado (Futuro Hoy) sobre los que sí (Pasado Hoy)
        if (passedA && !passedB) return 1; // A ya pasó, B no -> B va antes
        if (!passedA && passedB) return -1; // A no pasó, B si -> A va antes

        // Si ambos pasaron o ambos son futuros, orden cronológico
        return startA - startB;
      }

      // Días distintos a hoy: orden cronológico simple
      return startA - startB;
    });

    return { activePasos: active, nextPaso: candidates[0] || null };
  }, [pasos, now, brotherhoods, days]);

  return (
    <div className="animate-in fade-in duration-700 max-w-full overflow-x-hidden flex flex-col bg-[#F8F9FA] dark:bg-[#0A0A0A]">

      {showCoverModal && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowCoverModal(false)}>
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-all scale-110"><X size={36} /></button>
          <img src={defaultCover} className="max-w-full max-h-screen object-contain rounded-xl shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()} alt="" />
        </div>
      )}

      {/* HEADER COMPACTO: TIEMPO + IA */}
      <div className="bg-[#300050] relative z-20 overflow-hidden pb-12 rounded-b-[40px] shadow-lg">
        {/* Patrón de fondo sutil */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-overlay filter blur-[80px] opacity-20"></div>

        <div className="relative z-10 px-6 pt-16">

          {/* MÓDULO 1: TIEMPO - Solo se muestra cuando falta <=5 días para alguna procesión */}
          {isNearSemanaSanta && (
          <div className="w-full flex flex-col items-center mb-4">
            <div className="flex items-center gap-1.5 mb-2 opacity-60">
              <MapIcon size={10} className="text-[#D4AF37]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Ayamonte</span>
            </div>
            <div className="w-full overflow-x-auto no-scrollbar pb-2">
              <div className="flex justify-center gap-3 min-w-max mx-auto">
                {loadingWeather ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-sm px-3 py-2 rounded-xl flex flex-col items-center justify-center border border-white/5 min-w-[56px] animate-pulse h-16">
                      <div className="w-6 h-6 bg-white/10 rounded-full mb-1"></div>
                    </div>
                  ))
                ) : (
                  forecast.map((day, idx) => (
                    <div key={idx} className={`backdrop-blur-sm px-3 py-2 rounded-xl flex flex-col items-center justify-center border min-w-[60px] transition-all ${idx === 0 ? 'bg-white/10 border-white/20 shadow-sm' : 'bg-transparent border-transparent opacity-70'}`}>
                      <span className={`text-[9px] uppercase font-bold tracking-wider mb-0.5 ${idx === 0 ? 'text-[#D4AF37]' : 'text-gray-400'}`}>{day.dayName}</span>
                      <span className="text-lg mb-0.5 drop-shadow-sm leading-none">{day.icon}</span>
                      <p className="text-[10px] font-medium text-white">{day.temp}°</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          )}

          {/* MÓDULO 2: PREGUNTA RÁPIDA A LA IA */}
          <form onSubmit={handleAiSubmit} className="relative max-w-sm mx-auto group">
            <div className="absolute inset-0 bg-white/10 blur-md rounded-full transform group-hover:scale-105 transition-transform duration-500"></div>
            <div className="relative flex items-center">
              <Bot size={18} className="absolute left-4 text-[#D4AF37]" />
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Pregunta a la IA (ej. ¿A qué hora sale?)"
                className="w-full h-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-full pl-11 pr-12 text-white placeholder-gray-400 text-sm font-medium outline-none focus:bg-white/15 focus:border-[#D4AF37]/50 transition-all shadow-inner"
              />
              <button type="submit" className="absolute right-2 p-1.5 bg-[#D4AF37] rounded-full text-[#300050] hover:scale-110 active:scale-90 transition-transform shadow-lg">
                <ChevronRight size={16} />
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* CONTENIDO PRINCIPAL - Superpuesto ligeramente */}
      <div className="px-5 -mt-6 relative z-30 space-y-8 pb-24">

        {/* Banner de Permisos (Discreto) */}
        {showNotificationBanner && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-4 shadow-md border-l-2 border-[#4B0082] flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-[#4B0082] dark:text-[#D4AF37]" />
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Activa los avisos de lluvia.</p>
            </div>
            <button onClick={handleRequestPermission} className="text-[10px] font-bold text-[#4B0082] uppercase tracking-wider hover:underline">Activar</button>
          </div>
        )}

        {/* SECCIÓN PRINCIPAL: EN VIVO O PRÓXIMA SALIDA */}
        {activePasos.length > 0 ? (
          <section className="animate-in fade-in">
            <div className="flex items-center gap-2 mb-3 pl-1">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
              <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest">En la calle</h3>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar">
              {activePasos.map(paso => {
                const b = brotherhoods.find(br => br.id === paso.brotherhood_id || br.name === paso.brotherhood);
                const displayImage = b?.main_image || paso.mainImage;
                return (
                  <Link to={`/brotherhood/${encodeURIComponent(paso.brotherhood)}`} key={paso.id} className="min-w-[85vw] h-[380px] snap-center relative rounded-[28px] overflow-hidden group shadow-xl border border-white/50 dark:border-white/5 active:scale-98 transition-transform">
                    <img src={displayImage} className="w-full h-full object-cover transition-transform duration-[20s] group-hover:scale-110" alt={paso.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#150025] via-transparent to-black/10 opacity-80" />

                    {/* Badge Live Minimal */}
                    <div className="absolute top-4 right-4 bg-red-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-1.5 border border-white/10">
                      <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span> VIVO
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 mb-2">
                        <Clock size={10} className="text-goldCofrade" />
                        <span className="text-white text-[9px] font-bold tracking-wide uppercase">
                          {(paso.startTime || b?.startTime || '--:--')} - {(paso.arrivalTime || b?.arrivalTime || '--:--')}
                        </span>
                      </div>
                      <h2 className="text-lg font-cofrade font-medium text-white leading-tight mb-1 drop-shadow-sm tracking-wide line-clamp-2">{paso.brotherhood}</h2>
                      <p className="text-white/70 text-xs font-serif italic line-clamp-1 mb-4">{paso.name}</p>

                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center gap-1.5 text-goldCofrade text-[10px] font-bold uppercase tracking-wider">
                          <MapIcon size={12} /> Ubicación Real
                        </div>
                        <div className="bg-white/10 text-white p-1.5 rounded-full">
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        ) : (
          <section className="animate-in fade-in">

            <div className="relative w-full aspect-[3/4] md:aspect-video rounded-[28px] overflow-hidden shadow-xl group border border-white/60 dark:border-white/5">
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 border border-white/10 z-20">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gray-400"></span>
                Ninguna procesión en la calle
              </div>
              {(() => {
                const b = nextPaso ? brotherhoods.find(br => br.id === nextPaso.brotherhood_id || br.name === nextPaso.brotherhood) : null;
                const displayImage = b?.main_image || nextPaso?.mainImage || defaultCover || "https://images.unsplash.com/photo-1594903337920-56956f4f2c01?q=80&w=800";
                return <img src={displayImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] group-hover:scale-105 filter brightness-90" alt="Cover" />;
              })()}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a0b2e] via-transparent to-transparent"></div>

              <div className="absolute inset-0 flex flex-col justify-end p-6">
                {nextPaso ? (() => {
                  const b = brotherhoods.find(br => br.id === nextPaso.brotherhood_id || br.name === nextPaso.brotherhood);
                  return (
                    <div className="w-full">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <div className="flex items-center gap-1.5 bg-[#D4AF37]/90 text-[#300050] px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                          <span className="text-[9px] font-bold uppercase tracking-wider">Próxima Salida</span>
                        </div>

                        {(() => {
                          const pDay = getPasoDay(nextPaso);
                          // Si no estamos en ventana de Semana Santa, no mostrar predicción
                          if (!isNearSemanaSanta) {
                            return (
                              <div className="flex items-center gap-1.5 bg-white/20 text-white px-3 py-1 rounded-full shadow-sm backdrop-blur-sm border border-white/10">
                                <Calendar size={10} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Aún quedan días</span>
                              </div>
                            );
                          }

                          // 1. Verificar si la fecha es lejana (más de 4 días) para no inventar datos
                          let isFar = false;
                          if (days && days.length > 0) {
                            const scheduleDay = days.find(d => d.name === pDay);
                            if (scheduleDay && scheduleDay.date) {
                              const eventDate = new Date(scheduleDay.date);
                              const now = new Date();
                              const diffTime = eventDate.getTime() - now.getTime();
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              if (diffDays > 5) isFar = true;
                            }
                          }

                          if (isFar) {
                            return (
                              <div className="flex items-center gap-1.5 bg-white/20 text-white px-3 py-1 rounded-full shadow-sm backdrop-blur-sm border border-white/10">
                                <Calendar size={10} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Aún quedan días</span>
                              </div>
                            );
                          }

                          const dayCode = getDayCode(pDay);

                          // Buscar el tiempo para ese día específico
                          const weather = forecast.find(f =>
                            f.dayName.toUpperCase() === dayCode ||
                            f.dayName.toUpperCase().includes(dayCode)
                          );

                          const condition = weather?.condition?.toLowerCase() || '';

                          const isRainy = weather && (
                            condition.includes('lluvi') ||
                            condition.includes('tormenta') ||
                            condition.includes('chubasco') ||
                            condition.includes('inest') ||
                            condition.includes('riesgo')
                          );

                          if (isRainy) {
                            return (
                              <div className="flex items-center gap-1.5 bg-orange-500/90 text-white px-3 py-1 rounded-full shadow-sm backdrop-blur-sm animate-pulse border border-orange-400/50">
                                <CloudRain size={10} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Pendiente de Climatología</span>
                              </div>
                            );
                          }

                          if (weather) {
                            if (condition.includes('consultando') || condition.length < 3) {
                              return (
                                <div className="flex items-center gap-1.5 bg-white/20 text-white px-3 py-1 rounded-full shadow-sm backdrop-blur-sm border border-white/10">
                                  <CloudSun size={10} />
                                  <span className="text-[9px] font-bold uppercase tracking-wider">Sin datos oficiales</span>
                                </div>
                              );
                            }

                            return (
                              <div className="flex items-center gap-1.5 bg-green-600/80 text-white px-3 py-1 rounded-full shadow-sm backdrop-blur-sm border border-green-500/50">
                                <Check size={10} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Climatología Favorable</span>
                              </div>
                            );
                          }

                          // Si no hay datos (día lejano), mostrar estado neutro
                          return (
                            <div className="flex items-center gap-1.5 bg-white/20 text-white px-3 py-1 rounded-full shadow-sm backdrop-blur-sm border border-white/10">
                              <CloudSun size={10} />
                              <span className="text-[9px] font-bold uppercase tracking-wider">Previsión no disponible</span>
                            </div>
                          );
                        })()}
                      </div>

                      <h2 className="text-xl font-cofrade font-medium text-white mb-1 leading-tight drop-shadow-md tracking-wide line-clamp-2">
                        {nextPaso.brotherhood}
                      </h2>
                      <p className="text-sm text-gray-300 font-serif italic mb-5 line-clamp-1">{nextPaso.name}</p>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-black/40 backdrop-blur-md p-2.5 rounded-xl border border-white/5 flex items-center gap-2.5">
                          <Calendar size={16} className="text-goldCofrade/80" />
                          <div>
                            <p className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Día</p>
                            <p className="text-xs font-medium text-white">{getPasoDay(nextPaso)}</p>
                          </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md p-2.5 rounded-xl border border-white/5 flex items-center gap-2.5">
                          <Clock size={16} className="text-goldCofrade/80" />
                          <div>
                            <p className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Salida</p>
                            <p className="text-xs font-medium text-white">{nextPaso.startTime || b?.startTime || '--:--'}</p>
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/brotherhood/${encodeURIComponent(nextPaso.brotherhood)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full block bg-white/10 backdrop-blur-md hover:bg-white text-white hover:text-[#300050] text-center py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all border border-white/10"
                      >
                        Ver Detalles
                      </Link>
                    </div>
                  );
                })() : (
                  <div className="text-center pb-6">
                    <div className="w-16 h-16 border border-[#D4AF37]/50 rounded-full flex items-center justify-center mx-auto mb-4 bg-black/20 backdrop-blur-sm">
                      <span className="font-cofrade text-2xl text-[#D4AF37]">AC</span>
                    </div>
                    <h2 className="text-2xl font-cofrade text-white mb-1">Ayamonte Cofrade</h2>
                    <p className="text-gray-300 font-serif italic text-xs">Esperando la próxima Semana Santa</p>
                  </div>
                )}
              </div>
            </div>

            {departureStatus && departureStatus !== 'Sin retrasos' && (
              <div className="mt-4 bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3 shadow-sm">
                <AlertCircle className="text-red-500" size={16} />
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide">{departureStatus}</p>
              </div>
            )}
          </section>
        )}

        {/* ACCESOS RÁPIDOS */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Menú</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/assistant" className="bg-gray-50 dark:bg-[#1E1E1E] p-4 rounded-2xl flex flex-col justify-between h-24 active:bg-gray-100 dark:active:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-[#4B0082]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center text-[#4B0082] dark:text-[#D4AF37]">
                <Bot size={18} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Asistente IA</h4>
                <p className="text-xs text-gray-400">Pregunta tus dudas</p>
              </div>
            </Link>

            <div
              onClick={async () => {
                const shareData = {
                  title: 'Ayamonte Cofrade',
                  text: '¡Descubre la Semana Santa de Ayamonte con esta App!',
                  url: window.location.origin
                };
                try {
                  if (navigator.share && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                  } else {
                    throw new Error("Share not supported");
                  }
                } catch (e) {
                  navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
                  alert("Enlace copiado al portapapelos.");
                }
              }}
              className="bg-gray-50 dark:bg-[#1E1E1E] p-4 rounded-2xl flex flex-col justify-between h-24 active:bg-gray-100 dark:active:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-[#4B0082] dark:bg-[#D4AF37] flex items-center justify-center text-white dark:text-[#1A1A1A]">
                <Share2 size={18} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Compartir</h4>
                <p className="text-xs text-gray-400">Invita a amigos</p>
              </div>
            </div>
          </div>
        </section>

        {/* ÚLTIMAS NOTICIAS */}
        <section>
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Crónicas</h3>
          </div>
          <div className="space-y-2">
            {visibleNews.map(item => (
              <Link to="/news" state={{ scrollToId: item.id }} key={item.id} className="bg-gray-50 dark:bg-[#1E1E1E] p-3 rounded-2xl flex gap-3 active:bg-gray-100 dark:active:bg-white/5 transition-colors">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100"><img src={item.image} className="w-full h-full object-cover" alt={item.title} /></div>
                <div className="flex flex-col justify-center min-w-0 py-0.5">
                  <span className="text-[10px] font-medium text-gray-400 mb-1">
                    {formatDate(item.publishedAt)}
                  </span>
                  <h4 className="font-medium text-gray-900 dark:text-white leading-snug line-clamp-2 text-sm">{item.title}</h4>
                  <span className="text-xs text-[#4B0082] dark:text-[#D4AF37] font-medium mt-1">Leer más</span>
                </div>
              </Link>
            ))}
          </div>
          <Link
            to="/news"
            className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-50 dark:bg-[#1E1E1E] py-3.5 rounded-2xl text-sm font-medium text-[#4B0082] dark:text-[#D4AF37] active:bg-gray-100 dark:active:bg-white/5 transition-colors"
          >
            Ver más noticias <Newspaper size={16} />
          </Link>
        </section>

      </div>
    </div>
  );
};

export default PublicHome;
