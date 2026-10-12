/**
 * JSON parsing with precise, browser-independent error locations.
 *
 * `JSON.parse` error messages differ between V8, SpiderMonkey and JavaScriptCore and
 * only some include a position. For a validator the location is the whole point, so on
 * failure we re-scan the text with a tiny strict JSON scanner that reports line/column
 * and a human explanation of the most common JSON-LD mistakes (trailing commas,
 * single quotes, comments, raw line breaks inside strings, smart quotes).
 */

export type JsonParseError = {
  message: string;
  /** 1-based. */
  line: number;
  /** 1-based. */
  column: number;
  offset: number;
  /** The offending line plus one line of context either side, for display. */
  excerpt: { line: number; text: string }[];
};

export type JsonParseResult = { ok: true; value: unknown; notes: string[] } | { ok: false; error: JsonParseError; notes: string[] };

/**
 * Wrappers that CMSs put inside <script type="application/ld+json">: HTML comments and
 * CDATA sections. Google tolerates them, strict JSON does not, so we strip and note.
 */
export function unwrapScriptText(raw: string): { text: string; notes: string[] } {
  const notes: string[] = [];
  let text = raw.replace(/^﻿/, "");
  const trimmed = text.trim();
  const cdata = trimmed.match(/^(?:\/\/\s*)?<!\[CDATA\[([\s\S]*?)(?:\/\/\s*)?\]\]>$/);
  if (cdata) {
    text = cdata[1];
    notes.push("The block is wrapped in a CDATA section. Search engines tolerate it, but it is unnecessary in HTML5.");
  }
  const comment = text.trim().match(/^<!--([\s\S]*?)-->$/);
  if (comment) {
    text = comment[1];
    notes.push("The block is wrapped in an HTML comment. Remove the <!-- --> wrapper.");
  }
  return { text, notes };
}

function lineCol(text: string, offset: number) {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === "\n") {
      line++;
      col = 1;
    } else col++;
  }
  return { line, column: col };
}

function excerptAround(text: string, line: number) {
  const lines = text.split("\n");
  const out: { line: number; text: string }[] = [];
  for (let l = Math.max(1, line - 1); l <= Math.min(lines.length, line + 1); l++) out.push({ line: l, text: lines[l - 1].replace(/\r$/, "").slice(0, 240) });
  return out;
}

class ScanError extends Error {
  constructor(
    message: string,
    public offset: number,
  ) {
    super(message);
  }
}

/** Strict JSON scanner that only exists to locate and explain the first error. */
function scan(text: string): void {
  let i = 0;
  const n = text.length;

  const ws = () => {
    while (i < n) {
      const c = text[i];
      if (c === " " || c === "\t" || c === "\n" || c === "\r") i++;
      else if (c === "/" && (text[i + 1] === "/" || text[i + 1] === "*")) throw new ScanError("Comments are not allowed in JSON. Remove the // or /* */ comment.", i);
      else break;
    }
  };

  const describe = (c: string | undefined) => (c === undefined ? "the end of the text" : c === "\n" ? "a line break" : `"${c}"`);

  const str = () => {
    const quote = text[i];
    if (quote === "'") throw new ScanError("Strings must use double quotes (\"), not single quotes.", i);
    if (quote === "“" || quote === "”") throw new ScanError("Curly “smart quotes” are not valid JSON. Replace them with straight double quotes (\").", i);
    if (quote !== '"') throw new ScanError(`Expected a string in double quotes but found ${describe(quote)}.`, i);
    i++;
    while (i < n) {
      const c = text[i];
      if (c === '"') {
        i++;
        return;
      }
      if (c === "\\") {
        const e = text[i + 1];
        if (e === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) throw new ScanError("Invalid \\u escape: it needs exactly four hex digits.", i);
          i += 6;
          continue;
        }
        if (!e || !'"\\/bfnrt'.includes(e)) throw new ScanError(`Invalid escape sequence "\\${e ?? ""}" inside a string.`, i);
        i += 2;
        continue;
      }
      if (c === "\n" || c === "\r") throw new ScanError("Unescaped line break inside a string. Use \\n or keep the text on one line.", i);
      if (c < " ") throw new ScanError("Unescaped control character (such as a tab) inside a string.", i);
      i++;
    }
    throw new ScanError("A string is never closed: a closing double quote is missing.", i);
  };

  const num = () => {
    const m = text.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!m) throw new ScanError(`Invalid number starting with ${describe(text[i])}.`, i);
    i += m[0].length;
  };

  const lit = () => {
    for (const w of ["true", "false", "null"]) {
      if (text.startsWith(w, i)) {
        i += w.length;
        return;
      }
    }
    const word = text.slice(i).match(/^[A-Za-z_$][\w$]*/)?.[0];
    if (word === "undefined" || word === "NaN" || word === "Infinity") throw new ScanError(`"${word}" is not a JSON value. Use null, a number or a quoted string.`, i);
    if (word) throw new ScanError(`Unexpected word "${word}". Text values must be wrapped in double quotes.`, i);
    throw new ScanError(`Unexpected ${describe(text[i])}.`, i);
  };

  const value = (depth: number): void => {
    if (depth > 512) throw new ScanError("Nesting is too deep.", i);
    ws();
    const c = text[i];
    if (c === "{") return obj(depth);
    if (c === "[") return arr(depth);
    if (c === '"' || c === "'" || c === "“" || c === "”") return str();
    if (c === "-" || (c >= "0" && c <= "9")) return num();
    if (c === undefined) throw new ScanError("The JSON ends too early: a value is missing.", i);
    lit();
  };

  const obj = (depth: number) => {
    i++; // {
    ws();
    if (text[i] === "}") {
      i++;
      return;
    }
    while (true) {
      ws();
      if (text[i] === "}") throw new ScanError("Trailing comma before }. Remove the comma after the last property.", i);
      const keyStart = i;
      if (text[i] !== '"' && text[i] !== "'" && text[i] !== "“" && /[A-Za-z_@$]/.test(text[i] ?? "")) {
        throw new ScanError("Property names must be wrapped in double quotes.", keyStart);
      }
      str();
      ws();
      if (text[i] !== ":") throw new ScanError(`Expected ":" after a property name but found ${describe(text[i])}.`, i);
      i++;
      value(depth + 1);
      ws();
      if (text[i] === ",") {
        i++;
        continue;
      }
      if (text[i] === "}") {
        i++;
        return;
      }
      if (text[i] === '"') throw new ScanError("Missing comma between two properties.", i);
      throw new ScanError(`Expected "," or "}" after a property value but found ${describe(text[i])}.`, i);
    }
  };

  const arr = (depth: number) => {
    i++; // [
    ws();
    if (text[i] === "]") {
      i++;
      return;
    }
    while (true) {
      ws();
      if (text[i] === "]") throw new ScanError("Trailing comma before ]. Remove the comma after the last item.", i);
      value(depth + 1);
      ws();
      if (text[i] === ",") {
        i++;
        continue;
      }
      if (text[i] === "]") {
        i++;
        return;
      }
      if (text[i] === "{" || text[i] === '"') throw new ScanError("Missing comma between two array items.", i);
      throw new ScanError(`Expected "," or "]" in a list but found ${describe(text[i])}.`, i);
    }
  };

  ws();
  if (i >= n) throw new ScanError("The block is empty.", 0);
  value(0);
  ws();
  if (i < n) {
    if (text[i] === "{" || text[i] === "[") throw new ScanError("Extra content after the end of the JSON. Two objects need to be wrapped in [ ] and separated by a comma, or put in separate script tags.", i);
    throw new ScanError(`Unexpected ${describe(text[i])} after the end of the JSON.`, i);
  }
}

/** Parses JSON, returning either the value or a located, explained error. */
export function parseJsonLocated(raw: string): JsonParseResult {
  const { text, notes } = unwrapScriptText(raw);
  try {
    return { ok: true, value: JSON.parse(text), notes };
  } catch (native) {
    let message = native instanceof Error ? native.message : "Invalid JSON.";
    let offset = 0;
    try {
      scan(text);
    } catch (e) {
      if (e instanceof ScanError) {
        message = e.message;
        offset = e.offset;
      }
    }
    const { line, column } = lineCol(text, offset);
    return { ok: false, error: { message, line, column, offset, excerpt: excerptAround(text, line) }, notes };
  }
}
