"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/** Volume de la musique pendant qu'un clou est annoncé, en part du volume choisi. */
const DUCK_RATIO = 0.2;
const VOLUME_KEY = "dk-guide-music-volume";

type Track = { name: string; url: string };

/** Nom lisible d'un fichier audio : sans extension, tirets et soulignés remplacés par des espaces. */
export function trackName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || fileName;
}

/**
 * Lecteur de musique du guide : le client choisit des morceaux enregistrés sur
 * son téléphone. Les fichiers restent sur l'appareil (lecture locale, rien n'est
 * envoyé). Quand la voix annonce un clou (`ducked`), la musique baisse puis remonte.
 */
export function GuideMusic({ ducked }: { ducked: boolean }) {
  const t = useTranslations("guide");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(VOLUME_KEY));
      if (v > 0 && v <= 1) setVolume(v);
    } catch {
      /* ignoré */
    }
    return () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  // Volume appliqué en douceur : baisse rapide à l'annonce, remontée plus lente.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = ducked ? volume * DUCK_RATIO : volume;
    const stepBy = ducked ? 0.08 : 0.03;
    const timer = window.setInterval(() => {
      const diff = target - audio.volume;
      if (Math.abs(diff) <= stepBy) {
        audio.volume = Math.max(0, Math.min(1, target));
        window.clearInterval(timer);
      } else audio.volume = Math.max(0, Math.min(1, audio.volume + Math.sign(diff) * stepBy));
    }, 30);
    return () => window.clearInterval(timer);
  }, [ducked, volume, tracks.length]);

  const current = tracks[index];

  // Changement de morceau : on charge et on relance si la lecture était en cours.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.src !== current.url) audio.src = current.url;
    if (playing) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [current, playing]);

  const addFiles = (files: FileList | null) => {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("audio/") || /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/i.test(f.name));
    if (!list.length) return;
    const added = list.map((f) => {
      const url = URL.createObjectURL(f);
      urlsRef.current.push(url);
      return { name: trackName(f.name), url };
    });
    setTracks((prev) => [...prev, ...added]);
  };

  const next = () => setIndex((i) => (tracks.length ? (i + 1) % tracks.length : 0));

  const chooseVolume = (v: number) => {
    setVolume(v);
    try {
      localStorage.setItem(VOLUME_KEY, String(v));
    } catch {
      /* ignoré */
    }
  };

  const clear = () => {
    audioRef.current?.pause();
    audioRef.current?.removeAttribute("src");
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    setTracks([]);
    setIndex(0);
    setPlaying(false);
  };

  return (
    <section className="guide-music" aria-labelledby="guide-music-title">
      <h2 id="guide-music-title" className="guide-music-title">
        {t("musicTitle")}
      </h2>
      <audio ref={audioRef} onEnded={next} preload="auto" />
      <input
        ref={inputRef}
        id="guide-music-files"
        className="visually-hidden"
        type="file"
        aria-label={t("musicPick")}
        tabIndex={-1}
        accept="audio/*"
        multiple
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {current ? (
        <>
          <p className="guide-music-now" aria-live="polite">
            <span className="guide-music-count">{t("musicCount", { n: index + 1, total: tracks.length })}</span>
            <span className="guide-music-name">{current.name}</span>
          </p>
          <div className="guide-music-controls">
            <button type="button" className="btn btn-outline" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
              {playing ? t("musicPause") : t("musicPlay")}
            </button>
            <button type="button" className="btn btn-outline" onClick={next} disabled={tracks.length < 2}>
              {t("musicNext")}
            </button>
          </div>
          <label className="field-label" htmlFor="guide-music-volume">
            {t("musicVolume", { v: Math.round(volume * 100) })}
          </label>
          <input
            id="guide-music-volume"
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => chooseVolume(Number(e.target.value))}
          />
          <div className="guide-music-controls">
            <button type="button" className="btn btn-outline" onClick={() => inputRef.current?.click()}>
              {t("musicAdd")}
            </button>
            <button type="button" className="btn btn-outline" onClick={clear}>
              {t("musicClear")}
            </button>
          </div>
        </>
      ) : (
        <button type="button" className="btn btn-outline btn-block" onClick={() => inputRef.current?.click()}>
          {t("musicPick")}
        </button>
      )}
      <p className="field-help">{t("musicNote")}</p>
    </section>
  );
}
