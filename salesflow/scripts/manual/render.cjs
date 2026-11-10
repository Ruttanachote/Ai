// Render the manual HTML to an A4 PDF with page numbers (Chromium from Playwright).
const { chromium } = require('playwright')
const path = require('path')
;(async () => {
  const dir = path.join(__dirname, '..', '..', 'docs', 'manual')
  const b = await chromium.launch()
  const pg = await b.newPage()
  await pg.goto('file://' + path.join(dir, 'One-Platform-คู่มือการใช้งาน.html'), { waitUntil: 'networkidle' })
  await pg.evaluate(() => document.fonts.ready)
  await pg.pdf({
    path: path.join(dir, 'One-Platform-คู่มือการใช้งาน.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font-size:8px;color:#98a1b2;padding:0 16mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>One Platform · User Manual</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
  })
  await b.close()
})()
