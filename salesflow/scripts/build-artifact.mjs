// Inline the single-file build into one HTML document for hosting (no external JS/CSS files).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const out = process.argv[2] ?? 'dist-artifact/stream-salesflow.html'
const dir = 'dist-artifact/assets'
const files = readdirSync(dir)
const js = readFileSync(join(dir, files.find((f) => f.endsWith('.js'))), 'utf8').replace(/<\/script/gi, '<\\/script')
const css = readFileSync(join(dir, files.find((f) => f.endsWith('.css'))), 'utf8').replace(/<\/style/gi, '<\\/style')

const html = `<title>Stream One Platform</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600&family=Sarabun:wght@400;500;600&display=swap" rel="stylesheet">
<style>
${css}
html { color-scheme: light; }
</style>
<div id="app"></div>
<script type="module">
${js}
</script>
`
writeFileSync(out, html)
console.log(`${out} ${(html.length / 1024).toFixed(0)} KB`)
