
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Clock, MapPin, Music, History, Info, Map as MapIcon,
    ChevronLeft, ChevronRight, Shield, User, Users, Calendar, Flag, Home as HomeIcon, Navigation, Compass, ArrowLeft,
    Image as ImageIcon, X, ExternalLink, Sparkles, Flower, Shirt
} from 'lucide-react';
import { Paso, Temple, Band, Brotherhood } from '../types';

interface Props {
    pasos: Paso[];
    temples: Temple[];
    bands: Band[];
    brotherhoods: Brotherhood[];
}

const PasoDetailPage: React.FC<Props> = ({ pasos, temples, bands, brotherhoods }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<string>(id || '');
    const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);

    useEffect(() => {
        if (id) setActiveTab(id);
    }, [id]);

    const initialPaso = pasos.find(p => p.id === id);
    if (!initialPaso) return <div className="text-center py-20 font-bold text-purpleCofrade">Cofradía no encontrada</div>;

    const brotherhoodSteps = pasos.filter(p => p.brotherhood === initialPaso.brotherhood);
    const currentPaso = brotherhoodSteps.find(p => p.id === activeTab) || initialPaso;


    const band = bands.find(b => b.id === currentPaso.band_id);

    // Find linked brotherhood to ensure we show the correct day (source of truth)
    const linkedBrotherhood = brotherhoods?.find(b =>
        b.id === currentPaso.brotherhood_id ||
        b.name === currentPaso.brotherhood
    );

    const displayDay = linkedBrotherhood ? linkedBrotherhood.day : currentPaso.day;

    const crest = (currentPaso.technical_data as any)?.brotherhoodCrest || (currentPaso as any).brotherhoodCrest || linkedBrotherhood?.crest;

    const foundationYear = currentPaso.foundationYear || linkedBrotherhood?.foundation_year;

    const foreman = currentPaso.technical_data?.foreman;
    const costaleros = currentPaso.technical_data?.costaleros;
    const author = currentPaso.technical_data?.author;

    const allImages = [currentPaso.mainImage, ...(currentPaso.gallery || [])];

    const handleBack = () => {
        // Navigate back if history exists, otherwise fallback to home
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/calendar');
        }
    };





    return (
        <div className="bg-luxuryWhite dark:bg-[#0A0A0A] min-h-screen pb-24 transition-colors duration-500">

            {selectedGalleryImage && (
                <div
                    className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedGalleryImage(null)}
                >
                    <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-all scale-125">
                        <X size={32} />
                    </button>
                    <img
                        src={selectedGalleryImage}
                        className="max-w-full max-h-screen object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] animate-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                        alt="Vista ampliada"
                    />
                </div>
            )}

            {/* HEADER MÓVIL (Botón de retroceso reforzado) */}
            <div className="fixed top-0 left-0 right-0 h-20 z-[100] flex items-center px-4 md:hidden pointer-events-none">
                <button
                    onClick={handleBack}
                    className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all pointer-events-auto shadow-2xl border border-white/10 active:scale-90"
                >
                    <ChevronLeft size={24} />
                </button>
            </div>

            <div className="animate-in fade-in duration-700">
                <div className="relative w-full overflow-hidden flex flex-col items-center pt-20 pb-2 min-h-[35vh]">
                    <div className="absolute inset-0 bg-black/50 z-10" />
                    <img
                        key={currentPaso.mainImage}
                        src={currentPaso.mainImage}
                        alt={currentPaso.name}
                        className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-1000 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-luxuryWhite dark:from-[#0A0A0A] via-transparent to-transparent z-20" />

                    <div className="relative z-30 flex flex-col items-center justify-center p-6 sm:p-12 w-full text-center">
                        <div className="flex flex-col items-center gap-4 sm:gap-6 max-w-2xl w-full">
                            <span className="gold-gradient text-[#300050] px-6 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase shadow-xl tracking-[0.2em] animate-in slide-in-from-top-2 duration-500">
                                {displayDay}
                            </span>

                            <Link to={`/brotherhood/${encodeURIComponent(currentPaso.brotherhood)}`} className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-[#1A1A1A] rounded-[24px] sm:rounded-[32px] shadow-2xl p-1 flex items-center justify-center shrink-0 border-2 border-[#D4AF37] hover:scale-110 transition-transform duration-500 animate-in zoom-in">
                                {crest ? (
                                    <img src={crest} className="w-full h-full object-contain" alt="Escudo" />
                                ) : (
                                    <Shield size={36} className="text-goldCofrade" />
                                )}
                            </Link>

                            <div className="space-y-1">
                                <Link to={`/brotherhood/${encodeURIComponent(currentPaso.brotherhood)}`} className="block px-2">
                                    <h1 className="text-base sm:text-xl md:text-2xl font-cofrade text-white leading-snug drop-shadow-xl font-bold hover:opacity-80 transition-opacity">
                                        {currentPaso.brotherhood}
                                    </h1>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-6 relative z-30 mt-0">

                    <div className="mb-8 animate-in slide-in-from-bottom-4 delay-100">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <ImageIcon size={16} className="text-goldCofrade" />
                                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Galería de Imágenes</span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400">{allImages.length} fotos</span>
                        </div>

                        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">
                            {allImages.map((img, idx) => (
                                <div
                                    key={`${currentPaso.id}-gallery-${idx}`}
                                    onClick={() => setSelectedGalleryImage(img)}
                                    className="min-w-[140px] h-24 md:min-w-[200px] md:h-32 rounded-[24px] overflow-hidden bg-gray-100 dark:bg-white/5 border border-goldCofrade/10 cursor-zoom-in snap-start shadow-md hover:shadow-xl transition-all active:scale-95 shrink-0"
                                >
                                    <img
                                        src={img}
                                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                                        alt={`Galería ${idx + 1}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {brotherhoodSteps.length > 1 && (
                        <div className="sticky top-14 z-50 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl py-4 -mx-6 px-6 mb-8 border-b border-goldCofrade/10 transition-all">
                            <div className="flex gap-4 overflow-x-auto no-scrollbar">
                                {brotherhoodSteps.map(step => (
                                    <button
                                        key={step.id}
                                        onClick={() => setActiveTab(step.id)}
                                        className={`flex-shrink-0 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border-2 ${activeTab === step.id
                                            ? 'gold-gradient text-[#300050] border-transparent shadow-xl scale-105'
                                            : 'bg-white dark:bg-[#1A1A1A] text-gray-400 border-gray-100 dark:border-gray-800 hover:border-goldCofrade/30'
                                            }`}
                                    >
                                        {step.name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-start mb-10">
                        <div className="min-w-0 flex-grow pr-4">
                            <p className="text-[10px] font-black text-goldCofrade uppercase tracking-[0.4em] mb-2">Titular Sagrado</p>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight font-cofrade break-words">{currentPaso.name}</h2>
                            {author && <p className="text-xs text-gray-400 mt-1 italic">Obra de {author}</p>}
                        </div>

                    </div>

                    <div className="mb-12">
                        <Link
                            to={`/brotherhood/${encodeURIComponent(currentPaso.brotherhood)}`}
                            className="bg-[#4B0082] p-6 rounded-[32px] text-white flex items-center justify-between shadow-2xl group border border-white/5 relative overflow-hidden active:scale-95 transition-all"
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="gold-gradient p-3 rounded-2xl shadow-xl text-purpleCofrade group-hover:rotate-12 transition-transform">
                                    <MapIcon size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] font-black uppercase text-purple-200 tracking-[0.3em] mb-0.5">Recorrido y Horarios</p>
                                    <p className="text-lg font-bold">Ver Itinerario Completo</p>
                                </div>
                            </div>
                            <ChevronRight size={24} className="text-goldCofrade group-hover:translate-x-2 transition-transform relative z-10" />
                        </Link>
                    </div>

                    <section className="mb-12">
                        <div className="flex items-center gap-4 mb-6 px-1">
                            <div className="h-px bg-goldCofrade/30 flex-grow"></div>
                            <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-[0.3em]">La Hermandad</h3>
                            <div className="h-px bg-goldCofrade/30 flex-grow"></div>
                        </div>
                        <div className="luxury-card rounded-[48px] p-10 space-y-8">


                            {foreman && (
                                <div className="flex flex-col gap-3 border-b border-gray-100 dark:border-gray-800 pb-6">
                                    <div className="flex items-center gap-3">
                                        <Users size={20} className="text-goldCofrade" />
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Capataces</span>
                                    </div>
                                    <p className="text-base font-bold text-gray-900 dark:text-white pl-8 leading-relaxed">
                                        {foreman}
                                    </p>
                                </div>
                            )}

                            {costaleros && (
                                <div className="flex flex-col gap-3 border-b border-gray-100 dark:border-gray-800 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-50 dark:bg-purple-900/20 p-1.5 rounded-lg"><Users size={16} className="text-[#4B0082] dark:text-[#D4AF37]" /></div>
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Cuadrilla</span>
                                    </div>
                                    <p className="text-base font-bold text-gray-900 dark:text-white pl-8">
                                        {costaleros} Costaleros
                                    </p>
                                </div>
                            )}

                            {band && (
                                <div className="flex flex-col gap-3 border-b border-gray-100 dark:border-gray-800 pb-6">
                                    <div className="flex items-center gap-3">
                                        <Music size={20} className="text-goldCofrade" />
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Acompañamiento Musical</span>
                                    </div>
                                    <div className="pl-8 flex items-center gap-4">
                                        {band.image && (
                                            <img src={band.image} className="w-12 h-12 rounded-full object-cover border-2 border-goldCofrade/20 shadow-sm" alt={band.name} />
                                        )}
                                        <div>
                                            <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{band.name}</p>
                                            {band.image && <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">Ver ficha de la banda</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(foundationYear || author) && (
                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-6">
                                    <div className="flex items-center gap-5">
                                        <Calendar size={22} className="text-goldCofrade" />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Año y Autor</span>
                                    </div>
                                    <div className="text-right">
                                        {foundationYear && <p className="text-sm font-bold dark:text-gray-200">{foundationYear}</p>}
                                        {author && <p className="text-xs text-gray-500 dark:text-gray-400">{author}</p>}
                                    </div>
                                </div>
                            )}

                            {currentPaso.floral_arrangement && (
                                <div className="pt-2">
                                    <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-800/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Flower size={16} className="text-green-600 dark:text-green-400" />
                                            <p className="text-[10px] uppercase font-black text-gray-500">Exorno Floral</p>
                                        </div>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{currentPaso.floral_arrangement}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-4 mb-6 px-1">
                            <div className="h-px bg-goldCofrade/30 flex-grow"></div>
                            <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-[0.3em]">Reseña Histórica</h3>
                            <div className="h-px bg-goldCofrade/30 flex-grow"></div>
                        </div>
                        <div className="luxury-card rounded-[56px] p-12">
                            <p className="text-xl text-gray-700 dark:text-gray-300 leading-10 text-justify font-cofrade first-letter:text-5xl first-letter:font-bold first-letter:text-goldCofrade first-letter:mr-2 first-letter:float-left">
                                {currentPaso.history}
                            </p>
                        </div>
                    </section>


                </div>
            </div>
        </div>
    );
};

export default PasoDetailPage;
