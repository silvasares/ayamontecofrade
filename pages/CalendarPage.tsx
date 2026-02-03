
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, ChevronRight, Shield, Calendar as CalendarIcon, Sparkles, MapPin } from 'lucide-react';
import { Paso, Day, Brotherhood } from '../types';

interface Props {
  pasos: Paso[];
  days: any[];
  brotherhoods: Brotherhood[];
}

const CalendarPage: React.FC<Props> = ({ pasos, days, brotherhoods }) => {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const location = useLocation();

  // USAR DÍAS DINÁMICOS: Usamos los días de la DB ordenados, o fallback al enum
  const daysList = days.length > 0 ? days : Object.values(Day).map(d => ({ name: d, date: null }));

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dayParam = searchParams.get('day');

    if (dayParam && daysList.some(d => d.name === dayParam)) {
      setSelectedDay(dayParam);
    } else if (!selectedDay && daysList.length > 0) {
      // Encontrar el día más próximo que no haya pasado (hoy o futuro)
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const upcomingDay = daysList.find(d => {
        if (!d.date) return false;
        const dayDate = new Date(d.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate >= now;
      });

      if (upcomingDay) {
        setSelectedDay(upcomingDay.name);
      } else {
        // Si todos los días han pasado, seleccionamos el último día de la agenda
        // Si no tienen fecha, intentamos Domingo de Ramos o el primero por defecto
        const lastDayWithDate = [...daysList].reverse().find(d => d.date);
        if (lastDayWithDate) {
          setSelectedDay(lastDayWithDate.name);
        } else {
          const dr = daysList.find(d => d.name === Day.DOMINGO_RAMOS);
          setSelectedDay(dr ? dr.name : daysList[0].name);
        }
      }
    }
  }, [daysList, location.search]);

  // Filtrar hermandades del día seleccionado y ordenarlas
  const dailyBrotherhoodsNames = useMemo(() => {
    // 1. Obtener todas las hermandades únicas para este día
    const bFromTable = (brotherhoods || []).filter(b => b.day === selectedDay);

    // Si no hay hermandades registradas aún para este día, sacarlas de los pasos
    if (bFromTable.length === 0) {
      return Array.from(new Set(
        pasos.filter(p => p.day === selectedDay).map(p => p.brotherhood)
      ));
    }

    // 2. Ordenarlas por startTime y luego por order_index
    const sorted = [...bFromTable].sort((a, b) => {
      // Comparar por hora de salida (más fiable para el orden cronológico)
      const timeA = a.startTime || a.start_time || '99:99';
      const timeB = b.startTime || b.start_time || '99:99';

      if (timeA !== timeB) {
        return timeA.localeCompare(timeB);
      }

      // Si tienen la misma hora, usar el order_index
      return (a.order_index || 0) - (b.order_index || 0);
    });

    return sorted.map(b => b.name);
  }, [selectedDay, brotherhoods, pasos]);

  return (
    <div className="animate-in fade-in duration-700 bg-luxuryWhite dark:bg-[#0A0A0A] min-h-screen flex flex-col">

      {/* CABECERA MONUMENTAL */}
      <div className="bg-[#300050] px-6 pt-20 pb-10 text-white shadow-[0_20px_50px_rgba(48,0,80,0.4)] relative overflow-hidden shrink-0 z-20">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <Sparkles size={120} className="text-goldCofrade" />
        </div>

        <div className="relative z-10 text-center">
          <p className="text-goldCofrade font-black text-[10px] uppercase tracking-[0.5em] mb-2 opacity-80">Guía Litúrgica</p>
          <h2 className="text-4xl font-cofrade tracking-tight mb-2">Agenda</h2>
        </div>
      </div>

      {/* MENÚ SUPERIOR DE DÍAS (Sticky) */}
      <div className="sticky top-16 md:top-0 z-50 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl shadow-lg border-b border-gray-100 dark:border-gray-800 transition-all">
        <div className="flex overflow-x-auto no-scrollbar px-4 py-3 gap-3 snap-x items-center">
          {daysList.map((day) => (
            <button
              key={day.name}
              onClick={() => {
                setSelectedDay(day.name);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 snap-center border shrink-0 flex flex-col items-center justify-center min-w-[100px] ${selectedDay === day.name
                ? 'bg-[#300050] text-goldCofrade border-[#300050] shadow-md scale-105'
                : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-white hover:border-goldCofrade/50'
                }`}
            >
              <span>{day.name}</span>
              {day.date && <span className="text-[8px] opacity-70 mt-0.5 normal-case font-bold">{new Date(day.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO DE HERMANDADES */}
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-10 relative z-10 w-full">
        {selectedDay && (
          <div className="flex items-center gap-4 mb-4 px-2 animate-in fade-in">
            <div className="h-px bg-goldCofrade/20 flex-grow"></div>
            <span className="text-[10px] font-black text-goldCofrade uppercase tracking-[0.4em] text-center">{selectedDay}</span>
            <div className="h-px bg-goldCofrade/20 flex-grow"></div>
          </div>
        )}

        {dailyBrotherhoodsNames.length > 0 ? (
          dailyBrotherhoodsNames.map((bName: string) => {
            const linkedBrotherhood = brotherhoods.find(br => br.name === bName);
            const bPasos = pasos.filter(p => p.brotherhood === bName || p.brotherhood_id === linkedBrotherhood?.id);
            const firstPaso = bPasos[0];
            const crest = linkedBrotherhood?.crest;

            return (
              <div key={bName} className="animate-in slide-in-from-bottom-6">
                <Link
                  to={`/brotherhood/${encodeURIComponent(bName)}`}
                  className="luxury-card rounded-[40px] md:rounded-[64px] overflow-hidden flex flex-col group active:scale-[0.97] transition-all duration-700 hover:border-goldCofrade/40 bg-white dark:bg-[#111]"
                >
                  <div className="p-6 md:p-10">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center text-center md:text-left">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-[36px] md:rounded-[44px] bg-white dark:bg-[#111] shadow-[0_30px_60px_-15px_rgba(48,0,80,0.15)] border-4 border-[#D4AF37] flex items-center justify-center p-3 shrink-0 group-hover:rotate-3 group-hover:scale-105 transition-all duration-700 relative overflow-hidden">
                        {crest ? (
                          <img src={crest} alt="Escudo" className="w-full h-full object-contain relative z-10" />
                        ) : (
                          <Shield size={40} className="text-goldCofrade/30 relative z-10" />
                        )}
                      </div>

                      <div className="flex-grow w-full">
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 md:gap-4 mb-4 md:mb-5">
                          <span className="gold-gradient text-[#300050] px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                            <Clock size={12} /> {firstPaso?.startTime || linkedBrotherhood?.startTime || linkedBrotherhood?.start_time || '--:--'}
                          </span>
                        </div>

                        <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight font-cofrade mb-2 group-hover:text-purpleCofrade transition-colors">
                          {bName}
                        </h3>

                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4 md:mt-6">
                          {bPasos.map(p => (
                            <div key={p.id} className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/10 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-800/30">
                              <div className="w-1 h-1 rounded-full gold-gradient shadow-sm"></div>
                              <span className="text-[9px] font-black text-purpleCofrade dark:text-goldCofrade uppercase tracking-widest truncate max-w-[150px]">{p.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })
        ) : (
          <div className="text-center py-32 bg-white dark:bg-[#111] rounded-[60px] border-4 border-dashed border-goldCofrade/5 animate-in zoom-in duration-1000 shadow-sm mx-4">
            <div className="relative inline-block mb-8">
              <CalendarIcon size={80} className="text-goldCofrade/10 mx-auto" strokeWidth={1} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-goldCofrade/20 rounded-full animate-ping"></div>
              </div>
            </div>
            <h4 className="text-gray-900 dark:text-gray-100 font-cofrade text-3xl mb-3">Sin Procesiones</h4>
            <p className="text-gray-400 dark:text-gray-500 text-xs font-serif italic max-w-xs mx-auto">
              No hay itinerarios programados para el {selectedDay}.
            </p>
          </div>
        )}
      </div>

      <div className="h-24" />
    </div>
  );
};

export default CalendarPage;
