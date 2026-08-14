
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Shield, ChevronLeft, MapPin, Calendar, Info, ChevronRight,
    Cross, Crown, Sparkles, Shirt, Map as MapIcon, Loader2, Music, User, Tag, History, X, ExternalLink
} from 'lucide-react';
import { Paso, Temple, Brotherhood } from '../types';
import { supabase } from '../supabase';

interface Props {
    pasos: Paso[];
    temples: Temple[];
    bands: any[];
    brotherhoods: Brotherhood[];
}

// Map Viewer Component (Moved outside to avoid re-creation on every render)
const RouteViewer = ({ coords, pois }: { coords: [number, number][], pois?: any[] }) => {
    const mapContainerRef = React.useRef<HTMLDivElement>(null);
    const mapInstanceRef = React.useRef<any>(null);

    useEffect(() => {
        if (!mapContainerRef.current || !coords || coords.length === 0 || typeof (window as any).L === 'undefined') return;
        const L = (window as any).L;

        if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapContainerRef.current, {
                zoomControl: false,
                attributionControl: false,
                scrollWheelZoom: false
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(mapInstanceRef.current);
        }

        const map = mapInstanceRef.current;

        // Limpiar capas previas
        map.eachLayer((layer: any) => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                map.removeLayer(layer);
            }
        });

        // Add Markers
        coords.forEach((coord, idx) => {
            const isStart = idx === 0;
            const isEnd = idx === coords.length - 1;
            let bgColor = '#7C3AED';
            if (isStart) bgColor = '#D4AF37';
            if (isEnd) bgColor = '#EF4444';

            L.marker(coord, {
                icon: L.divIcon({
                    className: 'custom-div-icon',
                    html: `
                        <div style="background-color: ${bgColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 8px; font-family: sans-serif;">${idx + 1}</div>
                    `,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(map);
        });

        // Add POIs
        if (pois && pois.length > 0) {
            pois.forEach((poi: any) => {
                if (!poi.coords || poi.coords.length < 2) return;
                L.marker(poi.coords, {
                    icon: L.divIcon({
                        className: 'poi-icon',
                        html: `
                            <div style="background-color: #3B82F6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(59,130,246,0.5); display: flex; align-items: center; justify-content: center;"><div style="width: 4px; height: 4px; background-color: white; border-radius: 50%;"></div></div>
                        `,
                        iconSize: [12, 12],
                        iconAnchor: [6, 6]
                    })
                }).bindPopup(`<div style="padding: 4px;"><p style="font-family: sans-serif; font-size: 10px; font-weight: 800; margin: 0; color: #3B82F6; text-transform: uppercase;">Punto de Interés</p><p style="font-family: sans-serif; font-size: 13px; font-weight: 700; margin: 4px 0 0 0; color: #111;">${poi.name}</p></div>`).addTo(map);
            });
        }

        // Draw Polyline
        const polyline = L.polyline(coords, {
            color: '#4B0082',
            weight: 4,
            opacity: 0.6,
            dashArray: '5, 10',
            lineJoin: 'round'
        }).addTo(map);

        // Fit bounds
        try {
            if (coords.length > 0) {
                map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
                setTimeout(() => map.invalidateSize(), 500);
            }
        } catch (err) { console.error(err); }

    }, [coords, pois]);

    return <div ref={mapContainerRef} className="w-full h-full force-light-map" />;
};

const BrotherhoodPage: React.FC<Props> = ({ pasos, temples, bands, brotherhoods }) => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const decodedName = decodeURIComponent(name || '');

    // Try to find the brotherhood in the props first (faster and more reliable)
    const foundBrotherhood = useMemo(() => {
        if (!brotherhoods || brotherhoods.length === 0) return null;
        return brotherhoods.find(b =>
            b.name.toLowerCase().trim() === decodedName.toLowerCase().trim()
        );
    }, [brotherhoods, decodedName]);

    const [brotherhood, setBrotherhood] = useState<Brotherhood | null>(foundBrotherhood || null);
    const [loading, setLoading] = useState(!foundBrotherhood);

    const brotherhoodSteps = pasos.filter(p => p.brotherhood === decodedName);

    useEffect(() => {
        if (foundBrotherhood) {
            setBrotherhood(foundBrotherhood);
            setLoading(false);
            return;
        }

        const fetchBrotherhood = async () => {
            try {
                setLoading(true);
                let { data, error } = await supabase.from('hermandades').select('*').eq('name', decodedName).maybeSingle();

                if (!data) {
                    const { data: dataIlike } = await supabase.from('hermandades').select('*').ilike('name', decodedName).maybeSingle();
                    data = dataIlike;
                }

                if (data) setBrotherhood(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchBrotherhood();
    }, [decodedName, foundBrotherhood]);

    // Consolidate values before any conditional returns
    const mainInfo = brotherhood || (brotherhoodSteps[0] as any);

    const consolidatedRoute = useMemo(() => {
        if (!mainInfo?.route) return brotherhoodSteps[0]?.route || [];
        if (mainInfo.route.length > 0) return mainInfo.route;
        return brotherhoodSteps[0]?.route || [];
    }, [mainInfo?.route, brotherhoodSteps]);

    const consolidatedRouteCoords = useMemo(() => {
        if (!mainInfo?.route_coords) return brotherhoodSteps[0]?.route_coords || [];
        if (mainInfo.route_coords.length > 0) return mainInfo.route_coords;
        return brotherhoodSteps[0]?.route_coords || [];
    }, [mainInfo?.route_coords, brotherhoodSteps]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-goldCofrade" size={40} /></div>;
    if (!mainInfo) return <div className="p-20 text-center">Hermandad no encontrada</div>;

    const temple = temples.find(t => t.id === mainInfo.temple_id);
    const crest = mainInfo.crest;

    return (
        <div className="bg-[#F9FAFB] dark:bg-[#050505] min-h-screen pb-24">
            {/* Hero Section */}
            <div className="relative w-full bg-[#4B0082] overflow-hidden rounded-b-[40px] shadow-lg min-h-[350px] flex flex-col items-center justify-center pt-20 pb-12 px-6">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-0"></div>
                <button onClick={() => navigate(-1)} className="absolute top-6 left-6 z-50 p-3 bg-black/30 rounded-full text-white"><ChevronLeft size={24} /></button>

                <div className="relative z-10 flex flex-col items-center text-center animate-in zoom-in">
                    <div className="w-28 h-28 bg-white dark:bg-[#111] rounded-[32px] shadow-2xl p-2 flex items-center justify-center mb-6 border-4 border-[#D4AF37] overflow-hidden">
                        {crest ? <img src={crest} className="w-full h-full object-contain rounded-2xl" /> : <Shield size={56} className="text-[#D4AF37]" />}
                    </div>
                    <h1 className="text-xl md:text-3xl font-cofrade text-white font-bold mb-2">{mainInfo.name || decodedName}</h1>
                    <p className="text-goldCofrade text-[10px] font-black uppercase tracking-[0.3em]">{mainInfo.day}</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
                {/* Paso Tags / Quick Links */}
                {brotherhoodSteps.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8 bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-xl p-4 rounded-[32px] shadow-sm border border-goldCofrade/10">
                        <div className="flex items-center gap-2 px-2 py-1.5 shrink-0">
                            <Tag size={12} className="text-goldCofrade" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Titulares:</span>
                        </div>
                        {brotherhoodSteps.map(step => (
                            <Link
                                key={step.id}
                                to={`/paso/${step.id}`}
                                className="bg-purple-50 dark:bg-purple-900/20 text-purpleCofrade dark:text-goldCofrade px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-goldCofrade hover:text-[#300050] transition-all border border-goldCofrade/10 shadow-sm"
                            >
                                {step.name}
                            </Link>
                        ))}
                    </div>
                )}

                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                    {/* Info Card */}
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-sm font-black text-[#4B0082] dark:text-goldCofrade uppercase tracking-widest flex items-center gap-2 mb-6 border-b pb-3">
                            <Info size={16} /> Datos Institucionales
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <MapPin className="text-goldCofrade" size={20} />
                                <div className="min-w-0"><p className="text-[10px] font-black text-gray-400 uppercase">Sede</p><p className="text-sm font-bold dark:text-white truncate">{temple?.name || 'Ayamonte'}</p></div>
                            </div>
                            <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <Calendar className="text-goldCofrade" size={20} />
                                <div><p className="text-[10px] font-black text-gray-400 uppercase">Fundación</p><p className="text-sm font-bold dark:text-white">{mainInfo.foundation_year || 'Antigua'}</p></div>
                            </div>
                            {mainInfo.elder_brother && (
                                <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <User className="text-goldCofrade" size={20} />
                                    <div className="min-w-0"><p className="text-[10px] font-black text-gray-400 uppercase">Hno. Mayor</p><p className="text-sm font-bold dark:text-white">{mainInfo.elder_brother}</p></div>
                                </div>
                            )}
                        </div>

                        {/* Shared Schedule */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="luxury-card p-4 rounded-[24px] text-center border-t-4 border-t-goldCofrade/40">
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1"><Info size={10} /> Salida</p>
                                <p className="text-lg font-black text-purpleCofrade dark:text-goldCofrade">{mainInfo.startTime || '--:--'}</p>
                            </div>
                            <div className="luxury-card p-4 rounded-[24px] text-center border-t-4 border-t-goldCofrade">
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1"><Info size={10} /> Tribuna</p>
                                <p className="text-lg font-black text-purpleCofrade dark:text-goldCofrade">{mainInfo.tribuna_time || '--:--'}</p>
                            </div>
                            <div className="luxury-card p-4 rounded-[24px] text-center border-t-4 border-t-purpleCofrade/40">
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1"><Info size={10} /> Recogida</p>
                                <p className="text-lg font-black text-purpleCofrade dark:text-goldCofrade">{mainInfo.arrivalTime || '--:--'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-8">
                            {(() => {
                                const ua = window.navigator.userAgent;
                                const isWebView = /wv|Version\/[\d\.]+/i.test(ua) || (/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua));

                                // Si es un WebView (App compilada), no mostramos el botón para evitar errores de protocolo
                                if (isWebView) return null;

                                const destination = temple ? temple.address : consolidatedRoute[0] || 'Ayamonte';
                                const encodedDest = encodeURIComponent(destination);
                                const isIOS = /iPhone|iPad|iPod/i.test(ua);

                                // Formato más directo para evitar redirecciones 'intent://' en Android/Kodular
                                const mapsUrl = isIOS
                                    ? `maps://maps.apple.com/?daddr=${encodedDest}&dirflg=w`
                                    : `https://maps.google.com/?daddr=${encodedDest}&directionsmode=walking`;

                                return (
                                    <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-white dark:bg-[#1A1A1A] p-4 rounded-[24px] text-gray-900 dark:text-white flex items-center justify-between shadow-lg border border-goldCofrade/20 active:scale-95 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-2xl text-[#4B0082] dark:text-goldCofrade">
                                                <MapPin size={24} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black text-goldCofrade uppercase tracking-[0.2em] mb-0.5">Cómo Llegar</p>
                                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Abrir en Mapas</p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-white/5 p-2 rounded-full text-gray-400">
                                            <ExternalLink size={18} />
                                        </div>
                                    </a>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Hábito y Estrenos - Patrimonio */}
                    {(mainInfo.vestry || mainInfo.premieres) && (
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800 space-y-8">
                            <h3 className="text-sm font-black text-[#4B0082] dark:text-goldCofrade uppercase tracking-widest flex items-center gap-2 border-b pb-3">
                                <Sparkles size={16} /> Patrimonio
                            </h3>

                            <div className="space-y-8">
                                {mainInfo.vestry && (
                                    <div className="flex gap-6 items-start">
                                        <div className="shrink-0 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl text-[#4B0082] dark:text-goldCofrade">
                                            <Shirt size={24} />
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-6 flex-grow">
                                            <div className="flex-grow">
                                                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Hábito Nazareno</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{mainInfo.vestry}</p>
                                            </div>
                                            {mainInfo.vestry_image && (
                                                <img src={mainInfo.vestry_image} className="w-[80px] h-auto object-contain rounded-xl border border-goldCofrade/20 shadow-lg" alt="Hábito" />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {mainInfo.premieres && (
                                    <div className={`flex gap-6 items-start ${mainInfo.vestry ? 'border-t border-gray-50 dark:border-gray-800 pt-8' : ''}`}>
                                        <div className="shrink-0 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-2xl text-yellow-600 dark:text-yellow-400">
                                            <Sparkles size={24} />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Estrenos y Reformas</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">{mainInfo.premieres}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reseña Histórica Card */}
                    {mainInfo.history && (
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-[32px] p-8 md:p-10 shadow-sm border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-2">
                            <h3 className="text-sm font-black text-[#4B0082] dark:text-goldCofrade uppercase tracking-widest flex items-center gap-2 mb-6 border-b pb-3">
                                <History size={16} /> Reseña Histórica
                            </h3>
                            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed text-justify font-cofrade first-letter:text-5xl first-letter:font-bold first-letter:text-goldCofrade first-letter:mr-3 first-letter:float-left">
                                {mainInfo.history}
                            </p>
                        </div>
                    )}

                    {/* Itinerario / Mapa */}
                    {(consolidatedRoute.length > 0 || consolidatedRouteCoords.length > 0) && (
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-[32px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="p-0">
                                <div className="p-8 pb-4">
                                    <h3 className="text-sm font-black text-[#4B0082] dark:text-goldCofrade uppercase tracking-widest flex items-center gap-2 mb-2 border-b pb-3">
                                        <MapIcon size={16} /> Itinerario y Recorrido
                                    </h3>
                                </div>
                                <div className="w-full h-[400px] relative">
                                    <RouteViewer coords={consolidatedRouteCoords} pois={mainInfo.pois} />
                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-[2000] pointer-events-none">
                                        <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-goldCofrade/20 shadow-xl pointer-events-auto">
                                            <p className="text-[10px] font-black text-[#300050] dark:text-goldCofrade uppercase tracking-widest">Mapa Interactivo</p>
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4 z-[2000] pointer-events-none">
                                        <div className="flex flex-col gap-2">
                                            {mainInfo.pois && mainInfo.pois.length > 0 && (
                                                <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-goldCofrade/20 shadow-xl pointer-events-auto max-w-[200px]">
                                                    <p className="text-[9px] font-black uppercase text-goldCofrade mb-2 border-b pb-1">Puntos de Interés</p>
                                                    <div className="space-y-1.5">
                                                        {mainInfo.pois.map((poi: any, i: number) => (
                                                            <div key={i} className="flex gap-2 items-start">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0"></div>
                                                                <p className="text-[9px] font-bold text-gray-700 dark:text-gray-300 leading-tight">{poi.name}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 pt-6">
                                    <div className="space-y-4 pl-4 border-l-2 border-goldCofrade/20 ml-2 py-2">
                                        {consolidatedRoute.map((street: string, i: number) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-goldCofrade/40 shrink-0"></div>
                                                <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-tight">{street}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Titulares List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-cofrade text-[#4B0082] dark:text-goldCofrade ml-2">Titulares y Pasos</h3>
                        {brotherhoodSteps.map(step => {
                            const stepBand = bands.find(b => b.id === step.band_id);
                            return (
                                <Link to={`/paso/${step.id}`} key={step.id} className="block bg-white dark:bg-[#1A1A1A] rounded-[32px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 group hover:shadow-lg transition-all relative">
                                    <div className="flex h-32">
                                        <img src={step.main_image} className="w-32 object-cover" alt={step.name} />
                                        <div className="flex-1 p-6 flex flex-col justify-center">
                                            <p className="text-[9px] font-black text-goldCofrade uppercase tracking-widest mb-1">Paso Procesional</p>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-1">{step.name}</h4>
                                            {stepBand && (
                                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                    <Music size={12} className="text-purpleCofrade/60 dark:text-goldCofrade/60" />
                                                    <p className="text-[10px] font-medium line-clamp-1">{stepBand.name}</p>
                                                </div>
                                            )}
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2"><ChevronRight size={24} className="text-gray-200 group-hover:text-goldCofrade transition-colors" /></div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrotherhoodPage;
