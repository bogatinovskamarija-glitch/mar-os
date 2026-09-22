import { createContext, useContext, useState, useEffect } from "react";
import { initAuth, syncDown } from "../lib/supabase";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    initAuth((s) => {
      setSession(s ?? null);
      if (s?.user?.id) {
        syncDown(s.user.id).catch(() => {});
      }
    });
  }, []);

  return <Ctx.Provider value={{ session, loading: session === undefined }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
