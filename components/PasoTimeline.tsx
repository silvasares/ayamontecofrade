import React from 'react';

interface PasoTimelineProps {
  startTime?: string;
  tribunaTime?: string;
  arrivalTime?: string;
  compact?: boolean;
}

const getMinutes = (timeStr?: string): number => {
  if (!timeStr) return -1;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const PasoTimeline: React.FC<PasoTimelineProps> = ({ startTime, tribunaTime, arrivalTime, compact = false }) => {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const start = getMinutes(startTime);
  const tribuna = getMinutes(tribunaTime);
  const arrival = getMinutes(arrivalTime);

  // Determine current phase
  // 0: en templo, 1: salida, 2: en calle, 3: tribuna, 4: entrada/finalizado
  let phase = 0;
  let progress = 0;

  if (start > 0 && currentMin >= start) {
    phase = 1;
    if (tribuna > 0 && currentMin >= tribuna) {
      phase = 2;
      if (arrival > 0 && currentMin >= arrival) {
        phase = 3;
      } else if (arrival > 0) {
        // Between tribuna and arrival
        const total = arrival - tribuna;
        const elapsed = currentMin - tribuna;
        progress = Math.min(elapsed / total, 1);
      }
    } else if (tribuna > 0) {
      // Between start and tribuna
      const total = tribuna - start;
      const elapsed = currentMin - start;
      progress = Math.min(elapsed / total, 1);
    } else if (arrival > 0) {
      const total = arrival - start;
      const elapsed = currentMin - start;
      progress = Math.min(elapsed / total, 1);
    }
  }

  const phases = [
    { label: 'Salida', time: startTime, active: phase === 1, done: phase > 1 },
    { label: 'Tribuna', time: tribunaTime, active: phase === 2 && progress < 0.5, done: phase > 2 || (phase === 2 && progress >= 0.5) },
    { label: 'Entrada', time: arrivalTime, active: phase === 3, done: false },
  ];

  const overallProgress = phase === 0 ? 0 : phase === 1 ? 0.1 : phase === 2 ? 0.3 + progress * 0.4 : 0.8 + progress * 0.2;

  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-1 mb-1">
          {phases.map((p, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className={`w-full h-1 rounded-full ${p.done ? 'bg-[#D4AF37]' : p.active ? 'bg-[#D4AF37]/60' : 'bg-white/10'}`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {phases.map((p, i) => (
            <span key={i} className={`text-[8px] font-bold uppercase tracking-wider ${p.active ? 'text-[#D4AF37]' : p.done ? 'text-white/60' : 'text-white/30'}`}>
              {p.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#D4AF37] to-[#F0D060] rounded-full transition-all duration-1000"
          style={{ width: `${overallProgress * 100}%` }}
        />
      </div>

      {/* Phase labels */}
      <div className="flex items-center justify-between">
        {phases.map((p, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className={`w-2 h-2 rounded-full mb-0.5 ${p.done ? 'bg-[#D4AF37]' : p.active ? 'bg-[#D4AF37] animate-pulse' : 'bg-white/20'}`} />
            <span className={`text-[9px] font-bold uppercase tracking-wider ${p.active ? 'text-[#D4AF37]' : p.done ? 'text-white/50' : 'text-white/25'}`}>
              {p.label}
            </span>
            {p.time && (
              <span className={`text-[8px] ${p.active ? 'text-white/70' : 'text-white/30'}`}>
                {p.time}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasoTimeline;
