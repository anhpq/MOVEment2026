---
type: "query"
date: "2026-07-29T05:52:37.137302+00:00"
question: "đây là giao diện và màu sắc, hãy làm tương tự, lưu ý đừng để màu sắc của đội ghi đè"
contributor: "graphify"
outcome: "useful"
source_nodes: ["TeamGameplayV2Page.tsx", "TeamV2QrBadge.tsx", "TeamV2QrScanner.tsx", "AppFrame.tsx", "getTeamThemeVars"]
---

# Q: đây là giao diện và màu sắc, hãy làm tương tự, lưu ý đừng để màu sắc của đội ghi đè

## Answer

Expanded from original query via graph vocab: [team, gameplay, hud, theme, color, colors, page, marker, badge, scanner, style, frame]. Traversal identified TeamGameplayV2Page.tsx, TeamV2QrBadge.tsx, TeamV2QrScanner.tsx, AppFrame.tsx and getTeamThemeVars as the relevant V2/theme boundary. The implementation keeps reference colors in route-local --team-v2-* variables and V2_HUD_ACCENT so Team.color/global theme cannot override the HUD.

## Outcome

- Signal: useful

## Source Nodes

- TeamGameplayV2Page.tsx
- TeamV2QrBadge.tsx
- TeamV2QrScanner.tsx
- AppFrame.tsx
- getTeamThemeVars