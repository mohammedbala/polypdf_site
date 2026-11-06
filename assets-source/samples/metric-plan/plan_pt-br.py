#!/usr/bin/env python3
"""Brasil: UBS Porte I fictícia, A1 paisagem, escala 1:50. Planta em L, uma única vista, cotas em metros com vírgula."""
import sys, math
from collections import Counter
from pathlib import Path
from draftkit import *

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'out'); OUT.mkdir(exist_ok=True)
RED = '#a32a20'                     # cotas em vermelho, como nas pranchas públicas de referência
BLUE, BLUE_TINT = '#1c5d86', '#d3e6f1'
FURN, SAN = '#868d92', '#5b6267'    # mobiliário e louças em traço fino
def br(v, p=2): return f'{v:.{p}f}'.replace('.', ',')
fm = fmt_m(2, ',')

# ---- geometria (metros, canto inferior esquerdo externo, rua ao sul)
W, D = 27.0, 20.0
FOOT = [(0, 0), (27, 0), (27, 20), (16, 20), (16, 10), (0, 10)]
GA_POLY = [(0, 6.2), (11, 6.2), (11, 8.2), (12.8, 8.2), (12.8, 10), (0, 10)]
# nº, ambiente, x, y, largura, profundidade, piso, etiqueta x, etiqueta y, linhas do nome, altura do nome
ROOMS = [
 ('01', 'SALA DE PRÁTICAS COLETIVAS', 0, 0, 6, 4.2, 'GB', 4.45, 1.0, ['SALA DE PRÁTICAS', 'COLETIVAS'], 3.0),
 ('02', 'SALA DE VACINAÇÃO', 6, 0, 2.8, 4.2, 'GB', 7.3, 2.6, ['SALA DE', 'VACINAÇÃO'], 2.6),
 ('03', 'SALA DE AMAMENTAÇÃO', 8.8, 0, 2.2, 4.2, 'GB', 10.03, 2.6, ['SALA DE', 'AMAMENTAÇÃO'], 2.3),
 ('04', 'ESPERA', 11, 0, 6, 6.2, 'GB', 15.15, 2.9, ['ESPERA'], 3.5),
 ('05', 'RECEPÇÃO', 17, 0, 3, 4.2, 'GB', 18.8, 1.95, ['RECEPÇÃO'], 2.8),
 ('06', 'FARMÁCIA – DISPENSAÇÃO', 20, 0, 1.6, 4.2, 'GB', 20.8, 1.45, ['FARMÁCIA –', 'DISPENSAÇÃO'], 2.0),
 ('07', 'FARMÁCIA – ARMAZENAMENTO', 21.6, 0, 2.6, 4.2, 'GB', 22.9, 1.1, ['FARMÁCIA –', 'ARMAZENAMENTO'], 2.2),
 ('08', 'SALA DE CURATIVO', 24.2, 0, 2.8, 4.2, 'GB', 25.63, 1.75, ['SALA DE', 'CURATIVO'], 2.6),
 ('09', 'CIRCULAÇÃO 01', 0, 4.2, 11, 2, 'GB', 5.55, 5.2, ['CIRCULAÇÃO 01'], 2.6),
 ('10', 'CIRCULAÇÃO 02', 17, 4.2, 10, 2, 'GB', 21.3, 5.05, ['CIRCULAÇÃO 02'], 2.6),
 ('11', 'ESCOVÁRIO', 0, 6.2, 2, 3.8, 'GA', 1.33, 8.4, ['ESCOVÁRIO'], 2.0),
 ('12', 'CONSULTÓRIO EMULTI', 2, 6.2, 3, 3.8, 'GA', 3.15, 7.7, ['CONSULTÓRIO', 'EMULTI'], 2.8),
 ('13', 'CONSULTÓRIO INDIFERENCIADO', 5, 6.2, 3, 3.8, 'GA', 6.15, 7.7, ['CONSULTÓRIO', 'INDIFERENCIADO'], 2.5),
 ('14', 'CONSULTÓRIO DIFERENCIADO', 8, 6.2, 3, 3.8, 'GA', 9.1, 7.7, ['CONSULTÓRIO', 'DIFERENCIADO'], 2.6),
 ('15', 'SANITÁRIO PCD', 11, 8.2, 1.8, 1.8, 'GA', 11.6, 9.25, ['SANITÁRIO', 'PCD'], 1.7),
 ('16', 'SANITÁRIO INFANTIL / FRALDÁRIO', 11, 6.2, 1.8, 2, 'GB', 12.18, 7.6, ['SANITÁRIO', 'INFANTIL /', 'FRALDÁRIO'], 1.6),
 ('17', 'SALA DE ACOLHIMENTO', 12.8, 6.2, 3.2, 3.8, 'GB', 14.4, 7.65, ['SALA DE', 'ACOLHIMENTO'], 2.8),
 ('18', 'SANITÁRIO PCD FEMININO', 16, 6.2, 2.25, 2, 'GB', 16.87, 7.0, ['SANITÁRIO PCD', 'FEMININO'], 1.9),
 ('19', 'SANITÁRIO PCD MASCULINO', 18.25, 6.2, 2.25, 2, 'GB', 19.63, 7.0, ['SANITÁRIO PCD', 'MASCULINO'], 1.9),
 ('20', 'ALMOXARIFADO', 16, 8.2, 4.5, 1.8, 'GS', 18.1, 8.85, ['ALMOXARIFADO'], 2.6),
 ('21', 'CIRCULAÇÃO 03', 20.5, 6.2, 2, 13.8, 'GB', 21.5, 7.8, ['CIRCULAÇÃO', '03'], 2.6),
 ('22', 'SANITÁRIO PCD', 22.5, 6.2, 1.7, 1.9, 'GB', 23.38, 6.85, ['SANITÁRIO', 'PCD'], 1.7),
 ('23', 'DML', 22.5, 8.1, 1.7, 1.9, 'GS', 23.55, 8.6, ['DML'], 2.2),
 ('24', 'SALA DE MEDICAÇÃO E COLETA', 24.2, 6.2, 2.8, 3.8, 'GB', 25.55, 8.3, ['SALA DE', 'MEDICAÇÃO', 'E COLETA'], 2.3),
 ('25', 'CONSULTÓRIO ODONTOLÓGICO', 16, 10, 4.5, 2.6, 'GB', 18.8, 11.2, ['CONSULTÓRIO', 'ODONTOLÓGICO'], 2.8),
 ('26', 'SALA DE GESTÃO ADMINISTRATIVA', 16, 12.6, 4.5, 1.8, 'GB', 18.35, 13.5, ['SALA DE GESTÃO', 'ADMINISTRATIVA'], 2.5),
 ('27', 'SALA DE INTEGRAÇÃO DAS EQUIPES', 16, 14.4, 4.5, 3.8, 'GB', 17.95, 15.25, ['SALA DE INTEGRAÇÃO', 'DAS EQUIPES'], 2.8),
 ('28', 'COPA', 16, 18.2, 4.5, 1.8, 'GB', 18.1, 18.72, ['COPA'], 2.6),
 ('29', 'SALA DE RECEPÇÃO E LIMPEZA (SUJA)', 22.5, 10, 4.5, 2.2, 'GB', 25.1, 10.8, ['SALA DE RECEPÇÃO', 'E LIMPEZA (SUJA)'], 2.5),
 ('30', 'SALA DE PREPARO E ESTERILIZAÇÃO (LIMPA)', 22.5, 12.2, 4.5, 2.2, 'GB', 25.25, 13.6, ['SALA DE PREPARO E', 'ESTERILIZAÇÃO (LIMPA)'], 2.3),
 ('31', 'GUARDA DE MATERIAL ESTERILIZADO', 22.5, 14.4, 2, 2, 'GB', 23.28, 14.95, ['GUARDA DE MATERIAL', 'ESTERILIZADO'], 1.5),
 ('32', 'ÁREA TÉCNICA', 24.5, 14.4, 2.5, 2, 'GS', 25.65, 14.98, ['ÁREA TÉCNICA'], 2.0),
 ('33', 'BANHEIRO FUNC. MASCULINO', 22.5, 16.4, 2, 1.8, 'GB', 23.1, 17.1, ['BANHEIRO', 'FUNC.', 'MASCULINO'], 1.6),
 ('34', 'RESÍDUOS COMUNS (GRUPO D)', 24.5, 16.4, 2.5, 1.8, 'GS', 25.55, 16.93, ['RESÍDUOS COMUNS', '(GRUPO D)'], 1.8),
 ('35', 'BANHEIRO FUNC. FEMININO', 22.5, 18.2, 2, 1.8, 'GB', 23.1, 18.85, ['BANHEIRO', 'FUNC.', 'FEMININO'], 1.6),
 ('36', 'RESÍDUOS CONTAMINADOS (GRUPOS A/E)', 24.5, 18.2, 2.5, 1.8, 'GS', 25.6, 18.72, ['RESÍDUOS CONTAMINADOS', '(GRUPOS A/E)'], 1.6),
]
RECTS = [(r[2], r[3], r[4], r[5]) for r in ROOMS]
GROSS = check_tiling(RECTS, FOOT)
assert abs(GROSS - 380.0) < 1e-6, GROSS
assert abs(W * D - GROSS) > 100                           # o retângulo envolvente NÃO é a área construída
BBOX = W * D
def area(r): return round(r[4] * r[5] + 1e-9, 2)
BYFLOOR = {k: round(sum(area(r) for r in ROOMS if r[6] == k), 2) for k in ('GB', 'GA', 'GS')}
assert BYFLOOR == {'GB': 309.63, 'GA': 45.04, 'GS': 25.33}, BYFLOOR
assert round(sum(BYFLOOR.values()), 2) == round(GROSS, 2)
assert abs(poly_area(GA_POLY) - BYFLOOR['GA']) < 1e-6, poly_area(GA_POLY)
assert {r[0] for r in ROOMS if r[6] == 'GA'} == {'11', '12', '13', '14', '15'}
CANOPY = (11, -3.5, 17, 0)
CANOPY_AREA = round((CANOPY[2] - CANOPY[0]) * (CANOPY[3] - CANOPY[1]), 2)
assert CANOPY_AREA == 21.0

# ambientes sem fachada, para a nota de renovação mecânica de ar
def on_facade(r):
    x0, y0, x1, y1 = r[2], r[3], r[2] + r[4], r[3] + r[5]
    return x0 == 0 or y0 == 0 or x1 == 27 or y1 == 20 or (y1 == 10 and x1 <= 16) or (x0 == 16 and y0 >= 10)
NO_FACADE = [r[0] for r in ROOMS if not on_facade(r)]
assert NO_FACADE == ['16', '18', '19', '20', '22', '23', '31', '33'], NO_FACADE

# ---- paredes
B = Building()
E, T = 0.20, 0.15
t = T / 2
for r in ((0, 0, 27, E), (0, 0, E, 10), (0, 10 - E, 16, 10), (16, 10, 16 + E, 20), (16, 20 - E, 27, 20), (27 - E, 0, 27, 20)):
    B.wall(*r, 'ext')
def H(y, x0, x1): B.wall(x0, y - t, x1, y + t, 'int')
def V(x, y0, y1): B.wall(x - t, y0, x + t, y1, 'int')
H(4.2, E, 11 + t); H(4.2, 17 - t, 27 - E)
H(6.2, E, 20.5); H(6.2, 22.5, 27 - E)                     # a circulação 03 abre livre para a circulação 02
H(8.2, 11, 12.8); H(8.2, 16, 20.5); H(8.1, 22.5, 24.2)
H(10, 16, 20.5); H(10, 22.5, 27 - E)
H(12.6, 16 + E, 22.5)                                     # segue pela circulação 03: daqui para cima, só funcionários
H(14.4, 16 + E, 20.5); H(18.2, 16 + E, 20.5)
H(12.2, 22.5, 27 - E); H(14.4, 22.5, 27 - E); H(16.4, 22.5, 27 - E); H(18.2, 22.5, 27 - E)
for x in (2, 5, 8, 11, 12.8): V(x, 6.2, 10 - E)
V(16, 6.2, 10)
for x in (6, 8.8, 20, 21.6, 24.2): V(x, E, 4.2)
V(11, E, 4.2 + t); V(17, E, 4.2 + t)
V(18.25, 6.2, 8.2); V(20.5, 6.2 - t, 20 - E); V(22.5, 6.2 - t, 20 - E); V(24.2, 6.2, 10); V(24.5, 14.4, 20 - E)

# ---- esquadrias: P portas, J janelas (largura, altura, peitoril)
SIZE = {'P1': 0.90, 'P2': 1.10, 'P3': 0.80, 'P4': 1.60, 'P5': 1.00, 'J1': 2.00, 'J2': 1.20, 'J3': 0.60, 'G1': 0.70, 'G2': 0.80, 'B1': 2.40}
OPEN = []
def iw(v): return (round(v - t, 6), round(v + t, 6))
S_, W_, E_, NB, NW, WG = (0, E), (0, E), (27 - E, 27), (10 - E, 10), (20 - E, 20), (16, 16 + E)
def door(tag, axis, c, wall, hinge='a', swing=1, pos=None, side=None):
    w = SIZE[tag]; at = round(c - w / 2, 6)
    B.door(axis, at, w, wall, hinge, swing)
    mid, off = (wall[0] + wall[1]) / 2, (wall[1] - wall[0]) / 2 + 0.25
    if pos is None: pos = (c, mid - swing * off) if axis == 'h' else (mid - swing * off, c)
    OPEN.append(dict(t='door', tag=tag, axis=axis, at=at, w=w, wall=wall, hinge=hinge, swing=swing, pos=pos, side=side))
OUTWARD = {'S': (0, -0.42), 'N': (0, 0.42), 'E': (0.42, 0), 'G': (-0.42, 0)}
def window(tag, axis, c, wall, side, base):
    w = SIZE[tag]; at = round(c - w / 2, 6)
    B.window(axis, at, w, wall, 'slide' if tag != 'J3' else 'plain', 2)
    dx, dy = OUTWARD[side[0]]
    pos = (c + dx, base + dy) if axis == 'h' else (base + dx, c + dy)
    OPEN.append(dict(t='window', tag=tag, axis=axis, at=at, w=w, wall=wall, pos=pos, side=side))
def guiche(tag, axis, at, wall, pos, side=None):
    w = SIZE[tag]
    B.window(axis, at, w, wall, 'plain', 1)
    OPEN.append(dict(t='hatch', tag=tag, axis=axis, at=at, w=w, wall=wall, pos=pos, side=side))

# parede y=4,20: portas abrem para dentro das salas, nunca contra a circulação
for tag, c, hg in (('P2', 3.0, 'a'), ('P1', 6.675, 'a'), ('P1', 9.475, 'a'), ('P1', 19.3, 'b'), ('P1', 20.7, 'a'), ('P1', 22.9, 'b'), ('P2', 26.05, 'b')):
    door(tag, 'h', c, iw(4.2), hg, -1)
# parede y=6,20
for tag, c, hg in (('P1', 1.0, 'b'), ('P1', 2.675, 'a'), ('P1', 5.675, 'a'), ('P1', 8.675, 'a'), ('P3', 12.25, 'b'), ('P1', 13.425, 'a'), ('P2', 25.6, 'b')):
    door(tag, 'h', c, iw(6.2), hg, 1)
door('P1', 'h', 17.7, iw(6.2), 'a', -1, pos=(16.98, 5.87))    # sanitários PCD abrem para fora; a 18 sai da frente do pilar x=17
door('P1', 'h', 19.4, iw(6.2), 'b', -1, pos=(18.72, 5.87))
door('P1', 'h', 23.35, iw(6.2), 'b', -1, pos=(22.68, 5.87))
# entre ambientes
door('P1', 'v', 2.1, iw(6), 'a', -1)
door('P3', 'v', 2.1, iw(21.6), 'a', 1)
door('P1', 'v', 9.17, iw(11), 'b', -1, pos=(10.72, 8.42))
door('P1', 'v', 7.15, iw(24.2), 'b', 1, pos=(24.5, 6.52))
# circulação 03
for tag, c in (('P3', 9.1), ('P1', 10.675), ('P1', 13.5), ('P1', 15.1), ('P3', 19.1)):
    door(tag, 'v', c, iw(20.5), 'a', -1)
for tag, c, hg in (('P3', 9.05, 'b'), ('P1', 10.7, 'a'), ('P3', 15.85, 'b')):
    door(tag, 'v', c, iw(22.5), hg, 1)
door('P1', 'v', 13.3, iw(22.5), 'a', 1, pos=(22.175, 13.56))  # etiqueta fora do giro da porta de controle
door('P3', 'v', 17.3, iw(22.5), 'b', -1, pos=(22.2, 16.68))
door('P3', 'v', 19.1, iw(22.5), 'b', -1, pos=(22.2, 18.48))
door('P2', 'h', 21.6, iw(12.6), 'a', 1)                       # controle: pacientes até o consultório 25, além daqui só funcionários
# externas
door('P4', 'h', 14.0, S_, 'both', -1, side='S')
door('P4', 'v', 2.1, W_, 'both', -1, side='W')
door('P2', 'v', 5.2, W_, 'a', -1, side='W')
door('P2', 'h', 21.5, NW, 'a', 1, pos=(21.03, 19.52), side='N2')
door('P5', 'v', 15.4, E_, 'a', 1, pos=(26.55, 15.7), side='E')
door('P5', 'v', 17.3, E_, 'a', 1, pos=(26.55, 17.72), side='E')
door('P5', 'v', 19.1, E_, 'a', 1, pos=(26.55, 19.5), side='E')
# janelas
for tag, c in (('J1', 3), ('J2', 7.4), ('J2', 9.9), ('J2', 12.1), ('J2', 15.9), ('J1', 18.5), ('J2', 22.9), ('J1', 25.6)):
    window(tag, 'h', c, S_, 'S', 0)
for tag, c in (('J2', 1), ('J1', 3.5), ('J1', 6.5), ('J1', 9.5), ('J3', 11.9), ('J1', 14.4)):
    window(tag, 'h', c, NB, 'N1', 10)
for tag, c in (('J2', 18.25), ('J3', 23.5)):
    window(tag, 'h', c, NW, 'N2', 20)
for tag, c in (('J2', 5.2), ('J1', 8.1), ('J2', 11.1), ('J2', 13.3)):
    window(tag, 'v', c, E_, 'E', 27)
for tag, c in (('J1', 11.5), ('J2', 13.5), ('J1', 16.3)):
    window(tag, 'v', c, WG, 'G', 16)
# guichês e balcão, sem porta
guiche('G1', 'h', 20.75, S_, (21.1, -0.42), 'S')             # ao lado do pilar x=20,5
guiche('B1', 'v', 0.8, iw(17), (16.62, 2.0))
guiche('G2', 'h', 24.3, iw(12.2), (24.7, 11.84))
guiche('G2', 'h', 23.1, iw(14.4), (23.5, 14.1))
COUNT = Counter(o['tag'] for o in OPEN if o['tag'])
assert sum(1 for o in OPEN if o['t'] == 'door') == sum(v for k, v in COUNT.items() if k[0] == 'P')

# ---- pilares de concreto, sempre embutidos em parede e fora dos vãos: (centro x, centro y, direção maior)
PILLARS = [(0.2, 0.1, 'h'), (5, 0.1, 'h'), (11, 0.1, 'h'), (17, 0.1, 'h'), (20.5, 0.1, 'h'), (24.2, 0.1, 'h'), (26.8, 0.1, 'h'),
           (0.1, 6.2, 'v'), (5, 6.2, 'h'), (11, 6.2, 'h'), (17, 6.2, 'h'), (20.5, 6.2, 'v'), (24.2, 6.2, 'h'), (26.9, 6.2, 'v'),
           (0.2, 9.9, 'h'), (5, 9.9, 'h'), (11, 9.9, 'h'), (15.8, 9.9, 'h'), (20.5, 10, 'v'), (22.5, 10, 'v'), (26.9, 10, 'v'),
           (16.1, 14.4, 'v'), (20.5, 14.4, 'v'), (22.5, 14.4, 'v'), (26.9, 14.4, 'v'),
           (16.2, 19.9, 'h'), (20.5, 19.9, 'h'), (22.5, 19.9, 'h'), (26.8, 19.9, 'h')]
def pillar_box(p):
    x, y, a = p
    hw, hd = (0.2, 0.1) if a == 'h' else (0.1, 0.2)
    return (x - hw, y - hd, x + hw, y + hd)
# as prumadas internas da fachada sul e da fileira y=6,20 coincidem
assert sorted(p[0] for p in PILLARS if p[1] == 0.1)[1:-1] == sorted(p[0] for p in PILLARS if p[1] == 6.2)[1:-1]

# ---- louças e mobiliário: registrados primeiro para as verificações, desenhados depois
FX = []
def fx(kind, x0, y0, x1, y1, **kw): FX.append(dict(kind=kind, box=(min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)), **kw))
def mob(x0, y0, x1, y1): fx('mob', x0, y0, x1, y1)
def chair(x, y, s=0.36): fx('mob', x, y, x + s, y + s)
def stool(x, y, r=0.18): fx('stool', x - r, y - r, x + r, y + r, c=(x, y), r=r)
def shelf(x0, y0, x1, y1): fx('shelf', x0, y0, x1, y1)
def boxx(x0, y0, x1, y1): fx('box', x0, y0, x1, y1)
def bench(x0, y0, x1, y1, sinks=()): fx('bench', x0, y0, x1, y1, sinks=sinks)
def maca(x0, y0, x1, y1): fx('maca', x0, y0, x1, y1)
def shower(x0, y0, x1, y1): fx('shower', x0, y0, x1, y1)
DIRS = {'n': (0, 1), 's': (0, -1), 'e': (1, 0), 'w': (-1, 0)}
def wc(x, y, rot):
    ux, uy = DIRS[rot]; vx, vy = -uy, ux
    a, b = (x + vx * -0.2, y + vy * -0.2), (x + ux * 0.62 + vx * 0.2, y + uy * 0.62 + vy * 0.2)
    fx('wc', a[0], a[1], b[0], b[1], at=(x, y), rot=rot)
def basin(x, y, rot, w=0.5, depth=0.4):
    ux, uy = DIRS[rot]; vx, vy = -uy, ux
    a, b = (x + vx * -w / 2, y + vy * -w / 2), (x + ux * depth + vx * w / 2, y + uy * depth + vy * w / 2)
    fx('basin', a[0], a[1], b[0], b[1], at=(x, y), rot=rot, w=w, depth=depth)

for i in range(10):                                   # 01: roda de cadeiras para práticas coletivas
    a = math.radians(i * 36 + 18)
    stool(1.95 + 1.0 * math.cos(a), 1.85 + 1.0 * math.sin(a))
mob(6.125, 0.3, 6.725, 1.5); chair(6.8, 0.72)         # 02: vacinação
bench(8.125, 0.25, 8.725, 2.35, [(8.425, 1.3)]); boxx(8.125, 2.45, 8.725, 3.05)
mob(8.925, 0.6, 9.575, 1.25); mob(8.925, 1.4, 9.575, 2.05); basin(10.925, 3.35, 'w')   # 03: amamentação
for i in range(8):                                    # 04: espera, 16 lugares voltados para a recepção
    chair(11.15, 0.6 + 0.45 * i, 0.42); chair(12.35, 0.6 + 0.45 * i, 0.42)
mob(15.2, 5.72, 15.6, 6.125)                          # bebedouro
mob(17.075, 0.7, 17.675, 3.3); chair(17.8, 1.1); chair(17.8, 2.5); shelf(19.5, 0.3, 19.925, 3.1)   # 05: balcão e arquivo
mob(20.075, 0.2, 21.525, 0.75)                        # 06: balcão do guichê
shelf(23.7, 0.3, 24.125, 3.9); shelf(21.675, 2.6, 22.1, 4.05)   # 07
maca(24.35, 0.75, 25.05, 2.75); bench(26.2, 0.4, 26.8, 2.9, [(26.5, 1.6)])    # 08: curativo
bench(0.2, 7.3, 0.72, 9.75, [(0.46, 7.75), (0.46, 8.3), (0.46, 8.85), (0.46, 9.4)])   # 11: escovário, lavatório coletivo
for dx in (0, 3, 6):                                  # 12, 13, 14: pia junto à porta, maca, mesa
    basin(3.6 + dx, 6.275, 'n')
    mob(2.125 + dx, 8.6, 3.525 + dx, 9.2); chair(2.65 + dx, 9.26); chair(2.35 + dx, 8.18); chair(2.95 + dx, 8.18)
maca(4.225, 6.9, 4.925, 8.9); maca(7.225, 6.9, 7.925, 8.9); maca(10.225, 6.4, 10.925, 8.2)
basin(11.6, 8.275, 'n'); wc(12.725, 9.325, 'w')       # 15
wc(11.075, 6.75, 'e'); bench(11.075, 7.05, 11.6, 8.125, [(11.34, 7.7)])       # 16: fraldário
basin(14.55, 6.275, 'n'); mob(14.1, 8.55, 15.5, 9.15); chair(14.6, 9.2); chair(14.3, 8.13); chair(14.94, 8.13)   # 17
wc(18.175, 7.65, 'w'); basin(16.7, 8.125, 's')        # 18
wc(18.325, 7.65, 'e'); basin(19.8, 8.125, 's')        # 19
shelf(16.1, 9.5, 19.5, 9.925)                         # 20
wc(22.575, 7.55, 'e'); basin(23.8, 8.025, 's')        # 22
boxx(23.525, 9.325, 24.125, 9.925)                    # 23: tanque
bench(24.275, 9.2, 26.8, 9.8, [(25.5, 9.5)]); mob(24.3, 7.75, 24.95, 8.4); mob(24.3, 8.5, 24.95, 9.15); mob(26.1, 7.45, 26.75, 8.1)   # 24
bench(16.25, 12.0, 19.6, 12.525, [(17.2, 12.26)]); fx('dental', 16.35, 10.6, 17.75, 11.25); stool(16.85, 11.6, 0.2)   # 25
mob(16.25, 12.9, 16.85, 14.1); chair(16.9, 13.32)     # 26
mob(16.9, 16.4, 19.3, 17.4)                           # 27
for i in range(3):
    chair(17.1 + 0.8 * i, 15.97); chair(17.1 + 0.8 * i, 17.46)
bench(16.25, 19.2, 19.5, 19.8, [(18.25, 19.5)]); boxx(16.25, 18.55, 16.85, 19.15)   # 28
bench(23.6, 11.55, 26.8, 12.125, [(25.85, 11.84), (26.35, 11.84)])            # 29: expurgo, pia dupla
bench(23.6, 12.275, 26.8, 12.85)                      # 30, autoclave desenhada sobre a bancada
shelf(24.0, 14.5, 24.425, 16.3)                       # 31
boxx(24.65, 15.5, 25.35, 16.25); boxx(25.5, 15.75, 26.0, 16.25)   # 32: compressor e bomba
shower(23.625, 17.325, 24.425, 18.125); wc(24.425, 16.85, 'w'); basin(23.0, 18.125, 's')   # 33
for x in (24.65, 25.35):
    boxx(x, 17.4, x + 0.6, 18.05)                     # 34
    boxx(x, 19.12, x + 0.6, 19.75)                    # 36
shower(23.725, 19.1, 24.425, 19.8); wc(24.425, 18.7, 'w'); basin(23.4, 19.8, 's')   # 35

# ---- verificações: nenhuma folha bate em outra, nenhum vão bloqueado, nada dentro de parede
def leaves(o):
    a, w, (w0, w1), s = o['at'], o['w'], o['wall'], o['swing']
    face = w1 if s > 0 else w0
    spec = [(a, 1, w)] if o['hinge'] == 'a' else [(a + w, -1, w)] if o['hinge'] == 'b' else [(a, 1, w / 2), (a + w, -1, w / 2)]
    out = []
    for hu, su, r in spec:
        out.append(((hu, face), (0, s), (su, 0), r) if o['axis'] == 'h' else ((face, hu), (s, 0), (0, su), r))
    return out
def in_sector(p, sec):
    (hx, hy), L, J, r = sec
    dx, dy = p[0] - hx, p[1] - hy
    return dx * L[0] + dy * L[1] > 1e-6 and dx * J[0] + dy * J[1] > 1e-6 and math.hypot(dx, dy) < r - 1e-6
def sector_points(sec, n=14):
    (hx, hy), L, J, r = sec
    for i in range(1, n + 1):
        for k in range(0, n + 1):
            th = math.pi / 2 * k / n; rho = r * i / n
            yield (hx + rho * (math.cos(th) * L[0] + math.sin(th) * J[0]), hy + rho * (math.cos(th) * L[1] + math.sin(th) * J[1]))
DOORS = [o for o in OPEN if o['t'] == 'door']
SECS = [(o, s) for o in DOORS for s in leaves(o)]
for i, (a, sa) in enumerate(SECS):
    for b, sb in SECS[i + 1:]:
        if a is b: continue
        assert not any(in_sector(p, sb) for p in sector_points(sa)), f'folhas colidem: {a["tag"]} {a["at"]} x {b["tag"]} {b["at"]}'
def in_box(p, b, tol=1e-6): return b[0] + tol < p[0] < b[2] - tol and b[1] + tol < p[1] < b[3] - tol
def overlap(a, b, tol=0.002): return min(a[2], b[2]) - max(a[0], b[0]) > tol and min(a[3], b[3]) - max(a[1], b[1]) > tol
for f in FX:
    for o, s in SECS:
        assert not any(in_box(p, f['box']) for p in sector_points(s)), f'{f["kind"]} {f["box"]} no giro da porta {o["tag"]} {o["at"]}'
    for o in DOORS:                                   # meio metro livre também do lado sem giro
        a, w, (w0, w1), s = o['at'], o['w'], o['wall'], o['swing']
        front = ((a, w0 - 0.5, a + w, w0) if s > 0 else (a, w1, a + w, w1 + 0.5)) if o['axis'] == 'h' else ((w0 - 0.5, a, w0, a + w) if s > 0 else (w1, a, w1 + 0.5, a + w))
        assert not overlap(f['box'], front), f'{f["kind"]} {f["box"]} bloqueia a porta {o["tag"]} {o["at"]}'
WALL_RECTS = [tuple(r) for r in B.region().rects()]
for f in FX:
    for r in WALL_RECTS:
        assert not overlap(f['box'], r), f'{f["kind"]} {f["box"]} dentro da parede {r}'
for i, a in enumerate(FX):
    for b in FX[i + 1:]:
        assert not overlap(a['box'], b['box']), f'{a["kind"]} {a["box"]} x {b["kind"]} {b["box"]}'
for p in PILLARS:
    pb = pillar_box(p)
    for o in OPEN:
        (w0, w1), a, w = o['wall'], o['at'], o['w']
        gap = (a, w0, a + w, w1) if o['axis'] == 'h' else (w0, a, w1, a + w)
        assert not overlap(pb, gap), f'pilar {p} no vão {o["tag"]} {o["at"]}'
    assert any(overlap(pb, r) for r in WALL_RECTS), f'pilar {p} fora de parede'
    assert pb[0] >= -1e-9 and pb[1] >= -1e-9 and pb[2] <= 27 + 1e-9 and pb[3] <= 20 + 1e-9

def facade_stops(side, lo, hi):
    return sorted({lo, hi} | {round(v, 6) for o in OPEN if o['side'] == side for v in (o['at'], o['at'] + o['w'])})

# ---- folha
PW, PH = 841, 594
d = Doc(OUT / 'pt-br.pdf', (PW, PH), 'Prancha de exercício – UBS Ribeirão das Quaresmeiras, planta baixa, escala 1:50',
        subject='Prancha de exercício PolyPDF. Projeto fictício, não usar para execução de obra.', keywords='prancha de exercício, planta baixa, UBS, área construída')
d.frame(25, 10, 831, 584)
OX, OY = 75, 120
v = View(d, OX, OY, 50)

def finish_circle(cx, cy, r, key, h):
    d.circle(cx, cy, r, 0.13, INK, fill=(BLUE_TINT if key == 'GA' else WHITE))
    d.text(cx, cy - h * 0.5, key, h, align='center')
def room_tag(r):
    no, _, _, _, _, _, piso, tx, ty, lines, h = r
    s = max(0.72, min(1.0, h / 2.6))                 # caixa e círculo acompanham o nome
    bh, bw, cr, nh, ah = 3.6 * s, 6.6 * s, 2.0 * s, 2.0 * s, max(1.5, 2.3 * s)
    gap = h * 0.62                                   # til e cedilha não encostam na linha vizinha
    drop = h * 0.32 + 0.55 * s                       # nem a cedilha encosta na caixa do número
    total = len(lines) * h + (len(lines) - 1) * gap + drop + bh + 0.9 * s + ah
    y = v.Y(ty) + total / 2; cx = v.X(tx)
    for ln in lines:
        y -= h
        d.text(cx, y, ln, h, True, align='center')
        y -= gap
    y += gap - drop
    rw = bw + 1.0 * s + 2 * cr
    x0 = cx - rw / 2
    d.rect(x0, y - bh, bw, bh, 0.18, INK, fill=WHITE)
    d.text(x0 + bw / 2, y - bh / 2 - nh * 0.5, no, nh, align='center')
    finish_circle(x0 + bw + 1.0 * s + cr, y - bh / 2, cr, piso, 1.5 * s)
    y -= bh + 0.9 * s + ah
    d.text(cx, y, f'A: {br(area(r))} m²', ah, align='center')
def level(x, y, s, h=2.1):
    px, py = v.X(x), v.Y(y); r = 2.5
    d.circle(px, py, r, 0.13, INK, fill=WHITE)
    for a0 in (0, 180):
        pts = [(px, py)] + [(px + r * math.cos(math.radians(a0 + k * 15)), py + r * math.sin(math.radians(a0 + k * 15))) for k in range(7)]
        d.poly(pts, True, 0, fill=INK)
    w = d.width(s, h)
    d.line(px + r, py, px + r + 1.0 + w, py, 0.13)
    d.text(px + r + 0.8, py + 0.7, s, h)
def access(x, y, size=5.0):
    """Símbolo internacional de acesso, centrado em (x, y) metros."""
    px, py = v.X(x) - size / 2, v.Y(y) - size / 2; u = size
    d.rect(px, py, u, u, 0, fill='#1d4f91')
    def P(a, b): return (px + a * u, py + b * u)
    d.circle(*P(0.44, 0.83), 0.075 * u, 0, fill=WHITE)
    w = 0.1 * u
    d.line(*P(0.44, 0.72), *P(0.46, 0.42), w, WHITE, cap=1)
    d.line(*P(0.45, 0.60), *P(0.64, 0.60), w, WHITE, cap=1)
    d.line(*P(0.46, 0.42), *P(0.68, 0.42), w, WHITE, cap=1)
    d.line(*P(0.68, 0.42), *P(0.79, 0.19), w, WHITE, cap=1)
    cx, cy = P(0.40, 0.33)
    d.arc(cx, cy, 0.2 * u, 100, 235, w * 0.8, WHITE)

# ---- camadas de fundo
v.fill_poly(GA_POLY, BLUE_TINT)
# área externa: canteiros da horta, roda ao ar livre
for x in (1.0, 2.9, 4.8, 6.7):
    v.rectm(x, 13.0, x + 1.3, 17.2, 0.13, LIGHT)
    v.linem(x + 0.43, 13.0, x + 0.43, 17.2, 0.09, PALE); v.linem(x + 0.87, 13.0, x + 0.87, 17.2, 0.09, PALE)
for i in range(10):
    a = math.radians(i * 36)
    v.circlem(11.0 + 1.25 * math.cos(a), 15.0 + 1.25 * math.sin(a), 0.17, 0.09, LIGHT)
# rua
d.line(v.X(-1.0), v.Y(-3.85), v.X(28.0), v.Y(-3.85), 0.13, GREY, dash=(3.2, 1.4))
d.text(v.X(14), v.Y(-3.85) - 4.2, 'RUA PROJETADA', 2.6, col=GREY, align='center')
# projeção da cobertura sobre o embarque
PROJ = (5, 1.1, 0.5, 1.1, 0.5, 1.1)
for a, b in (((11, -0), (11, -3.5)), ((11, -3.5), (17, -3.5)), ((17, -3.5), (17, 0))):
    d.line(v.X(a[0]), v.Y(a[1]), v.X(b[0]), v.Y(b[1]), 0.18, INK, dash=PROJ)
# louças e mobiliário
def draw_fx(f):
    k, (x0, y0, x1, y1) = f['kind'], f['box']
    if k == 'mob': v.rectm(x0, y0, x1, y1, 0.13, FURN)
    elif k == 'stool': v.circlem(*f['c'], f['r'], 0.13, FURN)
    elif k == 'shelf':
        v.rectm(x0, y0, x1, y1, 0.13, FURN); v.linem(x0, y0, x1, y1, 0.09, FURN)
    elif k == 'box':
        v.rectm(x0, y0, x1, y1, 0.13, FURN); v.linem(x0, y0, x1, y1, 0.09, FURN); v.linem(x0, y1, x1, y0, 0.09, FURN)
    elif k == 'bench':
        v.rectm(x0, y0, x1, y1, 0.13, SAN)
        for cx, cy in f['sinks']:
            rw, rh = (0.42, 0.3) if (x1 - x0) > (y1 - y0) else (0.3, 0.42)
            d.ellipse(v.X(cx - rw / 2), v.Y(cy - rh / 2), v.X(cx + rw / 2), v.Y(cy + rh / 2), 0.13, SAN)
    elif k == 'maca':
        v.rectm(x0, y0, x1, y1, 0.13, SAN)
        if y1 - y0 > x1 - x0: v.rectm(x0 + 0.07, y1 - 0.42, x1 - 0.07, y1 - 0.07, 0.09, FURN)
    elif k == 'shower':
        v.rectm(x0, y0, x1, y1, 0.13, SAN); v.linem(x0, y0, x1, y1, 0.09, SAN); v.linem(x0, y1, x1, y0, 0.09, SAN)
    elif k == 'wc': v.wc(*f['at'], f['rot'], SAN, 0.13)
    elif k == 'basin': v.basin(*f['at'], f['rot'], SAN, 0.13, f['w'], f['depth'])
    elif k == 'dental':
        d.poly([v.P(x0, y0 + 0.2), v.P(x0 + 0.5, y0), v.P(x1 - 0.05, y0 + 0.12), v.P(x1, (y0 + y1) / 2), v.P(x1 - 0.05, y1 - 0.12), v.P(x0 + 0.5, y1), v.P(x0, y1 - 0.2)], True, 0.13, SAN)
        v.linem(x0 + 0.5, y0, x0 + 0.5, y1, 0.09, SAN)
for f in FX: draw_fx(f)
v.rectm(25.95, 12.33, 26.72, 12.8, 0.13, SAN); v.circlem(26.335, 12.565, 0.19, 0.09, SAN)
# giro nos sanitários PCD maiores
v.circlem(16.87, 7.03, 0.75, 0.13, FURN, dash=(1.4, 1)); v.circlem(19.63, 7.03, 0.75, 0.13, FURN, dash=(1.4, 1))
# barras de apoio junto à bacia
for a in ((18.125, 7.25, 18.125, 7.95), (17.45, 8.075, 18.1, 8.075), (18.375, 7.25, 18.375, 7.95), (18.4, 8.075, 19.05, 8.075),
          (22.625, 7.15, 22.625, 7.85), (22.65, 7.975, 23.3, 7.975), (12.675, 8.95, 12.675, 9.65), (12.0, 9.75, 12.65, 9.75)):
    v.linem(*a, 0.25, SAN)

# ---- paredes, portas, janelas: alvenaria em hachura leve, gesso acartonado em linha dupla, nunca cheias de preto
for x0, y0, x1, y1 in B.region({'ext'}).rects():
    v.hatch([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], 45, 1.5, 0.09, GREY)
v.draw(B, None, lw=0.5)
def pillar(p):
    x0, y0, x1, y1 = pillar_box(p)
    pts = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    v.fill_poly(pts, WHITE)
    for rx0, ry0, rx1, ry1 in ((0, 6.2, 11, 10), (11, 8.2, 12.8, 10)):
        ix0, iy0, ix1, iy1 = max(x0, rx0), max(y0, ry0), min(x1, rx1), min(y1, ry1)
        if ix1 > ix0 and iy1 > iy0: v.fill(ix0, iy0, ix1, iy1, BLUE_TINT)
    v.hatch(pts, 45, 0.8, 0.09, INK); v.hatch(pts, -45, 0.8, 0.09, INK)
    v.rectm(x0, y0, x1, y1, 0.25, INK)
for p in PILLARS: pillar(p)
# contorno do piso GA: é a linha que se contorna, a tinta chega exatamente até ela
d.poly([v.P(*p) for p in GA_POLY], True, 0.4, BLUE, join=0)

# ---- etiquetas
for r in ROOMS: room_tag(r)
for o in OPEN:
    if not o['tag']: continue
    px, py = v.P(*o['pos'])
    d.circle(px, py, 3.5, 0.13, INK, fill=WHITE)
    d.text(px, py - 1.0, o['tag'], 2.0, align='center')
for x, y in ((12.4, 8.6), (17.85, 7.0), (18.65, 7.0), (22.82, 6.55)): access(x, y)
d.text(v.X(17.42), v.Y(2.0), 'BALCÃO', 1.8, align='center', angle=90)
d.text(v.X(25.3), v.Y(12.5), 'AUTOCLAVE', 1.6, align='center')
d.text(v.X(21.5), v.Y(11.72), 'ACESSO RESTRITO', 1.8, align='center')
d.text(v.X(15.4), v.Y(5.58), 'BEBEDOURO', 1.6, align='center')
d.text(v.X(20.85), v.Y(20) + 5.2, 'ACESSO DE SERVIÇO', 2.1, align='right')
for x, y in ((13.45, 5.15), (9.55, 5.2), (20.92, 14.25)): level(x, y, 'N.A. +0,15')
level(12.1, -2.72, 'N.A. +0,13')
tip = v.P(14, -1.98)
d.poly([tip, (tip[0] - 1.6, tip[1] - 3.2), (tip[0] + 1.6, tip[1] - 3.2)], True, 0, fill=INK)
d.text(tip[0], tip[1] - 6.6, 'ACESSO PRINCIPAL', 2.2, True, align='center')
d.text(v.X(14), v.Y(-3.08), 'EMBARQUE E DESEMBARQUE COBERTO', 2.5, True, align='center')
d.text(v.X(14), v.Y(-3.08) - 3.9, f'A: {br(CANOPY_AREA)} m²', 2.2, align='center')
d.text(v.X(7.1), v.Y(18.55), 'ÁREA EXTERNA – PRÁTICAS COLETIVAS E HORTA', 3.0, True, align='center')
d.text(v.X(7.1), v.Y(18.55) - 4.6, 'FORA DA ÁREA CONSTRUÍDA', 2.2, col=GREY, align='center')
d.text(v.X(3.95), v.Y(12.6), 'CANTEIROS', 2.0, col=GREY, align='center')

# ---- eixos de locação: só os que amarram os seis cantos da planta em L
AX = 2.1
v.axis('x', 0, 'A', 10, 20 + AX, 'high', 3.0, 2.6); v.axis('x', 16, 'B', 20, 20 + AX, 'high', 3.0, 2.6); v.axis('x', 27, 'C', 20, 20 + AX, 'high', 3.0, 2.6)
v.axis('y', 0, '1', -AX, 0, 'low', 3.0, 2.6); v.axis('y', 10, '2', -AX, 0, 'low', 3.0, 2.6); v.axis('y', 20, '3', -AX, 16, 'low', 3.0, 2.6)

# ---- cotas: vãos, eixos de parede, total
def chains(side, base, opn, walls, full, offs, avoid=()):
    """avoid: linhas verticais da projeção; a cota que cairia sobre uma delas é deslocada para o lado de fora."""
    labs, moved = [], []
    for a, b in zip(opn, opn[1:]):
        lab, mid = fm(b - a), (a + b) / 2
        half = d.width(lab, 2.5) / 2 + 0.8
        hit = next((x for x in avoid if abs(mid - x) * v.k < half), None)
        if hit is None: labs.append(lab)
        else:
            labs.append(''); moved.append((lab, hit + (1 if hit > W / 2 else -1) * half / v.k))
    v.chain(side, opn, offs[0], base, fm, 2.5, 'tick', labels=labs, col=RED, ext_gap=5.0)
    for lab, cx in moved: d.text(v.X(cx), v.Y(base) - offs[0] + 0.7, lab, 2.5, col=RED, align='center')
    v.chain(side, walls, offs[1], base, fm, 2.5, 'tick', col=RED, ext_from=offs[0] + 4)
    if full: v.chain(side, full, offs[2], base, fm, 2.8, 'tick', col=RED, ext_from=offs[1] + 4)
def xs(pred): return sorted({round(v_, 6) for r in ROOMS if pred(r) for v_ in (r[2], r[2] + r[4])})
def ys(pred): return sorted({round(v_, 6) for r in ROOMS if pred(r) for v_ in (r[3], r[3] + r[5])})
def top(r): return r[3] + r[5]
def right(r): return r[2] + r[4]
OFF_S, OFF_W, OFF_E, OFF_T, OFF_IN = (20, 28, 36), (24, 32, 40), (24, 31, 38), (24, 32, 40), (13, 20, 0)
chains('b', 0, facade_stops('S', 0, 27), xs(lambda r: r[3] == 0), [0, 27], OFF_S, avoid=(CANOPY[0], CANOPY[2]))
chains('l', 0, facade_stops('W', 0, 10), ys(lambda r: r[2] == 0), [0, 10, 20], OFF_W)
chains('r', 27, facade_stops('E', 0, 20), ys(lambda r: abs(right(r) - 27) < 1e-9), [0, 20], OFF_E)
chains('t', 20, facade_stops('N2', 16, 27), xs(lambda r: abs(top(r) - 20) < 1e-9), [0, 16, 27], OFF_T)
chains('t', 10, facade_stops('N1', 0, 16), xs(lambda r: abs(top(r) - 10) < 1e-9 and right(r) <= 16), None, OFF_IN)
chains('l', 16, facade_stops('G', 10, 20), ys(lambda r: r[2] == 16 and r[3] >= 10), None, OFF_IN)

# ---- título da vista
tx0 = OX + 12
d.circle(OX + 5, 66, 5, 0.25); d.text(OX + 5, 64.1, '1', 3.8, True, align='center')
ttl = 'PLANTA BAIXA – TÉRREO'
d.text(tx0, 65.2, ttl, 5.0, True)
d.line(tx0, 63.7, tx0 + d.width(ttl, 5.0, True), 63.7, 0.35)
d.text(tx0, 58.8, 'ESCALA 1:50', 3.2)
d.north(v.X(13.25), v.Y(17.85), 15, 'circle', 'N', -14, 3.4)

# ---- coluna direita: carimbo no canto inferior, escala gráfica e quadro empilhados sobre ele
CX, CW = 655, 176
d.line(CX, 10, CX, 584, 0.35)
LX, LW = CX + 3, CW - 6
TB_H = 76
d.rect(CX, 10, CW, TB_H, 0.35)
yy = 10 + TB_H
def row(fields, h_):
    global yy
    yy -= h_; xx = CX
    for w_, lab, val, vh, bold in fields:
        d.field(xx, yy, w_, h_, lab, val, 1.5, vh, bold); xx += w_
row([(CW, 'TÍTULO DO PROJETO', 'UBS RIBEIRÃO DAS QUARESMEIRAS – PORTE I', 3.5, True)], 13)
OWNER = 'PREFEITURA MUNICIPAL DE RIBEIRÃO DAS QUARESMEIRAS (FICTÍCIA) – SECRETARIA MUNICIPAL DE SAÚDE'
assert d.width(OWNER, 1.95) < CW - 2.4, d.width(OWNER, 1.95)
row([(CW, 'PROPRIETÁRIO', OWNER, 1.95, False)], 10)
row([(CW, 'ENDEREÇO', 'RUA PROJETADA, S/Nº – MUNICÍPIO FICTÍCIO', 2.2, False)], 9)
row([(CW * 0.46, 'EMPRESA', 'POLYPDF – MATERIAL DE TREINAMENTO', 1.9, False), (CW * 0.54, 'AUTOR DO PROJETO / RESPONSÁVEL TÉCNICO', 'NÃO SE APLICA – PRANCHA DE EXERCÍCIO', 1.9, False)], 10)
row([(CW * 0.6, 'TÍTULO DA PRANCHA', 'PLANTA BAIXA – TÉRREO', 3.0, True), (CW * 0.4, 'DESCRIÇÃO DA ETAPA', 'ANTEPROJETO', 2.4, False)], 12)
row([(CW * 0.52, 'NOME: PRANCHA – ARQUIVO', 'UBS-RQ_AP_AQ 01.01_R00', 2.6, True), (CW * 0.14, 'REVISÃO', 'R00', 2.4, False), (CW * 0.14, 'UNIDADE', 'METROS', 2.0, False), (CW * 0.2, 'DATA', '06/11/2026', 2.2, False)], 11)
row([(CW * 0.52, 'ESCALA', '1:50', 3.0, True), (CW * 0.48, 'FOLHA', 'A1 – 84,10 x 59,40', 2.4, False)], 11)
assert abs(yy - 10) < 1e-6, yy
# escala gráfica
SB_Y0 = 10 + TB_H
d.line(CX, SB_Y0 + 20, CX + CW, SB_Y0 + 20, 0.25)
d.text(LX, SB_Y0 + 14.8, 'ESCALA GRÁFICA', 2.8, True)
d.text(LX, SB_Y0 + 9.2, '1:50', 2.4)
BAR_X, BAR_Y = CX + 56, SB_Y0 + 10
d.scale_bar(BAR_X, BAR_Y, 5, 20, [0, 0.2, 0.4, 0.6, 0.8, 1, 2, 3, 4, 5], ['0', '', '', '', '', '1', '2', '3', '4', '5 m'], 2.2, 2.4)
y = SB_Y0 + 20
# quadro de áreas, de baixo para cima
NOTE_Q = 'ÁREAS MEDIDAS PELAS LINHAS DE COTA, SEM DESCONTO DE PAREDES.\nEMBARQUE E DESEMBARQUE COBERTO E ÁREA EXTERNA FICAM FORA DO QUADRO.'
note_lines = d.wrap(NOTE_Q, LW, 1.9)
y += 3.2 + len(note_lines) * 1.9 * 1.62
ynote_top = y
QRH, QH = 4.7, 2.2
rows = [['Nº', 'AMBIENTE', 'PISO', 'ÁREA (m²)']]
for r in ROOMS: rows.append([r[0], r[1], r[6], br(area(r))])
n = len(rows)
rows += [['', 'SUBTOTAL PISO GB', None, None, br(BYFLOOR['GB'])], ['', 'SUBTOTAL PISO GA', None, None, br(BYFLOOR['GA'])], ['', 'SUBTOTAL PISO GS', None, None, br(BYFLOOR['GS'])], ['', 'ÁREA CONSTRUÍDA TOTAL', None, None, br(GROSS)]]
rows = [(list(r) if len(r) == 4 else [r[0], r[1], None, r[4]]) for r in rows]
ytop_q = y + len(rows) * QRH
d.table(LX, ytop_q, [11, 120, 12, 27], rows, QH, QRH, aligns=['left', 'left', 'left', 'right'], bold_rows={n + 3})
d.para(LX, ynote_top - 1.5, LW, NOTE_Q, 1.9, lead=1.62)
d.text(LX, ytop_q + 2.0, 'QUADRO DE ÁREAS', 3.0, True)
y = ytop_q + 8.5
# acabamentos de piso
FIN = [('GB', 'GRANILITE BEGE CLARO POLIDO + RODAPÉ MEIA-CANA 10 cm'), ('GA', 'GRANILITE AZUL POLIDO + RODAPÉ MEIA-CANA 10 cm'), ('GS', 'GRANILITE BEGE CLARO SEM POLIMENTO')]
for k, name in reversed(FIN):
    finish_circle(LX + 3, y + 2.2, 2.4, k, 1.8)
    d.text(LX + 8, y + 1.3, name, 2.1)
    y += 5.8
d.text(LX, y + 0.8, 'ACABAMENTOS DE PISO', 3.0, True)
y += 8.5
# quadro de esquadrias
EQ = [('P1', 'PORTA DE ABRIR, UMA FOLHA', '0,90 x 2,10'), ('P2', 'PORTA DE ABRIR, UMA FOLHA', '1,10 x 2,10'), ('P3', 'PORTA DE ABRIR, UMA FOLHA', '0,80 x 2,10'),
      ('P4', 'PORTA DE ABRIR, DUAS FOLHAS', '1,60 x 2,10'), ('P5', 'PORTA EXTERNA DE SERVIÇO', '1,00 x 2,10'),
      ('J1', 'JANELA DE CORRER', '2,00 x 1,20 / 0,90'), ('J2', 'JANELA DE CORRER', '1,20 x 1,20 / 0,90'), ('J3', 'JANELA MAXIM-AR', '0,60 x 0,60 / 1,50'),
      ('G1', 'GUICHÊ EXTERNO', '0,70 x 1,20 / 0,90'), ('G2', 'GUICHÊ INTERNO', '0,80 x 0,80 / 0,90'), ('B1', 'ABERTURA DE BALCÃO', '2,40 x 1,20 / 0,90')]
for tag, _, dim in EQ:                                 # o quadro acompanha a largura desenhada
    assert dim.startswith(br(SIZE[tag])), (tag, dim)
assert {tag for tag, _, _ in EQ} == set(COUNT), set(COUNT)   # nenhum vão desenhado fica fora do quadro
rows = [['TIPO', 'DESCRIÇÃO', 'LARGURA x ALTURA / PEITORIL', 'QTD.']] + [[tag, ds, dim, str(COUNT[tag])] for tag, ds, dim in EQ]
ytop_e = y + len(rows) * QRH
d.table(LX, ytop_e, [12, 74, 66, 18], rows, QH, QRH, aligns=['left', 'left', 'left', 'right'])
d.text(LX, ytop_e + 2.0, 'QUADRO DE ESQUADRIAS', 3.0, True)
y = ytop_e + 8.5
# convenções
SW = 13
def conv(col, draw, label):
    x = LX + col * (LW / 2)
    draw(x, y); d.text(x + SW + 2.5, y + 0.8, label, 1.9)
CONV_ROWS = [
 [(lambda x, yy_: (d.rect(x, yy_, SW, 3.4, 0.4), d.hatch([(x, yy_), (x + SW, yy_), (x + SW, yy_ + 3.4), (x, yy_ + 3.4)], 45, 1.5, 0.09, GREY)), f'ALVENARIA DE BLOCO CERÂMICO, E = {br(E)}'),
  (lambda x, yy_: d.rect(x, yy_ + 0.3, SW, 2.8, 0.4), f'GESSO ACARTONADO, E = {br(T)}')],
 [(lambda x, yy_: (d.hatch([(x + 3, yy_), (x + 10, yy_), (x + 10, yy_ + 3.4), (x + 3, yy_ + 3.4)], 45, 0.8, 0.09, INK), d.hatch([(x + 3, yy_), (x + 10, yy_), (x + 10, yy_ + 3.4), (x + 3, yy_ + 3.4)], -45, 0.8, 0.09, INK), d.rect(x + 3, yy_, 7, 3.4, 0.25)), 'PILAR DE CONCRETO, POSIÇÃO INDICATIVA'),
  (lambda x, yy_: d.line(x, yy_ + 1.7, x + SW, yy_ + 1.7, 0.13, INK, (6, 1.2, 1, 1.2)), 'EIXO DE LOCAÇÃO')],
 [(lambda x, yy_: d.line(x, yy_ + 1.7, x + SW, yy_ + 1.7, 0.18, INK, PROJ), 'PROJEÇÃO DA COBERTURA'),
  (lambda x, yy_: d.circle(x + 6.5, yy_ + 1.7, 2.6, 0.13, FURN, dash=(1.1, 0.8)), 'ÁREA DE MANOBRA Ø 1,50')],
 [(lambda x, yy_: d.rect(x, yy_, SW, 3.4, 0.4, BLUE, fill=BLUE_TINT), 'PISO GA, COM O CONTORNO DE MEDIÇÃO'),
  (lambda x, yy_: d.text(x + 6.5, yy_ + 0.6, 'N.A.', 2.2, True, align='center'), 'NÍVEL ACABADO')],
]
for rw in reversed(CONV_ROWS):
    for col, (fn, lab) in enumerate(rw): conv(col, fn, lab)
    y += 6.0
d.text(LX, y + 0.8, 'CONVENÇÕES ADOTADAS', 3.0, True)
y_conv_top = y + 4.5

# ---- topo da coluna: carimbo de exercício, exercício, notas
yt = 584 - 4
ST_H = 27
d.rect(LX, yt - ST_H, LW, ST_H, 0.6, RED)
d.text(LX + LW / 2, yt - 8.2, 'PRANCHA DE EXERCÍCIO', 5.0, True, RED, 'center')
d.text(LX + LW / 2, yt - 15.0, 'PROJETO FICTÍCIO', 3.6, True, RED, 'center')
d.text(LX + LW / 2, yt - 21.8, 'NÃO USAR PARA EXECUÇÃO DE OBRA', 3.6, True, RED, 'center')
yt -= ST_H + 1.6
yt = d.para(LX, yt, LW, 'NENHUM PROFISSIONAL NO BRASIL REVISOU ESTA PRANCHA.', 2.3, lead=1.4) - 7.5
d.text(LX, yt, 'EXERCÍCIO', 3.6, True)
yt -= 3.6
STEPS = [f'1. CALIBRE NA ESCALA GRÁFICA, DE 0 A 5 m: 5,00 m.\nDEPOIS DA CALIBRAÇÃO, SÃO TRÊS MEDIÇÕES:',
         f'2. CONFIRA A LARGURA TOTAL NA COTA EXTERNA INFERIOR,\nENTRE OS EIXOS A E C: {br(W)} m.',
         f'3. CONTORNE A FACE EXTERNA DA PLANTA EM L, SEIS CANTOS:\nÁREA CONSTRUÍDA = {br(GROSS)} m².',
         f'4. CONTORNE O PISO GA PELA LINHA AZUL, SEIS CANTOS:\nPISO GA = {br(BYFLOOR["GA"])} m².']
for s_ in STEPS:
    yt = d.para(LX, yt, LW, s_, 2.9, lead=1.62) - 2.4
yt -= 1.2
OUTDOOR = (16 - 0) * (20 - 10)
assert abs(BBOX - OUTDOOR - GROSS) < 1e-6
yt = d.para(LX, yt, LW, f'A PLANTA É EM L: {br(W)} x {br(D)} = {br(BBOX)} m² É O RETÂNGULO\nENVOLVENTE, NÃO A ÁREA CONSTRUÍDA. DESCONTADA A ÁREA\nEXTERNA (16,00 x 10,00 = {br(OUTDOOR)} m²), RESTAM {br(GROSS)} m².', 2.8, True, lead=1.62) - 8
d.text(LX, yt, 'NOTAS', 3.0, True)
yt -= 3.2
NOTES = ['COTAS E NÍVEIS EM METROS. N.A. = NÍVEL ACABADO.',
         'AMBIENTES SEM FACHADA (' + ', '.join(NO_FACADE[:-1]) + ' E ' + NO_FACADE[-1] + '): RENOVAÇÃO MECÂNICA DE AR.',
         'CIRCULAÇÃO 03: PACIENTES ATÉ O CONSULTÓRIO ODONTOLÓGICO; ALÉM DA PORTA, SÓ FUNCIONÁRIOS.',
         'LOUÇAS E MOBILIÁRIO APENAS INDICATIVOS.']
for s in NOTES:
    yt = d.para(LX, yt, LW, s, 2.1, lead=1.62) - 1.8
assert yt > y_conv_top + 2, (yt, y_conv_top)

# ---- fatos de medição
SOUTH_CHAIN_Y = v.Y(0) - OFF_S[2]
d.expect('calibrate', p0=(BAR_X, BAR_Y), p1=(BAR_X + 100, BAR_Y), metres=5.0, note='ESCALA GRÁFICA 0 to 5 m, directly above the carimbo')
d.expect('check', p0=(v.X(0), SOUTH_CHAIN_Y), p1=(v.X(27), SOUTH_CHAIN_Y), metres=W, note='outer chain under the plan, axes A to C')
d.expect('check_depth', p0=(v.X(27) + OFF_E[2], v.Y(0)), p1=(v.X(27) + OFF_E[2], v.Y(20)), metres=D, note='spare: outer chain east side')
d.expect('gross', pts=[v.P(*p) for p in FOOT], sqm=round(GROSS, 6), perimeter=poly_perimeter(FOOT), note='outer face of the L, six corners; ÁREA CONSTRUÍDA TOTAL')
d.expect('floor', pts=[v.P(*p) for p in GA_POLY], sqm=round(poly_area(GA_POLY), 6), perimeter=poly_perimeter(GA_POLY), note='blue outline of GRANILITE AZUL POLIDO, rooms 11 to 15; SUBTOTAL PISO GA')
d.text(CX + 3, 3.5, 'PolyPDF', 1.9, col=GREY, track=False)
d.save()
