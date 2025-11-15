import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Asegúrate de que la ruta a tu CSS global sea correcta
import { ThemeProvider } from './utils/ThemeContext.tsx';
import { LanguageProvider } from './utils/LanguageContext.tsx';
import { Toaster } from './components/ui/sonner.tsx'; // Para las notificaciones

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Envolvemos la App completa con el proveedor de Tema 
      (para el modo oscuro/claro)
    */}
    <ThemeProvider defaultTheme="light" storageKey="educonnect-theme">
      
      {/* Envolvemos la App con el proveedor de Idioma 
        (ESTO ARREGLA EL ERROR)
      */}
      <LanguageProvider>
        
        <App /> {/* <-- Ahora App está DENTRO de los providers */}
        
        <Toaster richColors position="top-right" />

      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);