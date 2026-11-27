import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string;

// Mock de persistencia local para cuando no hay credenciales
const getLocalData = (table: string) => {
    try {
        return JSON.parse(localStorage.getItem(`ac_mock_${table}`) || '[]');
    } catch { return []; }
};

const setLocalData = (table: string, data: any[]) => {
    try {
        localStorage.setItem(`ac_mock_${table}`, JSON.stringify(data));
    } catch (e) {
        console.warn('Local storage is not available', e);
    }
};

class MockQuery {
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
        const data = getLocalData(this.table);
        return Promise.resolve({ data: data[0] || null, error: null });
    }

    maybeSingle() {
        return this.single();
    }

    async insert(payload: any[]) {
        const data = getLocalData(this.table);
        const newData = [...data, ...payload.map(item => ({ ...item, id: item.id || Math.random().toString(36).substr(2, 9) }))];
        setLocalData(this.table, newData);
        return { error: null };
    }

    async upsert(payload: any) {
        const data = getLocalData(this.table);
        const items = Array.isArray(payload) ? payload : [payload];
        const updated = [...data];
        for (const item of items) {
            const idx = updated.findIndex((d: any) => d.key === item.key || d.id === item.id);
            if (idx >= 0) {
                updated[idx] = { ...updated[idx], ...item };
            } else {
                updated.push({ ...item, id: item.id || Math.random().toString(36).substr(2, 9) });
            }
        }
        setLocalData(this.table, updated);
        return { data: null, error: null };
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
        let data = getLocalData(this.table);

        const eqFilters = this.filters.filter(f => f.type === 'eq');
        const updateAction = this.filters.find(f => f.type === 'update');
        const deleteAction = this.filters.find(f => f.type === 'delete');

        // Aplicar filtros eq
        if (eqFilters.length > 0) {
            for (const filter of eqFilters) {
                data = data.filter((item: any) => item[filter.column] === filter.value);
            }
        }

        if (updateAction && eqFilters.length > 0) {
            const fullData = getLocalData(this.table);
            const idsToUpdate = new Set(data.map((item: any) => item.id));
            const updated = fullData.map((item: any) =>
                idsToUpdate.has(item.id) ? { ...item, ...updateAction.payload } : item
            );
            setLocalData(this.table, updated);
            data = updated.filter((item: any) => idsToUpdate.has(item.id));
        } else if (deleteAction && eqFilters.length > 0) {
            const fullData = getLocalData(this.table);
            const idsToRemove = new Set(data.map((item: any) => item.id));
            const filtered = fullData.filter((item: any) => !idsToRemove.has(item.id));
            setLocalData(this.table, filtered);
            data = filtered;
        }

        resolve({ data, error: null });
    }
}

export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : {
        from: (table: string) => new MockQuery(table),
        rpc: async (fn: string, _params?: any) => {
            if (fn === 'increment_visit_count') {
                const count = parseInt(localStorage.getItem('ac_mock_visit_count') || '0', 10);
                localStorage.setItem('ac_mock_visit_count', String(count + 1));
            }
            return { data: null, error: null };
        },
        auth: {
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        }
    } as any;
