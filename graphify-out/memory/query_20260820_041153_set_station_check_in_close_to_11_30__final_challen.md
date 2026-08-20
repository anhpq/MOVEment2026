---
type: "query"
date: "2026-08-20T04:11:53.434174+00:00"
question: "Set Station check-in close to 11:30, Final Challenge open to 11:45, remove the timing-gap advisory, and explain Cancel cooldown"
contributor: "graphify"
outcome: "useful"
source_nodes: ["AdminV2EventControlPage.tsx", "EventConfigService", "PlayerService", "OPEN_QUESTIONS_AND_DECISIONS.md"]
---

# Q: Set Station check-in close to 11:30, Final Challenge open to 11:45, remove the timing-gap advisory, and explain Cancel cooldown

## Answer

Expanded from original query via graph vocab: [station, check, cutoff, final, challenge, open, cancel, cooldown, minutes, configuration]. AdminV2EventControlPage owns the quoted advisory; it was removed while EventConfig remains authoritative. Local development EventConfig now has eventEndTime 11:30 and finalStartsAt 11:45. PlayerService currently clears nextCheckInAllowedAt and does not apply cancelCooldownMinutes, so the field is legacy and value 0 has no runtime cooldown effect.

## Outcome

- Signal: useful

## Source Nodes

- AdminV2EventControlPage.tsx
- EventConfigService
- PlayerService
- OPEN_QUESTIONS_AND_DECISIONS.md