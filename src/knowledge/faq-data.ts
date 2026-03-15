import fs from "fs";
import path from "path";
import { FAQData } from "../types";
import { logger } from "../utils/logger";

let cachedFAQ: FAQData | null = null;

export function loadFAQData(): FAQData {
  if (cachedFAQ) return cachedFAQ;

  const faqPath = path.join(
    process.cwd(),
    "knowledge-base",
    "ev-charger-faq.json",
  );
  logger.info({ faqPath }, "Loading FAQ data...");

  const raw = fs.readFileSync(faqPath, "utf-8");
  cachedFAQ = JSON.parse(raw) as FAQData;

  const totalFaqs = cachedFAQ.categories.reduce(
    (sum, cat) => sum + cat.faqs.length,
    0,
  );
  logger.info(
    { categories: cachedFAQ.categories.length, totalFaqs },
    "FAQ data loaded",
  );

  return cachedFAQ;
}
