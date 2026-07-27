import {Segmented} from "antd";
import {useTranslation} from "react-i18next";
import {SUPPORTED_LANGUAGES, normalizeLanguage} from "../i18n";
import type {SupportedLanguage} from "../types";

type LanguageSwitchProps = {
  onChange?: (language: SupportedLanguage) => void;
};

export function LanguageSwitch({onChange}: LanguageSwitchProps) {
  const {i18n, t} = useTranslation();
  const language = normalizeLanguage(i18n.language);

  return (
    <Segmented
      size="small"
      value={language}
      options={SUPPORTED_LANGUAGES.map((item) => ({
        label: t(`language.${item}`),
        value: item,
      }))}
      onChange={(value) => {
        const nextLanguage = normalizeLanguage(value);
        void i18n.changeLanguage(nextLanguage);
        onChange?.(nextLanguage);
      }}
    />
  );
}
