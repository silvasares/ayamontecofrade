
import React, { useState, useEffect } from 'react';
import {
  Trash2, Edit, LogOut, Church, Music, Loader2, ShieldCheck, Image, MapPin,
  X, Save, AlertCircle, Layers, Newspaper, Shirt, Sparkles, Map as MapIcon, Info, Users, Flower, Database, Copy, Palette, Calendar, Mail, Settings, Type, Check, Plus, ArrowUp, ArrowDown
} from 'lucide-react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { Day, Temple, Band } from '../types';
import RouteMapSelector from '../components/RouteMapSelector';
import PoisMapSelector from '../components/PoisMapSelector';

interface AdminProps {
  updatePasos: () => Promise<void>;
  updateNews: () => Promise<void>;
  updateTemples: () => Promise<void>;
  updateBands: () => Promise<void>;
  updateDays: () => Promise<void>;
  temples: Temple[];
  days: any[];
}

const ADMIN_PIN = "2026";

const INPUT_STYLE = "w-full p-3 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl outline-none font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D4AF37] transition-all text-sm";
const LABEL_STYLE = "text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 ml-1 mb-1 block tracking-widest";
const SECTION_CARD = "bg-white dark:bg-[#111] p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm";
const MODAL_OVERLAY = "fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto";
const MODAL_CONTENT = "bg-white dark:bg-[#0A0A0A] w-full max-w-4xl rounded-[40px] shadow-2xl my-8 border border-white/10 overflow-hidden relative animate-in zoom-in duration-300";

const MIGRATION_SQL = `-- Script de Corrección Definitivo (Versión 5)
-- Ejecuta esto en el SQL Editor de Supabase si ves errores de "column not found"

-- 1. Tabla News
alter table news add column if not exists publish_date timestamptz default now();
alter table news add column if not exists link text;

-- 2. Tabla Days
create table if not exists days (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  order_index integer default 0,
  date date,
  created_at timestamptz default now()
);

-- 3. Tabla Bands
create table if not exists bands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  image text,
  created_at timestamptz default now()
);

-- 4. Tabla Pasos (Asegurar referencias y columnas)
alter table pasos add column if not exists band_id uuid references bands(id);
alter table pasos add column if not exists floral_arrangement text;
alter table pasos add column if not exists foundation_year text;
alter table pasos add column if not exists premieres text;
alter table pasos add column if not exists vestry_image text;
alter table hermandades alter column foundation_year type text;
alter table pasos alter column foundation_year type text;

-- 5. Tabla Templos
alter table temples add column if not exists history text;

-- 6. Configuración General (Nuevo - Corregido)
create table if not exists app_settings (
  key text primary key,
  value text
);
insert into app_settings (key, value) values ('header_title', 'AYAMONTE COFRADE 2026') on conflict do nothing;

-- Corregir publicación de realtime (evita error 42710 si ya existe)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and tablename = 'app_settings'
  ) then
    alter publication supabase_realtime add table app_settings;
  end if;
end $$;

grant select on app_settings to anon, authenticated;
grant all on app_settings to service_role;
grant all on app_settings to authenticated;

-- 8. Columnas de Mapa y POIs (Asegurar que existen)
alter table hermandades add column if not exists route_coords jsonb default '[]';
alter table hermandades add column if not exists pois jsonb default '[]';
alter table pasos add column if not exists route_coords jsonb default '[]';

-- 7. Recargar caché de esquema
notify pgrst, 'reload schema';`;

const getErrorMessage = (err: any): string => {
  if (!err) return "Error desconocido";
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  try { return JSON.stringify(err, null, 2); } catch (e) { return "Error no serializable"; }
};

const ErrorDisplay = ({ error, onClear }: { error: string | null, onClear: () => void }) => {
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!error) return null;
  // Detectar errores comunes de base de datos
  const isCacheError = error.toLowerCase().includes('column') ||
    error.toLowerCase().includes('relation') ||
    error.toLowerCase().includes('policy') ||
    error.toLowerCase().includes('table') ||
    error.toLowerCase().includes('schema') ||
    error.toLowerCase().includes('not find') ||
    error.includes('42710');

  const handleCopy = () => {
    navigator.clipboard.writeText(MIGRATION_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-3xl border border-red-100 dark:border-red-800/30 mb-8 animate-in shake duration-500 relative">
      <button type="button" onClick={onClear} className="absolute top-4 right-4 text-red-400 hover:text-red-600"><X size={16} /></button>
      <div className="flex gap-3 items-start">
        <AlertCircle className="text-red-600 shrink-0" size={20} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black text-red-800 dark:text-red-200 uppercase mb-1 tracking-widest">Error Técnico</p>
          <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed font-mono whitespace-pre-wrap break-all">{error}</p>
        </div>
      </div>

      {isCacheError && (
        <div className="mt-4">
          <div className="p-4 bg-black rounded-2xl border border-red-500/30">
            <p className="text-[10px] font-black text-red-400 uppercase mb-2 flex items-center gap-2"><Database size={12} /> Corrección de Base de Datos</p>
            <p className="text-[10px] text-gray-400 mb-3">Faltan columnas en tu base de datos (ej. order_index). Ejecuta este SQL para arreglarlo.</p>
            <button
              type="button"
              onClick={() => setShowSql(!showSql)}
              className="bg-goldCofrade text-[#300050] px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-2"
            >
              {showSql ? 'Ocultar SQL' : 'Ver SQL de Solución'}
            </button>
          </div>

          {showSql && (
            <div className="mt-2 bg-[#1a1a1a] rounded-xl p-4 border border-white/10 relative group">
              <div className="flex justify-end gap-2 mb-2 absolute top-2 right-2 z-10">
                <button
                  onClick={async () => {
                    try {
                      const { error } = await supabase.rpc('exec_sql', { sql: MIGRATION_SQL });
                      // FALLBACK: Si RPC falla (lo normal si no está creada la función), intentamos alertar
                      if (error) alert("Copia el SQL y ejecútalo en el SQL Editor de Supabase (este botón requiere una función RPC especial).");
                      else alert("Migración ejecutada.");
                    } catch (e) { alert("Copia el SQL y ejecútalo manualmente en Supabase."); }
                  }}
                  className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors text-[9px] font-bold uppercase tracking-wider"
                >
                  Intentar Auto-Run
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
                  title="Copiar SQL"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>

              <pre className="text-[9px] text-green-400 font-mono overflow-x-auto p-2 pt-10 custom-scrollbar select-all">
                {MIGRATION_SQL}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DeleteButton = ({ onDelete }: { onDelete: () => void }) => {
  const [confirming, setConfirming] = useState(false);
  if (confirming) return (
    <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
      <button onClick={() => setConfirming(false)} className="text-[10px] font-bold text-gray-400 uppercase">No</button>
      <button onClick={onDelete} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">Borrar</button>
    </div>
  );
  return <button onClick={() => setConfirming(true)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>;
};

const CheckIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>
);

const DayManager = ({ onUpdate }: { onUpdate: () => Promise<void> }) => {
  const [data, setData] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const fetch = async () => {
    const { data: d, error } = await supabase.from('days').select('*').order('order_index');
    if (error) setErrorInfo(getErrorMessage(error));
    if (d) setData(d);
  };

  useEffect(() => { fetch(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);
    const payload = {
      name: editing.name,
      order_index: parseInt(editing.order_index) || 0,
      date: editing.date || null
    };

    try {
      const { error } = editing.id
        ? await supabase.from('days').update(payload).eq('id', editing.id)
        : await supabase.from('days').insert([payload]);

      if (error) setErrorInfo(getErrorMessage(error));
      else {
        setEditing(null);
        fetch();
        onUpdate();
      }
    } catch (err) {
      setErrorInfo(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${SECTION_CARD} flex justify-between items-center`}>
        <div className="flex items-center gap-4"><Calendar className="text-goldCofrade" /><h3 className="font-cofrade text-2xl">Gestión de Días</h3></div>
        <button onClick={() => setEditing({ name: '', order_index: data.length, date: '' })} className="bg-purpleCofrade text-white px-6 py-3 rounded-xl text-xs font-bold">+ Nuevo Día</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(d => (
          <div key={d.id} className="bg-white dark:bg-[#111] p-5 rounded-3xl border flex justify-between items-center">
            <div className="min-w-0">
              <h4 className="font-bold truncate">{d.name}</h4>
              <div className="flex gap-2 text-[10px] text-gray-400 uppercase font-black">
                <span>Orden: {d.order_index}</span>
                {d.date && <span className="text-goldCofrade">• {new Date(d.date).toLocaleDateString()}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(d)} className="text-gray-400 hover:text-goldCofrade"><Edit size={16} /></button>
              <DeleteButton onDelete={async () => { await supabase.from('days').delete().eq('id', d.id); fetch(); onUpdate(); }} />
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <div className={MODAL_OVERLAY}><div className={MODAL_CONTENT}>
          <div className="bg-[#300050] p-6 text-white flex justify-between items-center">
            <div className="flex gap-4 items-center"><Calendar size={20} /><h3 className="font-cofrade font-bold">Gestionar Día de Agenda</h3></div>
            <button onClick={() => setEditing(null)}><X size={24} /></button>
          </div>
          <form onSubmit={save} className="p-8 space-y-4">
            <ErrorDisplay error={errorInfo} onClear={() => setErrorInfo(null)} />
            <div>
              <label className={LABEL_STYLE}>Nombre del Día</label>
              <input required className={INPUT_STYLE} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Ej. Lunes Santo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_STYLE}>Fecha (Opcional)</label>
                <input type="date" className={INPUT_STYLE} value={editing.date || ''} onChange={e => setEditing({ ...editing, date: e.target.value })} />
              </div>
              <div>
                <label className={LABEL_STYLE}>Orden (0, 1, 2...)</label>
                <input type="number" className={INPUT_STYLE} value={editing.order_index} onChange={e => setEditing({ ...editing, order_index: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="w-full bg-goldCofrade text-[#300050] py-4 rounded-2xl font-black uppercase text-xs">Guardar Jornada</button>
          </form>
        </div></div>
      )}
    </div>
  );
};

const BrotherhoodManager = ({ temples, days }: { temples: Temple[], days: any[] }) => {
  const [data, setData] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data: b } = await supabase.from('hermandades').select('*').order('order_index', { ascending: true });
    if (b) setData(b);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorInfo(null);

    const payload = {
      name: editing.name || '',
      history: editing.history || '',
      foundation_year: editing.foundation_year || '',
      elder_brother: editing.elder_brother || '',
      crest: editing.crest || '',
      temple_id: editing.temple_id || null,
      day: editing.day || (days.length > 0 ? days[0].name : Day.DOMINGO_RAMOS),
      vestry: editing.vestry || '',
      vestry_image: editing.vestry_image || '',
      premieres: editing.premieres || '',
      start_time: editing.start_time || '',
      arrival_time: editing.arrival_time || '',
      tribuna_time: editing.tribuna_time || '',
      main_image: editing.main_image || '',
      image: editing.image || '',
      route: Array.isArray(editing.route) ? editing.route : [],
      route_coords: editing.route_coords || [],
      pois: Array.isArray(editing.pois) ? editing.pois : [],
      order_index: parseInt(editing.order_index) || 0
    };

    console.log("Saving Brotherhood payload:", payload);

    try {
      const { error } = editing.id
        ? await supabase.from('hermandades').update(payload).eq('id', editing.id)
        : await supabase.from('hermandades').insert([payload]);

      if (error) setErrorInfo(getErrorMessage(error));
      else {
        console.log("Brotherhood saved successfully");
        setEditing(null);
        fetch();
      }
    } catch (err: any) { setErrorInfo(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const defaultDay = days.length > 0 ? days[0].name : Day.DOMINGO_RAMOS;

  return (
    <div className="space-y-6">
      <div className={`${SECTION_CARD} flex justify-between items-center`}>
        <div className="flex items-center gap-4"><ShieldCheck className="text-goldCofrade" /><h3 className="font-cofrade text-2xl">Hermandades</h3></div>
        <button onClick={() => { setErrorInfo(null); setEditing({ name: '', day: defaultDay, route: [], pois: [], order_index: data.length }); }} className="bg-purpleCofrade text-white px-6 py-3 rounded-xl text-xs font-bold">+ Nueva</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(b => (
          <div key={b.id} className="bg-white dark:bg-[#111] p-5 rounded-[32px] border flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4 min-w-0">
              <img src={b.crest || 'https://via.placeholder.com/50'} className="w-10 h-10 object-contain" />
              <div className="min-w-0"><h4 className="font-bold text-sm truncate">{b.name}</h4><div className="flex gap-2 text-[9px] font-black uppercase"><span className="text-goldCofrade">{b.day}</span><span className="text-purple-400">• Orden: {b.order_index || 0}</span></div></div>
            </div>
            <div className="flex gap-1"><button onClick={() => { setErrorInfo(null); setEditing(b); }} className="p-2 text-gray-300 hover:text-goldCofrade"><Edit size={18} /></button><DeleteButton onDelete={async () => { await supabase.from('hermandades').delete().eq('id', b.id); fetch(); }} /></div>
          </div>
        ))}
      </div>

      {editing && (
        <div className={MODAL_OVERLAY}><div className={MODAL_CONTENT}>
          <div className="bg-[#300050] p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-4"><div className="bg-goldCofrade p-2 rounded-xl text-[#300050]"><ShieldCheck size={20} /></div><h3 className="text-xl font-cofrade font-bold">Gestionar Hermandad</h3></div>
            <button onClick={() => setEditing(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
          </div>
          <form onSubmit={save} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
            <ErrorDisplay error={errorInfo} onClear={() => setErrorInfo(null)} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className={LABEL_STYLE}>Nombre</label><input required className={INPUT_STYLE} value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><label className={LABEL_STYLE}>Orden (Posición)</label><input type="number" className={INPUT_STYLE} value={editing.order_index} onChange={e => setEditing({ ...editing, order_index: e.target.value })} placeholder="0, 1, 2..." /></div>
              <div><label className={LABEL_STYLE}>Día</label>
                <select className={INPUT_STYLE} value={editing.day} onChange={e => setEditing({ ...editing, day: e.target.value })}>
                  {days.length > 0 ? (
                    days.map(d => <option key={d.id} value={d.name}>{d.name}</option>)
                  ) : (
                    Object.values(Day).map(d => <option key={d} value={d}>{d}</option>)
                  )}
                </select>
              </div>
              <div><label className={LABEL_STYLE}>Hermano Mayor</label><input className={INPUT_STYLE} value={editing.elder_brother || ''} onChange={e => setEditing({ ...editing, elder_brother: e.target.value })} /></div>
              <div><label className={LABEL_STYLE}>Año Fundación</label><input className={INPUT_STYLE} value={editing.foundation_year || ''} onChange={e => setEditing({ ...editing, foundation_year: e.target.value })} placeholder="Ej. 1918, S. XVIII..." /></div>
              <div><label className={LABEL_STYLE}>Templo</label>
                <select className={INPUT_STYLE} value={editing.temple_id || ''} onChange={e => setEditing({ ...editing, temple_id: e.target.value })}>
                  <option value="">Seleccionar Templo</option>
                  {temples.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div><label className={LABEL_STYLE}>URL Escudo</label><input className={INPUT_STYLE} value={editing.crest || ''} onChange={e => setEditing({ ...editing, crest: e.target.value })} /></div>
              <div className="md:col-span-2"><label className={LABEL_STYLE}>Imagen Principal (Portada Inicio)</label><input className={INPUT_STYLE} value={editing.main_image || ''} onChange={e => setEditing({ ...editing, main_image: e.target.value })} placeholder="URL de la imagen para la pantalla de inicio" /></div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-goldCofrade uppercase border-b pb-1">Horarios de Salida y Entrada</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={LABEL_STYLE}>Salida (24h)</label><input type="time" className={INPUT_STYLE} value={editing.start_time || ''} onChange={e => setEditing({ ...editing, start_time: e.target.value })} /></div>
                <div><label className={LABEL_STYLE}>Tribuna (24h)</label><input type="time" className={INPUT_STYLE} value={editing.tribuna_time || ''} onChange={e => setEditing({ ...editing, tribuna_time: e.target.value })} /></div>
                <div><label className={LABEL_STYLE}>Entrada (24h)</label><input type="time" className={INPUT_STYLE} value={editing.arrival_time || ''} onChange={e => setEditing({ ...editing, arrival_time: e.target.value })} /></div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-goldCofrade uppercase border-b pb-1">Hábito y Estrenos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className={LABEL_STYLE}>Hábito Nazareno</label><textarea rows={2} className={INPUT_STYLE} value={editing.vestry || ''} onChange={e => setEditing({ ...editing, vestry: e.target.value })} /></div>
                <div className="md:col-span-2"><label className={LABEL_STYLE}>URL Imagen Hábito (80px display)</label><input className={INPUT_STYLE} value={editing.vestry_image || ''} onChange={e => setEditing({ ...editing, vestry_image: e.target.value })} /></div>
                <div className="md:col-span-2"><label className={LABEL_STYLE}>Estrenos y Reformas</label><textarea rows={2} className={INPUT_STYLE} value={editing.premieres || ''} onChange={e => setEditing({ ...editing, premieres: e.target.value })} /></div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <RouteMapSelector
                value={editing.route_coords || []}
                onChange={(coords) => setEditing({ ...editing, route_coords: coords })}
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <PoisMapSelector
                value={editing.pois || []}
                onChange={(pois) => setEditing({ ...editing, pois })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-1">
                <h4 className="text-[10px] font-black text-goldCofrade uppercase">Itinerario de Calles</h4>
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, route: ['', ...(editing.route || [])] })}
                  className="text-[10px] font-bold text-purpleCofrade uppercase bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md"
                >
                  + Añadir al Inicio
                </button>
              </div>
              <div className="space-y-2">
                {(editing.route || []).map((point: string, idx: number) => (
                  <div key={idx} className="flex gap-2 items-center group animate-in slide-in-from-left-2" style={{ animationDelay: `${idx * 30}ms` }}>
                    <div className="flex flex-col -gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          if (idx === 0) return;
                          const nr = [...editing.route];
                          [nr[idx], nr[idx - 1]] = [nr[idx - 1], nr[idx]];
                          setEditing({ ...editing, route: nr });
                        }}
                        className="p-1 text-gray-400 hover:text-goldCofrade transition-colors"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (idx === editing.route.length - 1) return;
                          const nr = [...editing.route];
                          [nr[idx], nr[idx + 1]] = [nr[idx + 1], nr[idx]];
                          setEditing({ ...editing, route: nr });
                        }}
                        className="p-1 text-gray-400 hover:text-goldCofrade transition-colors"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>

                    <div className="relative flex-grow">
                      <input
                        className={INPUT_STYLE}
                        value={point}
                        onChange={e => {
                          const nr = [...editing.route];
                          nr[idx] = e.target.value;
                          setEditing({ ...editing, route: nr });
                        }}
                        placeholder={`Calle ${idx + 1}...`}
                      />
                      <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300 dark:text-gray-700 w-6 text-right">{idx + 1}</span>
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const nr = [...editing.route];
                          nr.splice(idx + 1, 0, ''); // Insertar después de la calle actual
                          setEditing({ ...editing, route: nr });
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        title="Insertar calle debajo"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing({ ...editing, route: editing.route.filter((_: any, i: number) => i !== idx) })}
                        className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, route: [...(editing.route || []), ''] })}
                  className="w-full py-3 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:border-goldCofrade hover:text-goldCofrade transition-all mt-2"
                >
                  + Añadir Calle al Final
                </button>
              </div>
            </div>

            <div><label className={LABEL_STYLE}>Historia</label><textarea rows={6} className={INPUT_STYLE} value={editing.history || ''} onChange={e => setEditing({ ...editing, history: e.target.value })} /></div>
            <button type="submit" disabled={saving} className="w-full bg-goldCofrade text-[#300050] py-6 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-2xl">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? "Guardando..." : "Guardar Hermandad"}
            </button>
          </form>
        </div ></div >
      )}
    </div >
  );
};

const PasoManager = ({ temples }: { temples: Temple[] }) => {
  const [pasos, setPasos] = useState<any[]>([]);
  const [brotherhoods, setBrotherhoods] = useState<any[]>([]);
  const [bands, setBands] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const fetch = async () => {
    // Obtenemos pasos con la información de su hermandad para poder ordenar
    const { data: p } = await supabase.from('pasos').select('*, hermandades(day, order_index)');
    const { data: b } = await supabase.from('hermandades').select('id, name, day, order_index').order('order_index');
    const { data: bandData } = await supabase.from('bands').select('id, name');

    if (p && b) {
      const dayWeights: Record<string, number> = {
        [Day.VIERNES_DOLORES]: 0,
        [Day.SABADO_PASION]: 1,
        [Day.DOMINGO_RAMOS]: 2,
        [Day.LUNES_SANTO]: 3,
        [Day.MARTES_SANTO]: 4,
        [Day.MIERCOLES_SANTO]: 5,
        [Day.JUEVES_SANTO]: 6,
        [Day.MADRUGA]: 7,
        [Day.VIERNES_SANTO]: 8,
        [Day.SABADO_SANTO]: 9,
        [Day.DOMINGO_RESURRECCION]: 10,
      };

      const sorted = [...p].sort((a, b) => {
        const hA = a.hermandades;
        const hB = b.hermandades;

        // 1. Orden por Día
        const dayA = hA?.day || a.day;
        const dayB = hB?.day || b.day;
        const weightA = dayWeights[dayA] ?? 99;
        const weightB = dayWeights[dayB] ?? 99;
        if (weightA !== weightB) return weightA - weightB;

        // 2. Orden por Hermandad
        if ((hA?.order_index ?? 0) !== (hB?.order_index ?? 0)) {
          return (hA?.order_index ?? 0) - (hB?.order_index ?? 0);
        }

        // 3. Orden por el propio paso
        return (a.order_index ?? 0) - (b.order_index ?? 0);
      });

      setPasos(sorted);
      setBrotherhoods(b);
    }
    if (bandData) setBands(bandData);
  };

  useEffect(() => { fetch(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorInfo(null);

    const payload = {
      name: editing.name,
      day: editing.day,
      main_image: editing.main_image,
      temple_id: editing.temple_id || null,
      band_id: editing.band_id || null,
      description: editing.description || '',
      history: editing.history || '',
      vestry: editing.vestry || '',
      vestry_image: editing.vestry_image || '',
      premieres: editing.premieres || '',
      floral_arrangement: editing.floral_arrangement || '',
      gallery: editing.gallery || [],
      foundation_year: editing.foundation_year || null,
      brotherhood_id: editing.brotherhood_id || null,
      brotherhood: brotherhoods.find(b => b.id === editing.brotherhood_id)?.name || '',
      technical_data: {
        ...(editing.technical_data || {}),
        foreman: editing.technical_data?.foreman || '',
        costaleros: editing.technical_data?.costaleros || '',
        author: editing.technical_data?.author || '',
      },
      order_index: parseInt(editing.order_index) || 0
    };

    try {
      const { error } = editing.id
        ? await supabase.from('pasos').update(payload).eq('id', editing.id)
        : await supabase.from('pasos').insert([payload]);

      if (error) setErrorInfo(getErrorMessage(error));
      else { setEditing(null); fetch(); }
    } catch (err: any) {
      setErrorInfo(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${SECTION_CARD} flex justify-between items-center`}><h3 className="font-cofrade text-2xl flex items-center gap-4"><Layers className="text-purple-500" />Titulares</h3><button onClick={() => setEditing({ name: '', day: Day.DOMINGO_RAMOS, technical_data: {}, order_index: pasos.length })} className="bg-purpleCofrade text-white px-6 py-3 rounded-xl text-xs font-bold">+ Nuevo</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pasos.map(p => (
          <div key={p.id} className="bg-white dark:bg-[#111] p-5 rounded-[32px] border flex justify-between items-center shadow-sm">
            <div className="min-w-0">
              <h4 className="font-bold text-sm truncate">{p.name}</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="text-[9px] font-black uppercase text-purple-500 bg-purple-500/5 px-2 py-0.5 rounded-full">
                  {p.hermandades?.day || p.day}
                </span>
                <span className="text-[9px] font-black uppercase text-goldCofrade bg-goldCofrade/5 px-2 py-0.5 rounded-full">
                  {p.brotherhood || 'Sin Hermandad'}
                </span>
                <span className="text-[9px] font-black uppercase text-gray-400">
                  Pos: {p.order_index || 0}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setErrorInfo(null); setEditing(p); }} className="p-2 text-gray-300 hover:text-purple-500 transition-colors">
                <Edit size={18} />
              </button>
              <DeleteButton onDelete={async () => { await supabase.from('pasos').delete().eq('id', p.id); fetch(); }} />
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className={MODAL_OVERLAY}><div className={MODAL_CONTENT}>
          <div className="bg-[#300050] p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-4"><div className="bg-goldCofrade p-2 rounded-xl text-[#300050]"><Layers size={20} /></div><h3 className="text-xl font-cofrade font-bold">Gestionar Titular</h3></div>
            <button onClick={() => setEditing(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
          </div>

          <form onSubmit={save} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <ErrorDisplay error={errorInfo} onClear={() => setErrorInfo(null)} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className={LABEL_STYLE}>Nombre</label><input required className={INPUT_STYLE} value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><label className={LABEL_STYLE}>Orden (Posición)</label><input type="number" className={INPUT_STYLE} value={editing.order_index} onChange={e => setEditing({ ...editing, order_index: e.target.value })} placeholder="0, 1, 2..." /></div>
              <div><label className={LABEL_STYLE}>Hermandad</label>
                <select className={INPUT_STYLE} value={editing.brotherhood_id || ''} onChange={e => setEditing({ ...editing, brotherhood_id: e.target.value })}>
                  <option value="">Seleccionar Hermandad</option>{brotherhoods.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><label className={LABEL_STYLE}>Año del Titular / Trono</label><input className={INPUT_STYLE} value={editing.foundation_year || ''} onChange={e => setEditing({ ...editing, foundation_year: e.target.value })} placeholder="Ej. S. XVIII, 1940..." /></div>
              <div><label className={LABEL_STYLE}>Exorno Floral</label><input className={INPUT_STYLE} value={editing.floral_arrangement || ''} onChange={e => setEditing({ ...editing, floral_arrangement: e.target.value })} /></div>
              <div className="md:col-span-2"><label className={LABEL_STYLE}>Imagen Principal (URL)</label><input className={INPUT_STYLE} value={editing.main_image || ''} onChange={e => setEditing({ ...editing, main_image: e.target.value })} /></div>

              <div className="md:col-span-2 space-y-3 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <label className={LABEL_STYLE}>Galería Adicional</label>
                  <button type="button" onClick={() => setEditing({ ...editing, gallery: [...(editing.gallery || []), ''] })} className="text-[10px] font-bold text-purpleCofrade uppercase bg-white dark:bg-black px-3 py-1.5 rounded-lg shadow-sm hover:scale-105 transition-transform">+ Añadir Foto</button>
                </div>
                <div className="space-y-2">
                  {(editing.gallery || []).map((url: string, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-left-2">
                      <span className="text-[10px] font-bold text-gray-400 w-4">{idx + 1}</span>
                      <input className={INPUT_STYLE} value={url} onChange={e => { const ng = [...(editing.gallery || [])]; ng[idx] = e.target.value; setEditing({ ...editing, gallery: ng }); }} placeholder="URL de la imagen..." />
                      <button type="button" onClick={() => setEditing({ ...editing, gallery: editing.gallery.filter((_: any, i: number) => i !== idx) })} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {(editing.gallery || []).length === 0 && <p className="text-xs text-center text-gray-400 italic py-2">No hay imágenes adicionales en la galería</p>}
                </div>
              </div>
              <div className="md:col-span-2"><label className={LABEL_STYLE}>Descripción Estética</label><textarea rows={2} className={INPUT_STYLE} value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="md:col-span-2"><label className={LABEL_STYLE}>Historia / Reseña del Titular</label><textarea rows={3} className={INPUT_STYLE} value={editing.history || ''} onChange={e => setEditing({ ...editing, history: e.target.value })} /></div>

              <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-[10px] font-black text-goldCofrade uppercase border-b pb-1">Hábito y Estrenos Propios del Titular</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className={LABEL_STYLE}>Hábito Nazareno (Si es distinto al de la Hermandad)</label><textarea rows={2} className={INPUT_STYLE} value={editing.vestry || ''} onChange={e => setEditing({ ...editing, vestry: e.target.value })} /></div>
                  <div className="md:col-span-2"><label className={LABEL_STYLE}>URL Imagen Hábito (Específica)</label><input className={INPUT_STYLE} value={editing.vestry_image || ''} onChange={e => setEditing({ ...editing, vestry_image: e.target.value })} /></div>
                  <div className="md:col-span-2"><label className={LABEL_STYLE}>Estrenos y Reformas del Titular</label><textarea rows={2} className={INPUT_STYLE} value={editing.premieres || ''} onChange={e => setEditing({ ...editing, premieres: e.target.value })} /></div>
                </div>
              </div>
            </div>


            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-[10px] font-black text-goldCofrade uppercase border-b pb-1">Detalles de la Cuadrilla y Estilo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className={LABEL_STYLE}><span className="flex items-center gap-1"><Music size={10} /> Acompañamiento Musical</span></label>
                  <select className={INPUT_STYLE} value={editing.band_id || ''} onChange={e => setEditing({ ...editing, band_id: e.target.value })}>
                    <option value="">Sin Música / Silencio</option>
                    {bands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div><label className={LABEL_STYLE}>Capataces</label><input className={INPUT_STYLE} value={editing.technical_data?.foreman || ''} onChange={e => setEditing({ ...editing, technical_data: { ...editing.technical_data, foreman: e.target.value } })} /></div>
                <div><label className={LABEL_STYLE}>Nº Costaleros</label><input type="number" className={INPUT_STYLE} value={editing.technical_data?.costaleros || ''} onChange={e => setEditing({ ...editing, technical_data: { ...editing.technical_data, costaleros: e.target.value } })} /></div>
                <div className="md:col-span-2"><label className={LABEL_STYLE}>Autor / Imaginero</label><input className={INPUT_STYLE} value={editing.technical_data?.author || ''} onChange={e => setEditing({ ...editing, technical_data: { ...editing.technical_data, author: e.target.value } })} /></div>
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full bg-goldCofrade text-[#300050] py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? "Guardando..." : "Guardar Paso"}
            </button>
          </form>
        </div ></div >
      )}
    </div >
  );
};

const NewsManager = () => {
  const [news, setNews] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('news').select('*').order('published_at', { ascending: false });
    if (data) setNews(data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorInfo(null);
    const payload = {
      title: editing.title || '',
      content: editing.content || '',
      image: editing.image || '',
      link: editing.link || null,
      status: 'published',
      published_at: editing.published_at || new Date().toISOString(),
      publish_date: editing.publish_date || new Date().toISOString()
    };

    try {
      const { error } = editing.id
        ? await supabase.from('news').update(payload).eq('id', editing.id)
        : await supabase.from('news').insert([payload]);

      if (error) setErrorInfo(getErrorMessage(error));
      else { setEditing(null); fetch(); }
    } catch (err: any) {
      setErrorInfo(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${SECTION_CARD} flex justify-between items-center`}>
        <div className="flex items-center gap-4"><Newspaper className="text-blue-500" /><h3 className="font-cofrade text-2xl">Noticias</h3></div>
        <button onClick={() => {
          setErrorInfo(null);
          const now = new Date().toISOString();
          setEditing({ title: '', content: '', image: '', published_at: now, publish_date: now });
        }} className="bg-purpleCofrade text-white px-6 py-3 rounded-xl text-xs font-bold">+ Redactar</button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-goldCofrade" /></div> : news.map(n => (
          <div key={n.id} className="bg-white dark:bg-[#111] p-5 rounded-[32px] border flex gap-6 shadow-sm">
            <img src={n.image || 'https://via.placeholder.com/150'} className="w-20 h-20 object-cover rounded-xl shrink-0" />
            <div className="flex-grow min-w-0">
              <div className="flex justify-between items-start">
                <div><h4 className="font-bold line-clamp-1">{n.title}</h4><p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(n.published_at).toLocaleDateString()}</p></div>
                <div className="flex gap-1"><button onClick={() => { setErrorInfo(null); setEditing(n); }} className="p-2 text-gray-300 hover:text-blue-500"><Edit size={18} /></button><DeleteButton onDelete={async () => { await supabase.from('news').delete().eq('id', n.id); fetch(); }} /></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className={MODAL_OVERLAY}><div className={MODAL_CONTENT}>
          <div className="bg-[#300050] p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-4"><div className="bg-[#D4AF37] p-2 rounded-xl text-[#300050]"><Newspaper size={20} /></div><h3 className="text-xl font-cofrade font-bold">Redactar Noticia</h3></div>
            <button onClick={() => setEditing(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
          </div>
          <form onSubmit={save} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            <ErrorDisplay error={errorInfo} onClear={() => setErrorInfo(null)} />
            <div><label className={LABEL_STYLE}>Título</label><input required className={INPUT_STYLE} value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} /></div>
            <div><label className={LABEL_STYLE}>Imagen (URL)</label><input className={INPUT_STYLE} value={editing.image || ''} onChange={e => setEditing({ ...editing, image: e.target.value })} /></div>
            <div>
              <label className={LABEL_STYLE}>Link Externo (Opcional)</label>
              <input
                type="url"
                className={INPUT_STYLE}
                value={editing.link || ''}
                onChange={e => setEditing({ ...editing, link: e.target.value })}
                placeholder="https://ejemplo.com/noticia-completa"
              />
              <p className="text-[10px] text-gray-400 mt-1 ml-1">Si añades un link, aparecerá el botón "Leer más" en la noticia</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_STYLE}>Fecha del Evento</label>
                <input
                  type="date"
                  className={INPUT_STYLE}
                  value={(() => {
                    if (!editing.published_at) return '';
                    const d = new Date(editing.published_at);
                    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
                  })()}
                  onChange={e => {
                    if (!e.target.value) return;
                    const d = editing.published_at ? new Date(editing.published_at) : new Date();
                    const currentTime = isNaN(d.getTime()) ? '12:00' : d.toISOString().slice(11, 16);
                    try {
                      setEditing({ ...editing, published_at: new Date(`${e.target.value}T${currentTime}`).toISOString() });
                    } catch (err) { console.error("Invalid date combination"); }
                  }}
                />
              </div>
              <div>
                <label className={LABEL_STYLE}>Hora (24h)</label>
                <input
                  type="time"
                  className={INPUT_STYLE}
                  value={(() => {
                    if (!editing.published_at) return '12:00';
                    const d = new Date(editing.published_at);
                    return isNaN(d.getTime()) ? '12:00' : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                  })()}
                  onChange={e => {
                    if (!e.target.value) return;
                    const d = editing.published_at ? new Date(editing.published_at) : new Date();
                    const currentDate = isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
                    try {
                      setEditing({ ...editing, published_at: new Date(`${currentDate}T${e.target.value}`).toISOString() });
                    } catch (err) { console.error("Invalid time combination"); }
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_STYLE}>Publicar el día (Programar)</label>
                <input
                  type="date"
                  className={INPUT_STYLE}
                  value={(() => {
                    if (!editing.publish_date) return '';
                    const d = new Date(editing.publish_date);
                    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
                  })()}
                  onChange={e => {
                    if (!e.target.value) return;
                    const d = editing.publish_date ? new Date(editing.publish_date) : new Date();
                    const currentTime = isNaN(d.getTime()) ? '00:00' : d.toISOString().slice(11, 16);
                    try {
                      setEditing({ ...editing, publish_date: new Date(`${e.target.value}T${currentTime}`).toISOString() });
                    } catch (err) { console.error("Invalid publish date combination"); }
                  }}
                />
                <p className="text-[10px] text-gray-400 mt-1 ml-1">La noticia se mostrará a partir de esta fecha</p>
              </div>
              <div>
                <label className={LABEL_STYLE}>Hora de Publicación (24h)</label>
                <input
                  type="time"
                  className={INPUT_STYLE}
                  value={(() => {
                    if (!editing.publish_date) return '00:00';
                    const d = new Date(editing.publish_date);
                    return isNaN(d.getTime()) ? '00:00' : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                  })()}
                  onChange={e => {
                    if (!e.target.value) return;
                    const d = editing.publish_date ? new Date(editing.publish_date) : new Date();
                    const currentDate = isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
                    try {
                      setEditing({ ...editing, publish_date: new Date(`${currentDate}T${e.target.value}`).toISOString() });
                    } catch (err) { console.error("Invalid publish time combination"); }
                  }}
                />
              </div>
            </div>
            <div><label className={LABEL_STYLE}>Contenido</label><textarea rows={6} className={INPUT_STYLE} value={editing.content || ''} onChange={e => setEditing({ ...editing, content: e.target.value })} /></div>
            <button type="submit" disabled={saving} className="w-full bg-goldCofrade text-purpleCofrade py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? "Publicando..." : "Publicar Noticia"}
            </button>
          </form>
        </div></div>
      )}
    </div>
  );
};

// Managers de Templo y Banda simplificados para reporte de errores
const TempleManager = () => {
  const [data, setData] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const fetch = async () => {
    const { data: d } = await supabase.from('temples').select('*').order('name');
    if (d) setData(d);
  };

  useEffect(() => { fetch(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);
    const { error } = editing.id ? await supabase.from('temples').update(editing).eq('id', editing.id) : await supabase.from('temples').insert([editing]);
    if (error) setErrorInfo(getErrorMessage(error));
    else { setEditing(null); fetch(); }
  };

  return (
    <div className="space-y-6">
      <div className={`${SECTION_CARD} flex justify-between items-center`}><div className="flex items-center gap-4"><Church className="text-goldCofrade" /><h3 className="font-cofrade text-2xl">Templos</h3></div><button onClick={() => setEditing({ name: '', address: '' })} className="bg-purpleCofrade text-white px-6 py-3 rounded-xl text-xs font-bold">+ Nuevo</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{data.map(t => (<div key={t.id} className="bg-white dark:bg-[#111] p-5 rounded-3xl border flex justify-between items-center"><div className="min-w-0"><h4 className="font-bold truncate">{t.name}</h4><p className="text-xs text-gray-400 truncate">{t.address}</p></div><div className="flex gap-2"><button onClick={() => setEditing(t)} className="text-gray-400 hover:text-goldCofrade"><Edit size={16} /></button><DeleteButton onDelete={async () => { await supabase.from('temples').delete().eq('id', t.id); fetch(); }} /></div></div>))}</div>
      {editing && (
        <div className={MODAL_OVERLAY}>
          <div className={MODAL_CONTENT}>
            <div className="bg-[#300050] p-6 text-white flex justify-between items-center">
              <div className="flex gap-4 items-center">
                <Church size={20} />
                <h3 className="font-cofrade font-bold">Gestionar Templo</h3>
              </div>
              <button onClick={() => setEditing(null)}><X size={24} /></button>
            </div>
            <form onSubmit={save} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <ErrorDisplay error={errorInfo} onClear={() => setErrorInfo(null)} />
              <div>
                <label className={LABEL_STYLE}>Nombre del Templo</label>
                <input required className={INPUT_STYLE} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Ej. Parroquia de las Angustias" />
              </div>
              <div>
                <label className={LABEL_STYLE}>Dirección</label>
                <input className={INPUT_STYLE} value={editing.address} onChange={e => setEditing({ ...editing, address: e.target.value })} placeholder="Calle..." />
              </div>
              <div>
                <label className={LABEL_STYLE}>Imagen (URL)</label>
                <input className={INPUT_STYLE} value={editing.image} onChange={e => setEditing({ ...editing, image: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className={LABEL_STYLE}>Breve Descripción (Resumen)</label>
                <textarea className={INPUT_STYLE} rows={2} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="Descripción corta para la lista..." />
              </div>
              <div>
                <label className={LABEL_STYLE}>Historia y Detalles (Completo)</label>
                <textarea className={INPUT_STYLE} rows={5} value={editing.history} onChange={e => setEditing({ ...editing, history: e.target.value })} placeholder="Escribe aquí la historia, curiosidades o detalles del templo..." />
              </div>
              <button type="submit" className="w-full bg-goldCofrade text-[#300050] py-4 rounded-2xl font-black uppercase text-xs">Guardar Templo</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const BandManager = () => {
  const [data, setData] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const fetch = async () => {
    const { data: d } = await supabase.from('bands').select('*').order('name');
    if (d) setData(d);
  };

  useEffect(() => { fetch(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);
    const { error } = editing.id ? await supabase.from('bands').update(editing).eq('id', editing.id) : await supabase.from('bands').insert([editing]);
    if (error) setErrorInfo(getErrorMessage(error));
    else { setEditing(null); fetch(); }
  };

  return (
    <div className="space-y-6">
      <div className={`${SECTION_CARD} flex justify-between items-center`}><div className="flex items-center gap-4"><Music className="text-goldCofrade" /><h3 className="font-cofrade text-2xl">Bandas</h3></div><button onClick={() => setEditing({ name: '', description: '' })} className="bg-purpleCofrade text-white px-6 py-3 rounded-xl text-xs font-bold">+ Nueva</button></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{data.map(b => (<div key={b.id} className="bg-white dark:bg-[#111] p-5 rounded-3xl border flex justify-between items-center"><h4 className="font-bold truncate">{b.name}</h4><div className="flex gap-2"><button onClick={() => setEditing(b)} className="text-gray-400 hover:text-goldCofrade"><Edit size={16} /></button><DeleteButton onDelete={async () => { await supabase.from('bands').delete().eq('id', b.id); fetch(); }} /></div></div>))}</div>
      {editing && (<div className={MODAL_OVERLAY}><div className={MODAL_CONTENT}><div className="bg-[#300050] p-6 text-white flex justify-between items-center"><div className="flex gap-4 items-center"><Music size={20} /><h3 className="font-cofrade font-bold">Gestionar Banda</h3></div><button onClick={() => setEditing(null)}><X size={24} /></button></div><form onSubmit={save} className="p-8 space-y-4"><ErrorDisplay error={errorInfo} onClear={() => setErrorInfo(null)} /><input required className={INPUT_STYLE} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Nombre" /><textarea className={INPUT_STYLE} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="Descripción" /><button type="submit" className="w-full bg-goldCofrade text-white py-4 rounded-2xl font-black uppercase text-xs">Guardar</button></form></div></div>)}
    </div>
  );
};

const PosterManager = () => {
  const [data, setData] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const fetch = async () => {
    const { data: d } = await supabase.from('posters').select('*').order('display_order', { ascending: true });
    if (d) setData(d);
  };

  useEffect(() => { fetch(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);
    const { error } = editing.id ? await supabase.from('posters').update(editing).eq('id', editing.id) : await supabase.from('posters').insert([editing]);
    if (error) setErrorInfo(getErrorMessage(error));
    else { setEditing(null); fetch(); }
  };

  return (
    <div className="space-y-6">
      <div className={`${SECTION_CARD} flex justify-between items-center`}><div className="flex items-center gap-4"><Image className="text-goldCofrade" /><h3 className="font-cofrade text-2xl">Cartelería</h3></div><button onClick={() => setEditing({ year: '', author: '', image: '', display_order: 0 })} className="bg-purpleCofrade text-white px-6 py-3 rounded-xl text-xs font-bold">+ Nuevo</button></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{data.map(p => (<div key={p.id} className="bg-white dark:bg-[#111] p-5 rounded-3xl border flex flex-col gap-4 relative overflow-hidden group"><img src={p.image} className="w-full h-48 object-cover rounded-xl" /><div className="flex justify-between items-center z-10 relative"><div className="min-w-0"><h4 className="font-bold truncate text-lg">{p.year}</h4><p className="text-xs text-gray-400 truncate">{p.author}</p><p className="text-[10px] text-goldCofrade font-bold">Orden: {p.display_order}</p></div><div className="flex gap-2"><button onClick={() => setEditing(p)} className="p-2 bg-white/10 rounded-full hover:bg-goldCofrade text-white"><Edit size={16} /></button><DeleteButton onDelete={async () => { await supabase.from('posters').delete().eq('id', p.id); fetch(); }} /></div></div></div>))}</div>
      {editing && (<div className={MODAL_OVERLAY}><div className={MODAL_CONTENT}><div className="bg-[#300050] p-6 text-white flex justify-between items-center"><div className="flex gap-4 items-center"><Image size={20} /><h3 className="font-cofrade font-bold">Gestionar Cartel</h3></div><button onClick={() => setEditing(null)}><X size={24} /></button></div><form onSubmit={save} className="p-8 space-y-4"><ErrorDisplay error={errorInfo} onClear={() => setErrorInfo(null)} />
        <div className="grid grid-cols-2 gap-4">
          <input required className={INPUT_STYLE} value={editing.year} onChange={e => setEditing({ ...editing, year: e.target.value })} placeholder="Año (Ej. 2024)" />
          <input type="number" className={INPUT_STYLE} value={editing.display_order || 0} onChange={e => setEditing({ ...editing, display_order: parseInt(e.target.value) })} placeholder="Orden de visualización" />
        </div>
        <input className={INPUT_STYLE} value={editing.author} onChange={e => setEditing({ ...editing, author: e.target.value })} placeholder="Autor" /><input className={INPUT_STYLE} value={editing.image} onChange={e => setEditing({ ...editing, image: e.target.value })} placeholder="URL Imagen" /><button type="submit" className="w-full bg-goldCofrade text-white py-4 rounded-2xl font-black uppercase text-xs">Guardar</button></form></div></div>)}
    </div>
  );
};

// --- MANEJADOR DE MENSAJES ---
const MessageManager = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase.from('admin_messages').select('*').order('timestamp', { ascending: false });
    if (data) setMessages(data);
    setLoading(false);
  };

  const deleteMessage = async (id: number) => {
    if (!confirm("¿Seguro que quieres borrar este mensaje?")) return;
    await supabase.from('admin_messages').delete().eq('id', id);
    fetchMessages();
  };

  useEffect(() => { fetchMessages(); }, []);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-purpleCofrade" size={40} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <header className="flex justify-between items-center bg-white dark:bg-[#111] p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-3xl font-cofrade text-purpleCofrade dark:text-goldCofrade">Buzón Ciudadano</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Mensajes y Comunicados ({messages.length})</p>
        </div>
        <button onClick={fetchMessages} className="bg-gray-100 dark:bg-white/5 p-3 rounded-full hover:rotate-180 transition-transform"><Loader2 size={20} className={loading ? 'animate-spin' : ''} /></button>
      </header>

      <div className="grid gap-4">
        {messages.length === 0 ? (
          <div className="text-center p-20 text-gray-400">No hay mensajes nuevos.</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="bg-white dark:bg-[#111] p-6 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purpleCofrade dark:text-goldCofrade font-bold text-lg uppercase">
                    {msg.sender_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white leading-none">{msg.sender_name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{msg.sender_contact}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    {new Date(msg.timestamp).toLocaleDateString()} {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                  <button onClick={() => deleteMessage(msg.id)} className="text-red-300 hover:text-red-500 transition-colors bg-red-50 dark:bg-transparent p-2 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="pl-13 ml-13">
                <h4 className="text-sm font-bold text-purpleCofrade dark:text-goldCofrade uppercase tracking-wide mb-2">{msg.subject}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-black/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  {msg.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- CONFIGURACIÓN GENERAL ---
const SettingsManager = () => {
  const [title, setTitle] = useState("AYAMONTE COFRADE 2026");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'header_title').single();
    if (data) setTitle(data.value);
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('app_settings').upsert({ key: 'header_title', value: title });
    if (error) {
      setError(error.message);
    } else {
      alert("Título actualizado correctamente");
    }
    setSaving(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-purpleCofrade" size={40} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <header className="flex justify-between items-center bg-white dark:bg-[#111] p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-3xl font-cofrade text-purpleCofrade dark:text-goldCofrade">Configuración General</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Personalización de la App</p>
        </div>
      </header>

      <ErrorDisplay error={error} onClear={() => setError(null)} />

      <div className="bg-white dark:bg-[#111] p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 max-w-2xl">
        <div className="space-y-4">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Título de la Cabecera (Año)</label>
          <div className="relative">
            <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 p-4 pl-12 rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-purpleCofrade"
              placeholder="Ej: AYAMONTE COFRADE 2026"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-purpleCofrade text-white px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE DE NAVEGACIÓN REUTILIZABLE ---
const NavItem = ({ to, icon, label, currentPath }: any) => {
  const active = currentPath === to || currentPath === (to + '/') || (to === '/admin' && (currentPath === '/admin' || currentPath === '/admin/'));
  return (
    <Link to={to} className={`flex items-center gap-4 p-4 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-purpleCofrade text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
      {icon} {label}
    </Link>
  );
};

const AdminDashboard: React.FC<AdminProps> = (props) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('ac_admin_auth') === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogout = () => { localStorage.removeItem('ac_admin_auth'); setIsAuthenticated(false); navigate('/'); };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#300050] flex items-center justify-center p-4">
        <form onSubmit={e => { e.preventDefault(); if (pin === ADMIN_PIN) { setIsAuthenticated(true); localStorage.setItem('ac_admin_auth', 'true'); } else alert("PIN Incorrecto"); }} className="bg-white dark:bg-[#111] rounded-[40px] p-10 w-full max-w-xs text-center space-y-8 shadow-2xl animate-in zoom-in">
          <div className="w-20 h-20 bg-purpleCofrade rounded-full flex items-center justify-center mx-auto shadow-xl"><ShieldCheck size={40} className="text-[#D4AF37]" /></div>
          <h2 className="font-cofrade text-3xl text-purpleCofrade dark:text-goldCofrade">Admin Access</h2>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} className="w-full bg-gray-50 dark:bg-black p-5 rounded-2xl text-center text-3xl tracking-[0.5em] font-black outline-none border border-gray-100 dark:border-gray-800 dark:text-white" placeholder="••••" maxLength={4} autoFocus />
          <button type="submit" className="w-full bg-purpleCofrade text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95">Acceder</button>
        </form>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#050505] flex flex-col md:flex-row">
      <aside className="w-full md:w-72 bg-white dark:bg-[#111] border-r dark:border-gray-800 flex flex-col p-6 space-y-6 shrink-0">
        <h1 className="font-cofrade text-2xl text-purpleCofrade dark:text-goldCofrade text-center md:text-left">Panel Admin</h1>
        <nav className="flex-grow space-y-2">
          <NavItem to="/admin/hermandades" icon={<ShieldCheck size={18} />} label="Hermandades" currentPath={location.pathname} />
          <NavItem to="/admin/pasos" icon={<Layers size={18} />} label="Titulares / Pasos" currentPath={location.pathname} />
          <NavItem to="/admin/news" icon={<Newspaper size={18} />} label="Noticias / Alertas" currentPath={location.pathname} />
          <NavItem to="/admin/messages" icon={<Mail size={18} />} label="Buzón Ciudadano" currentPath={location.pathname} />
          <NavItem to="/admin/days" icon={<Calendar size={18} />} label="Días / Jornadas" currentPath={location.pathname} />
          <div className="h-px bg-gray-100 dark:bg-gray-800 my-4 mx-2"></div>
          <NavItem to="/admin/temples" icon={<Church size={18} />} label="Templos" currentPath={location.pathname} />
          <NavItem to="/admin/bands" icon={<Music size={18} />} label="Bandas" currentPath={location.pathname} />
          <NavItem to="/admin/posters" icon={<Image size={18} />} label="Cartelería" currentPath={location.pathname} />
          <div className="h-px bg-gray-100 dark:bg-gray-800 my-4 mx-2"></div>
          <NavItem to="/admin/settings" icon={<Settings size={18} />} label="Configuración" currentPath={location.pathname} />
        </nav>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors"><LogOut size={16} /> Cerrar Sesión</button>
      </aside>

      <main className="flex-grow p-4 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto h-screen no-scrollbar">
        <Routes>
          <Route index element={<BrotherhoodManager temples={props.temples} days={props.days} />} />
          <Route path="hermandades" element={<BrotherhoodManager temples={props.temples} days={props.days} />} />
          <Route path="pasos" element={<PasoManager temples={props.temples} />} />
          <Route path="/news" element={<NewsManager />} />
          <Route path="/messages" element={<MessageManager />} />
          <Route path="/days" element={<DayManager onUpdate={props.updateDays} />} />
          <Route path="/temples" element={<TempleManager />} />
          <Route path="/bands" element={<BandManager />} />
          <Route path="/posters" element={<PosterManager />} />
          <Route path="/settings" element={<SettingsManager />} />
        </Routes>
      </main>

      <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #D4AF3744; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D4AF3788; }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .animate-in.shake { animation: shake 0.4s ease-in-out; }
       `}</style>
    </div>
  );
};

export default AdminDashboard;
