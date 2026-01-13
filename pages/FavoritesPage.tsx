
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ChevronRight, Clock } from 'lucide-react';
import { Paso } from '../types';

interface Props {
  pasos: Paso[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

const FavoritesPage: React.FC<Props> = ({ pasos, favorites, toggleFavorite }) => {
  const favoritePasos = pasos.filter(p => favorites.includes(p.id));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Heart size={32} className="text-red-500 fill-red-500" />
        <h1 className="text-3xl font-cofrade text-[#4B0082] dark:text-[#D4AF37]">Favoritos</h1>
      </div>

      {favoritePasos.length > 0 ? (
        <div className="space-y-4">
          {favoritePasos.map((paso) => (
            <div key={paso.id} className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex items-center p-3 animate-in fade-in slide-in-from-bottom-2">
              <img src={paso.mainImage} className="w-20 h-20 rounded-xl object-cover shrink-0" alt={paso.name} />
              <div className="ml-4 flex-grow">
                <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{paso.name}</h3>
                <p className="text-xs text-[#4B0082] dark:text-[#D4AF37] font-medium mt-1">{paso.day}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-tighter">
                  <Clock size={12} /> {paso.startTime} - {paso.arrivalTime}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <button 
                  onClick={() => toggleFavorite(paso.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <Heart size={20} fill="currentColor" />
                </button>
                <Link to={`/paso/${paso.id}`} className="text-gray-300">
                  <ChevronRight size={24} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-[#1E1E1E] rounded-[40px] border border-dashed border-gray-200 dark:border-gray-800">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart size={48} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium px-8">Aún no has marcado ningún paso como favorito.</p>
          <Link to="/calendar" className="inline-block mt-6 text-[#4B0082] dark:text-[#D4AF37] font-bold border-b-2 border-[#D4AF37] pb-1">
            Explorar Calendario
          </Link>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
