import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { Paso, News, Alert, Brotherhood, Temple, Band, DaySchedule } from '../types';

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

interface AppDataContextValue {
  isOffSeason: boolean;
  setIsOffSeason: (v: boolean) => void;
  toggleOffSeason: (val: boolean) => Promise<void>;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  pasos: Paso[];
  news: News[];
  activeInAppAlerts: Alert[];
  setActiveInAppAlerts: (v: Alert[] | ((prev: Alert[]) => Alert[])) => void;
  temples: Temple[];
  bands: Band[];
  brotherhoods: Brotherhood[];
  days: DaySchedule[];
  posters: any[];
  headerTitle: string;
  setHeaderTitle: (v: string) => void;
  fetchData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export const useAppData = (): AppDataContextValue => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
};

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOffSeason, setIsOffSeason] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => safeStorage.getItem('ac_sound', 'true') !== 'false');
  const [pasos, setPasos] = useState<Paso[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [activeInAppAlerts, setActiveInAppAlerts] = useState<Alert[]>([]);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [brotherhoods, setBrotherhoods] = useState<Brotherhood[]>([]);
  const [days, setDays] = useState<DaySchedule[]>([]);
  const [posters, setPosters] = useState<any[]>([]);
  const [headerTitle, setHeaderTitle] = useState("AYAMONTE COFRADE 2027");

  const fetchData = useCallback(async () => {
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
        setActiveInAppAlerts(alertItems.filter((a: Alert) => !readIds.includes(a.id)));
      }

      const { data: brotherhoodItems } = await supabase.from('hermandades').select('*').order('order_index', { ascending: true });

      let processedBrotherhoods: Brotherhood[] = [];
      if (brotherhoodItems) {
        processedBrotherhoods = brotherhoodItems.map((b: any) => ({
          ...b,
          startTime: typeof b.start_time === 'string' ? b.start_time.substring(0, 5) : b.start_time,
          arrivalTime: typeof b.arrival_time === 'string' ? b.arrival_time.substring(0, 5) : b.arrival_time
        }));
        setBrotherhoods(processedBrotherhoods);
      }

      const { data: steps } = await supabase.from('pasos').select('*').order('order_index', { ascending: true });
      if (steps) {
        setPasos(steps.map((s: any) => {
          const b = processedBrotherhoods.find((br: Brotherhood) => br.id === s.brotherhood_id);
          const fallbackStart = b?.startTime;
          const fallbackEnd = b?.arrivalTime;
          return {
            ...s,
            mainImage: s.main_image,
            foundationYear: s.foundation_year,
            startTime: s.start_time?.substring(0, 5) || fallbackStart,
            arrivalTime: s.arrival_time?.substring(0, 5) || fallbackEnd
          };
        }));
      }

      const { data: newsItems } = await supabase.from('news').select('*').order('published_at', { ascending: true });
      if (newsItems) setNews(newsItems.map((n: any) => ({ ...n, publishedAt: n.published_at })));

      const { data: templeItems } = await supabase.from('temples').select('*');
      if (templeItems) setTemples(templeItems);

      const { data: bandItems } = await supabase.from('bands').select('*');
      if (bandItems) setBands(bandItems);

      const { data: dayItems } = await supabase.from('days').select('*').order('order_index');
      if (dayItems) setDays(dayItems);

      const { data: posterItems } = await supabase.from('posters').select('*').order('year', { ascending: false });
      if (posterItems) setPosters(posterItems);

      const { data: settingsData } = await supabase.from('app_settings').select('value').eq('key', 'header_title').single();
      if (settingsData) {
        let title = settingsData.value;
        if (title && title.includes('2026')) {
          title = title.replace('2026', '2027');
          await supabase.from('app_settings').upsert({ key: 'header_title', value: title });
        }
        setHeaderTitle(title);
      } else {
        setHeaderTitle('AYAMONTE COFRADE 2027');
      }

      const { data: offSeasonData } = await supabase.from('app_settings').select('value').eq('key', 'off_season').maybeSingle();
      if (offSeasonData) {
        setIsOffSeason(offSeasonData.value === 'true');
      } else {
        setIsOffSeason(true);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const toggleOffSeason = useCallback(async (val: boolean) => {
    try {
      await supabase.from('app_settings').upsert({ key: 'off_season', value: val ? 'true' : 'false' });
      setIsOffSeason(val);
    } catch (e) {
      console.error('Error toggling visibility:', e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);

    // Refrescar cuando la pestaña vuelve a ser visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    const incrementVisits = async () => {
      if (window.location.hash.includes('/admin')) return;
      if (sessionStorage.getItem('ac_visit_counted')) return;
      try {
        const { error } = await supabase.rpc('increment_visit_count');
        if (!error) sessionStorage.setItem('ac_visit_counted', 'true');
      } catch (e) {
        console.warn('Error incrementing visits:', e);
      }
    };
    incrementVisits();

    document.documentElement.classList.add('dark');

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [fetchData]);

  useEffect(() => {
    safeStorage.setItem('ac_sound', soundEnabled.toString());
  }, [soundEnabled]);

  const value: AppDataContextValue = {
    isOffSeason,
    setIsOffSeason,
    toggleOffSeason,
    soundEnabled,
    setSoundEnabled,
    pasos,
    news,
    activeInAppAlerts,
    setActiveInAppAlerts,
    temples,
    bands,
    brotherhoods,
    days,
    posters,
    headerTitle,
    setHeaderTitle,
    fetchData,
    refreshData: fetchData
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};
