import { ALL_MOVES, type Move } from "~/data/moves";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

export type ScanErrorCode = "no_key" | "bad_key" | "api_error" | "parse_error";

export class ScanError extends Error {
  readonly code: ScanErrorCode;
  constructor(message: string, code: ScanErrorCode) {
    super(message);
    this.code = code;
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const [, base64] = (reader.result as string).split(",");
      if (!base64) reject(new Error("empty file"));
      else resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normaliseMediaType(file: File): string {
  const mt = file.type || "";
  if (!mt.startsWith("image/")) return "image/jpeg";
  if (mt === "image/jpg") return "image/jpeg";
  return mt;
}

async function callVision(key: string, file: File, prompt: string, maxTokens: number) {
  const base64 = await fileToBase64(file);
  const mediaType = normaliseMediaType(file);
  const resp = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });
  if (!resp.ok) {
    const errBody = (await resp.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    const detail = errBody.error?.message ?? `API error ${resp.status}`;
    if (resp.status === 401) throw new ScanError(detail, "bad_key");
    throw new ScanError(detail, "api_error");
  }
  const data = (await resp.json()) as {
    content: { text: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  return data;
}

function extractJson(text: string): unknown {
  const t = text.trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) throw new ScanError("no JSON object", "parse_error");
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    throw new ScanError("Could not parse response", "parse_error");
  }
}

export interface GameScreenScan {
  name?: string;
  level?: number;
  dex?: number;
  nature?: string;
  ability?: string;
  item?: string | null;
  gender?: "M" | "F";
  moves?: string[];
  stats?: { hp: number; atk: number; def: number; spatk: number; spdef: number; spe: number };
  ot_name?: string;
  ot_id?: number;
  trainer_memo?: string;
  pokeball?: string;
  shiny?: boolean;
  _inputTokens: number;
  _outputTokens: number;
}

const GAME_SCREEN_PROMPT =
  'FireRed/LeafGreen screenshot. Three possible screens — INFO: name/dex/gender/nature/item/OT name+OT ID/trainer memo/Poké Ball; SKILLS: ability + 6 max stats (not current HP); MOVES: name/level/4 moves. Return ONLY valid JSON, no extra text. Omit keys absent from this screen. Keys: name(str), level(int), dex(int), nature(str), ability(str), item(str|null), gender("M"|"F"), moves([name strings no PP]), stats({hp,atk,def,spatk,spdef,spe} ints), ot_name(str), ot_id(int), trainer_memo(str), pokeball(str), shiny(bool — true only if sprite color clearly differs from standard).';

export async function readGameScreen(key: string, file: File): Promise<GameScreenScan> {
  if (!key) throw new ScanError("No API key", "no_key");
  const data = await callVision(key, file, GAME_SCREEN_PROMPT, 256);
  const parsed = extractJson(data.content[0]?.text ?? "") as Partial<GameScreenScan>;
  return {
    ...parsed,
    _inputTokens: data.usage?.input_tokens ?? 0,
    _outputTokens: data.usage?.output_tokens ?? 0,
  };
}

export interface TmCaseScanRow {
  num: string;
  count: number;
}

export interface TmCaseScan {
  tms: TmCaseScanRow[];
  _inputTokens: number;
  _outputTokens: number;
}

const TM_CASE_PROMPT =
  'FireRed/LeafGreen TM Case screenshot. Read every visible TM or HM row and report it. For each row extract the number ("TM01".."TM50" or "HM01".."HM07") and the count on the right of the row (usually displayed after "x", e.g. "x2"; if no number shown, count is 1). Return ONLY valid JSON, no extra text. Shape: {"tms":[{"num":"TM24","count":1},{"num":"HM01","count":1}]}. Omit entries you cannot read confidently. Do not guess unseen TMs.';

const TM_NUM_RE = /^(TM(0[1-9]|[1-4][0-9]|50)|HM0[1-7])$/;

export async function readTMCase(key: string, file: File): Promise<TmCaseScan> {
  if (!key) throw new ScanError("No API key", "no_key");
  const data = await callVision(key, file, TM_CASE_PROMPT, 800);
  const parsed = extractJson(data.content[0]?.text ?? "") as {
    tms?: { num?: unknown; count?: unknown }[];
  };
  const valid = (parsed.tms ?? [])
    .filter((r) => r && typeof r.num === "string" && TM_NUM_RE.test(r.num))
    .map((r) => ({
      num: r.num as string,
      count: Math.max(1, Number(r.count) || 1),
    }));
  return {
    tms: valid,
    _inputTokens: data.usage?.input_tokens ?? 0,
    _outputTokens: data.usage?.output_tokens ?? 0,
  };
}

/** Fuzzy-match an OCR-returned move name to a known Move. */
export function fuzzyMatchMove(raw: string): Move | null {
  if (!raw || raw.length < 3) return null;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const n = norm(raw);
  const exact = ALL_MOVES.find((m) => norm(m.name) === n);
  if (exact) return exact;
  if (n.length < 4) return null;
  return (
    ALL_MOVES.find((m) => {
      const mn = norm(m.name);
      return mn.startsWith(n) || n.startsWith(mn);
    }) ?? null
  );
}
