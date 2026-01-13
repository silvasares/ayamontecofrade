
import React, { useState } from 'react';
import { Church, Music, MapPin, Info } from 'lucide-react';
import { TEMPLES, BANDS } from '../mockData';

const AssetsPage: React.FC = () => {
  const [tab, setTab] = useState<'temples' | 'bands'>('temples');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex bg-gray-200 p-1 rounded-xl mb-8">
        <button 
          onClick={() => setTab('temples')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${tab === 'temples' ? 'bg-white shadow text-[#4B0082]' : 'text-gray-500'}`}
        >
          <Church size={18} /> Templos
        </button>
        <button 
          onClick={() => setTab('bands')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${tab === 'bands' ? 'bg-white shadow text-[#4B0082]' : 'text-gray-500'}`}
        >
          <Music size={18} /> Bandas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tab === 'temples' ? (
          TEMPLES.map(t => (
            <div key={t.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
              <div className="h-48 relative">
                <img src={t.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <h3 className="absolute bottom-4 left-4 text-white font-bold text-xl">{t.name}</h3>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <MapPin size={14} className="text-[#D4AF37]" /> {t.address}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{t.description}</p>
                <div className="pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] font-bold text-[#4B0082] uppercase">
                  <Info size={12} /> Punto neurálgico cofrade
                </div>
              </div>
            </div>
          ))
        ) : (
          BANDS.map(b => (
            <div key={b.id} className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-gray-100 items-center">
              <img src={b.image} className="w-20 h-20 rounded-xl object-cover" />
              <div>
                <h3 className="font-bold text-gray-900">{b.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{b.description}</p>
                <span className="inline-block mt-2 text-[10px] bg-purple-100 text-[#4B0082] px-2 py-1 rounded-full font-bold uppercase">Formación oficial</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssetsPage;
