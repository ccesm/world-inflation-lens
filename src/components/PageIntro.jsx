import React from 'react'
import { Eyebrow } from './Eyebrow.jsx'

export function PageIntro({ eyebrow, title, description, className = '' }) { return <section className={`page-intro ${className}`.trim()}><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{description}</p></section> }
