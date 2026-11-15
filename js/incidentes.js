// Os 27 incidentes do backend (app/catalogo.py · LINHAS). Para cada um: que simulação mostrar,
// os passos da resolução segura e porque é que a opção arriscada falha.
// O título, o sinal, as opções e a consequência vêm sempre do servidor; aqui só está a explicação visual.
import { R, P, C, T as T0, astro, nave, terra, cl } from "./sprites.js";
import { I } from "./i18n.js";
import { EXPLICA_EN, SABER_PT } from "./explica.js";

// Rótulos das simulações: português → inglês
const ROT = {
  PROBLEMA: "PROBLEM",
  "CORREU MAL": "WENT WRONG",
  RESOLVIDO: "SOLVED",
  bateria: "battery",
  propulsante: "propellant",
  base: "base",
  alvo: "target",
  "curto: rochas": "short: rocks",
  "seguro: mais longo": "safe: longer",
  "corredor de navegação": "navigation corridor",
  "estrelas-guia": "guide stars",
  Vida: "Life",
  Calor: "Heat",
  Oficina: "Workshop",
  Lab: "Lab",
  circuito: "circuit",
  reserva: "reserve",
  "válvula fechada": "valve closed",
  válvula: "valve",
  fuga: "leak",
  "O₂ pressão": "O₂ pressure",
  "filtro novo": "new filter",
  "filtro saturado": "saturated filter",
  "lote reciclado": "recycled batch",
  isolado: "isolated",
  "amostra confirmada": "sample confirmed",
  "gelo provável?": "probable ice?",
  "água a bordo": "water on board",
  "abrigo blindado": "shielded shelter",
  dose: "dose",
  equipa: "crew",
  Terra: "Earth",
  "o sinal demora a ir e a voltar": "the signal takes time to go and return",
  "Procedimento local": "Local procedure",
  "à espera…": "waiting…",
  "o Sol fica no caminho": "the Sun is in the way",
  "tarefas locais ✓": "local tasks ✓",
  "tarefa parada": "task stopped",
  "preparar tarefas": "prepare tasks",
  retransmissor: "relay",
  "sem linha de visão": "no line of sight",
  "guarda-lamas reparado": "fender repaired",
  "guarda-lamas partido": "broken fender",
  "vedação riscada": "seal scratched",
  "limpa e testada ✓": "clean and tested ✓",
  habitat: "habitat",
  antecâmara: "airlock",
  limpeza: "cleaning",
  "origem perdida": "origin lost",
  "separadas e registadas ✓": "separated and logged ✓",
  "qual é qual?": "which is which?",
  Incidente: "Incident",
};
const T = (c, x, y, s, t, ...r) =>
  T0(c, x, y, s, I.lang === "pt" ? t : ROT[t] || t, ...r);
// Explicação na língua actual: o que é preciso saber antes, os passos e porque falha o risco.
export function explicar(id) {
  const i = INCIDENTES[id] || { passos: [], risco: "" },
    e = EXPLICA_EN[id];
  if (I.lang === "pt" || !e)
    return { saber: SABER_PT[id] || "", passos: i.passos, risco: i.risco };
  return { saber: e[0], passos: e.slice(1, 4), risco: e[4] };
}

export const INCIDENTES = {
  // ── viagem ──
  desvio: {
    sim: "rota",
    p: { modo: "corredor" },
    passos: [
      "Medir a posição da nave contra o corredor de navegação.",
      "Fazer já um impulso pequeno de correcção.",
      "Confirmar que a previsão de chegada voltou ao corredor.",
    ],
    risco:
      "Quanto mais tarde se corrige, maior tem de ser a manobra e mais propulsante se gasta.",
  },
  impacto: {
    sim: "energia",
    p: { causa: "impacto" },
    passos: [
      "Ver quanto o painel danificado deixou de produzir.",
      "Desligar os consumos que não são essenciais.",
      "Estabilizar a bateria com o suporte de vida ligado.",
    ],
    risco:
      "Manter as experiências ligadas esvazia a bateria enquanto o painel produz menos.",
  },
  oxigenio: {
    sim: "suporte",
    p: { tipo: "fuga" },
    passos: [
      "Localizar o compartimento onde a pressão cai.",
      "Fechar a válvula para isolar a fuga.",
      "Ligar a reserva intacta ao circuito.",
    ],
    risco:
      "Dar mais oxigénio a um circuito com fuga só faz perder mais oxigénio.",
  },
  co2: {
    sim: "suporte",
    p: { tipo: "co2" },
    passos: [
      "Reparar que a pressão está normal mas o CO₂ sobe.",
      "Inspeccionar o sistema que remove o CO₂.",
      "Trocar o filtro e ver a leitura descer.",
    ],
    risco: "Juntar oxigénio não retira o CO₂: são dois sistemas diferentes.",
  },
  radiacao: {
    sim: "radiacao",
    p: {},
    passos: [
      "Confirmar o alerta de partículas solares.",
      "Levar toda a tripulação para o abrigo blindado.",
      "Esperar que as leituras baixem antes de sair.",
    ],
    risco:
      "Cada minuto fora do abrigo soma exposição que já não se pode retirar.",
  },
  atraso: {
    sim: "comunicacao",
    p: { tipo: "atraso" },
    passos: [
      "Perceber que o sinal demora a ir e a voltar.",
      "Abrir o procedimento local já autorizado.",
      "Executar e enviar o relatório para a Terra.",
    ],
    risco:
      "Ficar à espera da Terra gasta a margem de tempo que a equipa tem para reagir.",
  },
  sensor_estrelas: {
    sim: "rota",
    p: { modo: "estrelas" },
    passos: [
      "Comparar o sensor de estrelas com a posição do Sol.",
      "Identificar o sensor que está errado.",
      "Realinhar a nave antes de ligar o motor.",
    ],
    risco: "Um impulso com a nave mal apontada empurra-a para o lado errado.",
  },
  refrigeracao: {
    sim: "energia",
    p: { causa: "calor" },
    passos: [
      "Ver que módulo está a aquecer.",
      "Reduzir a carga desse módulo.",
      "Inspeccionar o arrefecimento antes de religar.",
    ],
    risco:
      "Mais potência dá mais calor: o módulo desliga-se sozinho para se proteger.",
  },
  reciclagem_agua: {
    sim: "suporte",
    p: { tipo: "agua" },
    passos: [
      "Separar o lote que ainda não passou no controlo.",
      "Usar a reserva de água já verificada.",
      "Repetir o tratamento e a análise do lote.",
    ],
    risco:
      "Distribuir água por verificar pode obrigar a deitar fora o lote inteiro.",
  },
  // ── Lua ──
  rochas: {
    sim: "rota",
    p: { modo: "pouso" },
    passos: [
      "Ver que o ponto previsto tem rochas.",
      "Escolher uma alternativa plana e ao alcance.",
      "Descer com margem de propulsante.",
    ],
    risco:
      "Pairar por cima das rochas gasta propulsante sem resolver o problema.",
  },
  sombra: {
    sim: "energia",
    p: { causa: "sombra" },
    passos: [
      "Prever quando o relevo tapa o Sol.",
      "Guardar energia para aquecimento e suporte de vida.",
      "Desligar a oficina e o laboratório até a luz voltar.",
    ],
    risco:
      "Com os painéis à sombra, a oficina e o laboratório esvaziam a bateria.",
  },
  relevo: {
    sim: "comunicacao",
    p: { tipo: "relevo" },
    passos: [
      "Reparar que a elevação tapa o rádio.",
      "Voltar ao último ponto onde havia sinal.",
      "Restabelecer contacto e replanear o caminho.",
    ],
    risco:
      "Seguir em frente sem sinal afasta a equipa do último ponto de contacto.",
  },
  rover_lua: {
    sim: "poeira",
    p: { tipo: "rover" },
    passos: [
      "Parar o rover.",
      "Verificar o guarda-lamas danificado.",
      "Reparar com peças de reserva antes de continuar.",
    ],
    risco: "Mesmo devagar, a roda continua a atirar poeira para o veículo.",
  },
  junta: {
    sim: "poeira",
    p: { tipo: "junta" },
    passos: [
      "Não forçar a ligação.",
      "Limpar a poeira da junta.",
      "Testar a vedação antes de usar.",
    ],
    risco: "Apertar com poeira lá dentro risca a vedação e estraga a junta.",
  },
  gelo_lua: {
    sim: "rota",
    p: { modo: "trilho" },
    passos: [
      "Calcular a energia da ida e da volta.",
      "Reservar a bateria do regresso.",
      "Prospectar só até onde a margem deixa.",
    ],
    risco:
      "Gastar a bateria de regresso para chegar ao gelo deixa a equipa sem volta.",
  },
  poeira_antecamara: {
    sim: "poeira",
    p: { tipo: "fato" },
    passos: [
      "Parar na antecâmara.",
      "Limpar botas e trajes antes de entrar.",
      "Só depois abrir a porta do habitat.",
    ],
    risco:
      "A poeira lunar é abrasiva: dentro do habitat desgasta juntas e equipamento.",
  },
  oscilacao_termica: {
    sim: "energia",
    p: { causa: "frio" },
    passos: [
      "Ver que instrumento está a arrefecer.",
      "Reservar energia para esse instrumento crítico.",
      "Desligar as experiências secundárias.",
    ],
    risco:
      "Dividir a energia por tudo deixa o instrumento crítico sem o suficiente.",
  },
  retransmissor: {
    sim: "comunicacao",
    p: { tipo: "rele" },
    passos: [
      "Ver que o local não tem linha de visão.",
      "Marcar a passagem do retransmissor.",
      "Comunicar através dele à hora certa.",
    ],
    risco: "Transmitir directamente através do relevo não chega à base.",
  },
  // ── Marte ──
  pouso_marte: {
    sim: "rota",
    p: { modo: "trilho" },
    passos: [
      "Aceitar o pouso seguro, mesmo longe da carga.",
      "Estudar o terreno entre a nave e a carga.",
      "Marcar e confirmar uma rota antes de mover.",
    ],
    risco:
      "Mover a carga sem rota marcada faz perder tempo em terreno desconhecido.",
  },
  tempestade: {
    sim: "energia",
    p: { causa: "poeira" },
    passos: [
      "Ver a produção dos painéis a cair.",
      "Manter só os sistemas essenciais.",
      "Esperar que a poeira assente.",
    ],
    risco: "A poeira corta a luz: continuar os trabalhos gasta a reserva.",
  },
  frio: {
    sim: "energia",
    p: { causa: "frio" },
    passos: [
      "Ler a previsão da noite.",
      "Reservar energia para o aquecimento.",
      "Adiar a experiência para o dia seguinte.",
    ],
    risco: "Sem aquecimento, os sensores reiniciam durante a noite.",
  },
  conjuncao: {
    sim: "comunicacao",
    p: { tipo: "sol" },
    passos: [
      "Saber que o Sol vai ficar entre Marte e a Terra.",
      "Preparar tarefas e procedimentos locais.",
      "Trabalhar com autonomia até a ligação voltar.",
    ],
    risco:
      "Guardar as decisões para depois deixa tarefas paradas sem resposta.",
  },
  gelo_marte: {
    sim: "suporte",
    p: { tipo: "gelo" },
    passos: [
      "Tratar o gelo como «provável», não como água.",
      "Confirmar com uma amostra.",
      "Continuar a usar a água transportada.",
    ],
    risco:
      "Gastar a reserva a contar com gelo por confirmar deixa a água abaixo do plano.",
  },
  roda_marte: {
    sim: "rota",
    p: { modo: "trilho" },
    passos: [
      "Ver o desgaste das rodas.",
      "Comparar o trajecto curto com o seguro.",
      "Seguir pelo terreno que poupa as rodas.",
    ],
    risco: "O caminho curto passa por rocha afiada e estraga as rodas.",
  },
  painel_marte: {
    sim: "energia",
    p: { causa: "poeira" },
    passos: [
      "Reparar que o céu está limpo mas o painel produz pouco.",
      "Inspeccionar a poeira depositada.",
      "Limpar o painel e gerir a energia.",
    ],
    risco: "Retomar tudo com o painel sujo consome mais do que ele gera.",
  },
  amostra_marte: {
    sim: "amostras",
    p: {},
    passos: [
      "Parar a análise.",
      "Isolar cada recipiente.",
      "Confirmar o registo de origem de cada amostra.",
    ],
    risco: "Misturar amostras apaga de onde veio cada uma: a ciência perde-se.",
  },
  abrigo_marte: {
    sim: "radiacao",
    p: {},
    passos: [
      "Receber o alerta antes da saída.",
      "Adiar a saída.",
      "Proteger a equipa no abrigo até passar.",
    ],
    risco: "Mesmo uma saída curta soma exposição durante o alerta.",
  },
};

// fase: 'problema' | 'risco' | 'ok'. Canvas de 380×230.
const W = 380,
  H = 230;
function fundo(c, cor = "#070a22") {
  R(c, 0, 0, W, H, cor);
}
function estrelinhas(c) {
  for (let i = 0; i < 26; i++)
    R(c, (i * 97) % W, (i * 53) % 140, 2, 2, "#fff", 0.5);
}
function etiqueta(c, fase) {
  const m = {
    problema: ["PROBLEMA", "#ffd84d"],
    risco: ["CORREU MAL", "#ff7a85"],
    ok: ["RESOLVIDO", "#3ee0d0"],
  }[fase];
  R(c, 8, 8, 92, 20, "#0b1030", 0.9);
  T(c, 14, 22, 11, m[0], m[1], "left", false, 700);
}
function bateria(c, x, y, v, cor) {
  R(c, x, y, 24, 70, "#2a3380");
  R(c, x + 8, y - 5, 8, 5, "#2a3380");
  R(c, x + 3, y + 3 + 64 * (1 - v), 18, 64 * v, cor);
}

const SIMS = {
  rota(c, t, fase, p) {
    fundo(c);
    if (p.modo === "pouso") {
      estrelinhas(c);
      R(c, 0, 170, W, 60, "#8e8e9a");
      R(c, 0, 170, W, 3, "#b8b8c6");
      [
        [150, 168, 20],
        [176, 166, 26],
        [206, 168, 16],
      ].forEach((q) =>
        P(
          c,
          [q[0], 170, q[0] + q[2] / 2, 170 - q[2] * 0.7, q[0] + q[2], 170],
          "#6f6f7c",
        ),
      );
      const alvo = fase === "ok" ? 300 : 185,
        cor = fase === "ok" ? "#3ee0d0" : "#ff7a85";
      c.strokeStyle = cor;
      c.lineWidth = 2;
      c.setLineDash([5, 4]);
      c.beginPath();
      c.ellipse(alvo, 174, 40, 7, 0, 0, 6.3);
      c.stroke();
      c.setLineDash([]);
      const y =
        fase === "ok"
          ? cl(40 + ((t * 30) % 110), 40, 132)
          : 70 + Math.sin(t * 3) * 4;
      nave(c, alvo, y, 0.8, -90, 0.6, 1, "aurora", t);
      R(c, 330, 30, 14, 80, "#2a3380");
      const f =
        fase === "risco" ? 0.2 : fase === "ok" ? 0.7 : 0.6 - ((t * 0.08) % 0.3);
      R(
        c,
        332,
        32 + 76 * (1 - f),
        10,
        76 * f,
        fase === "risco" ? "#ff7a85" : "#ff8a3d",
      );
      T(c, 337, 124, 9, "propulsante", "#a9b2e0", "center", false, 400);
    } else if (p.modo === "trilho") {
      R(c, 0, 0, W, H, "#3b2a20");
      for (let i = 0; i < 9; i++)
        P(
          c,
          [
            150 + i * 12,
            118 + (i % 3) * 8,
            158 + i * 12,
            104 + (i % 3) * 8,
            166 + i * 12,
            118 + (i % 3) * 8,
          ],
          "#8a4326",
        );
      R(c, 26, 98, 26, 26, "#cfd6f5");
      T(c, 39, 140, 10, "base", "#e8ecff", "center");
      R(c, 318, 100, 22, 22, "#3ee0d0");
      T(c, 329, 140, 10, "alvo", "#e8ecff", "center");
      c.lineWidth = 3;
      c.setLineDash([6, 5]);
      c.strokeStyle = fase === "ok" ? "#5a3a2a" : "#ff7a85";
      c.beginPath();
      c.moveTo(52, 111);
      c.lineTo(318, 111);
      c.stroke();
      c.strokeStyle = "#3ee0d0";
      c.beginPath();
      c.moveTo(52, 111);
      c.quadraticCurveTo(185, 10, 318, 111);
      c.stroke();
      c.setLineDash([]);
      T(c, 185, 172, 10, "curto: rochas", "#ff9aa3", "center");
      T(c, 185, 44, 10, "seguro: mais longo", "#3ee0d0", "center");
      let x, y;
      const k = (t * 0.25) % 1;
      if (fase === "ok") {
        const m = 1 - k;
        x = m * m * 52 + 2 * m * k * 185 + k * k * 318;
        y = m * m * 111 + 2 * m * k * 10 + k * k * 111;
      } else if (fase === "risco") {
        x = 176 + Math.sin(t * 20) * 1.5;
        y = 111;
      } else {
        x = 60 + Math.sin(t * 2) * 4;
        y = 111;
      }
      R(c, x - 9, y - 7, 18, 10, "#f2dfc0");
      C(c, x - 6, y + 5, 4, "#1a1a2e");
      C(c, x + 6, y + 5, 4, "#1a1a2e");
    } else {
      estrelinhas(c);
      C(c, 345, 115, 22, "#c9c9d6");
      c.strokeStyle = "#3ee0d0";
      c.globalAlpha = 0.5;
      c.lineWidth = 2;
      c.setLineDash([6, 6]);
      c.beginPath();
      c.moveTo(20, 95);
      c.lineTo(325, 108);
      c.moveTo(20, 135);
      c.lineTo(325, 122);
      c.stroke();
      c.setLineDash([]);
      c.globalAlpha = 1;
      T(c, 24, 88, 10, "corredor de navegação", "#3ee0d0", "left", false, 400);
      const k = (t * 0.2) % 1,
        x = 40 + 200 * k;
      const fora =
        fase === "ok"
          ? 40 * (1 - cl(k * 2.5))
          : fase === "risco"
            ? 20 + 60 * k
            : 10 + 34 * k;
      const ang =
        p.modo === "estrelas"
          ? fase === "ok"
            ? 20 * (1 - cl(k * 2.5))
            : 20 + Math.sin(t * 2) * 12
          : fase === "ok"
            ? 0
            : -8;
      c.strokeStyle = fase === "ok" ? "#3ee0d0" : "#ff7a85";
      c.setLineDash([3, 4]);
      c.beginPath();
      c.moveTo(40, 115 - (fase === "ok" ? 40 : 10));
      c.lineTo(x, 115 - fora);
      c.stroke();
      c.setLineDash([]);
      nave(
        c,
        x,
        115 - fora,
        0.7,
        ang,
        fase === "ok" && k < 0.4 ? 0.8 : 0.3,
        0,
        "aurora",
        t,
      );
      if (p.modo === "estrelas") {
        [
          [90, 40],
          [250, 30],
          [300, 190],
        ].forEach((q) => {
          R(c, q[0] - 3, q[1] - 3, 6, 6, "#ffd84d");
        });
        T(c, 250, 22, 10, "estrelas-guia", "#ffd84d", "center", false, 400);
      }
    }
  },
  energia(c, t, fase, p) {
    const noite = p.causa === "frio",
      marteS = p.causa === "poeira";
    fundo(c, marteS ? "#b8694f" : "#070a22");
    if (!marteS) estrelinhas(c);
    R(c, 0, 180, W, 50, marteS ? "#a8522f" : "#5a5a66");
    if (!noite) {
      C(c, 60, 50, 18, "#fff3d6");
      if (marteS) C(c, 60, 50, 30, "#fff3d6", 0.3);
    } else {
      T(c, 60, 56, 26, "☾", "#cfd6f5", "center");
    }
    P(c, [110, 180, 110, 130, 190, 112, 190, 180], "#4a7bd1");
    for (let i = 0; i < 5; i++) R(c, 124 + i * 15, 116, 2, 62, "#1a2a6b");
    if (p.causa === "sombra") {
      P(c, [0, 180, 70, 80, 140, 180], "#2a2a36");
      if (fase !== "ok" || true)
        P(c, [70, 80, 200, 180, 140, 180], "#000", 0.6);
    }
    if (p.causa === "poeira") {
      for (let i = 0; i < 40; i++)
        R(c, (i * 37 + t * 60) % W, (i * 23) % 170, 10, 3, "#e8b27a", 0.5);
      if (fase !== "ok")
        P(c, [110, 130, 190, 112, 190, 126, 110, 144], "#e8b27a", 0.85);
    }
    if (p.causa === "impacto") {
      P(c, [140, 150, 150, 132, 158, 150, 150, 160], "#000", 0.8);
      for (let i = 0; i < 4; i++)
        R(
          c,
          150 + Math.cos(i + t * 4) * (8 + ((t * 20) % 20)),
          146 + Math.sin(i * 2 + t * 4) * 12,
          3,
          3,
          "#ffd84d",
        );
    }
    if (p.causa === "calor") {
      for (let i = 0; i < 4; i++)
        R(
          c,
          124 + i * 18,
          100 - ((t * 20 + i * 9) % 30),
          4,
          10,
          "#ff7a3d",
          fase === "ok" ? 0.15 : 0.8,
        );
    }
    if (noite)
      for (let i = 0; i < 12; i++)
        R(c, (i * 47) % W, (i * 31 + t * 12) % 170, 3, 3, "#cfefff", 0.7);
    const v =
      fase === "ok"
        ? 0.62 + Math.sin(t) * 0.02
        : fase === "risco"
          ? 0.14
          : 0.6 - ((t * 0.07) % 0.3);
    bateria(
      c,
      226,
      100,
      v,
      fase === "risco"
        ? Math.floor(t * 4) % 2
          ? "#ff7a85"
          : "#5a1a1a"
        : fase === "ok"
          ? "#3ee0d0"
          : "#ffd84d",
    );
    T(c, 238, 190, 9, "bateria", "#e8ecff", "center", false, 400);
    [
      ["Vida", 1],
      ["Calor", 1],
      ["Oficina", 0],
      ["Lab", 0],
    ].forEach((q, i) => {
      const on = q[1] || fase !== "ok",
        y = 60 + i * 34;
      R(c, 276, y, 92, 26, on ? (q[1] ? "#0f5f58" : "#5a3a10") : "#1a1f40");
      T(c, 284, y + 17, 11, q[0], on ? "#e8ecff" : "#6a74b0");
      T(
        c,
        360,
        y + 17,
        10,
        on ? "ON" : "OFF",
        on ? "#3ee0d0" : "#6a74b0",
        "right",
      );
    });
  },
  suporte(c, t, fase, p) {
    fundo(c, "#141a45");
    R(c, 0, 190, W, 40, "#0b1030");
    const tanque = (x, lbl, v, cor, marca) => {
      R(c, x, 60, 56, 120, "#2a3380");
      R(c, x + 4, 64 + 112 * (1 - v), 48, 112 * v, cor);
      T(c, x + 28, 200, 10, lbl, "#e8ecff", "center");
      if (marca)
        T(
          c,
          x + 28,
          52,
          16,
          marca,
          marca === "✓" ? "#3ee0d0" : "#ffd84d",
          "center",
          false,
          700,
        );
    };
    if (p.tipo === "fuga") {
      const v =
        fase === "ok"
          ? 0.55
          : fase === "risco"
            ? 0.25
            : 0.7 - ((t * 0.06) % 0.3);
      tanque(40, "circuito", v, "#3ee0d0");
      tanque(
        280,
        "reserva",
        fase === "risco" ? 0.5 : 0.95,
        "#3ee0d0",
        fase === "ok" ? "✓" : "",
      );
      R(c, 96, 120, 184, 8, "#8a93bb");
      R(c, 180, 108, 16, 32, fase === "ok" ? "#e8403f" : "#8a93bb");
      T(
        c,
        188,
        100,
        10,
        fase === "ok" ? "válvula fechada" : "válvula",
        "#e8ecff",
        "center",
      );
      if (fase !== "ok")
        for (let i = 0; i < 8; i++)
          C(
            c,
            130 + ((t * 40 + i * 14) % 50) * (i % 2 ? 0.4 : -0.3),
            116 - ((t * 50 + i * 12) % 60),
            3,
            "#8fe8ff",
            0.8,
          );
      if (fase !== "ok") T(c, 130, 150, 10, "fuga", "#ff9aa3", "center");
    } else if (p.tipo === "co2") {
      const co =
        fase === "ok"
          ? 0.3 - cl((t * 0.1) % 0.3) * 0.5
          : fase === "risco"
            ? 0.85
            : 0.4 + ((t * 0.08) % 0.4);
      tanque(40, "O₂ pressão", fase === "risco" ? 0.5 : 0.8, "#3ee0d0", "✓");
      tanque(150, "CO₂", co, co > 0.6 ? "#ff7a85" : "#ffd84d");
      R(c, 260, 90, 90, 60, "#2a3380");
      R(c, 268, 98, 74, 44, fase === "ok" ? "#cfd6f5" : "#5a4a3a");
      T(
        c,
        305,
        170,
        10,
        fase === "ok" ? "filtro novo" : "filtro saturado",
        "#e8ecff",
        "center",
      );
      for (let i = 0; i < 5; i++)
        R(c, 272 + i * 14, 102, 4, 36, "#0b1030", 0.5);
    } else if (p.tipo === "agua") {
      tanque(
        60,
        "lote reciclado",
        0.7,
        fase === "risco" ? "#6a5a3a" : "#4a7bd1",
        fase === "ok" ? "" : "?",
      );
      tanque(240, "reserva", fase === "risco" ? 0.35 : 0.8, "#4a7bd1", "✓");
      if (fase === "ok") {
        R(c, 52, 40, 72, 5, "#ffd84d");
        T(c, 88, 34, 10, "isolado", "#ffd84d", "center");
        for (let i = 0; i < 4; i++)
          C(c, 310, 190 - ((t * 40 + i * 20) % 30), 3, "#8fe8ff");
      } else if (fase === "problema")
        T(c, 190, 120, 22, "→ ?", "#ffd84d", "center", false, 700);
    } else {
      R(c, 0, 150, W, 80, "#a8522f");
      P(c, [40, 150, 80, 132, 150, 150], "#cfefff");
      T(
        c,
        95,
        124,
        10,
        fase === "ok" ? "amostra confirmada" : "gelo provável?",
        fase === "ok" ? "#3ee0d0" : "#ffd84d",
        "center",
      );
      tanque(
        260,
        "água a bordo",
        fase === "risco" ? 0.25 : 0.7,
        "#4a7bd1",
        fase === "risco" ? "" : "✓",
      );
      if (fase === "ok") {
        R(c, 90, 138, 6, 14, "#e8ecff");
        R(c, 86, 134, 14, 5, "#3ee0d0");
      }
    }
  },
  radiacao(c, t, fase) {
    fundo(c);
    estrelinhas(c);
    C(c, -10, 60, 50, "#ffd84d");
    C(c, -10, 60, 64, "#ffd84d", 0.25);
    R(c, 0, 185, W, 45, "#5a5a66");
    R(c, 230, 110, 110, 75, "#7c7c89");
    R(c, 238, 118, 94, 67, "#141a45");
    T(c, 285, 104, 10, "abrigo blindado", "#e8ecff", "center");
    for (let i = 0; i < 16; i++) {
      const k = (t * 0.6 + i * 0.07) % 1,
        x = 30 + k * 330,
        y = 50 + i * 9 + k * 30;
      if (!(x > 226 && y > 106)) R(c, x, y, 8, 2, "#ff7a85", 0.9);
    }
    const dentro = fase === "ok";
    astro(
      c,
      dentro ? 268 : 130 + Math.sin(t) * 6,
      dentro ? 128 : 130,
      2,
      "tomas",
      "lua",
      true,
    );
    const d =
      fase === "ok" ? 0.3 : fase === "risco" ? 0.9 : 0.3 + ((t * 0.1) % 0.4);
    R(c, 352, 40, 14, 130, "#2a3380");
    R(c, 354, 42 + 126 * (1 - d), 10, 126 * d, d > 0.7 ? "#ff7a85" : "#ffd84d");
    T(c, 359, 34, 9, "dose", "#e8ecff", "center", false, 400);
    R(c, 348, 60, 22, 2, "#ff7a85");
  },
  comunicacao(c, t, fase, p) {
    fundo(c);
    estrelinhas(c);
    R(c, 0, 185, W, 45, "#5a5a66");
    R(c, 40, 140, 4, 45, "#9aa3c7");
    P(c, [28, 140, 56, 124, 60, 132, 34, 148], "#e8ecff");
    T(c, 42, 204, 10, "equipa", "#e8ecff", "center");
    terra(c, 335, 50, 20);
    T(c, 335, 88, 10, "Terra", "#e8ecff", "center");
    const onda = (x0, y0, x1, y1, cor, vel = 0.5, corta = 1) => {
      for (let i = 0; i < 5; i++) {
        const k = (t * vel + i * 0.2) % 1;
        if (k < corta)
          C(c, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, 4, cor, 0.9);
      }
    };
    if (p.tipo === "atraso") {
      onda(58, 126, 318, 56, "#3ee0d0", 0.12);
      T(c, 190, 60, 11, "o sinal demora a ir e a voltar", "#ffd84d", "center");
      R(c, 120, 110, 140, 66, "#141a45");
      T(c, 130, 126, 10, "Procedimento local", "#e8ecff");
      for (let i = 0; i < 3; i++) {
        const feito = fase === "ok" && (t * 0.8) % 4 > i + 0.5;
        R(c, 130, 134 + i * 13, 8, 8, feito ? "#3ee0d0" : "#2a3380");
        R(c, 144, 136 + i * 13, 90, 4, "#6a74b0");
      }
      if (fase === "risco")
        T(c, 190, 100, 11, "à espera…", "#ff9aa3", "center");
    } else if (p.tipo === "sol") {
      C(c, 190, 80, 26, "#ffd84d");
      C(c, 190, 80, 38, "#ffd84d", 0.25);
      onda(58, 126, 318, 56, "#3ee0d0", 0.4, 0.42);
      T(c, 190, 30, 11, "o Sol fica no caminho", "#ffd84d", "center");
      R(c, 100, 140, 120, 40, "#141a45");
      T(
        c,
        108,
        156,
        10,
        fase === "ok"
          ? "tarefas locais ✓"
          : fase === "risco"
            ? "tarefa parada"
            : "preparar tarefas",
        fase === "risco" ? "#ff9aa3" : "#3ee0d0",
      );
    } else {
      P(c, [150, 185, 205, 70, 260, 185], "#3b3b4a");
      const atras = fase !== "ok" || p.tipo === "rele";
      const rx = atras ? 290 : 100;
      R(c, rx - 10, 172, 22, 10, "#f2f5ff");
      C(c, rx - 6, 184, 4, "#1a1a2e");
      C(c, rx + 8, 184, 4, "#1a1a2e");
      if (p.tipo === "rele" && fase === "ok") {
        const sx = 120 + ((t * 30) % 160);
        R(c, sx - 8, 34, 16, 8, "#cfd6f5");
        R(c, sx - 20, 36, 10, 4, "#4a7bd1");
        R(c, sx + 10, 36, 10, 4, "#4a7bd1");
        onda(290, 170, sx, 42, "#3ee0d0", 0.8);
        onda(sx, 42, 50, 128, "#3ee0d0", 0.8);
        T(c, 205, 22, 10, "retransmissor", "#3ee0d0", "center");
      } else if (fase === "ok") onda(100, 170, 54, 130, "#3ee0d0", 0.8);
      else {
        onda(290, 170, 54, 130, "#ff7a85", 0.6, 0.3);
        T(c, 205, 60, 11, "sem linha de visão", "#ff9aa3", "center");
      }
    }
  },
  poeira(c, t, fase, p) {
    fundo(c, "#141a45");
    R(c, 0, 190, W, 40, "#5a5a66");
    const po = (cx, cy, n, cor = "#b8b8c6") => {
      for (let i = 0; i < n; i++)
        R(
          c,
          cx + Math.cos(i * 2.4 + t) * (10 + ((i * 7 + t * 30) % 46)),
          cy + Math.sin(i * 1.7) * 26 - ((t * 20 + i * 5) % 20),
          4,
          4,
          cor,
          0.8,
        );
    };
    if (p.tipo === "rover") {
      R(c, 110, 130, 150, 30, "#f2f5ff");
      R(c, 200, 110, 50, 24, "#1a2a6b");
      C(c, 140, 172, 20, "#262c52");
      C(c, 230, 172, 20, "#262c52");
      C(c, 140, 172, 8, "#8a93bb");
      C(c, 230, 172, 8, "#8a93bb");
      c.strokeStyle = fase === "ok" ? "#3ee0d0" : "#ff7a85";
      c.lineWidth = 5;
      c.beginPath();
      c.arc(140, 172, 27, Math.PI, fase === "ok" ? 0 : -1.6);
      c.stroke();
      T(
        c,
        140,
        136,
        10,
        fase === "ok" ? "guarda-lamas reparado" : "guarda-lamas partido",
        "#e8ecff",
        "center",
      );
      if (fase !== "ok") po(120, 150, 22);
    } else if (p.tipo === "junta") {
      R(c, 60, 100, 110, 50, "#9aa3c7");
      R(c, 210, 100, 110, 50, "#9aa3c7");
      const gap = fase === "ok" ? 0 : 18;
      R(c, 170, 108, 20 - gap / 2, 34, "#cfd6f5");
      R(c, 190 + gap / 2, 108, 20 - gap / 2, 34, "#cfd6f5");
      if (fase !== "ok") po(190, 124, fase === "risco" ? 26 : 14);
      if (fase === "risco")
        T(c, 190, 80, 12, "vedação riscada", "#ff9aa3", "center");
      if (fase === "ok") {
        T(c, 190, 80, 12, "limpa e testada ✓", "#3ee0d0", "center");
      }
    } else {
      R(c, 200, 60, 160, 130, "#2a3380");
      R(c, 208, 68, 144, 122, "#141a45");
      T(c, 280, 52, 10, "habitat", "#e8ecff", "center");
      R(c, 110, 80, 90, 110, "#3b4a8f");
      T(c, 155, 72, 10, "antecâmara", "#e8ecff", "center");
      astro(c, fase === "risco" ? 250 : 130, 110, 2.6, "nyeleti", "lua", true);
      if (fase === "problema") po(150, 170, 14);
      if (fase === "risco") po(270, 170, 22);
      if (fase === "ok") {
        for (let i = 0; i < 5; i++)
          R(
            c,
            120 + i * 16,
            96 + ((t * 60 + i * 20) % 80),
            3,
            8,
            "#8fe8ff",
            0.8,
          );
        T(c, 155, 206, 10, "limpeza", "#3ee0d0", "center");
      }
    }
  },
  amostras(c, t, fase) {
    fundo(c, "#141a45");
    R(c, 30, 170, 320, 12, "#8a93bb");
    R(c, 50, 182, 10, 40, "#5a6290");
    R(c, 320, 182, 10, 40, "#5a6290");
    const frasco = (x, cor, lbl, ok) => {
      R(c, x, 110, 44, 60, "#cfd6f5", 0.35);
      R(c, x + 4, 136, 36, 30, cor);
      R(c, x + 8, 102, 28, 10, "#9aa3c7");
      R(c, x + 4, 120, 36, 12, ok ? "#f2f5ff" : "#5a6290");
      T(c, x + 22, 130, 10, lbl, "#0b1030", "center", false, 700);
    };
    if (fase === "risco") {
      frasco(168, "#8a5a4a", "?", true);
      T(c, 190, 80, 12, "origem perdida", "#ff9aa3", "center");
    } else if (fase === "ok") {
      frasco(90, "#c46a40", "A", true);
      frasco(246, "#7a3a22", "B", true);
      R(c, 188, 96, 4, 76, "#ffd84d");
      T(c, 190, 80, 12, "separadas e registadas ✓", "#3ee0d0", "center");
    } else {
      const d = Math.sin(t * 2) * 6;
      frasco(130 + d, "#c46a40", "", false);
      frasco(206 - d, "#7a3a22", "", false);
      T(c, 190, 80, 12, "qual é qual?", "#ffd84d", "center");
    }
  },
};

export function desenharSim(c, id, fase, t) {
  const i = INCIDENTES[id];
  c.imageSmoothingEnabled = false;
  if (!i) {
    fundo(c);
    T(c, W / 2, H / 2, 12, "Incidente", "#e8ecff", "center");
    return;
  }
  c.save();
  SIMS[i.sim](c, t, fase, i.p);
  c.restore();
  etiqueta(c, fase);
}
