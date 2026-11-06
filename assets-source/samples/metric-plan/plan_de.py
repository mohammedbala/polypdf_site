#!/usr/bin/env python3
"""Germany: Dorfgemeinschaftshaus, A2 landscape, M 1:100. A fictional municipal village hall on octametric dimensions."""
import sys
from pathlib import Path
from draftkit import *

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'out'); OUT.mkdir(exist_ok=True)
RED_EXT, RED_INT = '#b5533f', '#cf8a78'    # muted brick reds, as on real plans for new masonry
TINT = {'B1': '#efe6d6', 'B2': '#cfdfe6', 'B3': '#e6edf0', 'B4': '#ececec', 'B5': '#d9d9d9', 'B6': '#e7efe3'}
f = fmt_raised(',')
def de(v, p=2): return f'{v:,.{p}f}'.replace(',', 'X').replace('.', ',').replace('X', '.')

# ---- geometry (metres, lower-left outer corner, north up)
W, D = 19.99, 13.24
FOOT = [(0, 0), (W, 0), (W, D), (0, D)]
RECTS = [(7.49, 11.0, 2.5, 2.24), (7.49, 7.99, 5.01, 3.01), (9.99, 11.0, 2.51, 2.24), (12.5, 7.99, 5.0, 2.01), (12.5, 10.0, 2.5, 3.24),
         (15.0, 10.0, 2.5, 3.24), (17.5, 7.99, 2.49, 5.25), (15.0, 0.0, 4.99, 7.99), (12.49, 0.0, 2.51, 3.99), (12.49, 3.99, 2.51, 4.0),
         (0.0, 0.0, 12.49, 7.99), (0.0, 7.99, 4.99, 5.25), (4.99, 11.0, 2.5, 2.24), (4.99, 7.99, 2.5, 3.01)]
assert abs(check_tiling(RECTS, FOOT) - 264.6676) < 1e-6

# number, name, clear width, clear depth, tag x, tag y, kind, floor
ROOMS = [('001', 'Windfang', 2.385, 1.76, 8.68, 12.2, 'VF', 'B5'),
         ('002', 'Foyer', 5.01, 3.01, 11.15, 9.84, 'VF', 'B2'),
         ('003', 'Putzraum', 2.51, 1.76, 11.62, 12.1, 'NUF', 'B3'),
         ('004', 'Flur', 5.00, 2.01, 15.0, 9.0, 'VF', 'B2'),
         ('005', 'WC Damen', 2.385, 2.76, 13.36, 11.6, 'NUF', 'B3'),
         ('006', 'WC Herren', 2.385, 2.76, 16.74, 11.6, 'NUF', 'B3'),
         ('007', 'Technik / HAR', 2.01, 4.885, 18.62, 11.9, 'TF', 'B4'),
         ('008', 'Vereinsraum', 4.51, 7.51, 17.75, 5.6, 'NUF', 'B6'),
         ('009', 'Vereinslager', 2.51, 3.51, 13.62, 3.05, 'NUF', 'B4'),
         ('010', 'Stuhllager', 2.51, 3.885, 14.05, 4.68, 'NUF', 'B4'),
         ('011', 'Saal', 12.01, 7.51, 6.25, 3.75, 'NUF', 'B1'),
         ('012', 'Küche', 4.51, 4.885, 2.75, 10.3, 'NUF', 'B3'),
         ('013', 'Küchenlager', 2.385, 1.76, 6.2, 12.33, 'NUF', 'B3'),
         ('014', 'WC barrierefrei', 2.385, 3.01, 6.18, 8.47, 'NUF', 'B3')]
def area(r): return round(r[2] * r[3] + 1e-9, 2)
NUF = round(sum(area(r) for r in ROOMS if r[6] == 'NUF'), 2); TF = round(sum(area(r) for r in ROOMS if r[6] == 'TF'), 2); VF = round(sum(area(r) for r in ROOMS if r[6] == 'VF'), 2)
NRF = round(NUF + TF + VF, 2); BGF = round(W * D, 2); KGF = round(BGF - NRF, 2)
assert (NUF, TF, VF, NRF, KGF, BGF) == (193.62, 9.82, 29.33, 232.77, 31.90, 264.67), (NUF, TF, VF, NRF, KGF, BGF)
BYFLOOR = {k: round(sum(area(r) for r in ROOMS if r[7] == k), 2) for k in TINT}
assert BYFLOOR == {'B1': 90.20, 'B2': 25.13, 'B3': 50.99, 'B4': 28.38, 'B5': 4.20, 'B6': 33.87}, BYFLOOR

B = Building()
e = 0.365; t = 0.115
for r in ((0, 0, e, D), (W - e, 0, W, D), (0, 0, W, e), (0, D - e, W, D)): B.wall(*r, 'ext')
for r in ((0.365, 7.875, 19.625, 7.99), (12.375, 0.365, 12.49, 7.875), (15.00, 0.365, 15.115, 7.875), (12.49, 3.875, 15.00, 3.99),
          (4.875, 7.99, 4.99, 12.875), (7.375, 7.99, 7.49, 12.875), (4.99, 11.00, 7.375, 11.115), (7.49, 11.00, 12.50, 11.115),
          (9.875, 11.115, 9.99, 12.875), (12.50, 10.00, 12.615, 12.875), (12.615, 10.00, 17.50, 10.115), (15.00, 10.115, 15.115, 12.875),
          (17.50, 7.99, 17.615, 12.875)):
    B.wall(*r, 'int')
S_, N_, W_, E_ = (0, e), (D - e, D), (0, e), (W - e, W)
W1, W8, W11 = (7.875, 7.99), (11.00, 11.115), (10.00, 10.115)
SOUTH_WIN = [1.24, 8.74, 16.24]
for a in SOUTH_WIN: B.window('h', a, 2.51, S_)
B.door('h', 4.99, 2.51, S_, 'both', 1)                # Fenstertür to the terrace, opens inward
B.window('h', 1.74, 1.26, N_); B.window('h', 13.24, 1.01, N_); B.window('h', 15.74, 1.01, N_)
B.door('h', 7.74, 2.01, N_, 'both', 1)                # main entrance opens outward
B.window('v', 2.74, 2.51, W_); B.door('v', 9.24, 1.01, W_, 'a', 1)
B.window('v', 2.74, 2.51, E_); B.door('v', 9.99, 1.01, E_, 'a', -1)
B.door('h', 7.74, 2.01, W8, 'both', -1)               # T1 Windfang-Foyer
B.door('h', 7.615, 1.01, W1, 'b', 1)                  # T2
B.door('h', 9.50, 2.01, W1, 'both', 1)                # T3
B.door('v', 8.74, 1.01, (7.375, 7.49), 'b', 1)        # T4 opens outward, into the Foyer
B.door('h', 10.24, 0.885, W8, 'a', 1)                 # T5
B.door('h', 13.24, 1.01, W11, 'a', 1)                 # T6
B.door('h', 15.74, 1.01, W11, 'b', 1)                 # T7
B.door('v', 8.50, 1.01, (17.50, 17.615), 'a', 1)      # T8
B.door('h', 13.74, 1.01, W1, 'b', -1)                 # T9
B.door('h', 15.74, 1.01, W1, 'b', -1)                 # T10
B.door('v', 5.24, 2.01, (12.375, 12.49), 'both', 1)   # T11 Saal-Stuhllager
B.door('v', 1.24, 1.01, (15.00, 15.115), 'a', -1)     # T12
B.door('h', 3.24, 1.01, W1, 'a', -1)                  # T13
B.door('v', 11.50, 0.885, (4.875, 4.99), 'a', 1)      # T14
B.gap('h', 0.99, 2.01, W1)                            # serving hatch

PW, PH = 594, 420
d = Doc(OUT / 'de.pdf', (PW, PH), 'Übungsplan Dorfgemeinschaftshaus, Grundriss M 1:100',
        subject='Fiktiver Übungsplan für PolyPDF, nicht zur Ausführung', keywords='Übungsplan, Grundriss, BGF')
d.frame(20, 10, 584, 410)
FILLS = {'ext': RED_EXT, 'int': RED_INT}

# ---- view 1: Grundriss
v = View(d, 58, 236, 100)
# light furniture first, so walls and labels sit on top
for x in (1.2, 9.4):
    v.table_chairs(x, 1.72, 2.2, 0.8, 3)
for x in (1.2, 4.6, 9.4):
    v.table_chairs(x, 5.3, 2.2, 0.8, 3)
v.table_chairs(16.2, 1.72, 2.2, 0.8, 3)
v.rectm(0.365, 8.2, 0.965, 9.14, 0.13, LIGHT); v.rectm(0.365, 10.35, 0.965, 12.875, 0.13, LIGHT)   # kitchen run, clear of the delivery door
v.rectm(0.99, 7.99, 3.0, 8.5, 0.13, LIGHT)
v.circlem(0.665, 11.4, 0.2, 0.09, LIGHT); v.circlem(0.665, 10.8, 0.2, 0.09, LIGHT)
v.draw(B, FILLS)
v.rectm(0.99, 7.275, 3.0, 7.875, 0.18, INK)              # Theke on the Saal side
d.text(v.X(1.995), v.Y(7.275) + 1.7, 'Theke', 1.8, align='center')
d.text(v.X(1.995), v.Y(7.99) + 5.6, 'Durchreiche', 1.6, col=GREY, align='center')
v.linem(8.70, 0.365, 8.70, 7.875, 0.25, INK, dash=(2.4, 1.4))
d.text(v.X(8.70) - 0.9, v.Y(1.0), 'mob. Trennwand', 1.8, angle=90)
# accessible WC: movement squares, fixtures
v.rectm(5.72, 8.95, 7.22, 10.45, 0.18, INK, dash=(1.4, 1))
v.wc(4.99, 9.85, 'e'); v.basin(7.375, 10.72, 'w')
v.wc(15.0, 12.35, 'w'); v.basin(13.0, 12.875, 's'); v.wc(15.115, 12.35, 'e'); v.basin(16.75, 12.875, 's')
v.rectm(17.28, 12.15, 17.5, 12.55, 0.13)                  # urinal
for x0, x1, hinge in ((14.05, 15.0, 14.85), (15.115, 16.065, 15.265)):   # WC Kabinen, doors opening out of the cabin
    wall = x0 if hinge > x0 + 0.5 else x1
    v.linem(wall, 11.55, wall, 12.875, 0.18, INK)
    sign = -1 if hinge > x0 + 0.5 else 1
    if sign < 0: v.linem(x0, 11.55, hinge - 0.65, 11.55, 0.18, INK); v.linem(hinge, 11.55, x1, 11.55, 0.18, INK)
    else: v.linem(hinge + 0.65, 11.55, x1, 11.55, 0.18, INK); v.linem(x0, 11.55, hinge, 11.55, 0.18, INK)
    v.linem(hinge, 11.55, hinge, 10.9, 0.18, INK)
    d.arc(v.X(hinge), v.Y(11.55), 6.5, 270, 90 * sign, 0.09)
v.linem(11.0, 10.86, 12.45, 10.86, 0.25, INK)              # coat rail
d.text(v.X(11.725), v.Y(10.86) - 2.4, 'Garderobe', 1.6, align='center')
for n, name, cw, cd, tx, ty, kind, floor in ROOMS:
    small = cw < 2.6 or cd < 2.0
    lines = [(name, 2.0 if small else 2.6, True), (n, 1.7, False), (de(round(cw * cd + 1e-9, 2)) + ' m²', 1.8 if small else 2.0, False), (floor, 1.7, False)]
    if name == 'WC barrierefrei': lines = [('WC barrierefrei', 1.8, True), (n, 1.6, False), (de(round(cw * cd + 1e-9, 2)) + ' m²', 1.7, False), (floor, 1.6, False)]
    if name in ('Küchenlager', 'Putzraum', 'WC Damen', 'WC Herren'): lines = [(name, 1.8, True), (n, 1.6, False), (de(round(cw * cd + 1e-9, 2)) + ' m²', 1.7, False), (floor, 1.6, False)]
    if name == 'Technik / HAR': lines = [('Technik', 2.0, True), ('/ HAR', 2.0, True), (n, 1.7, False), (de(round(cw * cd + 1e-9, 2)) + ' m²', 1.8, False), (floor, 1.7, False)]
    v.tag(tx, ty, lines, lead=1.28)
# opening labels: width over height, sill height
for a in SOUTH_WIN:
    v.size_label(a + 1.255, 0.85, f(2.51), f(1.51), 1.7, [('BRH 88', False), ('5', True)])
v.size_label(6.245, 2.15, f(2.51), f(2.26), 1.7)
d.text(v.X(6.245), v.Y(0) - 3.0, 'zur Terrasse', 1.7, col=GREY, align='center', track=False)
v.size_label(2.37, 12.2, f(1.26), f(1.26), 1.7, [('BRH 1,01', False)])
v.size_label(0.95, 3.995, f(2.51), f(1.51), 1.7, [('BRH 88', False), ('5', True)], angle=90)
v.size_label(18.75, 3.995, f(2.51), f(1.51), 1.7, [('BRH 88', False), ('5', True)], angle=90)
v.size_label(10.505, 7.42, f(2.01), f(2.13), 1.6)                  # T3
v.size_label(8.745, 11.33, f(2.01), f(2.13), 1.5)                # T1
v.size_label(12.02, 6.25, f(2.01), f(2.13), 1.6, None, angle=90) # T11

# entrance arrow
d.text(v.X(7.62), v.Y(D) + 3.0, 'stufenloser Zugang', 1.9, align='right')
d.text(v.X(7.62), v.Y(D) + 5.9, 'Haupteingang', 2.1, True, align='right')
d.poly([(v.X(7.32), v.Y(D) + 0.5), (v.X(7.32) - 0.7, v.Y(D) + 2.3), (v.X(7.32) + 0.7, v.Y(D) + 2.3)], True, 0, fill=INK)   # entrance arrow
v.level(8.65, 9.2, 'OKFF ±0,00', 1.7, 'tri')
v.level(2.1, 3.2, 'OKFF ±0,00', 1.7, 'tri')
# dimension chains, three tiers on every side
OFF = (11, 19, 27)
xS = [0, 1.24, 3.75, 4.99, 7.50, 8.74, 11.25, 12.49, 14.99, 16.24, 18.75, 19.99]
xS_open = [0, 1.24, 3.75, 4.99, 7.50, 8.74, 11.25, 16.24, 18.75, 19.99]
xN_open = [0, 1.74, 3.00, 7.74, 9.75, 13.24, 14.25, 15.74, 16.75, 19.99]
yW_open = [0, 2.74, 5.25, 9.24, 10.25, 13.24]
yE_open = [0, 2.74, 5.25, 9.99, 11.00, 13.24]
xS_room = [0, .365, 12.375, 12.49, 15.0, 15.115, 19.625, 19.99]
xN_room = [0, .365, 4.875, 4.99, 7.375, 7.49, 9.875, 9.99, 12.50, 12.615, 15.0, 15.115, 17.5, 17.615, 19.625, 19.99]
y_room = [0, .365, 7.875, 7.99, 12.875, 13.24]
for side, base, o, r, full in (('b', 0, xS_open, xS_room, W), ('t', D, xN_open, xN_room, W), ('l', 0, yW_open, y_room, D), ('r', W, yE_open, y_room, D)):
    v.chain(side, o, OFF[0], base, f, 1.9, 'tick', text_gap=1.0)
    v.chain(side, r, OFF[1], base, f, 1.9, 'tick', ext_from=OFF[0] + 2, text_gap=1.0)
    v.chain(side, [0, full], OFF[2], base, f, 2.2, 'tick', ext_from=OFF[1] + 2, text_gap=1.0)
d.text(v.X(0), v.Y(0) - 44, 'Grundriss Erdgeschoss', 4.2, True)
d.text(v.X(0) + d.width('Grundriss Erdgeschoss', 4.2, True) + 5, v.Y(0) - 44, 'M 1:100', 3.0)
d.north(v.X(W) + 60, v.Y(D) + 3, 12, 'wedge', 'N', 0, 3.2)

# ---- view 2: Bodenbeläge
u = View(d, 58, 30, 100)
PATCH = {'001': (7.49, 11.115, 9.875, 12.875), '003': (9.99, 11.115, 12.50, 12.875), '005': (12.615, 10.115, 15.0, 12.875), '006': (15.115, 10.115, 17.5, 12.875),
         '007': (17.615, 7.99, 19.625, 12.875), '008': (15.115, 0.365, 19.625, 7.875), '009': (12.49, 0.365, 15.0, 3.875), '010': (12.49, 3.99, 15.0, 7.875),
         '011': (0.365, 0.365, 12.375, 7.875), '012': (0.365, 7.99, 4.875, 12.875), '013': (4.99, 11.115, 7.375, 12.875), '014': (4.99, 7.99, 7.375, 11.0)}
FLOOR = {r[0]: r[7] for r in ROOMS}
for n, (x0, y0, x1, y1) in PATCH.items():
    u.fill(x0, y0, x1, y1, TINT[FLOOR[n]])
B2 = [(7.49, 7.99), (17.50, 7.99), (17.50, 10.00), (12.50, 10.00), (12.50, 11.00), (7.49, 11.00)]
assert abs(poly_area(B2) - 25.1301) < 1e-9
u.fill_poly(B2, TINT['B2'])
u.draw(B, FILLS, doors=False, windows=True)
for key, x, y in (('B1', 6.2, 4.1), ('B2', 10.2, 9.5), ('B2', 15.0, 9.0), ('B3', 2.6, 10.4), ('B3', 6.18, 9.5), ('B3', 13.8, 11.5), ('B3', 16.3, 11.5), ('B3', 6.18, 12.0), ('B3', 11.24, 12.0),
                  ('B4', 18.62, 10.4), ('B4', 13.74, 2.1), ('B4', 13.74, 5.9), ('B5', 8.68, 12.0), ('B6', 17.37, 4.1)):
    u.tag(x, y, [(key, 3.2 if key in ('B1', 'B2', 'B6') else 2.4, True)])
d.text(u.X(0), u.Y(0) - 9, 'Bodenbeläge', 4.2, True)
d.text(u.X(0) + d.width('Bodenbeläge', 4.2, True) + 5, u.Y(0) - 9, 'M 1:100', 3.0)
d.stamp(u.X(W) + 16, u.Y(0) + 54, 'ÜBUNGSPLAN', 3.4)
d.para(u.X(W) + 16, u.Y(0) + 49, 92, 'Fiktives Gebäude. Nicht zur Ausführung.\nVon keiner Fachperson in Deutschland geprüft.', 2.2)

# ---- right column
CX, CW = 399, 185
y = 410
d.line(CX, 10, CX, 410, 0.35)
d.text(CX + 3, y - 7, 'Legende', 3.2, True)
y -= 11
# wall swatches
d.rect(CX + 3, y - 3, 12, 3, 0.25, fill=RED_EXT); d.text(CX + 18, y - 2.6, 'Mauerwerk neu, Außenwand 36,5', 2.0)
d.rect(CX + 100, y - 3, 12, 3, 0.25, fill=RED_INT); d.text(CX + 115, y - 2.6, 'Mauerwerk neu, Innenwand 11,5', 2.0)
y -= 7
d.rect(CX + 3, y - 3, 12, 3, 0.18, dash=(1.4, 1)); d.text(CX + 18, y - 2.6, 'Bewegungsfläche 1,50 x 1,50 m', 2.0)
d.line(CX + 100, y - 1.5, CX + 112, y - 1.5, 0.25, dash=(2.4, 1.4)); d.text(CX + 115, y - 2.6, 'mobile Trennwand', 2.0)
y -= 8
y = d.para(CX + 3, y, CW - 6, 'Maße in m, unter 1 m in cm, ohne Einheit. Rohbaumaße.', 2.0, lead=1.4) - 1.6
d.text(CX + 3, y - 2, [('Hochgestellte Ziffern sind Millimeter: 2,38', False), ('5', True), (' = 2,385 m, 36', False), ('5', True), (' = 36,5 cm.', False)], 2.0)
y -= 5.2
d.text(CX + 3, y - 2, 'Öffnungen: Breite über Höhe. Türen ohne Angabe: 1,01 über 2,13, zweiflügelig 2,01 über 2,13,', 2.0)
y -= 4.4
d.text(CX + 3, y - 2, [('Putzraum und Küchenlager 88', False), ('5', True), (' über 2,13.', False)], 2.0)
y -= 5.2
d.text(CX + 3, y - 2, 'WC-Fenster: 1,01 über 76, BRH 1,51. BRH = Brüstungshöhe. OKFF = Oberkante Fertigfußboden.', 2.0)
y -= 4.4
d.text(CX + 3, y - 2, 'HAR = Hausanschlussraum.', 2.0)
y -= 7
# floor key
rows = [['Belag', 'Bezeichnung', 'Fläche (m²)']]
NAMES = {'B1': 'Industrieparkett Eiche', 'B2': 'Feinsteinzeug, großformatig', 'B3': 'Feinsteinzeug, rutschhemmend', 'B4': 'Estrich, Staubbindeanstrich', 'B5': 'Sauberlaufmatte', 'B6': 'Linoleum'}
for k in TINT: rows.append([k, NAMES[k], de(BYFLOOR[k])])
y0 = y
y = d.table(CX + 3, y, [14, 110, 28], rows, 2.1, 4.7, aligns=['left', 'left', 'right'])
for i, k in enumerate(TINT):
    d.rect(CX + 3 + 156, y0 - 4.7 * (i + 1) - 3.8, 12, 2.8, 0.13, fill=TINT[k])
y -= 6
# area schedule
d.text(CX + 3, y - 3, 'Flächenberechnung (vereinfacht, in Anlehnung an DIN 277)', 2.8, True)
y -= 5.5
rows = [['Nr.', 'Raumbezeichnung', 'Flächenart', 'Belag', 'Lichte Maße (B x T)', 'Fläche (m²)']]
for r in ROOMS:
    rows.append([r[0], r[1], r[6], r[7], [*f(r[2]), (' x ', False), *f(r[3])], de(area(r))])
n = len(rows)
rows += [['', 'Nutzungsfläche (NUF)', None, None, None, de(NUF)], ['', 'Technikfläche (TF)', None, None, None, de(TF)], ['', 'Verkehrsfläche (VF)', None, None, None, de(VF)],
         ['', 'Netto-Raumfläche (NRF)', None, None, None, de(NRF)], ['', 'Konstruktions-Grundfläche (KGF)', None, None, None, de(KGF)], ['', 'Brutto-Grundfläche (BGF)', None, None, None, de(BGF)]]
y = d.table(CX + 3, y, [12, 60, 22, 14, 42, 28.0], rows, 2.1, 4.7, aligns=['left', 'left', 'left', 'left', 'left', 'right'], bold_rows={n + 3, n + 5})
y = d.para(CX + 3, y - 1.8, CW - 6, 'BGF aus den Außenmaßen: 19,99 x 13,24 = 264,67 m². Flächen aus Rohbaumaßen, ohne Putz und Türnischen, vereinfacht.', 1.9, lead=1.35) - 6
# practice panel
d.text(CX + 3, y - 3, 'Übung', 2.8, True)
y -= 6
for line in ('1. Maßstab an der Maßstabsleiste kalibrieren (10 m).', '2. Gesamtbreite prüfen: 19,99 m.', '3. BGF an den Außenkanten umfahren: 264,67 m².',
             '4. Belag B2 (Foyer und Flur) im Plan Bodenbeläge an den Wandinnenkanten umfahren: 25,13 m².'):
    d.text(CX + 3, y - 2.5, line, 2.5); y -= 5.6
# Schriftfeld at the foot of the column, Index directly above it
y1 = 10; rows_h = 11.5; SCALE_H = 20; TB_H = 13 + 4 * rows_h + SCALE_H
d.rect(CX, y1, CW, TB_H, 0.35)
rows = [['Index', 'Datum', 'Änderung', 'gez.'], ['00', '06.11.2026', 'Erstausgabe Übungsplan', 'PP']]
d.table(CX, y1 + TB_H + 9.2, [14, 26, 131, 14], rows, 1.9, 4.6)
yy = y1 + TB_H
def row(fields, h_=rows_h):
    global yy
    yy -= h_
    xx = CX
    for w_, lab, val, vh, bold in fields:
        d.field(xx, yy, w_, h_, lab, val, 1.5, vh, bold)
        xx += w_
row([(CW, 'Bauvorhaben', 'Neubau Dorfgemeinschaftshaus Musterdorf', 3.4, True)], 13)
row([(CW * 0.6, 'Bauort', 'Ortsteil Musterdorf, Stadt Musterstadt (fiktiv)', 2.2, False), (CW * 0.4, 'Bauherr', 'Stadt Musterstadt (fiktiv)', 2.2, False)])
row([(CW * 0.6, 'Planverfasser', 'Beispielbüro (fiktiv)', 2.2, False), (CW * 0.4, 'Planstand', 'Entwurf (Übungsplan)', 2.2, False)])
row([(CW * 0.6, 'Planinhalt', 'Grundriss Erdgeschoss, Bodenbeläge', 2.4, True), (CW * 0.4, 'Höhenbezug', 'OKFF EG ±0,00 = +214,50 m ü. NHN', 1.9, False)])
row([(CW * 0.34, 'Plan-Nr.', '26017-G-001', 3.0, True), (CW * 0.12, 'Index', '00', 2.4, False), (CW * 0.2, 'Blattgröße', 'A2 (594 x 420)', 1.9, False), (CW * 0.14, 'gez.', 'PP', 2.2, False), (CW * 0.2, 'Datum', '06.11.2026', 2.0, False)])
bar_y = y1 + 8
d.text(CX + 1.2, bar_y + 8.8, 'Maßstab', 1.5, col=GREY)
d.text(CX + 4, bar_y + 0.2, 'M 1:100', 3.6, True)
bar_x = CX + 40
d.scale_bar(bar_x, bar_y, 10, 10, [0, 1, 2, 3, 4, 5, 10], ['0', '', '', '', '', '5', '10 m'], 2.0, 2.2)
d.expect('calibrate', p0=(bar_x, bar_y), p1=(bar_x + 100, bar_y), metres=10.0, note='Maßstabsleiste 0 to 10 m')
d.expect('check_width', p0=v.P(0, 0), p1=v.P(W, 0), metres=W, chain_y=v.Y(0) - OFF[2], note='outer chain, south')
d.expect('check_depth', p0=v.P(0, 0), p1=v.P(0, D), metres=D, chain_x=v.X(0) - OFF[2], note='outer chain, west')
d.expect('gross', pts=[v.P(*p) for p in FOOT], sqm=264.6676, perimeter=2 * (W + D), note='outer face')
d.expect('floor', pts=[u.P(*p) for p in B2], sqm=25.1301, perimeter=poly_perimeter(B2), note='B2 Foyer and Flur, lower view')
d.text(CX + 3, 3.5, 'PolyPDF, Übungsblatt. Fiktiv, nicht zur Ausführung.', 1.9, col=GREY, track=False)
d.save()
