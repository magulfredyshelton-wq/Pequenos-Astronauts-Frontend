// Superfície explorável (terreno grande, com relevo) e interior da base.
// Unidades em metros: 60 px por metro, o astronauta mede 1,8 m. O mundo vai de −520 m a +520 m da nave.
import {
  R,
  P,
  C,
  T,
  astro,
  nave,
  terra,
  estrelas,
  rng,
  cl,
  suave,
} from "./sprites.js";
import {
  ceuMarte,
  cordilheira,
  pedra,
  paineis,
  porFazer,
  etiq,
} from "./cenas.js";
import { L } from "./i18n.js";

export const PXM = 60,
  GY = 560,
  V_SALTO = 180;
// Valores da superfície: vêm do servidor (/api/catalogo → superficie); estes são só a reserva inicial.
export let MUNDO = 520,
  OX_MAX = 300,
  V_ANDAR = 4,
  V_ROVER = 13,
  ESCALA = 50;
export let POS = {
  nave: 0,
  carga: 5,
  energia: -16,
  torre: 13,
  habitat: 28,
  rover: -9,
  rocha: -95,
  baliza: 210,
  cratera: -292,
};
export let ESCAVAR = [
  { m: -48, tipo: "solo" },
  { m: 70, tipo: "solo" },
  { m: 150, tipo: "solo" },
  { m: -200, tipo: "solo" },
  { m: -336, tipo: "gelo" },
];
export function configurar(c) {
  if (!c) return;
  MUNDO = c.mundo;
  OX_MAX = c.oxigenio_s;
  V_ANDAR = c.v_andar;
  V_ROVER = c.v_rover;
  ESCALA = c.escala;
  POS = c.pos;
  ESCAVAR = c.escavar;
}
// A presença enviada ao servidor: metros a dividir pela escala (o servidor valida a distância a cada local).
export const xServidor = (m) => +cl(m / ESCALA, -10.39, 10.39).toFixed(3);
export const porta = (e) =>
  (e.montados || []).includes("habitat") ? POS.habitat + 1.6 : POS.nave + 1.4;

const CRAT = [
  [-340, 46, 150],
  [-150, 12, 36],
  [120, 16, 50],
  [300, 26, 80],
  [430, 30, 90],
  [-450, 20, 60],
];
export function alt(m, M) {
  let h =
    (26 * Math.sin(m / 37) +
      12 * Math.sin(m / 11 + 1) +
      44 * Math.sin(m / 140 + 2)) *
    suave((Math.abs(m) - 36) / 40);
  if (M) {
    h += 34 * Math.sin(m / 7) * suave((m - 90) / 40) * suave((330 - m) / 40);
    const d = Math.abs(m + 340);
    if (d < 60) h -= 110 * (1 - (d / 60) ** 2);
  } else
    CRAT.forEach((q) => {
      const d = Math.abs(m - q[0]);
      if (d < q[1]) h -= q[2] * (1 - (d / q[1]) ** 2);
      h += 14 * Math.exp(-(((d - q[1]) / 5) ** 2));
    });
  return h;
}
const acaso = (i, s = 1) => {
  let x = Math.imul(i * 374761393 + s * 668265263, 1274126177);
  x ^= x >>> 15;
  return ((x >>> 0) % 10000) / 10000;
};

// O que o jogador pode fazer onde está (o mais próximo primeiro). Devolve [{id, m, txt}].
export function interaccoes(G) {
  const e = G.vista.estado,
    J = G.jog,
    mont = e.montados || [],
    desc = e.descobertas || [],
    ev = G.eva,
    r = [];
  const junta = (id, m, txt, raio = 3) => {
    if (Math.abs(J.m - m) <= raio) r.push({ id, m, txt, d: Math.abs(J.m - m) });
  };
  if (J.rover) {
    junta("sairRover", J.m, L("Get off the rover", "Sair do rover"), 99);
  } else if (
    e.descarregada &&
    (e.carga || {}).rover &&
    G.roverM != null &&
    !G.condutor()
  )
    junta("rover", G.roverM, L("Drive the rover", "Conduzir o rover"), 3.5);
  if (!J.rover) {
    junta(
      "entrar",
      porta(e),
      mont.includes("habitat")
        ? L(
            "Enter the base (take off the suit)",
            "Entrar na base (tirar o traje)",
          )
        : L(
            "Enter the lander (take off the suit)",
            "Entrar na nave (tirar o traje)",
          ),
      2.2,
    );
    if (e.fase === "instalacao" && !e.descarregada)
      junta(
        "descarregar",
        POS.carga,
        L("Unload the cargo", "Descarregar a carga"),
      );
    if (e.fase === "instalacao" && e.descarregada && mont.length === 0)
      junta(
        "energia",
        POS.energia,
        L("Install the power module", "Instalar o módulo de energia"),
        4,
      );
    if (e.fase === "instalacao" && mont.length === 2)
      junta(
        "habitat",
        POS.habitat,
        L("Assemble the habitat", "Montar o habitat"),
        4,
      );
    if (!ev.rocha && !desc.includes("amostra"))
      junta(
        "rocha",
        POS.rocha,
        L("Chip a rock sample (pick)", "Tirar uma amostra da rocha (picareta)"),
        4,
      );
    if (!desc.includes("baliza"))
      junta(
        "baliza",
        POS.baliza,
        L("Plant and switch on the beacon", "Fixar e ligar a baliza"),
        4,
      );
    if (!desc.includes("cratera"))
      junta(
        "cratera",
        POS.cratera,
        L("Survey the depression (scanner)", "Registar a depressão (scanner)"),
        5,
      );
    ESCAVAR.forEach((q, i) => {
      if (!ev.cavados[i])
        junta("cavar" + i, q.m, L("Dig with the shovel", "Cavar com a pá"));
    });
  }
  return r.sort((a, b) => a.d - b.d);
}

function chao(c, cam, M, cor, topo) {
  c.fillStyle = cor;
  c.beginPath();
  c.moveTo(-20, 900);
  for (let x = -20; x <= 1300; x += 10)
    c.lineTo(x, GY - alt(cam + (x - 640) / PXM, M));
  c.lineTo(1300, 900);
  c.closePath();
  c.fill();
  c.strokeStyle = topo;
  c.lineWidth = 4;
  c.beginPath();
  for (let x = -20; x <= 1300; x += 10) {
    const y = GY - alt(cam + (x - 640) / PXM, M);
    x === -20 ? c.moveTo(x, y) : c.lineTo(x, y);
  }
  c.stroke();
}
function marca(c, x, y, nome, feito, t) {
  const cor = feito ? "#3ee0d0" : "#ffd84d",
    b = feito ? 0 : Math.sin(t * 4) * 4;
  P(
    c,
    [x, y + 14 + b, x - 9, y + b, x, y - 14 + b, x + 9, y + b],
    cor,
    feito ? 0.6 : 1,
  );
  T(c, x, y - 22 + b, 12, nome + (feito ? " ✓" : ""), cor, "center");
}
function desenhaRover(c, x, y, M) {
  R(c, x - 55, y - 62, 110, 36, M ? "#f2dfc0" : "#f2f5ff");
  R(c, x + 15, y - 56, 30, 16, "#1a2a6b");
  R(c, x - 55, y - 26, 110, 6, "#9aa3c7");
  R(c, x - 50, y - 70, 4, 10, "#9aa3c7");
  R(c, x - 58, y - 74, 20, 5, "#4a7bd1");
  [-39, 0, 39].forEach((d) => {
    C(c, x + d, y - 10, 11, "#262c52");
    C(c, x + d, y - 10, 4, "#8a93bb");
  });
}

export function superficie(c, t, dt, G) {
  const e = G.vista.estado,
    M = e.destino === "marte",
    J = G.jog,
    mont = e.montados || [],
    desc = e.descobertas || [],
    ev = G.eva;
  // ── movimento ──
  const g = (M ? 3.71 : 1.62) * PXM;
  let mov = G.bloqueado || J.cavar > 0 ? 0 : G.tecla.dir - G.tecla.esq;
  if (mov) {
    J.m = cl(J.m + mov * (J.rover ? V_ROVER : V_ANDAR) * dt, -MUNDO, MUNDO);
    J.virado = mov < 0;
    J.anda += dt;
    if (!M && J.y === 0 && !J.rover && Math.floor(J.anda * 3.5) !== J.pe) {
      J.pe = Math.floor(J.anda * 3.5);
      G.pegadas.push(J.m);
      if (G.pegadas.length > 260) G.pegadas.shift();
    }
  }
  J.aAndar = !!mov;
  if (G.tecla.salto && J.y === 0 && !G.bloqueado && !J.rover && J.cavar <= 0) {
    J.vy = V_SALTO;
    J.noAr = 0;
  }
  if (J.y > 0 || J.vy > 0) {
    J.y += J.vy * dt;
    J.vy -= g * dt;
    J.noAr += dt;
    if (J.y <= 0) {
      J.y = 0;
      J.vy = 0;
      J.ultimoSalto = J.noAr;
      J.poeira = 0;
    }
  }
  if (J.poeira != null) {
    J.poeira += dt;
    if (J.poeira > 3) J.poeira = null;
  }
  if (J.cavar > 0) J.cavar -= dt;
  if (J.rover) G.roverM = J.m;
  const cam = cl(J.m, -MUNDO + 10.6, MUNDO - 10.6);
  G.camY += (alt(J.m, M) * 0.85 - G.camY) * Math.min(1, dt * 4);
  const X = (m) => 640 + (m - cam) * PXM,
    Y = (m) => GY - alt(m, M),
    vis = (m, margem = 6) => Math.abs(m - cam) < 10.7 + margem;
  // ── céu ──
  if (M) {
    ceuMarte(c);
    const px = cam * 2;
    P(
      c,
      [
        300 - px * 0.15,
        GY,
        620 - px * 0.15,
        330,
        760 - px * 0.15,
        330,
        800 - px * 0.15,
        346,
        960 - px * 0.15,
        346,
        1300 - px * 0.15,
        GY + 60,
      ],
      "#d9a078",
    );
    P(
      c,
      [
        2300 - px * 0.15,
        GY + 60,
        2500 - px * 0.15,
        380,
        2800 - px * 0.15,
        380,
        2960 - px * 0.15,
        GY + 60,
      ],
      "#d9a078",
    );
    P(
      c,
      [
        -900 - px * 0.15,
        GY + 60,
        -760 - px * 0.15,
        400,
        -500 - px * 0.15,
        400,
        -380 - px * 0.15,
        GY + 60,
      ],
      "#d9a078",
    );
  } else {
    R(c, 0, 0, 1280, 720, "#000");
    estrelas(c, 1, 0, 620);
    terra(c, 1010 - cam * 0.2, 150, 32);
    C(c, 90 - cam * 0.1, 470, 20, "#fff");
  }
  c.save();
  c.translate(0, G.camY);
  if (M) {
    cordilheira(c, 21, 500, 80, 28, "#c98a68", cam * 8 + 20000, GY + 200);
    cordilheira(c, 22, 530, 40, 20, "#b8704c", cam * 16 + 20000, GY + 200);
    R(c, 0, GY - 60, 1280, 60, "#e8b27a", 0.35);
  } else cordilheira(c, 5, 525, 46, 24, "#4a4a56", cam * 14 + 20000, GY + 200);
  chao(c, cam, M, M ? "#a8522f" : "#8e8e9a", M ? "#c46a40" : "#b8b8c6");
  // sombra permanente (Lua) e leito do canal (Marte)
  if (!M) {
    CRAT.forEach((q) => {
      if (q[2] < 70 || !vis(q[0], q[1])) return;
      c.fillStyle = "rgba(0,0,0,.8)";
      c.beginPath();
      const a = q[0] - q[1] * 0.8,
        b = q[0] + q[1] * 0.8;
      c.moveTo(X(a), Y(a));
      for (let m = a; m <= b; m += 1) c.lineTo(X(m), Y(m));
      c.lineTo(X(b), Y(b) + 400);
      c.lineTo(X(a), Y(a) + 400);
      c.closePath();
      c.fill();
    });
    if (vis(-340, 20)) {
      R(c, X(-346), Y(-340) + 4, 12 * PXM, 10, "#8fe8ff", 0.8);
      R(c, X(-343), Y(-340) - 3, 5 * PXM, 8, "#cfefff", 0.8);
    }
  } else if (vis(-340, 60)) {
    c.fillStyle = "rgba(90,42,24,.5)";
    c.beginPath();
    c.moveTo(X(-385), Y(-385));
    for (let m = -385; m <= -295; m += 1) c.lineTo(X(m), Y(m));
    c.lineTo(X(-295), Y(-295) + 400);
    c.lineTo(X(-385), Y(-385) + 400);
    c.closePath();
    c.fill();
    for (let i = 0; i < 7; i++)
      R(c, X(-362 + i * 7), Y(-362 + i * 7) + 6, 30, 3, "#3b1a10");
  }
  // pedras, pegadas e marcos de distância
  for (let i = Math.floor((cam - 12) / 5); i <= (cam + 12) / 5; i++) {
    const m = i * 5 + acaso(i, 2) * 4;
    if (
      acaso(i) > 0.5 ||
      Math.abs(m) < 40 ||
      Object.values(POS).some((p) => Math.abs(p - m) < 5)
    )
      continue;
    const w = 14 + acaso(i, 3) * 50,
      h = 8 + acaso(i, 4) * 40;
    pedra(
      c,
      X(m),
      Y(m) + 3,
      w,
      h,
      M ? "#7a3a22" : "#a2a2b0",
      M ? "#5a2a18" : "#000",
      M ? w * 0.8 : w * 2.2,
      M ? 0.4 : 1,
    );
  }
  if (!M)
    G.pegadas.forEach((m) => {
      if (vis(m, 0)) R(c, X(m) - 5, Y(m) + 8, 10, 4, "#5a5a66");
    });
  for (let m = Math.ceil((cam - 11) / 50) * 50; m <= cam + 11; m += 50) {
    if (m === 0) continue;
    const x = X(m),
      y = Y(m);
    R(c, x - 2, y - 46, 4, 46, "#9aa3c7");
    R(c, x - 26, y - 62, 52, 20, "#0b1030", 0.9);
    c.strokeStyle = "#3ee0d0";
    c.lineWidth = 1.5;
    c.strokeRect(x - 26, y - 62, 52, 20);
    T(
      c,
      x,
      y - 48,
      11,
      (m < 0 ? "◄ " : "") + Math.abs(m) + " m" + (m > 0 ? " ►" : ""),
      "#e8ecff",
      "center",
    );
  }
  // locais de escavação
  ESCAVAR.forEach((q, i) => {
    if (!vis(q.m)) return;
    const x = X(q.m),
      y = Y(q.m);
    if (ev.cavados[i]) {
      c.fillStyle = M ? "#5a2a18" : "#3b3b4a";
      c.beginPath();
      c.ellipse(x, y + 5, 26, 8, 0, 0, 6.3);
      c.fill();
      P(
        c,
        [x + 26, y + 3, x + 44, y - 14, x + 64, y + 3],
        M ? "#c46a40" : "#b8b8c6",
      );
    } else {
      c.strokeStyle = "#ffd84d";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x - 10, y - 4);
      c.lineTo(x + 10, y + 12);
      c.moveTo(x + 10, y - 4);
      c.lineTo(x - 10, y + 12);
      c.stroke();
      T(
        c,
        x,
        y - 14 + Math.sin(t * 4) * 3,
        11,
        q.tipo === "gelo" ? L("ice?", "gelo?") : L("dig", "cavar"),
        "#ffd84d",
        "center",
      );
    }
  });
  // locais de ciência
  if (vis(POS.rocha, 8)) {
    const x = X(POS.rocha),
      y = Y(POS.rocha);
    pedra(
      c,
      x - 50,
      y + 3,
      100,
      70,
      M ? "#8a4326" : "#a2a2b0",
      M ? "#5a2a18" : "#000",
      M ? 60 : 170,
      M ? 0.45 : 1,
    );
    marca(
      c,
      x,
      y - 96,
      L("Rock", "Rocha"),
      ev.rocha || desc.includes("amostra"),
      t,
    );
  }
  if (vis(POS.baliza)) {
    const x = X(POS.baliza),
      y = Y(POS.baliza),
      ok = desc.includes("baliza");
    if (ok) {
      R(c, x - 3, y - 70, 6, 70, "#9aa3c7");
      R(c, x - 14, y - 6, 28, 6, "#5a6290");
      C(c, x, y - 76, 8, Math.floor(t * 2) % 2 ? "#3ee0d0" : "#0f5f58");
    } else {
      c.strokeStyle = "#ffd84d";
      c.setLineDash([6, 5]);
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(x, y + 4, 34, 8, 0, 0, 6.3);
      c.stroke();
      c.setLineDash([]);
    }
    marca(c, x, y - 100, L("Beacon point", "Ponto da baliza"), ok, t);
  }
  if (vis(POS.cratera, 8)) {
    const x = X(POS.cratera),
      y = Y(POS.cratera);
    R(c, x - 2, y - 40, 4, 40, "#ffd84d");
    R(c, x - 2, y - 40, 26, 14, "#ffd84d");
    marca(
      c,
      x,
      y - 70,
      L("Depression: survey from the rim", "Depressão: registar da borda"),
      desc.includes("cratera"),
      t,
    );
  }
  // ── zona da base: só painéis, torres e a nave ficam cá fora ──
  let x = X(POS.energia),
    y = Y(POS.energia);
  if (vis(POS.energia, 8)) {
    if (mont.includes("energia")) {
      if (M) {
        P(c, [x - 90, y, x - 90, y - 44, x, y - 64, x, y], "#4a7bd1");
        P(
          c,
          [x - 90, y - 44, x, y - 64, x, y - 52, x - 90, y - 32],
          "#e8b27a",
          G.tempestade(e) ? 0.85 : 0.3,
        );
        R(c, x - 46, y - 44, 3, 44, "#1a2a6b");
        P(
          c,
          [x - 200, y, x - 200, y - 44, x - 110, y - 64, x - 110, y],
          "#4a7bd1",
        );
        P(
          c,
          [x - 200, y - 44, x - 110, y - 64, x - 110, y - 52, x - 200, y - 32],
          "#e8b27a",
          0.3,
        );
      } else {
        R(c, x - 3, y - 210, 6, 210, "#9aa3c7");
        paineis(c, x - 40, y - 220, 80, 120);
        P(c, [x + 3, y, x + 170, y, x + 150, y + 5, x + 3, y + 5], "#000");
        R(c, x - 130, y - 150, 5, 150, "#9aa3c7");
        paineis(c, x - 160, y - 160, 64, 90);
      }
      R(c, x + 40, y - 3, 900, 3, "#ffd84d");
    } else if (e.descarregada)
      porFazer(c, x, y, 150, 120, L("Solar field", "Campo solar"), t);
  }
  x = X(POS.nave);
  y = GY;
  if (vis(0, 10)) {
    R(c, x - 150, y - 4, 300, 8, M ? "#5a2a18" : "#5a5a66");
    if (!M)
      P(c, [x + 60, y, x + 320, y, x + 300, y + 6, x + 60, y + 6], "#000");
    nave(c, x, y - 46 * 3, 3, -90, 0, 1, G.cosm.nave, t);
    if (!mont.includes("habitat")) {
      R(c, X(porta(e)) - 14, y - 60, 28, 56, "#262c52");
      R(c, X(porta(e)) - 10, y - 54, 20, 10, "#3ee0d0");
      R(c, X(porta(e)) - 22, y - 4, 44, 4, "#9aa3c7");
    }
    const cx = X(POS.carga);
    if (e.descarregada)
      [
        ["energia", "#4a7bd1"],
        ["radio", "#cfd6f5"],
        ["habitat", "#f2f5ff"],
      ]
        .filter((q) => !mont.includes(q[0]))
        .forEach((q, i) => {
          R(c, cx + 40 + i * 34, y - 30, 30, 30, q[1]);
          R(c, cx + 40 + i * 34, y - 30, 30, 5, "#262c52");
        });
    else {
      c.strokeStyle = "#ffd84d";
      c.setLineDash([8, 6]);
      c.lineWidth = 2;
      c.strokeRect(cx + 30, y - 50, 110, 50);
      c.setLineDash([]);
      T(
        c,
        cx + 85,
        y - 22,
        12,
        L("Cargo on board", "Carga a bordo"),
        "#ffd84d",
        "center",
      );
    }
  }
  if (vis(POS.torre, 8) && mont.includes("radio")) {
    x = X(POS.torre);
    y = Y(POS.torre);
    P(c, [x - 16, y, x - 4, y - 190, x + 4, y - 190, x + 16, y], "#9aa3c7");
    for (let i = 1; i < 6; i++)
      R(c, x - 14 + i * 2, y - i * 32, 28 - i * 4, 3, "#5a6290");
    P(
      c,
      [x - 30, y - 196, x + 22, y - 222, x + 26, y - 210, x - 20, y - 184],
      "#e8ecff",
    );
    if (Math.floor(t * 2) % 2) C(c, x, y - 196, 5, "#3ee0d0");
    if (M) {
      R(c, x + 60, y - 130, 4, 130, "#9aa3c7");
      P(c, [x + 64, y - 126, x + 110, y - 118, x + 64, y - 108], "#ff8a3d");
    }
  }
  if (vis(POS.habitat, 12)) {
    x = X(POS.habitat);
    y = Y(POS.habitat);
    if (mont.includes("habitat")) {
      if (M) {
        P(
          c,
          [
            x - 150,
            y,
            x - 110,
            y - 62,
            x - 50,
            y - 94,
            x + 50,
            y - 100,
            x + 110,
            y - 80,
            x + 150,
            y,
          ],
          "#8a4326",
        );
        P(
          c,
          [
            x - 150,
            y,
            x - 110,
            y - 62,
            x - 50,
            y - 94,
            x - 30,
            y - 80,
            x - 80,
            y - 40,
            x - 100,
            y,
          ],
          "#000",
          0.18,
        );
        R(c, x - 30, y - 80, 80, 10, "#f2f5ff", 0.9);
        R(c, x + 60, y - 62, 72, 62, "#9aa3c7");
        R(c, x + 82, y - 50, 28, 50, "#262c52");
        R(c, x + 86, y - 44, 20, 10, "#3ee0d0");
      } else {
        P(c, [x + 130, y, x + 330, y, x + 310, y + 6, x + 130, y + 6], "#000");
        R(c, x - 70, y - 62, 140, 62, "#cfd6f5");
        R(c, x + 30, y - 62, 40, 62, "#000", 0.15);
        c.fillStyle = "#f2f5ff";
        c.beginPath();
        c.roundRect(x - 82, y - 144, 164, 90, 34);
        c.fill();
        R(c, x - 82, y - 100, 164, 3, "#cfd6f5");
        R(c, x - 40, y - 124, 22, 16, "#1a2a6b");
        R(c, x + 10, y - 124, 22, 16, "#1a2a6b");
        R(c, x - 36, y - 122, 6, 5, "#ffd84d");
        P(
          c,
          [
            x - 140,
            y,
            x - 118,
            y - 50,
            x - 78,
            y - 84,
            x - 40,
            y - 80,
            x - 30,
            y,
          ],
          "#7c7c89",
        );
        R(c, x + 60, y - 62, 72, 62, "#9aa3c7");
        R(c, x + 82, y - 50, 28, 50, "#262c52");
        R(c, x + 86, y - 44, 20, 10, "#3ee0d0");
      }
      etiq(c, x + 96, y - 72, L("AIRLOCK", "ANTECÂMARA"), "#0b1030", "#3ee0d0");
    } else if (mont.includes("radio"))
      porFazer(c, x, y, 200, 130, L("Habitat", "Habitat"), t);
  }
  if (
    e.descarregada &&
    (e.carga || {}).rover &&
    G.roverM != null &&
    !G.condutor() &&
    vis(G.roverM)
  )
    desenhaRover(c, X(G.roverM), Y(G.roverM), M);
  if (M) {
    const dm = 120 + Math.sin(t * 0.2) * 40;
    if (vis(dm, 4))
      [
        [0, 60],
        [14, 44],
        [28, 34],
        [42, 26],
        [56, 20],
        [70, 14],
        [84, 10],
      ].forEach((q, i) =>
        R(
          c,
          X(dm) - q[1] / 2 + Math.sin(t * 3 + i) * 5,
          Y(dm) - 14 - q[0],
          q[1],
          10,
          "#f2cfa0",
          0.6,
        ),
      );
  }
  // colegas
  G.vista.jogadores.forEach((j) => {
    if (j.id === G.vista.eu || !j.ligado || !G.estaFora(j.id)) return;
    const m = j.x * ESCALA;
    if (!vis(m)) return;
    if (G.condutor() === j.id) desenhaRover(c, X(m), Y(m), M);
    astro(
      c,
      X(m) - 32,
      Y(m) - 108,
      4,
      G.outroChar(j.id),
      M ? "marte" : "lua",
      true,
      false,
    );
    etiq(c, X(m), Y(m) - 116, j.nickname || j.nome, "#1d2a7a", "#8a93bb");
  });
  // jogador
  const jx = X(J.m),
    jy = Y(J.m);
  c.globalAlpha = M ? 0.5 : 1;
  c.fillStyle = M ? "#5a2a18" : "#000";
  c.beginPath();
  c.ellipse(jx + (M ? 0 : 26), jy + 4, 30 - cl(J.y / 12, 0, 14), 5, 0, 0, 6.3);
  c.fill();
  c.globalAlpha = 1;
  if (J.rover) {
    astro(
      c,
      jx - 32,
      jy - 150,
      4,
      G.cosm.char,
      M ? "marte" : "lua",
      true,
      J.virado,
    );
    desenhaRover(c, jx, jy, M);
    if (J.aAndar)
      for (let i = 0; i < 5; i++)
        R(
          c,
          jx - (J.virado ? -1 : 1) * (60 + i * 16) - 6,
          jy - 8 - i * 5 - (M ? 0 : (t * 60 + i * 9) % 20),
          10,
          10,
          M ? "#e8b27a" : "#cfcfda",
          0.6 - i * 0.1,
        );
  } else {
    astro(
      c,
      jx - 32,
      jy - 104 - J.y,
      4,
      G.cosm.char,
      M ? "marte" : "lua",
      true,
      J.virado,
      J.aAndar && J.y === 0 ? J.anda : null,
    );
    if (J.cavar > 0) {
      const k = Math.sin(t * 9),
        d = J.virado ? -1 : 1;
      c.save();
      c.translate(jx + d * 30, jy - 50);
      c.rotate(d * (0.5 + k * 0.5));
      R(c, -3, -10, 6, 60, "#8f5a2c");
      if (J.ferramenta === "pa")
        P(c, [-12, 50, 12, 50, 9, 76, -9, 76], "#cfd6f5");
      else {
        R(c, -18, 46, 36, 7, "#9aa3c7");
      }
      c.restore();
      for (let i = 0; i < 6; i++)
        R(
          c,
          jx + d * (40 + ((t * 80 + i * 13) % 40)),
          jy - ((t * 90 + i * 17) % 50),
          6,
          6,
          M ? "#c46a40" : "#cfcfda",
          0.8,
        );
    }
  }
  if (J.poeira != null && !J.rover) {
    const a = J.poeira;
    for (let i = 0; i < 10; i++) {
      const d = i % 2 ? 1 : -1,
        vx = 30 + i * 9,
        vy = 24 + ((i * 7) % 30);
      if (M) {
        const sz = 8 + a * 16;
        R(
          c,
          jx + d * vx * 0.4 * (1 - Math.exp(-a * 2)) + a * 26 - sz / 2,
          jy - 6 - sz / 2,
          sz,
          sz,
          "#e8b27a",
          cl(0.5 - a * 0.25),
        );
      } else {
        const tf = (2 * vy) / (g * 0.5),
          b = Math.min(a, tf);
        R(
          c,
          jx + d * vx * b - 3,
          jy - (vy * b - 0.25 * g * b * b) - 3,
          6,
          6,
          "#cfcfda",
          a < tf ? 1 : cl(1.5 - a * 0.5),
        );
      }
    }
  }
  if (J.y > 0)
    T(
      c,
      jx,
      jy - 124 - J.y,
      12,
      (J.y / PXM).toFixed(1) + " m",
      M ? "#0b1030" : "#3ee0d0",
      "center",
    );
  c.restore();
  // tempestade (Marte tem atmosfera)
  if (M && G.tempestade(e)) {
    const r = rng(4);
    [
      ["#c9824f", 0.5],
      ["#b8693a", 0.65],
      ["#9a5228", 0.8],
    ].forEach((q, i) => {
      const x0 = 760 + i * 150 + Math.sin(t * 0.5 + i) * 20;
      c.globalAlpha = q[1];
      c.fillStyle = q[0];
      c.beginPath();
      c.moveTo(1280, 720);
      c.lineTo(x0, 720);
      for (let yy = 720; yy > 0; yy -= 40) c.lineTo(x0 + (r() - 0.5) * 80, yy);
      c.lineTo(x0 + 60, 0);
      c.lineTo(1280, 0);
      c.closePath();
      c.fill();
    });
    c.globalAlpha = 1;
    if (Math.floor(t * 1.3) % 3 === 0) {
      c.strokeStyle = "#ffd84d";
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(1120, 120);
      c.lineTo(1090, 200);
      c.lineTo(1120, 200);
      c.lineTo(1080, 300);
      c.stroke();
    }
    for (let i = 0; i < 26; i++)
      R(
        c,
        ((((i * 173 - t * 900) % 1400) + 1400) % 1400) - 60,
        120 + ((i * 61) % 440),
        90,
        3,
        "#f2cfa0",
        0.6,
      );
  } else if (M)
    for (let i = 0; i < 8; i++)
      R(
        c,
        ((((i * 211 - t * 160) % 1400) + 1400) % 1400) - 60,
        200 + ((i * 83) % 330),
        60,
        2,
        "#f2cfa0",
        0.4,
      );
  faixa(c, 300, 66, 680, G);
}

// Faixa de navegação: todo o terreno, os locais e a distância à base.
export function faixa(c, x0, y0, w, G) {
  const e = G.vista.estado,
    desc = e.descobertas || [],
    J = G.jog,
    X = (m) => x0 + 14 + ((m + MUNDO) / (2 * MUNDO)) * (w - 28),
    ev = G.eva;
  R(c, x0, y0, w, 34, "#0b1030", 0.85);
  c.strokeStyle = "#2a3380";
  c.lineWidth = 2;
  c.strokeRect(x0, y0, w, 34);
  R(c, x0 + 14, y0 + 20, w - 28, 2, "#2a3380");
  for (let m = -500; m <= 500; m += 100) {
    R(c, X(m), y0 + 16, 1, 8, "#6a74b0");
    if (m) T(c, X(m), y0 + 12, 8, Math.abs(m), "#6a74b0", "center", false, 400);
  }
  ESCAVAR.forEach((q, i) =>
    R(c, X(q.m) - 2, y0 + 18, 4, 4, ev.cavados[i] ? "#3ee0d0" : "#ffd84d"),
  );
  [
    ["amostra", POS.rocha],
    ["baliza", POS.baliza],
    ["cratera", POS.cratera],
  ].forEach((q) => {
    const x = X(q[1]);
    P(
      c,
      [x, y0 + 14, x - 5, y0 + 21, x, y0 + 28, x + 5, y0 + 21],
      desc.includes(q[0]) ? "#3ee0d0" : "#ffd84d",
    );
  });
  R(c, X(0) - 5, y0 + 15, 10, 12, "#3ee0d0");
  T(c, X(0), y0 + 12, 8, L("BASE", "BASE"), "#3ee0d0", "center");
  if (G.roverM != null && (e.carga || {}).rover && e.descarregada)
    R(c, X(G.roverM) - 4, y0 + 24, 8, 4, "#e8ecff");
  const px = X(J.m);
  P(c, [px, y0 + 20, px - 6, y0 + 32, px + 6, y0 + 32], "#fff");
}

// ───────────── INTERIOR DA BASE ─────────────
export const ESTACOES = [
  { id: "saida", x: 130 },
  { id: "fato", x: 300 },
  { id: "radio", x: 500 },
  { id: "lab", x: 700 },
  { id: "mapa", x: 880 },
  { id: "energia", x: 1040 },
  { id: "descanso", x: 1180 },
];
export const nomeEstacao = (id) =>
  ({
    saida: L("Airlock (go outside)", "Antecâmara (sair)"),
    fato: L("EVA suit and oxygen", "Traje e oxigénio"),
    radio: L("Communications screen", "Ecrã de comunicações"),
    lab: L("Lab bench", "Bancada do laboratório"),
    mapa: L("Terrain map", "Mapa do terreno"),
    energia: L("Power panel", "Painel de energia"),
    descanso: L("Logbook and rest", "Diário e descanso"),
  })[id];
export function estacaoPerto(G) {
  const d = G.dentro;
  let m = null;
  ESTACOES.forEach((s) => {
    const k = Math.abs(s.x - d.x);
    if (k < 70 && (!m || k < Math.abs(m.x - d.x))) m = s;
  });
  return m;
}

export function interior(c, t, dt, G) {
  const e = G.vista.estado,
    M = e.destino === "marte",
    D = G.dentro,
    mont = e.montados || [],
    hab = mont.includes("habitat"),
    ev = G.eva;
  const mov = G.bloqueado ? 0 : G.tecla.dir - G.tecla.esq;
  if (mov) {
    D.x = cl(D.x + mov * 300 * dt, 90, 1200);
    D.virado = mov < 0;
    D.anda += dt;
  }
  // exterior visto pelas janelas
  if (M) {
    R(c, 0, 0, 1280, 720, "#b8694f");
    R(c, 0, 300, 1280, 420, "#a8522f");
  } else {
    R(c, 0, 0, 1280, 720, "#000");
    estrelas(c, 0.8);
    R(c, 0, 420, 1280, 300, "#8e8e9a");
  }
  const parede = hab ? "#dfe4fa" : "#8a93bb",
    escuro = hab ? "#b6bdde" : "#5a6290";
  c.save();
  c.translate(0, 56);
  if (hab) {
    c.fillStyle = parede;
    c.beginPath();
    c.roundRect(40, 110, 1200, 500, 60);
    c.fill();
  } else
    P(c, [60, 610, 60, 250, 200, 110, 1080, 110, 1220, 250, 1220, 610], parede);
  R(c, 40, 560, 1200, 50, escuro);
  R(c, 40, 560, 1200, 4, "#262c52");
  for (let i = 0; i < 12; i++) R(c, 80 + i * 100, 574, 60, 4, "#262c52", 0.25);
  for (let i = 0; i < 5; i++) R(c, 220 + i * 210, 124, 120, 8, "#fff3d6"); // luzes
  T(
    c,
    640,
    164,
    20,
    hab
      ? L("HABITAT · breathing base air", "HABITAT · a respirar o ar da base")
      : L(
          "LANDER CABIN · breathing ship air",
          "CABINE DA NAVE · a respirar o ar da nave",
        ),
    "#262c52",
    "center",
    true,
    700,
  );
  const perto = estacaoPerto(G);
  const rot = (s, txt) => {
    const on = perto && perto.id === s.id;
    R(c, s.x - 78, 196, 156, 22, on ? "#0f5f58" : "#262c52", 0.92);
    T(c, s.x, 211, 11, txt, on ? "#fff" : "#cfd6f5", "center");
    if (on) {
      c.strokeStyle = "#3ee0d0";
      c.lineWidth = 3;
      c.strokeRect(s.x - 82, 224, 164, 336);
    }
  };
  ESTACOES.forEach((s) => {
    const x = s.x;
    if (s.id === "saida") {
      c.fillStyle = "#262c52";
      c.beginPath();
      c.roundRect(x - 56, 300, 112, 260, 40);
      c.fill();
      c.fillStyle = "#3b4a8f";
      c.beginPath();
      c.roundRect(x - 44, 314, 88, 232, 32);
      c.fill();
      C(c, x, 430, 24, "#9aa3c7");
      C(c, x, 430, 9, "#262c52");
      R(c, x - 26, 350, 52, 22, M ? "#b8694f" : "#000");
      R(c, x - 60, 270, 120, 20, "#e8403f");
      T(c, x, 285, 12, L("EXIT", "SAÍDA"), "#fff", "center", false, 700);
    }
    if (s.id === "fato") {
      R(c, x - 64, 250, 128, 310, escuro);
      R(c, x - 56, 258, 112, 294, "#141a45");
      c.globalAlpha = 0.95;
      astro(c, x - 40, 300, 5, G.cosm.char, M ? "marte" : "lua", true);
      c.globalAlpha = 1;
      R(c, x - 62, 444, 10, 100, "#3ee0d0");
      R(c, x + 52, 444, 10, 100, "#3ee0d0");
      R(c, x - 40, 536, 80, 10, "#262c52");
    }
    if (s.id === "radio") {
      const ok = mont.includes("radio");
      R(c, x - 70, 250, 140, 110, "#262c52");
      R(c, x - 62, 258, 124, 94, ok ? "#0f2a5a" : "#141a45");
      if (ok) {
        terra(c, x - 30, 305, 20);
        for (let i = 0; i < 3; i++) {
          c.strokeStyle = "#3ee0d0";
          c.globalAlpha = 0.9 - i * 0.25;
          c.lineWidth = 3;
          c.beginPath();
          c.arc(x - 30, 305, 30 + i * 12 + ((t * 20) % 12), -0.6, 0.6);
          c.stroke();
        }
        c.globalAlpha = 1;
      } else
        T(c, x, 310, 11, L("no module", "sem módulo"), "#6a74b0", "center");
      R(c, x - 70, 380, 140, 180, escuro);
      R(c, x - 60, 392, 120, 30, "#262c52");
      for (let i = 0; i < 5; i++)
        R(
          c,
          x - 54 + i * 22,
          400,
          14,
          14,
          ok
            ? ["#3ee0d0", "#ffd84d", "#e8403f", "#3ee0d0", "#ffd84d"][i]
            : "#3b4a8f",
        );
      R(c, x - 60, 440, 120, 6, "#262c52");
    }
    if (s.id === "lab") {
      R(c, x - 80, 430, 160, 130, escuro);
      R(c, x - 86, 420, 172, 12, "#262c52");
      R(c, x - 60, 350, 14, 70, "#262c52");
      R(c, x - 70, 340, 50, 14, "#262c52");
      R(c, x - 62, 400, 40, 8, "#9aa3c7");
      const n = (ev.rocha ? 1 : 0) + ev.solo + ev.gelo;
      for (let i = 0; i < Math.min(5, n); i++) {
        R(c, x - 10 + i * 18, 394, 14, 26, "#cfd6f5", 0.5);
        R(
          c,
          x - 8 + i * 18,
          406,
          10,
          12,
          i === 0 && ev.rocha
            ? "#8a5a4a"
            : i < ev.gelo + (ev.rocha ? 1 : 0)
              ? "#8fe8ff"
              : M
                ? "#c46a40"
                : "#9a9aa8",
        );
      }
      R(c, x - 70, 250, 140, 70, "#262c52");
      R(c, x - 62, 258, 124, 54, "#141a45");
      for (let i = 0; i < 6; i++)
        R(
          c,
          x - 54 + i * 18,
          300 - (8 + ((i * 13) % 30)),
          10,
          8 + ((i * 13) % 30),
          "#3ee0d0",
        );
    }
    if (s.id === "mapa") {
      R(c, x - 70, 250, 140, 110, "#262c52");
      R(c, x - 62, 258, 124, 94, "#0b1030");
      c.strokeStyle = "#3ee0d0";
      c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i <= 30; i++) {
        const m = -MUNDO + i * ((2 * MUNDO) / 30),
          yy = 320 - alt(m, M) * 0.14;
        i ? c.lineTo(x - 58 + i * 3.9, yy) : c.moveTo(x - 58 + i * 3.9, yy);
      }
      c.stroke();
      R(c, x - 3, 300, 6, 10, "#ffd84d");
      R(c, x - 70, 380, 140, 180, escuro);
    }
    if (s.id === "energia") {
      const ok = mont.includes("energia"),
        v = cl((e.recursos.energia || 0) / 100);
      R(c, x - 60, 250, 120, 310, escuro);
      R(c, x - 50, 262, 100, 150, "#141a45");
      R(c, x - 20, 280, 40, 110, "#2a3380");
      if (ok)
        R(
          c,
          x - 16,
          284 + 102 * (1 - v),
          32,
          102 * v,
          v < 0.3 ? "#e8403f" : "#ffd84d",
        );
      for (let i = 0; i < 4; i++)
        R(
          c,
          x - 44 + i * 24,
          430,
          16,
          16,
          ok && (i < 2 || Math.floor(t * 2 + i) % 2) ? "#3ee0d0" : "#3b4a8f",
        );
    }
    if (s.id === "descanso") {
      R(c, x - 56, 470, 112, 90, escuro);
      R(c, x - 56, 460, 112, 16, "#4a7bd1");
      R(c, x - 56, 448, 34, 16, "#f2f5ff");
      R(c, x - 50, 280, 100, 80, "#262c52");
      R(c, x - 44, 286, 88, 68, M ? "#d68a5f" : "#000");
      if (!M) terra(c, x + 10, 316, 14);
      if (hab) {
        R(c, x - 10, 400, 20, 50, "#8f5a2c");
        R(c, x - 26, 372, 52, 34, "#3fa34a");
        R(c, x - 16, 356, 32, 22, "#7bc96f");
      }
    }
    rot(s, nomeEstacao(s.id));
  });
  astro(
    c,
    D.x - 40,
    560 - 130,
    5,
    G.cosm.char,
    "cabine",
    false,
    D.virado,
    mov ? D.anda : null,
  );
  c.restore();
}

export function desenharMapa(c, w, h, G) {
  const e = G.vista.estado,
    M = e.destino === "marte",
    desc = e.descobertas || [],
    ev = G.eva,
    X = (m) => 30 + ((m + MUNDO) / (2 * MUNDO)) * (w - 60),
    base = h - 70,
    Y = (m) => base - alt(m, M) * 0.45;
  R(c, 0, 0, w, h, M ? "#3b2018" : "#070a22");
  c.fillStyle = M ? "#a8522f" : "#8e8e9a";
  c.beginPath();
  c.moveTo(X(-MUNDO), h);
  for (let m = -MUNDO; m <= MUNDO; m += 4) c.lineTo(X(m), Y(m));
  c.lineTo(X(MUNDO), h);
  c.closePath();
  c.fill();
  for (let m = -500; m <= 500; m += 100) {
    R(c, X(m), h - 22, 1, 8, "#e8ecff");
    T(c, X(m), h - 6, 10, m + " m", "#e8ecff", "center", false, 400);
  }
  const pino = (m, nome, cor, dy = 0) => {
    R(c, X(m) - 1, Y(m) - 30 - dy, 2, 30 + dy, cor);
    R(c, X(m) - 4, Y(m) - 36 - dy, 8, 8, cor);
    T(c, X(m), Y(m) - 42 - dy, 11, nome, cor, "center");
  };
  pino(0, L("BASE", "BASE"), "#3ee0d0", 24);
  pino(
    POS.rocha,
    L("Rock", "Rocha") + (desc.includes("amostra") ? " ✓" : ""),
    desc.includes("amostra") ? "#3ee0d0" : "#ffd84d",
  );
  pino(
    POS.baliza,
    L("Beacon", "Baliza") + (desc.includes("baliza") ? " ✓" : ""),
    desc.includes("baliza") ? "#3ee0d0" : "#ffd84d",
  );
  pino(
    POS.cratera,
    L("Depression", "Depressão") + (desc.includes("cratera") ? " ✓" : ""),
    desc.includes("cratera") ? "#3ee0d0" : "#ffd84d",
    16,
  );
  ESCAVAR.forEach((q, i) => {
    R(c, X(q.m) - 3, Y(q.m) - 8, 6, 6, ev.cavados[i] ? "#3ee0d0" : "#fff");
  });
  T(
    c,
    30,
    22,
    12,
    L(
      "White squares: places to dig. Yellow: science still to do.",
      "Quadrados brancos: locais para cavar. Amarelo: ciência por fazer.",
    ),
    "#e8ecff",
  );
}
