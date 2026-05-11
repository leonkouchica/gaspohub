import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function useAuthSafe(): { user: { id: string } | null } {
  try { return useAuth() as any; } catch { return { user: null }; }
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
    "common.search": "Search", "common.help": "Help", "common.contact": "Contact",
    "common.loading": "Loading...", "common.delete": "Delete", "common.edit": "Edit",
    "common.confirm": "Confirm", "common.back": "Back", "common.next": "Next",
    "common.submit": "Submit", "common.send": "Send", "common.viewAll": "View all",
    "common.dashboard": "Dashboard", "common.profile": "Profile",
    "booking.book": "Book now", "booking.bookings": "Bookings",
    "booking.date": "Date", "booking.details": "Details",
    "shop.cart": "Cart", "shop.addToCart": "Add to cart", "shop.checkout": "Checkout",
    "auth.email": "Email", "auth.password": "Password", "auth.signUp": "Sign up",
    "auth.forgot": "Forgot password?",
  },
  es: {
    "nav.home": "Inicio", "nav.about": "Acerca", "nav.photographers": "Fotógrafos",
    "nav.services": "Servicios", "nav.shop": "Tienda", "common.signIn": "Iniciar Sesión",
    "common.signOut": "Cerrar Sesión", "common.save": "Guardar", "common.cancel": "Cancelar",
    "checkout.title": "Pagar", "checkout.tax": "Impuesto", "checkout.subtotal": "Subtotal",
    "checkout.total": "Total", "checkout.pay": "Pagar",
    "language.label": "Idioma",
    "common.search": "Buscar", "common.help": "Ayuda", "common.contact": "Contacto",
    "common.loading": "Cargando...", "common.delete": "Eliminar", "common.edit": "Editar",
    "common.confirm": "Confirmar", "common.back": "Atrás", "common.next": "Siguiente",
    "common.submit": "Enviar", "common.send": "Enviar", "common.viewAll": "Ver todo",
    "common.dashboard": "Panel", "common.profile": "Perfil",
    "booking.book": "Reservar", "booking.bookings": "Reservas",
    "booking.date": "Fecha", "booking.details": "Detalles",
    "shop.cart": "Carrito", "shop.addToCart": "Añadir al carrito", "shop.checkout": "Pagar",
    "auth.email": "Correo", "auth.password": "Contraseña", "auth.signUp": "Registrarse",
    "auth.forgot": "¿Olvidó la contraseña?",
  },
  fr: {
    "nav.home": "Accueil", "nav.about": "À propos", "nav.photographers": "Photographes",
    "nav.services": "Services", "nav.shop": "Boutique", "common.signIn": "Connexion",
    "common.signOut": "Déconnexion", "common.save": "Enregistrer", "common.cancel": "Annuler",
    "checkout.title": "Paiement", "checkout.tax": "Taxe", "checkout.subtotal": "Sous-total",
    "checkout.total": "Total", "checkout.pay": "Payer",
    "language.label": "Langue",
    "common.search": "Rechercher", "common.help": "Aide", "common.contact": "Contact",
    "common.loading": "Chargement...", "common.delete": "Supprimer", "common.edit": "Modifier",
    "common.confirm": "Confirmer", "common.back": "Retour", "common.next": "Suivant",
    "common.submit": "Envoyer", "common.send": "Envoyer", "common.viewAll": "Tout voir",
    "common.dashboard": "Tableau", "common.profile": "Profil",
    "booking.book": "Réserver", "booking.bookings": "Réservations",
    "booking.date": "Date", "booking.details": "Détails",
    "shop.cart": "Panier", "shop.addToCart": "Ajouter au panier", "shop.checkout": "Paiement",
    "auth.email": "E-mail", "auth.password": "Mot de passe", "auth.signUp": "S'inscrire",
    "auth.forgot": "Mot de passe oublié?",
  },
  pt: {
    "nav.home": "Início", "nav.about": "Sobre", "nav.photographers": "Fotógrafos",
    "nav.services": "Serviços", "nav.shop": "Loja", "common.signIn": "Entrar",
    "common.signOut": "Sair", "common.save": "Salvar", "common.cancel": "Cancelar",
    "checkout.title": "Finalizar", "checkout.tax": "Imposto", "checkout.subtotal": "Subtotal",
    "checkout.total": "Total", "checkout.pay": "Pagar",
    "language.label": "Idioma",
    "common.search": "Buscar", "common.help": "Ajuda", "common.contact": "Contato",
    "common.loading": "Carregando...", "common.delete": "Excluir", "common.edit": "Editar",
    "common.confirm": "Confirmar", "common.back": "Voltar", "common.next": "Próximo",
    "common.submit": "Enviar", "common.send": "Enviar", "common.viewAll": "Ver tudo",
    "common.dashboard": "Painel", "common.profile": "Perfil",
    "booking.book": "Reservar", "booking.bookings": "Reservas",
    "booking.date": "Data", "booking.details": "Detalhes",
    "shop.cart": "Carrinho", "shop.addToCart": "Adicionar", "shop.checkout": "Finalizar",
    "auth.email": "E-mail", "auth.password": "Senha", "auth.signUp": "Cadastrar",
    "auth.forgot": "Esqueceu a senha?",
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