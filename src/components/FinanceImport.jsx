import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { C } from "../theme";
import { Label, Btn } from "../kit";

export default function FinanceImport({ onImport, importing, error, importedAt, onClose }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [staged, setStaged] = useState([]);

  const addFiles = (files) => {
    const csvs = Array.from(files).filter((f) => f.name.endsWith(".csv") || f.type === "text/csv");
    if (!csvs.length) return;
    setStaged((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...csvs.filter((f) => !names.has(f.name))];
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleImport = () => {
    if (!staged.length) return;
    onImport(staged);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(18, 23, 15, 0.88)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[520px] border"
        style={{ background: "rgba(36, 46, 34, 0.95)", backdropFilter: "blur(20px)", borderColor: "rgba(60, 75, 55, 0.6)" }}
      >
        <header className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(60, 75, 55, 0.4)" }}>
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: C.moss }}>Weekly import</div>
            <div className="mt-1 text-[18px] font-bold" style={{ color: C.white }}>Drop your CSV files</div>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer p-2" style={{ color: C.ghost }}>
            <X size={18} />
          </button>
        </header>

        <div className="px-6 py-6 space-y-5">
          {importedAt && (
            <div className="flex items-center gap-3 rounded-none border px-4 py-3 text-[13px]"
              style={{ borderColor: "rgba(169, 196, 161, 0.35)", background: "rgba(169, 196, 161, 0.06)", color: C.moss }}>
              <CheckCircle2 size={15} />
              Last imported {importedAt}
            </div>
          )}

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-10 text-center transition-colors"
            style={{
              borderColor: dragging ? C.moss : "rgba(60, 75, 55, 0.6)",
              background: dragging ? "rgba(169, 196, 161, 0.05)" : "transparent",
            }}
          >
            <Upload size={28} color={dragging ? C.moss : C.ghost} />
            <div>
              <div className="text-[15px] font-medium" style={{ color: C.dim }}>Drop Chase or Amex CSV files here</div>
              <div className="mt-1 text-[13px] font-light" style={{ color: C.ghost }}>or click to browse · multiple files at once</div>
            </div>
            <div className="text-[12px]" style={{ color: C.faint }}>
              Chase: export from chase.com → Download activity → CSV<br />
              Amex: Account Activity → Download → CSV
            </div>
            <input ref={inputRef} type="file" accept=".csv" multiple className="hidden"
              onChange={(e) => addFiles(e.target.files)} />
          </div>

          {staged.length > 0 && (
            <div className="space-y-2">
              <Label>Ready to import</Label>
              {staged.map((f) => (
                <div key={f.name} className="flex items-center gap-3 border px-4 py-3"
                  style={{ borderColor: "rgba(60, 75, 55, 0.4)", background: "rgba(44, 55, 42, 0.5)" }}>
                  <FileText size={15} color={C.moss} />
                  <span className="flex-1 truncate text-[14px]" style={{ color: C.text }}>{f.name}</span>
                  <span className="text-[12px]" style={{ color: C.faint }}>
                    {(f.size / 1024).toFixed(0)} KB
                  </span>
                  <button type="button" onClick={() => setStaged((s) => s.filter((x) => x.name !== f.name))}
                    className="cursor-pointer ml-2" style={{ color: C.ghost }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 border px-4 py-3 text-[13px]"
              style={{ borderColor: "rgba(232, 169, 142, 0.4)", background: "rgba(58, 38, 32, 0.5)", color: C.oxide }}>
              <AlertCircle size={15} className="mt-px shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <Btn tone="secondary" onClick={onClose}>Cancel</Btn>
            <Btn onClick={handleImport} disabled={!staged.length || importing}>
              {importing ? "Importing…" : `Import ${staged.length > 0 ? staged.length + " file" + (staged.length > 1 ? "s" : "") : ""}`}
            </Btn>
          </div>

          <p className="text-[12px] font-light leading-[1.5]" style={{ color: C.ghost }}>
            Files are parsed locally in your browser. Nothing leaves your device. Data saves to localStorage and persists until you clear it.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
