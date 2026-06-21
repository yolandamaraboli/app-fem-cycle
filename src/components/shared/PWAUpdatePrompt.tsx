import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Check for updates every hour
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
      console.log(`SW registered: ${swUrl}`);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  function handleUpdate() {
    updateServiceWorker(true);
  }

  function handleDismiss() {
    setNeedRefresh(false);
  }

  if (!needRefresh) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[380px] z-50 bg-card border border-border rounded-card shadow-modal p-4 animate-in"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-body font-medium text-text-primary">
            Nueva versión disponible
          </p>
          <p className="text-label text-text-secondary mt-1">
            Actualiza para obtener las últimas mejoras. Tus datos no se perderán.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleUpdate}
              className="px-3 py-1.5 text-label font-medium bg-primary text-white rounded-button hover:bg-primary/90 transition-fast focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
            >
              Actualizar
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-label font-medium text-text-secondary hover:text-text-primary rounded-button hover:bg-hover-row transition-fast focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
            >
              Después
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
