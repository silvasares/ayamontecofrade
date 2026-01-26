
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, History, MapPin, ExternalLink, Info } from 'lucide-react';
import { askCofradeAssistant } from '../services/geminiService';
import { useLocation } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: { uri: string; title: string }[];
}

import { Brotherhood, Paso, DaySchedule } from '../types';

interface Props {
  brotherhoods?: Brotherhood[];
  pasos?: Paso[];
  days?: DaySchedule[];
}

const AIAssistant: React.FC<Props> = ({ brotherhoods = [], pasos = [], days = [] }) => {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Paz y Bien! Soy tu guía de la Semana Santa de Ayamonte. Puedo contarte desde la historia de las imágenes del siglo XVI hasta los cambios de itinerario de este año. ¿Qué inquietud cofrade tienes?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Manejo de la consulta inicial desde Home
  useEffect(() => {
    if (!initialized.current && location.state?.initialQuery) {
      initialized.current = true;
      handleSubmit(undefined, location.state.initialQuery);
      // Limpiamos el state para evitar reenvíos al refrescar
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const generateContext = () => {
    try {
      let context = "DATOS ACTUALIZADOS DE LA SEMANA SANTA DE AYAMONTE:\n\n";

      // Add days schedule
      if (days.length > 0) {
        context += "ORDEN DE DÍAS:\n";
        days.forEach(d => context += `- ${d.name} (Orden: ${d.order_index}) ${d.date ? '[' + d.date + ']' : ''}\n`);
        context += "\n";
      }

      // Add brotherhoods info
      if (brotherhoods.length > 0) {
        context += "HERMANDADES Y HORARIOS:\n";
        brotherhoods.forEach(b => {
          context += `\n### ${b.name} (${b.day})\n`;
          context += `- Horario: Salida ${b.startTime || '?'} - Recogida ${b.arrivalTime || '?'}\n`;
          context += `- Templo: ${b.temple_id || 'No especificado'}\n`;
          if (b.history) context += `- Historia breve: ${b.history.substring(0, 100)}...\n`;

          // Find pasos associated
          const brotherPasos = pasos.filter(p => p.brotherhood_id === b.id || p.brotherhood === b.name);
          if (brotherPasos.length > 0) {
            context += `- Pasos:\n`;
            brotherPasos.forEach(p => {
              context += `  * ${p.name}: Capataz ${p.technical_data?.foreman || 'N/A'}, Costaleros ${p.technical_data?.costaleros || 'N/A'}.\n`;
            });
          }
        });
      }
      return context;
    } catch (e) {
      console.error("Error building context", e);
      return "";
    }
  };

  const handleSubmit = async (e?: React.FormEvent, presetQuery?: string) => {
    if (e) e.preventDefault();
    const query = presetQuery || input;
    if (!query.trim() || loading) return;

    const userMsg = query.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const context = generateContext();
    const result = await askCofradeAssistant(userMsg, context);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: result.text,
      sources: result.sources
    }]);
    setLoading(false);
  };

  const suggestions = [
    { text: "Historia de Padre Jesús Nazareno", icon: <History size={16} /> },
    { text: "¿Por qué se llaman cargadores?", icon: <User size={16} /> },
    { text: "La leyenda de la Virgen de las Angustias", icon: <Sparkles size={16} /> },
    { text: "Itinerario oficial por el Paseo de la Ribera", icon: <MapPin size={16} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[75vh] border border-purple-100 dark:border-gray-800 transition-colors duration-300">
        {/* Header */}
        <div className="bg-[#4B0082] p-6 text-white flex items-center justify-between shadow-lg relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-[#D4AF37] p-3 rounded-2xl shadow-xl animate-pulse">
              <Bot size={28} className="text-[#4B0082]" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cofrade tracking-tight">Voz de Ayamonte</h2>
              <p className="text-[10px] text-purple-200 uppercase font-black tracking-widest">Experto en Historia y Tradición</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            Archivo en línea
          </div>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-6 scroll-smooth bg-gray-50/30 dark:bg-black/20 no-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] rounded-[32px] p-5 shadow-sm ${msg.role === 'user'
                  ? 'bg-[#4B0082] text-white rounded-tr-none'
                  : 'bg-white dark:bg-[#262626] text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-800 rounded-tl-none'
                }`}>
                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>

                {/* Sources Display for Assistant */}
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Info size={10} /> Fuentes consultadas:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-black rounded-md text-[9px] font-bold text-[#4B0082] dark:text-[#D4AF37] hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all border border-gray-100 dark:border-gray-800"
                        >
                          <ExternalLink size={8} /> {source.title.slice(0, 25)}...
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-in fade-in">
              <div className="bg-white dark:bg-[#262626] border border-gray-100 dark:border-gray-800 rounded-[32px] rounded-tl-none p-5 shadow-sm flex gap-2">
                <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length < 3 && (
          <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1A1A1A]">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmit(undefined, s.text)}
                className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/10 text-[#4B0082] dark:text-[#D4AF37] text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[#4B0082] hover:text-white transition-all border border-purple-100 dark:border-purple-900/20 active:scale-95 shadow-sm"
              >
                {s.icon} {s.text}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-[#1A1A1A] border-t border-gray-100 dark:border-gray-800 flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre procesiones, historia..."
            className="flex-grow bg-gray-100 dark:bg-black border-none rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] dark:text-white transition-all placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-[#4B0082] text-white p-4 rounded-2xl hover:bg-[#3a0066] disabled:opacity-50 transition-all shadow-xl active:scale-90"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
      <div className="flex justify-center items-center gap-2 mt-4 text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] font-black">
        <Sparkles size={12} className="text-[#D4AF37]" /> Inteligencia Artificial de Ayamonte <Sparkles size={12} className="text-[#D4AF37]" />
      </div>
    </div>
  );
};

export default AIAssistant;
