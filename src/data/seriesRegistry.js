// Authoritative display names and evidence policies; observations remain in validated snapshots.
const names = {
  "CPIAUCNS": {
    "title": {
      "zh": "美国总体消费者价格指数",
      "en": "Consumer Price Index for All Urban Consumers: All Items in U.S. City Average"
    }
  },
  "CPIUFDNS": {
    "title": {
      "zh": "美国食品消费者价格指数",
      "en": "Consumer Price Index for All Urban Consumers: Food in U.S. City Average"
    }
  },
  "CPIENGNS": {
    "title": {
      "zh": "美国能源消费者价格指数",
      "en": "Consumer Price Index for All Urban Consumers: Energy in U.S. City Average"
    }
  },
  "MCOILWTICO": {
    "title": {
      "zh": "WTI 原油现货价格",
      "en": "Crude Oil Prices: West Texas Intermediate (WTI) - Cushing, Oklahoma"
    }
  },
  "FEDFUNDS": {
    "title": {
      "zh": "有效联邦基金利率",
      "en": "Federal Funds Effective Rate"
    }
  },
  "CUUR0000SAH1": {
    "title": {
      "zh": "美国居住消费者价格指数",
      "en": "Consumer Price Index for All Urban Consumers: Shelter in U.S. City Average"
    }
  },
  "CEU0500000003": {
    "title": {
      "zh": "美国私营部门雇员平均时薪",
      "en": "Average Hourly Earnings of All Employees, Total Private"
    }
  },
  "M2SL": {
    "title": {
      "zh": "美国 M2 广义货币",
      "en": "M2"
    }
  },
  "PCEPILFE": {
    "title": {
      "zh": "核心 PCE 价格指数",
      "en": "Core PCE Price Index"
    }
  },
  "T5YIFR": {
    "title": {
      "zh": "5年后5年期通胀补偿",
      "en": "5y5y Inflation Compensation"
    }
  },
  "DGS10": {
    "title": {
      "zh": "10年期名义国债收益率",
      "en": "10-Year Nominal Treasury Yield"
    }
  },
  "DFII10": {
    "title": {
      "zh": "10年期 TIPS 实际收益率",
      "en": "10-Year TIPS Real Yield"
    }
  },
  "DTWEXBGS": {
    "title": {
      "zh": "贸易加权广义美元指数",
      "en": "Trade-Weighted Broad Dollar Index"
    }
  },
  "WALCL": {
    "title": {
      "zh": "美联储总资产",
      "en": "Federal Reserve Total Assets"
    }
  },
  "FYPUGDA188S": {
    "title": {
      "zh": "公众持有联邦债务 / GDP",
      "en": "Public Debt / GDP"
    }
  },
  "FYFSGDA188S": {
    "title": {
      "zh": "联邦盈余或赤字 / GDP",
      "en": "Federal Surplus or Deficit / GDP"
    }
  },
  "FYOINT": {
    "title": {
      "zh": "联邦利息支出",
      "en": "Federal Interest Outlays"
    }
  },
  "FYFR": {
    "title": {
      "zh": "联邦财政收入",
      "en": "Federal Receipts"
    }
  },
  "OPHNFB": {
    "title": {
      "zh": "劳动生产率 · 每小时产出",
      "en": "Labor Productivity · Output per Hour"
    }
  },
  "ULCNFB": {
    "title": {
      "zh": "单位劳动成本",
      "en": "Unit Labor Cost"
    }
  },
  "COMPNFB": {
    "title": {
      "zh": "每小时劳动报酬",
      "en": "Hourly Compensation"
    }
  },
  "PNFIC1": {
    "title": {
      "zh": "企业固定投资 · 实际值",
      "en": "Business Fixed Investment · Real"
    }
  },
  "A679RC1Q027SBEA": {
    "title": {
      "zh": "信息设备与软件投资",
      "en": "Information Equipment & Software Investment"
    }
  },
  "B985RC1Q027SBEA": {
    "title": {
      "zh": "软件投资",
      "en": "Software Investment"
    }
  },
  "B935RC1Q027SBEA": {
    "title": {
      "zh": "计算机与外围设备投资",
      "en": "Computer & Peripheral Equipment Investment"
    }
  },
  "IPN22112CS": {
    "title": {
      "zh": "电力需求 · 商业用电销售代理",
      "en": "Electricity Demand · Commercial Sales Proxy"
    }
  },
  "CUUR0000SEHF01": {
    "title": {
      "zh": "电价 · 消费者 CPI",
      "en": "Electricity Prices · Consumer CPI"
    }
  },
  "GDPC1": {
    "title": {
      "zh": "实际 GDP",
      "en": "Real GDP"
    }
  },
  "CE16OV": {
    "title": {
      "zh": "民间就业人数",
      "en": "Civilian Employment"
    }
  },
  "IPG3344S": {
    "title": {
      "zh": "半导体与其他电子元件产出",
      "en": "Semiconductor & Electronic Component Output"
    }
  },
  "MHHNGSP": {
    "title": {
      "zh": "Henry Hub 天然气价格",
      "en": "Henry Hub Natural Gas Price"
    }
  },
  "CENSUS_DATACENTER": {
    "title": {
      "zh": "数据中心建设支出",
      "en": "Data Center Construction"
    }
  },
  "CENSUS_NONRES": {
    "title": {
      "zh": "私人非住宅建设支出",
      "en": "Private Nonresidential Construction"
    }
  },
  "CENSUS_ELECTRONIC": {
    "title": {
      "zh": "计算机 / 电子 / 电气制造设施建设",
      "en": "Computer / Electronic / Electrical Factory Construction"
    }
  },
  "DPSACBM027SBOG": {
    "title": {
      "zh": "美国商业银行存款",
      "en": "U.S. Commercial Bank Deposits"
    }
  },
  "GPR": {
    "title": {
      "zh": "地缘政治风险指数",
      "en": "Geopolitical Risk Index"
    }
  },
  "GPRT": {
    "title": {
      "zh": "地缘政治威胁指数",
      "en": "Geopolitical Threats"
    }
  },
  "GPRA": {
    "title": {
      "zh": "地缘政治实际行动指数",
      "en": "Geopolitical Acts"
    }
  },
  "GSCPI": {
    "title": {
      "zh": "全球供应链压力指数",
      "en": "Global Supply Chain Pressure Index"
    }
  },
  "FAO_FOOD": {
    "title": {
      "zh": "FAO 食品价格指数 · 总指数",
      "en": "FAO Food Price Index · Total"
    }
  },
  "FAO_MEAT": {
    "title": {
      "zh": "肉类",
      "en": "Meat"
    }
  },
  "FAO_DAIRY": {
    "title": {
      "zh": "乳制品",
      "en": "Dairy"
    }
  },
  "FAO_CEREALS": {
    "title": {
      "zh": "谷物",
      "en": "Cereals"
    }
  },
  "FAO_OILS": {
    "title": {
      "zh": "植物油",
      "en": "Vegetable Oils"
    }
  },
  "FAO_SUGAR": {
    "title": {
      "zh": "糖",
      "en": "Sugar"
    }
  },
  "SIPRI_US_GDP": {
    "title": {
      "zh": "美国军费支出 / GDP",
      "en": "U.S. Military Expenditure / GDP"
    }
  },
  "SIPRI_US_GOV": {
    "title": {
      "zh": "美国军费支出 / 政府财政支出",
      "en": "U.S. Military Expenditure / Government Expenditure"
    }
  },
  "SIPRI_US_REAL": {
    "title": {
      "zh": "美国实际军费支出",
      "en": "U.S. Real Military Expenditure"
    }
  },
  "SIPRI_WORLD_REAL": {
    "title": {
      "zh": "全球军费支出 · 官方汇总",
      "en": "World Military Expenditure · Official Aggregate"
    }
  },
  "FED_STABLECOIN_SIZE": {
    "title": {
      "zh": "稳定币市值 · 美联储引用的估计",
      "en": "Stablecoin market capitalization · Fed-cited estimate"
    }
  },
  "IMF_STABLECOIN_SIZE": {
    "title": {
      "zh": "稳定币市场规模 · IMF 估计",
      "en": "Stablecoin market size · IMF estimate"
    }
  },
  "IMF_USD_SHARE": {
    "title": {
      "zh": "美元计价稳定币占比 · IMF 估计",
      "en": "USD-denominated stablecoin share · IMF estimate"
    }
  },
  "IMF_TBILL_SHARE": {
    "title": {
      "zh": "稳定币持有 / 短期美国国库券余额 · IMF 估计",
      "en": "Stablecoin holdings / outstanding U.S. T-bills · IMF estimate"
    }
  }
}

export const automationTypes = ['AUTOMATIC', 'MANUAL_REVIEWED', 'FIXED_VINTAGE', 'STATIC', 'DERIVED', 'PLANNED']
const roleIds = {
  INFLATION_TRANSMISSION: ['CPIUFDNS', 'CPIENGNS', 'CUUR0000SAH1', 'CEU0500000003', 'PCEPILFE', 'ULCNFB', 'COMPNFB', 'CUUR0000SEHF01'],
  POLICY_RESPONSE: ['FEDFUNDS', 'WALCL'], MARKET_VALIDATION: ['DGS10', 'DFII10', 'T5YIFR', 'DTWEXBGS'],
  STRUCTURAL_FISCAL: ['FYPUGDA188S', 'FYFSGDA188S', 'FYOINT', 'FYFR'],
  STRUCTURAL_CAPACITY: ['OPHNFB', 'PNFIC1', 'A679RC1Q027SBEA', 'B985RC1Q027SBEA', 'B935RC1Q027SBEA', 'GDPC1', 'CE16OV', 'IPG3344S', 'CENSUS_DATACENTER', 'CENSUS_NONRES', 'CENSUS_ELECTRONIC'],
  STRUCTURAL_EXTERNAL: ['MCOILWTICO', 'MHHNGSP', 'IPN22112CS', 'GPR', 'GPRT', 'GPRA', 'GSCPI', 'FAO_FOOD', 'FAO_MEAT', 'FAO_DAIRY', 'FAO_CEREALS', 'FAO_OILS', 'FAO_SUGAR', 'SIPRI_US_GDP', 'SIPRI_US_GOV', 'SIPRI_US_REAL', 'SIPRI_WORLD_REAL'],
  DOLLAR_SYSTEM: ['FED_STABLECOIN_SIZE', 'IMF_STABLECOIN_SIZE', 'IMF_USD_SHARE', 'IMF_TBILL_SHARE'],
  MONETARY_CONTEXT: ['M2SL', 'DPSACBM027SBOG'], DOMESTIC_OUTCOME: ['CPIAUCNS'],
}
const special = {
  DGS10: { releaseSchedule: 'H15' }, DFII10: { releaseSchedule: 'H15' },
  DTWEXBGS: { releaseSchedule: 'H10' }, WALCL: { releaseSchedule: 'H41' },
  T5YIFR: { citation: 'Copyrighted: Citation Required. Cite Federal Reserve Bank of St. Louis / FRED; review source notes.', rightsStatus: 'SOURCE_CITATION_REQUIRED', licenseUrl: 'https://fred.stlouisfed.org/series/T5YIFR' },
  IPN22112CS: { freshnessPolicy: { maxLagDays: 125 } },
  PCEPILFE: { freshnessPolicy: { maxLagDays: 65 } }, M2SL: { freshnessPolicy: { maxLagDays: 65 } },
  CPIAUCNS: { freshnessPolicy: { maxLagDays: 50 } }, CPIUFDNS: { freshnessPolicy: { maxLagDays: 50 } },
  CPIENGNS: { freshnessPolicy: { maxLagDays: 50 } }, CUUR0000SAH1: { freshnessPolicy: { maxLagDays: 50 } },
  CEU0500000003: { freshnessPolicy: { maxLagDays: 45 } }, CE16OV: { freshnessPolicy: { maxLagDays: 45 } },
}
export const seriesRegistry = Object.fromEntries(Object.entries(names).map(([id, entry]) => {
  const manual = id.startsWith('SIPRI_') || /^(FED_STABLECOIN|IMF_)/.test(id)
  return [id, { ...entry, automationType: manual ? 'MANUAL_REVIEWED' : 'AUTOMATIC', researchStatus: 'INTEGRATED',
    primaryResearchRole: Object.entries(roleIds).find(([, ids]) => ids.includes(id))?.[0] || 'CONTEXT', secondaryRoles: [],
    ...(manual ? { freshnessPolicy: { reviewAfterDays: 400 } } : {}), ...special[id] }]
}))
for (const [id, zh, en] of [['CBO_DEBT', 'CBO 公众持有债务 / GDP', 'CBO Public Debt / GDP'], ['CBO_DEFICIT', 'CBO 赤字 / GDP', 'CBO Deficit / GDP'], ['CBO_INTEREST', 'CBO 净利息 / GDP', 'CBO Net Interest / GDP']]) {
  seriesRegistry[id] = { title: { zh, en }, automationType: 'FIXED_VINTAGE', researchStatus: 'INTEGRATED', primaryResearchRole: 'STRUCTURAL_FISCAL', secondaryRoles: [], dataType: 'HISTORICAL_AND_CONDITIONAL_PROJECTION' }
}
seriesRegistry['FP.CPI.TOTL.ZG'] = { title: { zh: '世界银行 · 各国消费者价格通胀', en: 'World Bank · Consumer Price Inflation' }, automationType: 'AUTOMATIC', researchStatus: 'INTEGRATED', primaryResearchRole: 'GLOBAL_CONTEXT', secondaryRoles: [] }
seriesRegistry.REAL_GDP_WORKER = { title: { zh: '每名劳动者实际 GDP · 衍生指标', en: 'Real GDP per Worker · Derived' }, automationType: 'DERIVED', researchStatus: 'INTEGRATED', primaryResearchRole: 'STRUCTURAL_CAPACITY', secondaryRoles: [], inputIds: ['GDPC1', 'CE16OV'] }
seriesRegistry.HISTORY_EVENTS = { title: { zh: '历史事件资料', en: 'Historical Events' }, automationType: 'STATIC', researchStatus: 'INTEGRATED', primaryResearchRole: 'HISTORICAL_CONTEXT', secondaryRoles: [] }
seriesRegistry.FREIGHT = { title: { zh: '运价', en: 'Freight Rates' }, automationType: 'PLANNED', researchStatus: 'PLANNED', primaryResearchRole: 'STRUCTURAL_EXTERNAL', secondaryRoles: [] }
export const seriesTitles = language => Object.fromEntries(Object.entries(seriesRegistry).map(([id,entry])=>[id,entry.title[language]]))
export const indicatorSeriesIds = { 'natural-gas': 'MHHNGSP', oil: 'MCOILWTICO', 'energy-cpi': 'CPIENGNS', 'food-cpi': 'CPIUFDNS', gpr: 'GPR', defense: 'SIPRI_US_GDP', 'fao-food': 'FAO_FOOD', gscpi: 'GSCPI', freight: 'FREIGHT' }
export function assertResearchConsistency(indicators, integratedIds) {
  const present = new Set(integratedIds)
  for (const indicator of indicators) {
    const id = indicator.seriesId || indicatorSeriesIds[indicator.id]
    const entry = seriesRegistry[id]
    if (!entry) throw Error(`Unregistered research indicator: ${indicator.id}`)
    if ((indicator.status === 'planned' || entry.researchStatus === 'PLANNED') && present.has(id)) throw Error(`Integrated/planned contradiction: ${id}`)
    if (indicator.status === 'available' && (!present.has(id) || entry.researchStatus !== 'INTEGRATED')) throw Error(`Unavailable integrated indicator: ${id}`)
  }
}
export function fredUseMetadata(id, reviewed = {}) {
  const entry = seriesRegistry[id] || {}
  // A global FRED default cannot overwrite an individually reviewed note.
  const citation = entry.citation || reviewed.license || 'Distributed by FRED. Cite the original publisher and series; consult source notes for use terms. Rights are not classified by this site.'
  return { license: citation, citation, rightsStatus: entry.rightsStatus || reviewed.rightsStatus || 'NOT_CLASSIFIED', licenseUrl: entry.licenseUrl || reviewed.licenseUrl || `https://fred.stlouisfed.org/series/${id}` }
}
