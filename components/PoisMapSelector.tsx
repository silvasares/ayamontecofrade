
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Trash2, MousePointer2, Plus, Info, X, Save } from 'lucide-react';

declare const L: any;

interface Poi {
    name: string;
    coords: [number, number];
}

interface PoisMapSelectorProps {
    value: Poi[];
    onChange: (pois: Poi[]) => void;
}

const PoisMapSelector: React.FC<PoisMapSelectorProps> = ({ value, onChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [editingPoi, setEditingPoi] = useState<{
        index: number,
        name: string,
        coords?: [number, number],
        isNew?: boolean
    } | null>(null);

    // Inicializar mapa
    useEffect(() => {
        if (!mapContainerRef.current || typeof L === 'undefined') return;

        if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapContainerRef.current, {
                zoomControl: true,
            }).setView([37.2155, -7.4065], 16);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(mapInstanceRef.current);

            setTimeout(() => {
                mapInstanceRef.current?.invalidateSize();
            }, 200);
        }
    }, []);

    // Actualizar el listener de click para capturar el 'value' actual
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const onMapClick = (e: any) => {
            // No añadimos todavía al parent state para evitar race conditions
            // Simplemente abrimos el editor con los datos temporales
            setEditingPoi({
                index: value.length,
                name: 'Nuevo Punto de Interés',
                coords: [e.latlng.lat, e.latlng.lng],
                isNew: true
            });
        };

        mapInstanceRef.current.off('click');
        mapInstanceRef.current.on('click', onMapClick);

    }, [value, onChange]);

    // Renderizar marcadores
    useEffect(() => {
        if (!mapInstanceRef.current || typeof L === 'undefined') return;

        // Limpiar marcadores existentes
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        // Crear nuevos marcadores
        markersRef.current = value.map((poi, idx) => {
            const marker = L.marker(poi.coords, {
                draggable: true,
                icon: L.divIcon({
                    className: 'poi-div-icon',
                    html: `
                        <div style="
                            background-color: #3B82F6;
                            width: 28px;
                            height: 28px;
                            border-radius: 50%;
                            border: 3px solid white;
                            box-shadow: 0 4px 10px rgba(59,130,246,0.5);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            transition: all 0.3s ease;
                        ">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                    `,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                })
            }).addTo(mapInstanceRef.current);

            // Popup con el nombre
            marker.bindTooltip(poi.name, {
                permanent: false,
                direction: 'top',
                offset: [0, -15],
                className: 'poi-tooltip'
            });

            // Arrastrar marcador
            marker.on('dragend', (e: any) => {
                const newPos = e.target.getLatLng();
                const newValue = [...value];
                newValue[idx] = { ...newValue[idx], coords: [newPos.lat, newPos.lng] };
                onChange(newValue);
            });

            // Click para editar marcador
            marker.on('click', (e: any) => {
                L.DomEvent.stopPropagation(e);
                setEditingPoi({ index: idx, name: poi.name });
            });

            return marker;
        });

    }, [value, onChange]);

    const handleSavePoiName = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPoi !== null) {
            const newValue = [...value];
            if (editingPoi.isNew && editingPoi.coords) {
                // Es un punto nuevo, lo añadimos
                newValue.push({
                    name: editingPoi.name || 'Punto de Interés',
                    coords: editingPoi.coords
                });
            } else if (newValue[editingPoi.index]) {
                // Es un punto existente, lo actualizamos
                newValue[editingPoi.index] = { ...newValue[editingPoi.index], name: editingPoi.name };
            }

            onChange(newValue);
            setEditingPoi(null);
        }
    };

    const deletePoi = (index: number) => {
        if (confirm('¿Eliminar este punto de interés?')) {
            const newValue = value.filter((_, i) => i !== index);
            onChange(newValue);
            setEditingPoi(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black uppercase text-goldCofrade tracking-widest flex items-center gap-2">
                    <MapPin size={12} /> Puntos de Interés ({value.length})
                </label>
                <div className="flex gap-2">
                    <span className="text-[10px] text-gray-400 font-medium italic">Toca el mapa para añadir un marcador azul</span>
                </div>
            </div>

            <div className="relative group rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-inner">
                <div
                    ref={mapContainerRef}
                    className="h-[400px] w-full z-0 bg-white force-light-map cursor-crosshair"
                ></div>

                {value.length === 0 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-black/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-blue-100 dark:border-blue-900 shadow-xl flex items-center gap-3 pointer-events-none z-[400] animate-in slide-in-from-top-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                            <Plus size={16} className="animate-pulse" />
                        </div>
                        <span className="text-[11px] font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest">Haz click en el mapa para marcar tribunas, encuentros, etc.</span>
                    </div>
                )}
            </div>

            {/* Listado de puntos añadidos (Cards similares a la imagen del usuario pero más compactas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {value.map((poi, idx) => (
                    <div
                        key={idx}
                        className="bg-white dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between items-center group hover:border-blue-500/30 transition-all cursor-pointer"
                        onClick={() => setEditingPoi({ index: idx, name: poi.name })}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                <MapPin size={16} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{poi.name}</p>
                                <p className="text-[9px] text-gray-400 font-mono truncate">{poi.coords[0].toFixed(5)}, {poi.coords[1].toFixed(5)}</p>
                            </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); deletePoi(idx); }}
                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de edición de nombre */}
            {editingPoi !== null && (
                <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-[#111] w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in duration-300">
                        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Info size={18} />
                                <h3 className="font-bold uppercase text-xs tracking-widest">Identificar Punto</h3>
                            </div>
                            <button onClick={() => setEditingPoi(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 mb-2 block tracking-widest">Nombre del Evento / Punto</label>
                                <input
                                    autoFocus
                                    className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl outline-none font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                    value={editingPoi.name}
                                    onChange={e => setEditingPoi({ ...editingPoi, name: e.target.value })}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSavePoiName(e as any);
                                        }
                                    }}
                                    placeholder="Ej. Encuentro, Tribuna, Petalá..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => deletePoi(editingPoi.index)}
                                    className="flex-1 bg-red-50 dark:bg-red-900/10 text-red-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                >
                                    Eliminar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSavePoiName}
                                    className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={16} /> Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .poi-tooltip {
                    background: #3B82F6;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 4px 10px;
                    box-shadow: 0 4px 10px rgba(59,130,246,0.3);
                }
                .poi-tooltip:before {
                    border-top-color: #3B82F6;
                }
            `}</style>
        </div>
    );
};

export default PoisMapSelector;
