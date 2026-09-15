import snapshot from '../../data/inflation/monitor.json'
import { cpi, cpiMetadata } from './inflation.js'
import { driverSeries } from './drivers.js'
import { withAnnualChange } from '../utils/inflation.js'
export const monitorRaw = Object.fromEntries(snapshot.series.map(s => [s.id, s]))
const growth = s => withAnnualChange(s.observations).map(p => ({ date: p.date, value: p.inflation }))
export const monitorDefinitions = [
  { id: 'CPIAUCNS', zh: '总体 CPI 同比', en: 'Headline CPI · YoY', unit: '%', points: cpi.map(p => ({ date: p.date, value: p.inflation })), source: cpiMetadata, note: { zh: '未季调；消费篮子的同比变化。', en: 'Unadjusted; annual change in the consumer basket.' } },
  { id: 'PCEPILFE', zh: '核心 PCE 同比', en: 'Core PCE · YoY', unit: '%', points: growth(monitorRaw.PCEPILFE), note: { zh: '已季调，剔除食品与能源。美联储 2% 目标针对总体 PCE，不是核心 PCE 或 CPI。', en: 'Seasonally adjusted, excluding food and energy. The Fed’s 2% goal applies to headline PCE, not core PCE or CPI.' } },
  { id: 'T5YIFR', zh: '5 年后开始的 5 年远期通胀补偿', en: '5y5y forward inflation compensation', unit: '%', note: { zh: '市场推算，含通胀风险与流动性溢价；不是调查预期或 30 年预测。', en: 'Market-implied; includes inflation-risk and liquidity premia. Not a survey or a 30-year forecast.' } },
  { id: 'FYPUGDA188S', zh: '公众持有债务 / GDP', en: 'Publicly held debt / GDP', unit: '%', note: { zh: 'FRED 使用 OMB 债务与日历年 GDP 构造比率，与 CBO 财年 GDP 口径可能不同。', en: 'FRED combines OMB debt with calendar-year GDP; this can differ from CBO fiscal-year ratios.' } },
  { id: 'FYFSGDA188S', zh: '联邦赤字 / GDP', en: 'Federal deficit / GDP', unit: '%', points: monitorRaw.FYFSGDA188S.observations.map(p => ({ ...p, value: p.value === null ? null : -p.value })), note: { zh: '将来源盈余/赤字的符号反转：正值代表赤字。GDP 分母使用日历年口径。', en: 'Source balance sign reversed: positive means deficit. Uses calendar-year GDP.' } },
  { id: 'interest-revenue', zh: '净利息支出 / 收入', en: 'Net interest / receipts', unit: '%', source: monitorRaw.FYOINT, points: monitorRaw.FYOINT.observations.map(p => { const revenue = monitorRaw.FYFR.observations.find(r => r.date === p.date)?.value; return { date: p.date, value: p.value !== null && revenue > 0 ? p.value / revenue * 100 : null } }), note: { zh: 'OMB 利息支出与联邦收入按同一财政年度精确匹配。不是债务票息或平均融资利率。', en: 'OMB interest outlays and receipts matched by fiscal-year date. Not a coupon or average financing rate.' } },
  { id: 'WALCL', zh: '美联储总资产', en: 'Federal Reserve assets', unit: 'USD bn', points: monitorRaw.WALCL.observations.map(p => ({ ...p, value: p.value === null ? null : p.value / 1000 })), note: { zh: '每周三余额，十亿美元。资产扩张不等于同幅度消费物价上涨。', en: 'Wednesday balance, billions of dollars. Asset growth is not one-for-one consumer inflation.' } },
  { id: 'M2SL', zh: 'M2 同比', en: 'M2 · YoY', unit: '%', points: driverSeries.money.points, source: driverSeries.money.metadata, note: { zh: '已季调广义货币增速；不是全部信贷或印钞量。', en: 'Seasonally adjusted broad-money growth; not total credit or money printing.' } },
  { id: 'DGS10', zh: '10 年名义国债收益率', en: '10-year Treasury yield', unit: '%', note: { zh: '固定期限市场收益率，不是政府存量债务平均融资成本。', en: 'Constant-maturity market yield, not the government’s average cost of outstanding debt.' } },
  { id: 'DFII10', zh: '10 年 TIPS 实际收益率', en: '10-year TIPS real yield', unit: '%', note: { zh: '通胀保值国债市场收益率；不是当期名义收益率减 CPI。', en: 'Inflation-indexed Treasury market yield; not the nominal yield minus current CPI.' } },
  { id: 'DTWEXBGS', zh: '贸易加权广义美元指数', en: 'Trade-weighted broad dollar', unit: '2006=100', note: { zh: '名义广义美元指数，不是 ICE DXY。对外汇率强弱与国内购买力不是同一概念。', en: 'Nominal broad index, not ICE DXY. External exchange value differs from domestic purchasing power.' } },
].map(item => ({ ...item, source: item.source || monitorRaw[item.id], points: item.points || monitorRaw[item.id].observations }))
