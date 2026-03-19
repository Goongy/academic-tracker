import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';

function AppInner() {
  const { state } = useApp();

  useEffect(() => {
    if (state.settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.settings.darkMode]);

  return <Layout />;
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
