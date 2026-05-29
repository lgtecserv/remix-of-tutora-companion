import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar se o utilizador já aceitou
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/10 z-[100] p-4 md:p-6 shadow-2xl transform transition-transform duration-300">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-sm text-white/80 leading-relaxed md:max-w-3xl">
          <strong className="text-white block mb-1">Aviso de Cookies e Privacidade</strong>
          Utilizamos cookies e tecnologias semelhantes (como o Google DART) para personalizar conteúdos, anúncios e analisar o nosso tráfego. Ao continuar a navegar, concorda com a nossa{' '}
          <Link to="/politica-de-privacidade" className="text-orange-500 hover:underline">Política de Privacidade</Link> e{' '}
          <Link to="/termos-de-uso" className="text-orange-500 hover:underline">Termos de Uso</Link>.
        </div>
        <div className="flex gap-4 w-full md:w-auto shrink-0">
          <button
            onClick={handleAccept}
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
          >
            Aceitar e Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
