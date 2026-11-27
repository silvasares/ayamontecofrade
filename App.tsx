
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  Calendar, Newspaper, Settings, Home, Bot, ChevronLeft,
  ArrowUp, Bell, X, Volume2, VolumeX, CheckCircle as CheckIcon, AlertTriangle,
  Shield, Map, LogIn, MapPin, Navigation, Lock, Landmark, Power, Eye, EyeOff
} from 'lucide-react';
const PublicHome = lazy(() => import('./pages/PublicHome'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const PasoDetailPage = lazy(() => import('./pages/PasoDetailPage'));
const BrotherhoodPage = lazy(() => import('./pages/BrotherhoodPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PatrimonyPage = lazy(() => import('./pages/PatrimonyPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
import { supabase } from './supabase';
import { Paso, News, Alert, Brotherhood, Day, Temple, Band } from './types';
import PullToRefresh from './components/PullToRefresh';
import { useAppData, AppDataProvider } from './context/AppDataContext';
import ErrorBoundary from './components/ErrorBoundary';

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
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#2C2C2E] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#4B0082]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
            <Bell size={20} className="text-[#4B0082] dark:text-[#D4AF37]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{visibleAlert.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{visibleAlert.body}</p>
        </div>
        <div className="border-t border-gray-100 dark:border-white/10">
          <button onClick={() => onRead(visibleAlert.id)} className="w-full py-3.5 text-sm font-semibold text-[#4B0082] dark:text-[#D4AF37] active:bg-gray-50 dark:active:bg-white/5 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#2C2C2E] w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden animate-in">
        <div className="p-5 text-center">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
        <div className="border-t border-gray-100 dark:border-white/10 flex">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 active:bg-gray-50 dark:active:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <div className="w-px bg-gray-100 dark:bg-white/10"></div>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 text-sm font-semibold text-red-500 active:bg-red-50 dark:active:bg-red-500/10 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
};

const MobileHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { soundEnabled, setSoundEnabled, headerTitle } = useAppData();
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
      <header className="fixed top-0 left-0 right-0 h-12 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xl text-gray-900 dark:text-white flex items-center px-3 z-[200] border-b border-gray-100 dark:border-white/5 justify-between">
        <div className="w-8 flex justify-start">
          {!isRoot && (
            <button onClick={() => navigate(-1)} className="p-1.5 -ml-1 rounded-full transition-colors active:bg-gray-100 dark:active:bg-white/10">
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center overflow-hidden px-2">
          <h1 className="text-sm font-semibold tracking-tight text-center leading-tight truncate">
            {headerTitle}
          </h1>
        </div>

        <div className="w-8 flex justify-end items-center gap-1">
          <button onClick={() => setShowExitConfirm(true)} className="p-1.5 rounded-full transition-colors active:bg-gray-100 dark:active:bg-white/10" title="Salir de la App">
            <Power size={16} className="text-gray-400" />
          </button>
        </div>
      </header>
    </>
  );
};

const DesktopSidebar = () => {
  const location = useLocation();
  const { isOffSeason, toggleOffSeason } = useAppData();
  const isActive = (path: string) => location.pathname === path;
  const [toggling, setToggling] = useState(false);

  const getLinkStyle = (path: string) => `
      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium
      ${isActive(path)
      ? 'bg-[#4B0082] dark:bg-[#D4AF37] text-white dark:text-[#1A1A1A]'
      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
      `;

  const handleToggleVisibility = async () => {
    setToggling(true);
    const newVal = !isOffSeason;
    await toggleOffSeason(newVal);
    setToggling(false);
  };

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#1A1A1A] flex-col border-r border-gray-100 dark:border-white/5">
      <div className="p-8 pb-6">
        <h1 className="text-2xl font-bold text-[#4B0082] dark:text-[#D4AF37] leading-tight">
          Ayamonte<br />
          <span className="text-sm text-gray-400 font-normal tracking-widest uppercase">Cofrade</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
        {!isOffSeason && (
          <>
            <Link to="/" className={getLinkStyle('/')}><Home size={18} /> Inicio</Link>
            <Link to="/calendar" className={getLinkStyle('/calendar')}><Calendar size={18} /> Agenda</Link>
            <Link to="/news" className={getLinkStyle('/news')}><Newspaper size={18} /> Noticias</Link>
            <div className="h-px bg-gray-100 dark:bg-white/5 my-3 mx-2"></div>
          </>
        )}
        <Link to="/patrimony" className={getLinkStyle('/patrimony')}><Landmark size={18} /> Patrimonio</Link>
      </nav>

      <div className="px-4 pb-4 border-t border-gray-100 dark:border-white/5 pt-4 space-y-2">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold px-3">Panel de Control</p>

        <button
          onClick={handleToggleVisibility}
          disabled={toggling}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
            isOffSeason
              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
              : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10'
          } ${toggling ? 'opacity-50 cursor-wait' : ''}`}
        >
          {isOffSeason ? <EyeOff size={16} /> : <Eye size={16} />}
          <div className="flex-1 text-left">
            <span className="block text-xs font-medium">
              {isOffSeason ? 'App Oculta' : 'App Visible'}
            </span>
          </div>
          <div className={`w-9 h-5 rounded-full flex items-center transition-all duration-200 ${
            isOffSeason ? 'bg-red-500/20 justify-start' : 'bg-green-500/20 justify-end'
          }`}>
            <div className={`w-4 h-4 rounded-full mx-0.5 transition-all duration-200 shadow-sm ${
              isOffSeason ? 'bg-red-400' : 'bg-green-400'
            }`}></div>
          </div>
        </button>

        <Link
          to="/admin"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
            isActive('/admin')
              ? 'bg-[#4B0082] text-white'
              : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Settings size={16} />
          <span>Administración</span>
        </Link>
      </div>

      <div className="px-6 py-3 text-center border-t border-gray-100 dark:border-white/5">
        <p className="text-[10px] text-gray-300 dark:text-gray-600 uppercase tracking-widest font-medium">Semana Santa 2027</p>
      </div>
    </aside>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  const {
    isOffSeason,
    pasos,
    news,
    activeInAppAlerts,
    temples,
    bands,
    brotherhoods,
    days,
    posters,
    headerTitle,
    soundEnabled,
    setSoundEnabled,
    setActiveInAppAlerts,
    fetchData,
    refreshData
  } = useAppData();

  return (
    <div className="min-h-screen bg-luxuryWhite dark:bg-[#0A0A0A] flex flex-col transition-all duration-500">
      <InAppAlertModal alerts={activeInAppAlerts} onRead={(id) => { const read = JSON.parse(safeStorage.getItem('ac_read_alerts', '[]')); safeStorage.setItem('ac_read_alerts', JSON.stringify([...read, id])); setActiveInAppAlerts(prev => prev.filter(a => a.id !== id)); }} soundEnabled={soundEnabled} />

      {!isAdmin && <DesktopSidebar />}
      <MobileHeader />

      <main className={`flex-grow ${isAdmin ? '' : `lg:ml-72 pt-12 pb-16 md:pb-0`}`}>
        <PullToRefresh onRefresh={fetchData}>
          <PageTransition>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]" /></div>}>
<Routes>
              <Route path="/" element={isOffSeason ? <Navigate to="/patrimony" replace /> : <PublicHome />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/paso/:id" element={<PasoDetailPage />} />
              <Route path="/brotherhood/:name" element={<BrotherhoodPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/patrimony" element={<PatrimonyPage />} />
              <Route path="/map/:id" element={<MapPage />} />
              <Route path="/assistant" element={<AIAssistant />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Routes>
             </Suspense>
          </PageTransition>
        </PullToRefresh>
      </main>

      {!isAdmin && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 h-16 flex items-center justify-around z-[200] md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {isOffSeason ? (
            <Link to="/patrimony" className={`flex flex-col items-center gap-0.5 w-16 py-1 transition-colors duration-200 relative ${location.pathname === '/patrimony' ? 'text-[#4B0082] dark:text-[#D4AF37]' : 'text-gray-400'}`}>
              {location.pathname === '/patrimony' && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#4B0082] dark:bg-[#D4AF37] rounded-full"></span>}
              <Landmark size={22} strokeWidth={location.pathname === '/patrimony' ? 2.5 : 1.5} />
              <span className="text-[10px] font-semibold">Patrimonio</span>
            </Link>
          ) : (
            <>
              <Link to="/" className={`flex flex-col items-center gap-0.5 w-16 py-1 transition-colors duration-200 relative ${location.pathname === '/' ? 'text-[#4B0082] dark:text-[#D4AF37]' : 'text-gray-400'}`}>
                {location.pathname === '/' && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#4B0082] dark:bg-[#D4AF37] rounded-full"></span>}
                <Home size={22} strokeWidth={location.pathname === '/' ? 2.5 : 1.5} />
                <span className="text-[10px] font-semibold">Inicio</span>
              </Link>

              <Link to="/calendar" className={`flex flex-col items-center gap-0.5 w-16 py-1 transition-colors duration-200 relative ${location.pathname === '/calendar' ? 'text-[#4B0082] dark:text-[#D4AF37]' : 'text-gray-400'}`}>
                {location.pathname === '/calendar' && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#4B0082] dark:bg-[#D4AF37] rounded-full"></span>}
                <Calendar size={22} strokeWidth={location.pathname === '/calendar' ? 2.5 : 1.5} />
                <span className="text-[10px] font-semibold">Agenda</span>
              </Link>

              <Link to="/news" className={`flex flex-col items-center gap-0.5 w-16 py-1 transition-colors duration-200 relative ${location.pathname === '/news' ? 'text-[#4B0082] dark:text-[#D4AF37]' : 'text-gray-400'}`}>
                {location.pathname === '/news' && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#4B0082] dark:bg-[#D4AF37] rounded-full"></span>}
                <Newspaper size={22} strokeWidth={location.pathname === '/news' ? 2.5 : 1.5} />
                <span className="text-[10px] font-semibold">Noticias</span>
              </Link>

              <Link to="/patrimony" className={`flex flex-col items-center gap-0.5 w-16 py-1 transition-colors duration-200 relative ${location.pathname === '/patrimony' ? 'text-[#4B0082] dark:text-[#D4AF37]' : 'text-gray-400'}`}>
                {location.pathname === '/patrimony' && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#4B0082] dark:bg-[#D4AF37] rounded-full"></span>}
                <Landmark size={22} strokeWidth={location.pathname === '/patrimony' ? 2.5 : 1.5} />
                <span className="text-[10px] font-semibold">Patrimonio</span>
              </Link>
            </>
          )}
        </nav>
      )}
    </div>
  );
};

import ScrollToTop from './components/ScrollToTop';
import InstallPWA from './components/InstallPWA';
import PageTransition from './components/PageTransition';

const App = () => (
  <HashRouter>
    <ScrollToTop />
    <InstallPWA />
    <AppDataProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AppDataProvider>
  </HashRouter>
);

export default App;
