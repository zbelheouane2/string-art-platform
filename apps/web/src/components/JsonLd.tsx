/** Données structurées schema.org dans la page (lues par Google pour les résultats enrichis). */
export function JsonLd({ data }: { data: object }) {
  // « < » échappé : aucun texte ne peut fermer la balise script.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
