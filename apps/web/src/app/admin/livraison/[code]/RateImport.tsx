"use client";

import { useActionState } from "react";
import { WILAYAS } from "@/config/wilayas";
import { applyRateFileAction, previewRateFileAction } from "../../actions";

const name = (zone: string) => WILAYAS.find((w) => w.code === zone)?.fr ?? zone;
const fmt = (v: number | null) => (v === null ? "—" : `${v} DA`);

/** Import en deux temps : aperçu des changements, puis validation. */
export function RateImport({ code }: { code: string }) {
  const [preview, action, pending] = useActionState(previewRateFileAction, null);
  return (
    <div className="a-stack">
      <form action={action} className="a-inline">
        <input type="hidden" name="code" value={code} />
        <label className="visually-hidden" htmlFor="rate-file">
          Fichier de tarifs
        </label>
        <input id="rate-file" name="file" type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required />
        <button type="submit" className="a-btn a-btn-sm" disabled={pending}>
          {pending ? "Lecture…" : "Voir les changements"}
        </button>
      </form>
      {preview && !preview.ok && (
        <div className="a-flash a-flash-error" role="alert">
          <p>Le fichier n&apos;a pas été importé :</p>
          <ul>
            {preview.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {preview?.ok && (
        <div className="a-preview">
          <p>
            <b>{preview.fileName}</b> : {preview.rows.length} wilayas lues, <b>{preview.changes.length} changements</b>, {preview.unchanged} montants identiques.
          </p>
          {preview.changes.length > 0 && (
            <div className="a-table-wrap a-rates">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Wilaya</th>
                    <th>Mode</th>
                    <th>Avant</th>
                    <th>Après</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.changes.map((c) => (
                    <tr key={`${c.zone}-${c.kind}`}>
                      <td>
                        {c.zone} - {name(c.zone)}
                      </td>
                      <td>{c.kind === "home" ? "Domicile" : "Bureau"}</td>
                      <td>{fmt(c.before)}</td>
                      <td>
                        <b>{fmt(c.after)}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <form action={applyRateFileAction}>
            <input type="hidden" name="code" value={code} />
            <input type="hidden" name="fileName" value={preview.fileName} />
            <input type="hidden" name="rows" value={JSON.stringify(preview.rows)} />
            <button type="submit" className="a-btn" disabled={preview.changes.length === 0}>
              Valider l&apos;import
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
