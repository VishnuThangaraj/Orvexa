import React from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextRendererProps {
  content: string;
  isGroup?: boolean;
  className?: string;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content,
  isGroup = false,
  className = "",
}) => {
  if (!content) return null;

  // Render inline formatting: code, url, bold, italic, strikethrough, mentions
  const renderInline = (text: string, keyPrefix: string): React.ReactNode[] => {
    // Regex matching:
    // 1. Inline code: `...`
    // 2. URLs: https?://...
    // 3. Mentions: @something (only if isGroup)
    // 4. Bold: *...*
    // 5. Italic: _..._
    // 6. Strikethrough: ~...~
    const inlineRegex =
      /(`[^`\n]+`)|(https?:\/\/[^\s<>"'()]+)|(@[a-zA-Z0-9_.-]+)|(\*(?!\s)[^*\n]+?(?<!\s)\*)|(_(?!\s)[^_\n]+?(?<!\s)_)|(~(?!\s)[^~\n]+?(?<!\s)~)/g;

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = inlineRegex.exec(text)) !== null) {
      // Push preceding plain text
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index));
      }

      const matchText = match[0];
      const key = `${keyPrefix}-${match.index}`;

      if (match[1]) {
        // Inline code
        const code = matchText.slice(1, -1);
        nodes.push(
          <code
            key={key}
            className="px-1.5 py-0.5 rounded font-mono text-[11.5px] bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-slate-700/60 select-text"
          >
            {code}
          </code>,
        );
      } else if (match[2]) {
        // Auto-linked URL (strictly enforce http/https protocol for security)
        const isSafeProtocol = /^https?:\/\//i.test(matchText);
        if (isSafeProtocol) {
          nodes.push(
            <a
              key={key}
              href={matchText}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0b57d0] dark:text-[#a8c7fa] hover:underline underline-offset-2 break-all inline-block select-text"
              onClick={(e) => e.stopPropagation()}
            >
              {matchText}
            </a>,
          );
        } else {
          nodes.push(matchText);
        }
      } else if (match[3]) {
        // Mention (@mention)
        if (isGroup) {
          nodes.push(
            <span
              key={key}
              className="bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-semibold px-1.5 py-0.5 rounded-md inline-flex items-center text-xs mx-0.5 select-text"
            >
              {matchText}
            </span>,
          );
        } else {
          nodes.push(matchText);
        }
      } else if (match[4]) {
        // Bold (*text*)
        const boldInner = matchText.slice(1, -1);
        nodes.push(
          <strong key={key} className="font-bold">
            {boldInner}
          </strong>,
        );
      } else if (match[5]) {
        // Italic (_text_)
        const italicInner = matchText.slice(1, -1);
        nodes.push(
          <em key={key} className="italic">
            {italicInner}
          </em>,
        );
      } else if (match[6]) {
        // Strikethrough (~text~)
        const strikeInner = matchText.slice(1, -1);
        nodes.push(
          <del key={key} className="line-through opacity-80">
            {strikeInner}
          </del>,
        );
      }

      lastIndex = inlineRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex));
    }

    return nodes;
  };

  // Parse lines and extract block structures: Fenced Code Blocks, Blockquotes, Lists
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Fenced Code Block: ```[lang]
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```

      const codeString = codeLines.join("\n");
      elements.push(
        <CodeBlock key={`codeblock-${i}`} code={codeString} lang={lang} />,
      );
      continue;
    }

    // 2. Blockquote: > text
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [line.slice(2)];
      i++;
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-3 border-[#0b57d0]/60 dark:border-[#a8c7fa]/60 pl-3 py-0.5 my-1.5 italic text-slate-700 dark:text-slate-300 text-xs bg-black/5 dark:bg-white/5 rounded-r-md"
        >
          {quoteLines.map((ql, qIdx) => (
            <div key={qIdx}>{renderInline(ql, `ql-${i}-${qIdx}`)}</div>
          ))}
        </blockquote>,
      );
      continue;
    }

    // 3. Bulleted List: - item or * item
    if (line.match(/^(\s*)[-*]\s+(.+)/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^(\s*)[-*]\s+(.+)/)) {
        const itemMatch = lines[i].match(/^(\s*)[-*]\s+(.+)/);
        if (itemMatch) {
          listItems.push(itemMatch[2]);
        }
        i++;
      }
      elements.push(
        <ul
          key={`list-${i}`}
          className="list-disc list-inside space-y-0.5 my-1 pl-1 text-xs select-text"
        >
          {listItems.map((item, lIdx) => (
            <li key={lIdx}>{renderInline(item, `li-${i}-${lIdx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // 4. Regular Paragraph Line
    elements.push(
      <span key={`p-${i}`} className="block select-text">
        {line.trim() === "" ? (
          <span className="inline-block h-3" />
        ) : (
          renderInline(line, `inline-${i}`)
        )}
      </span>,
    );
    i++;
  }

  return (
    <div className={cn("leading-relaxed break-words text-sm", className)}>
      {elements}
    </div>
  );
};

interface CodeBlockProps {
  code: string;
  lang?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, lang }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2 rounded-xl overflow-hidden bg-slate-900 text-slate-100 border border-slate-800 text-xs font-mono shadow-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/70 border-b border-slate-800/80 text-[11px] text-slate-400 select-none">
        <span className="uppercase tracking-wider font-semibold">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[12px] leading-relaxed select-text font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default RichTextRenderer;
