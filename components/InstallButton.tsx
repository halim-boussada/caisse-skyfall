'use client';

import { useEffect, useState } from 'react';
import usePWAInstall from '@/hooks/usePWAInstall';

export default function InstallButton() {
  const { isInstallable, installApp } = usePWAInstall();
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // ✅ Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // ✅ Listen when user installs the app
    window.addEventListener('appinstalled', () => {
      localStorage.setItem('pwa-installed', 'true');
      setIsInstalled(true);
    });

    // ✅ Fallback: check localStorage
    if (localStorage.getItem('pwa-installed') === 'true') {
      setIsInstalled(true);
    }
  }, []);

  if (!isInstallable || isInstalled) return null;

  return (
    <button
      onClick={installApp}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        padding: '12px 16px',
        background: '#000',
        color: '#fff',
        borderRadius: '10px',
        zIndex: 9999,
      }}
    >
      Install App
    </button>
  );
}