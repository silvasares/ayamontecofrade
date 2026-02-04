import React, { useState } from 'react';
import { Church, Image as ImageIcon, MapPin, X, Landmark } from 'lucide-react';
import { Temple } from '../types';

interface Props {
    temples: Temple[];
    posters: any[];
}

const PatrimonyPage: React.FC<Props> = ({ temples, posters }) => {
    const [activeTab, setActiveTab] = useState<'temples' | 'posters'>('temples');
    const [selectedPoster, setSelectedPoster] = useState<string | null>(null);

    return (
        <div className="bg-luxuryWhite dark:bg-[#0A0A0A] min-h-screen flex flex-col animate-in fade-in duration-700">

            {/* CABECERA MONUMENTAL */}
            <div className="bg-[#300050] px-6 pt-20 pb-10 text-white shadow-[0_20px_50px_rgba(48,0,80,0.4)] relative overflow-hidden shrink-0 z-20">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Landmark size={120} className="text-goldCofrade" />
                </div>

                <div className="relative z-10 text-center">
                    <p className="text-goldCofrade font-black text-[10px] uppercase tracking-[0.5em] mb-2 opacity-80">Riqueza Cultural</p>
                    <h2 className="text-4xl font-cofrade tracking-tight mb-2">Patrimonio</h2>
                </div>
            </div>

            {/* Sticky Tabs */}
            <div className="sticky top-16 md:top-0 z-40 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-goldCofrade/10 py-3 flex justify-center shadow-sm transition-all">
                <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-full flex gap-1 border border-gray-200 dark:border-white/10">
                    <button
                        onClick={() => setActiveTab('temples')}
                        className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'temples'
                            ? 'bg-[#300050] text-goldCofrade shadow-md scale-105'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <Church size={14} /> Templos
                    </button>
                    <button
                        onClick={() => setActiveTab('posters')}
                        className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'posters'
                            ? 'bg-[#300050] text-goldCofrade shadow-md scale-105'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <ImageIcon size={14} /> Cartelería
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 w-full">

                {activeTab === 'temples' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {temples.map((temple) => (
                            <div key={temple.id} className="bg-white dark:bg-[#1A1A1A] rounded-[32px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-gray-100 dark:border-gray-800">
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={temple.image}
                                        alt={temple.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                                        <h3 className="text-white font-cofrade text-2xl drop-shadow-md">{temple.name}</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div
                                        className="flex items-start gap-3 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl mb-4 cursor-pointer active:scale-95 transition-all border border-transparent hover:border-goldCofrade/20"
                                        onClick={() => {
                                            const encodedDest = encodeURIComponent(temple.address);
                                            const isAndroid = /Android/i.test(navigator.userAgent);
                                            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

                                            if (isAndroid) {
                                                window.location.href = `geo:0,0?q=${encodedDest}`;
                                            } else if (isIOS) {
                                                window.location.href = `maps://maps.apple.com/?daddr=${encodedDest}&dirflg=w`;
                                            } else {
                                                window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}&travelmode=walking`;
                                            }
                                        }}
                                    >
                                        <MapPin className="text-goldCofrade shrink-0 mt-1" size={18} />
                                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">{temple.address}</p>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed text-justify px-1">{temple.description}</p>
                                    {temple.history && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[10px] font-black text-goldCofrade uppercase tracking-widest mb-2 px-1">Historia y Detalles</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed text-justify px-1 whitespace-pre-line">{temple.history}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {posters.map((poster) => (
                            <div
                                key={poster.id}
                                onClick={() => setSelectedPoster(poster.image)}
                                className="bg-white dark:bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-zoom-in group border border-gray-100 dark:border-gray-800"
                            >
                                <div className="aspect-[2/3] overflow-hidden bg-gray-100 dark:bg-white/5">
                                    <img
                                        src={poster.image}
                                        alt={`Cartel ${poster.year}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>
                                <div className="p-4 text-center">
                                    <h3 className="font-cofrade text-2xl text-[#300050] dark:text-goldCofrade mb-1">{poster.year}</h3>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate">{poster.author}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox for Poster */}
            {selectedPoster && (
                <div
                    className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedPoster(null)}
                >
                    <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-all scale-125">
                        <X size={32} />
                    </button>
                    <img
                        src={selectedPoster}
                        className="max-h-[90vh] max-w-full rounded-lg shadow-2xl animate-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                        alt="Cartel ampliado"
                    />
                </div>
            )}
        </div>
    );
};

export default PatrimonyPage;
