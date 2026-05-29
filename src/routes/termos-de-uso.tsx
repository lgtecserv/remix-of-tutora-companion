import { createFileRoute } from '@tanstack/react-router';
import { Header, Footer } from '@/components/public-layout';

export const Route = createFileRoute('/termos-de-uso')({
  component: TermsOfUse,
});

function TermsOfUse() {
  return (
    <div className="flex min-h-screen flex-col bg-[#050505]">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-20 max-w-4xl text-white/80">
          <h1 className="text-4xl font-bold text-white mb-8">Termos de Uso</h1>
          
          <div className="space-y-6 text-lg leading-relaxed">
            <h2 className="text-2xl font-bold text-white mt-12 mb-4">1. Aceitação dos Termos</h2>
            <p>
              Ao aceder a este site, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se não concordar com algum destes termos, está proibido de usar ou aceder a este site.
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">2. Uso de Licença</h2>
            <p>
              É concedida permissão para descarregar temporariamente uma cópia dos materiais (informações ou software) neste site, apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob esta licença, não pode:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>modificar ou copiar os materiais;</li>
              <li>usar os materiais para qualquer finalidade comercial ou para exibição pública (comercial ou não comercial);</li>
              <li>tentar descompilar ou fazer engenharia reversa de qualquer software contido neste site;</li>
              <li>remover quaisquer direitos de autor ou outras notações de propriedade dos materiais; ou</li>
              <li>transferir os materiais para outra pessoa ou 'espelhe' os materiais em qualquer outro servidor.</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">3. Isenção de responsabilidade</h2>
            <p>
              Os materiais no site são fornecidos 'como estão'. Não oferecemos garantias, expressas ou implícitas, e, por este meio, isentamo-nos e negamos todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">4. Limitações</h2>
            <p>
              Em nenhum caso nós ou os nossos fornecedores seremos responsáveis por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais, mesmo que tenhamos sido notificados oralmente ou por escrito da possibilidade de tais danos.
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">5. Modificações</h2>
            <p>
              Podemos rever estes termos de serviço do site a qualquer momento, sem aviso prévio. Ao usar este site, concorda em ficar vinculado à versão atual destes termos de serviço.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
