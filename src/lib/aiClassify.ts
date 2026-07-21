import { DEFAULT_DEPARTMENTS } from "./masterData";

export interface ClassificationResult {
  departmentName: string; // must match one of DEFAULT_DEPARTMENTS.name
  confidence: number; // 0-1
  summary: string; // one or two line Marathi summary of the grievance
  urgency: "URGENT" | "NORMAL";
  urgencyReason: string; // brief Marathi reason (empty string if NORMAL)
  raw: string;
}

export interface AttachmentInput {
  base64: string;
  mimeType: string; // e.g. "application/pdf", "image/jpeg"
}

// Free-tier Gemini model. NOTE: gemini-2.0-flash was retired by Google on
// June 1, 2026 - if classification silently stops working again in future,
// check https://ai.google.dev/gemini-api/docs/changelog for the current
// recommended free-tier model name and update this constant.
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const FALLBACK: Omit<ClassificationResult, "raw"> = {
  departmentName: "General Administration / Collector Office",
  confidence: 0,
  summary: "",
  urgency: "NORMAL",
  urgencyReason: "",
};

/**
 * Sends the visitor's typed subject AND (when available) their uploaded
 * application file directly to Gemini as multimodal input - Gemini reads the
 * PDF/image itself (including handwritten Marathi or English text). In the
 * SAME call, it also assesses department, confidence, a Marathi summary, AND
 * urgency (medical emergencies, court/legal deadlines, elderly/disabled or
 * otherwise vulnerable applicants, safety issues, disaster/crop-loss relief) -
 * one API call covers everything, no extra cost for the urgency check.
 */
export async function classifyVisitorApplication(
  subject: string,
  attachment?: AttachmentInput | null
): Promise<ClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { ...FALLBACK, summary: subject, raw: "GEMINI_API_KEY not configured - skipped AI classification" };
  }

  const departmentList = DEFAULT_DEPARTMENTS.map((d) => `- ${d.name} (${d.nameMarathi})`).join("\n");

  const prompt = `You are an assistant to the District Collector office of Jalna, Maharashtra, India.
A visitor has registered to meet the Collector. Based on their stated subject/grievance
${attachment ? "AND the attached application file (read its full contents - it may be typed or handwritten, in Marathi or English, and may contain more detail than the typed subject alone)" : ""},
do TWO things:

1. Decide which ONE government department should handle it (pick the exact "name" value below, do not invent new ones):
${departmentList}

2. Assess urgency. Mark as "URGENT" only if there is a clear, specific reason someone should act on this TODAY rather than in the normal queue - for example: a medical emergency, an imminent court/legal deadline, an elderly/disabled/otherwise vulnerable applicant facing immediate hardship, a safety or law-and-order concern, or urgent disaster/crop-loss relief. Routine applications, general requests, and ordinary grievances (even if important) should be "NORMAL" - do not over-flag. If URGENT, give a one-line Marathi reason; if NORMAL, leave the reason empty.

Visitor's typed subject: """${subject}"""
${attachment ? "\nThe visitor's uploaded application is attached below - read it carefully and factor it into your decision, summary, and urgency assessment." : ""}

Respond with the department name, a confidence score, a short Marathi summary reflecting everything you read, the urgency level, and the urgency reason.`;

  const parts: any[] = [{ text: prompt }];
  if (attachment) {
    parts.push({ inline_data: { mime_type: attachment.mimeType, data: attachment.base64 } });
  }

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              departmentName: { type: "STRING" },
              confidence: { type: "NUMBER" },
              summaryMarathi: { type: "STRING" },
              urgency: { type: "STRING", enum: ["URGENT", "NORMAL"] },
              urgencyReasonMarathi: { type: "STRING" },
            },
            required: ["departmentName", "confidence", "summaryMarathi", "urgency", "urgencyReasonMarathi"],
          },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error", res.status, errText);
      return { ...FALLBACK, summary: subject, raw: `Gemini API error ${res.status}: ${errText.slice(0, 300)}` };
    }

    const data = await res.json();
    const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let parsed: {
      departmentName?: string;
      confidence?: number;
      summaryMarathi?: string;
      urgency?: string;
      urgencyReasonMarathi?: string;
    } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const validDept = DEFAULT_DEPARTMENTS.find((d) => d.name === parsed.departmentName);

    return {
      departmentName: validDept ? validDept.name : FALLBACK.departmentName,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.4,
      summary: parsed.summaryMarathi || subject,
      urgency: parsed.urgency === "URGENT" ? "URGENT" : "NORMAL",
      urgencyReason: parsed.urgency === "URGENT" ? parsed.urgencyReasonMarathi || "" : "",
      raw,
    };
  } catch (err: any) {
    console.error("Gemini classification failed", err);
    return { ...FALLBACK, summary: subject, raw: `Gemini request failed: ${err?.message || String(err)}` };
  }
}
