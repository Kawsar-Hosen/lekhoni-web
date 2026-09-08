"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "bn";

const KEY = "lk-lang";

const dict = {
  en: {
    tagline: "Bengali stories, novels & poems",
    home: "Home",
    books: "Books",
    categories: "Categories",
    writers: "Writers",
    search: "Search",
    about: "About",
    contact: "Contact",
    privacy: "Privacy",
    deleteData: "Delete data",
    account: "Account",
    accountSoon: "Writer accounts live in the Lekhoni Kahini app for now.",
    newBooks: "New books",
    popularBooks: "Popular books",
    featuredBook: "Featured book",
    popularWriters: "Popular writers",
    startReading: "Start reading",
    readNow: "Read now",
    chapters: "Chapters",
    by: "by",
    views: "views",
    likes: "likes",
    episodes: "episodes",
    allCategories: "All categories",
    newest: "Newest",
    popular: "Popular",
    noBooks: "No books found.",
    noResults: "No results found.",
    searchPh: "Search books, writers…",
    prevChapter: "Previous",
    nextChapter: "Next",
    backToBook: "Back to book",
    publishedBooks: "Published books",
    followers: "Followers",
    totalReads: "Total reads",
    comments: "Comments",
    writeComment: "Write a comment…",
    yourName: "Your name",
    post: "Post",
    commentPending: "Submitted — visible after review.",
    commentFailed: "Could not post. Try again.",
    like: "Like",
    unlike: "Unlike",
    follow: "Follow",
    unfollow: "Unfollow",
    pdfBook: "PDF book",
    openPdf: "Open PDF",
    description: "Description",
    dedication: "Dedication",
    aboutTitle: "About Lekhoni Kahini",
    contactTitle: "Contact",
    contactText: "For support, privacy questions and deletion requests, email us. We reply within 48 hours.",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    language: "Language",
    minRead: "min read",
    fontSize: "Text size",
    decrease: "Decrease",
    increase: "Increase",
    reset: "Reset",
    notFoundTitle: "Page not found",
    notFoundText: "The page you are looking for does not exist.",
    goHome: "Go home",
    errorTitle: "Something went wrong",
    errorRetry: "Try again",
    booksCount: "books",
    writersCount: "writers",
    browseAll: "Browse all",
    viewAll: "View all",
    heroTitle: "Stories worth your time",
    heroSub: "Read Bengali books online — new episodes, timeless novels, and fresh voices.",
    ctaTitle: "Love to write?",
    ctaSub: "Publish your own stories with Writer Studio in the Lekhoni Kahini app.",
    getApp: "Get the app",
  },
  bn: {
    tagline: "বাংলা গল্প, উপন্যাস ও কবিতা",
    home: "হোম",
    books: "বই",
    categories: "বিভাগ",
    writers: "লেখক",
    search: "খুঁজুন",
    about: "সম্পর্কে",
    contact: "যোগাযোগ",
    privacy: "গোপনীয়তা",
    deleteData: "তথ্য মুছুন",
    account: "অ্যাকাউন্ট",
    accountSoon: "লেখক অ্যাকাউন্ট আপাতত Lekhoni Kahini অ্যাপে আছে।",
    newBooks: "নতুন বই",
    popularBooks: "জনপ্রিয় বই",
    featuredBook: "ফিচার্ড বই",
    popularWriters: "জনপ্রিয় লেখক",
    startReading: "পড়া শুরু",
    readNow: "এখনই পড়ুন",
    chapters: "অধ্যায়",
    by: "",
    views: "পাঠ",
    likes: "লাইক",
    episodes: "পর্ব",
    allCategories: "সব বিভাগ",
    newest: "সর্বশেষ",
    popular: "জনপ্রিয়",
    noBooks: "কোনো বই পাওয়া যায়নি।",
    noResults: "কিছু পাওয়া যায়নি।",
    searchPh: "বই, লেখক খুঁজুন…",
    prevChapter: "আগের",
    nextChapter: "পরের",
    backToBook: "বইয়ে ফিরুন",
    publishedBooks: "প্রকাশিত বই",
    followers: "অনুসারী",
    totalReads: "মোট পাঠ",
    comments: "মন্তব্য",
    writeComment: "মন্তব্য লিখুন…",
    yourName: "তোমার নাম",
    post: "পোস্ট",
    commentPending: "জমা হয়েছে — পর্যালোচনার পর দেখাবে।",
    commentFailed: "পোস্ট হয়নি। আবার চেষ্টা করো।",
    like: "লাইক",
    unlike: "আনলাইক",
    follow: "ফলো",
    unfollow: "আনফলো",
    pdfBook: "PDF বই",
    openPdf: "PDF খোলো",
    description: "বিবরণ",
    dedication: "উৎসর্গ",
    aboutTitle: "Lekhoni Kahini সম্পর্কে",
    contactTitle: "যোগাযোগ",
    contactText: "সাপোর্ট, গোপনীয়তা ও মোছার অনুরোধে ইমেইল করো। ৪৮ ঘণ্টায় উত্তর দিই।",
    theme: "থিম",
    light: "লাইট",
    dark: "ডার্ক",
    system: "সিস্টেম",
    language: "ভাষা",
    minRead: "মিনিটের পাঠ",
    fontSize: "অক্ষরের আকার",
    decrease: "ছোট",
    increase: "বড়",
    reset: "রিসেট",
    notFoundTitle: "পেজ পাওয়া যায়নি",
    notFoundText: "তুমি যে পেজ খুঁজছো সেটা নেই।",
    goHome: "হোমে যাও",
    errorTitle: "কিছু ভুল হয়েছে",
    errorRetry: "আবার চেষ্টা করো",
    booksCount: "টি বই",
    writersCount: "জন লেখক",
    browseAll: "সব দেখো",
    viewAll: "সব দেখুন",
    heroTitle: "সময়ের মূল্য আছে এমন গল্প",
    heroSub: "বাংলা বই অনলাইনে পড়ো — নতুন পর্ব, কালজয়ী উপন্যাস, নতুন কণ্ঠ।",
    ctaTitle: "লিখতে ভালোবাসো?",
    ctaSub: "Lekhoni Kahini অ্যাপে Writer Studio দিয়ে নিজের গল্প প্রকাশ করো।",
    getApp: "অ্যাপ নাও",
  },
} as const;

export type Dict = (typeof dict)["en"];
export type DictKey = keyof Dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict.en[k] ?? k,
});

function storedLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const s = window.localStorage.getItem(KEY);
    if (s === "bn" || s === "en") return s;
  } catch {}
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // English default. No auto-detect — explicit choice only, persisted.
  const [lang, setLangState] = useState<Lang>(storedLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(KEY, l);
    } catch {}
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t: (k) => dict[lang][k] ?? k }}>
      <span data-lang={lang} style={{ display: "contents" }}>
        {children}
      </span>
    </Ctx.Provider>
  );
}

export const useLang = () => useContext(Ctx);
