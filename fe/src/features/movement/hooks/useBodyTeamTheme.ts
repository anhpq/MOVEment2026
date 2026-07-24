import {useEffect} from "react";
import type {TeamThemeVars} from "../teamTheme";

type ThemeOwner = {
  token: symbol;
  priority: number;
  order: number;
  vars: TeamThemeVars;
};

const themeOwners = new Map<string, ThemeOwner>();
let registrationOrder = 0;
let appliedProperties: string[] = [];

function applyActiveTheme() {
  const activeOwner = [...themeOwners.values()].sort(
    (left, right) => left.priority - right.priority || left.order - right.order,
  ).at(-1);

  for (const property of appliedProperties) {
    document.body.style.removeProperty(property);
  }
  appliedProperties = [];

  if (!activeOwner) {
    document.body.classList.remove("team-themed-overlay");
    return;
  }

  document.body.classList.add("team-themed-overlay");
  for (const [property, value] of Object.entries(activeOwner.vars)) {
    if (property.startsWith("--team-") && typeof value === "string") {
      document.body.style.setProperty(property, value);
      appliedProperties.push(property);
    }
  }
}

export function useBodyTeamTheme(
  ownerId: string,
  vars: TeamThemeVars | null,
  priority = 0,
) {
  useEffect(() => {
    if (!vars) {
      return;
    }

    const token = Symbol(ownerId);
    themeOwners.set(ownerId, {
      token,
      priority,
      order: ++registrationOrder,
      vars,
    });
    applyActiveTheme();

    return () => {
      if (themeOwners.get(ownerId)?.token === token) {
        themeOwners.delete(ownerId);
        applyActiveTheme();
      }
    };
  }, [ownerId, priority, vars]);
}
