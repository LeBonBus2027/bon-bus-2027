<script lang="ts">
  import type { Reponse, Trajet } from "../lib/calcul";
  import type { Candidat, Question } from "../lib/donnees";
  import type { Passage } from "../lib/revelation";
  import { libelleReponse, mouvements } from "../lib/retroviseur";

  /** Rétroviseur : un curseur pour rejouer le trajet étape par étape (null = arrivée). */
  let { curseur = $bindable(), passages, ordre, reponses, trajets, bus, parId, onRejouer }: {
    curseur: number | null;
    passages: readonly Passage[];
    ordre: readonly string[];
    reponses: Readonly<Record<string, Reponse>>;
    trajets: ReadonlyMap<string, Trajet>;
    bus: readonly Candidat[];
    parId: ReadonlyMap<string, Question>;
    onRejouer: (k: number) => void;
  } = $props();

  const nb = $derived(passages.length);
  const k = $derived(curseur ?? nb);
  const nomCourt = (id: string) => { const n = bus.find(c => c.id === id)?.nom ?? id; return n.slice(n.indexOf(" ") + 1); };
  const pasTexte = (p: number) => `${Math.abs(p)} pas`;

  /** Ce qui s'est passé à l'étape affichée. */
  const texte = $derived.by(() => {
    if (k === 0) return "Départ : tous les bus attendent à la gare.";
    const p = passages[k - 1]!;
    const q = nb === ordre.length ? parId.get(ordre[p.index]!) : undefined;
    const quoi = q ? `« ${q.texte} » Ta réponse : ${libelleReponse(reponses[q.id])}.` : `${p.libelle}.`;
    const m = mouvements(trajets, passages, k);
    const avance = m[0], recule = m.at(-1);
    const bouge = [
      avance && avance.pas > 0 ? `Le bus de ${nomCourt(avance.id)} avance le plus (${pasTexte(avance.pas)}).` : "",
      recule && recule.pas < 0 ? `Celui de ${nomCourt(recule.id)} recule le plus (${pasTexte(recule.pas)}).` : "",
    ].filter(Boolean).join(" ") || "Aucun bus ne bouge.";
    return `Étape ${k} sur ${nb} : ${quoi} ${bouge}`;
  });
</script>

<div class="retroviseur boite">
  <label for="retroviseur" class="etiquette-signal">Rétroviseur : rejoue le trajet</label>
  <div class="curseur">
    <button onclick={() => onRejouer(k - 1)} aria-label="Étape précédente" disabled={k === 0}>◀</button>
    <input id="retroviseur" type="range" min="0" max={nb} step="1" value={k}
      oninput={e => onRejouer(Number(e.currentTarget.value))} aria-valuetext={`Étape ${k} sur ${nb}`} />
    <button onclick={() => onRejouer(k + 1)} aria-label="Étape suivante" disabled={curseur === null || k === nb}>▶</button>
  </div>
  <p aria-live="polite">{texte}</p>
</div>

<style>
  .retroviseur { margin: 4px 0 14px; }
  p { margin: 8px 0 0; }
  .curseur { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
  .curseur input { flex: 1; min-width: 0; height: 44px; accent-color: var(--jaune); }
  .curseur button { width: 48px; padding: 0; flex: none; }
</style>
