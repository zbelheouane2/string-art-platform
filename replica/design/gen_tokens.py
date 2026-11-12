"""Génère tokens.css (variables CSS) et tailwind.theme.cjs depuis tokens.json.
Usage : python3 gen_tokens.py  (écrit aussi apps/web/src/styles/tokens.css)"""
import json, pathlib
here = pathlib.Path(__file__).parent
t = json.loads((here / "tokens.json").read_text())
L = ["/* Généré par replica/design/gen_tokens.py depuis tokens.json. Ne pas modifier à la main. */", ":root {"]
for k, v in t["color"].items(): L.append(f"  --color-{k}: {v};")
for k in ("display", "sans"): L.append(f"  --font-{k}: var(--font-dm-{'serif' if k == 'display' else 'sans'}), {t['font'][k]};")
for k, v in t["type"].items():
    L.append(f"  --text-{k}: {v['size']/16:g}rem;")
    L.append(f"  --leading-{k}: {v['line']/v['size']:.3f};")
for i, v in enumerate(t["space"]): L.append(f"  --space-{i}: {v/16:g}rem;")
for k, v in t["radius"].items(): L.append(f"  --radius-{k}: {v if isinstance(v, str) else f'{v}px'};")
for k, v in t["shadow"].items(): L.append(f"  --shadow-{k}: {v};")
for k, v in t["motion"].items(): L.append(f"  --motion-{k}: {v};")
lay = t["layout"]
L += [f"  --layout-max: {lay['max']/16:g}rem;", f"  --layout-header: {lay['header']}px;",
      f"  --control-height: {t['control']['button-height']/16:g}rem;", f"  --control-pad-x: {t['control']['button-pad-x']/16:g}rem;",
      f"  --border-outline: {t['border-width']['outline-button']};", "}", "",
      ":root:lang(ar) {", "  --font-display: var(--font-naskh), " + t["font"]["display-ar"] + ";",
      "  --font-sans: var(--font-alexandria), " + t["font"]["sans-ar"] + ";", "}", ""]
css = "\n".join(L)
(here / "tokens.css").write_text(css)
(here.parent.parent / "apps/web/src/styles/tokens.css").write_text(css)
theme = {
  "colors": {k: f"var(--color-{k})" for k in t["color"]},
  "fontFamily": {"display": "var(--font-display)", "sans": "var(--font-sans)"},
  "fontSize": {k: [f"var(--text-{k})", {"lineHeight": f"var(--leading-{k})"}] for k in t["type"]},
  "borderRadius": {k: f"var(--radius-{k})" for k in t["radius"]},
  "boxShadow": {k: f"var(--shadow-{k})" for k in t["shadow"]},
  "maxWidth": {"layout": "var(--layout-max)"},
}
(here / "tailwind.theme.cjs").write_text("// Correspondance Tailwind (si Tailwind est adopté un jour) : classes bg-surface, text-text-muted, etc.\nmodule.exports = { theme: { extend: " + json.dumps(theme, indent=2) + " } };\n")
print("ok", len(L), "lignes")
