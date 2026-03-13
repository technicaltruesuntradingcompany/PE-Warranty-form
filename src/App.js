import { useEffect, useState } from 'react';
import Home from './components/Home';
import FormPage from './components/Form';
import TrackRequest from './components/TrackRequest';

function App() {
  const [view, setView] = useState('home'); // 'home', 'form', 'track'

  useEffect(() => {
    // Wake up the backend server (Render free tier) immediately on app load
    fetch('https://pe-warranty-backend.onrender.com/')
      .catch((err) => console.log('Ping failed (expected if server is down)', err));

    const params = new URLSearchParams(window.location.search);
    if (params.has('form')) {
      setView('form');
    } else if (params.has('track')) {
      setView('track');
    } else {
      setView('home');
    }
  }, []);

  return (
    <>
      {view === 'form' && <FormPage />}
      {view === 'track' && <TrackRequest />}
      {view === 'home' && <Home />}
    </>
  );
}

export default App;

