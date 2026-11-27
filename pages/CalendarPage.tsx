
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Map as MapIcon, Music, Shirt, Route, Star, Church, ChevronDown, X, Search, Heart, Share2, Loader2 } from 'lucide-react';
import { Paso, Day, Brotherhood } from '../types';
import { useAppData } from '../context/AppDataContext';

interface Props {
  pasos: Paso[];
  days: any[];
  brotherhoods: Brotherhood[];
}

const CalendarPage: React.FC<Props> = () => {
  const { pasos, days, brotherhoods } = useAppData();
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    try { return localStorage.getItem('ac_calendar_day') || ''; } catch { return ''; }
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('ac_favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const daysList = days.length > 0 ? days : Object.values(Day).map(d => ({ name: d, date: null }));

  // Simular carga inicial
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

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

  useEffect(() => {
    if (selectedDay) {
      try { localStorage.setItem('ac_calendar_day', selectedDay); } catch {}
    }
  }, [selectedDay]);

  // Guardar favoritos
  useEffect(() => {
    try { localStorage.setItem('ac_favorites', JSON.stringify([...favorites])); } catch {}
  }, [favorites]);

  const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const sharePaso = useCallback(async (paso: Paso, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareData = {
      title: `${paso.name} - ${paso.brotherhood}`,
      text: `${paso.name} (${paso.brotherhood}) - Ayamonte Cofrade`,
      url: `${window.location.origin}/#/paso/${paso.id}`
    };
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error("Share not supported");
      }
    } catch {
      navigator.clipboard.writeText(shareData.url);
      alert("Enlace copiado al portapapeles.");
    }
  }, []);

  const dayPasos = useMemo(() => {
    let filtered: Paso[];

    if (searchQuery.trim()) {
      // Búsqueda en TODOS los días
      const q = searchQuery.toLowerCase().trim();
      filtered = pasos.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brotherhood.toLowerCase().includes(q)
      );
    } else if (selectedDay) {
      const selectedLower = selectedDay.toLowerCase().trim();
      filtered = pasos.filter(p => {
        const pasoDay = (p.day || '').toLowerCase().trim();
        return pasoDay === selectedLower;
      });
    } else {
      filtered = [];
    }

    return filtered.sort((a, b) => {
      if (searchQuery.trim()) {
        // Agrupar por día cuando se busca
        const dayA = (a.day || '').toLowerCase();
        const dayB = (b.day || '').toLowerCase();
        if (dayA !== dayB) return dayA.localeCompare(dayB);
      }
      const timeA = a.startTime || '99:99';
      const timeB = b.startTime || '99:99';
      return timeA.localeCompare(timeB);
    });
  }, [selectedDay, pasos, searchQuery]);

  const selectedDayDate = useMemo(() => {
    const selectedLower = selectedDay.toLowerCase().trim();
    const d = daysList.find(day => (day.name || '').toLowerCase().trim() === selectedLower);
    if (!d?.date) return null;
    return new Date(d.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [selectedDay, daysList]);

  const formatShortDay = (name: string): string => {
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
    return name.split(' ').slice(0, 2).join(' ');
  };

  const formatDayButton = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('viernes de dolores')) return 'Viernes de Dolores';
    if (n.includes('sábado de pasión') || n.includes('sabado de pasion')) return 'Sábado de Pasión';
    if (n.includes('domingo de ramos')) return 'Domingo de Ramos';
    if (n.includes('lunes santo')) return 'Lunes Santo';
    if (n.includes('martes santo')) return 'Martes Santo';
    if (n.includes('miércoles santo') || n.includes('miercoles santo')) return 'Miércoles Santo';
    if (n.includes('jueves santo')) return 'Jueves Santo';
    if (n.includes('madruga')) return 'Madrugá';
    if (n.includes('viernes santo')) return 'Viernes Santo';
    if (n.includes('sábado santo') || n.includes('sabado santo')) return 'Sábado Santo';
    if (n.includes('domingo de resurrección') || n.includes('domingo de resurreccion')) return 'Domingo de Resurrección';
    if (n.includes('domingo de señas')) return 'Domingo de Señas';
    return name;
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // Skeleton loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
        <div className="sticky top-12 md:top-0 z-50 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-white/5 p-4">
          <div className="h-10 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
        </div>
        <div className="px-4 pt-4 space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1A1A1A] rounded-xl p-4 flex gap-3">
              <div className="w-14 shrink-0 space-y-1">
                <div className="h-4 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-10 bg-gray-100 dark:bg-white/5 rounded animate-pulse mx-auto" />
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-100 dark:bg-white/5 animate-pulse" />
                <div className="w-px h-3 bg-gray-100 dark:bg-white/5 mt-1" />
              </div>
              <div className="flex-grow space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-white/5 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-white/5 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] relative">

      {/* Fondo decorativo */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.08] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'url(/bg-candle.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Selector de día */}
      <div className="sticky top-12 md:top-0 z-50 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-between px-4 py-3 active:bg-gray-50 dark:active:bg-white/5 transition-colors"
        >
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatShortDay(selectedDay)}</p>
            {selectedDayDate && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{selectedDayDate}</p>
            )}
          </div>
          <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${showPicker ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="sticky top-[88px] md:top-12 z-40 bg-gray-50/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl px-4 py-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar paso o hermandad..."
            className="w-full h-9 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-8 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-[#4B0082] dark:focus:ring-[#D4AF37] transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full active:bg-gray-100 dark:active:bg-white/5">
              <X size={12} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom sheet picker */}
      {showPicker && (
        <div className="fixed inset-0 z-[100]" onClick={() => setShowPicker(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#2C2C2E] rounded-t-2xl max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100 dark:border-white/10">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Seleccionar día</h3>
              <button onClick={() => setShowPicker(false)} className="p-1 rounded-full active:bg-gray-100 dark:active:bg-white/10">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[55vh]">
              {daysList.map((day) => {
                const isActive = selectedDay === day.name;
                const pasoCount = pasos.filter(p => (p.day || '').toLowerCase().trim() === day.name.toLowerCase().trim()).length;
                return (
                  <button
                    key={day.name}
                    onClick={() => { setSelectedDay(day.name); setExpandedId(null); setShowPicker(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 dark:active:bg-white/5 transition-colors border-b border-gray-50 dark:border-white/5 last:border-0 ${isActive ? 'bg-[#4B0082]/5 dark:bg-[#D4AF37]/5' : ''}`}
                  >
                    <div className="text-left">
                      <p className={`text-sm font-medium ${isActive ? 'text-[#4B0082] dark:text-[#D4AF37]' : 'text-gray-900 dark:text-white'}`}>{formatDayButton(day.name)}</p>
                      {day.date && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{new Date(day.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {pasoCount > 0 && <span className="text-[10px] text-gray-400 dark:text-gray-500">{pasoCount} pasos</span>}
                      {isActive && <div className="w-2 h-2 rounded-full bg-[#4B0082] dark:bg-[#D4AF37]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Lista de pasos */}
      <div className="px-4 pb-24 relative z-10">
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
              const isFav = favorites.has(paso.id);

              return (
                <div key={paso.id} className="bg-white dark:bg-[#1A1A1A] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/paso/${paso.id}`}
                      className="flex items-center gap-3 flex-grow py-3 pl-3 pr-1 min-w-0 active:bg-gray-50 dark:active:bg-white/5 transition-colors"
                    >
                      <div className="w-14 shrink-0 text-center">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{startTime}</span>
                        {arrivalTime && <span className="block text-[10px] text-gray-400 dark:text-gray-500">→ {arrivalTime}</span>}
                      </div>

                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${isFav ? 'bg-red-400' : 'bg-[#4B0082] dark:bg-[#D4AF37]'}`}></div>
                        {idx < dayPasos.length - 1 && <div className="w-px h-3 bg-gray-200 dark:bg-white/10"></div>}
                      </div>

                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{paso.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {crest && <img src={crest} alt="" className="w-3 h-3 rounded-full object-contain shrink-0" />}
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 leading-snug">{bName}</p>
                        </div>
                        {searchQuery.trim() && (
                          <p className="text-[10px] text-[#4B0082] dark:text-[#D4AF37] font-medium mt-0.5">{formatDayButton(paso.day || '')}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0 pr-1">
                        {hasMap && <MapIcon size={12} className="text-gray-300 dark:text-gray-600" />}
                        {paso.band_id && <Music size={12} className="text-gray-300 dark:text-gray-600" />}
                        <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    </Link>

                    {/* Botones de acción */}
                    <div className="flex items-center gap-0.5 shrink-0 mr-1">
                      <button onClick={(e) => toggleFavorite(paso.id, e)} className="p-1.5 rounded-lg active:bg-gray-100 dark:active:bg-white/5 transition-colors">
                        <Heart size={14} className={isFav ? 'text-red-400 fill-red-400' : 'text-gray-300 dark:text-gray-600'} />
                      </button>
                      <button onClick={(e) => sharePaso(paso, e)} className="p-1.5 rounded-lg active:bg-gray-100 dark:active:bg-white/5 transition-colors">
                        <Share2 size={14} className="text-gray-300 dark:text-gray-600" />
                      </button>
                      <button onClick={() => toggleExpand(paso.id)} className="p-1.5 rounded-lg active:bg-gray-100 dark:active:bg-white/5 transition-colors">
                        <ChevronRight size={14} className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
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

                        <Link to={`/paso/${paso.id}`} className="block text-center text-xs font-medium text-[#4B0082] dark:text-[#D4AF37] pt-1">
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
            <p className="text-gray-300 dark:text-gray-600 text-sm">
              {searchQuery ? 'Sin resultados para "' + searchQuery + '"' : 'Sin procesiones este día'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
