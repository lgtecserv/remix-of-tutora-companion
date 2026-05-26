import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero.jpg";
import logoImg from "@/assets/logo-imersao.png";
import { Brain, Smartphone, Code2, Globe, Megaphone, Zap, Check, ChevronDown, Rocket, Trophy, GraduationCap, DollarSign } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Imersão Completa — Aprenda. Crie. E fature." },
      { name: "description", content: "Aprenda IA, criação de apps, desenvolvimento de sistemas, web, marketing digital, automações e negócios digitais. Transforme conhecimento em faturamento." },
      { property: "og:title", content: "Imersão Completa — Aprenda. Crie. E fature." },
      { property: "og:description", content: "Plataforma de educação digital para aprender competências de IA, apps, sistemas e marketing — e começar a faturar." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const tracks = [
  { icon: Brain, title: "Inteligência Artificial", desc: "Domine IA aplicada a produtos, automações e produtividade." },
  { icon: Smartphone, title: "Criação de Aplicativos", desc: "Construa apps modernos para Android, iOS e web." },
  { icon: Code2, title: "Desenvolvimento de Sistemas", desc: "Sistemas empresariais com bases sólidas de engenharia." },
  { icon: Globe, title: "Desenvolvimento Web & Landing Pages", desc: "Sites e páginas que convertem visitantes em clientes." },
  { icon: Megaphone, title: "Marketing Digital", desc: "Tráfego, copy, funis e estratégia de crescimento." },
  { icon: Zap, title: "Automações & Negócios Digitais", desc: "Monetize online com automações e modelos escaláveis." },
];

const benefits = [
  "Aprenda na prática com projetos reais",
  "Conteúdo 100% em português",
  "Acesso vitalício às aulas",
  "Comunidade de alunos e mentores",
  "Pagamentos em M-Pesa, e-Mola e transferência",
  "Certificado de conclusão",
];

const faqs = [
  { q: "Para quem é a Imersão Completa?", a: "Para iniciantes, freelancers, empreendedores e profissionais que querem aprender competências digitais e gerar renda com tecnologia." },
  { q: "Preciso de conhecimento prévio?", a: "Não. Os cursos começam do zero e evoluem até o nível avançado, com projetos práticos." },
  { q: "Como faço o pagamento?", a: "Aceitamos M-Pesa, e-Mola e transferência bancária. O acesso é liberado assim que o pagamento é aprovado." },
  { q: "Por quanto tempo tenho acesso ao curso?", a: "O acesso é vitalício — assista quando e onde quiser, no seu ritmo." },
  { q: "Vou receber certificado?", a: "Sim. Ao concluir 100% das aulas do curso, recebe um certificado digital." },
  { q: "Posso assistir pelo celular?", a: "Sim. A plataforma é totalmente responsiva e funciona como aplicativo (PWA) instalável." },
];

const steps = [
  { icon: GraduationCap, title: "Crie a sua conta", desc: "Registo gratuito em 30 segundos." },
  { icon: BookIcon, title: "Escolha o curso", desc: "Trilhas práticas e diretas ao ponto." },
  { icon: Rocket, title: "Aprenda na prática", desc: "Aulas em vídeo + projetos reais." },
  { icon: Trophy, title: "Crie projetos", desc: "Portfólio para mostrar o seu trabalho." },
  { icon: DollarSign, title: "Comece a faturar", desc: "Aplique o que aprendeu e gere renda." },
];

function BookIcon(props: React.SVGProps<SVGSVGElement>) {
  // alias to keep imports tidy
  return <Code2 {...props} />;
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img src={logoImg} alt="Imersão Completa" className="h-16 w-auto md:h-24 invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0" />
    </Link>
  );
}

function Header() {
  const navItems = [
    { label: "Início", href: "#top" },
    { label: "Cursos", href: "#cursos" },
    { label: "Como Funciona", href: "#como-funciona" },
    { label: "Blog", href: "#blog" },
    { label: "FAQ", href: "#faq" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((n) => (
            <a key={n.label} href={n.href} className="text-sm font-semibold text-white/70 transition-colors hover:text-orange-500">{n.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/login" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">Entrar</Link>
          <Link to="/registo" className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_-5px_rgba(234,88,12,0.6)] transition-all hover:scale-105 hover:shadow-[0_0_30px_-5px_rgba(234,88,12,0.8)] border-0">Começar agora</Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      {/* Dark Overlays for readability and fading into next section */}
      <div className="absolute inset-0 z-10 bg-black/60" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/60 to-transparent" />
      
      <div className="container relative z-20 mx-auto px-4 py-20 text-center md:py-32">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto max-w-4xl text-white"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            APRENDA · CRIE · E FATURE
          </span>
          <h1 className="mt-8 text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
            Domine a tecnologia.<br />
            <span className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text text-transparent drop-shadow-sm">
              Construa o seu futuro.
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-white/90 md:text-xl">
            A Imersão Completa é a plataforma onde aprende Inteligência Artificial, apps, sistemas, web, marketing digital e negócios digitais — e transforma conhecimento em faturamento.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link to="/registo" className="rounded-full bg-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-[0_0_30px_-5px_rgba(234,88,12,0.6)] transition hover:scale-105 hover:bg-orange-500">
              Começar agora
            </Link>
            <a href="#cursos" className="rounded-full border border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur transition hover:bg-white/20">
              Ver cursos
            </a>
          </div>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-white/80 md:gap-14">
            <div className="flex flex-col items-center"><div className="text-3xl font-bold text-white">9+</div>trilhas práticas</div>
            <div className="hidden h-12 w-px bg-white/20 md:block" />
            <div className="flex flex-col items-center"><div className="text-3xl font-bold text-white">100%</div>em português</div>
            <div className="hidden h-12 w-px bg-white/20 md:block" />
            <div className="flex flex-col items-center"><div className="text-3xl font-bold text-white">∞</div>acesso vitalício</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Tracks() {
  return (
    <section id="cursos" aria-labelledby="cursos-title" className="bg-[#0a0a0a] py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-orange-500">O que vai aprender</span>
          <h2 id="cursos-title" className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Trilhas para te levar do zero ao <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-sm">profissional digital</span>
          </h2>
        </div>
        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map(({ icon: Icon, title, desc }, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              key={title} 
              className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-orange-500/50 hover:bg-white/[0.07] hover:shadow-[0_0_40px_-10px_rgba(234,88,12,0.2)]"
            >
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 shadow-[inset_0_0_20px_rgba(234,88,12,0.2)]">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">{title}</h3>
              <p className="text-base leading-relaxed text-white/60">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section aria-labelledby="benefits-title" className="relative overflow-hidden bg-[#050505] py-32">
      <div className="absolute top-0 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-orange-600/10 blur-[120px] pointer-events-none" />
      <div className="container relative mx-auto grid items-center gap-16 px-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-bold uppercase tracking-widest text-orange-500">Benefícios</span>
          <h2 id="benefits-title" className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Tudo o que precisa para <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-sm">aprender e crescer</span>
          </h2>
          <ul className="mt-10 space-y-6">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-4">
                <span className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                  <Check className="h-4 w-4 stroke-[3]" />
                </span>
                <span className="text-lg font-medium text-white/80">{b}</span>
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-orange-600/20 via-red-500/10 to-transparent blur-3xl pointer-events-none" />
          <div className="relative grid grid-cols-2 gap-4 rounded-[2.5rem] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl">
            {[Brain, Smartphone, Code2, Globe].map((Icon, i) => (
              <div key={i} className="group flex aspect-square items-center justify-center rounded-3xl border border-white/5 bg-white/5 transition-all duration-500 hover:scale-105 hover:border-orange-500/30 hover:bg-orange-500/10 hover:shadow-[0_0_30px_rgba(234,88,12,0.2)]">
                <Icon className="h-16 w-16 text-white/30 transition-colors duration-500 group-hover:text-orange-500" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-[#0a0a0a] py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-orange-500">Como funciona</span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Do registo ao faturamento em <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-sm">5 passos</span>
          </h2>
        </div>
        <div className="mt-20 grid gap-6 md:grid-cols-5">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              key={title} 
              className="relative rounded-3xl border border-white/10 bg-white/5 p-6 text-center transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-1"
            >
              {i < steps.length - 1 && (
                <div className="absolute right-0 top-1/2 -mr-3 hidden w-6 -translate-y-1/2 border-t-2 border-dashed border-white/20 md:block" />
              )}
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-transform hover:rotate-12">
                <Icon className="h-8 w-8" />
              </div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-500">Passo {i + 1}</div>
              <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
              <p className="text-sm font-medium text-white/60">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-[#050505] py-32">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-16 text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-orange-500">FAQ</span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">Perguntas frequentes</h2>
          <p className="mt-4 text-lg text-white/60">Dúvidas? Nós temos as respostas!</p>
        </div>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${open === i ? 'border-orange-500/50 bg-white/10' : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'}`}>
              <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-6 px-8 py-6 text-left">
                <div className="flex items-center gap-6">
                  <span className={`text-2xl font-bold transition-colors ${open === i ? 'text-orange-500' : 'text-white/20'}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-lg font-semibold text-white">{f.q}</span>
                </div>
                <ChevronDown className={`h-6 w-6 flex-shrink-0 transition-all duration-300 ${open === i ? "rotate-180 text-orange-500" : "text-white/40"}`} />
              </button>
              <div className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <div className="px-8 pb-6 pl-[4.5rem] text-base leading-relaxed text-white/60">{f.a}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-40">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at center, rgba(234,88,12,0.8), transparent 60%)" }} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="container relative z-10 mx-auto max-w-4xl px-4 text-center"
      >
        <h2 className="text-4xl font-black tracking-tight text-white md:text-6xl lg:text-7xl">Pronto para acender a faísca?</h2>
        <p className="mx-auto mt-8 max-w-2xl text-xl font-medium text-white/80">
          Crie a sua conta gratuitamente e dê o primeiro passo para dominar a tecnologia e gerar renda online.
        </p>
        <Link to="/registo" className="mt-12 inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-12 py-5 text-lg font-bold text-white shadow-[0_0_40px_-10px_rgba(234,88,12,0.8)] transition-all hover:scale-110 hover:shadow-[0_0_60px_-10px_rgba(234,88,12,1)]">
          Criar conta gratuita
        </Link>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-black py-16 text-white/60 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 md:grid-cols-4 lg:gap-16">
          <div className="md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-3">
              <img src={logoImg} alt="Imersão Completa" className="h-12 w-auto md:h-16 invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0" />
            </Link>
            <p className="mt-6 text-sm leading-relaxed">
              APRENDA. CRIE. E FATURE.<br/> A plataforma de educação digital da nova geração para quem procura resultados reais.
            </p>
          </div>
          {[
            { t: "Plataforma", l: ["Cursos", "Como funciona", "Blog", "FAQ"] },
            { t: "Conta", l: ["Entrar", "Criar conta", "Meus cursos", "Perfil"] },
            { t: "Suporte", l: ["Contacto", "Termos", "Privacidade", "Pagamentos"] },
          ].map((c) => (
            <div key={c.t}>
              <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">{c.t}</h4>
              <ul className="space-y-3 text-sm font-medium">
                {c.l.map((i) => <li key={i}><a href="#" className="transition-colors hover:text-orange-500">{i}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center justify-between border-t border-white/10 pt-8 md:flex-row">
          <div className="text-sm">
            © {new Date().getFullYear()} Imersão Completa. Todos os direitos reservados.
          </div>
          <div className="mt-4 flex gap-6 md:mt-0">
            <a href="#" className="text-white/40 hover:text-orange-500 transition-colors"><Globe className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#0a0a0a] selection:bg-orange-500/30 selection:text-white">
      <Header />
      <main>
        <Hero />
        <Tracks />
        <HowItWorks />
        <Benefits />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
