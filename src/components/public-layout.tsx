import { Link } from "@tanstack/react-router";
import logoImg from "@/assets/logo-imersao.png";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img src={logoImg} alt="Imersão Completa" className="h-16 w-auto md:h-24 invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0" />
    </Link>
  );
}

export function Header() {
  const navItems = [
    { label: "Início", href: "/#top" },
    { label: "Cursos", href: "/#cursos" },
    { label: "Como Funciona", href: "/#como-funciona" },
    { label: "Blog", href: "/blog" },
    { label: "FAQ", href: "/#faq" },
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
          <Link to="/login" aria-label="Entrar na sua conta" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">Entrar</Link>
          <Link to="/registo" aria-label="Começar agora e criar conta" className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_-5px_rgba(234,88,12,0.6)] transition-all hover:scale-105 hover:shadow-[0_0_30px_-5px_rgba(234,88,12,0.8)] border-0">Começar agora</Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] py-20 text-white/70">
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
          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-white">Plataforma</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="/#cursos" className="transition hover:text-orange-500">Cursos</a></li>
              <li><a href="/#como-funciona" className="transition hover:text-orange-500">Como Funciona</a></li>
              <li><a href="/#faq" className="transition hover:text-orange-500">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-white">Legal & Empresa</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/sobre-nos" className="transition hover:text-orange-500">Sobre Nós</Link></li>
              <li><Link to="/contacto" className="transition hover:text-orange-500">Contacto</Link></li>
              <li><Link to="/termos-de-uso" className="transition hover:text-orange-500">Termos de Uso</Link></li>
              <li><Link to="/politica-de-privacidade" className="transition hover:text-orange-500">Privacidade & Cookies</Link></li>
            </ul>
          </div>
          <div className="md:col-span-1">
            <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-white">Contactos</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="mailto:contato@lgtecserv.com" className="transition hover:text-orange-500">contato@lgtecserv.com</a></li>
              <li><a href="https://wa.me/258869824047" target="_blank" rel="noreferrer" className="transition hover:text-orange-500">WhatsApp: +258 869 824 047</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-20 border-t border-white/10 pt-8 text-center text-sm">
          <p>© {new Date().getFullYear()} Imersão Completa. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
