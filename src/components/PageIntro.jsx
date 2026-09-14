import React from 'react'
import { Eyebrow } from './Eyebrow.jsx'

export function PageIntro({ eyebrow, title, description }) { return <section className="page-intro"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{description}</p></section> }
