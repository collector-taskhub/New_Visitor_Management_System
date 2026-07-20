import { PDFDocument, rgb, PageSizes } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

export interface LetterData {
  tokenNo: string;
  refDate: string; // e.g. "२०/०७/२०२६" or plain "20/07/2026"
  departmentNameMarathi: string;
  visitorName: string;
  visitorAddress: string;
  subject: string;
  aiSummary?: string;
  jaKr: string; // जा.क्र. reference number
}

function wrapText(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(test, fontSize);
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Generates the "forwarding letter" PDF sent from the Collector Office to the
 * concerned department, on office letterhead, in Marathi. A copy of the same
 * content is also shown to the applicant on the tracking page.
 */
export async function generateMarathiLetter(data: LetterData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const regularBytes = fs.readFileSync(
    path.join(process.cwd(), "src/assets/NotoSansDevanagari-Regular.ttf")
  );
  const boldBytes = fs.readFileSync(
    path.join(process.cwd(), "src/assets/NotoSansDevanagari-Bold.ttf")
  );

  const font = await pdfDoc.embedFont(regularBytes, { subset: true });
  const boldFont = await pdfDoc.embedFont(boldBytes, { subset: true });

  const page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - 60;

  const navy = rgb(0.05, 0.15, 0.35);
  const saffron = rgb(0.96, 0.55, 0.14);
  const black = rgb(0.1, 0.1, 0.1);

  // Letterhead
  page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: saffron });
  page.drawText("जिल्हाधिकारी कार्यालय, जालना", {
    x: margin,
    y,
    size: 20,
    font: boldFont,
    color: navy,
  });
  y -= 22;
  page.drawText("Office of the District Collector, Jalna - 431203", {
    x: margin,
    y,
    size: 10,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });
  y -= 6;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1.5,
    color: navy,
  });
  y -= 26;

  // Reference line
  page.drawText(`जा.क्र.: ${data.jaKr}`, { x: margin, y, size: 11, font, color: black });
  page.drawText(`दिनांक: ${data.refDate}`, {
    x: width - margin - 140,
    y,
    size: 11,
    font,
    color: black,
  });
  y -= 20;
  page.drawText(`संदर्भ टोकन क्र.: ${data.tokenNo}`, { x: margin, y, size: 11, font, color: black });
  y -= 30;

  page.drawText(`प्रति,`, { x: margin, y, size: 12, font: boldFont, color: black });
  y -= 18;
  page.drawText(`मा. विभाग प्रमुख, ${data.departmentNameMarathi}, जालना`, {
    x: margin,
    y,
    size: 12,
    font,
    color: black,
  });
  y -= 34;

  page.drawText(
    `विषय: श्री/श्रीमती ${data.visitorName} यांच्या अर्जावर योग्य ती कार्यवाही करण्याबाबत.`,
    { x: margin, y, size: 12, font: boldFont, color: navy }
  );
  y -= 30;

  const bodyLines = [
    `उपरोक्त विषयान्वये कळविण्यात येते की, जिल्हाधिकारी कार्यालय, जालना येथे टोकन क्रमांक ${data.tokenNo} अन्वये नोंदणीकृत झालेला अर्ज आपल्या विभागाशी संबंधित असल्याचे निदर्शनास आले आहे. सदर अर्जदाराचा पत्ता: ${data.visitorAddress}.`,
    ``,
    `अर्जदाराने नमूद केलेला विषय: ${data.subject}`,
    ``,
    data.aiSummary ? `थोडक्यात सारांश: ${data.aiSummary}` : ``,
    ``,
    `तरी सदर अर्जावर आपल्या विभागाच्या स्तरावर, प्रचलित नियम व कार्यपद्धतीनुसार योग्य ती कार्यवाही करून, त्याबाबतची माहिती अर्जदारास तसेच या कार्यालयास कळविण्यात यावी, ही विनंती.`,
  ].filter(Boolean);

  const fontSize = 11.5;
  const lineHeight = 18;
  const maxWidth = width - margin * 2;

  for (const para of bodyLines) {
    if (para === "") {
      y -= lineHeight * 0.6;
      continue;
    }
    const wrapped = wrapText(para, font, fontSize, maxWidth);
    for (const line of wrapped) {
      if (y < 140) {
        y = height - 60;
        pdfDoc.addPage(PageSizes.A4);
      }
      page.drawText(line, { x: margin, y, size: fontSize, font, color: black });
      y -= lineHeight;
    }
  }

  y -= 50;
  page.drawText("आपला विश्वासू,", { x: width - margin - 160, y, size: 12, font, color: black });
  y -= 40;
  page.drawText("(स्वाक्षरी)", { x: width - margin - 160, y, size: 11, font, color: black });
  y -= 16;
  page.drawText("वैयक्तिक सहायक, जिल्हाधिकारी, जालना", {
    x: width - margin - 220,
    y,
    size: 11,
    font: boldFont,
    color: navy,
  });

  // Copy note
  y -= 50;
  page.drawText("प्रत माहितीस्तव:", { x: margin, y, size: 10.5, font: boldFont, color: black });
  y -= 16;
  page.drawText(`१. अर्जदार - ${data.visitorName}, ${data.visitorAddress}`, {
    x: margin,
    y,
    size: 10,
    font,
    color: black,
  });
  y -= 14;
  page.drawText(`२. संबंधित नस्ती, जिल्हाधिकारी कार्यालय जालना.`, {
    x: margin,
    y,
    size: 10,
    font,
    color: black,
  });

  page.drawRectangle({ x: 0, y: 0, width, height: 6, color: navy });

  return pdfDoc.save();
}
