# Team Login Data

Use any of these credentials after running `npm run seed` in `be/`.

Official team QR login uses one unique token per team:

- Plain QR payload: `MV26-TEAM-01-LOGIN`
- JSON QR payload: `{"type":"TEAM_LOGIN","qrToken":"MV26-TEAM-01-LOGIN"}`

Legacy credential QR payloads (`team01:team01`, `team01/team01`, or `{"username":"team01","password":"team01"}`) are still accepted by the frontend for rehearsal convenience, but production QR codes should use the unique token payload.

Single-device rule: every team login, whether by password or QR token, creates a new team session and revokes any previous active session for that same team. The old device will receive `SESSION_REPLACED` on the next authenticated API request and must reload/login again.

| Team | Username | Password | Official QR login token |
| --- | --- | --- | --- |
| Team 01 | team01 | team01 | MV26-TEAM-01-LOGIN |
| Team 02 | team02 | team02 | MV26-TEAM-02-LOGIN |
| Team 03 | team03 | team03 | MV26-TEAM-03-LOGIN |
| Team 04 | team04 | team04 | MV26-TEAM-04-LOGIN |
| Team 05 | team05 | team05 | MV26-TEAM-05-LOGIN |
| Team 06 | team06 | team06 | MV26-TEAM-06-LOGIN |
| Team 07 | team07 | team07 | MV26-TEAM-07-LOGIN |
| Team 08 | team08 | team08 | MV26-TEAM-08-LOGIN |
| Team 09 | team09 | team09 | MV26-TEAM-09-LOGIN |
| Team 10 | team10 | team10 | MV26-TEAM-10-LOGIN |
| Team 11 | team11 | team11 | MV26-TEAM-11-LOGIN |
| Team 12 | team12 | team12 | MV26-TEAM-12-LOGIN |
| Team 13 | team13 | team13 | MV26-TEAM-13-LOGIN |
| Team 14 | team14 | team14 | MV26-TEAM-14-LOGIN |
| Team 15 | team15 | team15 | MV26-TEAM-15-LOGIN |
| Team 16 | team16 | team16 | MV26-TEAM-16-LOGIN |
| Team 17 | team17 | team17 | MV26-TEAM-17-LOGIN |
| Team 18 | team18 | team18 | MV26-TEAM-18-LOGIN |
| Team 19 | team19 | team19 | MV26-TEAM-19-LOGIN |
| Team 20 | team20 | team20 | MV26-TEAM-20-LOGIN |
| Team 21 | team21 | team21 | MV26-TEAM-21-LOGIN |
| Team 22 | team22 | team22 | MV26-TEAM-22-LOGIN |
| Team 23 | team23 | team23 | MV26-TEAM-23-LOGIN |
| Team 24 | team24 | team24 | MV26-TEAM-24-LOGIN |
| Team 25 | team25 | team25 | MV26-TEAM-25-LOGIN |
