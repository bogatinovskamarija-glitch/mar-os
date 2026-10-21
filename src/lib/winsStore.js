import { supabase, getUid } from "./supabase";

const KEY = "wins:log";
const BUCKET = "mar-os-wins";

function safe(fn, def) { try { return fn(); } catch { return def; } }

export const WIN_CATS = ["Work", "Personal", "Financial", "Learning", "Wellness"];

export const CAT_COLOR = {
  Work:      "#A9C4A1",
  Personal:  "#D4A574",
  Financial: "#E8A98E",
  Learning:  "#B8C8E0",
  Wellness:  "#C4B8A8",
};

function localGet()   { return safe(() => JSON.parse(localStorage.getItem(KEY) ?? "[]"), []); }
function localSave(d) { safe(() => localStorage.setItem(KEY, JSON.stringify(d))); }

async function uploadImage(uid, winId, file) {
  const ext = file.name.split(".").pop().toLowerCase() || "jpg";
  const path = `${uid}/${winId}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl ?? null;
}

export const winsStore = {
  all() { return localGet(); },

  async add(cat, text, imageFile = null) {
    const uid = getUid();
    const win = {
      id:        `${Date.now()}`,
      date:      new Date().toISOString().slice(0, 10),
      cat,
      text:      text.trim(),
      image_url: null,
    };
    // Upload image first if provided
    if (imageFile && uid) {
      win.image_url = await uploadImage(uid, win.id, imageFile);
    }
    // Write to localStorage immediately
    const wins = localGet();
    wins.unshift(win);
    localSave(wins);
    // Sync to Supabase in background
    if (uid) {
      supabase.from("mar_os_wins").insert({ ...win, user_id: uid }).then(() => {});
    }
    return win;
  },

  async remove(id) {
    const uid = getUid();
    const win = localGet().find((w) => w.id === id);
    localSave(localGet().filter((w) => w.id !== id));
    if (uid) {
      supabase.from("mar_os_wins").delete().eq("user_id", uid).eq("id", id).then(() => {});
      // Delete image from storage if present
      if (win?.image_url) {
        const path = win.image_url.split(`/${BUCKET}/`)[1];
        if (path) supabase.storage.from(BUCKET).remove([path]).then(() => {});
      }
    }
  },

  // Replaces local cache from Supabase rows
  hydrate(rows) {
    const wins = rows
      .map((r) => ({
        id:        r.id,
        cat:       r.cat,
        text:      r.text,
        date:      String(r.date).slice(0, 10),
        image_url: r.image_url ?? null,
      }))
      .sort((a, b) => b.id.localeCompare(a.id));
    localSave(wins);
    return wins;
  },

  // Uploads any localStorage wins that aren't yet in Supabase
  async backfill(uid) {
    const local = localGet();
    if (!local.length) return;
    const rows = local.map((w) => ({
      id:        w.id,
      user_id:   uid,
      cat:       w.cat,
      text:      w.text,
      date:      w.date,
      image_url: w.image_url ?? null,
    }));
    await supabase.from("mar_os_wins").upsert(rows, { onConflict: "user_id,id", ignoreDuplicates: true });
  },
};
