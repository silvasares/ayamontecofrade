import { describe, it, expect } from 'vitest';
import { computeActiveNextPasos } from '../utils/schedule';
import { Paso, Brotherhood } from '../types';

const makePaso = (overrides: Partial<Paso>): Paso => ({
  id: 'p1',
  name: 'Paso 1',
  brotherhood: 'Hdad A',
  description: '',
  history: '',
  gallery: [],
  temple_id: 't1',
  technical_data: {},
  day: 'Lunes Santo',
  route: [],
  startTime: '10:00',
  arrivalTime: '12:00',
  ...overrides
});

describe('computeActiveNextPasos', () => {
  it('returns no active and first candidate when time is before any salida', () => {
    const now = new Date('2027-03-30T08:00:00');
    const pasos = [
      makePaso({ id: 'a', startTime: '10:00', arrivalTime: '12:00' }),
      makePaso({ id: 'b', startTime: '13:00', arrivalTime: '15:00' })
    ];
    const days = [{ name: 'Lunes Santo', date: '2027-03-30', order_index: 3 }];
    const res = computeActiveNextPasos(pasos, [], days as any, now);
    expect(res.activePasos).toHaveLength(0);
    expect(res.nextPaso?.id).toBe('a');
  });

  it('detects an active paso within its time window', () => {
    const now = new Date('2027-03-30T11:00:00');
    const pasos = [
      makePaso({ id: 'a', startTime: '10:00', arrivalTime: '12:00' })
    ];
    const days = [{ name: 'Lunes Santo', date: '2027-03-30', order_index: 3 }];
    const res = computeActiveNextPasos(pasos, [], days as any, now);
    expect(res.activePasos).toHaveLength(1);
    expect(res.activePasos[0].id).toBe('a');
    expect(res.nextPaso).toBeNull();
  });

  it('handles midnight-crossing arrival', () => {
    const now = new Date('2027-03-30T23:30:00');
    const pasos = [
      makePaso({ id: 'a', startTime: '22:00', arrivalTime: '01:00' })
    ];
    const days = [{ name: 'Lunes Santo', date: '2027-03-30', order_index: 3 }];
    const res = computeActiveNextPasos(pasos, [], days as any, now);
    expect(res.activePasos).toHaveLength(1);
  });
});