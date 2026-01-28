
import { Paso, Day, Temple, Band, News } from './types';

export const TEMPLES: Temple[] = [
  {
    id: 'temple-1',
    name: 'Parroquia de las Angustias',
    address: 'Plaza de las Angustias, Ayamonte',
    description: 'Templo principal y uno de los edificios más emblemáticos de la ciudad.',
    image: 'https://images.unsplash.com/photo-1548625361-909778ce3f0d?q=80&w=800'
  },
  {
    id: 'temple-2',
    name: 'Iglesia de San Francisco',
    address: 'Calle San Francisco, Ayamonte',
    description: 'Antiguo convento franciscano con una arquitectura impresionante.',
    image: 'https://images.unsplash.com/photo-1590059391056-b04000305809?q=80&w=800'
  }
];

export const BANDS: Band[] = [
  {
    id: 'band-1',
    name: 'Banda de Música de Ayamonte',
    description: 'Histórica formación musical que acompaña a los principales pasos.',
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=400'
  },
  {
    id: 'band-2',
    name: 'Agrupación Musical Cristo de la Buena Muerte',
    description: 'Especializada en marchas procesionales de estilo clásico.',
    image: 'https://images.unsplash.com/photo-1514525253361-bee24387052b?q=80&w=400'
  }
];

export const PASOS: Paso[] = [
  {
    id: 'paso-vd',
    name: 'Nuestra Señora de los Dolores',
    brotherhood: 'Devoción Popular',
    description: 'La Virgen de los Dolores procesiona de forma solemne abriendo la Semana de Pasión en Ayamonte.',
    history: 'Una de las imágenes más queridas que recorre las calles en un silencio sobrecogedor.',
    // Added to Paso type in types.ts
    foundationYear: '1750',
    mainImage: 'https://images.unsplash.com/photo-1594903337920-56956f4f2c01?q=80&w=800',
    gallery: ['https://picsum.photos/seed/dolores1/400/400'],
    temple_id: 'temple-1',
    vestry: 'Manto negro bordado en oro y corona de plata.',
    technical_data: {
      author: 'Anónimo',
      tribunaTime: '22:30'
    } as any,
    band_id: 'band-1',
    day: Day.VIERNES_DOLORES,
    startTime: '21:00',
    arrivalTime: '00:00',
    route: ['Parroquia de las Angustias (Salida)', 'Plaza de las Angustias', 'Calle Ahenas', 'Paseo de la Ribera (Tribuna)', 'Calle Real', 'Plaza del Rosario', 'Parroquia de las Angustias (Entrada)'],
    route_coords: [
      [37.2152, -7.4055],
      [37.2150, -7.4058],
      [37.2150, -7.4050],
      [37.2135, -7.4080],
      [37.2148, -7.4068],
      [37.2158, -7.4052],
      [37.2152, -7.4055]
    ]
  },
  {
    id: 'paso-1',
    name: 'Señor Triunfante en su Entrada en Jerusalén',
    brotherhood: 'Hermandad de la Mulita',
    description: 'Representa la entrada triunfal de Jesús en Jerusalén a lomos de una borriquita.',
    history: 'La hermandad fue fundada a principios del siglo XX por un grupo de entusiastas locales.',
    // Added to Paso type in types.ts
    foundationYear: '1918',
    mainImage: 'https://images.unsplash.com/photo-1507421300302-36e693192004?q=80&w=800',
    gallery: ['https://picsum.photos/seed/mulita1/400/400', 'https://picsum.photos/seed/mulita2/400/400'],
    temple_id: 'temple-2',
    vestry: 'Túnica blanca con capa y antifaz de color celeste.',
    technical_data: {
      weight: '1200 kg',
      author: 'Salvador Castillejos',
      tribunaTime: '12:00'
    } as any,
    band_id: 'band-1',
    day: Day.DOMINGO_RAMOS,
    startTime: '10:30',
    arrivalTime: '14:30',
    route: ['Iglesia San Francisco (Salida)', 'Calle San Francisco', 'Plaza de la Laguna', 'Paseo de la Ribera (Tribuna)', 'Calle Real', 'Plaza de la Coronación', 'Iglesia San Francisco (Entrada)']
  },
  {
    id: 'paso-2',
    name: 'Nuestro Padre Jesús Cautivo',
    brotherhood: 'Hermandad del Cautivo',
    description: 'Impresionante talla de Jesús maniatado, solo ante su destino.',
    history: 'Una de las devociones más populares de Ayamonte.',
    // Added to Paso type in types.ts
    foundationYear: '1947',
    mainImage: 'https://images.unsplash.com/photo-1473177104440-9b6348f07022?q=80&w=800',
    gallery: ['https://picsum.photos/seed/cautivo1/400/400'],
    temple_id: 'temple-1',
    vestry: 'Túnica de color púrpura y escapulario trinitario.',
    technical_data: {
      weight: '1500 kg',
      author: 'Antonio León Ortega',
      tribunaTime: '22:15'
    } as any,
    band_id: 'band-2',
    day: Day.LUNES_SANTO,
    startTime: '20:00',
    arrivalTime: '01:00',
    route: ['Parroquia de las Angustias (Salida)', 'Muelle de Portugal', 'Paseo de la Ribera (Tribuna)', 'Plaza del Rosario', 'Calle Galdames', 'Parroquia de las Angustias (Entrada)']
  },
  {
    id: 'paso-madruga',
    name: 'Nuestro Padre Jesús Nazareno',
    brotherhood: 'Cofradía de Padre Jesús',
    description: 'El Señor de Ayamonte. Procesiona en la madrugada del Viernes Santo cargado por sus devotos.',
    history: 'Imagen icónica de la ciudad, centro de la fe ayamontina.',
    // Added to Paso type in types.ts
    foundationYear: '1590',
    mainImage: 'https://images.unsplash.com/photo-1501393152198-34b240415948?q=80&w=800',
    gallery: [],
    temple_id: 'temple-1',
    vestry: 'Túnica morada lisa.',
    technical_data: {
      author: 'Francisco de Ocampo',
      tribunaTime: '06:30'
    } as any,
    day: Day.MADRUGA,
    startTime: '02:00',
    arrivalTime: '10:00',
    route: ['Capilla del Socorro (Salida)', 'Barrio Alto', 'Calle Marte', 'Plaza de la Laguna', 'Paseo de la Ribera (Tribuna)', 'Calle Real', 'Calle Lusitania', 'Capilla del Socorro (Entrada)']
  },
  {
    id: 'paso-resurrecion',
    name: 'Jesús Resucitado',
    brotherhood: 'Hermandad de la Resurrección',
    description: 'Representa la victoria sobre la muerte.',
    history: 'Punto final y glorioso de la Semana Santa.',
    // Added to Paso type in types.ts
    foundationYear: '1990',
    mainImage: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=800',
    gallery: [],
    temple_id: 'temple-1',
    vestry: 'Túnica blanca.',
    technical_data: {
      author: 'Anónimo',
      tribunaTime: '13:00'
    } as any,
    day: Day.DOMINGO_RESURRECCION,
    startTime: '11:00',
    arrivalTime: '15:00',
    route: ['Parroquia de las Angustias (Salida)', 'Plaza de las Angustias', 'Paseo de la Ribera (Tribuna)', 'Calle Real', 'Parroquia de las Angustias (Entrada)']
  }
];

export const NEWS: News[] = [
  {
    id: 'news-1',
    title: 'Nuevos itinerarios confirmados para 2025',
    content: 'La Agrupación de Cofradías ha anunciado cambios ligeros en los recorridos de este año para mejorar la fluidez y seguridad de los cargadores y el público en las calles estrechas del centro histórico.',
    // Required property published_at added
    published_at: '2024-03-10',
    publishedAt: '2024-03-10',
    status: 'published',
    image: 'https://picsum.photos/seed/news1/600/400'
  },
  {
    id: 'news-2',
    title: 'Exposición de Carteles Históricos',
    content: 'Se inaugura hoy en la Casa de la Cultura una muestra con los mejores carteles de la Semana Santa desde 1950. Una oportunidad única para ver la evolución gráfica de nuestra semana mayor.',
    // Required property published_at added
    published_at: '2024-03-12',
    publishedAt: '2024-03-12',
    status: 'published',
    image: 'https://picsum.photos/seed/news2/600/400'
  }
];
