import {
  PERSONAGENS,
  INFO_NAVES,
  R,
  astro,
  nave,
  terra,
  estrelas,
  cl,
} from "./sprites.js";
import { desenharSim, explicar } from "./incidentes.js";
import * as cenas from "./cenas.js";
import * as mundo from "./mundo.js";
import { I, L, mudarLingua } from "./i18n.js";

// O servidor já responde na língua pedida (cabeçalho X-Lang), por isso estes textos passam directos.
const srv = (s) => s,
  destinoTxt = (d, perfil) => perfil,
  nomeCarga = (k, nome) => nome;

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        m
      ],
  );
const uid = () =>
  (crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now() + "-" + Math.random().toString(36).slice(2)
  )
    .replace(/-/g, "")
    .slice(0, 32);
const guardado = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};
const guardar = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* sem armazenamento */
  }
};
const evaNova = () => ({
  ox: mundo.OX_MAX,
  rocha: false,
  solo: 0,
  gelo: 0,
  anSolo: 0,
  anGelo: 0,
  cavados: {},
  saidas: 0,
  emergencias: 0,
});

const G = {
  ecra: "carregar",
  perfil: null,
  cat: null,
  vista: null,
  cod: null,
  partidas: [],
  saude: null,
  cosm: guardado("la_cosm", { char: "amelia", nave: "aurora" }),
  vistos: guardado("la_guia", {}),
  lobbyX: -4,
  lobbyVirado: false,
  lobbyAnda: false,
  rotaP: 0,
  rotaFora: 0,
  camY: 0,
  bloqueado: false,
  anim: null,
  local: "dentro",
  dentro: { x: 420, virado: false, anda: 0 },
  eva: evaNova(),
  pegadas: [],
  roverM: mundo.POS.rover,
  jog: {
    m: 2,
    y: 0,
    vy: 0,
    virado: false,
    anda: 0,
    aAndar: false,
    pe: 0,
    poeira: null,
    noAr: 0,
    ultimoSalto: 0,
    rover: false,
    cavar: 0,
    ferramenta: "pa",
  },
  tecla: { esq: 0, dir: 0, salto: 0 },
  ui: {
    auth: "entrar",
    dlg: null,
    modal: null,
    deltas: [],
    texto: "",
    interp: null,
    painel: null,
    msg: "",
    carga: null,
    convite: null,
    codigo: "",
    erro: "",
    intro: 0,
    guia: null,
    facto: "",
  },
  marcos: () => [0.33, 0.72],
  nomeDe: (id) => {
    const j = (G.vista ? G.vista.jogadores : []).find((x) => x.id === id);
    return j ? j.nickname || j.nome : "—";
  },
  outroChar: (id) => {
    const ks = Object.keys(PERSONAGENS).filter((k) => k !== G.cosm.char);
    let h = 0;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return ks[h % ks.length];
  },
  tempestade: (e) => !!e.desafio && e.desafio.id === "tempestade",
  // estado da superfície, tal como o servidor o define
  sup: () => (G.vista && G.vista.estado.superficie) || null,
  estaFora: (id) => {
    const s = G.sup();
    return !!(s && s.astronautas[id] && s.astronautas[id].local === "fora");
  },
  condutor: () => {
    const s = G.sup();
    return s ? s.rover.condutor : null;
  },
  oxigenio: () =>
    G.local === "fora"
      ? Math.max(0, G.eva.ox - (performance.now() - G.oxT) / 1000)
      : mundo.OX_MAX,
  oxT: 0,
};
window.__G = G;

// ───────────── API ─────────────
async function api(rota, corpo) {
  let r;
  try {
    r = await fetch("/api" + rota, {
      ...(corpo === undefined
        ? {}
        : { method: "POST", body: JSON.stringify(corpo) }),
      headers: { "Content-Type": "application/json", "X-Lang": I.lang },
      credentials: "same-origin",
    });
  } catch {
    const e = new Error(
      L("No connection to the server.", "Sem ligação ao servidor."),
    );
    e.status = 0;
    throw e;
  }
  let d = {};
  try {
    d = await r.json();
  } catch {
    /* vazio */
  }
  if (!r.ok) {
    const e = new Error(
      d.erro ||
        L("The server refused the request.", "O servidor recusou o pedido."),
    );
    e.status = r.status;
    throw e;
  }
  return d;
}
function aviso(txt, ms = 4500) {
  const d = document.createElement("div");
  d.className = "aviso";
  d.textContent = txt;
  $("#avisos").append(d);
  setTimeout(() => d.remove(), ms);
}
async function tentar(f) {
  try {
    return await f();
  } catch (e) {
    aviso(e.message);
    return null;
  }
}
async function cmd(acao, valor) {
  if (!G.vista || G.ocupado) return false;
  G.ocupado = true;
  try {
    aplicarVista(
      await api(`/partidas/${G.cod}/comandos`, {
        id: uid(),
        acao,
        valor,
        revisao: G.vista.revisao,
      }),
    );
    return true;
  } catch (e) {
    if (e.status === 409) {
      await actualizar();
      aviso(
        L(
          "The mission changed meanwhile. Check and try again.",
          "A partida mudou entretanto. Confirma e tenta de novo.",
        ),
      );
    } else aviso(e.message);
    return false;
  } finally {
    G.ocupado = false;
  }
}
// Comando que depende do sítio onde o astronauta está: primeiro envia a posição, depois o comando.
async function cmdAqui(acao, valor) {
  await actualizar();
  return cmd(acao, valor);
}
async function actualizar(pos) {
  if (!G.cod) return;
  const sup = G.ecra === "jogo" && G.vista && G.vista.estado.pouso != null;
  const x = pos
    ? pos[0]
    : sup
      ? mundo.xServidor(
          G.local === "fora" ? G.jog.m : mundo.porta(G.vista.estado),
        )
      : +G.lobbyX.toFixed(2);
  try {
    aplicarVista(
      await api(`/partidas/${G.cod}/presenca`, { x, z: pos ? pos[1] : 0 }),
    );
  } catch (e) {
    if (e.status === 401) {
      G.perfil = null;
      sairDaPartida();
      G.ecra = "auth";
      desenhar();
    }
  }
}
setInterval(() => {
  if (G.cod && !document.hidden) actualizar();
}, 2500);
const ausente = () => {
  if (G.cod)
    fetch(`/api/partidas/${G.cod}/ausente`, {
      method: "POST",
      body: "{}",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      credentials: "same-origin",
    });
};
addEventListener("pagehide", ausente);

// ───────────── estado da partida ─────────────
const REC = () => ({
  agua: L("Water", "Água"),
  comida: L("Food", "Comida"),
  oxigenio: L("Oxygen", "Oxigénio"),
  propulsante: L("Propellant", "Propulsante"),
  energia: L("Power", "Energia"),
  exposicao: L("Exposure", "Exposição"),
  margem: L("Margin", "Margem"),
  mobilidade: L("Mobility", "Mobilidade"),
});
function aplicarVista(v) {
  const ant = G.vista,
    e = v.estado,
    ea = ant ? ant.estado : null;
  G.vista = v;
  if (ea && ant.codigo === v.codigo) {
    const d = [];
    for (const k in REC()) {
      const a = ea.recursos[k],
        b = e.recursos[k];
      if (a != null && b != null && a !== b) d.push({ k, d: b - a });
    }
    if (d.length && ant.revisao !== v.revisao) G.ui.deltas = d;
    if (ea.fase === "preparacao_na_terra" && e.fase === "viagem") {
      G.anim = { tipo: "descolagem", t: 0, dur: 9 };
      G.rotaP = 0;
    }
    if (ea.pouso == null && e.pouso != null) {
      G.anim = { tipo: "aterragem", t: 0, dur: 8 };
      G.dentro.x = 420;
      G.jog.m = 2;
      G.pegadas = [];
    }
    const da = ea.desafio,
      dn = e.desafio;
    if (dn && (!da || da.id !== dn.id))
      G.ui.dlg = { id: dn.id, fase: "saber", t0: performance.now() };
    else if (dn && da && !da.recuperacao && dn.recuperacao)
      G.ui.dlg = {
        id: dn.id,
        fase: "risco",
        t0: performance.now(),
        consequencia: e.mensagem,
      };
    else if (!dn && da && !e.desfecho)
      G.ui.dlg = {
        id: da.id,
        fase: "ok",
        t0: performance.now(),
        conceito: e.mensagem,
        recuperada: da.recuperacao,
        titulo: da.titulo,
      };
    if (dn !== da) {
      G.ui.interp = null;
      G.ui.texto = "";
    }
    if (e.desfecho && !ea.desfecho) {
      G.ui.dlg = null;
      enviarResultado();
    }
  } else {
    G.ui.dlg = e.desafio
      ? {
          id: e.desafio.id,
          fase: e.desafio.recuperacao ? "risco" : "saber",
          t0: performance.now(),
          consequencia: e.mensagem,
        }
      : null;
    G.rotaP =
      e.fase === "viagem" ? cl(e.horas_rota / (e.duracao_horas || 1)) : 1;
    G.ui.deltas = [];
  }
  sincronizarSuperficie(v, !ea || ant.codigo !== v.codigo);
  if (G.ecra !== "intro")
    G.ecra = e.fase === "preparacao_na_terra" ? "lobby" : "jogo";
  const ass = JSON.stringify([
    v.revisao,
    v.jogadores.map((j) => [j.id, j.ligado]),
    G.ecra,
    G.local,
    I.lang,
    G.ui.modal,
  ]);
  if (ass !== G.assinatura) {
    G.assinatura = ass;
    desenhar();
  }
}
// Traje, oxigénio, amostras e rover são definidos no servidor (estado.superficie); aqui só se copia para desenhar.
function sincronizarSuperficie(v, primeira) {
  const e = v.estado,
    sup = e.superficie,
    meu = sup && sup.astronautas[v.eu],
    J = G.jog,
    antes = G.local,
    emAnt = G.eva.emergencias;
  G.local = meu && meu.local === "fora" ? "fora" : "dentro";
  G.eva = {
    ox: meu ? meu.oxigenio : mundo.OX_MAX,
    rocha: !!(meu && meu.leva.rocha),
    solo: meu ? meu.leva.solo : 0,
    gelo: meu ? meu.leva.gelo : 0,
    cavados: Object.fromEntries((sup ? sup.cavados : []).map((i) => [i, true])),
    anSolo: sup ? sup.amostras.solo : 0,
    anGelo: sup ? sup.amostras.gelo : 0,
    saidas: sup ? sup.saidas : 0,
    emergencias: sup ? sup.emergencias : 0,
  };
  G.oxT = performance.now();
  J.rover = !!sup && sup.rover.condutor === v.eu;
  if (!J.rover) G.roverM = sup ? sup.rover.m : mundo.POS.rover;
  if (primeira) {
    const eu = v.jogadores.find((j) => j.id === v.eu);
    if (G.local === "fora" && eu) J.m = eu.x * mundo.ESCALA;
    G.dentro.x = 420;
    return;
  }
  if (antes === "dentro" && G.local === "fora") {
    J.m = mundo.porta(e);
    J.y = 0;
    J.vy = 0;
  }
  if (antes === "fora" && G.local === "dentro") {
    G.dentro.x = 200;
    J.cavar = 0;
  }
  if (G.eva.emergencias > emAnt) G.ui.modal = "semAr";
}
async function abrirPartida(cod) {
  const v = await tentar(() => api("/partidas/" + cod));
  if (!v) return false;
  G.cod = cod;
  G.vista = null;
  G.assinatura = "";
  G.ui.dlg = null;
  G.ui.modal = null;
  G.anim = null;
  G.local = "dentro";
  G.eva = evaNova();
  G.pegadas = [];
  aplicarVista(v);
  return true;
}
function sairDaPartida() {
  G.cod = null;
  G.vista = null;
  G.ui.dlg = null;
  G.ui.modal = null;
  G.anim = null;
}
// Depois de entrar: retoma a última missão por terminar, ou cria uma nova, e vai directo ao lobby.
async function irLobby() {
  G.partidas = (await tentar(() => api("/partidas"))) || [];
  const aberta = G.partidas.find((p) => !p.desfecho);
  if (aberta && (await abrirPartida(aberta.codigo))) return;
  const r = await tentar(() => api("/partidas", {}));
  if (r) await abrirPartida(r.codigo);
}
async function depoisDeEntrar() {
  if (!G.vistos.intro) {
    G.ecra = "intro";
    G.ui.intro = 0;
    desenhar();
  } else {
    G.ecra = "carregar";
    desenhar();
    await irLobby();
  }
}
async function enviarResultado() {
  const e = G.vista.estado,
    rel = e.relatorio || {},
    ok = e.desfecho === "base_estabilizada",
    m = (rel.motivo || "").toLowerCase();
  const res = ok
    ? "ok"
    : m.includes("oxig")
      ? "ar"
      : m.includes("água")
        ? "agua"
        : m.includes("comida")
          ? "comida"
          : m.includes("exposi")
            ? "rad"
            : "traje";
  const r = e.recursos,
    lim = (x) => cl(+x || 0, 0, 150);
  try {
    await api("/sandbox/resultados", {
      chave: "missao-" + G.cod,
      destino: e.destino,
      resultado: res,
      estrelas: ok ? Math.max(1, rel.estrelas || 1) : 0,
      hora: cl((100 * e.horas) / (e.duracao_horas || 1), 0, 100),
      recursos: {
        ar: lim(r.oxigenio),
        agua: lim(r.agua),
        comida: lim(r.comida),
        energia: lim(r.energia),
        rad: lim(r.exposicao),
      },
      evas: [],
      causas: [String(rel.motivo || "").slice(0, 300)],
      comidaProduzida: 0,
      baseNivel: (e.montados || []).length,
      amostrasAnalisadas:
        (e.descobertas || []).length + ((rel.exploracao || {}).amostras || 0),
      diario: (e.historico || [])
        .slice(-40)
        .map((h) => String(h.mensagem).slice(0, 200)),
    });
  } catch {
   
  }
}

// ───────────── o guia (astronauta com balão de fala) ─────────────
function guiar(chave, en, pt) {
  if (G.vistos[chave] || (G.ui.guia && G.ui.guia.chave === chave)) return;
  G.ui.guia = { chave, en, pt };
}
function guiaDoMomento() {
  if (!G.vista || G.ui.modal || G.anim || G.ui.dlg) return;
  const e = G.vista.estado,
    mont = e.montados || [],
    faltas = Object.keys((e.carga_resumo || {}).faltas || {}).length;
  if (G.ecra === "lobby") {
    if (!e.destino)
      guiar(
        "destino",
        "Welcome to the lobby! First choose where we go. The Moon is 4 days away; Mars is 203 days away. The longer the trip, the more water, food and oxygen the crew needs.",
        "Bem-vindo ao lobby! Primeiro selecioana a localizacao. A Lua fica a 4 dias; Marte fica a 203 dias. Quanto mais longa a viagem, mais água, comida e oxigénio a tripulação precisa.",
      );
    else if (faltas)
      guiar(
        "carga",
        "Now open the System Scan. Each astronaut needs water, food and oxygen every day, and propellant is spent on manoeuvres. The ship has a mass limit and a volume limit, so you cannot take everything. Fill the minimum first, then add spares.",
        "Agora abre o Scan do sistema. Cada astronauta precisa de água, comida e oxigénio todos os dias, e o propulsante gasta-se nas manobras. A nave tem limite de massa e de volume, por isso não dá para levar tudo. Preenche primeiro o mínimo, depois junta reservas.",
      );
    else
      guiar(
        "lancar",
        "The plan is complete. You can change astronaut and ship, or invite a crewmate.",
        "Plano completo. Podes trocar de astronauta e de nave, ou convidar um colega.",
      );
  } else if (e.desfecho) {
    /* relatório */
  } else if (e.fase === "viagem")
    guiar(
      "viagem",
      "We are coasting towards the destination. Press Advance to go to the next waypoint: something may happen there. You can take the pilot seat; each correction burns 4 units of propellant, its beter to avoid waste.",
      "Estamos a caminho do destino. Clica em Avançar para ir ao próximo marco: pode acontecer alguma coisa. Podes assumir a pilotagem; cada correcção gasta 4 de propulsante, é melhor eitar desperdicios.",
    );
  else if (e.fase === "aproximacao" && e.pouso == null)
    guiar(
      "pouso",
      "Landing Time. Landing burns propellant, and the ground must be safe to land. Compare the two zones: one is cheaper in propellant, the other makes unloading slower.",
      "Hora de pousar. Pousar gasta propulsante e o terreno tem de ser seguro para pousar. Compara as duas zonas: uma gasta menos propulsante, a outra torna a descarga mais lenta.",
    );
  else if (e.pouso != null && G.local === "dentro") {
    if (!G.vistos.dentro)
      guiar(
        "dentro",
        "We are inside the lander. In here you don't need a suit. To go out, walk to the airlock: you put on the EVA suit and breathe from its tank. The tank lasts 5 minutes, so watch the timer.",
        "Estamos dentro da nave. Aqui não precisas de traje. Para sair, vai até à antecâmara: vestes o traje e respiras do tanque dele. O tanque dura 5 minutos, por isso controla o tempo.",
      );
    else if (e.fase === "instalacao" && mont.length === 1)
      guiar(
        "radio",
        "Communications equipment lives inside, where its safe from dust. Use the communications screen to install the module. Outside, only the antenna tower appears.",
        "O equipamento de comunicações fica cá dentro, onde esta seguro da poeira. Usa o ecrã de comunicações para instalar o módulo. Lá fora só aparece a torre da antena.",
      );
    else if (e.fase === "operacao")
      guiar(
        "operacao",
        "The base is working. Mission control sends the next task through the communications screen. Bring samples to the lab bench, and check the terrain map before a long walk.",
        "A base está a funcionar. O controlo de missão envia a próxima tarefa pelo ecrã de comunicações. Traz amostras para a bancada do laboratório e vê o mapa do terreno antes de uma caminhada longa.",
      );
  } else if (e.pouso != null && G.local === "fora") {
    if (!G.vistos.fora)
      guiar(
        "fora",
        e.destino === "lua"
          ? "You are in Lunar Soil. The Moon has no air: black sky, hard shadows, and gravity one sixth of Earth, so jumps are high and slow. Signs show the distance to the base. Go back inside before the suit oxygen runs out."
          : "You are in Martian Soil. Mars has thin air: a butterscotch sky, haze, wind and dust. Gravity is about one third of Earth. Signs show the distance to the base. Go back inside before the suit oxygen runs out.",
        e.destino === "lua"
          ? "Estás em solo Lunar. A Lua não tem ar: céu preto, sombras duras e gravidade de um sexto da Terra, por isso os saltos são altos e lentos. As placas mostram a distância à base. Volta antes de o oxigénio do traje acabar."
          : "Estás em Solo Marciano. Marte tem ar fino: céu cor de caramelo, neblina, vento e poeira. A gravidade é cerca de um terço da Terra. As placas mostram a distância à base. Volta antes de o oxigénio do traje acabar.",
      );
    else if (e.fase === "instalacao" && !e.descarregada)
      guiar(
        "descarregar",
        "First unload the cargo next to the lander. Nothing can be built while the modules are still on board.",
        "Primeiro descarrega a carga ao lado da nave. Nada se monta enquanto os módulos estiverem a bordo.",
      );
    else if (e.fase === "instalacao" && mont.length === 0)
      guiar(
        "energia",
        "Power comes first: without electricity, radio and life support do not work. Solar panels stay outside, facing the Sun.",
        "A energia vem primeiro: sem electricidade, o rádio e o suporte de vida não funcionam. Os painéis solares ficam cá fora, virados para o Sol.",
      );
    else if (e.fase === "instalacao" && mont.length === 2)
      guiar(
        "habitat",
        "Last module: the habitat. It is a sealed, pressurised home. After it is assembled, the seal and life support are tested before anyone takes off the suit.",
        "Último módulo: o habitat. É uma casa selada e pressurizada. Depois de montado, testa-se a vedação e o suporte de vida antes de alguém tirar o traje.",
      );
    else if (e.fase === "operacao")
      guiar(
        "explorar",
        "Now explore. Chip the big rock with the pick, plant the beacon, survey the depression from its rim, and dig where you see a cross. The rover is three times faster than walking, but it does not refill your oxygen.",
        "Agora explora. Tira uma amostra da rocha grande com a picareta, fixa a baliza, regista a depressão a partir da borda e cava onde vires uma cruz. O rover é três vezes mais rápido do que andar, mas não repõe o oxigénio.",
      );
  }
}

// ───────────── acções (data-a) ─────────────
const A = {
  async lingua() {
    mudarLingua();
    desenhar();
    try {
      G.cat = await api("/catalogo");
      mundo.configurar(G.cat.superficie);
    } catch {
      /* fica o catálogo anterior */
    }
    if (G.cod) await actualizar();
    desenhar();
  },
  async entrar() {
    const p = await tentar(() =>
      api("/conta/entrar", {
        email: $("#f-email").value.trim(),
        senha: $("#f-senha").value,
      }),
    );
    if (!p) return;
    G.perfil = p;
    await depoisDeEntrar();
  },
  async pedir() {
    const idade = parseInt($("#f-idade").value, 10),
      r = await tentar(() =>
        api("/conta/pedir-confirmacao", {
          email: $("#f-email").value.trim(),
          idade,
        }),
      );
    if (!r) return;
    G.ui.msg = r.modo_local
      ? L(
          'Request saved. In local mode the link is written to a file in backend/emails_demo: open it and copy the code after "#confirmar=".',
          "Pedido registado. Em modo local o link fica num ficheiro em backend/emails_demo: abre-o e copia o código depois de «#confirmar=».",
        )
      : L(
          "We sent a link to your email. Open it to continue.",
          "Enviámos um link para o teu email. Abre-o para continuar.",
        );
    G.ui.auth = "confirmar";
    desenhar();
  },
  async confirmar() {
    const nick = $("#f-nick").value.trim();
    const r = await tentar(() =>
      api("/conta/confirmar", {
        codigo: $("#f-cod").value.trim(),
        nome: $("#f-nome").value.trim(),
        idade: parseInt($("#f-idade").value, 10),
        senha: $("#f-senha").value,
        nickname: nick || null,
      }),
    );
    if (!r) return;
    history.replaceState(null, "", location.pathname);
    G.ui.msg = L(
      "Account created. Sign in with your email and password.",
      "Conta criada. Entra com o teu email e a palavra-passe.",
    );
    G.ui.auth = "entrar";
    desenhar();
  },
  async autorizar() {
    const r = await tentar(() =>
      api("/conta/autorizar", { codigo: G.ui.codigo, aceite: true }),
    );
    if (r) {
      history.replaceState(null, "", location.pathname);
      G.ui.msg = L(
        "Permission recorded. The player can now play in a team.",
        "Autorização registada. O jogador já pode jogar em equipa.",
      );
      G.ui.auth = "entrar";
      desenhar();
    }
  },
  aba(d) {
    G.ui.auth = d.v;
    G.ui.msg = "";
    desenhar();
  },
  async sair() {
    ausente();
    await tentar(() => api("/conta/sair", {}));
    G.perfil = null;
    sairDaPartida();
    G.ecra = "auth";
    desenhar();
  },
  introSeg() {
    G.ui.intro++;
    if (G.ui.intro >= INTRO().length) A.introFim();
    else desenhar();
  },
  introAnt() {
    G.ui.intro = Math.max(0, G.ui.intro - 1);
    desenhar();
  },
  async introFim() {
    G.vistos.intro = 1;
    guardar("la_guia", G.vistos);
    if (G.cod && G.vista) {
      G.ecra = G.vista.estado.fase === "preparacao_na_terra" ? "lobby" : "jogo";
      desenhar();
    } else {
      G.ecra = "carregar";
      desenhar();
      await irLobby();
    }
  },
  comoJogar() {
    G.ui.modal = null;
    G.ecra = "intro";
    G.ui.intro = 0;
    desenhar();
  },
  guiaOk() {
    if (G.ui.guia) {
      G.vistos[G.ui.guia.chave] = 1;
      guardar("la_guia", G.vistos);
      G.ui.guia = null;
      desenhar();
    }
  },
  async nova() {
    ausente();
    const r = await tentar(() => api("/partidas", {}));
    if (r) await abrirPartida(r.codigo);
  },
  async abrir(d) {
    ausente();
    await abrirPartida(d.v);
  },
  async usarConvite() {
    const [codigo, convite] = $("#f-conv").value.trim().split(":");
    const r = await tentar(() =>
      api("/convites/usar", {
        codigo: (codigo || "").trim(),
        convite: (convite || "").trim(),
      }),
    );
    if (r) {
      ausente();
      await abrirPartida(r.codigo);
    }
  },
  async nick() {
    const r = await tentar(() =>
      api("/conta/nickname", { nickname: $("#f-nick").value.trim() }),
    );
    if (r) {
      G.perfil = r;
      desenhar();
    }
  },
  async consentimento() {
    const r = await tentar(() =>
      api("/conta/consentimento", { email: $("#f-resp").value.trim() }),
    );
    if (r)
      aviso(
        r.modo_local
          ? L(
              "Request saved. In local mode the link is in backend/emails_demo.",
              "Pedido registado. Em modo local o link fica em backend/emails_demo.",
            )
          : L(
              "Request sent to the guardian.",
              "Pedido enviado ao responsável.",
            ),
        7000,
      );
  },
  async modal(d) {
    G.ui.modal = d.v || null;
    G.ui.facto = "";
    if (d.v === "carga") G.ui.carga = { ...(G.vista.estado.carga || {}) };
    if (d.v === "ranking") {
      desenhar();
      G.ui.rank = await tentar(() => api("/sandbox/ranking"));
      G.ui.meus = await tentar(() => api("/sandbox/resultados"));
    }
    if (d.v === "missoes") {
      desenhar();
      G.partidas = (await tentar(() => api("/partidas"))) || [];
    }
    desenhar();
  },
  fechar() {
    G.ui.modal = null;
    desenhar();
  },
  // lobby
  destino(d) {
    cmd("destino", d.v);
  },
  nave(d) {
    const ks = Object.keys(INFO_NAVES),
      i = ks.indexOf(G.cosm.nave);
    G.cosm.nave = ks[(i + +d.v + ks.length) % ks.length];
    guardar("la_cosm", G.cosm);
    desenhar();
  },
  char(d) {
    G.cosm.char = d.v;
    guardar("la_cosm", G.cosm);
    G.ui.modal = null;
    desenhar();
  },
  qt(d) {
    const c = G.ui.carga;
    c[d.k] = Math.max(0, (c[d.k] || 0) + +d.v);
    desenhar();
  },
  minimo() {
    const m = G.cat.destinos[G.vista.estado.destino].minimo;
    G.ui.carga = { ...G.ui.carga };
    for (const k in m) G.ui.carga[k] = Math.max(G.ui.carga[k] || 0, m[k]);
    desenhar();
  },
  async aplicarCarga() {
    if (await cmd("carga", G.ui.carga)) {
      G.ui.modal = null;
      desenhar();
    }
  },
  async convidar() {
    const r = await tentar(() => api(`/partidas/${G.cod}/convites`, {}));
    if (r) {
      G.ui.convite = G.cod + ":" + r.convite;
      G.ui.modal = "convite";
      desenhar();
    }
  },
  copiar() {
    navigator.clipboard?.writeText(G.ui.convite).then(
      () => aviso(L("Invite copied.", "Convite copiado.")),
      () => aviso(L("Copy the text by hand.", "Copia o texto à mão.")),
    );
  },
  pronto() {
    cmd("pronto");
  },
  lancar() {
    cmd("lancar");
  },
  // viagem e incidentes
  avancar() {
    G.ui.modal = null;
    cmd("avancar");
  },
  assumir() {
    cmd("assumir_posto");
  },
  libertar() {
    cmd("libertar_posto");
  },
  ajustar(d) {
    cmd("ajustar_rota", +d.v);
  },
  pousar(d) {
    cmd("pousar", +d.v);
  },
  percebi() {
    if (G.ui.dlg) {
      G.ui.dlg.fase = "problema";
      desenhar();
    }
  },
  responder(d) {
    G.ui.deltas = [];
    cmd("responder", d.v);
  },
  async interpretar() {
    const texto = $("#f-plano").value;
    G.ui.texto = texto;
    const r = await tentar(() =>
      api(`/partidas/${G.cod}/interpretar`, {
        texto,
        revisao: G.vista.revisao,
        lang: I.lang,
      }),
    );
    if (!r) return;
    if (!r.opcao) {
      aviso(
        L(
          "Mission control did not understand the plan. Describe the manoeuvre with the words of the signal, without negatives.",
          "O controlo de missão não percebeu o plano. Descreve a manobra com as palavras do sinal, sem negações.",
        ),
        6000,
      );
      return;
    }
    G.ui.interp = r;
    desenhar();
  },
  reescrever() {
    G.ui.interp = null;
    desenhar();
  },
  retirada() {
    cmd("retirada");
  },
  continuar() {
    G.ui.dlg = null;
    G.ui.deltas = [];
    desenhar();
  },
  painel(d) {
    G.ui.painel = G.ui.painel === d.v ? null : d.v;
    desenhar();
  },
  usar() {
    usar();
  },
  // dentro da base
  async instalarRadio() {
    if (await cmd("instalar", "radio")) {
      G.ui.modal = null;
      desenhar();
    }
  },
  async analisarRocha() {
    if (await cmd("analisar", "rocha")) {
      G.ui.facto = G.vista.estado.mensagem;
      desenhar();
    }
  },
  async analisarSolo() {
    if (!(await cmd("analisar", "solo"))) return;
    const M = G.vista.estado.destino === "marte";
    G.ui.facto = M
      ? L(
          "Mars soil: rusty dust. Iron oxide gives Mars its colour. It also contains perchlorate salts, which are toxic, so it cannot be used to grow food without treatment.",
          "Solo de Marte: poeira enferrujada. O óxido de ferro dá a cor a Marte. Também tem sais de perclorato, que são tóxicos, por isso não serve para cultivar sem tratamento.",
        )
      : L(
          "Moon soil (regolith): sharp, glassy grains made by meteorite impacts over billions of years. It has no air or water in it, and it sticks to everything.",
          "Solo lunar (regolito): grãos afiados e vítreos feitos por impactos de meteoritos durante milhares de milhões de anos. Não tem ar nem água e cola-se a tudo.",
        );
    desenhar();
  },
  async analisarGelo() {
    if (!(await cmd("analisar", "gelo"))) return;
    G.ui.facto = L(
      "Water ice confirmed! After extraction and treatment, ice can become drinking water, breathing oxygen and even rocket propellant.",
      "Gelo de água confirmado! Depois de extraído e tratado, o gelo pode dar água para beber, oxigénio para respirar e até propulsante.",
    );
    desenhar();
  },
};
document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-a]");
  if (el && !el.disabled && A[el.dataset.a]) {
    ev.preventDefault();
    A[el.dataset.a](el.dataset);
  }
});
document.addEventListener("input", (ev) => {
  if (ev.target.id === "f-plano") G.ui.texto = ev.target.value;
  if (ev.target.dataset.qk)
    G.ui.carga[ev.target.dataset.qk] = Math.max(
      0,
      parseInt(ev.target.value, 10) || 0,
    );
});
document.addEventListener("change", (ev) => {
  if (ev.target.dataset.qk) desenhar();
});

// Tecla E / botão de acção: usa o que estiver mais perto.
function depois(seg, f) {
  const cod = G.cod;
  setTimeout(() => {
    if (G.cod === cod) f();
  }, seg * 1000);
}
function usar() {
  if (
    !G.vista ||
    G.bloqueado ||
    G.anim ||
    G.ocupado ||
    G.ecra !== "jogo" ||
    G.vista.estado.pouso == null
  )
    return;
  const J = G.jog;
  if (G.local === "dentro") {
    const s = mundo.estacaoPerto(G);
    if (!s) return;
    if (s.id === "saida") cmdAqui("sair_base");
    else {
      G.ui.modal = "est:" + s.id;
      G.ui.facto = "";
      desenhar();
    }
    return;
  }
  if (J.cavar > 0) return;
  const it = mundo.interaccoes(G)[0];
  if (!it) return;
  const ferramenta = (seg, qual, f) => {
    J.cavar = seg;
    J.ferramenta = qual;
    depois(seg, f);
  };
  if (it.id === "entrar") cmdAqui("entrar_base");
  else if (it.id === "rover")
    cmdAqui("rover", "entrar").then((ok) => {
      if (ok) {
        J.m = G.roverM;
        J.y = 0;
      }
    });
  else if (it.id === "sairRover")
    cmdAqui("rover", "sair").then((ok) => {
      if (ok) J.m += 1.6;
    });
  else if (it.id === "descarregar") cmd("descarregar");
  else if (it.id === "energia") cmd("instalar", "energia");
  else if (it.id === "habitat") cmd("instalar", "habitat");
  else if (it.id === "rocha")
    ferramenta(2.2, "picareta", async () => {
      if (await cmdAqui("recolher", "rocha"))
        aviso(
          L(
            "Rock sample collected. Analyse it at the lab bench inside the base.",
            "Amostra de rocha recolhida. Analisa-a na bancada do laboratório, dentro da base.",
          ),
          6000,
        );
    });
  else if (it.id === "baliza")
    ferramenta(1.8, "pa", () => cmdAqui("explorar", "baliza"));
  else if (it.id === "cratera")
    ferramenta(1.8, "picareta", () => cmdAqui("explorar", "cratera"));
  else if (it.id.startsWith("cavar")) {
    const i = +it.id.slice(5),
      q = mundo.ESCAVAR[i];
    ferramenta(2.5, "pa", async () => {
      if (await cmdAqui("recolher", i))
        aviso(
          q.tipo === "gelo"
            ? L(
                "You dug up something bright: maybe ice. Take it to the lab.",
                "Desenterraste algo brilhante: talvez gelo. Leva-o ao laboratório.",
              )
            : L(
                "Soil sample collected. Take it to the lab.",
                "Amostra de solo recolhida. Leva-a ao laboratório.",
              ),
          5000,
        );
    });
  }
}

// ───────────── desenho da interface (HTML) ─────────────
const barra = (v, max, cor) =>
  `<span class="barra"><i style="width:${cl((100 * v) / (max || 1), 0, 100)}%;background:${cor}"></i></span>`;
const bLingua = () =>
  `<button class="qb" data-a="lingua" aria-label="${L("Mudar para português", "Switch to English")}">${L("PT", "EN")}</button>`;
const NIVEL = (n) =>
  ({
    cadete: L("Cadet", "Cadete"),
    piloto: L("Pilot", "Piloto"),
    comandante: L("Commander", "Comandante"),
  })[n] || n;
function desenhar() {
  const ui = $("#ui"),
    md = $("#modal");
  let h = "",
    m = "";
  guiaDoMomento();
  if (G.ecra === "carregar")
    h = `<div class="p" style="left:440px;top:300px;width:400px;text-align:center"><div class="px" style="font-size:28px">${L("Connecting to mission control…", "A ligar ao controlo de missão…")}</div></div>`;
  else if (G.ecra === "erro")
    h = `<div class="p" style="left:340px;top:260px;width:600px"><div class="px" style="font-size:28px">${L("No connection to the backend", "Sem ligação ao backend")}</div><p class="sub">${esc(G.ui.erro)}</p><p class="sub">${L("Start the server with <b>python run.py</b> inside the backend folder and open <b>http://127.0.0.1:8000</b>.", "Arranca o servidor com <b>python run.py</b> dentro da pasta backend e abre <b>http://127.0.0.1:8000</b>.")}</p><button onclick="location.reload()">${L("Try again", "Tentar de novo")}</button></div>`;
  else if (G.ecra === "auth") h = hAuth();
  else if (G.ecra === "intro") h = hIntro();
  else if (G.ecra === "lobby" && G.vista) h = hLobby();
  else if (G.ecra === "jogo" && G.vista) h = hJogo();
  if (G.ui.modal) m = hModal();
  else if (G.ecra === "jogo" && G.vista && !G.anim) {
    const e = G.vista.estado;
    if (e.desfecho) m = hRelatorio();
    else if (G.ui.dlg) m = hIncidente();
  }
  if (!m && G.ui.guia && (G.ecra === "lobby" || G.ecra === "jogo") && !G.anim)
    h += G.ecra === "lobby" ? hGuia(304, 396, 648) : hGuia(96, 230, 820);
  ui.innerHTML = h;
  md.innerHTML = m;
  G.bloqueado = !!m;
  const tp = $("#f-plano");
  if (tp) tp.value = G.ui.texto;
  minis();
  G.hud = "";
}
function minis() {
  document.querySelectorAll("canvas[data-nave]").forEach((cv) => {
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, cv.width, cv.height);
    nave(
      c,
      cv.width / 2 + 8,
      cv.height / 2,
      +cv.dataset.s || 2,
      0,
      1,
      0,
      cv.dataset.nave,
      0,
    );
  });
  document.querySelectorAll("canvas[data-char]").forEach((cv) => {
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, cv.width, cv.height);
    astro(
      c,
      4,
      2,
      +cv.dataset.s || 4,
      cv.dataset.char,
      cv.dataset.traje || "cabine",
      cv.dataset.cap === "1",
    );
  });
  const mp = $("#mapa");
  if (mp) mundo.desenharMapa(mp.getContext("2d"), mp.width, mp.height, G);
}
// O guia: uma astronauta em baixo, com balão de fala.
function balao(txt, botoes) {
  return `<div class="guia"><canvas data-char="nyeleti" data-traje="voo" data-s="5" width="88" height="140" aria-hidden="true"></canvas><div class="bal"><div class="t" style="margin-bottom:4px"><span class="teal">${L("Nia · your guide", "Nia · a tua guia")}</span></div><div style="font-size:15px;line-height:1.5">${txt}</div><div class="lin" style="margin-top:10px">${botoes}</div></div></div>`;
}
function hGuia(baixo, esq, larg) {
  const g = G.ui.guia;
  return `<div style="position:absolute;left:${esq}px;bottom:${baixo}px;width:${larg}px;z-index:4">${balao(esc(L(g.en, g.pt)), `<button class="sel" data-a="guiaOk">${L("Got it", "Percebi")}</button>`)}</div>`;
}

const INTRO = () => [
  [
    L("Hi! I am Nia, your flight guide.", "Olá! Sou a Nia, a tua guia de voo."),
    L(
      "Little Astronauts is a space mission simulator. You prepare a trip, fly to the Moon or Mars, and build a base where people can live. It is a game, but the problems are the ones real astronauts train for.",
      "O Little Astronauts é um simulador de missões espaciais. Preparas uma viagem, voas até à Lua ou a Marte e montas uma base onde se pode viver. É um jogo, mas os problemas são os que os astronautas de verdade treinam.",
    ),
  ],
  [
    L("1 · The lobby", "1 · O lobby"),
    L(
      "Every mission starts in the lobby. You choose the destination, load water, food, oxygen, propellant and equipment, pick your astronaut and ship, and can invite one crewmate. Then you launch.",
      "Cada missão começa no lobby. Escolhes o destino, carregas água, comida, oxigénio, propulsante e equipamento, escolhes o astronauta e a nave, e podes convidar um colega. Depois lanças.",
    ),
  ],
  [
    L("2 · The trip", "2 · A viagem"),
    L(
      "On the way, incidents happen. Before every decision I explain the science you need. Then you choose what to do. A safe choice protects the reserves; a risky one costs something, and I show you why.",
      "Pelo caminho acontecem incidentes. Antes de cada decisão eu explico a ciência de que precisas. Depois escolhes o que fazer. Uma escolha segura protege as reservas; uma arriscada custa alguma coisa, e eu mostro porquê.",
    ),
  ],
  [
    L("3 · The surface", "3 · A superfície"),
    L(
      "Inside the base you breathe its air and wear no suit. Outside you wear the EVA suit and breathe from its tank, which lasts 5 minutes. Explore the terrain with the rover, the shovel, the pick and the scanner, and bring samples back to the lab.",
      "Dentro da base respiras o ar dela e não usas traje. Lá fora usas o traje e respiras do tanque, que dura 5 minutos. Explora o terreno com o rover, a pá, a picareta e o scanner, e traz amostras para o laboratório.",
    ),
  ],
  [
    L("How to play", "Como se joga"),
    L(
      "Walk with the arrow keys or A and D. Jump with the space bar. Press E to use what is next to you. Your level comes from your age: Cadets get hints, Pilots compare two options, Commanders write their own plan. Ready?",
      "Anda com as setas ou com A e D. Salta com a barra de espaço. Carrega em E para usar o que está ao teu lado. O teu nível vem da idade: os Cadetes têm pistas, os Pilotos comparam duas opções, os Comandantes escrevem o seu plano. Vamos?",
    ),
  ],
];
function hIntro() {
  const s = INTRO(),
    i = G.ui.intro,
    ult = i === s.length - 1;
  return `<div style="position:absolute;right:24px;top:20px">${bLingua()}</div><div style="position:absolute;left:70px;top:70px;width:700px"><div class="px teal" style="letter-spacing:3px;font-size:16px">${L("INTRODUCTION", "INTRODUÇÃO")} · ${i + 1}/${s.length}</div><div class="px" style="font-size:56px;font-weight:700;line-height:1;color:#fff;margin-top:8px">${esc(s[i][0])}</div></div>
  <div style="position:absolute;left:150px;bottom:60px;width:980px">${balao(esc(s[i][1]), `${i ? `<button data-a="introAnt">◄ ${L("Back", "Anterior")}</button>` : ""}<button class="pri" data-a="introSeg">${ult ? L("START ►", "COMEÇAR ►") : L("NEXT ►", "SEGUINTE ►")}</button>${ult ? "" : `<button data-a="introFim">${L("Skip", "Saltar")}</button>`}`)}</div>`;
}

function hAuth() {
  const a = G.ui.auth,
    msg = G.ui.msg ? `<p class="sub teal">${esc(G.ui.msg)}</p>` : "";
  let f;
  if (a === "autorizar")
    f = `<h2 class="px" style="margin:0 0 8px">${L("Guardian permission", "Autorização do responsável")}</h2><p class="sub">${L("A player under 15 asked to play in a team. In a team, two players share one mission. No contact details are exchanged.", "Um jogador com menos de 15 anos pediu para jogar em equipa. Em equipa, dois jogadores partilham uma missão. Não são trocados contactos.")}</p><button class="pri" data-a="autorizar">${L("I allow it", "Autorizo")}</button>`;
  else if (a === "entrar")
    f = `<label for="f-email">Email</label><input id="f-email" type="email" autocomplete="username"><label for="f-senha">${L("Password", "Palavra-passe")}</label><input id="f-senha" type="password" autocomplete="current-password"><div class="lin" style="margin-top:14px"><button class="pri" data-a="entrar">${L("SIGN IN", "ENTRAR")}</button></div>`;
  else if (a === "criar")
    f = `<p class="sub">${L("Step 1 of 2. Minimum age:", "Passo 1 de 2. Idade mínima:")} ${G.politica ? G.politica.idade_minima : 15}.</p><label for="f-email">Email</label><input id="f-email" type="email"><label for="f-idade">${L("Age", "Idade")}</label><input id="f-idade" type="number" min="8" max="120"><div class="lin" style="margin-top:14px"><button class="pri" data-a="pedir">${L("GET LINK", "PEDIR LINK")}</button><button data-a="aba" data-v="confirmar">${L("I have the code", "Já tenho o código")}</button></div>`;
  else
    f = `<p class="sub">${L("Step 2 of 2. Age sets the level: 8–11 Cadet (with hints), 12–14 Pilot, 15+ Commander (written answer).", "Passo 2 de 2. A idade define o nível: 8–11 Cadete (com pistas), 12–14 Piloto, 15+ Comandante (resposta escrita).")}</p><label for="f-cod">${L("Code from the link", "Código do link")}</label><input id="f-cod" value="${esc(G.ui.codigo)}"><label for="f-nome">${L("Astronaut name", "Nome de astronauta")}</label><input id="f-nome" maxlength="24"><div class="lin"><div style="flex:1"><label for="f-idade">${L("Age", "Idade")}</label><input id="f-idade" type="number" min="8" max="120"></div><div style="flex:2"><label for="f-nick">${L("Nickname for the ranking (optional)", "Nickname para o ranking (opcional)")}</label><input id="f-nick" maxlength="20"></div></div><label for="f-senha">${L("Password (12 characters or more)", "Palavra-passe (12 caracteres ou mais)")}</label><input id="f-senha" type="password" autocomplete="new-password"><div class="lin" style="margin-top:14px"><button class="pri" data-a="confirmar">${L("CREATE ACCOUNT", "CRIAR CONTA")}</button></div>`;
  return `<div style="position:absolute;right:24px;top:20px">${bLingua()}</div><div style="position:absolute;left:70px;top:150px;width:520px"><div class="px teal" style="letter-spacing:3px;font-size:16px">NASA SPACE APPS · MAPUTO</div><div class="px" style="font-size:72px;font-weight:700;line-height:.95;color:#fff;margin-top:8px">LITTLE<br>ASTRONAUTS</div><p class="sub" style="font-size:17px;max-width:440px">${L("Prepare the mission, lift off, solve the incidents of the trip and build a base on the Moon or on Mars.", "Prepara a missão, descola, resolve os incidentes da viagem e monta uma base na Lua ou em Marte.")}</p></div>
  <div class="p" style="left:720px;top:120px;width:460px"><div class="lin" style="margin-bottom:10px"><button data-a="aba" data-v="entrar" class="${a === "entrar" ? "sel" : ""}">${L("Sign in", "Entrar")}</button><button data-a="aba" data-v="criar" class="${a === "criar" || a === "confirmar" ? "sel" : ""}">${L("Create account", "Criar conta")}</button></div>${msg}${f}</div>`;
}

const topo = (extra = "") =>
  `<span class="lin">${extra}<button class="qb" data-a="modal" data-v="missoes">${L("Missions", "Missões")}</button><button class="qb" data-a="modal" data-v="ranking">Ranking</button><button class="qb" data-a="modal" data-v="eva">NASA</button><button class="qb" data-a="comoJogar">${L("How to play", "Como jogar")}</button>${bLingua()}<button class="qb" data-a="sair">${L("Sign out", "Sair")}</button></span>`;
function medidas(carga) {
  let kg = 0,
    l = 0;
  for (const k in carga) {
    kg += G.cat.carga[k].kg * carga[k];
    l += G.cat.carga[k].litros * carga[k];
  }
  return { kg, l };
}
function hLobby() {
  const v = G.vista,
    e = v.estado,
    host = v.anfitriao,
    d = e.destino,
    perfil = d ? destinoTxt(d, G.cat.destinos[d]) : null,
    cr = e.carga_resumo,
    faltas = Object.keys(cr.faltas || {}).length;
  const pronto = (e.prontos || []).includes(v.eu),
    ligados = v.jogadores.filter((j) => j.ligado),
    todos =
      v.jogadores.length === 1 ||
      (ligados.length === v.jogadores.length &&
        ligados.every((j) => e.prontos.includes(j.id)));
  const podeLancar = host && d && !faltas && todos,
    c = e.carga || {},
    R2 = REC();
  const equip = [
    "ferramentas",
    "pecas",
    "filtro",
    "bateria",
    "energia",
    "radio",
    "habitat",
    "rover",
  ].reduce((s, k) => s + (c[k] || 0) * G.cat.carga[k].kg, 0);
  const chk = (ok, txt, dir) =>
    `<div class="chk ${ok ? "on" : ""}"><span>${txt}</span><span class="${ok ? "teal" : "ama"}">${dir}</span></div>`;
  const lin = (k, cor) =>
    `<div class="lin"><span style="width:86px;color:${cor}">■ ${R2[k]}</span>${barra(c[k] || 0, perfil.minimo[k], cor)}<span>${c[k] || 0}/${perfil.minimo[k]}</span></div>`;
  return `
  <div style="position:absolute;left:0;top:0;width:1280px;height:52px;background:var(--painel);border-bottom:2px solid var(--borda);display:flex;align-items:center;justify-content:space-between;padding:0 20px">
    <span class="px" style="font-size:22px;font-weight:700;letter-spacing:2px">LITTLE ASTRONAUTS</span>${topo('<button class="sel qb">Lobby</button>')}
    <span class="sub">${L("Room", "Sala")} <b class="px ama" style="font-size:16px;letter-spacing:1px">${esc(v.codigo)}</b></span></div>
  <div style="position:absolute;left:24px;top:70px;width:360px">
    <span style="border:2px solid var(--borda);background:var(--painel);padding:4px 10px;font-size:11px;letter-spacing:1px"><span class="sub">${L("STATUS", "ESTADO")} </span><b class="${podeLancar ? "teal" : "ama"}">${podeLancar ? L("READY", "PRONTO") : L("PREPARING", "A PREPARAR")}</b></span>
    <div class="px" style="font-size:54px;font-weight:700;line-height:.95;color:#fff;margin-top:14px">${L("PREPARE.<br>LIFT OFF.", "PREPARA.<br>DESCOLA.")}<br><span class="teal">${L("SURVIVE.", "SOBREVIVE.")}</span></div>
    <p class="sub" style="margin:12px 0">${esc(srv(e.mensagem))}</p>
    <div class="lin">${host ? `<button class="pri" data-a="lancar" ${podeLancar ? "" : "disabled"}>${L("LAUNCH MISSION ↗", "LANÇAR MISSÃO ↗")}</button>` : `<button class="pri" data-a="pronto" ${pronto || !d || faltas ? "disabled" : ""}>${pronto ? L("READY ✓", "PRONTO ✓") : L("I AM READY", "ESTOU PRONTO")}</button>`}<button data-a="modal" data-v="char">${L("Change astronaut", "Trocar personagem")}</button></div>
    <p class="sub" style="margin-top:8px"><span class="tecla">←</span> <span class="tecla">→</span> ${L("walk around the hangar", "anda pelo hangar")}</p></div>
  <div style="position:absolute;left:1056px;top:70px;width:200px" class="col">
    <div class="p" style="position:static;text-align:center"><div class="px" style="font-size:30px">${v.jogadores.length}/2</div><div class="t" style="justify-content:center;margin:0">${L("Crew", "Tripulação")}</div></div>
    <div class="p" style="position:static;text-align:center"><div class="px" style="font-size:30px">${perfil ? Math.round((100 * cr.kg) / perfil.limite_kg) : 0}%</div><div class="t" style="justify-content:center;margin:0">${L("Cargo", "Carga")}</div></div>
    <div class="p" style="position:static;text-align:center"><div class="px ama" style="font-size:30px">${perfil ? Math.round(perfil.horas / 24) + " d" : "—"}</div><div class="t" style="justify-content:center;margin:0">${L("Trip", "Viagem")}</div></div></div>
  <div class="p" style="left:24px;top:436px;width:296px;height:268px"><div class="t"><span>${L("Ship", "Nave")}</span><span>${Object.keys(INFO_NAVES).indexOf(G.cosm.nave) + 1}/4</span></div>
    <canvas class="mini" data-nave="${G.cosm.nave}" data-s="2.6" width="264" height="110"></canvas>
    <div class="lin" style="justify-content:space-between;margin-top:8px"><span class="px" style="font-size:20px">${INFO_NAVES[G.cosm.nave].nome}</span><span class="lin"><button class="qb" data-a="nave" data-v="-1" aria-label="${L("Previous ship", "Nave anterior")}">‹</button><button class="qb" data-a="nave" data-v="1" aria-label="${L("Next ship", "Nave seguinte")}">›</button></span></div>
    <div class="sub">${perfil ? L(`Capacity for this mission: ${perfil.limite_kg} kg and ${perfil.limite_l} L.`, `Capacidade desta missão: ${perfil.limite_kg} kg e ${perfil.limite_l} L.`) : L("Stands up to lift off and land, lies down to travel.", "De pé para descolar e aterrar, deitada para viajar.")}</div></div>
  <div class="p" style="left:336px;top:436px;width:296px;height:268px"><div class="t"><span>${L("Destination", "Destino")}</span><span>${perfil ? perfil.horas + " h" : ""}</span></div>
    <div class="lin"><button data-a="destino" data-v="lua" class="${d === "lua" ? "sel" : ""}" ${host ? "" : "disabled"}>${L("Moon", "Lua")}</button><button data-a="destino" data-v="marte" class="${d === "marte" ? "sel" : ""}" ${host ? "" : "disabled"}>${L("Mars", "Marte")}</button><span class="sub">${d ? "g = " + (d === "lua" ? "1.62" : "3.71") + " m/s²" : ""}</span></div>
    <p class="sub" style="margin:10px 0 6px">${perfil ? esc(perfil.rota) : L("The host chooses where we go.", "O anfitrião escolhe para onde vamos.")}</p><p class="sub" style="font-size:12px">${perfil ? L("Reference: ", "Referência: ") + esc(perfil.referencia) : ""}</p></div>
  <div class="p" style="left:648px;top:436px;width:296px;height:268px;border-color:var(--teal)"><div class="t"><span>${L("System scan", "Scan do sistema")}</span><span class="teal">● ${L("LIVE", "AO VIVO")}</span></div>
    ${
      perfil
        ? `<div class="col" style="font-size:12px;gap:5px">${lin("agua", "#4a7bd1")}${lin("comida", "#ff8a3d")}${lin("oxigenio", "#3ee0d0")}${lin("propulsante", "#e8403f")}
      <div class="lin"><span style="width:86px;color:#ffd84d">■ ${L("Equipment", "Equipamento")}</span><span style="flex:1"></span><span>${equip} kg</span></div>
      <div class="lin"><span style="width:86px" class="sub">${L("Mass", "Massa")}</span>${barra(cr.kg, perfil.limite_kg, "#e8ecff")}<span>${cr.kg} kg</span></div>
      <div class="lin"><span style="width:86px" class="sub">${L("Volume", "Volume")}</span>${barra(cr.litros, perfil.limite_l, "#e8ecff")}<span>${cr.litros} L</span></div></div>
    <button style="width:100%;margin-top:10px;border-color:var(--teal);color:var(--teal)" data-a="modal" data-v="carga" ${host ? "" : "disabled"}>${faltas ? L(`${faltas} items missing · open cargo ↗`, `Faltam ${faltas} itens · abrir carga ↗`) : L("Supplies and equipment ↗", "Mantimentos e equipamento ↗")}</button>`
        : `<p class="sub">${L("Choose the destination first: the minimum cargo depends on how long the trip is.", "Escolhe primeiro o destino: a carga mínima depende da duração da viagem.")}</p>`
    }</div>
  <div class="p" style="left:960px;top:436px;width:296px;height:268px"><div class="t"><span>${L("Mission plan", "Plano da missão")}</span><span>${host ? L("host", "anfitrião") : L("crew", "tripulante")}</span></div><div class="col" style="gap:6px">
    ${chk(!!d, L("Destination", "Destino"), d ? esc(perfil.nome) : L("TO CHOOSE", "POR ESCOLHER"))}${chk(d && !faltas, L("Minimum cargo", "Carga mínima"), d && !faltas ? L("COMPLETE", "COMPLETA") : L("MISSING", "EM FALTA"))}${chk(v.jogadores.length > 1, L("Team", "Equipa"), v.jogadores.length > 1 ? "2/2" : L("1 FREE", "1 LIVRE"))}${chk(todos && d && !faltas, L("Readiness", "Prontidão"), v.jogadores.length === 1 ? "SOLO" : `${(e.prontos || []).length}/${v.jogadores.length}`)}
    <div class="lin">${host && v.jogadores.length < 2 ? `<button class="qb" data-a="convidar">${L("Invite a crewmate", "Convidar colega")}</button>` : ""}${v.jogadores.length > 1 ? `<button class="qb" data-a="pronto" ${pronto || !d || faltas ? "disabled" : ""}>${pronto ? L("Ready ✓", "Pronto ✓") : L("I am ready", "Estou pronto")}</button>` : ""}</div></div></div>`;
}

const FASE = (f) =>
  ({
    viagem: L("Trip", "Viagem"),
    aproximacao: L("Approach", "Aproximação"),
    instalacao: L("Building the base", "Instalação da base"),
    operacao: L("Surface operations", "Operação na superfície"),
    concluida: L("Mission complete", "Missão concluída"),
    retirada: L("Withdrawal", "Retirada"),
  })[f] || f;
const EMO = (x) =>
  ({
    SERENO: [L("calm", "sereno"), "#3ee0d0"],
    ALIVIO: [L("relieved", "aliviado"), "#7bc96f"],
    PROTESTO: [L("worried", "preocupado"), "#ffd84d"],
    TRISTEZA: [L("sad", "triste"), "#8a93bb"],
    PANICO: [L("alarmed", "alarmado"), "#e8403f"],
    NEUTRO: [L("neutral", "neutro"), "#8a93bb"],
  })[x] || [String(x).toLowerCase(), "#8a93bb"];
const PAPEL = (n) =>
  ({
    Comandante: L("Commander", "Comandante"),
    Engenheira: L("Engineer", "Engenheira"),
    Cadete: L("Cadet", "Cadete"),
  })[n] || n;
// Próximo passo e onde fica (m em metros; null = dentro da base)
function objectivo() {
  const e = G.vista.estado,
    mont = e.montados || [],
    ev = G.eva,
    P2 = mundo.POS;
  if (e.fase === "instalacao") {
    if (!e.descarregada)
      return [
        L(
          "Unload the cargo next to the lander",
          "Descarregar a carga ao lado da nave",
        ),
        P2.carga,
      ];
    if (mont.length === 0)
      return [
        L(
          "Install the power module at the solar field",
          "Instalar o módulo de energia no campo solar",
        ),
        P2.energia,
      ];
    if (mont.length === 1)
      return [
        L(
          "Install communications at the comms screen, inside the lander",
          "Instalar comunicações no ecrã de comunicações, dentro da nave",
        ),
        null,
      ];
    return [L("Assemble the habitat", "Montar o habitat"), P2.habitat];
  }
  if (ev.rocha || ev.solo || ev.gelo)
    return [
      L(
        "Take the samples to the lab bench inside the base",
        "Levar as amostras à bancada do laboratório, dentro da base",
      ),
      null,
    ];
  return [
    L(
      "Next task: communications screen inside the base. Or explore the terrain.",
      "Próxima tarefa: ecrã de comunicações dentro da base. Ou explora o terreno.",
    ),
    null,
  ];
}
function hJogo() {
  const v = G.vista,
    e = v.estado,
    r = e.recursos,
    c0 = e.carga || {},
    host = v.anfitriao,
    sup = e.pouso != null,
    d = e.destino,
    R2 = REC();
  if (G.anim)
    return `<div class="p" style="left:24px;top:24px;width:300px"><div class="px teal" style="font-size:18px">${G.anim.tipo === "descolagem" ? L("LIFT-OFF · standing up", "DESCOLAGEM · de pé") : L("LANDING · standing up", "ATERRAGEM · de pé")}</div><div class="sub">${G.anim.tipo === "descolagem" ? L("The ship climbs vertically and lies down in orbit.", "A nave sobe na vertical e deita-se em órbita.") : L("The ship turns, opens its legs and brakes with a short flame.", "A nave roda, abre as pernas e trava com chama curta.")}</div></div>`;
  const rec = (k, max, cor, inv) =>
    `<div class="lin" style="font-size:12px"><span style="width:78px">${R2[k]}</span>${barra(r[k] || 0, max, inv ? ((r[k] || 0) >= max - 2 ? "#e8403f" : "#ffd84d") : (r[k] || 0) <= max * 0.25 ? "#e8403f" : cor)}<span style="width:54px;text-align:right">${r[k] ?? 0}${inv ? "/" + max : ""}</span></div>`;
  const ligados = v.jogadores.filter((j) => j.ligado).length,
    votos = (e.votos || []).length;
  let acoes = "",
    baixo = "";
  if (!e.desafio && !e.desfecho) {
    if (e.fase === "viagem") {
      const eu = e.piloto === v.eu;
      acoes = `<button class="pri" data-a="avancar" ${eu ? "disabled" : ""}>${L("ADVANCE TO THE NEXT WAYPOINT ►", "AVANÇAR ATÉ AO PRÓXIMO MARCO ►")}</button>${ligados > 1 && votos ? `<span class="sub">${votos}/${ligados}</span>` : ""}
        ${eu ? `<button data-a="ajustar" data-v="-1">◄ ${L("Correct", "Corrigir")}</button><span class="sub">${L("adjustment", "ajuste")} ${e.ajuste_rota > 0 ? "+" : ""}${e.ajuste_rota} · ${L("each burn uses 4 propellant", "cada impulso gasta 4 de propulsante")}</span><button data-a="ajustar" data-v="1">${L("Correct", "Corrigir")} ►</button><button data-a="libertar">${L("Back to autopilot", "Devolver ao piloto automático")}</button>` : `<button data-a="assumir">${L("Take the pilot seat", "Assumir a pilotagem")}</button>`}`;
    } else if (e.fase === "aproximacao" && !sup) {
      const z = destinoTxt(d, G.cat.destinos[d]).pouso;
      acoes = `<div class="col" style="width:100%"><div class="sub">${L("Compare the two zones and choose where to land", "Compara as duas zonas e escolhe onde pousar")}${host ? "" : L(" (the host decides)", " (decide o anfitrião)")}:</div><div class="lin">
        <button class="op" style="flex:1;margin:0" data-a="pousar" data-v="0" ${host ? "" : "disabled"}><b>${esc(z[0])}</b><br><span class="sub">${L("Uses 12 propellant. The cargo ends up close.", "Gasta 12 de propulsante. A carga fica perto.")}</span></button>
        <button class="op" style="flex:1;margin:0" data-a="pousar" data-v="1" ${host ? "" : "disabled"}><b>${esc(z[1])}</b><br><span class="sub">${L("Uses 18 propellant. Unloading takes 2 h more and 8 power.", "Gasta 18 de propulsante. Descarregar demora mais 2 h e gasta 8 de energia.")}</span></button></div></div>`;
    }
  }
  if (sup && !e.desfecho) {
    const ob = objectivo();
    baixo = `<div class="p" style="left:140px;bottom:12px;width:1000px;padding:10px 14px"><div class="lin" style="justify-content:space-between"><span style="font-size:14px"><b class="ama">${L("Next", "A seguir")}:</b> ${esc(ob[0])} <b id="h-obj" class="teal"></b></span><button class="pri" id="h-usar" data-a="usar" style="min-height:40px;font-size:16px;display:none"></button></div>
      <div class="sub" style="margin-top:4px"><span class="tecla">←</span> <span class="tecla">→</span> ${L("walk", "andar")}${G.local === "fora" ? ` · <span class="tecla">${L("space", "espaço")}</span> ${L("jump", "saltar")}` : ""} · <span class="tecla">E</span> ${L("use", "usar")}${G.local === "fora" && G.jog.ultimoSalto ? ` · ${L("last jump", "último salto")}: ${G.jog.ultimoSalto.toFixed(1)} s` : ""}</span></div></div>
      <button class="toque" style="left:16px" data-t="esq" aria-label="${L("Walk left", "Andar para a esquerda")}">◄</button><button class="toque" style="left:88px" data-t="dir" aria-label="${L("Walk right", "Andar para a direita")}">►</button>${G.local === "fora" ? `<button class="toque" style="right:16px" data-t="salto" aria-label="${L("Jump", "Saltar")}">▲</button>` : ""}`;
  }
  const ev = G.eva,
    traje = sup
      ? G.local === "fora"
        ? `<div style="border-top:1px solid var(--borda);margin:8px 0 6px"></div><div class="t" style="margin-bottom:4px"><span>${L("EVA suit oxygen", "Oxigénio do traje")}</span><b id="h-ox" class="px" style="font-size:20px;color:#fff"></b></div><span class="barra" style="display:block;height:12px"><i id="h-oxb" style="width:100%;background:#3ee0d0"></i></span><div class="lin" style="justify-content:space-between;margin-top:6px;font-size:13px"><span>${L("Base", "Base")} <b id="h-dist" class="teal"></b></span><span class="sub">${L("Carrying", "A levar")}: ${(ev.rocha ? 1 : 0) + ev.solo + ev.gelo} ${L("samples", "amostras")}</span></div>`
        : ""
      : "";
  return `
  <div class="p" style="left:12px;top:12px;width:270px"><div class="t"><span>${FASE(e.fase)} · ${esc(destinoTxt(d, G.cat.destinos[d]).nome)}</span><span>${e.horas} h</span></div><div class="col" style="gap:5px">
    ${rec("oxigenio", c0.oxigenio || 1, "#3ee0d0")}${rec("agua", c0.agua || 1, "#4a7bd1")}${rec("comida", c0.comida || 1, "#ff8a3d")}${rec("propulsante", c0.propulsante || 1, "#e8403f")}${rec("energia", 100, "#ffd84d")}${rec("mobilidade", 100, "#cfd6f5")}${rec("margem", 6, "#7bc96f")}${rec("exposicao", 6, "", true)}</div>
    ${(e.avisos_seguranca || []).map((a) => `<div class="sub ama" style="margin-top:6px;font-size:12px">⚠ ${esc(srv(a))}</div>`).join("")}
    ${sup && G.local === "fora" ? `<div class="sub" style="margin-top:6px;font-size:12px">${L("Gravity", "Gravidade")} ${d === "lua" ? L("1.62 m/s² · no air", "1,62 m/s² · sem ar") : L("3.71 m/s² · thin air", "3,71 m/s² · com ar")}</div>` : ""}${traje}</div>
  ${sup && G.local === "fora" ? "" : `<div class="p" style="left:300px;top:12px;width:680px;text-align:center;padding:10px 14px"><span style="font-size:14px">${esc(srv(e.mensagem))}</span></div>`}
  <div class="p" style="left:998px;top:12px;width:270px"><div class="t"><span>${L("Crew", "Tripulação")}</span><span>${ligados}/${v.jogadores.length} ${L("online", "ligados")}</span></div>
    ${v.jogadores.map((j) => `<div class="lin" style="font-size:13px"><span style="width:10px;height:10px;background:${j.ligado ? "#3ee0d0" : "#5a6290"}"></span><b>${esc(j.nickname || j.nome)}</b><span class="sub">${NIVEL(j.nivel)}${j.anfitriao ? " · " + L("host", "anfitrião") : ""}</span></div>`).join("")}
    <div style="border-top:1px solid var(--borda);margin:8px 0"></div>
    ${(e.tripulacao || [])
      .map((t) => {
        const m = EMO(t.emocao);
        return `<div class="lin" style="font-size:12px;margin-bottom:3px"><span style="width:10px;height:10px;background:${m[1]}"></span><b>${esc(PAPEL(t.nome))}</b><span class="sub">${m[0]}</span></div>`;
      })
      .join("")}
    <div class="lin" style="margin-top:6px"><button class="qb" data-a="painel" data-v="diario">${L("Logbook", "Diário")}</button><button class="qb" data-a="modal" data-v="missoes">${L("Missions", "Missões")}</button><button class="qb" data-a="comoJogar">?</button>${bLingua()}</div></div>
  ${
    G.ui.painel === "diario"
      ? `<div class="p" style="left:998px;top:250px;width:270px;max-height:300px;overflow:auto;z-index:3"><div class="t"><span>${L("Logbook", "Diário de bordo")}</span><button class="qb" data-a="painel" data-v="diario">×</button></div>${(
          e.historico || []
        )
          .slice()
          .reverse()
          .map(
            (h) =>
              `<div class="msg"><span class="sub">${h.horas} h</span> ${esc(srv(h.mensagem))}</div>`,
          )
          .join("")}</div>`
      : ""
  }
  ${acoes ? `<div class="p" style="left:140px;bottom:12px;width:1000px"><div class="lin" style="justify-content:center">${acoes}</div></div>` : ""}${baixo}`;
}
// Parte do HUD que muda a cada instante (relógio do oxigénio, distância, acção possível)
function hudVivo() {
  if (G.ecra !== "jogo" || !G.vista || G.vista.estado.pouso == null || G.anim)
    return;
  let usar2 = "",
    obj = "";
  const ob = objectivo(),
    J = G.jog,
    e = G.vista.estado;
  if (G.local === "fora") {
    const ox = G.oxigenio(),
      d = Math.round(J.m - mundo.porta(e)),
      it = G.bloqueado ? null : mundo.interaccoes(G)[0];
    const ch = `${Math.floor(ox / 60)}:${String(Math.floor(ox % 60)).padStart(2, "0")}|${d}|${it ? it.txt : ""}|${ob[1] == null ? "" : Math.round(ob[1] - J.m)}`;
    if (ch === G.hud) return;
    G.hud = ch;
    const a = $("#h-ox"),
      b = $("#h-oxb"),
      c2 = $("#h-dist");
    if (!a) return;
    a.textContent = ch.split("|")[0];
    a.style.color =
      ox < 60 ? (Math.floor(ox * 2) % 2 ? "#ff7a85" : "#fff") : "#fff";
    b.style.width = (100 * ox) / mundo.OX_MAX + "%";
    b.style.background = ox < 60 ? "#e8403f" : ox < 120 ? "#ffd84d" : "#3ee0d0";
    c2.textContent =
      Math.abs(d) < 2
        ? L("here", "aqui")
        : (d > 0 ? "◄ " : "") + Math.abs(d) + " m" + (d < 0 ? " ►" : "");
    usar2 = it ? it.txt : "";
    if (ob[1] != null) {
      const k = Math.round(ob[1] - J.m);
      obj =
        Math.abs(k) < 3
          ? L("(here)", "(aqui)")
          : (k < 0 ? "◄ " : "") + Math.abs(k) + " m" + (k > 0 ? " ►" : "");
    } else obj = L("(inside)", "(lá dentro)");
  } else {
    const s = G.bloqueado ? null : mundo.estacaoPerto(G),
      ch = "d|" + (s ? s.id : "");
    if (ch === G.hud) return;
    G.hud = ch;
    usar2 = s ? mundo.nomeEstacao(s.id) : "";
    obj = ob[1] == null ? "" : L("(outside)", "(lá fora)");
  }
  const bt = $("#h-usar"),
    o = $("#h-obj");
  if (bt) {
    bt.style.display = usar2 ? "" : "none";
    bt.textContent = usar2 ? "[E] " + usar2 : "";
  }
  if (o) o.textContent = obj;
}

function hDeltas() {
  const R2 = REC();
  return G.ui.deltas
    .map((x) => {
      const mau = x.k === "exposicao" ? x.d > 0 : x.d < 0;
      return `<span class="delta ${mau ? "ver" : "teal"}">${R2[x.k]} ${x.d > 0 ? "+" : ""}${x.d}</span>`;
    })
    .join("");
}
function hIncidente() {
  const v = G.vista,
    e = v.estado,
    dl = G.ui.dlg,
    des = e.desafio,
    ex = explicar(dl.id),
    host = v.anfitriao,
    ligados = v.jogadores.filter((j) => j.ligado);
  const tx = des,
    titulo = des ? des.titulo : dl.titulo || "";
  let direita,
    largura = 900;
  if (dl.fase === "ok") {
    const seg = (performance.now() - dl.t0) / 1000;
    direita = `<div class="t"><span class="teal">${dl.recuperada ? L("Recovered", "Recuperado") : L("Solved safely", "Resolvido em segurança")}</span></div><div class="sub" style="color:#fff">${L("How it is solved:", "Como se resolve:")}</div>
      ${ex.passos.map((p, i) => `<div class="passo ${seg > 0.4 + i * 1.3 ? "on" : ""}" data-passo="${i}"><b>${i + 1}</b><span>${esc(p)}</span></div>`).join("")}
      <div style="border:2px solid var(--teal);padding:10px;margin-top:12px;font-size:14px"><b class="teal">${L("Concept:", "Conceito:")}</b> ${esc(dl.conceito)}</div><div>${hDeltas()}</div>
      <button class="pri" style="margin-top:12px" data-a="continuar">${L("CONTINUE ►", "CONTINUAR ►")}</button>`;
  } else if (!des)
    direita = `<button class="pri" data-a="continuar">${L("CONTINUE ►", "CONTINUAR ►")}</button>`;
  else if (dl.fase === "saber") {
    direita = `<div class="t"><span class="ama">${L("Signal", "Sinal")}</span></div><p style="font-size:15px;margin:0 0 12px">${esc(tx.sinal)}</p>${balao(`<b>${L("Before you decide, this is what you need to know:", "Antes de decidires, isto é o que precisas de saber:")}</b><br>${esc(ex.saber)}`, `<button class="pri" data-a="percebi">${L("I UNDERSTAND · SHOW THE OPTIONS", "PERCEBI · MOSTRAR AS OPÇÕES")}</button>`)}`;
    largura = 1040;
  } else {
    const voto = (e.votos_desafio || {})[v.eu],
      op = (k) =>
        `<button class="op ${voto === k ? "sel" : ""}" data-a="responder" data-v="${k}">${esc(tx.opcoes[k])}</button>`;
    let corpo;
    if (dl.fase === "risco") {
      corpo = `<div style="border:2px solid var(--ver);padding:10px;font-size:14px"><b class="ver">${L("What happened:", "O que aconteceu:")}</b> ${esc(dl.consequencia || des.sinal)}</div><p class="sub"><b>${L("Why:", "Porquê:")}</b> ${esc(ex.risco)}</p><div>${hDeltas()}</div>
        <div class="sub" style="color:#fff;margin-top:8px">${L("It can still be recovered:", "Ainda dá para recuperar:")}</div>${des.ordem.map(op).join("")}
        <p class="sub">${L("Postponements left:", "Adiamentos restantes:")} ${des.adiamentos_restantes}. ${L("Postponing costs time, power and margin.", "Adiar gasta tempo, energia e margem.")}</p>${host ? `<button class="per" data-a="retirada">${L("Ask for a safe withdrawal (ends the mission)", "Pedir retirada em segurança (termina a missão)")}</button>` : ""}`;
    } else if (des.modo === "resposta_aberta") {
      corpo = G.ui.interp
        ? `<div style="border:2px solid var(--teal);padding:10px;font-size:14px">${L("Mission control understood your plan as:", "O controlo de missão entendeu o teu plano como:")}<br><b>«${esc(G.ui.interp.rotulo)}»</b></div><div class="lin" style="margin-top:10px"><button class="pri" data-a="responder" data-v="${esc(G.ui.interp.opcao)}">${L("CONFIRM", "CONFIRMAR")}</button><button data-a="reescrever">${L("Rewrite", "Reescrever")}</button></div>`
        : `<label for="f-plano">${L("Commander: write your order", "Comandante: escreve o que mandas fazer")}</label><textarea id="f-plano" rows="3" maxlength="500" placeholder="${L("E.g.: isolate the leak and switch on the reserve", "Ex.: isolar a fuga e ligar a reserva")}"></textarea><div class="lin" style="margin-top:8px"><button class="pri" data-a="interpretar">${L("SEND THE PLAN", "INTERPRETAR PLANO")}</button></div><details style="margin-top:10px"><summary class="sub">${L("Or choose one of the manoeuvres", "Ou escolher uma das manobras")}</summary>${des.ordem.map(op).join("")}</details>`;
    } else if (des.modo === "comparacao")
      corpo = `<div class="sub" style="color:#fff">${L("Pilot: compare the two manoeuvres. Which one protects the reserves better?", "Piloto: compara as duas manobras. Qual protege melhor as reservas?")}</div><div class="lin" style="align-items:stretch">${des.ordem.map((k) => `<div style="flex:1">${op(k)}</div>`).join("")}</div>`;
    else
      corpo = `<div class="sub" style="color:#fff">${L("Cadet: what do we do?", "Cadete: o que fazemos?")}</div>${des.ordem.map(op).join("")}<p class="sub ama" style="margin-top:10px">${L("Hint:", "Pista:")} ${esc(ex.passos[0] || "")}</p>`;
    const espera =
      ligados.length > 1
        ? `<p class="sub">${e.espera_equipa === "divergencia" ? `<b class="ver">${L("The team chose different options. Agree on the same one.", "A equipa escolheu opções diferentes. Escolham a mesma.")}</b>` : e.espera_equipa === "aguarda" ? L("Waiting for your crewmate to vote.", "À espera do voto do colega.") : L("In a team, the decision only goes ahead when both choose the same.", "Em equipa, a decisão só avança quando os dois escolhem o mesmo.")} ${ligados.map((j) => `${esc(j.nickname || j.nome)}: ${(e.votos_desafio || {})[j.id] ? "✓" : "…"}`).join(" · ")}</p>`
        : "";
    direita = `${dl.fase === "risco" ? "" : `<div class="t"><span class="ama">${L("Signal", "Sinal")}</span></div><p style="font-size:15px;margin:0 0 10px">${esc(tx.sinal)}</p>`}${corpo}${espera}`;
  }
  return `<div class="veu" style="background:rgba(5,8,32,.55)"><div class="cx" style="width:${largura}px;border-color:${dl.fase === "ok" ? "var(--teal)" : dl.fase === "risco" ? "var(--ver)" : "var(--ama)"}"><h2>${esc(titulo)}</h2>
    <div style="display:grid;grid-template-columns:384px 1fr;gap:20px;margin-top:10px"><div><canvas id="sim" class="mini" width="380" height="230"></canvas><p class="sub" style="font-size:12px">${L("Simulation of the incident.", "Simulação do incidente.")} ${e.eva && e.eva.desafio === dl.id ? L("Inspired by a real NASA spacewalk.", "Inspirado numa saída extraveicular real da NASA.") : ""}</p></div><div>${direita}</div></div></div></div>`;
}

function hRelatorio() {
  const e = G.vista.estado,
    rel = e.relatorio || {},
    T2 = {
      base_estabilizada: [L("Base stabilised!", "Base estabilizada!"), "teal"],
      retirada_segura: [L("Safe withdrawal", "Retirada em segurança"), "ama"],
      missao_falhada: [L("Mission interrupted", "Missão interrompida"), "ver"],
    }[e.desfecho] || ["—", "ama"];
  const dec = rel.decisoes || {},
    ev = rel.eva,
    li = (e.historico || []).filter((h) => h.sinal === "sucesso").slice(-6),
    xp = rel.exploracao || {};
  return `<div class="veu"><div class="cx" style="width:860px"><h2 class="${T2[1]}">${T2[0]}</h2><p style="margin:0 0 10px">${esc(srv(rel.motivo || ""))}</p>
    <div class="lin" style="gap:20px"><div class="px ama" style="font-size:54px">${"★".repeat(rel.estrelas || 0)}<span style="color:#2a3380">${"★".repeat(3 - (rel.estrelas || 0))}</span></div><div><div class="px" style="font-size:34px">${rel.pontos ?? "—"} ${L("points", "pontos")}</div><div class="sub">${rel.horas_missao ?? e.horas} ${L("mission hours", "horas de missão")} · ${(e.montados || []).length}/3 ${L("modules", "módulos")} · ${(e.descobertas || []).length}/3 ${L("discoveries", "descobertas")} · ${xp.amostras || 0} ${L("samples analysed", "amostras analisadas")} · ${xp.saidas || 0} EVA${xp.emergencias ? " · " + xp.emergencias + " " + L("oxygen emergencies (−5 points each)", "emergências de oxigénio (−5 pontos cada)") : ""}</div></div></div>
    <table style="margin-top:10px"><tr><th>${L("Safe decisions", "Decisões seguras")}</th><th>${L("Risks", "Riscos")}</th><th>${L("Recoveries", "Recuperações")}</th><th>${L("Postponements", "Adiamentos")}</th></tr><tr><td>${dec.seguras ?? 0}</td><td>${dec.riscos ?? 0}</td><td>${dec.recuperadas ?? 0}</td><td>${dec.adiamentos ?? 0}</td></tr></table>
    ${li.length ? `<div class="t" style="margin-top:12px"><span>${L("What you learned", "O que aprendeste")}</span></div>${li.map((h) => `<div class="msg">${esc(srv(h.mensagem))}</div>`).join("")}` : ""}
    ${ev ? `<div class="t" style="margin-top:12px"><span>${L("The real spacewalk that inspired the mission", "Saída extraveicular real que inspirou a missão")}</span></div><p class="sub">${esc(ev.data || "")} · ${esc(ev.pais || "")} · ${esc(ev.veiculo || "")} · ${esc(ev.tripulacao || "")}${ev.duracao_min ? " · " + ev.duracao_min + " min" : ""}<br>${esc(ev.proposito || "")}<br><span style="font-size:11px">${esc(ev.fonte || "NASA")}</span></p>` : ""}
    <div class="lin" style="margin-top:12px"><button class="pri" data-a="nova">${L("NEW MISSION", "NOVA MISSÃO")}</button><button data-a="modal" data-v="ranking">Ranking</button><button data-a="modal" data-v="missoes">${L("Missions", "Missões")}</button></div></div></div>`;
}

const USO = () => ({
  agua: L("6 per day of travel", "6 por dia de viagem"),
  comida: L("3 per day of travel", "3 por dia de viagem"),
  oxigenio: L("3 per day of travel", "3 por dia de viagem"),
  propulsante: L(
    "manoeuvres, waypoints and landing",
    "manobras, marcos e pouso",
  ),
  ferramentas: L("needed to build the base", "obrigatórias para montar a base"),
  pecas: L("repair rover, wheels and seals", "reparam rover, rodas e juntas"),
  filtro: L("solves rising CO₂", "resolve a subida de CO₂"),
  bateria: L(
    "gives back 20 power after an impact",
    "recupera 20 de energia num impacto",
  ),
  energia: L("1st base module", "1.º módulo da base"),
  radio: L("2nd base module", "2.º módulo da base"),
  habitat: L("3rd base module", "3.º módulo da base"),
  rover: L(
    "surface vehicle, 3× faster than walking",
    "veículo de superfície, 3× mais rápido do que andar",
  ),
});
function hModal() {
  const m = G.ui.modal,
    fecha = `<div class="lin" style="margin-top:14px"><button data-a="fechar">${L("Close", "Fechar")}</button></div>`,
    cx = (w, h) =>
      `<div class="veu"><div class="cx" style="width:${w}px">${h}${fecha}</div></div>`;
  const e = G.vista ? G.vista.estado : null;
  if (m === "char")
    return cx(
      760,
      `<h2>${L("Choose your astronaut", "Escolhe o teu astronauta")}</h2><div class="lin" style="align-items:stretch">${Object.keys(
        PERSONAGENS,
      )
        .map(
          (k) =>
            `<button data-a="char" data-v="${k}" class="${G.cosm.char === k ? "sel" : ""}" style="flex:1;padding:10px;text-align:center"><canvas data-char="${k}" data-traje="voo" width="72" height="116"></canvas><canvas data-char="${k}" data-traje="voo" data-cap="1" width="72" height="116"></canvas><div class="px" style="font-size:20px">${PERSONAGENS[k].nome}</div></button>`,
        )
        .join(
          "",
        )}</div><p class="sub">${L("The suit changes by itself: cabin suit inside, flight suit for lift-off, EVA suit outside on the Moon or Mars.", "O traje muda sozinho: cabine lá dentro, voo na descolagem, traje de exploração lá fora na Lua ou em Marte.")}</p>`,
    );
  if (m === "convite")
    return cx(
      620,
      `<h2>${L("Invite a crewmate", "Convidar colega")}</h2><p class="sub">${L("Give this invite to your crewmate. They paste it in Missions › Join a crewmate. It is valid for 30 minutes and works once.", "Dá este convite ao teu colega. Ele cola-o em Missões › Entrar na missão de um colega. É válido 30 minutos e serve uma vez.")}</p><input readonly value="${esc(G.ui.convite)}" onclick="this.select()"><div class="lin" style="margin-top:8px"><button data-a="copiar">${L("Copy", "Copiar")}</button></div>`,
    );
  if (m === "semAr")
    return cx(
      640,
      `<h2 class="ver">${L("Suit oxygen ran out", "O oxigénio do traje acabou")}</h2>${balao(esc(L("The emergency reserve got you back to the airlock, but the samples you were carrying were left behind, and the mission loses 5 points. A suit tank lasts 5 minutes: plan the walk there and back, and use the rover for far places.", "A reserva de emergência trouxe-te de volta à antecâmara, mas as amostras que levavas ficaram para trás e a missão perde 5 pontos. Um tanque dura 5 minutos: planeia a ida e a volta, e usa o rover para os sítios longe.")), "")}`,
    );
  if (m === "missoes") {
    const p = G.perfil,
      F2 = {
        preparacao_na_terra: L("In the lobby", "No lobby"),
        viagem: L("Travelling", "Em viagem"),
        aproximacao: L("Arriving", "A chegar"),
        instalacao: L("Building the base", "A montar a base"),
        operacao: L("On the surface", "Na superfície"),
        concluida: L("Finished", "Terminada"),
        retirada: L("Withdrawn", "Retirada"),
      };
    const lista = G.partidas
      .slice(0, 6)
      .map(
        (x) =>
          `<div class="chk ${x.codigo === G.cod ? "on" : ""}"><span><b>${esc(x.codigo)}</b> · ${x.destino ? esc(destinoTxt(x.destino, G.cat.destinos[x.destino]).nome) : "—"} · ${F2[x.fase] || x.fase}</span><button class="qb" data-a="abrir" data-v="${esc(x.codigo)}">${x.desfecho ? L("Report", "Relatório") : L("Open", "Abrir")}</button></div>`,
      )
      .join("");
    const social = p.idade >= 15 || p.consentimento;
    return cx(
      820,
      `<h2>${L("Missions", "Missões")} · ${esc(p.nickname || p.nome)} <span class="sub" style="font-size:14px">${NIVEL(p.nivel)}</span></h2><div class="lin"><button class="pri" data-a="nova">${L("NEW MISSION", "NOVA MISSÃO")}</button></div><div class="col" style="margin-top:10px">${lista}</div>
      <div class="t" style="margin-top:14px"><span>${L("Join a crewmate", "Entrar na missão de um colega")}</span></div><div class="lin"><input id="f-conv" style="flex:1" placeholder="A1B2C3D4E5F6:${L("invite-key", "chave-do-convite")}"><button data-a="usarConvite">${L("Join", "Entrar")}</button></div>
      ${social ? "" : `<div class="t" style="margin-top:14px"><span>${L("Team play under 15: guardian permission", "Equipa com menos de 15 anos: autorização do responsável")}</span></div><div class="lin"><input id="f-resp" type="email" style="flex:1" placeholder="${L("guardian email", "email do responsável")}"><button data-a="consentimento">${L("Ask", "Pedir")}</button></div>`}
      ${p.nickname ? "" : `<div class="t" style="margin-top:14px"><span>${L("Nickname for the ranking", "Nickname para o ranking")}</span></div><div class="lin"><input id="f-nick" maxlength="20" style="flex:1"><button data-a="nick">${L("Save", "Guardar")}</button></div>`}
      <p class="sub" style="margin-top:10px">${G.saude ? L("Server: ", "Servidor: ") + esc(G.saude.estado) : ""}</p>`,
    );
  }
  if (m === "eva") {
    if (!G.ui.evaInfo) {
      tentar(() => api("/eva")).then((r) => {
        G.ui.evaInfo = r || {};
        desenhar();
      });
      return cx(
        640,
        `<h2>${L("Real NASA data", "Dados reais da NASA")}</h2><p class="sub">…</p>`,
      );
    }
    const r = G.ui.evaInfo;
    return cx(
      760,
      `<h2>${L("Real NASA data", "Dados reais da NASA")}</h2><p class="sub">${L("Records of real spacewalks (extravehicular activities). Each mission picks one to inspire a surface incident.", "Registos de saídas extraveiculares reais. Cada missão escolhe uma para inspirar um incidente da superfície.")}</p>${(r.amostra || []).map((ev) => `<div class="msg"><b>${esc(ev.data || "")}</b> · ${esc(ev.veiculo || "")} · ${esc(ev.tripulacao || "")}<br><span class="sub">${esc(ev.proposito || "")}</span></div>`).join("")}`,
    );
  }
  if (m === "ranking") {
    const rk = (G.ui.rank || {}).ranking || [],
      meus = G.ui.meus || { resumo: {} };
    return cx(
      760,
      `<h2>Ranking</h2>${rk.length ? `<table><tr><th>#</th><th>${L("Astronaut", "Astronauta")}</th><th>${L("Stars", "Estrelas")}</th><th>Base</th><th>${L("Samples", "Amostras")}</th><th>${L("Missions", "Missões")}</th></tr>${rk.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.nickname)}</td><td class="ama">${"★".repeat(x.estrelas)}</td><td>${x.base_nivel}/3</td><td>${x.amostras}</td><td>${x.missoes}</td></tr>`).join("")}</table>` : `<p class="sub">${L("Nobody with a nickname has finished a mission yet.", "Ainda ninguém terminou uma missão com nickname.")}</p>`}
      <p class="sub" style="margin-top:12px">${L("Your missions", "As tuas missões")}: ${meus.resumo.missoes ?? 0} · ${L("completed", "cumpridas")}: ${meus.resumo.cumpridas ?? 0}</p>`,
    );
  }
  if (m === "carga") {
    const d = e.destino,
      pf = destinoTxt(d, G.cat.destinos[d]),
      c = G.ui.carga,
      md = medidas(c),
      okKg = md.kg <= pf.limite_kg,
      okL = md.l <= pf.limite_l,
      U = USO();
    const lin = Object.keys(G.cat.carga)
      .map((k) => {
        const it = G.cat.carga[k],
          min = pf.minimo[k] || 0,
          q = c[k] || 0,
          gr = it.kg <= 2,
          nm = nomeCarga(k, it.nome);
        return `<tr><td><b>${esc(nm)}</b><div class="sub" style="font-size:11px">${U[k]}</div></td><td>${it.kg} kg · ${it.litros} L</td><td class="${q < min ? "ver" : "teal"}">${min || "—"}</td><td><span class="lin" style="gap:4px;flex-wrap:nowrap">${gr ? `<button class="qb" data-a="qt" data-k="${k}" data-v="-10">−10</button>` : ""}<button class="qb" data-a="qt" data-k="${k}" data-v="-1" aria-label="− ${esc(nm)}">−</button><input class="qt" data-qk="${k}" value="${q}" inputmode="numeric" aria-label="${esc(nm)}"><button class="qb" data-a="qt" data-k="${k}" data-v="1" aria-label="+ ${esc(nm)}">+</button>${gr ? `<button class="qb" data-a="qt" data-k="${k}" data-v="10">+10</button>` : ""}</span></td></tr>`;
      })
      .join("");
    return `<div class="veu"><div class="cx" style="width:900px"><h2>${L("Supplies and equipment", "Mantimentos e equipamento")} · ${esc(pf.nome)}</h2>
      <div class="lin" style="font-size:13px"><span style="width:70px">${L("Mass", "Massa")}</span>${barra(md.kg, pf.limite_kg, okKg ? "#3ee0d0" : "#e8403f")}<span class="${okKg ? "" : "ver"}">${md.kg} / ${pf.limite_kg} kg</span></div>
      <div class="lin" style="font-size:13px;margin-top:4px"><span style="width:70px">${L("Volume", "Volume")}</span>${barra(md.l, pf.limite_l, okL ? "#3ee0d0" : "#e8403f")}<span class="${okL ? "" : "ver"}">${md.l} / ${pf.limite_l} L</span></div>
      <div class="lin" style="margin-top:10px"><button class="pri" data-a="aplicarCarga" ${okKg && okL ? "" : "disabled"}>${L("SAVE CARGO", "GUARDAR CARGA")}</button><button data-a="minimo">${L("Fill the minimum", "Preencher o mínimo")}</button><button data-a="fechar">${L("Cancel", "Cancelar")}</button></div>
      <table style="margin-top:10px"><tr><th>${L("Item", "Item")}</th><th>${L("Per unit", "Por unidade")}</th><th>${L("Minimum", "Mínimo")}</th><th>${L("Quantity", "Quantidade")}</th></tr>${lin}</table></div></div>`;
  }
  if (m && m.startsWith("est:")) {
    const id = m.slice(4),
      mont = e.montados || [],
      ev = G.eva,
      M = e.destino === "marte",
      facto = G.ui.facto
        ? `<div style="border:2px solid var(--teal);padding:10px;margin-top:10px;font-size:14px">${esc(G.ui.facto)}</div>`
        : "";
    if (id === "fato")
      return cx(
        640,
        `<h2>${L("EVA suit and oxygen", "Traje e oxigénio")}</h2><p>${L("The suit is your personal spacecraft: it holds pressure, keeps your temperature and carries the air you breathe.", "O traje é a tua nave pessoal: mantém a pressão, a temperatura e leva o ar que respiras.")}</p><div class="chk on"><span>${L("Tank", "Tanque")}</span><span class="teal">100% · 5:00</span></div><p class="sub">${L("Outside, the timer only goes down. Entering the base refills the tank. EVAs so far:", "Lá fora, o relógio só desce. Entrar na base volta a encher o tanque. Saídas até agora:")} ${ev.saidas}</p>`,
      );
    if (id === "energia")
      return cx(
        640,
        `<h2>${L("Power panel", "Painel de energia")}</h2>${mont.includes("energia") ? `<div class="lin"><span style="width:90px">${L("Battery", "Bateria")}</span>${barra(e.recursos.energia, 100, "#ffd84d")}<b>${e.recursos.energia}%</b></div><p class="sub">${M ? L("Solar panels are outside. Dust settles on them and storms cover the Sun, so the battery matters.", "Os painéis solares ficam lá fora. A poeira assenta neles e as tempestades tapam o Sol, por isso a bateria é importante.") : L("The solar tower is outside. On the Moon a hill can put the panels in total shadow.", "A torre solar fica lá fora. Na Lua um monte pode deixar os painéis em sombra total.")}</p>` : `<p class="sub">${L("The power module is not installed yet. It goes outside, at the solar field.", "O módulo de energia ainda não está instalado. Fica lá fora, no campo solar.")}</p>`}`,
      );
    if (id === "mapa")
      return cx(
        940,
        `<h2>${L("Terrain map", "Mapa do terreno")}</h2><canvas id="mapa" class="mini" width="896" height="300"></canvas><p class="sub">${L("Walking covers 4 m every second, so a 5-minute tank reaches about 500 m there and back. The rover goes 13 m every second.", "A andar fazes 4 m por segundo, por isso um tanque de 5 minutos dá para cerca de 500 m, ida e volta. O rover faz 13 m por segundo.")}</p>`,
      );
    if (id === "descanso")
      return cx(
        640,
        `<h2>${L("Logbook", "Diário de bordo")}</h2><div style="max-height:380px;overflow:auto">${(
          e.historico || []
        )
          .slice()
          .reverse()
          .map(
            (h) =>
              `<div class="msg"><span class="sub">${h.horas} h</span> ${esc(srv(h.mensagem))}</div>`,
          )
          .join("")}</div>`,
      );
    if (id === "lab") {
      const nada = !ev.rocha && !ev.solo && !ev.gelo;
      return cx(
        700,
        `<h2>${L("Lab bench", "Bancada do laboratório")}</h2><p class="sub">${L("Samples are analysed inside, with clean tools and no suit gloves.", "As amostras analisam-se cá dentro, com ferramentas limpas e sem as luvas do traje.")}</p>
        <div class="col">${ev.rocha ? `<div class="chk"><span>${L("Rock sample (pick)", "Amostra de rocha (picareta)")}</span><button class="qb" data-a="analisarRocha">${L("Analyse", "Analisar")}</button></div>` : ""}${ev.solo ? `<div class="chk"><span>${L("Soil samples (shovel)", "Amostras de solo (pá)")}: ${ev.solo}</span><button class="qb" data-a="analisarSolo">${L("Analyse", "Analisar")}</button></div>` : ""}${ev.gelo ? `<div class="chk"><span>${L("Bright sample from the dark depression", "Amostra brilhante da depressão escura")}: ${ev.gelo}</span><button class="qb" data-a="analisarGelo">${L("Analyse", "Analisar")}</button></div>` : ""}</div>
        ${nada && !facto ? `<p>${L("No samples to analyse. Go outside: chip the big rock with the pick, or dig with the shovel where you see a cross.", "Não há amostras para analisar. Vai lá fora: tira uma amostra da rocha grande com a picareta, ou cava com a pá onde vires uma cruz.")}</p>` : ""}${facto}<p class="sub" style="margin-top:10px">${L("Analysed so far", "Analisadas até agora")}: ${ev.anSolo} ${L("soil", "solo")} · ${ev.anGelo} ${L("ice", "gelo")} · ${L("rock", "rocha")} ${(e.descobertas || []).includes("amostra") ? "✓" : "—"}</p>`,
      );
    }
    if (id === "radio") {
      const tem = mont.includes("radio"),
        lig = G.vista.jogadores.filter((j) => j.ligado).length,
        votos = (e.votos || []).length;
      let corpo;
      if (!tem)
        corpo =
          e.fase === "instalacao" && mont.length === 1
            ? `<p>${L("The power is on. Install the communications module here; the antenna tower goes up outside.", "A energia está ligada. Instala aqui o módulo de comunicações; a torre da antena sobe lá fora.")}</p><button class="pri" data-a="instalarRadio">${L("INSTALL COMMUNICATIONS", "INSTALAR COMUNICAÇÕES")}</button>`
            : `<p class="sub">${L("No communications module yet. First unload the cargo and install the power module, outside.", "Ainda sem módulo de comunicações. Primeiro descarrega a carga e instala o módulo de energia, lá fora.")}</p>`;
      else if (e.fase === "operacao")
        corpo = `<p>${L("Mission control has the next task for the base ready.", "O controlo de missão tem a próxima tarefa da base pronta.")}</p><button class="pri" data-a="avancar">${L("RECEIVE THE NEXT TASK ►", "RECEBER A PRÓXIMA TAREFA ►")}</button>${lig > 1 && votos ? ` <span class="sub">${votos}/${lig}</span>` : ""}`;
      else
        corpo = `<p>${L("Link with Earth is up. Finish the base to receive tasks.", "A ligação à Terra está activa. Termina a base para receber tarefas.")}</p>`;
      const ev2 = e.eva;
      return cx(
        720,
        `<h2>${L("Communications screen", "Ecrã de comunicações")}</h2><p class="sub">${M ? L("A radio signal takes between 3 and 22 minutes to travel from Mars to Earth, depending on where the planets are.", "Um sinal de rádio demora entre 3 e 22 minutos de Marte à Terra, conforme a posição dos planetas.") : L("A radio signal takes about 1.3 seconds to travel from the Moon to Earth.", "Um sinal de rádio demora cerca de 1,3 segundos da Lua à Terra.")}</p>${corpo}
        ${ev2 ? `<div class="t" style="margin-top:14px"><span>${L("From the archive: a real spacewalk", "Do arquivo: uma saída extraveicular real")}</span></div><p class="sub">${esc(ev2.data || "")} · ${esc(ev2.veiculo || "")} · ${esc(ev2.tripulacao || "")}${ev2.duracao_min ? " · " + ev2.duracao_min + " min" : ""}<br>${esc(ev2.proposito || "")}</p>` : ""}`,
      );
    }
  }
  return "";
}

// ───────────── teclado e toque ─────────────
const TEC = {
  ArrowLeft: "esq",
  a: "esq",
  A: "esq",
  ArrowRight: "dir",
  d: "dir",
  D: "dir",
  " ": "salto",
  ArrowUp: "salto",
  w: "salto",
  W: "salto",
};
addEventListener("keydown", (ev) => {
  if (/INPUT|TEXTAREA/.test(ev.target.tagName)) return;
  const k = TEC[ev.key];
  if (k) {
    G.tecla[k] = 1;
    ev.preventDefault();
  } else if (
    (ev.key === "e" || ev.key === "E" || ev.key === "Enter") &&
    !ev.repeat &&
    !ev.target.closest("button")
  )
    usar();
});
addEventListener("keyup", (ev) => {
  const k = TEC[ev.key];
  if (k) G.tecla[k] = 0;
});
addEventListener("pointerdown", (ev) => {
  const b = ev.target.closest("[data-t]");
  if (b) {
    G.tecla[b.dataset.t] = 1;
    ev.preventDefault();
  }
});
addEventListener("pointerup", () => {
  G.tecla.esq = G.tecla.dir = G.tecla.salto = 0;
});

// ───────────── ciclo de desenho ─────────────
const cv = $("#cv"),
  c = cv.getContext("2d");
let ult = performance.now(),
  quadro = 0,
  saltoAnt = 0;
// Ajusta o palco de 1280×720 ao ecrã (no telemóvel usa a área visível, não a largura do conteúdo).
function escala() {
  const d = document.documentElement,
    W = d.clientWidth || innerWidth,
    H = d.clientHeight || innerHeight,
    k = Math.min(W / 1280, H / 720),
    p = $("#palco");
  p.style.transform = `scale(${k})`;
  p.style.left = (W - 1280 * k) / 2 + "px";
  p.style.top = (H - 720 * k) / 2 + "px";
}
addEventListener("resize", escala);
addEventListener("orientationchange", () => setTimeout(escala, 200));
escala();
function ciclo(agora) {
  const dt = Math.min(0.05, (agora - ult) / 1000),
    t = agora / 1000;
  ult = agora;
  quadro++;
  c.imageSmoothingEnabled = false;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.textBaseline = "alphabetic";
  if (G.anim && G.vista) {
    G.anim.t += dt;
    if (G.anim.tipo === "descolagem")
      cenas.descolagem(c, G.anim.t, G.cosm.nave, quadro);
    else
      cenas.aterragem(c, G.anim.t, G.vista.estado.destino, G.cosm.nave, quadro);
    if (G.anim.t >= G.anim.dur) {
      G.anim = null;
      desenhar();
    }
  } else if (G.ecra === "lobby" && G.vista) {
    R(c, 0, 0, 1280, 720, "#0b1030");
    const m = G.bloqueado ? 0 : G.tecla.dir - G.tecla.esq;
    G.lobbyAnda = !!m;
    if (m) {
      G.lobbyX = cl(G.lobbyX + m * 5 * dt, -10.2, 10.2);
      G.lobbyVirado = m < 0;
    }
    cenas.lobby(c, t, G);
  } else if (G.ecra === "jogo" && G.vista) {
    const e = G.vista.estado;
    if (e.pouso == null) cenas.rota(c, t, dt, G);
    else if (G.local === "dentro") mundo.interior(c, t, dt, G);
    else {
      mundo.superficie(c, t, dt, G);
      if (G.oxigenio() <= 0 && !e.desfecho && agora - (G.pediuAr || 0) > 1500) {
        G.pediuAr = agora;
        actualizar();
      } // o servidor decide o regresso
      if (saltoAnt !== G.jog.ultimoSalto) {
        saltoAnt = G.jog.ultimoSalto;
        desenhar();
      }
    }
    hudVivo();
  } else {
    R(c, 0, 0, 1280, 720, "#050820");
    estrelas(c, 0.9);
    terra(c, 330, 980, 420);
    nave(
      c,
      520 + Math.sin(t * 0.4) * 20,
      400 + Math.cos(t * 0.5) * 10,
      2.4,
      -18,
      1,
      0,
      G.cosm.nave,
      t,
    );
  }
  const sim = $("#sim");
  if (sim && G.ui.dlg) {
    const f = G.ui.dlg.fase;
    desenharSim(
      sim.getContext("2d"),
      G.ui.dlg.id,
      f === "saber" ? "problema" : f,
      t,
    );
    if (f === "ok") {
      const seg = (agora - G.ui.dlg.t0) / 1000;
      document
        .querySelectorAll("[data-passo]")
        .forEach((p) =>
          p.classList.toggle("on", seg > 0.4 + +p.dataset.passo * 1.3),
        );
    }
  }
  requestAnimationFrame(ciclo);
}

// ───────────── arranque ─────────────
(async () => {
  document.documentElement.lang = I.lang;
  desenhar();
  requestAnimationFrame(ciclo);
  try {
    G.cat = await api("/catalogo");
    mundo.configurar(G.cat.superficie);
    G.saude = await api("/saude");
    G.politica = await api("/conta/politica");
  } catch (e) {
    G.ecra = "erro";
    G.ui.erro = e.message;
    desenhar();
    return;
  }
  const h = new URLSearchParams(location.hash.slice(1));
  try {
    G.perfil = await api("/conta");
  } catch {
    G.perfil = null;
  }
  if (h.get("autorizar")) {
    G.ui.codigo = h.get("autorizar");
    G.ui.auth = "autorizar";
    G.ecra = "auth";
    desenhar();
    return;
  }
  if (h.get("confirmar")) {
    G.ui.codigo = h.get("confirmar");
    G.ui.auth = "confirmar";
    G.ecra = "auth";
    desenhar();
    return;
  }
  if (G.perfil) await depoisDeEntrar();
  else {
    G.ecra = "auth";
    desenhar();
  }
})();
