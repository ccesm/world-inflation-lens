import fs from 'node:fs'
import { readSummary, renderSummary, emptySummary } from './lib/signalShadowSummary.mjs'

let summary = emptySummary()
try {
  const file = process.env.SIGNAL_SHADOW_SUMMARY_FILE
  if (file && fs.statSync(file).size <= 4096) summary = readSummary(fs.readFileSync(file, 'utf8'))
} catch { /* Missing/unsafe data is UNKNOWN; never dump diagnostics. */ }
const json = JSON.stringify(summary)
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `summary=${json}\n`)
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n\`\`\`text\n${renderSummary(summary)}\n\`\`\`\n`)
