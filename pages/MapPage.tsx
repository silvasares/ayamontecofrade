
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, MapPin, ChevronLeft, Calendar, Navigation, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { Paso, Brotherhood } from '../types';

declare const L: any;

interface MapProps {
  pasos: Paso[];
  brotherhoods: Brotherhood[];
}

const AYAMONTE_COORDS: Record<string, [number, number]> = {
  "Parroquia de las Angustias": [37.2152, -7.4055],
  "Iglesia de San Francisco": [37.2195, -7.4060],
  "Capilla del Socorro": [37.2170, -7.4040],
  "Templo de la Merced": [37.2165, -7.4075],
  "Salvador": [37.2205, -7.4030],
  "Plaza de la Laguna": [37.2145, -7.4065],
  "Paseo de la Ribera": [37.2135, -7.4080],
  "Tribuna": [37.2136, -7.4082],
  "Calle Real": [37.2148, -7.4068],
  "Calle Galdames": [37.2155, -7.4060],
  "Calle San Francisco": [37.2185, -7.4062],
  "Barrio Alto": [37.2180, -7.4035],
  "Calle Marte": [37.2175, -7.4045],
  "Calle Lusitania": [37.2140, -7.4070],
  "Plaza de la Coronación": [37.2130, -7.4085],
  "Plaza del Rosario": [37.2158, -7.4052],
  "Muelle de Portugal": [37.2125, -7.4090],
  "Calle Ahenas": [37.2150, -7.4050],
};

const MapPage: React.FC<MapProps> = ({ pasos, brotherhoods }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  const paso = pasos.find(p => p.id === id);
  const brotherhood = brotherhoods?.find(b => b.id === paso?.brotherhood_id || b.name === paso?.brotherhood);

  // Helper to reduce number of points if the route is very long
  const simplifyCoords = (coords: [number, number][], maxPoints = 300): [number, number][] => {
    if (coords.length <= maxPoints) return coords;
    const step = Math.ceil(coords.length / maxPoints);
    return coords.filter((_c, idx) => idx % step === 0);
  };

  // Compute route coordinates once per paso/brotherhood change
  const routeCoords = useMemo(() => {
    // Prioritize brotherhood route data
    const activeRouteCoords = brotherhood?.route_coords || paso?.route_coords;
    const activeRouteNames = brotherhood?.route || paso?.route;

    const rawCoords: [number, number][] = [];

    if (activeRouteCoords && activeRouteCoords.length > 0) {
      activeRouteCoords.forEach(coord => rawCoords.push(coord));
    } else if (activeRouteNames && activeRouteNames.length > 0) {
      activeRouteNames.forEach(street => {
        const cleanStreet = street.replace(/\(.*\)/, '').trim();
        const key = Object.keys(AYAMONTE_COORDS).find(k => cleanStreet.includes(k) || k.includes(cleanStreet));
        if (key) rawCoords.push(AYAMONTE_COORDS[key]);
      });
    }
    // Reduce points for performance
    return simplifyCoords(rawCoords);
  }, [paso?.id, brotherhood?.id, paso?.route_coords, paso?.route, brotherhood?.route_coords, brotherhood?.route]);

  useEffect(() => {
    if (!paso || !mapRef.current) return;
    if (typeof L === 'undefined') return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([37.2155, -7.4065], 16);

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // ---------- Render polyline with optional simplification ----------
    if (routeCoords.length > 0) {
      const polyline = L.polyline(routeCoords, {
        color: '#4B0082',
        weight: 6,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
        // Reduce rendering load for very dense routes
        smoothFactor: 1.5,
        noClip: true
      }).addTo(map);

      // Start marker
      L.marker(routeCoords[0], {
        icon: L.divIcon({
          className: 'custom-icon',
          html: `<div style="background:#D4AF37;width:20px;height:20px;border-radius:50%;border:4px solid white;box-shadow:0 0 15px rgba(212,175,55,0.6)"></div>`,
          iconSize: [20, 20]
        })
      }).addTo(map);

      // End marker
      L.marker(routeCoords[routeCoords.length - 1], {
        icon: L.divIcon({
          className: 'custom-icon',
          html: `<div style="background:#4B0082;width:20px;height:20px;border-radius:50%;border:4px solid white;box-shadow:0 0 15px rgba(75,0,130,0.4)"></div>`,
          iconSize: [20, 20]
        })
      }).addTo(map);

      // Ajustar vista al polyline
      map.fitBounds(polyline.getBounds(), { padding: [100, 100] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [paso, routeCoords]);

  const handleBack = () => {
    // Navigate back to Paso detail if it exists in history, otherwise go specifically to it
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (paso) {
      navigate(`/paso/${paso.id}`);
    } else {
      navigate('/calendar');
    }
  };

  if (!paso) return <div className="p-20 text-center font-cofrade text-2xl">Cofradía no encontrada</div>;

  return (
    <div className="fixed inset-0 bg-luxuryWhite dark:bg-[#0A0A0A] z-[50] overflow-hidden">

      <div ref={mapRef} className="absolute inset-0 z-0 force-light-map"></div>

      <div className="absolute top-0 left-0 right-0 z-[100] flex justify-between items-start pointer-events-none p-6 pt-safe">
        <button
          onClick={handleBack}
          className="p-4 bg-white/90 dark:bg-black/80 backdrop-blur-xl rounded-full shadow-2xl border border-goldCofrade/20 text-purpleCofrade dark:text-goldCofrade hover:scale-105 active:scale-90 transition-all pointer-events-auto"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="bg-purpleCofrade/90 dark:bg-[#1A1A1A]/95 backdrop-blur-xl px-5 py-3 rounded-[24px] shadow-2xl border border-white/10 pointer-events-auto flex items-center gap-3 animate-in slide-in-from-top-4">
          <div className="w-2 h-2 bg-goldCofrade rounded-full animate-pulse shadow-[0_0_10px_#D4AF37]"></div>
          <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">{paso.day}</span>
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 right-0 z-[80] transition-all duration-700 ease-out ${isPanelExpanded ? 'h-[85vh]' : 'h-[32vh]'} flex flex-col`}>
        <div
          className="w-full h-12 flex items-center justify-center cursor-pointer group"
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
        >
          <div className="w-16 h-1.5 bg-white/20 dark:bg-white/10 rounded-full group-hover:bg-goldCofrade/50 transition-colors"></div>
        </div>

        <div className="flex-grow bg-white/95 dark:bg-[#141414]/95 backdrop-blur-3xl rounded-t-[48px] shadow-[0_-20px_60px_rgba(0,0,0,0.3)] border-t border-white/20 dark:border-white/5 flex flex-col overflow-hidden">
          <div className="p-8 pb-4 shrink-0">
            <div className="flex justify-between items-start mb-4">
              <div className="min-w-0 flex-grow">
                <p className="text-[10px] text-goldCofrade font-black uppercase tracking-[0.3em] mb-1">Hermandad y Recorrido</p>
                <h2 className="text-2xl md:text-3xl font-cofrade text-purpleCofrade dark:text-goldCofrade leading-tight truncate pr-4">{brotherhood?.name || paso.name}</h2>
              </div>
              <div className="flex gap-2">
                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl flex flex-col items-center min-w-[60px] border border-gray-100 dark:border-gray-800">
                  <Clock size={14} className="text-gray-400 mb-1" />
                  <span className="text-[10px] font-black dark:text-white">{paso.startTime}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto px-8 pb-12 custom-scrollbar">
            <div className="flex items-center gap-3 mb-6 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/30">
              <Navigation size={18} className="text-purpleCofrade dark:text-goldCofrade" />
              <p className="text-[10px] font-black text-purpleCofrade dark:text-white uppercase tracking-widest">Secuencia de Itinerario Oficial</p>
            </div>

            <div className="space-y-0 pl-4 border-l-2 border-dashed border-gray-200 dark:border-gray-800 ml-2">
              {paso.route.map((street, i) => {
                const isTribuna = street.includes('Tribuna');
                return (
                  <div key={i} className="relative pl-8 pb-10 last:pb-4 group animate-in fade-in slide-in-from-left" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 shadow-sm transition-all duration-500 ${i === 0 ? 'bg-goldCofrade border-white dark:border-[#141414] scale-125' :
                      i === paso.route.length - 1 ? 'bg-purpleCofrade border-white dark:border-[#141414]' :
                        isTribuna ? 'bg-goldCofrade border-white dark:border-[#141414] animate-pulse' :
                          'bg-white dark:bg-[#202020] border-gray-200 dark:border-gray-700'
                      }`}></div>

                    <div className={`p-4 rounded-2xl transition-all duration-300 ${isTribuna ? 'bg-goldCofrade/10 border border-goldCofrade/30' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                      <p className={`text-sm font-bold uppercase tracking-tight ${isTribuna ? 'text-purpleCofrade dark:text-goldCofrade' : 'text-gray-700 dark:text-gray-300'}`}>
                        {street}
                      </p>
                      {i === 0 && <span className="text-[9px] font-black text-goldCofrade uppercase mt-1 block">Salida Procesional</span>}
                      {i === paso.route.length - 1 && <span className="text-[9px] font-black text-purpleCofrade uppercase mt-1 block">Recogida / Entrada</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
          .leaflet-container {
            background: #f0f0f0 !important;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(212, 175, 55, 0.2);
            border-radius: 10px;
          }
        `}</style>
    </div>
  );
};

export default MapPage;
