import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

// Simple fast syntax highlighting regex tokenizer for common languages
function highlightCode(rawCode: string, lang: string): React.ReactNode[] {
  const lines = rawCode.split('\n');

  return lines.map((line, lineIdx) => {
    // Process tokens in each line
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    // Regex for basic syntax tokens: comments, strings, keywords, numbers, function calls
    const commentRegex = /^(\/\/.*|#.*|\/\*.*?\*\/)/;
    const stringRegex = /^("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`)/;
    const keywordRegex = /^(import|export|from|default|const|let|var|function|return|if|else|for|while|switch|case|break|continue|class|interface|type|extends|implements|async|await|try|catch|finally|throw|new|this|typeof|instanceof|def|elif|lambda|yield|struct|fn|pub|impl|select|from|where|insert|into|update|delete)\b/;
    const numberRegex = /^(0x[0-9a-fA-F]+|\d+(?:\.\d+)?)/;
    const booleanRegex = /^(true|false|null|undefined|None|True|False)\b/;
    const functionCallRegex = /^([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/;
    const whitespaceRegex = /^\s+/;
    const wordRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*/;
    const punctuationRegex = /^[^a-zA-Z0-9_$\s"'/`]+/;

    while (remaining.length > 0) {
      let match;
      if ((match = remaining.match(whitespaceRegex))) {
        tokens.push(<span key={keyIdx++}>{match[0]}</span>);
        remaining = remaining.slice(match[0].length);
      } else if ((match = remaining.match(commentRegex))) {
        tokens.push(
          <span key={keyIdx++} className="text-slate-500 italic">
            {match[0]}
          </span>
        );
        remaining = remaining.slice(match[0].length);
      } else if ((match = remaining.match(stringRegex))) {
        tokens.push(
          <span key={keyIdx++} className="text-emerald-400">
            {match[0]}
          </span>
        );
        remaining = remaining.slice(match[0].length);
      } else if ((match = remaining.match(keywordRegex))) {
        tokens.push(
          <span key={keyIdx++} className="text-purple-400 font-medium">
            {match[0]}
          </span>
        );
        remaining = remaining.slice(match[0].length);
      } else if ((match = remaining.match(booleanRegex))) {
        tokens.push(
          <span key={keyIdx++} className="text-amber-400">
            {match[0]}
          </span>
        );
        remaining = remaining.slice(match[0].length);
      } else if ((match = remaining.match(numberRegex))) {
        tokens.push(
          <span key={keyIdx++} className="text-amber-300">
            {match[0]}
          </span>
        );
        remaining = remaining.slice(match[0].length);
      } else if ((match = remaining.match(functionCallRegex))) {
        tokens.push(
          <span key={keyIdx++} className="text-sky-400">
            {match[0]}
          </span>
        );
        remaining = remaining.slice(match[0].length);
      } else if ((match = remaining.match(wordRegex))) {
        tokens.push(
          <span key={keyIdx++} className="text-slate-200">
            {match[0]}
          </span>
        );
        remaining = remaining.slice(match[0].length);
      } else if ((match = remaining.match(punctuationRegex))) {
        tokens.push(
          <span key={keyIdx++} className="text-slate-400">
            {match[0]}
          </span>
        );
        remaining = remaining.slice(match[0].length);
      } else {
        tokens.push(<span key={keyIdx++}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
      }
    }

    return (
      <div key={lineIdx} className="table-row">
        <span className="table-cell select-none pr-4 text-right text-xs text-slate-600 font-mono w-8">
          {lineIdx + 1}
        </span>
        <span className="table-cell whitespace-pre font-mono text-[13px] leading-relaxed">
          {tokens.length > 0 ? tokens : ' '}
        </span>
      </div>
    );
  });
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanLang = lang.trim().toLowerCase() || 'text';

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-800 bg-[#0c121e] shadow-md">
      {/* Code Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/70 px-3.5 py-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono text-slate-300 font-medium">{cleanLang}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="overflow-x-auto p-3 text-slate-200">
        <div className="table w-full">{highlightCode(code, cleanLang)}</div>
      </div>
    </div>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Parse blocks: code fences vs text blocks
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore.trim()) {
      parts.push(<RenderFormattedText key={`txt_${lastIndex}`} text={textBefore} />);
    }

    const lang = match[1] || 'text';
    const code = match[2];
    parts.push(<CodeBlock key={`code_${match.index}`} code={code} lang={lang} />);

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push(<RenderFormattedText key={`txt_${lastIndex}`} text={remainingText} />);
  }

  return <div className="space-y-2 leading-relaxed text-[15px]">{parts}</div>;
}

function RenderFormattedText({ text }: { text: string }) {
  // Split into paragraphs / lines
  const paragraphs = text.split('\n\n');

  return (
    <>
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Check headers
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-semibold text-slate-100 mt-3 mb-1">
              {renderInlineStyles(trimmed.slice(4))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg font-bold text-slate-100 mt-4 mb-2">
              {renderInlineStyles(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-xl font-bold text-white mt-4 mb-2">
              {renderInlineStyles(trimmed.slice(2))}
            </h1>
          );
        }

        // Check blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={idx}
              className="border-l-2 border-indigo-500/60 pl-3 py-1 my-2 text-slate-400 italic bg-slate-900/40 rounded-r-lg"
            >
              {renderInlineStyles(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Check bullet lists
        const lines = trimmed.split('\n');
        const isList = lines.every(l => l.trim().startsWith('- ') || l.trim().startsWith('* ') || /^\d+\.\s/.test(l.trim()));

        if (isList && lines.length > 1) {
          return (
            <ul key={idx} className="space-y-1 my-2 pl-4 list-disc text-slate-300">
              {lines.map((l, lineIdx) => {
                const cleanItem = l.trim().replace(/^[-*]\s+|\d+\.\s+/, '');
                return <li key={lineIdx}>{renderInlineStyles(cleanItem)}</li>;
              })}
            </ul>
          );
        }

        return (
          <p key={idx} className="text-slate-200">
            {lines.map((l, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInlineStyles(l)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

function renderInlineStyles(text: string): React.ReactNode[] {
  // Parse inline elements: `code`, **bold**, *italic*
  const elements: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      elements.push(
        <code
          key={keyIdx++}
          className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[13px] text-indigo-300 border border-slate-700/60"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      elements.push(
        <strong key={keyIdx++} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      elements.push(
        <em key={keyIdx++} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements.length > 0 ? elements : [text];
}
