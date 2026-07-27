import type {ReactNode} from "react";
import {useTranslation} from "react-i18next";
import {SUPPORTED_LANGUAGES, normalizeLanguage} from "../i18n";
import type {SupportedLanguage} from "../types";

type LanguageSwitchProps = {
  onChange?: (language: SupportedLanguage) => void;
};

function VietnamFlag() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 30 20">
      <rect width="30" height="20" rx="2" fill="#da251d" />
      <path
        d="M15 4.7 16.4 9h4.5l-3.6 2.6 1.4 4.3L15 13.2l-3.7 2.7 1.4-4.3L9.1 9h4.5Z"
        fill="#ffcd00"
      />
    </svg>
  );
}

function EnglishFlag() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 30 20">
      <rect width="30" height="20" rx="2" fill="#012169" />
      <path d="M0 0 30 20M30 0 0 20" stroke="#fff" strokeWidth="3.3" />
      <path d="M0 0 30 20M30 0 0 20" stroke="#c8102e" strokeWidth="1.45" />
      <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="5.4" />
      <path d="M15 0v20M0 10h30" stroke="#c8102e" strokeWidth="2.35" />
    </svg>
  );
}

const LANGUAGE_FLAGS: Record<SupportedLanguage, ReactNode> = {
  vi: <VietnamFlag />,
  en: <EnglishFlag />,
};

export function LanguageSwitch({onChange}: LanguageSwitchProps) {
  const {i18n, t} = useTranslation();
  const language = normalizeLanguage(i18n.language);

  return (
    <div className="language-switch" role="group" aria-label={t("language.switch")}>
      {SUPPORTED_LANGUAGES.map((item) => {
        const isActive = item === language;
        const label = item === "vi" ? "Tiếng Việt" : "English";
        return (
          <button
            key={item}
            type="button"
            className={`language-switch__button${isActive ? " is-active" : ""}`}
            aria-label={label}
            aria-pressed={isActive}
            title={label}
            onClick={() => {
              const nextLanguage = normalizeLanguage(item);
              void i18n.changeLanguage(nextLanguage);
              onChange?.(nextLanguage);
            }}>
            <span className="language-switch__flag">{LANGUAGE_FLAGS[item]}</span>
          </button>
        );
      })}
    </div>
  );
}
