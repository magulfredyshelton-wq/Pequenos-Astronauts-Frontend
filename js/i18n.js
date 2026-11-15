// Inglês por omissão, português opcional. L('english', 'português') escolhe o texto da interface.
// Os textos do jogo (incidentes, mensagens, catálogo, erros) vêm do servidor já na língua pedida
// pelo cabeçalho «X-Lang» (backend/app/traducao.py), por isso aqui não há tabelas de tradução do servidor.
export const I = { lang: "en" };
try {
  const g = localStorage.getItem("la_lang");
  if (g === "pt" || g === "en") I.lang = g;
} catch {
  /* sem armazenamento */
}
export const L = (en, pt) => (I.lang === "pt" ? pt : en);
export function mudarLingua() {
  I.lang = I.lang === "pt" ? "en" : "pt";
  try {
    localStorage.setItem("la_lang", I.lang);
  } catch {
    /* ok */
  }
  document.documentElement.lang = I.lang;
}
