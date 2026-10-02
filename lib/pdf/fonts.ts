import { Font } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

let fontsRegistered = false;

/**
 * Registers Unicode font family (Noto Sans Devanagari) to cleanly render
 * Hindi / Devanagari text alongside English text in PDF generation.
 */
export function registerPdfFonts() {
  if (fontsRegistered) return;

  try {
    const regularPath = path.join(
      process.cwd(),
      "public",
      "fonts",
      "NotoSansDevanagari-Regular.ttf"
    );
    const boldPath = path.join(
      process.cwd(),
      "public",
      "fonts",
      "NotoSansDevanagari-Bold.ttf"
    );

    const regularSrc = fs.existsSync(regularPath)
      ? regularPath
      : "https://fonts.gstatic.com/s/notosansdevanagari/v30/TuGoUUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHn6B2OHjbL_08AlXQly-A.ttf";

    const boldSrc = fs.existsSync(boldPath)
      ? boldPath
      : "https://fonts.gstatic.com/s/notosansdevanagari/v30/TuGoUUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHn6B2OHjbL_08AlZMiy-A.ttf";

    Font.register({
      family: "NotoSansDevanagari",
      fonts: [
        { src: regularSrc, fontWeight: "normal" },
        { src: boldSrc, fontWeight: "bold" },
      ],
    });
    fontsRegistered = true;
  } catch (err) {
    // If registration encounters an issue, log and continue gracefully
    console.error("PDF font registration note:", err);
  }
}
