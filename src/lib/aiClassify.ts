import { DEFAULT_DEPARTMENTS } from "./masterData";

export interface ClassificationResult {
  departmentName: string; // must match one of DEFAULT_DEPARTMENTS.name
  confidence: number; // 0-1
  summary: string; // one or two line Marathi summary of the grievance
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

/**
 * Sends the visitor's typed subject AND (when available) their uploaded
 * application file directly to Gemini as multimodal input - Gemini reads the
 * PDF/image itself (including handwritten Marathi or English text) rather than
 * needing separate OCR/text-extraction. Works whether or not an attachment
 * exists: with one, both the subject and the file inform the decision; without
 * one, classification runs on the typed subject alone as before.
 */
export async function classifyVisitorApplication(
  subject: string,
  attachment?: AttachmentInput | null
): Promise<ClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      departmentName: "General Administration / Collector Office",
      confidence: 0,
      summary: subject,
      raw: "GEMINI_API_KEY not configured - skipped AI classification",
    };
  }

  const departmentList = DEFAULT_DEPARTMENTS.map((d) => `- ${d.name} (${d.nameMarathi})`).join("\n");

  const prompt = `You are an assistant to the District Collector office of Jalna, Maharashtra, India.
A visitor has registered to meet the Collector. Based on their stated subject/grievance
${attachment ? "AND the attached application file (read its full contents - it may be typed or handwritten, in Marathi or English, and may contain more detail than the typed subject alone)" : ""},
decide which ONE government department should handle it.

Available departments (pick the exact "name" value, do not invent new ones):
${departmentList}

Visitor's typed subject: """${subject}"""
${attachment ? "\nThe visitor's uploaded application is attached below - read it carefully and factor it into your decision and summary." : ""}

Respond with the department name, a confidence score, and a short Marathi summary that reflects everything you read (subject${attachment ? " and the attached application" : ""}).`;

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
            },
            required: ["departmentName", "confidence", "summaryMarathi"],
          },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error", res.status, errText);
      return {
        departmentName: "General Administration / Collector Office",
        confidence: 0,
        summary: subject,
        raw: `Gemini API error ${res.status}: ${errText.slice(0, 300)}`,
      };
    }

    const data = await res.json();
    const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let parsed: { departmentName?: string; confidence?: number; summaryMarathi?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const validDept = DEFAULT_DEPARTMENTS.find((d) => d.name === parsed.departmentName);

    return {
      departmentName: validDept ? validDept.name : "General Administration / Collector Office",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.4,
      summary: parsed.summaryMarathi || subject,
      raw,
    };
  } catch (err: any) {
    console.error("Gemini classification failed", err);
    return {
      departmentName: "General Administration / Collector Office",
      confidence: 0,
      summary: subject,
      raw: `Gemini request failed: ${err?.message || String(err)}`,
    };
  }
}
