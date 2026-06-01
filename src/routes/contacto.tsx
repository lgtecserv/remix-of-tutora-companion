import { createFileRoute } from '@tanstack/react-router';
import { Header, Footer } from '@/components/public-layout';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/contacto')({
  component: Contact,
});

function Contact() {
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Formatar a mensagem para o WhatsApp
    const textoWhatsapp = `Olá! O meu nome é ${nome}. Gostaria de ajuda com o seguinte: ${mensagem}`;
    const url = `https://wa.me/258869824047?text=${encodeURIComponent(textoWhatsapp)}`;
    
    window.open(url, '_blank');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#050505]">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-20 max-w-5xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-white mb-4">Entre em Contacto</h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Tem alguma dúvida ou precisa de ajuda? A nossa equipa está pronta para o ajudar. Preencha o formulário abaixo para nos chamar no WhatsApp ou utilize os nossos contactos diretos.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Informações de Contacto</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4 text-white/80">
                  <Mail className="w-6 h-6 text-orange-500 mt-1" />
                  <div>
                    <h3 className="font-bold text-white">Email</h3>
                    <p>contato@lgtecserv.com</p>
                    <p className="text-sm text-white/50">Respondemos o mais breve possível</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 text-white/80">
                  <Phone className="w-6 h-6 text-orange-500 mt-1" />
                  <div>
                    <h3 className="font-bold text-white">Telefones</h3>
                    <p>+258 86 982 4047</p>
                    <p>+258 84 152 4822</p>
                    <p className="text-sm text-white/50">Atendimento e Suporte Técnico</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 text-white/80">
                  <MapPin className="w-6 h-6 text-orange-500 mt-1" />
                  <div>
                    <h3 className="font-bold text-white">Localização</h3>
                    <p>Sede: LG TecServ, Maputo, Moçambique</p>
                    <a href="https://share.google/MSvYUlVNmdQK9JMRJ" target="_blank" rel="noopener noreferrer" className="text-sm text-orange-500 hover:underline mt-1 inline-block">Ver no Google Maps</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Chamar no WhatsApp</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Nome Completo</label>
                  <input 
                    required 
                    type="text" 
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    placeholder="O seu nome" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Mensagem (opcional)</label>
                  <textarea 
                    rows={4} 
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" 
                    placeholder="Como podemos ajudar?"
                  ></textarea>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl px-4 py-3 transition hover:scale-[1.02] flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                  Enviar Mensagem para WhatsApp
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
