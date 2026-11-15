// Cenas desenhadas no canvas principal (1280×720): lobby, descolagem, rota, aterragem e superfície.
import {
  R,
  P,
  C,
  T,
  astro,
  nave,
  terra,
  lua,
  marte,
  planeta,
  estrelas,
  mistura,
  rng,
  cl,
  suave,
} from "./sprites.js";

import { L } from "./i18n.js";

function grad(c, x, y, w, h, a, b) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
}
export function etiq(c, x, y, txt, cor = "#0f5f58", borda = "#3ee0d0") {
  c.font = "600 12px Inter, sans-serif";
  const w = c.measureText(txt).width + 14;
  R(c, x - w / 2, y - 16, w, 20, cor, 0.92);
  c.strokeStyle = borda;
  c.lineWidth = 1.5;
  c.strokeRect(x - w / 2, y - 16, w, 20);
  T(c, x, y - 2, 12, txt, "#e8ecff", "center");
}

// ───────────── LOBBY (janela central 400,64 · 640×356) ─────────────
export function lobby(c, t, G) {
  const X = 400,
    Y = 64,
    W = 640,
    H = 356,
    e = G.vista ? G.vista.estado : {};
  c.save();
  c.beginPath();
  c.rect(X, Y, W, H);
  c.clip();
  grad(c, X, Y, W, H, "#050820", "#12195a");
  estrelas(c, 0.8, 0, Y + H - 90);
  if (e.destino) planeta(c, e.destino, X + W - 110, Y + 100, 74);
  else {
    c.strokeStyle = "#3ee0d0";
    c.setLineDash([6, 6]);
    c.lineWidth = 2;
    c.beginPath();
    c.arc(X + W - 110, Y + 100, 70, 0, 6.3);
    c.stroke();
    c.setLineDash([]);
    T(
      c,
      X + W - 110,
      Y + 104,
      12,
      L("choose the destination", "escolhe o destino"),
      "#3ee0d0",
      "center",
    );
  }
  const gy = Y + H - 80;
  R(c, X, gy, W, 80, "#232a6e");
  R(c, X, gy, W, 5, "#3b4a8f");
  R(c, X + 250, gy - 8, 150, 8, "#5a6290");
  R(c, X + 236, gy - 200, 14, 200, "#5a6290");
  R(c, X + 236, gy - 200, 14, 4, "#e8403f");
  R(c, X + 250, gy - 150, 44, 6, "#8a93bb");
  R(c, X + 250, gy - 80, 46, 6, "#8a93bb");
  nave(c, X + 325, gy - 8 - 30 * 2.3, 2.3, -90, 0, 0, G.cosm.nave, t);
  const jx = (x) => X + 40 + ((cl(x, -10.4, 10.4) + 10.4) / 20.8) * (W - 80);
  (G.vista ? G.vista.jogadores : []).forEach((j, i) => {
    const eu = j.id === G.vista.eu,
      x = eu ? jx(G.lobbyX) : jx(j.x || (i ? 4 : -4));
    const quem = eu ? G.cosm.char : G.outroChar(j.id);
    c.globalAlpha = j.ligado || eu ? 1 : 0.4;
    astro(
      c,
      x - 24,
      gy - 81,
      3,
      quem,
      "voo",
      false,
      eu ? G.lobbyVirado : true,
      eu && G.lobbyAnda ? t : null,
    );
    c.globalAlpha = 1;
    etiq(
      c,
      x,
      gy - 88,
      (j.nickname || j.nome) +
        (j.anfitriao ? " ★" : "") +
        ((e.prontos || []).includes(j.id) ? " ✓" : ""),
      eu ? "#0f5f58" : "#1d2a7a",
      eu ? "#3ee0d0" : "#8a93bb",
    );
  });
  if (G.vista && G.vista.jogadores.length < 2) {
    const x = jx(5.5);
    c.strokeStyle = "#3ee0d0";
    c.setLineDash([6, 5]);
    c.lineWidth = 2;
    c.strokeRect(x - 24, gy - 81, 48, 81);
    c.setLineDash([]);
    R(c, x - 24, gy - 81, 48, 81, "#3ee0d0", 0.08 + 0.05 * Math.sin(t * 3));
    T(c, x, gy - 32, 30, "+", "#3ee0d0", "center", true);
    T(
      c,
      x,
      gy + 18,
      11,
      L("invite a crewmate", "convidar colega"),
      "#3ee0d0",
      "center",
    );
  }
  c.restore();
  c.strokeStyle = "#2a3380";
  c.lineWidth = 2;
  c.strokeRect(X, Y, W, H);
}

// ───────────── DESCOLAGEM (9 s) ─────────────
export function descolagem(c, u, modelo, f) {
  if (u < 7) {
    const alt = u < 3 ? 0 : 100 * (u - 3) * (u - 3),
      sobe = Math.min(alt, 210),
      ws = alt - sobe,
      k = cl(alt / 1400),
      gy = 600 + ws;
    let dx = 0,
      dy = 0;
    if (u > 2.7 && u < 5.2) {
      const r = rng(f);
      dx = (r() - 0.5) * 9;
      dy = (r() - 0.5) * 9;
    }
    c.save();
    c.translate(dx, dy);
    grad(
      c,
      -10,
      -10,
      1300,
      740,
      mistura("#12195a", "#03051a", k),
      mistura("#3b4a9f", "#0b1030", k),
    );
    estrelas(c, 0.25 + 0.75 * k, ws * 0.04);
    [
      [200, 620, 180],
      [860, 760, 220],
      [420, 930, 160],
      [980, 1080, 200],
    ].forEach((n) => {
      const y = 600 + ws - n[1];
      if (y > -80 && y < 760) {
        R(c, n[0], y, n[2], 22, "#cfd6f5", 0.45);
        R(c, n[0] + 30, y - 16, n[2] - 70, 18, "#cfd6f5", 0.45);
      }
    });
    if (alt > 250) {
      const r = rng(f * 31 + 1);
      for (let i = 0; i < 14; i++)
        R(c, r() * 1280, r() * 720, 3, 40 + r() * 80, "#e8ecff", 0.25);
    }
    if (gy < 760) {
      R(c, 0, gy, 1280, 200, "#232a6e");
      R(c, 0, gy, 1280, 6, "#3b4a8f");
      R(c, 520, gy - 10, 240, 10, "#5a6290");
      R(c, 500, gy - 330, 22, 330, "#5a6290");
      R(c, 500, gy - 330, 22, 6, "#e8403f");
      for (let y = 40; y < 330; y += 40) R(c, 500, gy - y, 22, 3, "#3b4a8f");
      if (u < 3) {
        R(c, 522, gy - 250, 70, 8, "#8a93bb");
        R(c, 522, gy - 140, 74, 8, "#8a93bb");
      }
      R(c, 120, gy - 70, 150, 70, "#141a45");
      R(c, 140, gy - 56, 24, 14, "#ffd84d");
      R(c, 180, gy - 56, 24, 14, "#3ee0d0");
      R(c, 1000, gy - 110, 90, 110, "#141a45");
      R(c, 1016, gy - 94, 16, 12, "#ffd84d");
    }
    if (u > 2.6 && gy < 800) {
      const r = rng(5);
      for (let i = 0; i < 26; i++) {
        const id = u - 2.6 - i * 0.06,
          d = i % 2 ? 1 : -1,
          a = r(),
          b = r();
        if (id > 0) {
          const s = 24 + id * 46;
          R(
            c,
            640 + d * id * 150 * (0.3 + a) - s / 2,
            gy - 8 - id * 26 * b - s / 2,
            s,
            s,
            i % 3 ? "#8a93bb" : "#cfd6f5",
            cl(0.75 - id * 0.22),
          );
        }
      }
    }
    nave(
      c,
      640,
      516 - sobe,
      3,
      -90,
      u < 2.7 ? 0 : u < 3 ? 0.6 : 1.5,
      0,
      modelo,
      u,
    );
    const n =
      u < 1
        ? "3"
        : u < 2
          ? "2"
          : u < 3
            ? "1"
            : u < 4.3
              ? L("LIFT-OFF!", "DESCOLAGEM!")
              : "";
    if (n)
      T(
        c,
        640,
        190,
        n.length > 1 ? 90 : 150,
        n,
        "#ffd84d",
        "center",
        true,
        700,
      );
    c.restore();
  } else {
    const k = (u - 7) / 2;
    R(c, 0, 0, 1280, 720, "#03051a");
    estrelas(c, 1);
    terra(c, 640, 1650 - suave(k) * 120, 900);
    nave(c, 640, 300, 3, -90 + 90 * suave(k * 1.2), 1.1, 0, modelo, u);
    T(
      c,
      640,
      120,
      22,
      L(
        "In orbit: the ship lies down for the trip",
        "Em órbita: a nave deita-se para a viagem",
      ),
      "#e8ecff",
      "center",
      true,
    );
  }
  if (u < 0.3) R(c, 0, 0, 1280, 720, "#000", 1 - u / 0.3);
  if (u > 8.6) R(c, 0, 0, 1280, 720, "#000", (u - 8.6) / 0.4);
}

// ───────────── ROTA ─────────────
const BZ = [
  [345, 440],
  [480, 190],
  [760, 170],
  [962, 404],
];
function ponto(dest, s) {
  if (dest === "marte")
    return [
      695 - 185 * Math.cos(Math.PI * s),
      420 - 190 * Math.sin(Math.PI * s),
    ];
  const m = 1 - s;
  return [0, 1].map(
    (i) =>
      m * m * m * BZ[0][i] +
      3 * m * m * s * BZ[1][i] +
      3 * m * s * s * BZ[2][i] +
      s * s * s * BZ[3][i],
  );
}
export function rota(c, t, dt, G) {
  const e = G.vista.estado,
    d = e.destino || "lua",
    marcos = G.marcos(e);
  const alvo =
    e.fase === "viagem" ? cl(e.horas_rota / (e.duracao_horas || 1)) : 1;
  G.rotaP += (alvo - G.rotaP) * Math.min(1, dt * 1.4);
  const p = G.rotaP;
  R(c, 0, 0, 1280, 720, "#050820");
  estrelas(c, 0.7);
  for (let x = 40; x < 1280; x += 80)
    for (let y = 40; y < 720; y += 80) R(c, x, y, 2, 2, "#8fc2ff", 0.14);
  c.lineWidth = 2;
  c.setLineDash([6, 6]);
  if (d === "marte") {
    c.strokeStyle = "#2a3380";
    c.beginPath();
    c.arc(640, 420, 130, 0, 6.3);
    c.stroke();
    c.beginPath();
    c.arc(640, 420, 240, 0, 6.3);
    c.stroke();
    c.setLineDash([]);
    C(c, 640, 420, 40, "#ffd84d", 0.2);
    C(c, 640, 420, 26, "#ffd84d");
    T(c, 640, 470, 12, L("SUN", "SOL"), "#a9b2e0", "center");
    terra(c, 510, 420, 16);
    marte(c, 880, 420, 14);
    T(c, 510, 458, 14, L("EARTH", "TERRA"), "#e8ecff", "center", true);
    T(c, 880, 456, 14, L("MARS", "MARTE"), "#e8ecff", "center", true);
    T(
      c,
      640,
      640,
      12,
      L(
        "The ship aims at where Mars will be when it arrives",
        "A nave parte para onde Marte vai estar quando ela chegar",
      ),
      "#6a74b0",
      "center",
      false,
      400,
    );
  } else {
    c.strokeStyle = "#3ee0d0";
    c.globalAlpha = 0.5;
    c.beginPath();
    c.arc(250, 520, 122, 0, 6.3);
    c.stroke();
    c.beginPath();
    c.arc(1020, 430, 58, 0, 6.3);
    c.stroke();
    c.globalAlpha = 1;
    c.setLineDash([]);
    terra(c, 250, 520, 90);
    lua(c, 1020, 430, 40);
    T(c, 250, 650, 16, L("EARTH", "TERRA"), "#e8ecff", "center", true);
    T(c, 1020, 516, 16, L("MOON", "LUA"), "#e8ecff", "center", true);
  }
  c.setLineDash([3, 9]);
  c.strokeStyle = "rgba(62,224,208,.4)";
  c.lineWidth = 3;
  c.beginPath();
  for (let i = 0; i <= 120; i++) {
    const q = ponto(d, i / 120);
    i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]);
  }
  c.stroke();
  c.setLineDash([]);
  const feito = (lw, cor) => {
    c.strokeStyle = cor;
    c.lineWidth = lw;
    c.lineCap = "round";
    c.beginPath();
    const n = Math.max(1, Math.round(p * 120));
    for (let i = 0; i <= n; i++) {
      const q = ponto(d, i / 120);
      i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]);
    }
    c.stroke();
    c.lineCap = "butt";
  };
  if (p > 0.005) {
    feito(16, "rgba(62,224,208,.2)");
    feito(5, "#3ee0d0");
  }
  const incidente = e.desafio && e.fase === "viagem";
  [
    [0, L("Departure", "Partida")],
    ...marcos.map((m, i) => [m, L("Waypoint ", "Marco ") + (i + 1)]),
    [1, L("Arrival", "Chegada")],
  ].forEach((n, i) => {
    const q = ponto(d, n[0]),
      passado = p >= n[0] - 0.01,
      activo = incidente && Math.abs(alvo - n[0]) < 0.02,
      cor = activo ? "#ffd84d" : "#3ee0d0";
    if (activo) {
      c.strokeStyle = "#ffd84d";
      c.lineWidth = 2;
      c.globalAlpha = 0.7;
      c.beginPath();
      c.arc(q[0], q[1], 16 + 4 * Math.sin(t * 8), 0, 6.3);
      c.stroke();
      c.globalAlpha = 1;
    }
    c.save();
    c.translate(q[0], q[1]);
    c.rotate(Math.PI / 4);
    R(c, -8, -8, 16, 16, passado ? cor : "#050820");
    c.strokeStyle = cor;
    c.lineWidth = 3;
    c.strokeRect(-8, -8, 16, 16);
    c.restore();
    T(
      c,
      q[0],
      q[1] + (i % 2 ? 34 : -22),
      13,
      (activo ? "! " : "") + n[1],
      passado ? "#e8ecff" : "#a9b2e0",
      "center",
    );
  });
  const q = ponto(d, p),
    q2 = ponto(d, cl(p + 0.01)),
    q1 = ponto(d, cl(p - 0.01)),
    ang = Math.atan2(q2[1] - q1[1], q2[0] - q1[0]);
  const fora = (e.ajuste_rota || 0) * 9;
  G.rotaFora += (fora - G.rotaFora) * Math.min(1, dt * 3);
  const nx = q[0] - Math.sin(ang) * G.rotaFora,
    ny = q[1] + Math.cos(ang) * G.rotaFora;
  if (Math.abs(fora - G.rotaFora) > 0.5)
    for (let i = 0; i < 4; i++)
      R(
        c,
        nx + (Math.random() - 0.5) * 30,
        ny + (Math.random() - 0.5) * 30,
        4,
        4,
        "#8fe8ff",
        0.8,
      );
  const emAprox = e.fase === "aproximacao";
  nave(
    c,
    nx,
    ny,
    1.5,
    (ang * 180) / Math.PI,
    Math.abs(alvo - p) > 0.004 ? 1 : emAprox ? 0 : 0.35,
    0,
    G.cosm.nave,
    t,
  );
  if (e.piloto)
    etiq(
      c,
      nx,
      ny - 34,
      L("Pilot: ", "Piloto: ") + G.nomeDe(e.piloto),
      "#5a3a10",
      "#ffd84d",
    );
}

// ───────────── ATERRAGEM (8 s) ─────────────
const rd = rng(99),
  PO = [...Array(90)].map(() => ({
    u: 3.5 + rd() * 2.1,
    d: rd() < 0.5 ? -1 : 1,
    vx: 90 + rd() * 380,
    vy: 30 + rd() * 120,
    x0: rd() * 60,
  }));
export function aterragem(c, u, dest, modelo, f) {
  const s = cl(u / 5.5),
    y = -90 + 552 * (1 - (1 - s) * (1 - s)),
    x = 930 - 290 * suave(u / 2.2),
    ang = -90 * suave((u - 0.3) / 1.7),
    pernas = suave(u - 1.8),
    alt = 462 - y,
    M = dest === "marte";
  let dy = 0;
  if (u > 5.5 && u < 5.8) dy = (rng(f)() - 0.5) * 8;
  c.save();
  c.translate(0, dy);
  if (M) {
    ceuMarte(c, 0);
    cordilheira(c, 21, 560, 70, 28, "#c98a68", 0, 600);
    R(c, 0, 600, 1280, 120, "#a8522f");
    R(c, 0, 600, 1280, 4, "#c46a40");
  } else {
    R(c, 0, 0, 1280, 720, "#000");
    estrelas(c, 1, 0, 560);
    terra(c, 1060, 150, 30);
    cordilheira(c, 3, 560, 40, 20, "#5a5a66", 0, 600);
    R(c, 0, 600, 1280, 120, "#8e8e9a");
    R(c, 0, 600, 1280, 4, "#b8b8c6");
  }
  R(c, 500, 596, 280, 8, M ? "#5a2a18" : "#5a5a66");
  for (let i = 0; i < 6; i++)
    R(
      c,
      506 + i * 52,
      594,
      8,
      4,
      Math.floor(u * 4 + i) % 2 ? "#e8403f" : "#5a1a1a",
    );
  const sw = cl(1 - alt / 500);
  c.globalAlpha = M ? 0.25 + 0.3 * sw : 0.3 + 0.7 * sw;
  c.fillStyle = M ? "#5a2a18" : "#000";
  c.beginPath();
  c.ellipse(640, 603, 40 + 70 * sw, 3 + 4 * sw, 0, 0, 6.3);
  c.fill();
  c.globalAlpha = 1;
  PO.forEach((d) => {
    const a = u - d.u;
    if (a <= 0) return;
    if (M) {
      const k = cl(a / 2.6),
        sz = 14 + a * 26;
      R(
        c,
        640 +
          d.d * (d.x0 + d.vx * 0.5 * (1 - Math.exp(-a * 1.6))) +
          a * 40 -
          sz / 2,
        596 - d.vy * 0.35 * k - sz / 2,
        sz,
        sz,
        "#e8b27a",
        cl(0.5 - a * 0.12),
      );
    } else {
      const tf = (2 * d.vy) / 90,
        b = Math.min(a, tf);
      R(
        c,
        640 + d.d * (d.x0 + d.vx * b) - 4,
        598 - (d.vy * b - 45 * b * b) - 4,
        8,
        8,
        a < tf ? "#cfcfda" : "#a2a2b0",
      );
    }
  });
  nave(c, x, y, 3, ang, u < 5.5 ? 0.45 + 0.5 * (1 - s) : 0, pernas, modelo, u);
  if (u > 5.9) {
    T(
      c,
      640,
      170,
      68,
      M
        ? L("LANDED ON MARS", "ATERRAGEM EM MARTE")
        : L("LANDED ON THE MOON", "ATERRAGEM NA LUA"),
      "#ffd84d",
      "center",
      true,
      700,
    );
    T(
      c,
      640,
      214,
      17,
      M
        ? L(
            "With air: dust makes clouds and the wind drags it",
            "Com ar: a poeira forma nuvens e o vento arrasta-a",
          )
        : L(
            "No air: dust flies in long arcs and falls straight down",
            "Sem ar: a poeira voa em arcos longos e cai a direito",
          ),
      M ? "#0b1030" : "#e8ecff",
      "center",
      false,
      600,
    );
  } else
    T(
      c,
      640,
      60,
      18,
      u < 1.8
        ? L("Rotating the ship", "A rodar a nave")
        : u < 2.8
          ? L("Legs opening", "Pernas a abrir")
          : L("Braking with a short flame", "Travagem com chama curta"),
      M ? "#0b1030" : "#e8ecff",
      "center",
      true,
    );
  c.restore();
  if (u < 0.35) R(c, 0, 0, 1280, 720, "#000", 1 - u / 0.35);
  if (u > 7.6) R(c, 0, 0, 1280, 720, "#000", (u - 7.6) / 0.4);
}

// ───────────── SUPERFÍCIE ─────────────
export function ceuMarte(c) {
  R(c, 0, 0, 1280, 110, "#9a5a48");
  R(c, 0, 110, 1280, 100, "#b8694f");
  R(c, 0, 210, 1280, 110, "#d68a5f");
  R(c, 0, 320, 1280, 300, "#e8b27a");
  C(c, 1040, 130, 34, "#fff3d6", 0.35);
  C(c, 1040, 130, 16, "#fff3d6");
}
const CORD = {};
export function cordilheira(c, semente, base, amp, passo, cor, desl, fundo) {
  const k = semente + ":" + passo;
  if (!CORD[k]) {
    const r = rng(semente);
    let y = base;
    CORD[k] = [...Array(Math.ceil(4200 / passo))].map(
      () => (y = cl(y + (r() - 0.5) * amp * 0.9, base - amp, base + amp * 0.2)),
    );
  }
  const a = CORD[k],
    i0 = Math.floor(desl / passo);
  c.fillStyle = cor;
  c.beginPath();
  c.moveTo(0, fundo);
  for (let i = 0; i <= 1280 / passo + 1; i++) {
    const x = (i0 + i) * passo - desl,
      y = Math.round(a[(i0 + i) % a.length]);
    c.lineTo(x, y);
    c.lineTo(x + passo, y);
  }
  c.lineTo(1280, fundo);
  c.closePath();
  c.fill();
}
export function pedra(c, x, y, w, h, cor, sombra, comp, op = 1) {
  if (sombra)
    P(
      c,
      [x + w, y, x + w + comp, y, x + w + comp - 6, y - 4, x + w, y - h * 0.5],
      sombra,
      op,
    );
  P(
    c,
    [
      x,
      y,
      x + w * 0.15,
      y - h * 0.7,
      x + w * 0.5,
      y - h,
      x + w * 0.85,
      y - h * 0.75,
      x + w,
      y,
    ],
    cor,
  );
  P(
    c,
    [x + w * 0.5, y - h, x + w * 0.85, y - h * 0.75, x + w, y, x + w * 0.6, y],
    "#000",
    0.25,
  );
}
export function paineis(c, x, y, w, h, po = 0) {
  R(c, x, y, w, h, "#4a7bd1");
  for (let i = 0; i < w; i += 16) R(c, x + i, y, 2, h, "#1a2a6b");
  R(c, x, y + h / 2, w, 2, "#1a2a6b");
  if (po) R(c, x, y, w, h, "#e8b27a", po);
}
export function porFazer(c, x, GY, w, h, nome, t) {
  c.strokeStyle = "#ffd84d";
  c.setLineDash([8, 6]);
  c.lineWidth = 2;
  c.strokeRect(x - w / 2, GY - h, w, h);
  c.setLineDash([]);
  R(c, x - w / 2, GY - h, w, h, "#ffd84d", 0.05 + 0.04 * Math.sin(t * 3));
  T(c, x, GY - h / 2, 12, nome, "#ffd84d", "center");
}
