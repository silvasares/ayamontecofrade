import { Paso, Brotherhood, DaySchedule } from '../types';
import { Day } from '../types';

const getMinutes = (timeStr?: string): number => {
  if (!timeStr) return -1;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return -1;
  return hours * 60 + minutes;
};

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

const isSameDate = (date1: Date, dateStr?: string): boolean => {
  if (!dateStr) return false;
  const d2 = parseDate(dateStr);
  if (!d2) return false;
  return (
    date1.getFullYear() === d2.getFullYear() &&
    date1.getMonth() === d2.getMonth() &&
    date1.getDate() === d2.getDate()
  );
};

const getDayIndex = (dayName: string): number => {
  const map: Record<string, number> = {
    [Day.DOMINGO_RAMOS]: 0,
    [Day.DOMINGO_RESURRECCION]: 0,
    [Day.LUNES_SANTO]: 1,
    [Day.MARTES_SANTO]: 2,
    [Day.MIERCOLES_SANTO]: 3,
    [Day.JUEVES_SANTO]: 4,
    [Day.VIERNES_SANTO]: 5,
    [Day.MADRUGA]: 5,
    [Day.VIERNES_DOLORES]: 5,
    [Day.SABADO_PASION]: 6,
    [Day.SABADO_SANTO]: 6
  };
  return map[dayName] ?? 0;
};

const getPasoDay = (paso: Paso, brotherhoods: Brotherhood[]): string => {
  if (!brotherhoods || brotherhoods.length === 0) return paso.day;
  const linkedBrotherhood = brotherhoods.find(
    (b) => b.id === paso.brotherhood_id || b.name === paso.brotherhood
  );
  return linkedBrotherhood ? linkedBrotherhood.day : paso.day;
};

export interface ScheduleResult {
  activePasos: Paso[];
  nextPaso: Paso | null;
}

export function computeActiveNextPasos(
  pasos: Paso[],
  brotherhoods: Brotherhood[],
  days: DaySchedule[] | any[],
  now: Date
): ScheduleResult {
  const getOrderIndex = (dayName: string): number => {
    if (days && days.length > 0) {
      const d = (days as any[]).find((day) => day.name === dayName);
      if (d) return d.order_index;
    }
    const map: Record<string, number> = {
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
      [Day.DOMINGO_RESURRECCION]: 10
    };
    return map[dayName] ?? 99;
  };

  let currentOrderIndex = -1;
  if (days && days.length > 0) {
    const todaySchedule = (days as any[]).find((d) => d.date && isSameDate(now, d.date));
    if (todaySchedule) {
      currentOrderIndex = todaySchedule.order_index;
    }
  }

  if (currentOrderIndex === -1 && (!days || (days as any[]).every((d) => !d.date))) {
    const dayOfWeek = now.getDay();
    const weekMap: Record<number, number> = {
      1: 3,
      2: 4,
      3: 5,
      4: 6,
      6: 9
    };
    if (weekMap[dayOfWeek] !== undefined) {
      currentOrderIndex = weekMap[dayOfWeek];
    }
  }

  const active = pasos.filter((p) => {
    if (p.eventDate) {
      const isToday = isSameDate(now, p.eventDate);
      const start = getMinutes(p.startTime);
      const end = getMinutes(p.arrivalTime);
      const crossesMidnight = end < start;
      if (isToday) {
        if (crossesMidnight) return now.getHours() * 60 + now.getMinutes() >= start;
        return (
          now.getHours() * 60 + now.getMinutes() >= start &&
          now.getHours() * 60 + now.getMinutes() < end
        );
      }
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (isSameDate(yesterday, p.eventDate) && crossesMidnight) {
        return now.getHours() * 60 + now.getMinutes() < end;
      }
      return false;
    }

    const realDayName = getPasoDay(p, brotherhoods);

    if (days && days.length > 0) {
      const daySchedule = (days as any[]).find((d) => d.name === realDayName);
      if (daySchedule && daySchedule.date) {
        const isToday = isSameDate(now, daySchedule.date);
        const start = getMinutes(p.startTime);
        const end = getMinutes(p.arrivalTime);
        const crossesMidnight = end < start;
        if (isToday) {
          if (crossesMidnight) return now.getHours() * 60 + now.getMinutes() >= start;
          return (
            now.getHours() * 60 + now.getMinutes() >= start &&
            now.getHours() * 60 + now.getMinutes() < end
          );
        }
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterdayEvent = isSameDate(yesterday, daySchedule.date);
        if (isYesterdayEvent && crossesMidnight) {
          return now.getHours() * 60 + now.getMinutes() < end;
        }
        return false;
      }
    }

    const pDayIdx = getDayIndex(realDayName);
    const currentDayIdx = now.getDay();
    if (pDayIdx !== currentDayIdx) return false;

    const start = getMinutes(p.startTime);
    const end = getMinutes(p.arrivalTime);
    if (start === -1 || end === -1) return false;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (end < start) return currentMinutes >= start || currentMinutes < end;
    return currentMinutes >= start && currentMinutes < end;
  });

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let candidates = pasos.filter((p) => !active.find((a) => a.id === p.id));

  candidates.sort((a, b) => {
    const dayNameA = getPasoDay(a, brotherhoods);
    const dayNameB = getPasoDay(b, brotherhoods);
    const idxA = getOrderIndex(dayNameA);
    const idxB = getOrderIndex(dayNameB);

    if (idxA !== idxB) {
      let weightA = 0;
      let weightB = 0;
      if (currentOrderIndex !== -1) {
        if (idxA < currentOrderIndex) weightA = 1000;
        if (idxB < currentOrderIndex) weightB = 1000;
      }
      return idxA + weightA - (idxB + weightB);
    }

    const startA = getMinutes(a.startTime);
    const startB = getMinutes(b.startTime);

    if (idxA === currentOrderIndex) {
      const passedA = startA < currentMinutes;
      const passedB = startB < currentMinutes;
      if (passedA && !passedB) return 1;
      if (!passedA && passedB) return -1;
      return startA - startB;
    }

    return startA - startB;
  });

  return { activePasos: active, nextPaso: candidates[0] || null };
}
