import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vlugwkbodufvnrarpeyk.supabase.co';
const supabaseKey = 'sb_publishable_c3vtZB8WbyviaTXz1QZJVA_VsiclPsC';

// Mock de persistencia local para cuando no hay credenciales
const getLocalData = (table: string) => {
    try {
        return JSON.parse(localStorage.getItem(`ac_mock_${table}`) || '[]');
    } catch { return []; }
};

const setLocalData = (table: string, data: any[]) => {
    localStorage.setItem(`ac_mock_${table}`, JSON.stringify(data));
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
        const newData = [...data, ...payload.map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9) }))];
        setLocalData(this.table, newData);
        return { error: null };
    }

    update(payload: any) {
        // En un mock simple, el update es global o requiere eq previo. 
        // Para el admin, guardamos el eq y lo aplicamos en el then si es necesario, 
        // pero para insertar/editar es suficiente con interceptar el payload.
        this.filters.push({ type: 'update', payload });
        return this;
    }

    delete() {
        this.filters.push({ type: 'delete' });
        return this;
    }

    eq(column: string, value: any) {
        if (column === 'id') this.filters.push({ type: 'id', value });
        return this;
    }

    then(resolve: any) {
        let data = getLocalData(this.table);

        // Aplicar filtros básicos si existen (especialmente por ID para update/delete)
        const idFilter = this.filters.find(f => f.type === 'id');
        const updateAction = this.filters.find(f => f.type === 'update');
        const deleteAction = this.filters.find(f => f.type === 'delete');

        if (idFilter) {
            if (updateAction) {
                data = data.map((item: any) => item.id === idFilter.value ? { ...item, ...updateAction.payload } : item);
                setLocalData(this.table, data);
            } else if (deleteAction) {
                data = data.filter((item: any) => item.id !== idFilter.value);
                setLocalData(this.table, data);
            } else {
                data = data.filter((item: any) => item.id === idFilter.value);
            }
        }

        resolve({ data, error: null });
    }
}

export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : {
        from: (table: string) => new MockQuery(table),
        auth: {
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        }
    } as any;
