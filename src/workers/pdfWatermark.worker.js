import { parentPort } from 'worker_threads';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

parentPort.on('message', async (data) => {
    try {
        const { pdfBuffer } = data;

        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        pdfDoc.getPages().forEach(page => {
            const { width, height } = page.getSize();
            page.drawText('QPaperVault', {
                x: width / 2 - 150,
                y: height / 2 - 150,
                size: 80,
                font,
                color: rgb(0.75, 0.75, 0.75),
                rotate: degrees(45),
                opacity: 0.15,
            });
        });

        const watermarkedPdfBytes = await pdfDoc.save();
        parentPort.postMessage({ success: true, pdfBuffer: watermarkedPdfBytes });

    } catch (error) {
        parentPort.postMessage({ success: false, error: error.message });
    }
});
