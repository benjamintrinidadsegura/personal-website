# bts.online

Persönliche Website und Digital HQ von Benjamin Trinidad Segura.

## Lokal starten

```powershell
npm.cmd run dev
```

Anschließend ist die Website unter <http://localhost:3000> erreichbar.

## EchoWall-Betrieb

Das verbindliche Betriebs- und Production-Readiness-Handbuch liegt unter
[`docs/echowall-production-readiness.md`](docs/echowall-production-readiness.md).

## Newsletter-Betrieb

Die Production- und Datenschutz-Gates für Newsletter V1 liegen unter
[`docs/newsletter-production-readiness.md`](docs/newsletter-production-readiness.md).

## Observability

Die providerneutrale, datensparsame Fehlerdiagnose ist unter
[`docs/observability-readiness.md`](docs/observability-readiness.md) dokumentiert.

## HQ Pulse

Die redaktionelle Pflege von Human Pulse und Open Loops ist unter
[`docs/hq-pulse-authoring.md`](docs/hq-pulse-authoring.md) beschrieben.

## Prüfungen

```powershell
npm.cmd run test:echowall
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```
