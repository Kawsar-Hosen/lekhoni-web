"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import StoryCard, { isStoryReply } from "@/components/StoryCard";
import VoiceMode from "./VoiceMode";
import { renderAiMd, splitAiCode } from "@/components/RichText";
import CodeBlock from "@/components/CodeBlock";
import { sendAiMessage, getModel, setModel, listModels, getSuggestions, AiError, aiErrorKey, type AiMsg } from "@/lib/ai";
import { getBooks, getWriters, type ApiBook, type ApiWriter } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

type Chat = { id: string; title: string; msgs: AiMsg[]; pinned: boolean; updatedAt: number };

const LS_KEY = "lk-ai-chats";

// Professional rotating placeholder phrases (typewriter animation).
const PH_STATIC_BN = "আপনার প্রশ্ন লিখুন…";
const PH_STATIC_EN = "Ask anything…";
const PH_BN = [
  "গল্পের প্লট সাজিয়ে দাও…",
  "একটি কবিতা লিখে দাও…",
  "চরিত্রের নাম সাজেস্ট করো…",
  "বানান ও ব্যাকরণ ঠিক করে দাও…",
];
const PH_EN = [
  "Outline a story plot…",
  "Write a poem for me…",
  "Suggest character names…",
  "Fix spelling and grammar…",
];

function loadChats(): Chat[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(LS_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function loadConsent(): "yes" | "no" | "" {
  try {
    const v = window.localStorage.getItem("lk-ai-consent");
    return v === "yes" || v === "no" ? v : "";
  } catch {
    return "";
  }
}

function loadInitialChats(): Chat[] {
  try {
    return window.localStorage.getItem("lk-ai-consent") === "yes" ? loadChats() : [];
  } catch {
    return [];
  }
}

const newChatId = () => `c-${Date.now()}`;

export default function AiFull() {
  const { t, lang, setLang } = useLang();
  const { theme, setTheme } = useTheme();
  const [consent, setConsent] = useState<"yes" | "no" | "">(loadConsent);
  // Fullscreen chat: lock document scroll so the mobile keyboard
  // cannot pan the page and hide the top bar. Chat scrolls internally.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  // Typewriter placeholder animation (static text for reduced motion).
  const [phText, setPhText] = useState(() => {
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return lang === "bn" ? PH_STATIC_BN : PH_STATIC_EN;
      }
    } catch {}
    return "";
  });
  useEffect(() => {
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {}
    const phrases = lang === "bn" ? PH_BN : PH_EN;
    let pi = 0;
    let ci = 0;
    let del = false;
    let timer = 0;
    const tick = () => {
      const full = phrases[pi % phrases.length];
      if (!del) {
        ci += 1;
        setPhText(full.slice(0, ci));
        if (ci >= full.length) {
          del = true;
          timer = window.setTimeout(tick, 1600);
          return;
        }
        timer = window.setTimeout(tick, 55);
      } else {
        ci -= 2;
        if (ci <= 0) {
          setPhText("");
          del = false;
          pi += 1;
          timer = window.setTimeout(tick, 400);
          return;
        }
        setPhText(full.slice(0, ci));
        timer = window.setTimeout(tick, 26);
      }
    };
    timer = window.setTimeout(tick, 600);
    return () => window.clearTimeout(timer);
  }, [lang]);
  const [view, setView] = useState<"home" | "chat">("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>(loadInitialChats);
  const [activeId, setActiveId] = useState("");
  const [msgs, setMsgs] = useState<AiMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ file: File; url: string } | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<{ books: Map<string, ApiBook>; writers: Map<string, ApiWriter> }>({
    books: new Map(),
    writers: new Map(),
  });
  const [models, setModels] = useState<string[]>([]);
  const [model, setModelState] = useState<string>(getModel);
  const [voiceMode, setVoiceMode] = useState(false);
  const [online, setOnline] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(0);
  const installEvt = useRef<Event | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const msgsRef = useRef<AiMsg[]>([]);
  const activeIdRef = useRef("");
  const voiceSessionRef = useRef("");
  const [sideView, setSideView] = useState<"chats" | "settings">("chats");
  const [voiceOn, setVoiceOn] = useState(() => {
    try {
      return window.localStorage.getItem("lk-ai-voice") === "1";
    } catch {
      return false;
    }
  });
  const [textSize, setTextSize] = useState<"s" | "m" | "l">(() => {
    try {
      const v = window.localStorage.getItem("lk-ai-tsize");
      return v === "s" || v === "l" ? v : "m";
    } catch {
      return "m";
    }
  });
  const [showSugg, setShowSugg] = useState(() => {
    try {
      return window.localStorage.getItem("lk-ai-sugg") !== "0";
    } catch {
      return true;
    }
  });
  const [ctxId, setCtxId] = useState("");
  const [renameId, setRenameId] = useState("");
  const [renameText, setRenameText] = useState("");
  const [votes, setVotes] = useState<Record<number, "up" | "down">>({});
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const pressTimer = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consent !== "yes") return;
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(chats.slice(0, 20)));
    } catch {}
  }, [chats, consent]);

  useEffect(() => {
    listModels().then((m) => {
      if (m.length) setModels(m);
    });
    Promise.all([getBooks(), getWriters()]).then(([b, w]) => {
      setCatalog({
        books: new Map((b || []).map((x) => [x.id, x])),
        writers: new Map((w || []).map((x) => [x.id, x])),
      });
    });
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [msgs, busy]);

  const chooseConsent = (v: "yes" | "no") => {
    try {
      window.localStorage.setItem("lk-ai-consent", v);
    } catch {}
    if (v === "no") {
      try {
        window.localStorage.removeItem(LS_KEY);
      } catch {}
      setChats([]);
    } else {
      setChats(loadChats());
    }
    setConsent(v);
  };


  const persist = (id: string, m: AiMsg[]) => {
    setChats((prev) => {
      const title = m.find((x) => x.role === "user")?.text.slice(0, 40) || "Chat";
      const ex = prev.find((c) => c.id === id);
      const row: Chat = ex
        ? { ...ex, msgs: m, title: ex.title === "Chat" ? title : ex.title, updatedAt: Date.now() }
        : { id, title, msgs: m, pinned: false, updatedAt: Date.now() };
      return [row, ...prev.filter((c) => c.id !== id)].slice(0, 20);
    });
  };

  const onAiBodyClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest("[data-copy]") as HTMLElement | null;
    if (!el) return;
    const raw = decodeURIComponent(el.getAttribute("data-copy") || "");
    if (!raw) return;
    try {
      await window.navigator.clipboard.writeText(raw);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = raw;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {}
      ta.remove();
    }
    const prev = el.textContent;
    el.textContent = "✓";
    window.    setTimeout(() => {
      el.textContent = prev;
    }, 1400);
  };

  const genFollowUps = (reply: string): string[] => {
    const bn = lang === "bn";
    const hasBook = /\[book:[0-9a-f-]{8,}\]/i.test(reply);
    const hasWriter = /\[writer:[0-9a-f-]{8,}\]/i.test(reply);
    const bookM = reply.match(/"([^"]{3,60})"/);
    const name = bookM ? bookM[1] : "";
    if (isStoryReply(reply)) {
      return bn
        ? [`পরের অধ্যায় লিখো`, `গল্পটা আরও বড় করো`, `শেষটা পরিবর্তন করো`]
        : [`Write the next chapter`, `Make the story longer`, `Change the ending`];
    }
    if (hasWriter || /profile|প্রোফাইল|লেখক|follower|ফলোয়ার/i.test(reply)) {
      return bn
        ? [`ফলোয়ার কত জানতে চান?`, `তার বইগুলো দেখাও`, `নতুন লেখক সাজেস্ট করো`]
        : [`How many followers?`, `Show their books`, `Suggest new writers`];
    }
    if (hasBook || /বই|book|গল্প|উপন্যাস/i.test(reply)) {
      return bn
        ? [
            name ? `“${name}” এর সারাংশ দাও` : `সারাংশ দাও`,
            `লেখক সম্পর্কে জানতে চান?`,
            `একই ধরনের বই দেখাও`,
          ]
        : [
            name ? `Summarize "${name}"` : `Summarize`,
            `Tell me about the author?`,
            `Show similar books`,
          ];
    }
    return bn
      ? [`ভালো বই সাজেস্ট করো`, `জনপ্রিয় লেখক কারা?`, `নতুন কী এসেছে?`]
      : [`Suggest good books`, `Who are popular writers?`, `What's new?`];
  };

  const renderAi = (text: string, keyBase: string) => {
    if (isStoryReply(text)) {
      const lastUser = [...msgs].reverse().find((m) => m.role === "user")?.text || "";
      return (
        <StoryCard
          key={keyBase}
          text={text}
          onRegenerate={() => regenStory(lastUser)}
          onSpeak={speak}
        />
      );
    }
    const parts = text.split(/(\[(?:book|writer):[0-9a-f-]{8,}\])/gi);
    return parts.map((p, i) => {
      const m = p.match(/\[(book|writer):([0-9a-f-]{8,})\]/i);
      if (!m) {
        // Code fences render as interactive CodeBlocks (highlight + preview).
        const segs = splitAiCode(p);
        if (segs.length === 1 && segs[0].kind === "text") {
          return (
            <span
              key={`${keyBase}-${i}`}
              className="ai-md"
              dangerouslySetInnerHTML={{ __html: renderAiMd(p) }}
            />
          );
        }
        return (
          <span key={`${keyBase}-${i}`} className="ai-md">
            {segs.map((s, j) =>
              s.kind === "code" ? (
                <CodeBlock key={`${keyBase}-${i}-${j}`} code={s.code} lang={s.lang} />
              ) : (
                <span
                  key={`${keyBase}-${i}-${j}`}
                  dangerouslySetInnerHTML={{ __html: renderAiMd(s.text) }}
                />
              )
            )}
          </span>
        );
      }
      const [, kind, id] = m;
      if (kind.toLowerCase() === "book") {
        const b = catalog.books.get(id);
        if (!b) return null;
        return (
          <Link key={`${keyBase}-${i}`} href={`/book/${b.id}`} className="ai-card">
            {b.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.cover_url} alt="" loading="lazy" />
            ) : null}
            <span className="ai-card-tx">
              <strong>{b.title}</strong>
              <span>{b.author_name || b.author}</span>
            </span>
          </Link>
        );
      }
      const w = catalog.writers.get(id);
      if (!w) return null;
      return (
        <Link key={`${keyBase}-${i}`} href={`/writer/${w.id}`} className="ai-card">
          {w.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={w.avatar_url} alt="" loading="lazy" className="round" />
          ) : null}
          <span className="ai-card-tx">
            <strong>{w.writer_name}</strong>
            <span>@{w.username}</span>
          </span>
        </Link>
      );
    });
  };

  const copyMsg = async (text: string, i: number) => {
    try {
      await window.navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {}
      ta.remove();
    }
    setCopiedIdx(i);
    window.setTimeout(() => setCopiedIdx(-1), 1500);
  };

  const speakMsg = (text: string) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      if (synth.speaking) {
        synth.cancel();
        return;
      }
      const u = new SpeechSynthesisUtterance(text.slice(0, 4000));
      u.lang = lang === "bn" ? "bn-BD" : "en-US";
      const vs = synth.getVoices();
      const v = vs.find((x) => x.lang?.toLowerCase().startsWith(lang === "bn" ? "bn" : "en"));
      if (v) u.voice = v;
      synth.cancel();
      synth.speak(u);
    } catch {}
  };

  const retryMsg = async (i: number) => {
    if (busy) return;
    const prev = msgs.slice(0, i);
    const lastUser = [...prev].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setBusy(true);
    try {
      const reply = await sendAiMessage([...prev, lastUser]);
      const done = [...prev, lastUser, { role: "ai" as const, text: reply }];
      setMsgs(done);
      if (activeId) persist(activeId, done);
    } catch {}
    setBusy(false);
  };

  const setStored = (k: string, v: string) => {
    try {
      window.localStorage.setItem(k, v);
    } catch {}
  };

  const toggleVoice = () => {
    setVoiceOn((v) => {
      try {
        window.localStorage.setItem("lk-ai-voice", v ? "0" : "1");
      } catch {}
      if (v) {
        try {
          window.speechSynthesis?.cancel();
        } catch {}
      }
      return !v;
    });
  };

  const speak = (text: string) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      if (synth.speaking) {
        synth.cancel();
        return;
      }
      const u = new SpeechSynthesisUtterance(text.slice(0, 4000));
      u.lang = lang === "bn" ? "bn-BD" : "en-US";
      const vs = synth.getVoices();
      const v = vs.find((x) => x.lang?.toLowerCase().startsWith(lang === "bn" ? "bn" : "en"));
      if (v) u.voice = v;
      synth.cancel();
      synth.speak(u);
    } catch {}
  };

  // Live refs so voice exchanges never use stale closures.
  useEffect(() => {
    msgsRef.current = msgs;
  }, [msgs]);
  // Capture PWA install prompt for "Add to Home" (if browser offers it).
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      installEvt.current = e;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  };

  const chatText = () =>
    msgs
      .map((m) => `${m.role === "user" ? (lang === "bn" ? "তুমি" : "You") : "AI"}: ${m.text}`)
      .join("\n\n");

  const shareChat = async () => {
    setMoreOpen(false);
    if (!msgs.length) return;
    const text = `${lang === "bn" ? "লেখনী AI চ্যাট" : "Lekhoni AI chat"}\n\n${chatText()}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Lekhoni AI", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      showToast(t("copiedMsg"));
    } catch {}
  };

  const downloadChat = () => {
    setMoreOpen(false);
    if (!msgs.length) return;
    try {
      const blob = new Blob([chatText()], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      a.href = URL.createObjectURL(blob);
      a.download = `lekhoni-chat-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      showToast(t("aiDownloadedMsg"));
    } catch {}
  };

  const addToHome = async () => {
    setMoreOpen(false);
    const ev = installEvt.current as (Event & {
      prompt?: () => Promise<void>;
      userChoice?: Promise<unknown>;
    }) | null;
    if (ev?.prompt) {
      try {
        await ev.prompt();
        await ev.userChoice?.catch(() => null);
        installEvt.current = null;
        return;
      } catch {}
    }
    showToast(t("aiAddHomeHint"));
  };

  const deleteCurrentChat = () => {
    setMoreOpen(false);
    if (activeId) delChat(activeId);
    else if (msgs.length) {
      setMsgs([]);
      setView("home");
    }
  };
  // Track connectivity for the offline banner.
  useEffect(() => {
    const update = () => {
      try {
        setOnline(window.navigator.onLine !== false);
      } catch {}
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Append one voice exchange (user + AI) into the chat history.
  const handleVoiceExchange = (user: string, ai: string) => {
    if (!voiceSessionRef.current) {
      voiceSessionRef.current = activeIdRef.current || newChatId();
    }
    const id = voiceSessionRef.current;
    setActiveId(id);
    const done: AiMsg[] = [
      ...msgsRef.current,
      { role: "user", text: user },
      { role: "ai", text: ai },
    ];
    setMsgs(done);
    persist(id, done);
    setView("chat");
  };

  const openVoice = () => {
    voiceSessionRef.current = "";
    setVoiceMode(true);
  };

  const regenStory = (userText: string) => {
    if (busy) return;
    ask(
      `${userText}\n\n(আবার নতুন করে লেখো — একই ধরন রেখে ভিন্ন চরিত্র, ঘটনা ও বিবরণ দিয়ে। আগের গল্প হুবহু repeat কোরো না।)`
    );
  };

  const clearPending = (revoke = true) => {
    if (revoke && pending) {
      try {
        URL.revokeObjectURL(pending.url);
      } catch {}
    }
    setPending(null);
  };

  const onFile = (f: File | null) => {
    if (!f || busy) return;
    try {
      if (pending) URL.revokeObjectURL(pending.url);
    } catch {}
    const url = URL.createObjectURL(f);
    setPending({ file: f, url });
    // DO NOT SEND — wait for manual Send press.
  };

  const removePending = () => clearPending(true);

  const fileToDataUrl = (f: File): Promise<string> =>
    new Promise((resolve) => {
      if (!f.type.startsWith("image/")) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 1024;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const cv = document.createElement("canvas");
          cv.width = Math.round(img.width * scale);
          cv.height = Math.round(img.height * scale);
          cv.getContext("2d")?.drawImage(img, 0, 0, cv.width, cv.height);
          resolve(cv.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = () => resolve("");
        img.src = String(reader.result);
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(f);
    });

  const askDirect = async (next: AiMsg[]): Promise<boolean> => {
    const id = activeId || newChatId();
    if (!activeId) setActiveId(id);
    setBusy(true);
    try {
      const reply = await sendAiMessage(next);
      const done = [...next, { role: "ai" as const, text: reply }];
      setMsgs(done);
      persist(id, done);
      setFollowUps(genFollowUps(reply));
      if (voiceOn) speak(reply);
      getSuggestions(done)
        .then((s) => {
          if (s && s.length >= 3) setFollowUps(s.slice(0, 4));
        })
        .catch(() => {});
    } catch (e) {
      // Show the real reason: quota finished, offline, slow net, or busy.
      const code = e instanceof AiError ? e.code : "unknown";
      setMsgs([...next, { role: "ai" as const, text: t(aiErrorKey(code)) }]);
      setBusy(false);
      return false;
    }
    setBusy(false);
    return true;
  };

  const ask = async (text: string) => {
    const q = text.trim();
    const att = pending;
    if ((!q && !att) || busy) return;
    let image: string | undefined;
    let label = q;
    if (att) {
      if (att.file.type.startsWith("image/")) {
        image = await fileToDataUrl(att.file);
      } else {
        label = q ? `${q}\n📎 ${att.file.name}` : `📎 ${att.file.name}`;
      }
    }
    if (!label && !image) return;
    const next = [...msgs, { role: "user" as const, text: label, ...(image ? { image } : {}) }];
    setMsgs(next);
    setInput("");
    setView("chat");
    const ok = await askDirect(next);
    if (ok) clearPending(true);
  };

  const openChat = (c: Chat) => {
    setActiveId(c.id);
    setMsgs(c.msgs);
    const lastAi = [...c.msgs].reverse().find((m) => m.role === "ai");
    setFollowUps(lastAi ? genFollowUps(lastAi.text) : []);
    setView("chat");
    setMenuOpen(false);
  };

  const newChat = () => {
    setActiveId("");
    setMsgs([]);
    setFollowUps([]);
    clearPending(true);
    setView("home");
    setMenuOpen(false);
  };

  const togglePin = (id: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)));
  };

  const delChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    setCtxId("");
    if (activeId === id) {
      setActiveId("");
      setMsgs([]);
      setView("home");
    }
  };

  const startRename = (c: Chat) => {
    setRenameId(c.id);
    setRenameText(c.title);
    setCtxId("");
  };

  const saveRename = () => {
    const name = renameText.trim().slice(0, 40);
    if (!name) {
      setRenameId("");
      return;
    }
    setChats((prev) => prev.map((c) => (c.id === renameId ? { ...c, title: name } : c)));
    setRenameId("");
  };

  const pressStart = (id: string) => {
    window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => setCtxId(id), 500);
  };

  const pressEnd = () => window.clearTimeout(pressTimer.current);

  const chatRow = (c: Chat) => (
    <div
      key={c.id}
      className="ai-chat-row"
      onTouchStart={() => pressStart(c.id)}
      onTouchEnd={pressEnd}
      onTouchMove={pressEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        setCtxId(c.id);
      }}
    >
      {renameId === c.id ? (
        <span className="ai-rename">
          <input
            value={renameText}
            autoFocus
            maxLength={40}
            onChange={(e) => setRenameText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveRename();
              if (e.key === "Escape") setRenameId("");
            }}
            onBlur={saveRename}
          />
        </span>
      ) : (
        <button className="ai-chat-open" onClick={() => openChat(c)}>
          {c.title}
        </button>
      )}
      <button
        className={`ai-pinbtn${c.pinned ? " on" : ""}`}
        onClick={() => togglePin(c.id)}
        aria-label={c.pinned ? t("unpinLbl") : t("pinLbl")}
      >
        <Icon name="pin" size={14} />
      </button>
      <button
        className="ai-pinbtn"
        onClick={() => setCtxId(ctxId === c.id ? "" : c.id)}
        aria-label="More"
      >
        <Icon name="dots" size={14} />
      </button>
      {ctxId === c.id && renameId !== c.id && (
        <span className="card ai-ctx">
          <button onClick={() => { togglePin(c.id); setCtxId(""); }}>
            <Icon name="pin" size={14} /> {c.pinned ? t("unpinLbl") : t("pinLbl")}
          </button>
          <button onClick={() => startRename(c)}>{t("renameLbl")}</button>
          <button className="danger" onClick={() => delChat(c.id)}>
            {t("deleteLbl")}
          </button>
        </span>
      )}
    </div>
  );

  const pinned = chats.filter((c) => c.pinned).sort((a, b) => b.updatedAt - a.updatedAt);
  const recent = chats.filter((c) => !c.pinned).sort((a, b) => b.updatedAt - a.updatedAt);

  const features = [
    { icon: "bookOpen", bn: "গল্প নিয়ে প্রশ্ন", en: "Ask about story" },
    { icon: "edit", bn: "লেখায় সাহায্য", en: "Writing help" },
    { icon: "book", bn: "সারাংশ", en: "Summary" },
    { icon: "globe", bn: "অনুবাদ সহায়তা", en: "Translate help" },
  ];

  return (
    <div className="ai-full">
      {consent === "" && (
        <div className="cookie-veil">
          <div className="card cookie-card">
            <div className="cookie-ic">🍪</div>
            <h2>{lang === "bn" ? "চ্যাট সংরক্ষণ করবো?" : "Save chats?"}</h2>
            <p>
              {lang === "bn"
                ? "তোমার AI চ্যাট শুধু এই ব্রাউজারে সংরক্ষণ হবে। কোনো সার্ভারে যাবে না।"
                : "Your AI chats stay only in this browser. Nothing goes to any server."}
            </p>
            <div className="cookie-btns">
              <button className="btn btn-ghost" onClick={() => chooseConsent("no")}>
                {lang === "bn" ? "রিজেক্ট" : "Reject"}
              </button>
              <button className="btn btn-premium" onClick={() => chooseConsent("yes")}>
                {lang === "bn" ? "অ্যাকসেপ্ট" : "Accept"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="ai-full-top">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="ai-full-new" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            <Icon name="menu" size={17} />
          </button>
          <Link href="/" className="ai-full-logo" aria-label="Home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/banner1.png" alt="লেখনী কাহিনী" />
          </Link>
        </div>
        <div className="ai-more-wrap">
          <button
            className="ai-full-new"
            onClick={() => setMoreOpen((v) => !v)}
            aria-label="More options"
            aria-expanded={moreOpen}
          >
            <Icon name="dots" size={17} />
          </button>
          {moreOpen && (
            <>
              <div className="ai-more-veil" onClick={() => setMoreOpen(false)} />
              <div className="ai-more" role="menu">
                <button
                  className="ai-more-item"
                  onClick={() => {
                    setMoreOpen(false);
                    newChat();
                  }}
                >
                  <Icon name="filePlus" size={16} />
                  <span>{t("aiNewChat")}</span>
                </button>
                <button className="ai-more-item" onClick={shareChat} disabled={!msgs.length}>
                  <Icon name="share" size={16} />
                  <span>{t("aiShareChat")}</span>
                </button>
                <button className="ai-more-item" onClick={downloadChat} disabled={!msgs.length}>
                  <Icon name="download" size={16} />
                  <span>{t("aiDownloadChat")}</span>
                </button>
                <button className="ai-more-item" onClick={addToHome}>
                  <Icon name="home" size={16} />
                  <span>{t("aiAddHome")}</span>
                </button>
                <button
                  className="ai-more-item danger"
                  onClick={deleteCurrentChat}
                  disabled={!msgs.length && !activeId}
                >
                  <Icon name="x" size={16} />
                  <span>{t("aiDeleteChat")}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {!online && (
        <div className="ai-offline" role="status">
          <span className="ai-offline-dot" />
          {t("aiOfflineBar")}
        </div>
      )}

      {menuOpen && (
        <>
          <div className="ai-veil" onClick={() => setMenuOpen(false)} />
          <aside className="ai-side">
            {sideView === "settings" ? (
              <div className="ai-set-sheet">
                <div className="ai-side-sec">
                  <button className="ai-back" onClick={() => setSideView("chats")}>
                    ← {lang === "bn" ? "পেছনে" : "Back"}
                  </button>
                  <h3 className="ai-set-h">{lang === "bn" ? "সেটিংস" : "Settings"}</h3>
                </div>
                <div className="ai-set-row">
                  <span className="ai-set-lb">
                    <Icon name={theme === "light" ? "sun" : "moon"} size={16} />
                    {t("theme")}
                  </span>
                  <div className="theme-seg">
                    {(["light", "dark", "system"] as const).map((m) => (
                      <button
                        key={m}
                        className={theme === m ? "on" : ""}
                        onClick={() => setTheme(m as "light" | "dark" | "system")}
                        aria-label={m}
                      >
                        <Icon name={m === "light" ? "sun" : m === "dark" ? "moon" : "system"} size={14} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ai-set-row">
                  <span className="ai-set-lb">
                    <Icon name="globe" size={16} />
                    {t("language")}
                  </span>
                  <div className="theme-seg">
                    <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>
                      EN
                    </button>
                    <button className={lang === "bn" ? "on" : ""} onClick={() => setLang("bn")}>
                      বাং
                    </button>
                  </div>
                </div>
                <button className="ai-set-row ai-set-toggle" onClick={toggleVoice}>
                  <span className="ai-set-lb">
                    <Icon name="volume" size={16} />
                    {lang === "bn" ? "উত্তর শুনুন" : "Voice replies"}
                  </span>
                  <span className={`switch${voiceOn ? " on" : ""}`} />
                </button>
                <div className="ai-set-row">
                  <span className="ai-set-lb">
                    <Icon name="edit" size={16} />
                    {lang === "bn" ? "লেখার সাইজ" : "Text size"}
                  </span>
                  <div className="theme-seg">
                    {(["s", "m", "l"] as const).map((s) => (
                      <button
                        key={s}
                        className={textSize === s ? "on" : ""}
                        onClick={() => {
                          setTextSize(s);
                          setStored("lk-ai-tsize", s);
                        }}
                      >
                        {s === "s" ? "A−" : s === "l" ? "A＋" : "A"}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  className="ai-set-row ai-set-toggle"
                  onClick={() => {
                    setShowSugg((v) => {
                      setStored("lk-ai-sugg", v ? "0" : "1");
                      return !v;
                    });
                  }}
                >
                  <span className="ai-set-lb">
                    <Icon name="book" size={16} />
                    {lang === "bn" ? "সাজেশন দেখাও" : "Show suggestions"}
                  </span>
                  <span className={`switch${showSugg ? " on" : ""}`} />
                </button>
                <div className="ai-set-row">
                  <span className="ai-set-lb">
                    <Icon name="ai" size={16} />
                    {lang === "bn" ? "মডেল" : "Model"}
                  </span>
                  <select
                    className="ai-model-sel"
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      setModelState(e.target.value);
                    }}
                  >
                    {(models.length ? models : [model || "gemini-3.5-flash"]).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="ai-set-row"
                  onClick={() => {
                    try {
                      ["lk-ai-voice", "lk-ai-tsize", "lk-ai-enter", "lk-ai-sugg"].forEach((k) =>
                        window.localStorage.removeItem(k)
                      );
                    } catch {}
                    setVoiceOn(false);
                    setTextSize("m");
                    setShowSugg(true);
                  }}
                >
                  <span className="ai-set-lb">
                    <Icon name="x" size={16} />
                    {lang === "bn" ? "সেটিংস রিসেট" : "Reset settings"}
                  </span>
                </button>
                <button
                  className="ai-set-row"
                  onClick={() => {
                    setChats([]);
                    setActiveId("");
                    setMsgs([]);
                    setView("home");
                  }}
                >
                  <span className="ai-set-lb danger">
                    <Icon name="x" size={16} />
                    {t("deleteLbl")} · {lang === "bn" ? "সব চ্যাট" : "all chats"}
                  </span>
                </button>
                <button
                  className="ai-set-row"
                  onClick={() => {
                    try {
                      window.localStorage.removeItem("lk-ai-consent");
                      window.localStorage.removeItem(LS_KEY);
                    } catch {}
                    setChats([]);
                    setConsent("");
                  }}
                >
                  <span className="ai-set-lb">
                    <Icon name="edit" size={16} />
                    {lang === "bn" ? "কুকি পছন্দ বদলাও" : "Change cookie choice"}
                  </span>
                </button>
                <p className="ai-set-ver">Lekhoni AI · v1.0</p>
              </div>
            ) : (
              <>
            <div className="ai-side-sec">
              <span className="menu-label">{t("theme")}</span>
              <div className="theme-seg">
                {(["light", "dark"] as const).map((m) => (
                  <button
                    key={m}
                    className={theme === m ? "on" : ""}
                    onClick={() => setTheme(m as "light" | "dark")}
                    aria-label={m}
                  >
                    <Icon name={m === "light" ? "sun" : "moon"} size={14} />
                  </button>
                ))}
              </div>
            </div>
            <div className="ai-side-sec">
              <span className="menu-label">{t("language")}</span>
              <div className="theme-seg">
                <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>
                  EN
                </button>
                <button className={lang === "bn" ? "on" : ""} onClick={() => setLang("bn")}>
                  বাং
                </button>
              </div>
            </div>
            {pinned.length > 0 && (
              <div className="ai-side-sec">
                <span className="menu-label">{t("pinnedLbl")}</span>
                {pinned.map(chatRow)}
              </div>
            )}
            <div className="ai-side-sec" style={{ flex: 1 }}>
              <span className="menu-label">{lang === "bn" ? "সাম্প্রতিক" : "Recent"}</span>
              {recent.length === 0 && <p className="ai-side-empty">—</p>}
              {recent.map(chatRow)}
            </div>
            <div className="ai-profile">
              <button className="ai-profile-row ai-profile-btn" onClick={() => setSideView("settings")}>
                <span className="ai-profile-gear" aria-label="Settings">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </span>
                <span className="ai-profile-name">{lang === "bn" ? "সেটিংস" : "Settings"}</span>
              </button>
            </div>
              </>
            )}
          </aside>
        </>
      )}

      {view === "home" && msgs.length === 0 ? (
        <div className="ai-full-home">
          <h1>{lang === "bn" ? "কী সাহায্য করতে পারি?" : "How can I help?"}</h1>
          <div className="ai-menu">
            {features.map((f) => (
              <button key={f.en} className="ai-feat" onClick={() => ask(f.bn)}>
                <Icon name={f.icon as "bookOpen" | "edit" | "book" | "globe"} size={20} />
                <span>{lang === "bn" ? f.bn : f.en}</span>
              </button>
            ))}
          </div>
          {showSugg && <div style={{ display: "none" }} />}
        </div>
      ) : (
        <div
          className="ai-body ai-full-body"
          ref={bodyRef}
          style={{ fontSize: textSize === "s" ? 13 : textSize === "l" ? 16 : undefined }}
        >
          {msgs.map((m, i) =>
            m.role === "user" ? (
              m.image ? (
                <div key={i} className="ai-sent">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.image} alt="" className="ai-sent-img" />
                  {m.text ? <div className="ai-u">{m.text}</div> : null}
                </div>
              ) : (
                <div key={i} className="ai-u">
                  <span>{m.text}</span>
                </div>
              )
            ) : (
              <div key={i} className="ai-a-wrap">
                <div className="ai-a" onClick={onAiBodyClick}>{renderAi(m.text, `m${i}`)}</div>
                <div className="ai-acts">
                  <button
                    onClick={() => copyMsg(m.text, i)}
                    aria-label="Copy"
                    className={copiedIdx === i ? "on" : ""}
                  >
                    {copiedIdx === i ? "✓" : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setVotes((v) => ({ ...v, [i]: v[i] === "up" ? undefined as never : "up" }))}
                    aria-label="Like"
                    className={votes[i] === "up" ? "on" : ""}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={votes[i] === "up" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setVotes((v) => ({ ...v, [i]: v[i] === "down" ? undefined as never : "down" }))}
                    aria-label="Unlike"
                    className={votes[i] === "down" ? "on" : ""}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={votes[i] === "down" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: "rotate(180deg)" }}>
                      <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" />
                    </svg>
                  </button>
                  <button onClick={() => speakMsg(m.text)} aria-label="Listen">
                    <Icon name="volume" size={14} />
                  </button>
                  <button onClick={() => retryMsg(i)} aria-label="Retry">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          )}
          {busy && (
            <div className="ai-a ai-typing">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
      )}
      {view === "chat" && followUps.length > 0 && !busy && (
        <div className="ai-follow">
          {followUps.slice(0, 3).map((s) => (
            <button key={s} onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {toast ? (
        <div className="ai-toast" role="status">
          {toast}
        </div>
      ) : null}
      {voiceMode && (
        <VoiceMode
          seed={msgs.slice(-10)}
          onExchange={handleVoiceExchange}
          onClose={() => setVoiceMode(false)}
        />
      )}
      {pending && (
        <div className="ai-attach">
          {pending.file.type.startsWith("image/") ? (
            <span className="ai-attach-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pending.url} alt="" />
              <button onClick={removePending} aria-label="Remove">
                ×
              </button>
            </span>
          ) : (
            <span className="ai-attach-file">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              <span className="ai-attach-name">{pending.file.name}</span>
              <button onClick={removePending} aria-label="Remove">
                ×
              </button>
            </span>
          )}
        </div>
      )}
      <div className="ai-full-input">
        <button
          className="ai-in-plus"
          onClick={() => fileRef.current?.click()}
          aria-label="Attach"
        >
          +
        </button>
        <textarea
          value={input}
          rows={1}
          onChange={(e) => setInput(e.target.value)}
          placeholder={phText || (lang === "bn" ? PH_STATIC_BN : PH_STATIC_EN)}
        />
        <button
          className={`ai-in-mic${voiceMode ? " on" : ""}`}
          onClick={openVoice}
          aria-label="Voice"
        >
          <Icon name="volume" size={16} />
        </button>
          <button
            className="ai-in-send"
            onClick={() => ask(input)}
            disabled={busy || (!input.trim() && !pending)}
            aria-label="Send"
          >
            →
          </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf,.txt"
          style={{ display: "none" }}
          onChange={(e) => {
            onFile(e.target.files?.[0] || null);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
