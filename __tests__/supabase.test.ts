import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Import the MockQuery class directly by creating a fresh instance
// We test the mock query logic by importing from supabase module internals
// But since MockQuery is not exported, we recreate the logic here for testing

class TestMockQuery {
  private table: string;
  private filters: any[] = [];

  constructor(table: string) {
    this.table = table;
  }

  select() { return this; }
  order() { return this; }
  lte() { return this; }
  gte() { return this; }
  ilike() { return this; }
  single() {
    const data = this.getLocalData();
    return Promise.resolve({ data: data[0] || null, error: null });
  }
  maybeSingle() { return this.single(); }

  async insert(payload: any[]) {
    const data = this.getLocalData();
    const newData = [...data, ...payload.map(item => ({ ...item, id: item.id || Math.random().toString(36).substr(2, 9) }))];
    this.setLocalData(newData);
    return { error: null };
  }

  update(payload: any) {
    this.filters.push({ type: 'update', payload });
    return this;
  }

  delete() {
    this.filters.push({ type: 'delete' });
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  then(resolve: any) {
    let data = this.getLocalData();
    const eqFilters = this.filters.filter(f => f.type === 'eq');
    const updateAction = this.filters.find(f => f.type === 'update');
    const deleteAction = this.filters.find(f => f.type === 'delete');

    if (eqFilters.length > 0) {
      for (const filter of eqFilters) {
        data = data.filter((item: any) => item[filter.column] === filter.value);
      }
    }

    if (updateAction && eqFilters.length > 0) {
      const fullData = this.getLocalData();
      const idsToUpdate = new Set(data.map((item: any) => item.id));
      const updated = fullData.map((item: any) =>
        idsToUpdate.has(item.id) ? { ...item, ...updateAction.payload } : item
      );
      this.setLocalData(updated);
      data = updated.filter((item: any) => idsToUpdate.has(item.id));
    } else if (deleteAction && eqFilters.length > 0) {
      const fullData = this.getLocalData();
      const idsToRemove = new Set(data.map((item: any) => item.id));
      const filtered = fullData.filter((item: any) => !idsToRemove.has(item.id));
      this.setLocalData(filtered);
      data = filtered;
    }

    resolve({ data, error: null });
  }

  private getLocalData(): any[] {
    try { return JSON.parse(localStorage.getItem(`ac_mock_${this.table}`) || '[]'); }
    catch { return []; }
  }

  private setLocalData(data: any[]) {
    localStorage.setItem(`ac_mock_${this.table}`, JSON.stringify(data));
  }
}

describe('MockQuery', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should insert and retrieve data', async () => {
    const q = new TestMockQuery('test_table');
    await q.insert([{ name: 'test1' }, { name: 'test2' }]);

    const q2 = new TestMockQuery('test_table');
    const result = await new Promise(resolve => q2.select().then(resolve));
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('test1');
  });

  it('should filter by eq on any column', async () => {
    const q = new TestMockQuery('hermandades');
    await q.insert([
      { name: 'Hermandad A', day: 'Lunes Santo' },
      { name: 'Hermandad B', day: 'Martes Santo' },
      { name: 'Hermandad C', day: 'Lunes Santo' },
    ]);

    const q2 = new TestMockQuery('hermandades');
    const result = await new Promise(resolve => q2.select().eq('day', 'Lunes Santo').then(resolve));
    expect(result.data).toHaveLength(2);
    expect(result.data.every((h: any) => h.day === 'Lunes Santo')).toBe(true);
  });

  it('should update records with eq filter', async () => {
    const q = new TestMockQuery('items');
    await q.insert([{ id: '123', name: 'original' }]);

    const q2 = new TestMockQuery('items');
    const updateResult = await new Promise(resolve => q2.update({ name: 'updated' }).eq('id', '123').then(resolve));
    expect(updateResult.error).toBeNull();

    const q3 = new TestMockQuery('items');
    const { data } = await new Promise(resolve => q3.select().eq('id', '123').then(resolve));
    expect(data[0].name).toBe('updated');
  });

  it('should delete records with eq filter', async () => {
    const q = new TestMockQuery('deleteme');
    await q.insert([{ id: 'a1' }, { id: 'a2' }]);

    const q2 = new TestMockQuery('deleteme');
    await new Promise(resolve => q2.delete().eq('id', 'a1').then(resolve));

    const q3 = new TestMockQuery('deleteme');
    const { data } = await new Promise(resolve => q3.select().then(resolve));
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('a2');
  });

  it('should chain multiple eq filters', async () => {
    const q = new TestMockQuery('multi');
    await q.insert([
      { name: 'A', day: 'Lunes', status: 'active' },
      { name: 'B', day: 'Lunes', status: 'inactive' },
      { name: 'C', day: 'Martes', status: 'active' },
    ]);

    const q2 = new TestMockQuery('multi');
    const { data } = await new Promise(resolve =>
      q2.select().eq('day', 'Lunes').eq('status', 'active').then(resolve)
    );
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('A');
  });
});
