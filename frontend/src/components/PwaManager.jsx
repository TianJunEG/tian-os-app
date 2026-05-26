import React, { useEffect, useState, useRef, useCallback } from 'react';
import { RefreshCw, Download, WifiOff, X } from 'lucide-react';

// Surfaces three PWA affordances: an "update available" reload prompt when a
// new service worker is waiting, a custom install button (beforeinstallprompt),
// and an offline indicator. The SW reload is gated so it only fires when the
// user accepts an update — never on the first-load controller claim.
export default function PwaManager() {
  const [waiting, setWaiting] = useState(null);
  const [installEvt, setInstallEvt] = useState(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);
  const updatingRef = useRef(false);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    const onInstalled = () => setInstallEvt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return undefined;

    const onControllerChange = () => {
      if (!updatingRef.current) return; // ignore first-load claim
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) setWaiting(nw);
          });
        });
      })
      .catch(() => {});

    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waiting) return;
    updatingRef.current = true;
    waiting.postMessage({ type: 'SKIP_WAITING' });
  }, [waiting]);

  const install = useCallback(async () => {
    if (!installEvt) return;
    installEvt.prompt();
    try {
      await installEvt.userChoice;
    } catch {
      // user dismissed; nothing to do
    }
    setInstallEvt(null);
  }, [installEvt]);

  const showInstall = installEvt && !installDismissed;
  if (!waiting && !showInstall && !offline) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 md:bottom-6 z-[60] px-3 flex flex-col items-center gap-2 pointer-events-none print:hidden">
      {offline && (
        <div className="pointer-events-auto w-full max-w-sm flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800 text-white shadow-lg text-sm">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>You're offline — some features may be unavailable.</span>
        </div>
      )}

      {waiting && (
        <div className="pointer-events-auto w-full max-w-sm flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-gray-200 shadow-lg">
          <RefreshCw className="w-5 h-5 text-navy-600 flex-shrink-0" />
          <span className="text-sm text-gray-700 flex-1">A new version is available.</span>
          <button
            onClick={applyUpdate}
            className="px-3 py-1.5 text-sm font-medium text-white bg-navy-600 rounded-lg hover:bg-navy-700"
          >
            Reload
          </button>
        </div>
      )}

      {showInstall && (
        <div className="pointer-events-auto w-full max-w-sm flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-gray-200 shadow-lg">
          <Download className="w-5 h-5 text-navy-600 flex-shrink-0" />
          <span className="text-sm text-gray-700 flex-1">Install Edu OS for a faster, full-screen experience.</span>
          <button
            onClick={install}
            className="px-3 py-1.5 text-sm font-medium text-white bg-navy-600 rounded-lg hover:bg-navy-700"
          >
            Install
          </button>
          <button
            onClick={() => setInstallDismissed(true)}
            className="p-1 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
