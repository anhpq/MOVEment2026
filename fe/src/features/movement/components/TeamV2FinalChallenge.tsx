/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */
import {App, Button, Spin} from "antd";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {getPlayerFinal, submitFinalAnswer, type FinalResponse} from "../api";
import {executePlayerMutation} from "../playerData";
import type {SupportedLanguage} from "../types";
import "./TeamV2FinalChallenge.css";

function remaining(nextAttemptAt: string | null) {
  return nextAttemptAt ? Math.max(0, Math.ceil((new Date(nextAttemptAt).getTime() - Date.now()) / 1000)) : 0;
}

export function TeamV2FinalChallenge({language}: {language: SupportedLanguage}) {
  const {message} = App.useApp();
  const {t} = useTranslation();
  const [final, setFinal] = useState<FinalResponse | null>(null);
  const [chars, setChars] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [tick, setTick] = useState(Date.now());
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const refresh = useCallback(async () => setFinal(await getPlayerFinal()), []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { const timer = window.setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { setChars((current) => final?.answerLength && current.length !== final.answerLength ? Array(final.answerLength).fill("") : current); }, [final?.answerLength]);

  const cooldown = useMemo(() => { void tick; return remaining(final?.nextAttemptAt ?? null); }, [final?.nextAttemptAt, tick]);
  const canSubmit = Boolean(final?.canSubmit && cooldown === 0 && chars.length && chars.every((char) => char !== "") && !submitting);
  const setAt = (index: number, value: string) => setChars((current) => current.map((char, position) => position === index ? value : char));
  const focusFirstEmpty = () => {
    const index = chars.findIndex((char) => char === "");
    inputs.current[index < 0 ? 0 : index]?.focus();
  };
  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const {result} = await executePlayerMutation(() => submitFinalAnswer(chars.join("")), language);
      await refresh();
      if (result.isCorrect) message.success(t("final.acceptedMessage"));
      else { setChars(Array(chars.length).fill("")); message.warning(t("final.wrongMessage")); window.setTimeout(() => inputs.current[0]?.focus(), 0); }
    } catch {
      message.error(t("final.loadFailed"));
      await refresh().catch(() => undefined);
    } finally { setSubmitting(false); }
  };

  if (!final) return <div className="team-v2-final"><Spin /></div>;
  if (final.teamSubmission) return <section className="team-v2-final team-v2-final-success"><span>✦</span><h2>{t("teamV2.finalSuccessTitle")}</h2><p>{t("teamV2.finalSuccessDescription")}</p></section>;
  if (!final.isOpen) return <div className="team-v2-final"><Spin /></div>;

  return <section className="team-v2-final" aria-label={t("nav.final")}>
    <p className="team-v2-final-kicker">{t("nav.final")}</p>
    <h2>{t("teamV2.finalTitle")}</h2>
    {final.wrongAttemptCount > 0 && <p className="team-v2-final-feedback">{cooldown > 0 ? t("final.tryAgain", {seconds: cooldown}) : t("final.canSubmit")}</p>}
    <div className="team-v2-final-grid" onClick={focusFirstEmpty}>
      {chars.map((char, index) => <input key={index} ref={(node) => { inputs.current[index] = node; }} value={char} maxLength={1} disabled={cooldown > 0 || submitting} aria-label={`${t("final.yourAnswer")} ${index + 1}`} className={char === " " ? "is-filled-space" : undefined}
        onChange={(event) => { const value = event.target.value.slice(-1); setAt(index, value === " " ? " " : value.toUpperCase()); if (value && index < chars.length - 1) inputs.current[index + 1]?.focus(); }}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void submit(); } if (event.key === "ArrowLeft" && index > 0) { event.preventDefault(); inputs.current[index - 1]?.focus(); } if (event.key === "ArrowRight" && index < chars.length - 1) { event.preventDefault(); inputs.current[index + 1]?.focus(); } if (event.key === "Backspace" && !chars[index] && index > 0) { inputs.current[index - 1]?.focus(); setAt(index - 1, ""); } }}
        onPaste={(event) => { event.preventDefault(); const pasted = Array.from(event.clipboardData.getData("text").toUpperCase()); setChars((current) => current.map((value, position) => position < index || position >= index + pasted.length ? value : pasted[position - index])); const next = Math.min(chars.length - 1, index + pasted.length); window.setTimeout(() => inputs.current[next]?.focus(), 0); }} />)}
    </div>
    <Button type="primary" size="large" onClick={() => void submit()} loading={submitting} disabled={!canSubmit}>{t("final.submit")}</Button>
  </section>;
}
