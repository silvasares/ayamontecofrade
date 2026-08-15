
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Map as MapIcon, Music, Shirt, Route, Star, Church } from 'lucide-react';
import { Paso, Day, Brotherhood } from '../types';

interface Props {
  pasos: Paso[];
  days: any[];
  brotherhoods: Brotherhood[];
}

const CalendarPage: React.FC<Props> = ({ pasos, days, brotherhoods }) => {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const daysList = days.length > 0 ? days : Object.values(Day).map(d => ({ name: d, date: null }));

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dayParam = searchParams.get('day');

    if (dayParam && daysList.some(d => d.name === dayParam)) {
      setSelectedDay(dayParam);
    } else if (!selectedDay && daysList.length > 0) {
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

  // Auto-scroll al tab seleccionado
  useEffect(() => {
    if (!tabsRef.current || !selectedDay) return;
    const activeTab = tabsRef.current.querySelector(`[data-day="${selectedDay}"]`);
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedDay]);

  const dayPasos = useMemo(() => {
    if (!selectedDay) return [];
    const selectedLower = selectedDay.toLowerCase().trim();

    const filtered = pasos.filter(p => {
      const pasoDay = (p.day || '').toLowerCase().trim();
      return pasoDay === selectedLower;
    });

    return filtered.sort((a, b) => {
      const timeA = a.startTime || '99:99';
      const timeB = b.startTime || '99:99';
      return timeA.localeCompare(timeB);
    });
  }, [selectedDay, pasos]);

  const selectedDayDate = useMemo(() => {
    const selectedLower = selectedDay.toLowerCase().trim();
    const d = daysList.find(day => {
      const dayNameLower = (day.name || '').toLowerCase().trim();
      return dayNameLower === selectedLower;
    });
    if (!d?.date) return null;
    return new Date(d.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [selectedDay, daysList]);

  const abbreviateDay = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('viernes de dolores')) return 'Vie. Dolores';
    if (n.includes('sábado de pasión') || n.includes('sabado de pasion')) return 'Sáb. Pasión';
    if (n.includes('domingo de ramos')) return 'Dom. Ramos';
    if (n.includes('lunes santo')) return 'Lun. Santo';
    if (n.includes('martes santo')) return 'Mar. Santo';
    if (n.includes('miércoles santo') || n.includes('miercoles santo')) return 'Mié. Santo';
    if (n.includes('jueves santo')) return 'Jue. Santo';
    if (n.includes('madruga')) return 'Madrugá';
    if (n.includes('viernes santo')) return 'Vie. Santo';
    if (n.includes('sábado santo') || n.includes('sabado santo')) return 'Sáb. Santo';
    if (n.includes('domingo de resurrección') || n.includes('domingo de resurreccion')) return 'Dom. Resur.';
    if (n.includes('domingo de señas')) return 'Dom. Señas';
    return name.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const formatShortDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">

      {/* Tabs de días */}
      <div ref={tabsRef} className="sticky top-12 md:top-0 z-50 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-white/5 overflow-x-auto no-scrollbar">
        <div className="flex px-3 py-2.5 gap-2 min-w-max">
          {daysList.map((day) => {
            const isActive = selectedDay === day.name;
            const PasoCount = pasos.filter(p => (p.day || '').toLowerCase().trim() === day.name.toLowerCase().trim()).length;
            return (
              <button
                key={day.name}
                data-day={day.name}
                onClick={() => {
                  setSelectedDay(day.name);
                  setExpandedId(null);
                }}
                className={`flex flex-col items-center px-4 py-2.5 rounded-xl transition-all duration-200 shrink-0 min-w-[110px] ${
                  isActive
                    ? 'bg-[#4B0082] dark:bg-[#D4AF37] text-white dark:text-[#1A1A1A] shadow-md'
                    : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-white/10'
                }`}
              >
                <span className="text-xs font-semibold leading-tight">{abbreviateDay(day.name)}</span>
                {day.date && (
                  <span className={`text-[10px] mt-0.5 ${isActive ? 'opacity-80' : 'opacity-50'}`}>
                    {formatShortDate(day.date)}
                  </span>
                )}
                {!isActive && PasoCount > 0 && (
                  <span className="text-[9px] mt-0.5 opacity-40">{PasoCount} pasos</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fecha del día */}
      {selectedDayDate && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 capitalize">{selectedDayDate}</p>
        </div>
      )}

      {/* Lista de pasos */}
      <div className="px-4 pb-24">
        {dayPasos.length > 0 ? (
          <div className="space-y-2 pt-1">
            {dayPasos.map((paso, idx) => {
              const linkedBrotherhood = brotherhoods.find(b => b.id === paso.brotherhood_id || b.name === paso.brotherhood);
              const bName = paso.brotherhood;
              const startTime = paso.startTime || linkedBrotherhood?.startTime || '--:--';
              const arrivalTime = paso.arrivalTime || linkedBrotherhood?.arrivalTime;
              const hasMap = paso.route_coords && paso.route_coords.length > 0;
              const isExpanded = expandedId === paso.id;
              const crest = linkedBrotherhood?.crest;

              return (
                <div key={paso.id} className="bg-white dark:bg-[#1A1A1A] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/paso/${paso.id}`}
                      className="flex items-center gap-3 flex-grow py-3 pl-3 pr-1 min-w-0 active:bg-gray-50 dark:active:bg-white/5 transition-colors"
                    >
                      <div className="w-14 shrink-0 text-center">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{startTime}</span>
                        {arrivalTime && (
                          <span className="block text-[10px] text-gray-400 dark:text-gray-500">→ {arrivalTime}</span>
                        )}
                      </div>

                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#4B0082] dark:bg-[#D4AF37]"></div>
                        {idx < dayPasos.length - 1 && <div className="w-px h-3 bg-gray-200 dark:bg-white/10"></div>}
                      </div>

                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{paso.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {crest && <img src={crest} alt="" className="w-3 h-3 rounded-full object-contain" />}
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{bName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pr-1">
                        {hasMap && <MapIcon size={12} className="text-gray-300 dark:text-gray-600" />}
                        {paso.band_id && <Music size={12} className="text-gray-300 dark:text-gray-600" />}
                        <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    </Link>

                    <button
                      onClick={() => toggleExpand(paso.id)}
                      className="p-2 mr-1 rounded-lg active:bg-gray-100 dark:active:bg-white/5 transition-colors shrink-0"
                    >
                      <ChevronRight
                        size={14}
                        className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-3 pt-0 border-t border-gray-50 dark:border-white/5">
                      <div className="pt-3 space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          {paso.technical_data?.author && (
                            <div>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">Autor</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">{paso.technical_data.author}</p>
                            </div>
                          )}
                          {paso.technical_data?.costaleros && (
                            <div>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">Costaleros</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">{paso.technical_data.costaleros}</p>
                            </div>
                          )}
                          {paso.technical_data?.weight && (
                            <div>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">Peso</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">{paso.technical_data.weight}</p>
                            </div>
                          )}
                          {paso.technical_data?.dimensions && (
                            <div>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">Dimensiones</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">{paso.technical_data.dimensions}</p>
                            </div>
                          )}
                        </div>

                        {linkedBrotherhood?.temple_id && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Church size={12} />
                            <span>Salida desde templo</span>
                          </div>
                        )}

                        {paso.route && paso.route.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Route size={12} className="text-gray-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                              {paso.route.filter(Boolean).join(' → ')}
                            </p>
                          </div>
                        )}

                        {paso.premieres && (
                          <div className="flex items-start gap-2">
                            <Star size={12} className="text-[#D4AF37] mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic">{paso.premieres}</p>
                          </div>
                        )}

                        {paso.vestry && (
                          <div className="flex items-start gap-2">
                            <Shirt size={12} className="text-gray-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{paso.vestry}</p>
                          </div>
                        )}

                        <Link
                          to={`/paso/${paso.id}`}
                          className="block text-center text-xs font-medium text-[#4B0082] dark:text-[#D4AF37] pt-1"
                        >
                          Ver ficha completa →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-gray-300 dark:text-gray-600 text-sm">Sin procesiones este día</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
