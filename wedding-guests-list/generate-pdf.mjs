#!/usr/bin/env node
/**
 * Genera PDF de la lista de invitados.
 * Uso: node generate-pdf.mjs
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'lista-invitados.html');
const pdfPath = path.join(__dirname, 'lista-invitados.pdf');
const html = fs.readFileSync(htmlPath, 'utf-8');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForFunction(
  () => document.querySelector('#novia-groups')?.innerHTML?.length > 0,
  { timeout: 5000 }
);
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
});
await browser.close();
console.log(`✅ PDF generado: ${pdfPath}`);
