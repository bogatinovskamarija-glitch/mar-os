import { motion } from "framer-motion";
import { C } from "../theme";
import greenprint from "../assets/site-greenprint.png";

export default function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <img
        src={greenprint}
        alt=""
        className="absolute right-0 top-0 h-[72vh] w-full object-cover object-right-top opacity-[0.55] sm:h-[78vh] sm:w-[76%] sm:opacity-[0.8]"
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(103deg, ${C.floor} 0%, ${C.floor} 22%, rgba(26,33,24,0.86) 42%, rgba(26,33,24,0.34) 66%, rgba(26,33,24,0.78) 100%)`,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[55vh]"
        style={{ background: `linear-gradient(to bottom, rgba(26,33,24,0) 0%, ${C.floor} 62%)` }}
      />
      <motion.div
        className="absolute -inset-[8%]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(232,232,227,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(232,232,227,0.045) 1px, transparent 1px)`,
          backgroundSize: "46px 46px",
        }}
        animate={{ x: [0, 46], y: [0, 46] }}
        transition={{ duration: 66, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
