import { AutoCarousel } from "./AutoCarousel";

export interface EngineStep {
  key: string;
  title: string;
  text: string;
  /** Capture d'écran du site DeeKra (scripts/make-generator-shots.cjs). */
  img: string;
}

/**
 * Les 5 étapes du générateur, écrans du vrai site dans un téléphone.
 * Ordinateur : les 5 téléphones sur une ligne. Téléphone : carrousel qui défile seul.
 */
export function EngineCarousel({ steps, labels }: { steps: EngineStep[]; labels: { title: string; step: string } }) {
  return (
    <AutoCarousel className="engine-carousel" label={labels.title} itemLabels={steps.map((_, i) => `${labels.step} ${i + 1} / ${steps.length}`)}>
      {steps.map((s, i) => (
        <div key={s.key} className="engine-card">
          <div className="phone">
            <img src={s.img} alt="" loading="lazy" width={390} height={844} />
          </div>
          <span className="engine-num" aria-hidden="true">
            {i + 1}
          </span>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </div>
      ))}
    </AutoCarousel>
  );
}
