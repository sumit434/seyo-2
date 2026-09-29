import React, { useEffect, useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { SetupPage } from './pages/SetupPage';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { StaffTerminalPage } from './pages/StaffTerminalPage';
import { CustomerEntryPage } from './pages/CustomerEntryPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Router matching
  if (currentPath === '/' || currentPath === '') {
    return <LandingPage />;
  }

  if (currentPath === '/setup') {
    return <SetupPage />;
  }

  if (currentPath === '/staff/login') {
    return <StaffLoginPage />;
  }

  if (currentPath === '/staff/terminal') {
    return <StaffTerminalPage />;
  }

  // Customer Combined or Tier entry: /c/:slug/v, /c/:slug/spin, /c/:slug/loyalty, or /c/:slug
  const customerMatch = currentPath.match(/^\/c\/([^/]+)(?:\/(v|spin|loyalty))?\/?$/);
  if (customerMatch) {
    const slug = customerMatch[1];
    const sub = customerMatch[2];
    const mode = sub === 'spin' ? 'spin' : sub === 'loyalty' ? 'loyalty' : 'combined';
    return <CustomerEntryPage slug={slug} entryMode={mode} />;
  }

  // Review entry: /review/:slug
  const reviewMatch = currentPath.match(/^\/review\/([^/]+)\/?$/);
  if (reviewMatch) {
    const slug = reviewMatch[1];
    return <CustomerEntryPage slug={slug} entryMode="review" />;
  }

  // 404 fallback
  return (
    <div className="min-h-screen bg-[#f1f3f2] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#e2e7e6] shadow-sm space-y-4">
        <h2 className="text-3xl font-black text-[#10181c]">404</h2>
        <p className="text-sm text-[#6a787e]">
          The page or customer destination you requested was not found.
        </p>
        <a href="/" className="inline-block pt-2">
          <button
            type="button"
            className="px-6 py-3 bg-[#0e7c66] text-white font-semibold rounded-2xl hover:bg-[#0a6252] transition-colors cursor-pointer"
          >
            Return to Homepage
          </button>
        </a>
      </div>
    </div>
  );
}
