import { createFileRoute } from '@tanstack/react-router';
import { Header, Footer } from '@/components/public-layout';

export const Route = createFileRoute('/politica-de-privacidade')({
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="flex min-h-screen flex-col bg-[#050505]">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-20 max-w-4xl text-white/80">
          <h1 className="text-4xl font-bold text-white mb-8">Política de Privacidade</h1>
          
          <div className="space-y-6 text-lg leading-relaxed">
            <p>
              A sua privacidade é importante para nós. É política do nosso site respeitar a sua privacidade em relação a qualquer informação sua que possamos recolher no site.
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">1. Recolha de Dados</h2>
            <p>
              Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos a recolher e como será usado.
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">2. Anúncios do Google AdSense e Cookies DART</h2>
            <p>
              O nosso site pode exibir anúncios fornecidos pela Google. Como fornecedor de terceiros, a Google utiliza cookies para exibir anúncios neste site. O uso do cookie DART pela Google permite-lhe exibir anúncios aos nossos utilizadores com base nas suas visitas a este e a outros sites na Internet. Os utilizadores podem desativar o uso do cookie DART visitando a Política de Privacidade da rede de anúncios e conteúdos da Google.
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">3. Proteção e Partilha</h2>
            <p>
              Apenas retemos as informações recolhidas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados. Não partilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">4. Ligações a Terceiros</h2>
            <p>
              O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não temos controlo sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade pelas suas respetivas políticas de privacidade.
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">5. Aceitação</h2>
            <p>
              O uso continuado de nosso site será considerado como aceitação de nossas práticas em torno de privacidade e informações pessoais. Se tiver alguma dúvida sobre como lidamos com dados do utilizador e informações pessoais, entre em contacto connosco.
            </p>

            <p className="mt-12 text-sm text-white/50">
              Esta política é efetiva a partir de {new Date().toLocaleDateString('pt-PT')}.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
