export type GiftOpen = "lift" | "fade" | "slide" | "pop";

export type GiftShape = "classic" | "round" | "tall" | "wide";

export type GiftTpl = {
  id: string;
  emoji: string;
  nameBn: string;
  nameEn: string;
  descBn: string;
  descEn: string;
  bg: string;
  bgDeep: string;
  accent: string;
  paper: string;
  ink: string;
  seal: string; // GiftIcon name
  open: GiftOpen;
  shape: GiftShape;
  particle: string;
  btnBg: string;
  btnInk: string;
};

export const GIFT_TEMPLATES: GiftTpl[] = [
  {
    id: "romantic", emoji: "💗", nameBn: "রোমান্টিক পিংক", nameEn: "Romantic Pink",
    descBn: "মিষ্টি ও রোমান্টিক", descEn: "Sweet & romantic",
    bg: "linear-gradient(150deg,#fff1f2,#fecdd3)", bgDeep: "#fda4af",
    accent: "#e11d48", paper: "#fffdf7", ink: "#1c1917",
    seal: "heart", open: "lift", shape: "classic", particle: "💗", btnBg: "#e11d48", btnInk: "#fff",
  },
  {
    id: "midnight", emoji: "🌙", nameBn: "মিডনাইট লাভ", nameEn: "Midnight Love",
    descBn: "রাতের আকাশের মতো অনুভূতি", descEn: "Night-sky feeling",
    bg: "linear-gradient(150deg,#0b1026,#1e2a5a)", bgDeep: "#060a1c",
    accent: "#9db8ff", paper: "#101736", ink: "#eef2ff",
    seal: "moon", open: "fade", shape: "tall", particle: "✨", btnBg: "#3b5bdb", btnInk: "#fff",
  },
  {
    id: "rose", emoji: "🌹", nameBn: "রোজ লেটার", nameEn: "Rose Letter",
    descBn: "ভালোবাসার vintage চিঠি", descEn: "Vintage love letter",
    bg: "linear-gradient(150deg,#faf3e3,#e8c9a8)", bgDeep: "#c89b6a",
    accent: "#a31621", paper: "#fffaf0", ink: "#3f2a1d",
    seal: "rose", open: "slide", shape: "classic", particle: "🌹", btnBg: "#a31621", btnInk: "#fff",
  },
  {
    id: "pastel", emoji: "🧸", nameBn: "কিউট প্যাস্টেল", nameEn: "Cute Pastel",
    descBn: "মিষ্টি ও playful", descEn: "Sweet & playful",
    bg: "linear-gradient(150deg,#fdf2f8,#ddd6fe 55%,#bfdbfe)", bgDeep: "#c4b5fd",
    accent: "#7c3aed", paper: "#ffffff", ink: "#3b3470",
    seal: "star", open: "pop", shape: "round", particle: "⭐", btnBg: "#8b5cf6", btnInk: "#fff",
  },
  {
    id: "gold", emoji: "✨", nameBn: "লাক্সারি গোল্ড", nameEn: "Luxury Gold",
    descBn: "Premium ও elegant", descEn: "Premium & elegant",
    bg: "linear-gradient(150deg,#171310,#3a2d18)", bgDeep: "#0c0a06",
    accent: "#e8c46a", paper: "#14100a", ink: "#f5e8c8",
    seal: "crown", open: "lift", shape: "wide", particle: "✨", btnBg: "#c9972b", btnInk: "#1a1408",
  },
  {
    id: "diary", emoji: "📜", nameBn: "ভিন্টেজ ডায়েরি", nameEn: "Vintage Diary",
    descBn: "পুরোনো দিনের চিঠির অনুভূতি", descEn: "Old-days feeling",
    bg: "linear-gradient(150deg,#efe3c8,#d9bd8a)", bgDeep: "#a98a52",
    accent: "#6b4226", paper: "#f7efda", ink: "#4a3220",
    seal: "leaf", open: "slide", shape: "classic", particle: "🍂", btnBg: "#6b4226", btnInk: "#fff",
  },
  {
    id: "ocean", emoji: "💙", nameBn: "ব্লু ওশান", nameEn: "Blue Ocean",
    descBn: "শান্ত ও সুন্দর", descEn: "Calm & beautiful",
    bg: "linear-gradient(150deg,#e0f2fe,#7dd3fc)", bgDeep: "#0284c7",
    accent: "#0369a1", paper: "#ffffff", ink: "#0c4a6e",
    seal: "wave", open: "fade", shape: "wide", particle: "🫧", btnBg: "#0284c7", btnInk: "#fff",
  },
  {
    id: "sakura", emoji: "🌸", nameBn: "সাকুরা", nameEn: "Sakura",
    descBn: "নরম ও aesthetic", descEn: "Soft & aesthetic",
    bg: "linear-gradient(150deg,#ffffff,#ffd6e0)", bgDeep: "#f9a8c0",
    accent: "#b23a5b", paper: "#ffffff", ink: "#5b2337",
    seal: "flower", open: "lift", shape: "round", particle: "🌸", btnBg: "#e0608a", btnInk: "#fff",
  },
  {
    id: "neon", emoji: "💜", nameBn: "নিয়ন লাভ", nameEn: "Neon Love",
    descBn: "Modern futuristic", descEn: "Modern futuristic",
    bg: "linear-gradient(150deg,#0d0217,#2b0a4e)", bgDeep: "#060110",
    accent: "#22d3ee", paper: "#150826", ink: "#f0f9ff",
    seal: "bolt", open: "pop", shape: "tall", particle: "💜", btnBg: "#7c3aed", btnInk: "#fff",
  },
  {
    id: "minimal", emoji: "🤍", nameBn: "মিনিমাল হোয়াইট", nameEn: "Minimal White",
    descBn: "Simple & premium", descEn: "Simple & premium",
    bg: "linear-gradient(150deg,#ffffff,#eef2f7)", bgDeep: "#cbd5e1",
    accent: "#334155", paper: "#ffffff", ink: "#1e293b",
    seal: "heart", open: "fade", shape: "classic", particle: "", btnBg: "#1e293b", btnInk: "#fff",
  },
];
