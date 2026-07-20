import { DEFAULT_DEPARTMENTS } from "./masterData";

export interface ClassificationResult {
  departmentName: string; // must match one of DEFAULT_DEPARTMENTS.name
  confidence: number; // 0-1
  summary: string; // one or two line Marathi summary of the grievance
  raw: string;
}

// Free-tier Gemini model. NOTE: gemini-2.0-flash was retired by Google on
// June 1, 2026 - if classification silently stops working again in future,
// check https://ai.google.dev/gemini-api/docs/changelog for the current
// recommended free-tier model name and update this constant.
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Sends the visitor's subject (+ optional OCR'd application text) to Gemini
 * and asks it to pick the single most relevant government department.
 * Get a free API key at https://aistudio.google.com/apikey
 */
export async function classifyVisitorApplication(
  subject: string,
  extraContext?: string
): Promise<ClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // No key configured - system still works, just requires manual assignment.
    return {
      departmentName: "General Administration / Collector Office",
      confidence: 0,
      summary: subject,
      raw: "GEMINI_API_KEY not configured - skipped AI classification",
    };
  }

  const departmentList = DEFAULT_DEPARTMENTS.map((d) => `- ${d.name} (${d.nameMarathi})`).join("\n");

  const prompt = `You are an assistant to the District Collector office of Jalna, Maharashtra, India.
A visitor has registered to meet the Collector. Based on their stated subject/grievance,
decide which ONE government department should handle it.

Available departments (pick the exact "name" value, do not invent new ones):
${departmentList}

Visitor's subject: """${subject}"""
${extraContext ? `Additional application text (OCR/extracted): """${extraContext}"""` : ""}

Respond with the department name, a confidence score, and a short Marathi summary.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
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
