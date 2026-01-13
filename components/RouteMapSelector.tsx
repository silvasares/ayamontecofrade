
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Trash2, Navigation, MousePointer2 } from 'lucide-react';

declare const L: any;

interface RouteMapSelectorProps {
    value: [number, number][];
    onChange: (coords: [number, number][]) => void;
}

const RouteMapSelector: React.FC<RouteMapSelectorProps> = ({ value, onChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const polylineRef = useRef<any>(null);

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

            // Manejador de click en el mapa para AÑADIR puntos
            mapInstanceRef.current.on('click', (e: any) => {
                const newCoords: [number, number] = [e.latlng.lat, e.latlng.lng];
                // Importante: AQUÍ accedemos al valor más reciente a través de una función o ref si fuera necesario,
                // pero como value está en las dependencias del useEffect de abajo, la lógica de actualización debe ser cuidadosa.
                // Mejor estrategia: Pasar la actualización al componente padre basándonos en las props actuales.
                // Sin embargo, dentro del closure del evento, 'value' podría ser antiguo si no se recrea el listener.
                // Para evitar problemas de closure, usaremos una referencia mutable para el valor actual o recrearemos el listener.
            });

            // Fix map rendering issues
            setTimeout(() => {
                mapInstanceRef.current?.invalidateSize();
            }, 200);
        }

        // Actualizar el listener de click cada vez que 'value' cambia para tener el array actualizado
        mapInstanceRef.current.off('click');
        mapInstanceRef.current.on('click', (e: any) => {
            const newCoords: [number, number] = [e.latlng.lat, e.latlng.lng];
            onChange([...value, newCoords]);
        });

    }, [value, onChange]); // Dependencias clave

    // Renderizar marcadores y línea
    useEffect(() => {
        if (!mapInstanceRef.current || typeof L === 'undefined') return;

        // Limpiar marcadores existentes
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        // Limpiar línea existente
        if (polylineRef.current) {
            polylineRef.current.remove();
        }

        // Crear nuevos marcadores
        markersRef.current = value.map((coord, idx) => {
            const isStart = idx === 0;
            const isEnd = idx === value.length - 1 && value.length > 1;

            // Color según posición
            let bgColor = '#7C3AED'; // Intermedio (Morado)
            if (isStart) bgColor = '#D4AF37'; // Inicio (Dorado)
            if (isEnd) bgColor = '#EF4444'; // Fin (Rojo)

            const marker = L.marker(coord, {
                draggable: true,
                icon: L.divIcon({
                    className: 'custom-div-icon',
                    html: `
                        <div style="
                            background-color: ${bgColor};
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            border: 3px solid white;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.4);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: bold;
                            font-size: 10px;
                            font-family: sans-serif;
                        ">${idx + 1}</div>
                    `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            }).addTo(mapInstanceRef.current);

            // Arrastrar marcador
            marker.on('dragend', (e: any) => {
                const newPos = e.target.getLatLng();
                const newValue = [...value];
                newValue[idx] = [newPos.lat, newPos.lng];
                onChange(newValue);
            });

            // Click para borrar marcador
            marker.on('click', (e: any) => {
                L.DomEvent.stopPropagation(e); // Evitar que el mapa reciba el click y cree otro punto
                const newValue = value.filter((_, i) => i !== idx);
                onChange(newValue);
            });

            return marker;
        });

        // Dibujar línea conectora
        if (value.length > 0) {
            polylineRef.current = L.polyline(value, {
                color: '#4B0082',
                weight: 4,
                opacity: 0.7,
                dashArray: '10, 10',
                lineJoin: 'round'
            }).addTo(mapInstanceRef.current);
        }

    }, [value, onChange]); // Se ejecuta cuando cambian los puntos

    const clearRoute = () => {
        if (confirm('¿Borrar todo el recorrido?')) {
            onChange([]);
        }
    };

    const removeLast = () => {
        if (value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                    <Navigation size={12} /> Trazar Recorrido ({value.length} puntos)
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={removeLast}
                        disabled={value.length === 0}
                        className="text-[10px] font-bold text-gray-500 hover:text-red-500 uppercase disabled:opacity-30 bg-gray-100 px-3 py-1 rounded-lg transition-colors"
                    >
                        Deshacer Último
                    </button>
                    <button
                        type="button"
                        onClick={clearRoute}
                        disabled={value.length === 0}
                        className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg uppercase disabled:opacity-30 transition-colors"
                    >
                        Borrar Todo
                    </button>
                </div>
            </div>

            <div className="relative group">
                <div
                    ref={mapContainerRef}
                    className="h-[500px] w-full rounded-2xl border border-gray-200 z-0 overflow-hidden shadow-inner bg-white force-light-map cursor-crosshair"
                ></div>
                {value.length === 0 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full border border-gray-200 shadow-lg flex items-center gap-2 pointer-events-none z-[400]">
                        <MousePointer2 size={14} className="text-goldCofrade animate-bounce" />
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Toca el mapa para empezar</span>
                    </div>
                )}
            </div>

            <p className="text-[10px] text-gray-400 flex gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span> Inicio</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span> Puntos intermedios</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EF4444]"></span> Fin</span>
                <span className="ml-auto italic">Arrastra para mover • Click en punto para borrar</span>
            </p>
        </div>
    );
};

export default RouteMapSelector;
