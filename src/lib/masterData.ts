// Master data for Jalna district. Edit here to reuse for any district.

export const DISTRICT_NAME = "Jalna";

export const JALNA_TALUKAS = [
  "Jalna",
  "Ambad",
  "Badnapur",
  "Bhokardan",
  "Jafrabad",
  "Mantha",
  "Partur",
  "Ghansawangi",
];

// Shown in dropdown; visitor can pick "Other District" -> free text district + "Other Taluka"
export const MAHARASHTRA_DISTRICTS = [
  "Jalna",
  "Chhatrapati Sambhajinagar (Aurangabad)",
  "Beed",
  "Parbhani",
  "Hingoli",
  "Nanded",
  "Latur",
  "Dharashiv (Osmanabad)",
  "Ahmednagar",
  "Pune",
  "Nashik",
  "Mumbai",
  "Other",
];

export const OTHER_TALUKA = "Other";
export const OTHER_DISTRICT = "Other";

export const DEFAULT_DEPARTMENTS: {
  name: string;
  nameMarathi: string;
  code: string;
}[] = [
  { name: "Revenue Department", nameMarathi: "महसूल विभाग", code: "REV" },
  { name: "Land Records (Bhumi Abhilekh)", nameMarathi: "भूमि अभिलेख विभाग", code: "LR" },
  { name: "Tahsil Office", nameMarathi: "तहसील कार्यालय", code: "TAH" },
  { name: "Agriculture Department", nameMarathi: "कृषी विभाग", code: "AGR" },
  { name: "Panchayat Samiti / Rural Development", nameMarathi: "पंचायत समिती / ग्रामविकास विभाग", code: "PS" },
  { name: "Jalna Municipal Corporation", nameMarathi: "जालना महानगरपालिका", code: "JMC" },
  { name: "Public Works Department (PWD)", nameMarathi: "सार्वजनिक बांधकाम विभाग", code: "PWD" },
  { name: "Water Resources Department", nameMarathi: "जलसंपदा विभाग", code: "WRD" },
  { name: "Health Department", nameMarathi: "आरोग्य विभाग", code: "HLT" },
  { name: "Education Department", nameMarathi: "शिक्षण विभाग", code: "EDU" },
  { name: "Social Welfare Department", nameMarathi: "समाज कल्याण विभाग", code: "SW" },
  { name: "Women & Child Development", nameMarathi: "महिला व बालविकास विभाग", code: "WCD" },
  { name: "Police Department", nameMarathi: "पोलीस विभाग", code: "POL" },
  { name: "Electricity Board (MSEDCL)", nameMarathi: "महावितरण", code: "MSEDCL" },
  { name: "Supply Department (Ration/PDS)", nameMarathi: "पुरवठा विभाग", code: "SUP" },
  { name: "Employment & Self-Employment", nameMarathi: "रोजगार व स्वयंरोजगार विभाग", code: "EMP" },
  { name: "General Administration / Collector Office", nameMarathi: "सामान्य प्रशासन / जिल्हाधिकारी कार्यालय", code: "GAD" },
];
