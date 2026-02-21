
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar, Newspaper, Settings, Home, Bot, ChevronLeft, Sun, Moon,
  ArrowUp, Bell, X, Volume2, VolumeX, CheckCircle as CheckIcon, AlertTriangle,
  Shield, Map, LogIn, MapPin, Navigation, Lock, Landmark, Power
} from 'lucide-react';
import PublicHome from './pages/PublicHome';
import CalendarPage from './pages/CalendarPage';
import PasoDetailPage from './pages/PasoDetailPage';
import BrotherhoodPage from './pages/BrotherhoodPage';
import NewsPage from './pages/NewsPage';
import AdminDashboard from './pages/AdminDashboard';
import PatrimonyPage from './pages/PatrimonyPage';
import MapPage from './pages/MapPage';
import AIAssistant from './pages/AIAssistant';
import { supabase } from './supabase';
import { Paso, News, Alert, Brotherhood, Day, Temple, Band } from './types';

const ALARM_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const safeStorage = {
  getItem: (key: string, defaultValue: string): string => {
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch (e) {
      console.warn('Storage blocked', e);
      return defaultValue;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Storage blocked', e);
    }
  }
};

const getSpainTime = (): Date => {
  const now = new Date();
  const spainTimeStr = now.toLocaleString("sv-SE", { timeZone: "Europe/Madrid" }).replace(' ', 'T');
  return new Date(spainTimeStr);
};

const InAppAlertModal = ({ alerts, onRead, soundEnabled }: { alerts: Alert[], onRead: (id: string) => void, soundEnabled: boolean }) => {
  const [visibleAlert, setVisibleAlert] = useState<Alert | null>(null);

  useEffect(() => {
    const readIds = JSON.parse(safeStorage.getItem('ac_read_alerts', '[]'));
    const unread = alerts.filter(a => !readIds.includes(a.id));
    if (unread.length > 0) {
      setVisibleAlert(unread[0]);
      if (soundEnabled) {
        const audio = new Audio(ALARM_SOUND_URL);
        audio.play().catch(() => { });
      }
    } else {
      setVisibleAlert(null);
    }
  }, [alerts, soundEnabled]);

  if (!visibleAlert) return null;

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-[#300050]/90 backdrop-blur-xl animate-in fade-in">
      <div className="bg-white dark:bg-[#141414] w-full max-w-sm rounded-[48px] shadow-2xl border-t-8 border-goldCofrade overflow-hidden animate-in zoom-in">
        <div className="bg-[#4B0082] p-10 text-center text-white">
          <div className="bg-goldCofrade w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-[#300050]"><Bell size={32} /></div>
          <h3 className="font-cofrade text-2xl uppercase">{visibleAlert.title}</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-900 dark:text-gray-100 text-lg mb-8 font-serif italic">"{visibleAlert.body}"</p>
          <button onClick={() => onRead(visibleAlert.id)} className="w-full gold-gradient text-[#300050] py-5 rounded-2xl font-black uppercase text-xs">Cerrar Aviso</button>
        </div>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-xs rounded-2xl shadow-2xl scale-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        </div>
        <div className="flex border-t border-gray-200 dark:border-white/10">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-base font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors active:bg-gray-100 dark:active:bg-white/10"
          >
            Cancelar
          </button>
          <div className="w-px bg-gray-200 dark:bg-white/10"></div>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 text-base font-bold text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors active:bg-red-100 dark:active:bg-red-500/20"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
};

const MobileHeader = ({ soundEnabled, setSoundEnabled, headerTitle }: any) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = ['/', '/calendar', '/news', '/patrimony'].includes(location.pathname);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/map')) return null;

  const performExit = () => {
    setShowExitConfirm(false);

    // Estrategia multi-nivel para cerrar la app

    // 1. Intentar cerrar con window.close() (funciona en algunos casos)
    try {
      window.close();
    } catch (e) {
      console.log('window.close() bloqueado');
    }

    // 2. Para apps WebView de Android (Kodular, etc)
    try {
      if ((window as any).Android && (window as any).Android.closeApp) {
        (window as any).Android.closeApp();
        return;
      }
    } catch (e) {
      console.log('Android.closeApp() no disponible');
    }

    // 3. Para Cordova/PhoneGap
    try {
      if ((navigator as any).app && (navigator as any).app.exitApp) {
        (navigator as any).app.exitApp();
        return;
      }
    } catch (e) {
      console.log('navigator.app.exitApp() no disponible');
    }

    // 4. Para aplicaciones instaladas vía Chrome/Edge
    try {
      if ((window as any).chrome && (window as any).chrome.runtime) {
        (window as any).chrome.runtime.reload();
      }
    } catch (e) {
      console.log('chrome.runtime no disponible');
    }

    // 5. Redirigir a una página de "cerrada" si todo falla
    setTimeout(() => {
      // Crear una página HTML mínima de despedida
      document.body.innerHTML = `
        <div style="
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #300050 0%, #4B0082 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
          text-align: center;
          padding: 20px;
        ">
          <div style="
            background: white;
            color: #300050;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            margin-bottom: 30px;
            box-shadow: 0 10px 40px rgba(212, 175, 55, 0.3);
          ">
            ✓
          </div>
          <h1 style="
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 15px 0;
            color: #D4AF37;
          ">
            Aplicación Cerrada
          </h1>
          <p style="
            font-size: 16px;
            opacity: 0.9;
            margin: 0 0 30px 0;
            max-width: 300px;
            line-height: 1.6;
          ">
            Puedes cerrar esta pestaña o ventana manualmente
          </p>
          <div style="
            font-size: 12px;
            opacity: 0.6;
            text-transform: uppercase;
            letter-spacing: 2px;
          ">
            Ayamonte Cofrade
          </div>
        </div>
      `;

      // Intentar cerrar una última vez después de mostrar el mensaje
      setTimeout(() => {
        try {
          window.close();
        } catch (e) {
          // Si no puede cerrar, la página de despedida ya está visible
        }
      }, 500);
    }, 300);
  };

  return (
    <>
      <ConfirmationModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={performExit}
        title="¿Salir de la App?"
        message="¿Estás seguro de que deseas cerrar la aplicación?"
      />
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#300050]/95 backdrop-blur-xl text-white flex items-center px-4 z-[200] border-b border-goldCofrade/20 shadow-lg justify-between">
        <div className="w-10 flex justify-start">
          {!isRoot && (
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ChevronLeft size={22} className="text-goldCofrade" />
            </button>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center overflow-hidden px-2">
          <h1 className="font-cofrade text-xs sm:text-sm font-bold tracking-wider text-white uppercase text-center leading-tight">
            {headerTitle}
          </h1>
        </div>

        <div className="w-10 flex justify-end items-center">
          <button onClick={() => setShowExitConfirm(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-90 hover:opacity-100" title="Salir de la App">
            <Power size={18} className="text-red-400" />
          </button>
        </div>
      </header>
    </>
  );
};

const DesktopSidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const getLinkStyle = (path: string) => `
      flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold text-sm
      ${isActive(path)
      ? 'bg-white text-[#4B0082] shadow-xl scale-105 ring-1 ring-[#D4AF37]/20'
      : 'text-gray-300 hover:bg-white/10 hover:text-white'}
      `;

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-72 bg-[#300050] flex-col shadow-[10px_0_40px_rgba(0,0,0,0.3)] border-r border-[#D4AF37]/20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#4B0082]/80 to-[#300050] pointer-events-none"></div>

      <div className="relative z-10 p-10 pb-12">
        <h1 className="font-cofrade text-4xl text-[#D4AF37] leading-none drop-shadow-md">
          Ayamonte<br />
          <span className="text-white text-xl tracking-[0.3em] font-sans font-light uppercase opacity-90">Cofrade</span>
        </h1>
      </div>

      <nav className="relative z-10 flex-1 px-6 space-y-3 overflow-y-auto no-scrollbar">
        <Link to="/" className={getLinkStyle('/')}><Home size={20} /> Inicio</Link>
        <Link to="/calendar" className={getLinkStyle('/calendar')}><Calendar size={20} /> Agenda</Link>
        <Link to="/news" className={getLinkStyle('/news')}><Newspaper size={20} /> Noticias</Link>
        <div className="h-px bg-white/10 my-4 mx-2"></div>
        <Link to="/patrimony" className={getLinkStyle('/patrimony')}><Landmark size={20} /> Patrimonio</Link>
      </nav>

      <div className="relative z-10 p-8 text-center border-t border-white/5 space-y-4">
        <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black">Semana Santa 2025</p>
        <Link to="/admin" className="flex items-center justify-center gap-2 text-white/20 hover:text-white/60 transition-colors text-[10px] uppercase font-bold tracking-widest p-2 rounded-lg hover:bg-white/5">
          <Lock size={10} /> Acceso Interno
        </Link>
      </div>
    </aside>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');


  const [soundEnabled, setSoundEnabled] = useState(() => safeStorage.getItem('ac_sound', 'true') !== 'false');
  const [pasos, setPasos] = useState<Paso[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [activeInAppAlerts, setActiveInAppAlerts] = useState<Alert[]>([]);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [brotherhoods, setBrotherhoods] = useState<Brotherhood[]>([]);
  const [days, setDays] = useState<any[]>([]);
  const [posters, setPosters] = useState<any[]>([]);
  const [headerTitle, setHeaderTitle] = useState("AYAMONTE COFRADE 2026");

  const fetchData = async () => {
    try {
      const nowISO = new Date().toISOString();
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: alertItems } = await supabase
        .from('alerts')
        .select('*')
        .lte('scheduled_at', nowISO)
        .gte('scheduled_at', twentyFourHoursAgo)
        .order('scheduled_at', { ascending: false });

      if (alertItems) {
        const readIds = JSON.parse(safeStorage.getItem('ac_read_alerts', '[]'));
        setActiveInAppAlerts(alertItems.filter(a => !readIds.includes(a.id)));
      }

      // 1. Fetch Brotherhoods first to use as reference data
      const { data: brotherhoodItems } = await supabase.from('hermandades').select('*').order('order_index', { ascending: true });

      let processedBrotherhoods: Brotherhood[] = [];
      if (brotherhoodItems) {
        processedBrotherhoods = brotherhoodItems.map(b => ({
          ...b,
          startTime: typeof b.start_time === 'string' ? b.start_time.substring(0, 5) : b.start_time,
          arrivalTime: typeof b.arrival_time === 'string' ? b.arrival_time.substring(0, 5) : b.arrival_time
        }));
        setBrotherhoods(processedBrotherhoods);
      }

      // 2. Fetch Steps and Enrich with Brotherhood data
      const { data: steps } = await supabase.from('pasos').select('*').order('order_index', { ascending: true });
      if (steps) {
        setPasos(steps.map(s => {
          const b = processedBrotherhoods.find(br => br.id === s.brotherhood_id);
          // Only fallback if the specific paso time is missing
          const fallbackStart = b?.startTime || b?.start_time?.substring(0, 5);
          const fallbackEnd = b?.arrivalTime || b?.arrival_time?.substring(0, 5);

          return {
            ...s,
            mainImage: s.main_image,
            foundationYear: s.foundation_year,
            // Use specific time, or fallback to brotherhood time
            startTime: s.start_time?.substring(0, 5) || fallbackStart,
            arrivalTime: s.arrival_time?.substring(0, 5) || fallbackEnd
          };
        }));
      }

      const { data: newsItems } = await supabase.from('news').select('*').order('published_at', { ascending: true });
      if (newsItems) setNews(newsItems.map(n => ({ ...n, publishedAt: n.published_at })));

      const { data: templeItems } = await supabase.from('temples').select('*');
      if (templeItems) setTemples(templeItems);

      const { data: bandItems } = await supabase.from('bands').select('*');
      if (bandItems) setBands(bandItems);

      // (Brotherhoods already fetched)

      const { data: dayItems } = await supabase.from('days').select('*').order('order_index');
      if (dayItems) setDays(dayItems);

      const { data: posterItems } = await supabase.from('posters').select('*').order('year', { ascending: false });
      if (posterItems) setPosters(posterItems);

      const { data: settingsData } = await supabase.from('app_settings').select('value').eq('key', 'header_title').single();
      if (settingsData) setHeaderTitle(settingsData.value);

    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);

    // Incrementar contador de visitas
    const incrementVisits = async () => {
      // No contar si estamos en el panel de admin
      if (window.location.hash.includes('/admin')) return;

      // Evitar contar varias veces en la misma sesión/pestaña
      if (sessionStorage.getItem('ac_visit_counted')) return;

      try {
        const { error } = await supabase.rpc('increment_visit_count');
        if (!error) sessionStorage.setItem('ac_visit_counted', 'true');
      } catch (e) {
        console.warn('Error incrementing visits:', e);
      }
    };
    incrementVisits();

    // Forzar modo oscuro siempre
    document.documentElement.classList.add('dark');

    safeStorage.setItem('ac_sound', soundEnabled.toString());
    return () => clearInterval(interval);
  }, [soundEnabled]);

  return (
    <div className="min-h-screen bg-luxuryWhite dark:bg-[#0A0A0A] flex flex-col transition-all duration-500">
      <InAppAlertModal alerts={activeInAppAlerts} onRead={(id) => { const read = JSON.parse(safeStorage.getItem('ac_read_alerts', '[]')); safeStorage.setItem('ac_read_alerts', JSON.stringify([...read, id])); setActiveInAppAlerts(prev => prev.filter(a => a.id !== id)); }} soundEnabled={soundEnabled} />

      {!isAdmin && <DesktopSidebar />}
      <MobileHeader soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} headerTitle={headerTitle} />

      <main className={`flex-grow ${isAdmin ? '' : 'lg:ml-72 pb-32 pt-0 lg:pt-0'}`}>
        <Routes>
          <Route path="/" element={<PublicHome pasos={pasos} news={news} defaultCover="" departureStatus="" brotherhoods={brotherhoods} days={days} />} />
          <Route path="/calendar" element={<CalendarPage pasos={pasos} days={days} brotherhoods={brotherhoods} />} />
          <Route path="/paso/:id" element={<PasoDetailPage pasos={pasos} temples={temples} bands={bands} brotherhoods={brotherhoods} />} />
          <Route path="/brotherhood/:name" element={<BrotherhoodPage pasos={pasos} temples={temples} bands={bands} brotherhoods={brotherhoods} />} />
          <Route path="/news" element={<NewsPage news={news} />} />
          <Route path="/patrimony" element={<PatrimonyPage temples={temples} posters={posters} />} />
          <Route path="/map/:id" element={<MapPage pasos={pasos} brotherhoods={brotherhoods} />} />
          <Route path="/assistant" element={<AIAssistant brotherhoods={brotherhoods} pasos={pasos} days={days} />} />
          <Route path="/admin/*" element={<AdminDashboard updatePasos={fetchData} updateNews={fetchData} temples={temples} updateTemples={fetchData} updateBands={fetchData} updateDays={fetchData} days={days} />} />
        </Routes>
      </main>

      {!isAdmin && (
        <nav className="fixed bottom-6 left-4 right-4 bg-[#300050]/95 backdrop-blur-2xl border border-white/10 h-20 rounded-[32px] flex items-center justify-around z-[200] md:hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <Link to="/" className={`flex flex-col items-center gap-1 transition-all duration-300 ${location.pathname === '/' ? 'text-goldCofrade scale-110' : 'text-gray-400 hover:text-white'}`}>
            <div className={`p-2 rounded-xl ${location.pathname === '/' ? 'bg-goldCofrade/10' : ''}`}>
              <Home size={22} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
            </div>
            <span className="text-[9px] uppercase font-black tracking-tighter">Inicio</span>
          </Link>

          <Link to="/calendar" className={`flex flex-col items-center gap-1 transition-all duration-300 ${location.pathname === '/calendar' ? 'text-goldCofrade scale-110' : 'text-gray-400 hover:text-white'}`}>
            <div className={`p-2 rounded-xl ${location.pathname === '/calendar' ? 'bg-goldCofrade/10' : ''}`}>
              <Calendar size={22} strokeWidth={location.pathname === '/calendar' ? 2.5 : 2} />
            </div>
            <span className="text-[9px] uppercase font-black tracking-tighter">Agenda</span>
          </Link>

          <Link to="/news" className={`flex flex-col items-center gap-1 transition-all duration-300 ${location.pathname === '/news' ? 'text-goldCofrade scale-110' : 'text-gray-400 hover:text-white'}`}>
            <div className={`p-2 rounded-xl ${location.pathname === '/news' ? 'bg-goldCofrade/10' : ''}`}>
              <Newspaper size={22} strokeWidth={location.pathname === '/news' ? 2.5 : 2} />
            </div>
            <span className="text-[9px] uppercase font-black tracking-tighter">Noticias</span>
          </Link>

          <Link to="/patrimony" className={`flex flex-col items-center gap-1 transition-all duration-300 ${location.pathname === '/patrimony' ? 'text-goldCofrade scale-110' : 'text-gray-400 hover:text-white'}`}>
            <div className={`p-2 rounded-xl ${location.pathname === '/patrimony' ? 'bg-goldCofrade/10' : ''}`}>
              <Landmark size={22} strokeWidth={location.pathname === '/patrimony' ? 2.5 : 2} />
            </div>
            <span className="text-[9px] uppercase font-black tracking-tighter">Patrimonio</span>
          </Link>
        </nav>
      )}
    </div>
  );
};

import ScrollToTop from './components/ScrollToTop';
import InstallPWA from './components/InstallPWA';

const App = () => (
  <HashRouter>
    <ScrollToTop />
    <InstallPWA />
    <AppContent />
  </HashRouter>
);

export default App;
