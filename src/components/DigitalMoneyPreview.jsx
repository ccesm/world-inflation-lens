import React from 'react'
import { digitalCopy } from '../i18n/digitalMoney.js'
export function DigitalMoneyPreview({language}){const t=digitalCopy[language];return <section className="ia-section dm-preview"><p className="eyebrow">{t.title}</p><h2>{t.question}</h2><p>{t.preview}</p><ul>{t.previewItems.map((item,i)=><li key={item}><a href={`#/research/digital-money?focus=${['market','treasuries','deposits','dollarization'][i]}`}>{item} →</a></li>)}</ul><a className="ia-more" href="#/research/digital-money">{t.explore} →</a></section>}
