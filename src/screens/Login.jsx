import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { C } from "../theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6 font-[Montserrat] antialiased"
      style={{ background: "#1A2118", color: "#F0EDE6" }}
    >
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@200;300;400;500;600;700;800;900&display=swap" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px]"
      >
        <div className="mb-10">
          <h1
            className="text-[clamp(2.8rem,12vw,4.5rem)] font-black uppercase leading-[0.88] tracking-[-0.045em]"
            style={{ color: "#F0EDE6" }}
          >
            MAR<span style={{ color: "#A9C4A1" }}>·</span>OS
          </h1>
          <p className="mt-4 border-l pl-4 text-[15px] font-light leading-[1.55]" style={{ borderColor: "#A9C4A1", color: "#8FA88A" }}>
            Your personal operating system.
          </p>
        </div>

        {sent ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="border px-5 py-5" style={{ borderColor: "#2E3D2C", background: "#232E21" }}>
              <p className="text-[14px] font-semibold" style={{ color: "#A9C4A1" }}>Check your email</p>
              <p className="mt-2 text-[13px] font-light leading-[1.6]" style={{ color: "#8FA88A" }}>
                A sign-in link was sent to <span style={{ color: "#F0EDE6" }}>{email}</span>.<br />
                Click it to open MAR OS on this device.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-[12px] font-bold uppercase tracking-[0.14em] cursor-pointer"
              style={{ color: "#5A7058" }}
            >
              Use a different email
            </button>
          </motion.div>
        ) : (
          <form onSubmit={send} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: "#5A7058" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                className="w-full border bg-transparent px-4 py-3 text-[15px] font-light outline-none"
                style={{
                  borderColor: "#2E3D2C",
                  color: "#F0EDE6",
                  background: "#232E21",
                  fontFamily: "Montserrat, sans-serif",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#A9C4A1")}
                onBlur={(e) => (e.target.style.borderColor = "#2E3D2C")}
              />
            </div>

            {error && (
              <p className="text-[12px]" style={{ color: "#C4806A" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: C.moss ?? "#A9C4A1", color: "#1A2118" }}
            >
              {loading ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
