/**
 * PDF with Signatures Utility
 * إضافة التوقيعات على ملف PDF باستخدام pdf-lib
 */

import { PDFDocument, rgb } from "pdf-lib";
import { DocumentSignature, SignatureField, DocumentSigningEvent } from "@/types/document-signing";
import { filesService } from "@/lib/api/services";

interface SignaturePosition {
  pageNumber: number;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
}

/**
 * تحميل PDF وإضافة التوقيعات عليه
 */
export async function generateSignedPdf(
  event: DocumentSigningEvent,
  signatures: DocumentSignature[]
): Promise<Uint8Array> {
  // 1. جلب ملف PDF الأصلي - استخدام URL الكامل
  const fullDocumentUrl = filesService.getFullFileUrl(event.documentUrl);
  const pdfResponse = await fetch(fullDocumentUrl);
  const pdfBytes = await pdfResponse.arrayBuffer();

  // 2. تحميل PDF باستخدام pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  // 3. إنشاء خريطة للحقول
  const fieldsMap = new Map<string, SignatureField>();
  event.signatureFields.forEach((field) => {
    fieldsMap.set(field.id, field);
  });

  // 4. إضافة كل توقيع على الصفحة المناسبة
  for (const signature of signatures) {
    const field = fieldsMap.get(signature.signatureFieldId);
    if (!field) continue;

    const pageIndex = field.pageNumber - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // تحويل النسب المئوية إلى إحداثيات فعلية
    const x = (field.positionX / 100) * pageWidth;
    const y = pageHeight - ((field.positionY / 100) * pageHeight) - ((field.height / 100) * pageHeight);
    const width = (field.width / 100) * pageWidth;
    const height = (field.height / 100) * pageHeight;

    // إذا كان التوقيع صورة (Base64)
    if (signature.signatureData.startsWith("data:image")) {
      try {
        // استخراج بيانات الصورة
        const base64Data = signature.signatureData.split(",")[1];
        const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        // تضمين الصورة في PDF
        let image;
        if (signature.signatureData.includes("image/png")) {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          // افتراض JPEG
          image = await pdfDoc.embedJpg(imageBytes);
        }

        // رسم الصورة على الصفحة
        page.drawImage(image, {
          x,
          y,
          width,
          height,
        });
      } catch (err) {
        console.error("Error embedding signature image:", err);
      }
    }

    // إضافة معلومات التوقيع (التاريخ والاسم)
    if (field.includeDate || field.includeName) {
      const fontSize = 8;
      const textY = y - 12;
      let text = "";

      if (field.includeName) {
        text += signature.signerName;
      }
      if (field.includeDate) {
        const date = new Date(signature.signedAt).toLocaleDateString("ar-EG");
        text += text ? ` - ${date}` : date;
      }

      if (text) {
        page.drawText(text, {
          x,
          y: textY,
          size: fontSize,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
    }
  }

  // 5. حفظ PDF المعدل
  return await pdfDoc.save();
}

/**
 * تحميل PDF الموقع
 */
export async function downloadSignedPdf(
  event: DocumentSigningEvent,
  signatures: DocumentSignature[],
  fileName?: string
): Promise<void> {
  const pdfBytes = await generateSignedPdf(event, signatures);

  // إنشاء Blob وتحميله - تحويل Uint8Array إلى ArrayBuffer
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || `${event.title}_signed.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // تنظيف
  URL.revokeObjectURL(url);
}

