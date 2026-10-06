# Pinned source excerpts

`publisher-anchors.json` contains literal selected occupation records from the accepted academic/Microsoft CSV files and all six Anthropic interaction rows. It records original raw hashes. Scores and category labels were not invented or selected to predict labor outcomes.

`chief-executive-tasks.json` contains the 31 original academic task records for O*NET occupation `11-1011.00`. It permits a separate hand-calculated check that the source's core-weight denominator is 50 and human Beta is 0.35. These are historical task annotations, not the O*NET 31.0 current task set.

Full pinned public inputs remain in the raw archive for parser, aggregation and semantic-provenance validation. Negative tests mutate isolated copies, not production data or the accepted source archive. Mapping tests also use small synthetic graphs to exercise all multiplicities/unmapped states; those graphs are test cases, not invented real-world crosswalks.

Offline discovery never performs network requests. `live_integration.py` is an explicit separate qualification of all pinned files in temporary storage.
