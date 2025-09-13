import { Worker } from 'worker_threads';
import path from 'path';

export const getWatermarkedPdf = (pdfBuffer) => {
    return new Promise((resolve, reject) => {
        const workerPath = path.resolve('./src/workers/pdfWatermark.worker.js');
        const worker = new Worker(workerPath);

        worker.postMessage({ pdfBuffer });

        worker.on('message', (msg) => {
            if (msg.success) resolve(msg.pdfBuffer);
            else reject(new Error(msg.error));
            worker.terminate();
        });

        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
};
