import type { Messages } from "./messages";

type Vars = Record<string, string | number>;

function lookup(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = messages;
  for (const part of parts) {
    if (!cur || typeof cur !== "object" || !(part in cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export type Translator = (key: string, vars?: Vars) => string;

export function createT(messages: Messages): Translator {
  return function t(key: string, vars?: Vars) {
    let out = lookup(messages, key) ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        out = out.replaceAll(`{${k}}`, String(v));
      }
    }
    return out;
  };
}
