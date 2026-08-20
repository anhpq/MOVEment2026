---
type: "query"
date: "2026-08-20T04:01:44.487871+00:00"
question: "http://localhost:4173/admin-v2/operations/event-control - cái này là gì \"Configured gap differs from the recommendation\", vui lòng sửa"
contributor: "graphify"
outcome: "useful"
source_nodes: ["AdminV2EventControlPage.tsx", "resources.ts", "admin-v2.css"]
---

# Q: http://localhost:4173/admin-v2/operations/event-control - cái này là gì "Configured gap differs from the recommendation", vui lòng sửa

## Answer

Expanded from original query via graph vocab: [admin, event, control, configured, gap, recommendation, recommended]. AdminV2EventControlPage showed a valid non-blocking warning because eventEndTime was not exactly five minutes before finalStartsAt. The UI was fixed to show the actionable recommended HH:mm close time and reserve enough desktop width; Event Config values and Business Rules were not changed.

## Outcome

- Signal: useful

## Source Nodes

- AdminV2EventControlPage.tsx
- resources.ts
- admin-v2.css