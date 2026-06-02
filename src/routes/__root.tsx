import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" },
      { name: "theme-color", content: "#0a0a0a" },
      { title: "Imersão Completa | Aprenda. Crie. Fature. Cursos de IA e Web" },
      { name: "description", content: "A Imersão Completa é a plataforma definitiva em Moçambique para aprender programação, desenvolvimento web, Inteligência Artificial e Marketing Digital do zero." },
      { name: "keywords", content: "curso de programação, criar sites, aprender inteligência artificial, marketing digital, renda online, plataforma de ensino online, cursos online, Moçambique" },
      { name: "author", content: "Imersão Completa" },
      { name: "robots", content: "max-image-preview:large" },
      { property: "og:title", content: "Imersão Completa | Aprenda. Crie. Fature." },
      { property: "og:description", content: "Aprenda desenvolvimento web, sistemas, IA e negócios digitais. A plataforma definitiva para transformar conhecimento em faturamento." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Imersão Completa" },
      { key: "og-image", property: "og:image", content: "https://www.imersaocompleta.info/favicon.ico" },
      { property: "og:url", content: "https://www.imersaocompleta.info/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Imersão Completa | Cursos de Tecnologia e Negócios" },
      { name: "twitter:description", content: "Transforme o seu futuro dominando a tecnologia com o apoio de Inteligência Artificial." },
      { key: "tw-image", name: "twitter:image", content: "https://www.imersaocompleta.info/favicon.ico" },
      // Verificação do Google Search Console
      { name: "google-site-verification", content: "xtVa_GklrXpoxNc_KxtW_bSN2JrIHLMxjp6AptyNGKo" }
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.imersaocompleta.info/",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
    ],
    scripts: [
      {
        type: "text/javascript",
        src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4326906377405532",
        crossOrigin: "anonymous",
        async: true,
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "EducationalOrganization",
              "@id": "https://www.imersaocompleta.info/#organization",
              "name": "Imersão Completa",
              "slogan": "APRENDA. CRIE. E FATURE.",
              "description": "Plataforma de ensino online especializada em tecnologia, programação, Inteligência Artificial e negócios digitais.",
              "url": "https://www.imersaocompleta.info",
              "logo": "https://www.imersaocompleta.info/favicon.ico"
            },
            {
              "@type": "Course",
              "name": "Desenvolvimento Web com IA",
              "description": "Aprenda a criar sites, sistemas web e aplicativos do zero com o apoio da Inteligência Artificial.",
              "provider": { "@id": "https://www.imersaocompleta.info/#organization" }
            },
            {
              "@type": "Course",
              "name": "Inteligência Artificial Aplicada",
              "description": "Domine as ferramentas de IA mais recentes para automatizar tarefas e aumentar a produtividade em 10x.",
              "provider": { "@id": "https://www.imersaocompleta.info/#organization" }
            },
            {
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Preciso ter experiência prévia?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Não! A nossa metodologia foi desenhada para levar-te do zero absoluto até ao nível de poder criar os teus próprios sistemas."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Qual é a duração da Imersão?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A imersão é contínua e podes estudar ao teu próprio ritmo enquanto tiveres subscrição ativa."
                  }
                }
              ]
            }
          ]
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { CookieBanner } from "@/components/CookieBanner";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // Only invalidate on actual auth changes, not token refreshes or initial session
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.invalidate();
        queryClient.invalidateQueries();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="imersao-theme">
        <AuthProvider>
          <Outlet />
          <CookieBanner />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
