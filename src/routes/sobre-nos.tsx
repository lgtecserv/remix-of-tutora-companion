import { createFileRoute } from '@tanstack/react-router';
import { Header, Footer } from '@/components/public-layout';
import { CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/sobre-nos')({
  component: AboutUs,
});

function AboutUs() {
  const values = [
    "Educação acessível a todos",
    "Conteúdos práticos e aplicáveis",
    "Inovação contínua no ensino",
    "Transparência e honestidade",
    "Foco no resultado do aluno"
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#050505]">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-20 max-w-4xl text-white/80">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Sobre a Imersão Completa</h1>
            <p className="text-xl text-white/60 leading-relaxed max-w-3xl mx-auto">
              A Imersão Completa é um projeto dedicado a transformar a forma como as pessoas aprendem e desenvolvem novas competências no mundo digital. Somos orgulhosamente geridos e operados pela <a href="https://www.lgtecserv.com/sobre-nos-lg-tecserv-mocambique" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">LG TecServ</a>, uma agência de soluções digitais sedeada em Moçambique.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6 text-lg leading-relaxed">
              <h2 className="text-3xl font-bold text-white mb-4">A Nossa Missão</h2>
              <p>
                Acreditamos que o conhecimento é a principal chave para a transformação pessoal e profissional. A nossa missão é democratizar o acesso a uma educação de excelência, com conteúdos que vão direto ao ponto.
              </p>
              <p>
                Desenhamos cada curso e artigo do nosso blog a pensar na aplicabilidade no mundo real. Não vendemos ilusões, entregamos ferramentas práticas para que possa construir o seu caminho.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-3xl p-8 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-orange-500 rounded-full blur-3xl opacity-20"></div>
              <h3 className="text-2xl font-bold text-white mb-6">Os Nossos Valores</h3>
              <ul className="space-y-4">
                {values.map((val, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/90">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <span>{val}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white/5 rounded-3xl p-10 text-center border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">O Nosso Compromisso com a Qualidade</h2>
            <p className="text-lg leading-relaxed text-white/70 max-w-2xl mx-auto">
              Trabalhamos diariamente para garantir que a nossa plataforma seja um ambiente seguro, enriquecedor e livre de conteúdos enganadores. Respeitamos a sua privacidade e os seus dados são tratados com o máximo rigor.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
