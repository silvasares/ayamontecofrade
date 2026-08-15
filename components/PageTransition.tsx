import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const routeOrder = ['/', '/calendar', '/news', '/patrimony', '/paso', '/brotherhood', '/map', '/assistant', '/admin'];

const getRouteDepth = (path: string): number => {
  for (let i = routeOrder.length - 1; i >= 0; i--) {
    if (path.startsWith(routeOrder[i])) return i;
  }
  return 0;
};

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [animClass, setAnimClass] = useState('page-enter');
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    const prevDepth = getRouteDepth(prevPath.current);
    const currDepth = getRouteDepth(location.pathname);

    if (location.pathname === prevPath.current) {
      setAnimClass('');
    } else if (currDepth > prevDepth) {
      setAnimClass('page-enter');
    } else {
      setAnimClass('page-enter-back');
    }

    prevPath.current = location.pathname;
  }, [location.pathname]);

  return (
    <div key={location.pathname} className={animClass}>
      {children}
    </div>
  );
};

export default PageTransition;
