// Pixel art desenhada em canvas: astronautas, trajes, naves e planetas (design da Fase 1).
import { NAVES } from "./naves.js";

export const PERSONAGENS = {
  amelia: {
    nome: "Amélia",
    papel: "Engenheira",
    cabelo: "puffs",
    pele: "#8a5a3c",
  },
  nyeleti: {
    nome: "Nyeleti",
    papel: "Comandante",
    cabelo: "pony",
    pele: "#c9946a",
  },
  tomas: {
    nome: "Tomás",
    papel: "Médico de bordo",
    cabelo: "curly",
    pele: "#5c3a24",
  },
  kito: { nome: "Kito", papel: "Piloto", cabelo: "beard", pele: "#e0b08a" },
};
export const TRAJES = {
  cabine: {
    c: "#4a7bd1",
    a: "#ffd84d",
    luva: null,
    bota: "#e8ecff",
    viseira: null,
    vop: 0,
  },
  voo: {
    c: "#ff8a3d",
    a: "#4a7bd1",
    luva: "#1a1a2e",
    bota: "#1a1a2e",
    viseira: "#8fe8ff",
    vop: 0.3,
  },
  lua: {
    c: "#f2f5ff",
    a: "#e8403f",
    luva: "#9aa3c7",
    bota: "#9aa3c7",
    viseira: "#f5b942",
    vop: 0.95,
  },
  marte: {
    c: "#f2dfc0",
    a: "#2ec4b6",
    luva: "#8a4326",
    bota: "#8a4326",
    viseira: "#3ee0d0",
    vop: 0.4,
  },
};
export const INFO_NAVES = {
  aurora: { nome: "Aurora", linha: "Foguetão clássico · equilibrada" },
  baoba: { nome: "Embondeiro", linha: "Cargueiro · casco largo" },
  impala: { nome: "Impala", linha: "Avião espacial · afilada" },
  ubuntu: { nome: "Ubuntu", linha: "Modular · cooperação" },
};

export function R(c, x, y, w, h, f, o = 1) {
  c.globalAlpha = o;
  c.fillStyle = f;
  c.fillRect(x, y, w, h);
  c.globalAlpha = 1;
}
export function P(c, pts, f, o = 1) {
  c.globalAlpha = o;
  c.fillStyle = f;
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath();
  c.fill();
  c.globalAlpha = 1;
}
export function C(c, x, y, r, f, o = 1) {
  c.globalAlpha = o;
  c.fillStyle = f;
  c.beginPath();
  c.arc(x, y, r, 0, 6.2832);
  c.fill();
  c.globalAlpha = 1;
}
export function T(
  c,
  x,
  y,
  s,
  t,
  f = "#e8ecff",
  a = "left",
  px = false,
  w = 600,
) {
  c.font = `${w} ${s}px ${px ? "'Pixelify Sans'" : "Inter"}, sans-serif`;
  c.textAlign = a;
  c.fillStyle = f;
  c.fillText(t, x, y);
}
export function rng(s) {
  return () => {
    s =
      Math.imul(s ^ (s >>> 15), 2246822507) ^
      Math.imul(s ^ (s >>> 13), 3266489909);
    s ^= s >>> 16;
    return (s >>> 0) / 4294967296;
  };
}

// Astronauta de 16×27 px. (x, y) é o canto superior esquerdo; s é a escala.
export function astro(
  c,
  x,
  y,
  s,
  quem,
  traje,
  capacete,
  virado = false,
  anda = null,
) {
  const p = PERSONAGENS[quem] || PERSONAGENS.amelia,
    S = TRAJES[traje] || TRAJES.cabine,
    K = "#262c52";
  const pele = p.pele,
    col = S.c,
    a = S.a,
    gordo = traje === "lua";
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  if (virado) {
    c.translate(16, 0);
    c.scale(-1, 1);
  }
  c.translate(0, 2 + (anda != null && Math.floor(anda * 7) % 2 ? 0.4 : 0));
  const r = (X, Y, W, H, F, O) => R(c, X, Y, W, H, F, O);
  if (gordo) r(1, 6, 14, 10, "#9aa3c7");
  if (traje === "marte") {
    r(12, 6, 2, 3, "#9aa3c7");
    r(13, 0, 1, 7, "#9aa3c7");
    r(13, -1, 1, 1, "#e8403f");
  }
  // pernas e braços: quando anda, alternam (4 poses por ciclo)
  const pose = anda == null ? 1 : Math.floor(anda * 7) % 4,
    pa = pose === 0 ? 1 : 0,
    pb = pose === 2 ? 1 : 0;
  const perna = (x, sobe, sombra) => {
    c.save();
    c.translate(
      sobe ? 0.8 : anda != null && pose % 2 === 0 ? -0.5 : 0,
      sobe ? -1.2 : 0,
    );
    if (gordo) r(x - 2 + (x > 6 ? 2 : 0), 21, 5, 3, S.bota);
    else r(x - 1 + (x > 6 ? 1 : 0), 22, 4, 2, S.bota);
    r(x, 16, 3, 6, col);
    if (sombra) r(x + 2, 16, 1, 6, "#000", 0.14);
    if (traje === "marte") {
      r(x, 19, 3, 3, S.bota);
      r(x, 18, 3, 1, a);
    } else if (traje === "voo") r(x + (x > 6 ? 1 : 0), 17, 2, 2, "#000", 0.18);
    else if (traje === "lua") r(x, 18, 3, 1, a);
    c.restore();
  };
  perna(5, pa, false);
  perna(8, pb, true);
  r(7.75, 17, 0.5, 4, "#000", 0.25);
  r(4, 8, 8, 8, col);
  r(11, 8, 1, 8, "#000", 0.14);
  const ax = gordo ? 1 : 2,
    aw = gordo ? 3 : 2,
    g = S.luva || pele;
  const braco = (x, dy) => {
    r(x, 9 + dy, aw, 6, col);
    r(x, 12 + dy, aw, 1, a);
    r(x, 15 + dy, aw, 2, g);
  };
  braco(ax, pb ? -1 : 0);
  braco(12, pa ? -1 : 0);
  r(4, 15, 8, 1, K);
  if (traje === "cabine") {
    r(7.75, 9, 0.5, 6, "#000", 0.3);
    r(6, 8, 4, 1, a);
    r(9, 10, 2, 2, a);
    r(5, 10, 2, 1, "#fff");
  }
  if (traje === "voo") {
    r(5, 8, 6, 1, "#8a93bb");
    r(6, 10, 4, 3, K);
    r(6, 10, 1, 1, "#4a7bd1");
    r(9, 10, 1, 1, "#e8403f");
    r(7, 12, 2, 1, "#ffd84d");
    r(5, 13, 1, 2, "#8a93bb");
    r(12, 10, 2, 1, "#fff");
  }
  if (traje === "lua") {
    r(5, 8, 6, 1, "#9aa3c7");
    r(5, 10, 6, 4, "#cfd6f5");
    r(6, 11, 1, 1, "#e8403f");
    r(8, 11, 1, 1, "#ffd84d");
    r(6, 12, 4, 1, K);
  }
  if (traje === "marte") {
    r(4, 8, 8, 1, "#8a4326");
    r(6, 10, 4, 2, a);
    r(6, 10, 1, 1, "#fff");
    r(5, 13, 6, 1, "#8a4326", 0.6);
  }
  const olhos = () => {
    r(6, 4, 1, 1, "#1a1a2e");
    r(9, 4, 1, 1, "#1a1a2e");
  };
  if (!(capacete && traje !== "cabine")) {
    r(4, 4, 1, 2, pele);
    r(11, 4, 1, 2, pele);
    r(5, 2, 6, 6, pele);
    olhos();
    r(7, 6, 2, 1, "#000", 0.3);
    const h = p.cabelo,
      m = (l, f) => l.forEach((q) => r(q[0], q[1], q[2], q[3], f));
    if (h === "puffs")
      m(
        [
          [3, -1, 3, 3],
          [10, -1, 3, 3],
          [5, 1, 6, 2],
          [4, 2, 1, 3],
          [11, 2, 1, 3],
        ],
        "#1c1410",
      );
    if (h === "pony") {
      m(
        [
          [5, 1, 6, 2],
          [4, 2, 1, 3],
          [11, 2, 1, 3],
          [12, 2, 2, 1],
          [13, 3, 1, 5],
          [12, 7, 1, 1],
        ],
        "#4a2a14",
      );
      r(11, 2, 2, 1, "#ffd84d");
    }
    if (h === "curly") {
      m(
        [
          [4, -1, 8, 4],
          [3, 0, 1, 4],
          [12, 0, 1, 4],
        ],
        "#1c1410",
      );
      m(
        [
          [5, 3.6, 2.4, 0.4],
          [5, 5.6, 2.4, 0.4],
          [5, 3.6, 0.4, 2.4],
          [7, 3.6, 0.4, 2.4],
          [8.6, 3.6, 2.4, 0.4],
          [8.6, 5.6, 2.4, 0.4],
          [8.6, 3.6, 0.4, 2.4],
          [10.6, 3.6, 0.4, 2.4],
        ],
        "#e8ecff",
      );
    }
    if (h === "beard") {
      m(
        [
          [5, 1, 6, 2],
          [4, 2, 1, 2],
          [11, 2, 1, 2],
          [5, 6, 6, 2],
        ],
        "#2b1a10",
      );
      r(7, 6, 2, 1, "#7a3b2e");
    }
    if (capacete) {
      r(3, 3, 1, 3, K);
      r(3, 6, 3, 1, K);
      r(5, 6, 1, 1, "#3ee0d0");
    }
  } else {
    r(4, -1, 8, 1, "#e8ecff");
    r(3, 0, 10, 8, "#e8ecff");
    r(12, 0, 1, 8, "#000", 0.16);
    r(4, 1, 8, 6, "#1a2a4a");
    if (S.vop < 0.9) {
      r(5, 2, 6, 5, pele);
      olhos();
    }
    r(4, 1, 8, 6, S.viseira, S.vop);
    r(5, 2, 2, 1, "#fff", 0.8);
    r(4, 8, 8, 1, a);
  }
  c.restore();
}

function forma(c, e, cor) {
  const f = e[e.length - 2] === "AC" ? cor : e[e.length - 2],
    o = e[e.length - 1];
  if (e[0] === "p") P(c, e[1], f, o);
  else if (e[0] === "r") R(c, e[1], e[2], e[3], e[4], f, o);
  else C(c, e[1], e[2], e[3], f, o);
}
// Nave: (cx, cy) é o centro; ang = 0 deitada com o nariz para a direita, −90 de pé.
export function nave(
  c,
  cx,
  cy,
  sc,
  ang,
  chama,
  pernas,
  modelo = "aurora",
  t = 0,
) {
  const n = NAVES[modelo] || NAVES.aurora;
  c.save();
  c.translate(cx, cy);
  c.rotate((ang * Math.PI) / 180);
  c.scale(sc, sc);
  c.translate(-36, -20);
  if (pernas > 0) {
    c.save();
    c.translate(18, 20);
    c.scale(pernas, pernas);
    c.translate(-18, -20);
    P(c, [18, 12, -8, 0, -8, 4, 14, 16], "#8a93bb");
    P(c, [18, 28, -8, 40, -8, 36, 14, 24], "#8a93bb");
    R(c, -10, -3, 2, 9, "#5a6290");
    R(c, -10, 34, 2, 9, "#5a6290");
    c.restore();
  }
  if (chama > 0) {
    c.save();
    c.translate(6, 20);
    c.scale(chama * (1 + 0.18 * Math.sin(t * 45)), 1);
    c.translate(-6, -20);
    n.chama.forEach((e) => forma(c, e, n.cor));
    c.restore();
  }
  n.corpo.forEach((e) => forma(c, e, n.cor));
  c.restore();
}

export function terra(c, x, y, r) {
  C(c, x, y, r * 1.07, "#8fc2ff", 0.22);
  C(c, x, y, r, "#4a7bd1");
  C(c, x - r * 0.3, y - r * 0.25, r * 0.34, "#7bc96f");
  C(c, x + r * 0.35, y + r * 0.3, r * 0.22, "#7bc96f");
  C(c, x + r * 0.25, y - r * 0.45, r * 0.18, "#e8ecff", 0.85);
}
export function lua(c, x, y, r) {
  C(c, x, y, r, "#c9c9d6");
  C(c, x - r * 0.3, y - r * 0.3, r * 0.26, "#9a9ab0");
  C(c, x + r * 0.35, y + r * 0.3, r * 0.18, "#9a9ab0");
  C(c, x + r * 0.2, y - r * 0.45, r * 0.1, "#9a9ab0");
}
export function marte(c, x, y, r) {
  C(c, x, y, r * 1.06, "#ffb78a", 0.25);
  C(c, x, y, r, "#c97b58");
  C(c, x - r * 0.25, y - r * 0.3, r * 0.3, "#e0a070");
  C(c, x + r * 0.3, y + r * 0.25, r * 0.25, "#a8522f");
  C(c, x - r * 0.1, y + r * 0.55, r * 0.14, "#8a4326");
  C(c, x, y - r * 0.88, r * 0.14, "#f2f5ff", 0.9);
}
export const planeta = (c, d, x, y, r) =>
  (d === "marte" ? marte : lua)(c, x, y, r);

const r0 = rng(7);
const ESTRELAS = [...Array(160)].map(() => [
  r0() * 1280,
  r0() * 720,
  r0() < 0.2 ? 4 : 3,
  0.4 + r0() * 0.6,
]);
export function estrelas(c, op = 1, dy = 0, maxy = 720) {
  ESTRELAS.forEach((s) => {
    if (s[1] < maxy)
      R(c, s[0], (s[1] + dy) % 720, s[2], s[2], "#fff", s[3] * op);
  });
}
export function mistura(a, b, k) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16)),
    A = p(a),
    B = p(b);
  return (
    "#" +
    A.map((v, i) =>
      Math.round(v + (B[i] - v) * k)
        .toString(16)
        .padStart(2, "0"),
    ).join("")
  );
}
export const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const suave = (v) => {
  v = cl(v);
  return v * v * (3 - 2 * v);
};
