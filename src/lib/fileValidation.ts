/**
 * Verifies a file's actual content matches its claimed type, by checking its
 * "magic bytes" (file signature) - the browser-reported MIME type can be
 * spoofed trivially (it's just a form field), so trusting it alone means
 * someone could rename a script or executable to look like a PDF/image and
 * have it accepted. This is a free, zero-dependency defense: no external
 * antivirus/scanning service required.
 *
 * For defense in depth beyond this, see the optional VirusTotal hash-check
 * in checkVirusTotal() below (also free, but requires a free API key -
 * skipped automatically if VIRUSTOTAL_API_KEY isn't set).
 */

const SIGNATURES: { mime: string; check: (bytes: Uint8Array) => boolean }[] = [
  { mime: "application/pdf", check: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 }, // %PDF
  { mime: "image/jpeg", check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    mime: "image/webp",
    check: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

export async function verifyFileSignature(file: File, claimedType: string): Promise<{ valid: boolean; reason?: string }> {
  const buffer = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  const expected = SIGNATURES.find((s) => s.mime === claimedType);
  if (!expected) {
    return { valid: false, reason: `Unsupported file type: ${claimedType}` };
  }
  if (!expected.check(buffer)) {
    return { valid: false, reason: "File content does not match its claimed type - the file may be corrupted, mislabeled, or disguised." };
  }
  return { valid: true };
}

/**
 * Optional extra layer: looks up the file's hash against VirusTotal's free
 * public API (no cost, but requires signing up for a free API key at
 * virustotal.com and setting VIRUSTOTAL_API_KEY). If the key isn't set, this
 * is skipped entirely and verifyFileSignature() above is the only check -
 * which is already a real improvement over the previous "trust the browser"
 * behavior.
 */
export async function checkVirusTotal(file: File): Promise<{ checked: boolean; malicious: boolean; detail: string }> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return { checked: false, malicious: false, detail: "VirusTotal not configured - skipped" };

  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const res = await fetch(`https://www.virustotal.com/api/v3/files/${hashHex}`, {
      headers: { "x-apikey": apiKey },
    });

    if (res.status === 404) {
      // VirusTotal has never seen this exact file before - not itself
      // suspicious (most legitimate documents are unique), just unscored.
      return { checked: true, malicious: false, detail: "File not previously seen by VirusTotal (not necessarily unsafe)" };
    }
    if (!res.ok) {
      return { checked: false, malicious: false, detail: `VirusTotal lookup failed (${res.status}) - skipped` };
    }

    const data = await res.json();
    const stats = data?.data?.attributes?.last_analysis_stats;
    const malicious = (stats?.malicious || 0) > 0;
    return {
      checked: true,
      malicious,
      detail: malicious ? `Flagged malicious by ${stats.malicious} engine(s)` : "Clean per VirusTotal",
    };
  } catch (e: any) {
    return { checked: false, malicious: false, detail: `VirusTotal check errored: ${e.message}` };
  }
}
