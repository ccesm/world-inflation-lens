import { observationStatus } from './dataStatus.js'
export const environmentRules = [
  { id: 'CPIAUCNS', thresholds: [2, 4, 6], zh: 'CPI 同比水平', en: 'CPI inflation level', ruleZh: '低 <2%；中等 2–<4%；偏高 4–<6%；高 ≥6%。不是美联储 CPI 目标。', ruleEn: 'Low <2%; Moderate 2–<4%; Elevated 4–<6%; High ≥6%. Not a Fed CPI target.' },
  { id: 'FYPUGDA188S', thresholds: [60, 90, 120], zh: '公众持有债务 / GDP 水平', en: 'Public debt / GDP level', ruleZh: '低 <60%；中等 60–<90%；偏高 90–<120%；高 ≥120%。不是债务安全阈值。', ruleEn: 'Low <60%; Moderate 60–<90%; Elevated 90–<120%; High ≥120%. Not debt-safety thresholds.' },
  { id: 'DFII10', thresholds: [0, 1, 2], zh: '10 年实际收益率水平', en: '10-year real yield level', ruleZh: '低 <0%；中等 0–<1%；偏高 1–<2%；高 ≥2%。较高实际收益率不等于较高通胀风险。', ruleEn: 'Low <0%; Moderate 0–<1%; Elevated 1–<2%; High ≥2%. Higher real yields do not mean higher inflation risk.' },
  { id: 'T5YIFR', thresholds: [2, 3, 4], zh: '5y5y 通胀补偿水平', en: '5y5y inflation compensation level', ruleZh: '低 <2%；中等 2–<3%；偏高 3–<4%；高 ≥4%。含风险和流动性溢价，不是整体信心评分或 30 年预测。', ruleEn: 'Low <2%; Moderate 2–<3%; Elevated 3–<4%; High ≥4%. Includes risk and liquidity premia; not an overall confidence rating or a 30-year forecast.' },
]
export function descriptiveLevel(points, frequency, thresholds, now = new Date()) {
  const latest = points.findLast(p => Number.isFinite(p.value))
  if (!latest || observationStatus(points, frequency, now).old) return null
  return thresholds.filter(cutoff => latest.value >= cutoff).length
}
