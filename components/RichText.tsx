// Minimal markdown-lite renderer for chapters: **bold**, *italic*,
// ==highlight==, ## heading, - list, > quote. Escapes HTML first.
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const AI_ROUTES = ["writers", "books", "categories", "search", "write", "account", "dashboard", "about", "contact", "privacy"];

function linkifyRoutes(h: string): string {
  return h.replace(/(^|[\s(>])\/(writers|books|categories|search|write|account|dashboard|about|contact|privacy)(?=[\s)<.,!?:;]|$)/g, (_m, pre, route) => {
    const label = route === "writers" ? "Writers" : route.charAt(0).toUpperCase() + route.slice(1);
    return `${pre}<a class="ai-lnk" href="/${route}">${label} <span class="ai-ext">↗</span></a>`;
  });
}
function inline(s: string): string {
  let h = esc(s);
  h = linkifyRoutes(h);
  h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/(^|\W)\*([^*\n]+?)\*/g, "$1<em>$2</em>");
  h = h.replace(/==(.+?)==/g, "<mark>$1</mark>");
  h = h.replace(/~~(.+?)~~/g, "<del>$1</del>");
  h = h.replace(/`([^`\n]+?)`/g, "<code>$1</code>");
  return h;
}

export function renderRich(body: string | null | undefined): string {  const lines = (body || "").split("\n");
  let html = "";
  let inList = false;
  const closeList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      html += `<h3 class="rich-h">${inline(line.slice(3))}</h3>`;
    } else if (/^(-{3,}|\*{3,})$/.test(line)) {
      closeList();
      html += `<hr class="rich-hr" />`;
    } else if (line.startsWith("- ")) {
      if (!inList) {
        html += "<ul class=\"rich-ul\">";
        inList = true;
      }
      html += `<li>${inline(line.slice(2))}</li>`;
    } else if (line.startsWith("> ")) {
      closeList();
      html += `<blockquote class="rich-quote">${inline(line.slice(2))}</blockquote>`;
    } else {
      closeList();
      html += `<p>${inline(line)}</p>`;
    }
  }
  closeList();
  return html;
}

export default function RichText({ body }: { body: string | null | undefined }) {
  return <div className="rich-body" dangerouslySetInnerHTML={{ __html: renderRich(body) }} />;
}

// AI chat markdown: **bold**, *italic*, `code`, ==mark==, ~~strike~~,
// ###/## headings, "- " bullets, "1. " numbered, "> " quotes.
export function renderAiMd(body: string | null | undefined): string {
  const lines = (body || "").split("\n");
  let html = "";
  let list: string | null = null;
  let inCode = false;
  let codeLang = "";
  let codeBuf: string[] = [];
  const close = () => {
    if (list) {
      html += list === "ul" ? "</ul>" : "</ol>";
      list = null;
    }
  };
  const flushCode = () => {
    if (!inCode) return;
    inCode = false;
    const raw = codeBuf.join("\n");
    const enc = encodeURIComponent(raw);
    html += `<div class="ai-codeblock"><div class="ai-codebar"><span>${esc(codeLang) || "code"}</span><button data-copy="${enc}">Copy</button></div><pre class="ai-code"><code>${esc(raw)}</code></pre></div>`;
    codeBuf = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (/^```/.test(line)) {
      if (inCode) {
        flushCode();
      } else {
        close();
        inCode = true;
        codeLang = line.slice(3).trim();
        codeBuf = [];
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(raw.replace(/\n$/, ""));
      continue;
    }
    if (!line) {
      close();
      continue;
    }
    const h3 = line.match(/^#{1,3}\s+(.*)/);
    const ul = line.match(/^[-*•]\s+(.*)/);
    const ol = line.match(/^\d+[.)]\s+(.*)/);
    const qu = line.match(/^&gt;|^>/);
    if (h3) {
      close();
      html += `<h4 class="ai-md-h">${inline(h3[1])}</h4>`;
    } else if (ul) {
      if (list !== "ul") {
        close();
        html += '<ul class="ai-md-ul">';
        list = "ul";
      }
      html += `<li>${inline(ul[1])}</li>`;
    } else if (ol) {
      if (list !== "ol") {
        close();
        html += '<ol class="ai-md-ol">';
        list = "ol";
      }
      html += `<li>${inline(ol[1])}</li>`;
    } else if (qu) {
      close();
      html += `<blockquote class="rich-quote">${inline(line.replace(/^(&gt;|>)\s?/, ""))}</blockquote>`;
    } else {
      close();
      html += `<p>${inline(line)}</p>`;
    }
  }
  close();
  flushCode();
  return html;
}
