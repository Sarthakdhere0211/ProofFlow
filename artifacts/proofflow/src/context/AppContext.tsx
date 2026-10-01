import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readStore, writeStore, type Store } from '../services/store';

type AppContextValue = {
  store: Store;
  update: (fn: (current: Store) => Store) => void;
  persistenceWarning: string | null;
  notify: (message: string) => void;
};
const AppContext = createContext<AppContextValue | null>(null);

export function notify(message: string) {
  window.dispatchEvent(new CustomEvent('pf-toast', { detail: message }));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(readStore);
  const [store, setStore] = useState(loaded.store);
  const [persistenceWarning, setPersistenceWarning] = useState(loaded.warning);

  const update = (fn: (current: Store) => Store) => {
    setStore(current => {
      const next = fn(current);
      if (!writeStore(next)) {
        setPersistenceWarning('Browser storage is unavailable or full. Your demo remains usable in this tab, but changes may not persist.');
      } else {
        setPersistenceWarning(null);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!writeStore(store)) {
      setPersistenceWarning('Browser storage is unavailable or full. Your demo remains usable in this tab, but changes may not persist.');
    }
  }, [store]);

  const value = useMemo(() => ({ store, update, persistenceWarning, notify }), [store, persistenceWarning]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}

export function ToastHost() {
  const [message, setMessage] = useState('');
  useEffect(() => {
    let timer = 0;
    const handle = (event: Event) => {
      setMessage((event as CustomEvent<string>).detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMessage(''), 2700);
    };
    window.addEventListener('pf-toast', handle);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pf-toast', handle);
    };
  }, []);
  return message ? <div className="toast" role="status">{message}</div> : null;
}