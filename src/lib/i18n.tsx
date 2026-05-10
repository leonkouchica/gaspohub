import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

let useAuthSafe: () => { user: { id: string } | null };
try {
  // Dynamic require so tests without AuthProvider don't crash
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@/hooks/useAuth");
  useAuthSafe = () => { try { return mod.useAuth(); } catch { return { user: null }; } };
} catch {
  useAuthSafe = () => ({ user: null });
}

type Dict = Record<string, string>;

const translations: Record<string, Dict> = {
  en: {
    "nav.home": "Home", "nav.about": "About", "nav.photographers": "Photographers",
    "nav.services": "Services", "nav.shop": "Shop", "common.signIn": "Sign In",
    "common.signOut": "Sign Out", "common.save": "Save", "common.cancel": "Cancel",
    "checkout.title": "Checkout", "checkout.tax": "Tax", "checkout.subtotal": "Subtotal",
    "checkout.total": "Total", "checkout.pay": "Pay",
    "language.label": "Language",
  },
  es: {
    "nav.home": "Inicio", "nav.about": "Acerca", "nav.photographers": "Fotógrafos",
    "nav.services": "Servicios", "nav.shop": "Tienda", "common.signIn": "Iniciar Sesión",
    "common.signOut": "Cerrar Sesión", "common.save": "Guardar", "common.cancel": "Cancelar",
    "checkout.title": "Pagar", "checkout.tax": "Impuesto", "checkout.subtotal": "Subtotal",
    "checkout.total": "Total", "checkout.pay": "Pagar",
    "language.label": "Idioma",
  },
  fr: {
    "nav.home": "Accueil", "nav.about": "À propos", "nav.photographers": "Photographes",
    "nav.services": "Services", "nav.shop": "Boutique", "common.signIn": "Connexion",
    "common.signOut": "Déconnexion", "common.save": "Enregistrer", "common.cancel": "Annuler",
    "checkout.title": "Paiement", "checkout.tax": "Taxe", "checkout.subtotal": "Sous-total",
    "checkout.total": "Total", "checkout.pay": "Payer",
    "language.label": "Langue",
  },
  pt: {
    "nav.home": "Início", "nav.about": "Sobre", "nav.photographers": "Fotógrafos",
    "nav.services": "Serviços", "nav.shop": "Loja", "common.signIn": "Entrar",
    "common.signOut": "Sair", "common.save": "Salvar", "common.cancel": "Cancelar",
    "checkout.title": "Finalizar", "checkout.tax": "Imposto", "checkout.subtotal": "Subtotal",
    "checkout.total": "Total", "checkout.pay": "Pagar",
    "language.label": "Idioma",
  },
};

export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
];

const STORAGE_KEY = "gaspohub.locale";

interface I18nCtx { locale: string; setLocale: (l: string) => void; t: (k: string) => string; }
const I18nContext = createContext<I18nCtx>({ locale: "en", setLocale: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthSafe();
  const [locale, setLocaleState] = useState<string>(() => localStorage.getItem(STORAGE_KEY) || "en");

  useEffect(() => {
    if (!user) return;
    supabase.from("user_locale" as any).select("locale").eq("user_id", user.id).maybeSingle()
      .then(({ data }: any) => { if (data?.locale) { setLocaleState(data.locale); localStorage.setItem(STORAGE_KEY, data.locale); } });
  }, [user]);

  const setLocale = (l: string) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    if (user) supabase.from("user_locale" as any).upsert({ user_id: user.id, locale: l }).then(() => {});
  };

  const t = (key: string) => translations[locale]?.[key] || translations.en[key] || key;
  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);