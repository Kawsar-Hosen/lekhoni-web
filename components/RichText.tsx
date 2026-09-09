// Minimal markdown-lite renderer for chapters: **bold**, *italic*,
// ==highlight==, ## heading, - list, > quote. Escapes HTML first.
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  let h = esc(s);
  h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/(^|\W)\*([^*\n]+?)\*/g, "$1<em>$2</em>");
  h = h.replace(/==(.+?)==/g, "<mark>$1</mark>");
  return h;
}

export function renderRich(body: string): string {
  const lines = body.split("\n");
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

export default function RichText({ body }: { body: string }) {
  return <div className="rich-body" dangerouslySetInnerHTML={{ __html: renderRich(body) }} />;
}
