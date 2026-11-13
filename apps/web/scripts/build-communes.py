"""Régénère src/config/communes.json (communes par wilaya, noms FR et AR).

  python scripts/build-communes.py correspondance_IdCommune.csv algeria_cities.json communes.json

- correspondance_IdCommune.csv : github.com/oussamidat/algerie-decoupage-administratif
  (dossier controle/, ODbL 1.0) : communes et wilaya 2026 (préfixe de IdCommune).
- algeria_cities.json : github.com/othmanus/algeria-cities : noms arabes,
  associés par ressemblance du nom latin dans la même wilaya d'origine.
Les noms arabes non trouvés sont listés et complétés dans MANUAL_AR.
"""
import itertools, csv, json, re, unicodedata, sys, collections, difflib
corr = list(csv.DictReader(open(sys.argv[1], encoding="utf-8-sig")))
oth = json.load(open(sys.argv[2]))
def norm(s):
    s = unicodedata.normalize("NFD", s); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower().replace("'", "").replace("-", " ")
    s = re.sub(r"\b(el|ei|al|ait|beni|ouled|sidi|ain)\b", lambda m: m.group(0)[0], s); s = re.sub(r"[^a-z]", "", s)
    for a,b in [("ou","u"),("ch","sh"),("dj","j"),("ee","i"),("y","i"),("th","t"),("gh","g"),("kh","k"),("q","k"),("e","")]: s = s.replace(a,b)
    return s
byw = collections.defaultdict(list)
for o in oth: byw[o["wilaya_code"]].append(o)
res = {}
for w19, rows in itertools.groupby(sorted(corr, key=lambda r: r["IdCommune_ancien"].split("_")[0]), key=lambda r: r["IdCommune_ancien"].split("_")[0]):
    rows = list(rows); pool = list(byw[w19]); used = set()
    scored = []
    for i, r in enumerate(rows):
        for j, o in enumerate(pool):
            scored.append((difflib.SequenceMatcher(None, norm(r["LbCommune"]), norm(o["commune_name_ascii"])).ratio(), i, j))
    scored.sort(reverse=True); done = set()
    for sc, i, j in scored:
        if i in done or j in used or sc < 0.6: continue
        done.add(i); used.add(j); res[rows[i]["IdCommune"]] = (pool[j]["commune_name"], sc, pool[j]["commune_name_ascii"])
out=[]; low=[]
for r in corr:
    m = res.get(r["IdCommune"])
    out.append({"w": r["IdCommune"].split("_")[0], "fr": r["LbCommune"].strip(), "ar": m[0] if m else None})
    if not m or m[1] < 0.8: low.append((r["LbCommune"], m and m[2], m and round(m[1],2)))
print("sans arabe", sum(1 for o in out if not o["ar"]), "faibles", len(low), file=sys.stderr)
for l in low: print(l, file=sys.stderr)
MANUAL_AR = {"Beni Hocine": "بني حسين", "Deux Bassins": "الحوضين", "Mansoura": "المنصورة", "Tabelbala": "تبلبالة"}
grouped = collections.defaultdict(list)
for x in out:
    fr = x["fr"].title() if x["fr"].isupper() else x["fr"]
    grouped[x["w"]].append([fr, x["ar"] or MANUAL_AR[x["fr"]]])
def sort_key(e):
    return unicodedata.normalize("NFD", e[0]).encode("ascii", "ignore").decode().lower()
json.dump({k: sorted(v, key=sort_key) for k, v in sorted(grouped.items())}, open(sys.argv[3], "w"), ensure_ascii=False, separators=(",", ":"))
