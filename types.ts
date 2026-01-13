
export enum Day {
  VIERNES_DOLORES = 'Viernes de Dolores',
  SABADO_PASION = 'Sábado de Pasión',
  DOMINGO_RAMOS = 'Domingo de Ramos',
  LUNES_SANTO = 'Lunes Santo',
  MARTES_SANTO = 'Martes Santo',
  MIERCOLES_SANTO = 'Miércoles Santo',
  JUEVES_SANTO = 'Jueves Santo',
  MADRUGA = 'Madrugá',
  VIERNES_SANTO = 'Viernes Santo',
  SABADO_SANTO = 'Sábado Santo',
  DOMINGO_RESURRECCION = 'Domingo de Resurrección'
}

export interface DaySchedule {
  id: string;
  name: string;
  date?: string; // Fecha formato YYYY-MM-DD
  order_index: number;
}

export interface Brotherhood {
  id: string;
  name: string;
  history: string;
  foundation_year?: number;
  temple_id?: string;
  elder_brother?: string;
  day: string;
  crest: string;
  image?: string;
  main_image?: string;
  vestry?: string;
  vestry_image?: string;
  premieres?: string;
  start_time?: string;
  arrival_time?: string;
  tribuna_time?: string;
  route?: string[];
  route_coords?: [number, number][];
}

export interface Paso {
  id: string;
  name: string;
  brotherhood_id?: string;
  brotherhood: string;
  description: string;
  history: string;
  foundation_year?: number;
  foundationYear?: number;
  main_image?: string;
  mainImage?: string;
  gallery: string[];
  temple_id: string;
  vestry?: string;
  vestry_image?: string;
  floral_arrangement?: string;
  premieres?: string;
  technical_data: {
    weight?: string;
    dimensions?: string;
    author?: string;
    foreman?: string;
    costaleros?: string;
    color?: string;
    tribunaTime?: string; // Standardized in technical_data but shared via brotherhood
  };
  band_id?: string;
  day: string;
  start_time?: string;
  startTime?: string;
  arrival_time?: string;
  arrivalTime?: string;
  route: string[];
  route_coords?: [number, number][];
  eventDate?: string;
}

export interface Temple {
  id: string;
  name: string;
  address: string;
  description: string;
  image: string;
  history?: string;
}

export interface Band {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface Poster {
  id: string;
  year: string;
  author: string;
  image: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  published_at: string;
  publishedAt?: string; // Para compatibilidad
  status: 'published' | 'draft' | 'scheduled';
  image: string;
  link?: string;
  publish_date?: string;
}

export interface Alert {
  id: string;
  title: string;
  body: string;
  scheduled_at: string;
}

export interface WeatherData {
  dayName: string;
  temp: number;
  condition: string;
  icon: string;
  sources?: { uri: string; title: string }[];
}
