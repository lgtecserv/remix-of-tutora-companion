import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-fundador.jpg";
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
    <Link to="/" className="flex items-center gap-2">
      <span className="inline-flex items-center rounded-xl bg-secondary px-3 py-2 shadow-[var(--shadow-card)]">
        <img src={logoImg} alt="Imersão Completa" className="h-8 w-auto md:h-9" />
      </span>
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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((n) => (
            <a key={n.label} href={n.href} className="text-sm font-medium text-secondary/80 transition hover:text-primary">{n.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted">Entrar</Link>
          <Link to="/registo" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:bg-primary-glow">Começar agora</Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden" style={{ background: "var(--gradient-hero-harmony)" }}>
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 15% 25%, oklch(0.62 0.22 265 / 0.5), transparent 55%), radial-gradient(ellipse at 80% 60%, rgba(0,0,0,0.85), transparent 65%)" }} />
      <div className="container relative mx-auto grid items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
        <div className="text-primary-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            APRENDA · CRIE · E FATURE
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Domine a tecnologia.<br />
            <span className="bg-gradient-to-r from-white to-primary-foreground/70 bg-clip-text text-transparent">Construa o seu futuro.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base text-primary-foreground/85 md:text-lg">
            A Imersão Completa é a plataforma onde aprende Inteligência Artificial, apps, sistemas, web, marketing digital e negócios digitais — e transforma conhecimento em faturamento.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/registo" className="rounded-full bg-background px-8 py-3 text-base font-semibold text-secondary shadow-[var(--shadow-glow)] transition hover:scale-105">
              Começar agora
            </Link>
            <a href="#cursos" className="rounded-full border border-white/30 bg-white/5 px-8 py-3 text-base font-semibold text-primary-foreground backdrop-blur transition hover:bg-white/15">
              Ver cursos
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-primary-foreground/80">
            <div><div className="text-2xl font-bold text-white">9+</div>trilhas práticas</div>
            <div className="h-10 w-px bg-white/20" />
            <div><div className="text-2xl font-bold text-white">100%</div>em português</div>
            <div className="h-10 w-px bg-white/20" />
            <div><div className="text-2xl font-bold text-white">∞</div>acesso vitalício</div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-10 rounded-[2.5rem] bg-black/70 blur-3xl" />
          <img
            src={heroImg}
            alt="Fundador da Imersão Completa"
            className="relative h-auto w-full rounded-3xl border border-white/5 object-cover shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
            style={{
              WebkitMaskImage: "radial-gradient(ellipse 95% 95% at 50% 50%, #000 62%, transparent 100%)",
              maskImage: "radial-gradient(ellipse 95% 95% at 50% 50%, #000 62%, transparent 100%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

function Tracks() {
  return (
    <section id="cursos" className="bg-background py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">O que vai aprender</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-secondary md:text-4xl">
            Trilhas para te levar do zero ao <span className="text-primary">profissional digital</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-glow)]">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-secondary">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section className="bg-muted py-24">
      <div className="container mx-auto grid items-center gap-14 px-4 md:grid-cols-2">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Benefícios</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-secondary md:text-4xl">
            Tudo o que precisa para <span className="text-primary">aprender e crescer</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-secondary">{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/30 via-primary-glow/20 to-transparent blur-2xl" />
          <div className="relative grid grid-cols-2 gap-4 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            {[Brain, Smartphone, Code2, Globe].map((Icon, i) => (
              <div key={i} className="flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-accent">
                <Icon className="h-14 w-14 text-primary" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-background py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Como funciona</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-secondary md:text-4xl">
            Do registo ao primeiro faturamento em <span className="text-primary">5 passos</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-5">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                <Icon className="h-7 w-7" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">Passo {i + 1}</div>
              <h3 className="mt-1 font-semibold text-secondary">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-muted py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-12 text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-secondary md:text-4xl">Perguntas frequentes</h2>
          <p className="mt-2 text-muted-foreground">Dúvidas? Nós temos as respostas!</p>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
              <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-muted">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-semibold text-secondary">{f.q}</span>
                </div>
                <ChevronDown className={`h-5 w-5 flex-shrink-0 text-primary transition ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <div className="px-6 pb-5 pl-16 text-sm text-muted-foreground">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden py-24" style={{ background: "var(--gradient-hero)" }}>
      <div className="container relative mx-auto max-w-3xl px-4 text-center text-primary-foreground">
        <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Pronto para começar a sua jornada?</h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
          Crie a sua conta gratuitamente e dê o primeiro passo para dominar a tecnologia e gerar renda online.
        </p>
        <Link to="/registo" className="mt-8 inline-block rounded-full bg-background px-10 py-4 text-base font-semibold text-secondary shadow-[var(--shadow-glow)] transition hover:scale-105">
          Criar conta gratuita
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-secondary py-14 text-secondary-foreground/80">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <span className="inline-flex items-center rounded-xl bg-background/10 px-3 py-2 ring-1 ring-white/10">
              <img src={logoImg} alt="Imersão Completa" className="h-10 w-auto" />
            </span>
            <p className="mt-4 text-sm">APRENDA. CRIE. E FATURE. A plataforma de educação digital da nova geração.</p>
          </div>
          {[
            { t: "Plataforma", l: ["Cursos", "Como funciona", "Blog", "FAQ"] },
            { t: "Conta", l: ["Entrar", "Criar conta", "Meus cursos", "Perfil"] },
            { t: "Suporte", l: ["Contacto", "Termos", "Privacidade", "Pagamentos"] },
          ].map((c) => (
            <div key={c.t}>
              <h4 className="mb-3 font-semibold text-white">{c.t}</h4>
              <ul className="space-y-2 text-sm">
                {c.l.map((i) => <li key={i}><a href="#" className="hover:text-primary">{i}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-border/20 pt-6 text-center text-sm">
          © {new Date().getFullYear()} Imersão Completa. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background">
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
