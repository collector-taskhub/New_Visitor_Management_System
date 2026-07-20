import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  Tab,
  TabStopType,
} from "docx";
import fs from "fs";
import path from "path";

export interface LetterData {
  tokenNo: string;
  refDate: string;
  departmentNameMarathi: string;
  visitorName: string;
  visitorAddress: string;
  subject: string;
  aiSummary?: string;
  jaKr: string;
}

const MARATHI_FONT = "Nirmala UI";

function para(text: string, opts: Partial<{ bold: boolean; size: number; align: (typeof AlignmentType)[keyof typeof AlignmentType]; spacingAfter: number }> = {}) {
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.spacingAfter ?? 160 },
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        size: opts.size ?? 22,
        font: MARATHI_FONT,
      }),
    ],
  });
}

export async function generateMarathiLetter(data: LetterData): Promise<Buffer> {
  const letterheadBytes = fs.readFileSync(path.join(process.cwd(), "src/assets/letterhead.png"));

  const bodyLines = [
    `उपरोक्त विषयान्वये कळविण्यात येते की, जिल्हाधिकारी कार्यालय, जालना येथे टोकन क्रमांक ${data.tokenNo} अन्वये नोंदणीकृत झालेला अर्ज आपल्या विभागाशी संबंधित असल्याचे निदर्शनास आले आहे. सदर अर्जदाराचा पत्ता: ${data.visitorAddress}.`,
    `अर्जदाराने नमूद केलेला विषय: ${data.subject}`,
    ...(data.aiSummary ? [`थोडक्यात सारांश: ${data.aiSummary}`] : []),
    `तरी सदर अर्जावर आपल्या विभागाच्या स्तरावर, प्रचलित नियम व कार्यपद्धतीनुसार योग्य ती कार्यवाही करून, त्याबाबतची माहिती अर्जदारास तसेच या कार्यालयास कळविण्यात यावी, ही विनंती.`,
  ];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: MARATHI_FONT, size: 22 } },
      },
    },
    sections: [
      {
        properties: { page: { margin: { top: 700, bottom: 700, left: 900, right: 900 } } },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 260 },
            children: [
              new ImageRun({
                type: "png",
                data: letterheadBytes,
                transformation: { width: 600, height: 249 },
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 100 },
            tabStops: [{ type: TabStopType.RIGHT, position: 9600 }],
            children: [
              new TextRun({ text: `जा.क्र.: ${data.jaKr}`, font: MARATHI_FONT, size: 22 }),
              new TextRun({
                children: [new Tab(), `दिनांक: ${data.refDate}`],
                font: MARATHI_FONT,
                size: 22,
              }),
            ],
          }),
          para(`संदर्भ टोकन क्र.: ${data.tokenNo}`, { spacingAfter: 260 }),

          para("प्रति,", { bold: true, spacingAfter: 100 }),
          para(`मा. विभाग प्रमुख, ${data.departmentNameMarathi}, जालना`, { spacingAfter: 280 }),

          para(
            `विषय: श्री/श्रीमती ${data.visitorName} यांच्या अर्जावर योग्य ती कार्यवाही करण्याबाबत.`,
            { bold: true, spacingAfter: 280 }
          ),

          ...bodyLines.map((line) => para(line, { spacingAfter: 200 })),

          para("आपला विश्वासू,", { align: AlignmentType.RIGHT, spacingAfter: 600 }),
          para("(स्वाक्षरी)", { align: AlignmentType.RIGHT, spacingAfter: 80 }),
          para("जिल्हाधिकारी, जालना", { align: AlignmentType.RIGHT, bold: true, spacingAfter: 400 }),

          para("प्रत माहितीस्तव:", { bold: true, spacingAfter: 100 }),
          para(`१. अर्जदार - ${data.visitorName}, ${data.visitorAddress}`, { spacingAfter: 60 }),
          para(`२. संबंधित नस्ती, जिल्हाधिकारी कार्यालय जालना.`),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}