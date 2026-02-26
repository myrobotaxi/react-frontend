import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav.tsx';

// Pages that should NOT show the bottom nav
const noNavRoutes = ['/', '/signup', '/home/empty'];
const noNavPrefixes = ['/shared/'];

export function Layout() {
  const location = useLocation();
  const showNav =
    !noNavRoutes.includes(location.pathname) &&
    !noNavPrefixes.some((prefix) => location.pathname.startsWith(prefix));

  return (
    <div className="min-h-screen bg-bg-primary">
      <Outlet />
      {showNav && <BottomNav />}
    </div>
  );
}
