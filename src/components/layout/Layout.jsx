// src/components/layout/Layout.jsx
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';

export default function Layout() {
  return (
    <div className="lay-root">
      <Topbar />
      <main className="lay-content">
        <Outlet />
      </main>
    </div>
  );
}
