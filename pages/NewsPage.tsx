
import React, { useState } from 'react';
import { Calendar, ChevronRight, Send, User, MessageSquare, Phone, X, CheckCircle, Newspaper, Clock } from 'lucide-react';
import { News } from '../types';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabase';

interface Props {
  news: News[];
}

// Helper para parsear fechas de forma segura
const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date(0);
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // Fallback para formato DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date(0);
};

const formatDate = (dateStr: string): string => {
  const d = parseDate(dateStr);
  if (d.getTime() === 0) return dateStr;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
};

const NewsPage: React.FC<Props> = ({ news }) => {
  const [showModal, setShowModal] = useState(false);
  const [sentStatus, setSentStatus] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    subject: 'Noticia / Comunicado',
    message: ''
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message) return alert("Por favor, rellena los campos obligatorios.");

    const { error } = await supabase.from('admin_messages').insert([{
      sender_name: formData.name,
      sender_contact: formData.contact,
      subject: formData.subject,
      message: formData.message,
      timestamp: Date.now(),
      read: false
    }]);

    if (!error) {
      setSentStatus(true);
      setTimeout(() => {
        setSentStatus(false);
        setShowModal(false);
        setFormData({ name: '', contact: '', subject: 'Noticia / Comunicado', message: '' });
      }, 2000);
    } else {
      alert("Hubo un error al enviar el mensaje. Revisa tu conexión.");
    }
  };

  // Filtrar noticias: que ya hayan llegado a su fecha de publicación programada
  const now = new Date();

  const visibleNews = news.filter(item => {
    // Si tiene fecha de publicación programada, verificar que ya haya pasado
    if (item.publish_date) {
      const pDate = new Date(item.publish_date);
      if (pDate > now) return false;
    }

    // Filtrar noticias cuya fecha de actividad ya pasó
    if (item.publishedAt) {
      const eventDate = new Date(item.publishedAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0); // Comparar solo fechas

      // Si la fecha del evento es anterior a hoy, eliminar
      if (eventDate < today) return false;
    }

    return true;
  });

  // Ordenar por proximidad (la más cercana a hoy primero)
  const sortedNews = [...visibleNews].sort((a, b) => {
    const dateA = parseDate(a.publishedAt).getTime();
    const dateB = parseDate(b.publishedAt).getTime();
    return dateA - dateB; // Ascendente: Lo más próximo arriba
  });

  // Paginación: 9 noticias por página (1 destacada + 8 en grid)
  const ITEMS_PER_PAGE = 9;
  const totalPages = Math.ceil(sortedNews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedNews = sortedNews.slice(startIndex, endIndex);

  // inside component
  const location = useLocation();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Effect to handle scroll-to-news from home page
  React.useEffect(() => {
    if (location.state && (location.state as any).scrollToId && sortedNews.length > 0) {
      const targetId = (location.state as any).scrollToId;
      const index = sortedNews.findIndex(n => n.id === targetId);

      if (index !== -1) {
        // Calculate page
        const targetPage = Math.floor(index / ITEMS_PER_PAGE) + 1;
        setCurrentPage(targetPage);
        setHighlightedId(targetId);

        // Wait for render then scroll
        setTimeout(() => {
          const element = document.getElementById(`news-${targetId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Remove highlight after a few seconds
            setTimeout(() => setHighlightedId(null), 3000);
          }
        }, 500); // Small delay to allow page change/render
      }
    }
  }, [location.state, sortedNews.length]); // Depend on sortedNews.length to ensure data is loaded

  const [featuredNews, ...otherNews] = paginatedNews;

  return (
    <div className="bg-luxuryWhite dark:bg-[#0A0A0A] min-h-screen flex flex-col animate-in fade-in duration-700">

      {/* CABECERA MONUMENTAL */}
      <div className="bg-[#300050] px-6 pt-20 pb-10 text-white shadow-[0_20px_50px_rgba(48,0,80,0.4)] relative overflow-hidden shrink-0 z-20">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <Newspaper size={120} className="text-goldCofrade" />
        </div>

        <div className="relative z-10 text-center">
          <p className="text-goldCofrade font-black text-[10px] uppercase tracking-[0.5em] mb-2 opacity-80">Actualidad Cofrade</p>
          <h2 className="text-4xl font-cofrade tracking-tight mb-2">Noticias</h2>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 space-y-8">

        {sortedNews.length > 0 ? (
          <>
            {/* ARTÍCULO DESTACADO */}
            {featuredNews && (
              <article id={`news-${featuredNews.id}`} className={`group ${highlightedId === featuredNews.id ? 'ring-4 ring-[#D4AF37] transition-all' : ''}`}>
                <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={featuredNews.image}
                    alt={featuredNews.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                    <div className="inline-flex items-center gap-2 bg-goldCofrade/90 text-[#300050] px-3 py-1.5 rounded-full mb-4">
                      <span className="text-[9px] font-black uppercase tracking-wider">Más Reciente</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight line-clamp-3">
                      {featuredNews.title}
                    </h2>

                    <p className="text-gray-200 text-sm md:text-base leading-relaxed mb-4 line-clamp-2">
                      {featuredNews.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white/80 text-xs">
                        <Clock size={14} />
                        <span>{formatDate(featuredNews.publishedAt)}</span>
                      </div>
                      {featuredNews.link && (
                        <a
                          href={featuredNews.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white/10 backdrop-blur-md hover:bg-white hover:text-[#300050] text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                        >
                          Leer más <ChevronRight size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* GRID DE NOTICIAS */}
            {otherNews.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherNews.map((item) => (
                  <article
                    id={`news-${item.id}`}
                    key={item.id}
                    className={`bg-white dark:bg-[#1E1E1E] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 group border border-gray-100 dark:border-gray-800 ${highlightedId === item.id ? 'ring-4 ring-[#D4AF37]' : ''}`}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-3">
                        <Calendar size={12} className="text-goldCofrade" />
                        {formatDate(item.publishedAt)}
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight line-clamp-2 group-hover:text-[#4B0082] dark:group-hover:text-goldCofrade transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4 mb-4">
                        {item.content}
                      </p>

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#4B0082] dark:text-goldCofrade font-bold text-xs uppercase tracking-wider hover:gap-3 transition-all"
                        >
                          Leer más <ChevronRight size={14} />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <Newspaper size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400 font-medium">No hay noticias publicadas en este momento.</p>
          </div>
        )}

        {/* PAGINACIÓN */}
        {totalPages > 1 && sortedNews.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:border-goldCofrade transition-all"
            >
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === page
                  ? 'bg-[#300050] text-goldCofrade'
                  : 'bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 hover:border-goldCofrade'
                  }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:border-goldCofrade transition-all"
            >
              Siguiente
            </button>
          </div>
        )}


        {/* CTA PARA ENVIAR COMUNICADO */}
        <div className="mt-12 bg-gradient-to-br from-[#4B0082] to-[#300050] p-8 md:p-12 rounded-3xl text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-goldCofrade rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={28} className="text-[#300050]" />
            </div>
            <h3 className="text-2xl md:text-3xl font-cofrade text-goldCofrade mb-3">¿Tienes alguna noticia?</h3>
            <p className="text-sm md:text-base text-purple-200 mb-6 max-w-lg mx-auto leading-relaxed">
              Si perteneces a una hermandad o formación y quieres publicar información oficial, envíanos tu comunicado.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-goldCofrade text-[#300050] px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              Enviar Comunicado Oficial
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE ENVÍO */}
      {
        showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#1A1A1A] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 relative">
              {sentStatus ? (
                <div className="p-12 text-center animate-in zoom-in">
                  <div className="bg-green-100 dark:bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <CheckCircle size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Recibido!</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Tu comunicado ha sido enviado al equipo de administración.</p>
                </div>
              ) : (
                <form onSubmit={handleSend}>
                  <div className="bg-[#4B0082] p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <MessageSquare size={24} className="text-goldCofrade" />
                      <h3 className="text-xl font-cofrade">Enviar Comunicado</h3>
                    </div>
                    <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tu Nombre o Hermandad *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 p-4 pl-12 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#4B0082] transition-all"
                          placeholder="Ej: Hdad. de la Mulita"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contacto (Email / Telf)</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input
                          type="text"
                          value={formData.contact}
                          onChange={e => setFormData({ ...formData, contact: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 p-4 pl-12 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#4B0082] transition-all"
                          placeholder="email@ejemplo.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contenido del Mensaje *</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#4B0082] transition-all resize-none"
                        placeholder="Escribe aquí los detalles del comunicado..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#4B0082] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <Send size={18} /> Enviar ahora
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )
      }
    </div >
  );
};

export default NewsPage;
