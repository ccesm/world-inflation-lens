import { instant } from './core.mjs'

// These are project validation receipts, not publisher-vintage evidence. A receipt
// is tied to one retained snapshot; publication/retrieval cannot substitute for it.
export function validateAcceptance(snapshot) {
 const record=snapshot.acceptanceRecord
 if(!record||record.status!=='PASS'||!record.evidenceRef)throw Error('MISSING_ACCEPTANCE_VALIDATION_RECORD')
 if(!/^[a-f0-9]{40}$/.test(snapshot.inputCommit)||!/^[a-f0-9]{64}$/.test(snapshot.snapshotSha256)||snapshot.datasetId!==snapshot.snapshotPath)throw Error('ACCEPTANCE_IDENTITY_MISMATCH')
 for(const key of ['id','datasetId','snapshotPath','snapshotSha256','inputCommit','inputVintageId'])if(record[key]!==snapshot[key])throw Error('ACCEPTANCE_IDENTITY_MISMATCH:'+key)
 if(record.evidenceRef!==snapshot.acceptanceEvidenceRef)throw Error('ACCEPTANCE_EVIDENCE_MISMATCH')
 const first=instant(snapshot.firstSeenAt),validated=instant(record.validationCompletedAt),recorded=instant(record.recordedAt),accepted=instant(snapshot.snapshotAcceptedAt)
 if(record.evidenceRef.startsWith('OFFLINE_LOCAL_VALIDATION:')&&record.evidenceRef!==`OFFLINE_LOCAL_VALIDATION:${snapshot.snapshotSha256}:${record.validationCompletedAt}`)throw Error('ACCEPTANCE_EVIDENCE_MISMATCH')
 if(Date.parse(first)>Date.parse(validated)||Date.parse(validated)>Date.parse(recorded)||Date.parse(recorded)>Date.parse(accepted))throw Error('CONTRADICTORY_ACCEPTANCE_CHRONOLOGY')
 if(record.firstSeenAt!==snapshot.firstSeenAt)throw Error('FIRST_SEEN_EVIDENCE_MISMATCH')
 return snapshot
}

export function receipt(snapshot,validationCompletedAt,recordedAt=validationCompletedAt) {
 return {...Object.fromEntries(['id','datasetId','snapshotPath','snapshotSha256','inputCommit','inputVintageId','firstSeenAt'].map(k=>[k,snapshot[k]])),status:'PASS',evidenceRef:snapshot.acceptanceEvidenceRef,validationCompletedAt,recordedAt}
}

export function manifestAcceptance(dataset,manifest) {
 // Preserve the reviewed, committed /0.1 receipt without inventing earlier
 // history. Its completion reference and manifest timestamp must agree exactly.
 if(dataset.acceptanceRecord)return validateAcceptance(dataset)
 if(manifest.validation!=='PASS_GENERIC_CONTRACTS_AND_EXISTING_INTERNATIONAL_VALIDATORS'||!manifest.validationCompletedAt)throw Error('MISSING_ACCEPTANCE_VALIDATION_RECORD')
 const completed=instant(manifest.validationCompletedAt)
 if(dataset.acceptanceEvidenceRef!==`OFFLINE_LOCAL_VALIDATION:${dataset.snapshotSha256}:${manifest.validationCompletedAt}`)throw Error('ACCEPTANCE_EVIDENCE_MISMATCH')
 if(dataset.inputCommit!==manifest.inputCommit||dataset.inputVintageId!==`${dataset.inputCommit}:${dataset.snapshotPath}`||dataset.datasetId!==dataset.snapshotPath||dataset.id!==`snapshot:${dataset.snapshotPath}:${dataset.snapshotSha256}`)throw Error('ACCEPTANCE_IDENTITY_MISMATCH')
 return validateAcceptance({...dataset,acceptanceRecord:receipt(dataset,completed)})
}
