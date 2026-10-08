import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { isLang, localeOf, makeT, makeTN, type Lang, type T, type TN } from "./core";
import { setUiLanguage } from "@/lib/utils";

// Same key name as the website's cookie, stored on the device.
const LANG_KEY = "goplay_lang";

interface I18n { lang: Lang; locale: string; t: T; tn: TN; setLang: (l: Lang) => void; ready: boolean }

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang,  setState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(LANG_KEY)
      .then((v) => { if (isLang(v)) setState(v); })
      .finally(() => setReady(true));
  }, []);

  const setLang = useCallback((l: Lang) => {
    setState(l);
    SecureStore.setItemAsync(LANG_KEY, l).catch(() => { /* choice still applies until the app restarts */ });
  }, []);

  // formatLKR()/formatDate() are plain helpers used everywhere; keep them in step
  setUiLanguage(makeT(lang)("Rs."), localeOf(lang));

  const value = useMemo(
    () => ({ lang, locale: localeOf(lang), t: makeT(lang), tn: makeTN(lang), setLang, ready }),
    [lang, setLang, ready],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useT must be used inside <I18nProvider>");
  return v;
}
