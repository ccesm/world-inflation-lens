// Reviewed presentation catalogue. Internal rule IDs and arithmetic remain frozen.
export const signalFactors = [
  {
    "id": "inflation-persistence",
    "title": {
      "zh": "核心 PCE 通胀动能",
      "en": "Core PCE Inflation Momentum"
    },
    "series": "PCEPILFE",
    "frequency": "monthly",
    "confirmation": 3,
    "states": [
      "CORE_INFLATION_ACCELERATING",
      "CORE_INFLATION_DECELERATING",
      "LITTLE_CHANGE",
      "TRANSITION",
      "INSUFFICIENT_DATA"
    ],
    "researchLink": "#/monitor?group=inflation",
    "limitation": {
      "zh": "仅描述核心 PCE 动能，不涵盖所有通胀证据。",
      "en": "Describes core PCE momentum alone, not all inflation evidence."
    },
    "publisher": "BEA / FRED",
    "sourceUrl": "https://fred.stlouisfed.org/series/PCEPILFE",
    "transform": "core_yoy_delta_3m",
    "entry": 0.3,
    "quiet": 0.1
  },
  {
    "id": "observed-productivity",
    "title": {
      "zh": "已观测生产率",
      "en": "Observed Productivity"
    },
    "series": "OPHNFB",
    "frequency": "quarterly",
    "confirmation": 2,
    "states": [
      "OUTPUT_PER_HOUR_GROWING",
      "OUTPUT_PER_HOUR_CONTRACTING",
      "LITTLE_CHANGE",
      "TRANSITION",
      "INSUFFICIENT_DATA"
    ],
    "researchLink": "#/research/ai-productivity",
    "limitation": {
      "zh": "生产率数据会修订，增长不能归因于 AI。",
      "en": "Productivity data revise; growth is not attributed to AI."
    },
    "publisher": "BLS / FRED",
    "sourceUrl": "https://fred.stlouisfed.org/series/OPHNFB",
    "transform": "yoy_quarterly",
    "entry": 0.5,
    "quiet": 0.1
  },
  {
    "id": "supply-chain-pressure",
    "title": {
      "zh": "全球供应链压力趋势",
      "en": "Global Supply-Chain Pressure Trend"
    },
    "series": "GSCPI",
    "frequency": "monthly",
    "confirmation": 2,
    "states": [
      "SUPPLY_CHAIN_PRESSURE_RISING",
      "SUPPLY_CHAIN_PRESSURE_FALLING",
      "LITTLE_CHANGE",
      "TRANSITION",
      "INSUFFICIENT_DATA"
    ],
    "researchLink": "#/external-shocks?topic=supply-chain",
    "limitation": {
      "zh": "GSCPI 不涵盖全部外部通胀压力。",
      "en": "GSCPI does not cover all external inflation pressure."
    },
    "publisher": "Federal Reserve Bank of New York",
    "sourceUrl": "https://www.newyorkfed.org/research/policy/gscpi",
    "transform": "gscpi_mean_delta_3m",
    "entry": 0.5,
    "quiet": 0.1
  },
  {
    "id": "policy-rate-direction",
    "title": {
      "zh": "有效政策利率变动方向",
      "en": "Effective Policy-Rate Direction"
    },
    "series": "FEDFUNDS",
    "frequency": "monthly",
    "confirmation": 2,
    "states": [
      "POLICY_RATE_RISING",
      "POLICY_RATE_FALLING",
      "LITTLE_CHANGE",
      "TRANSITION",
      "INSUFFICIENT_DATA"
    ],
    "researchLink": "#/drivers?topic=rates",
    "limitation": {
      "zh": "月均有效利率不是目标区间，也不是货币政策松紧的完整度量。",
      "en": "The monthly effective rate is not the target range or a complete measure of monetary restraint."
    },
    "publisher": "Federal Reserve / FRED",
    "sourceUrl": "https://fred.stlouisfed.org/series/FEDFUNDS",
    "transform": "rate_delta_3m",
    "entry": 0.25,
    "quiet": 0.05
  },
  {
    "id": "reserve-share",
    "title": {
      "zh": "美元外汇储备份额趋势",
      "en": "USD Reserve-Share Trend"
    },
    "series": "COFER_USD",
    "frequency": "quarterly",
    "confirmation": 2,
    "states": [
      "USD_RESERVE_SHARE_RISING",
      "USD_RESERVE_SHARE_FALLING",
      "LITTLE_CHANGE",
      "TRANSITION",
      "INSUFFICIENT_DATA"
    ],
    "researchLink": "#/research/international-dollar",
    "limitation": {
      "zh": "采用 IMF 修订口径，含估算、不含货币黄金；不是全球财富占比。",
      "en": "Uses revised IMF coverage including imputations, excluding monetary gold; not a share of global wealth."
    },
    "publisher": "IMF COFER",
    "sourceUrl": "https://data.imf.org/en/datasets/IMF.STA:COFER",
    "transform": "share_delta_8q",
    "entry": 1,
    "quiet": 0.25
  },
  {
    "id": "foreign-treasury-holdings",
    "title": {
      "zh": "外国持有美国国债规模趋势",
      "en": "Foreign Treasury Holdings Trend"
    },
    "series": "TIC_TOTAL",
    "frequency": "monthly",
    "confirmation": 3,
    "states": [
      "FOREIGN_TREASURY_HOLDINGS_EXPANDING",
      "FOREIGN_TREASURY_HOLDINGS_CONTRACTING",
      "LITTLE_CHANGE",
      "TRANSITION",
      "INSUFFICIENT_DATA"
    ],
    "researchLink": "#/research/international-dollar",
    "limitation": {
      "zh": "名义持有量不是资金流量或需求强度；受托管、估值和供给影响。",
      "en": "Nominal holdings are not flows or demand strength; custody, valuation and supply matter."
    },
    "publisher": "U.S. Treasury TIC",
    "sourceUrl": "https://home.treasury.gov/data/treasury-international-capital-tic-system",
    "transform": "yoy_monthly",
    "entry": 5,
    "quiet": 1
  },
  {
    "id": "offshore-usd-credit",
    "title": {
      "zh": "美国境外美元信贷余额趋势",
      "en": "Offshore USD Credit Outstanding Trend"
    },
    "series": "BIS_USD_TOTAL",
    "frequency": "quarterly",
    "confirmation": 2,
    "states": [
      "OFFSHORE_USD_CREDIT_EXPANDING",
      "OFFSHORE_USD_CREDIT_CONTRACTING",
      "LITTLE_CHANGE",
      "TRANSITION",
      "INSUFFICIENT_DATA"
    ],
    "researchLink": "#/research/international-dollar",
    "limitation": {
      "zh": "美国境外非银行借款人美元信贷；受信贷周期与名义增长影响，不是 M2。",
      "en": "USD credit to non-banks outside the U.S.; credit cycles and nominal growth matter. This is not M2."
    },
    "publisher": "BIS Global Liquidity Indicators",
    "sourceUrl": "https://data.bis.org/topics/GLI",
    "transform": "yoy_quarterly",
    "entry": 5,
    "quiet": 1
  }
]
