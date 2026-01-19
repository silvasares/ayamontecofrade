import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname, state } = useLocation();

    useEffect(() => {
        // Si hay un ID de noticia específico en el estado, no hacemos scroll top
        // porque la página de noticias se encargará de scrollear a ese elemento.
        if (state && (state as any).scrollToId) {
            return;
        }

        // Comportamiento por defecto: Scroll al inicio
        window.scrollTo(0, 0);
    }, [pathname, state]);

    return null;
};

export default ScrollToTop;
