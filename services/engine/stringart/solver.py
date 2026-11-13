"""Algorithme glouton de sélection des fils.

À chaque étape, depuis le clou courant, on choisit le segment qui couvre en
moyenne le plus de « noirceur restante », on retire sa contribution, puis on
recommence. Le résultat est déterministe : mêmes entrées -> même séquence.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass

import numpy as np

from .lines import LineCache


@dataclass(frozen=True)
class SolverParams:
    max_lines: int = 3500
    line_weight: float = 0.13      # noirceur retirée par passage (≈ largeur du fil / taille du pixel)
    min_gap: int = 20              # écart minimal (en clous) entre départ et arrivée
    tabu: int = 3                  # nombre de derniers clous interdits
    start_nail: int = 0            # A1
    min_score: float = 0.0         # arrêt si plus aucune amélioration
    light_penalty: float = 0.2     # coût d'un fil sur une zone claire (réduit le « voile »)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class SolverResult:
    sequence: list[int]            # clous visités, len = nb_fils + 1
    scores: list[float]
    stopped_early: bool


def solve(target: np.ndarray, importance: np.ndarray, cache: LineCache, params: SolverParams = SolverParams()) -> SolverResult:
    n = cache.geometry.nail_count
    imp = importance.astype(np.float32).ravel()
    # Résidu pondéré : importance x (noirceur restante). Une zone claire part
    # d'un résidu négatif si light_penalty > 0 : y passer coûte des points.
    lightness = np.clip(1.0 - target, 0, 1).astype(np.float32).ravel()
    residual = imp * (target.astype(np.float32).ravel() - params.light_penalty * lightness**2)
    used = np.zeros((n, n), dtype=bool)
    gap_ok = np.array(
        [[cache.geometry.circular_distance(a, b) >= params.min_gap for b in range(n)] for a in range(n)]
    )

    current = params.start_nail
    sequence = [current]
    scores: list[float] = []
    stopped_early = False

    for _ in range(params.max_lines):
        fan = cache.fans[current]
        sums = np.add.reduceat(residual[fan.pixels], fan.starts)
        score = sums / fan.lengths
        allowed = gap_ok[current, fan.others] & ~used[current, fan.others]
        if params.tabu:
            allowed &= ~np.isin(fan.others, sequence[-params.tabu - 1 :])
        score = np.where(allowed, score, -np.inf)
        k = int(np.argmax(score))
        best = float(score[k])
        if not np.isfinite(best) or best <= params.min_score:
            stopped_early = True
            break
        nxt = int(fan.others[k])
        seg = cache.segment(current, nxt)
        residual[seg] -= params.line_weight
        used[current, nxt] = used[nxt, current] = True
        sequence.append(nxt)
        scores.append(best)
        current = nxt

    return SolverResult(sequence, scores, stopped_early)
