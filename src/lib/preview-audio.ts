import fs from "fs";
import path from "path";

/**
 * Preview streams may only serve .mp3 files under storage/audio/.
 * Rejects traversal, .wav, stems, and anything outside that directory.
 */
export function resolvePreviewMp3(
  userPath: string
): { ok: true; abs: string } | { ok: false; reason: "bad" | "missing" } {
  if (!userPath || userPath.includes("\0")) return { ok: false, reason: "bad" };
  const normalized = userPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) return { ok: false, reason: "bad" };
  if (!normalized.toLowerCase().endsWith(".mp3")) return { ok: false, reason: "bad" };

  const cwd = process.cwd();
  const audioRoot = path.resolve(cwd, "storage", "audio");

  let abs: string;
  if (normalized.toLowerCase().startsWith("storage/audio/")) {
    abs = path.resolve(cwd, normalized);
  } else {
    // /api/audio/[...path] joins under storage/
    abs = path.resolve(cwd, "storage", normalized);
  }

  const rootPrefix = audioRoot.endsWith(path.sep) ? audioRoot : audioRoot + path.sep;
  if (abs !== audioRoot && !abs.startsWith(rootPrefix)) {
    return { ok: false, reason: "bad" };
  }
  if (!abs.toLowerCase().endsWith(".mp3")) {
    return { ok: false, reason: "bad" };
  }
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    return { ok: false, reason: "missing" };
  }
  try {
    const real = fs.realpathSync(abs);
    const realRoot = fs.existsSync(audioRoot) ? fs.realpathSync(audioRoot) : audioRoot;
    const realPrefix = realRoot.endsWith(path.sep) ? realRoot : realRoot + path.sep;
    if (real !== realRoot && !real.startsWith(realPrefix)) {
      return { ok: false, reason: "bad" };
    }
    return { ok: true, abs: real };
  } catch {
    return { ok: false, reason: "missing" };
  }
}
