import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const botUsername = 'quran_bot'; // O'zingizniki bilan almashtiring

  return (
    <div style={{
      fontFamily: "system-ui, sans-serif",
      backgroundColor: '#f4f7f5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📖</div>
      <h1 style={{ color: '#064e3b', fontSize: '2.5rem' }}>Qur'on Ma'nolari Bot</h1>
      <p style={{ maxWidth: '500px', fontSize: '1.2rem', color: '#4a5568' }}>
        Suralar, oyatlar va qiroatlarni Telegram orqali o'rganing.
      </p>
      <a 
        href={`https://t.me/${botUsername}`}
        style={{
          marginTop: '30px',
          backgroundColor: '#059669',
          color: 'white',
          padding: '15px 40px',
          borderRadius: '50px',
          textDecoration: 'none',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        Botni ochish
      </a>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}