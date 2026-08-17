/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */
import {App, Button, Spin} from "antd";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {getPlayerFinal, submitFinalAnswer, type FinalResponse} from "../api";
import {executePlayerMutation} from "../playerData";
import type {SupportedLanguage} from "../types";
import {normalizeFinalAnswerInput} from "./teamV2FinalInput";
import "./TeamV2FinalChallenge.css";

function remaining(nextAttemptAt: string | null) {
  return nextAttemptAt ? Math.max(0, Math.ceil((new Date(nextAttemptAt).getTime() - Date.now()) / 1000)) : 0;
}

export function TeamV2FinalChallenge({language}: {language: SupportedLanguage}) {
  const {message} = App.useApp();
  const {t} = useTranslation();
  const [final, setFinal] = useState<FinalResponse | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tick, setTick] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement | null>(null);
  const refresh = useCallback(async () => setFinal(await getPlayerFinal()), []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { const timer = window.setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    setAnswer((current) => normalizeFinalAnswerInput(current, final?.answerLength ?? 0));
  }, [final?.answerLength]);

  const cooldown = useMemo(() => { void tick; return remaining(final?.nextAttemptAt ?? null); }, [final?.nextAttemptAt, tick]);
  const answerLength = final?.answerLength ?? 0;
  const chars = useMemo(() => Array.from(answer), [answer]);
  const slots = useMemo(
    () => Array.from({length: answerLength}, (_, index) => chars[index] ?? ""),
    [answerLength, chars],
  );
  const canSubmit = Boolean(final?.canSubmit && cooldown === 0 && answerLength > 0 && chars.length === answerLength && !submitting);
  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const {result} = await executePlayerMutation(() => submitFinalAnswer(answer), language);
      await refresh();
      if (result.isCorrect) message.success(t("final.acceptedMessage"));
      else { setAnswer(""); message.warning(t("final.wrongMessage")); window.setTimeout(() => inputRef.current?.focus(), 0); }
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
    <div className="team-v2-final-grid" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        className="team-v2-final-capture"
        value={answer}
        maxLength={answerLength}
        disabled={cooldown > 0 || submitting}
        aria-label={t("final.yourAnswer")}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => setAnswer(normalizeFinalAnswerInput(event.target.value, answerLength))}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void submit();
          }
        }}
      />
      <div className="team-v2-final-slots" aria-hidden="true">
        {slots.map((char, index) => (
          <span
            key={index}
            className={char ? `team-v2-final-slot is-filled${char === " " ? " is-space" : ""}` : "team-v2-final-slot"}>
            {char === " " ? "" : char}
          </span>
        ))}
      </div>
    </div>
    <Button type="primary" size="large" onClick={() => void submit()} loading={submitting} disabled={!canSubmit}>{t("final.submit")}</Button>
  </section>;
}
