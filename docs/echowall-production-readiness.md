# EchoWall: Betrieb und Production Readiness

Stand: 22. August 2026
Status: verbindliches Betriebshandbuch für den aktuellen EchoWall-Umfang  
Geltung: bts.online, EchoWall und die zugehörige Adminmoderation

> Rechtlicher Hinweis: Jede in diesem Dokument genannte Datenschutz- oder
> Aufbewahrungsfrist ist ein **Produktvorschlag – nicht juristisch geprüft**.
> Vor dem Produktionsstart müssen die verantwortliche Person und gegebenenfalls
> eine qualifizierte Rechtsberatung die Entscheidungen bestätigen.

## Statusbegriffe

Dieses Dokument verwendet folgende Kennzeichnungen:

- **Implementiert:** im aktuellen Repository beziehungsweise Datenbankschema vorhanden.
- **Real getestet:** im Entwicklungsprojekt tatsächlich ausgeführt und bestätigt.
- **Dashboard-Check:** manuell im Supabase Dashboard zu prüfen; kein bestätigter Ist-Wert.
- **Hosting-Check:** auf der späteren Hostingplattform zu konfigurieren oder zu prüfen.
- **Offene Entscheidung:** vor Production bewusst festzulegen.
- **Nicht real getestet:** als Betriebsprozess geplant, aber noch nicht praktisch nachgewiesen.
- **Späterer Ausbau:** nicht Teil des gegenwärtigen MVP-Betriebs.

## 1. Zweck und Geltungsbereich

Dieses Dokument ist die verbindliche Betriebsgrundlage für EchoWall. Es beschreibt
den bekannten technischen Ist-Stand, den erforderlichen Produktions-Sollzustand,
manuelle Betriebsprozesse, Recovery- und Incident-Abläufe sowie Go-/No-Go-Kriterien.

Es ist keine Behauptung, dass Dashboard-, Hosting-, Backup- oder Restore-Funktionen
bereits produktiv konfiguriert oder getestet wurden. Abweichungen vom beschriebenen
Sollzustand sind vor Production zu dokumentieren und ausdrücklich zu akzeptieren.

Nicht Teil dieses Dokuments sind eine neue Autharchitektur, eine öffentliche
Self-Service-Löschung, Permanent Purge, ein Admin-Management-Frontend, ein externer
Monitoringdienst oder ein Deployment.

## 2. Architekturüberblick

EchoWall besteht aus folgenden Schichten:

1. Die öffentliche EchoWall und die Startseitenvorschau lesen ausschließlich
   freigegebene Echos über eine serverseitige Query.
2. Die Einreichung läuft als Next.js Server Action. Origin, Host, Formulartoken,
   Honeypot und Eingaben werden serverseitig geprüft.
3. Hashes für Netzwerk, E-Mail, Nachricht, Token und Löschreferenz werden
   serverseitig erzeugt. Eine rohe IP-Adresse wird nicht gespeichert.
4. `submit_echo` führt Replay-, Rate-Limit- und Duplicate-Prüfungen sowie alle
   Inserts atomar in PostgreSQL aus.
5. Private Kontaktadressen liegen getrennt von öffentlichen Echo-Daten.
6. Die Moderation verwendet Supabase Auth, `admin_users`, Adminrolle, Aktivstatus,
   TOTP und AAL2.
7. Sensible Adminzugriffe erfolgen über `SECURITY DEFINER`-RPCs mit festem
   `search_path`; normale `authenticated` Nutzer besitzen keine direkten
   Tabellenrechte.
8. Moderationsübergänge verwenden `expected_status` und `SELECT ... FOR UPDATE`.
9. Öffentliche Daten werden höchstens fünf Minuten gecacht und bei relevanten
   Moderationsänderungen gezielt invalidiert.

## 3. Aktueller Sicherheitsstand

### Implementiert

- Öffentliche Queries filtern auf `status = approved` und gesetztes `approved_at`.
- `anon` und normale `authenticated` Rollen besitzen keine EchoWall-Tabellenrechte.
- Die Admin-Allowlist verlangt `role = admin` und `is_active = true`.
- Sensible Admin-RPCs verlangen AAL2 zusätzlich in PostgreSQL.
- Adminseiten prüfen Benutzer, Allowlist und Assurance Level serverseitig.
- Admincookies sind `HttpOnly`, `SameSite=Lax`, auf `/admin` begrenzt und in
  Production `Secure`.
- Origin und Host werden gegen `SITE_URL` geprüft.
- Login- und RPC-Fehler werden als kontrollierte Meldungen zurückgegeben.
- Formulartokens sind signiert, zeitlich begrenzt und gegen Replay geschützt.
- Moderation und Auditlog sind atomar.
- `deleted -> hidden` ist der einzige Recoveryweg aus dem Deleted Archive;
  `approved_at` wird dabei auf `null` gesetzt.
- Private Kontakte werden bei Delete entfernt.
- Admin-, Login- und MFA-Seiten sind `noindex` und nicht öffentlich verlinkt.
- Server-only Secrets besitzen kein `NEXT_PUBLIC_`-Präfix.

### Real getestet

- Submit, Approve, Hide, Restore, Delete und erneute Freigabe
- öffentliche Anzeige ausschließlich freigegebener Echos
- Deleted Archive und `deleted -> hidden`
- keine öffentliche Sichtbarkeit unmittelbar nach Recovery
- Moderationshistorie und Auditlog
- `expected_status`, parallele Schutzprüfungen und Rollback im Integrationstest
- Login, TOTP-MFA, AAL2 und Adminmoderation
- RLS- und RPC-Berechtigungen im Entwicklungsprojekt
- öffentliche Cacheinvalidierung
- Desktop- und Mobile-Navigation

### Noch nicht als Produktionsbetrieb nachgewiesen

- produktive Dashboard- und Sessioneinstellungen
- produktives Hosting und Reverse-Proxy-Verhalten
- live ausgeführter vollständiger Restore (das sichere V1-Verfahren ist dokumentiert)
- Secret-Rotation unter Produktionsbedingungen
- Lost-MFA- und Admin-Offboarding-Drill
- strukturierte Betriebslogs und Alarmierung
- manueller oder automatischer Retention-Cleanup

## 4. Auth- und MFA-Sollzustand

Verbindlicher Sollzustand:

- Öffentliche Registrierung ist deaktiviert.
- Adminaccounts werden ausschließlich bewusst und manuell angelegt.
- Die E-Mail-Adresse jedes Adminaccounts ist bestätigt.
- TOTP ist aktiviert und für Moderation erforderlich.
- Jede sensible Admin-RPC verlangt AAL2.
- AAL1 darf keine Moderations-, Kontakt-, Archiv- oder Historienaktion ausführen.
- `admin_users`-Allowlist, `role = admin` und `is_active = true` sind erforderlich.
- Es gibt keinen dauerhaften oder temporären MFA-Bypass über die Anwendung.
- Adminrouten werden nicht in der öffentlichen Navigation verlinkt.
- Login-, MFA- und Adminseiten bleiben `noindex`.

### Supabase-Dashboard-Checkliste

- [ ] **Dashboard-Check:** Site URL entspricht exakt der Produktionsdomain.
- [ ] **Dashboard-Check:** Redirect URLs enthalten nur ausdrücklich benötigte Ziele.
- [ ] **Dashboard-Check:** öffentliche Registrierung ist deaktiviert.
- [ ] **Dashboard-Check:** TOTP ist aktiviert.
- [ ] **Dashboard-Check:** Faktorlimit ist bewusst festgelegt.
- [ ] **Dashboard-Check:** JWT-Laufzeit ist dokumentiert und nicht unnötig lang.
- [ ] **Dashboard-Check:** Inactivity Timeout ist entschieden und konfiguriert.
- [ ] **Dashboard-Check:** Time-boxed Sessions sind entschieden und konfiguriert.
- [ ] **Dashboard-Check:** Single Session ist entschieden und konfiguriert.
- [ ] **Dashboard-Check:** Auth- und MFA-Rate-Limits sind geprüft.
- [ ] **Dashboard-Check:** Passwort-Reset-Prozess und Redirects sind geprüft.
- [ ] **Dashboard-Check:** SMTP-Konfiguration ist für den gewählten Resetprozess geeignet.

Session-Time-box, Inactivity Timeout, Single Session, Backups, PITR, Logumfang und
Netzwerkfunktionen können tarif- oder providerabhängig sein. Ihr Vorhandensein darf
nicht vorausgesetzt werden.

## 5. Admin-Onboarding

1. Auth-Nutzer bewusst im richtigen Supabase-Projekt anlegen.
2. E-Mail-Bestätigung prüfen.
3. Benutzer-ID über einen sicheren, kurzlebigen Arbeitsweg ermitteln.
4. Genau diese ID in `admin_users` eintragen.
5. `role = admin` und `is_active = true` setzen.
6. Login über `/admin/login` durchführen.
7. TOTP genau einmal registrieren und verifizieren.
8. AAL2 serverseitig bestätigen.
9. Moderationszugriff, Historie und Deleted Archive prüfen.
10. Negativtest durchführen: AAL1 darf nicht moderieren.
11. Ergebnis ohne E-Mail, Benutzer-ID, Faktor-ID oder andere private Kennungen
    im Betriebsbericht dokumentieren.

Für den aktuellen Einzeladminbetrieb wird keine Admin-Management-Oberfläche benötigt.

## 6. Admin-Deaktivierung und Offboarding

### Deaktivieren

1. `is_active = false` setzen.
2. Reale Admin-RPC prüfen; der Zugriff muss abgewiesen werden.
3. Bestehende Auth-Sessions widerrufen.
4. Bei Kompromittierung Passwort und MFA-Faktoren kontrolliert zurücksetzen.
5. Allowlist-Zeile zunächst behalten.
6. Auditlog und historische Moderation erhalten.
7. Öffentliche Inhalte und jüngste Moderationsaktionen prüfen.
8. Deaktivierung ohne persönliche Kennungen dokumentieren.

### Endgültig entfernen

- Immer zuerst deaktivieren, niemals unmittelbar löschen.
- Auswirkungen auf Audit, Actor-Referenzen, Authdaten, Retention und Backups prüfen.
- Endgültige Entfernung erst nach einer eigenen, dokumentierten Entscheidung.
- Historische Moderation darf nicht versehentlich verloren gehen.
- Eine Entfernung aus `admin_users` ersetzt keinen Sessionwiderruf.

## 7. Lost-MFA- und kompromittierter-Admin-Prozess

1. Betroffenen Allowlist-Eintrag sofort mit `is_active = false` deaktivieren.
2. Alle bekannten Sessions widerrufen.
3. Identität außerhalb des verlorenen oder kompromittierten Kanals prüfen.
4. Keine Moderation über AAL1 freigeben.
5. Nur eindeutig kompromittierte oder unverifizierte MFA-Faktoren entfernen.
6. Kein neuer Faktor wird automatisch angelegt.
7. Neues TOTP-Enrollment manuell genau einmal starten.
8. AAL2 erneut real prüfen.
9. Auditlog und jüngste Moderationsvorgänge kontrollieren.
10. Verdächtige öffentliche Inhalte sofort ausblenden und untersuchen.
11. Erst nach Abschluss aller Prüfungen `is_active = true` setzen.

Ein Break-glass-Zugang darf niemals zu einem dauerhaften MFA-Bypass führen. Der
sichere Supabase-Projektzugang ist organisatorisch getrennt vom betroffenen
Website-Adminaccount aufzubewahren.

## 8. Session- und Account-Sicherheit

### Implementiert

- Server- und Browserzugriff sind getrennt; Auth- und Secret-Key-Clients sind
  server-only.
- Admincookies verwenden `HttpOnly`, `SameSite=Lax`, `path=/admin` und in
  Production `Secure`.
- Sessionaktualisierung erfolgt über den Admin-Proxy.
- Redirectziele sind fest vorgegeben; es werden keine beliebigen Rücksprung-URLs
  aus Benutzereingaben übernommen.
- Login- und Admin-Actions prüfen Origin und Host.
- Fehlermeldungen nennen nicht, ob ein Account existiert.

### Vor Production zu prüfen

- [ ] Sessionwiderruf auf allen Geräten ist als manueller Prozess getestet.
- [ ] Stale Sessions nach `is_active = false` können keine RPC ausführen.
- [ ] Hosting liefert vertrauenswürdige Host-, Proto- und Client-IP-Header.
- [ ] Produktionsdomain und `SITE_URL` stimmen exakt überein.
- [ ] Login- und MFA-Rate-Limits sind im Supabase Dashboard geprüft.
- [ ] Passwort-Reset widerruft beziehungsweise behandelt bestehende Sessions wie geplant.
- [ ] Preview- und Production-Cookies beziehungsweise Domains überlappen nicht.

## 9. Dateninventar

Alle Aufbewahrungsangaben in dieser Tabelle sind **Produktvorschlag – nicht
juristisch geprüft**.

| Datenart | Zweck | Sichtbarkeit | Zugriff | vorgeschlagene Aufbewahrung | Entfernung | Backup-Auswirkung | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Anzeigename | öffentliche Zuordnung | öffentlich nur bei `approved` | Öffentlichkeit, Admin | Lebensdauer des Echos | löschen oder anonymisieren | bis Backupablauf enthalten | offen |
| Nachricht | eigentlicher Echo-Inhalt | öffentlich nur bei `approved` | Öffentlichkeit, Admin | Lebensdauer des Echos | löschen oder anonymisieren | bis Backupablauf enthalten | offen |
| Kategorie | Einordnung | öffentlich bei `approved` | Öffentlichkeit, Admin | Lebensdauer des Echos | mit Echo entfernen | bis Backupablauf enthalten | offen |
| `created_at` | zeitliche Einordnung | teilweise öffentlich abgeleitet | Server, Admin | Lebensdauer des Echos | mit Echo entfernen | bis Backupablauf enthalten | offen |
| `status` | Moderationssteuerung | intern | AAL2-Admin, DB | Lebensdauer plus Retention | mit Echo entfernen | bis Backupablauf enthalten | implementiert |
| `approved_at` | Freigabe und Sortierung | öffentlich abgeleitet | Server, Admin | Lebensdauer des Echos | bei Recovery auf `null` | bis Backupablauf enthalten | implementiert |
| private Kontakt-E-Mail | freiwillige Rückfrage | privat | nur AAL2-Admin über RPC | Zweckfortfall, spätestens 90 Tage | löschen; bei Delete bereits entfernt | bis Backupablauf enthalten | Frist offen |
| Löschreferenz-Hash | Zuordnung einer Löschanfrage | intern | ausschließlich Serverprozess | bis endgültigem Abschluss | Hash entfernen | bis Backupablauf enthalten | Prozess offen |
| Netzwerk-Hash | Rate Limit | intern | DB-Funktion | 48 Stunden | abgelaufene Zeile löschen | bis Backupablauf enthalten | Cleanup offen |
| E-Mail-Hash | Duplicate Detection | intern | DB-Funktion | 48 Stunden | abgelaufene Zeile löschen | bis Backupablauf enthalten | Cleanup offen |
| Nachrichten-Hash | Duplicate Detection | intern | DB-Funktion | 48 Stunden | abgelaufene Zeile löschen | bis Backupablauf enthalten | Cleanup offen |
| Moderationsgrund | Nachvollziehbarkeit | intern | AAL2-Admin | 12 Monate | löschen oder datensparsam pseudonymisieren | bis Backupablauf enthalten | Frist offen |
| Auditereignis | Status- und Sicherheitsnachweis | intern | AAL2-Admin | 12 Monate | nach Frist löschen/pseudonymisieren | bis Backupablauf enthalten | Frist offen |
| Actor-UUID | interne Actor-Zuordnung | intern | DB; nicht normale Monitoringlogs | wie Auditereignis | später pseudonymisieren | bis Backupablauf enthalten | offen |
| Authdaten | Adminaccount und Sessions | Supabase Auth | Auth-Admin | bis Accountende plus Providerfristen | kontrollierter Auth-Prozess | providerabhängig | Dashboard-Check |
| Backups | Disaster Recovery | verschlüsselte private Ablage außerhalb von Git und öffentlichem Webroot | Restore Owner Benjamin Trinidad Segura | wöchentlich bei aktiven Writes sowie vor risikoreichen Änderungen | nach bestätigtem internem Löschzyklus | kann physische Löschung bis zum Ablauf verzögern | V1-Verfahren dokumentiert |

## 10. Retentionmodell

Jede Frist in diesem Abschnitt ist ein **Produktvorschlag – nicht juristisch geprüft**:

- `pending`: maximal 90 Tage
- `approved`: bis Widerruf, Löschung oder Inhaltsprüfung
- `rejected`: 90 Tage
- `hidden`: Prüfung spätestens nach 180 Tagen
- `deleted`: 30 Tage wiederherstellbar
- private Kontakte: nach Zweckfortfall, spätestens nach 90 Tagen
- Rate-Limit- und Duplicate-Daten: 48 Stunden
- Auditlog und Moderationsgründe: 12 Monate
- Backups: gemäß dem manuellen V1-Verfahren in `docs/v1-backup-recovery.md`; keine automatische Free-Plan- oder PITR-Garantie

> **Wichtiger Ist-Stand:** `retention_until` und `expires_at` löschen derzeit
> nichts. Es existiert kein automatischer Purge. Bis zur gesonderten technischen
> Freigabe ist ein dokumentierter manueller Bereinigungsprozess erforderlich.
> Keine Frist ist juristisch final bestätigt.

Manueller Mindestprozess:

1. Wöchentlich Anzahl überfälliger Datensätze ohne Inhalte protokollieren.
2. Monatlich zu löschende Datensatzklassen prüfen.
3. Vor jeder Löschung Scope und Backupauswirkung bestätigen.
4. Nur eindeutig überfällige Datensätze entfernen.
5. Ergebnis ausschließlich aggregiert dokumentieren.
6. Keine manuelle Bereinigung ohne separate Freigabe ausführen.

## 11. Datenschutzanfragen und Löschreferenz

Aktueller Prozess:

1. Anfrage ausschließlich über einen bestätigten Kontaktkanal entgegennehmen.
2. Sensible Inhalte nicht in normalen Tickets oder E-Mails wiederholen.
3. Löschreferenz ausschließlich serverseitig prüfen.
4. Referenz und gespeicherte Hashes niemals offenlegen oder loggen.
5. Bei gültiger Referenz nur den zugehörigen Echo bearbeiten.
6. Problematischen öffentlichen Inhalt vor tieferer Prüfung zunächst ausblenden.
7. Eine verlorene Referenz darf nicht allein durch einen Anzeigenamen ersetzt werden.
8. Eine freiwillige Kontaktadresse nur kontrolliert zur zusätzlichen Prüfung verwenden.
9. Kontaktadresse nach Zweckfortfall löschen.
10. Auditlog getrennt nach seiner eigenen Retention behandeln.
11. Backup-Auslauf und mögliche zeitlich verzögerte physische Entfernung transparent kommunizieren.
12. Keine Zusage über einen Zeitpunkt machen, der nicht technisch und organisatorisch belegt ist.

Es gibt aktuell keine öffentliche Self-Service-Löschung. Der Löschreferenz-Hash ist
implementiert, der vollständige operative Lookup- und Entscheidungsprozess ist aber
noch nicht real getestet.

## 12. Backup- und Recovery-Matrix

RPO und RTO sind betriebliche Zielwerte, keine bestätigten Providerzusagen.

| Szenario | RPO-Ziel | RTO-Ziel | Recovery-Schritte | möglicher Datenverlust | Verantwortlich | Voraussetzungen | real getestet |
| --- | --- | --- | --- | --- | --- | --- | --- |
| einzelner Echo versehentlich gelöscht | 0 | 15 Minuten | Archive öffnen, `deleted -> hidden`, nicht öffentliche Sichtbarkeit prüfen, bewusst neu freigeben | keiner | EchoWall-Admin | AAL2 und Archive intakt | **ja** |
| Admin versehentlich deaktiviert | 0 | 30 Minuten | Auth-Nutzer und Allowlist prüfen, sicher reaktivieren, Sessions und MFA prüfen | keiner | Projektverantwortliche | sicherer Projektzugang | nein |
| fehlerhafte Migration | Stand vor Migration | 2 Stunden | Writes stoppen, Historie/Schema prüfen, Folgemigration oder bestätigten Restoreweg nutzen | Änderungen seit Restorepunkt | DB-Verantwortliche | Dry Run und Backup | nein |
| Datenbank beschädigt | höchstens 7 Tage bei aktiven V1-Writes; vor Änderungen Stand des Pre-Change-Backups | 1 Arbeitstag | letztes verifiziertes logisches Backup ausschließlich in isoliertes Ziel wiederherstellen, Migrationen/Rechte abgleichen, Smoke-Test, erst danach bewusster Trafficwechsel | Änderungen seit letztem Backup | Restore Owner Benjamin Trinidad Segura | verschlüsselte logische Sicherung und isoliertes Ziel | Verfahren verifiziert; live nein |
| Secret kompromittiert | 0 Datenverlust | 1 Stunde Eindämmung | Key rotieren, Hosting aktualisieren, deployen, alten Wert widerrufen, Logs prüfen | mögliche Exposition | Projektverantwortliche | Zugriff auf Hosting und Supabase | nein |
| öffentliche Seite ausgefallen | nicht anwendbar | 1 Stunde | Hosting- und DB-Status prüfen, letzte stabile Version wiederherstellen | keine DB-Daten | Betreiber | Repository und Konfiguration verfügbar | nein |
| Supabase-Ausfall | providerabhängig | providerabhängig | riskante Writes stoppen, Status prüfen, nach Recovery Integrität testen | providerabhängig | Supabase/Betreiber | Status- und Eskalationsweg | nein |
| Hosting-Ausfall | 0 DB-Daten | 1–4 Stunden | kontrolliert neu deployen oder Wiederherstellungsziel verwenden | keine DB-Daten | Betreiber | Code und Environments gesichert | nein |
| kompromittierter Admin | Zeitpunkt der Erkennung | 1 Stunde Eindämmung | deaktivieren, Sessions widerrufen, Audit und öffentliche Inhalte prüfen | mögliche unbefugte Moderation | Projektverantwortliche | unabhängiger Projektzugang | nein |

Beide aktuellen Supabase-Projekte sind laut Betreiber-Dashboard Free-Projekte in
AWS `eu-central-1` (Frankfurt, EU). Der Free-Tarif enthält keine automatischen
Datenbankbackups und kein PITR. Der proportionate manuelle Sicherungs- und isolierte
Restoreablauf, die Verantwortung und Eskalationskriterien stehen verbindlich in
`docs/v1-backup-recovery.md`. Das Verfahren wurde dokumentarisch und statisch
verifiziert; ein Live-Restore wurde bewusst nicht ausgeführt.

## 13. Loggingregeln

### Erlaubte strukturierte Felder

- `event_type`
- `operation`
- `controlled_error_code`
- `status_code`
- `timestamp`
- `duration_ms`
- `environment`
- kurzlebige `correlation_id`

### Niemals loggen

- Nachrichtentext oder Anzeigename
- private E-Mail-Adresse
- Löschreferenz
- Netzwerk-, E-Mail-, Nachrichten-, Token- oder Löschreferenz-Hashes
- vollständige IP-Adresse
- Actor-UUID
- Auth- oder Sessiontoken
- TOTP-Code oder TOTP-Seed
- Faktor-ID oder Challenge-ID
- Secret oder Datenbankkennwort
- `DATABASE_URL`
- rohe SQL- oder PostgREST-Fehler

### Nur aggregiert zählen

- Rate-Limit-Ablehnungen
- Duplicate-Ablehnungen
- Tokenfehler
- AAL1-Zugriffsversuche
- Nicht-Admin-Zugriffe
- Moderations- und `expected_status`-Konflikte
- Cacheinvalidierungsfehler
- RPC- und Datenbankfehler

## 14. Monitoring und Alarmierung

Für das MVP werden Hosting- und Supabase-Logs sowie ein dokumentierter
Kontrollrhythmus verwendet. Es wird keine externe Monitoringplattform vorausgesetzt.

### Kritisch

- Datenbank nicht erreichbar
- Secret kompromittiert
- Admin kompromittiert
- unerwartete Rechteausweitung
- öffentliche Inhalte können nicht verborgen werden
- wiederholte unautorisierte Adminaktionen

### Hoch

- Submission-Spike
- wiederholte RPC-Fehler
- öffentlicher Cache inkonsistent
- Auth- oder MFA-Störung
- ungewöhnlich viele `expected_status`-Konflikte

### Mittel

- steigende Duplicate-Quote
- viele manipulierte oder abgelaufene Tokens
- wachsende Rate-Limit-Tabelle
- veralteter PostgREST-Schemacache
- überfällige Retention-Daten

Bis ein Alarmkanal eingerichtet ist, ist die Kontrolle manuell. Monitoring- und
Incidentkontakt sowie aktueller operativer Owner ist Benjamin Trinidad Segura.
Automatisierte Alarmierung bleibt ein SHOULD/LATER-Ausbau; die in Abschnitt 23
festgelegten Kontrollrhythmen gelten für V1.

## 15. Incident-Response-Runbooks

Jeder Incident folgt diesem Ablauf:

1. erkennen
2. eingrenzen
3. Zugriff sichern
4. Schaden begrenzen
5. riskante Writes stoppen
6. Ursache analysieren
7. Zustand wiederherstellen
8. Daten und Logs prüfen
9. Kommunikation entscheiden
10. Gegenmaßnahme dokumentieren

### Kompromittierter Admin

`is_active = false` setzen, Sessions widerrufen, Zugangsdaten und Faktoren sichern,
Auditlog prüfen, verdächtige Freigaben ausblenden und erst nach neu bestätigtem AAL2
reaktivieren.

### Kompromittierter Supabase-Key

Betroffenen Key sperren beziehungsweise rotieren, Hostingvariable aktualisieren,
kontrolliert deployen, alten Wert widerrufen und Rechte sowie Logs prüfen. Keine
Secretwerte in Incidentberichte übernehmen.

### Spamwelle

Submissionzahlen aggregiert prüfen, Einreichung bei Bedarf kontrolliert stoppen,
Proxyheader und Rate-Limit-Wirkung untersuchen und Grenzen nur auf Basis realer
Daten ändern. Keine pauschale Löschung vorhandener Echos.

### Fehlerhafte Migration

Weitere Writes stoppen, angewendete Migration unverändert lassen, lokale und
entfernte Historie vergleichen, Recoverypunkt prüfen und ausschließlich eine neue
Folgemigration oder einen bestätigten Restoreweg verwenden.

### Versehentliche öffentliche Freigabe

Echo sofort `approved -> hidden` setzen, Datenbankstatus prüfen, öffentliche
EchoWall und Startseite kontrollieren, Cache gegebenenfalls erneut invalidieren und
Ursache im Audit untersuchen.

### Supabase-Ausfall

Kontrollierten Fehlerzustand akzeptieren, keine riskanten Writes wiederholen,
Providerstatus prüfen und nach Wiederherstellung Datenintegrität, RPCs und Cache testen.

### Hosting-Ausfall

Hostingstatus und letzten Build prüfen, keine Datenbankmigration auslösen, letzte
stabile Version kontrolliert wiederherstellen und danach öffentliche und Adminrouten testen.

### Cacheinvalidierung fehlgeschlagen

Zuerst Datenbankstatus als Quelle der Wahrheit prüfen. Eine erfolgreiche RPC nicht
blind wiederholen. Öffentliche Sichtbarkeit kontrollieren, Tag und Pfade erneut
invalidieren oder kontrolliert neu deployen. Den Cachefehler ohne Inhaltsdaten erfassen.

## 16. Rate-Limit- und Spam-Schutz

### Implementierter Ist-Stand

- 3 Einreichungen je Netzwerk-Hash innerhalb von 15 Minuten
- 10 Einreichungen je Netzwerk-Hash innerhalb von 24 Stunden
- Duplicate-Schutz für gleiche Nachricht plus Netzwerk-Hash innerhalb von 24 Stunden
- Duplicate-Schutz für gleiche Nachricht plus E-Mail-Hash innerhalb von 24 Stunden
- Formulartoken muss mindestens 3 Sekunden alt sein
- Formulartoken läuft nach 2 Stunden ab
- Replay-Schutz über eindeutigen Token-Hash
- Honeypot
- Nachricht: 10 bis 500 Zeichen
- Anzeigename: 2 bis 40 Zeichen
- E-Mail: optional, syntaktisch geprüft, maximal 254 Zeichen
- HTML-, URL-, Unicode-Normalisierungs- und Steuerzeichenprüfung
- Datenbanksperren gegen parallele Umgehung

Es gibt aktuell **kein separates mengenbasiertes E-Mail-Rate-Limit**. E-Mail ist
durch Eingabelimit und Message-plus-E-Mail-Duplicate-Schutz abgedeckt. Dies darf im
Betrieb nicht als eigenständiges E-Mail-Mengenlimit beschrieben werden.

### Offene Risiken und Prüfungen

- gemeinsame Unternehmens-, Mobilfunk- oder Heimnetzwerke können legitime Nutzer blockieren
- verteilte Angriffe können Netzwerkgrenzen umgehen
- Clientadresse hängt von vertrauenswürdigen Hosting-Proxyheadern ab
- IPv4-/IPv6-Verhalten ist im Zielhosting real zu testen
- abgelaufene Schutzdaten werden derzeit nicht automatisch gelöscht
- Nutzer können persönliche Daten freiwillig in Nachrichtentext schreiben
- Server-Action-Bodylimit ist noch nicht explizit enger konfiguriert
- CAPTCHA wird erst bei belegtem realem Bedarf erwogen

## 17. Secret Management und Rotation

### Server-only

- `SUPABASE_SECRET_KEY`
- `DATABASE_URL`
- `ECHOWALL_IP_HASH_SECRET`
- `ECHOWALL_FORM_TOKEN_SECRET`

### Öffentlich verwendbar, aber kontrolliert zu konfigurieren

- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SITE_URL`

Kein Secretwert wird in dieses Dokument, in Commits, normale Logs, Screenshots oder
Betriebsberichte übernommen. Production-Secrets dürfen nicht in Preview-Umgebungen
verfügbar sein.

### Standardrotation

1. Auswirkung und abhängige Umgebungen ermitteln.
2. Neuen Wert sicher erzeugen beziehungsweise vom Provider beziehen.
3. Hosting-Environment aktualisieren.
4. Kontrolliertes Deployment durchführen.
5. Smoke-Test ohne Ausgabe des Werts.
6. Alten Wert widerrufen.
7. Logs und Zugriffe prüfen.
8. Rotation nur mit Datum, Verantwortlichem und Ergebnis dokumentieren.

### Besonderheiten

- Das Formulartoken-Secret erst nach Ablauf aller ausgegebenen Tokens rotieren.
- Das IP-Hash-Secret nur mit Übergangsplanung rotieren, weil aktive Rate-Limit-
  Zuordnungen sonst wechseln.
- Löschreferenz-Hashes verwenden ebenfalls ein HMAC-Verfahren; ihr Verifikations-
  und Rotationsprozess muss vor einer Rotation separat berücksichtigt werden.
- Eine Datenbankpasswortrotation muss CLI, Migrationstooling und Hosting getrennt
  aktualisieren.
- Nach Auth-bezogenen Rotationen sind Sessions und Adminzugriff zu prüfen.

## 18. Datenbank- und Migrationsroutine

Verbindliche Reihenfolge:

1. bestehende Migrationen und, soweit geführt, ihre Hashes prüfen
2. `supabase migration list` über die richtige lokale `DATABASE_URL`
3. ausschließlich eine neue Folgemigration erstellen
4. SQL-Review auf Transaktionen, Sperren, RLS, Grants, `SECURITY DEFINER` und `search_path`
5. `supabase db push --db-url <lokale DATABASE_URL> --dry-run`
6. ausdrückliche Freigabe einholen
7. `supabase db push` ohne `--include-all`
8. `supabase migration list` danach erneut prüfen
9. PostgREST-Schemacache prüfen
10. reale RPC-, RLS- und Rechte-Tests durchführen
11. Regressionstests ausführen
12. Browser-Smoke-Test durchführen
13. Recoveryweg und Ergebnis dokumentieren

Im Normalbetrieb verboten:

- angewendete Migration verändern
- `migration repair` ohne vorherige eindeutige Diagnose
- Reset eines verbundenen Projekts
- `--include-all` ohne Einzelprüfung
- Secrets oder vollständige Verbindungsstrings ausgeben
- `ALL PRIVILEGES` oder pauschale Rechte ohne belegten Bedarf vergeben

## 19. Cache- und Verfügbarkeitsbetrieb

- Öffentliche Echo-Daten dürfen im Normalbetrieb höchstens fünf Minuten stale sein.
- `approved -> hidden/deleted` muss öffentliche Caches sofort invalidieren.
- `hidden/pending/rejected -> approved` muss öffentliche Caches sofort invalidieren.
- `deleted -> hidden` invalidiert keinen öffentlichen Cache, weil der Echo nicht
  öffentlich wird.
- Die Adminansicht ist niemals Quelle für öffentliche Cacheeinträge.
- Nach sensibler Moderation ist ein öffentlicher Smoke-Test durchzuführen.
- Bei Datenbankfehler zeigt die öffentliche Query einen kontrollierten
  Nicht-verfügbar-Zustand statt private Fehlerdetails.

Bei einem Cachefehler nach erfolgreicher RPC:

1. Datenbankstatus als Quelle der Wahrheit prüfen.
2. Öffentliche EchoWall und Startseitenvorschau kontrollieren.
3. Erfolgreiche Datenbankmutation nicht fälschlich wiederholen.
4. Tag/Pfade erneut invalidieren oder kontrolliert neu deployen.
5. Fehler ohne Echo-Inhalt oder interne Kennungen dokumentieren.

## 20. Produktionskonfiguration Hosting

- [ ] **Offene Entscheidung:** Hostinganbieter festlegen.
- [ ] **Hosting-Check:** Produktionsdomain festlegen und verifizieren.
- [ ] **Hosting-Check:** HTTPS ist aktiv und vollständig geprüft.
- [ ] **Hosting-Check:** kanonische www-/non-www-Variante ist festgelegt.
- [ ] **Hosting-Check:** `SITE_URL` entspricht exakt der kanonischen Domain.
- [ ] **Hosting-Check:** Preview und Production sind getrennt.
- [ ] **Hosting-Check:** Production-Secrets stehen Preview nicht zur Verfügung.
- [ ] **Hosting-Check:** unterstützte Node-Version ist fixiert.
- [ ] **Hosting-Check:** Build Command ist dokumentiert.
- [ ] **Hosting-Check:** sichere Fehlerseiten funktionieren.
- [ ] **Hosting-Check:** Health-/Smoke-Test ist festgelegt.
- [ ] **Hosting-Check:** Source-Map-Veröffentlichung ist geprüft.
- [ ] **Hosting-Check:** Proxyheader sind mit realen Requests geprüft.
- [ ] **Hosting-Check:** Security Header und Clickjacking-Schutz sind geprüft.
- [ ] **Hosting-Check:** `Referrer-Policy` und `Permissions-Policy` sind geprüft.
- [ ] **Hosting-Check:** CSP wurde zunächst in Preview getestet.
- [ ] **Hosting-Check:** explizites Server-Action-Bodylimit wurde getestet.
- [ ] **Hosting-Check:** HSTS wird erst nach stabiler HTTPS-Konfiguration aktiviert.

## 21. Produktionskonfiguration Supabase

- [x] **Human-Check:** separates Produktionsprojekt ist vorhanden.
- [x] **Human-Check:** DEV und Production nutzen AWS `eu-central-1` (Frankfurt, EU).
- [ ] **Dashboard-Check:** Site URL ist korrekt.
- [ ] **Dashboard-Check:** Redirect URLs sind minimal.
- [ ] **Dashboard-Check:** Signup ist deaktiviert.
- [ ] **Dashboard-Check:** TOTP ist aktiviert.
- [ ] **Dashboard-Check:** Faktorlimit ist festgelegt.
- [ ] **Dashboard-Check:** Sessionregeln sind dokumentiert.
- [ ] **Dashboard-Check:** Auth- und MFA-Rate-Limits sind geprüft.
- [x] **V1-Entscheidung:** manueller logischer Backupplan und RPO sind in `docs/v1-backup-recovery.md` dokumentiert.
- [x] **V1-Entscheidung:** Free enthält kein PITR; PITR ist für den aktuellen persönlichen V1-Umfang nicht erforderlich und wird bei wachsender Kritikalität neu bewertet.
- [ ] **Dashboard-Check:** Logs und Aufbewahrung sind geprüft.
- [ ] **Dashboard-Check:** Datenbankressourcen sind ausreichend.
- [ ] **Dashboard-Check:** Pooling und Direct Connection sind je Zweck dokumentiert.
- [ ] **Dashboard-Check:** verfügbare Netzwerkbeschränkungen sind geprüft.
- [ ] **Dashboard-Check:** PostgREST-Schemacache ist nach Migration aktuell.

Tarif- und providerabhängige Punkte gelten erst nach realer Dashboardprüfung als vorhanden.

## 22. Launch-Checkliste

- [x] separates Production-Supabase-Projekt vorhanden (Human-Dashboardnachweis)
- [ ] Production- und Preview-Secrets getrennt
- [ ] Signup deaktiviert
- [ ] Admin-E-Mail bestätigt
- [ ] TOTP aktiviert
- [ ] AAL2 real geprüft
- [ ] Allowlist, Rolle und Aktivstatus geprüft
- [ ] Admin-Deaktivierung real getestet
- [ ] Lost-MFA-Runbook geprüft
- [ ] Auth-Site-URL und Redirect URLs korrekt
- [ ] Sessionregeln dokumentiert
- [x] manueller V1-Backupplan, Free-Limit und Backupfenster dokumentiert
- [x] sicherer isolierter Restore-Drill dokumentiert; Live-Ausführung bewusst ausstehend
- [ ] Retentionentscheidung dokumentiert
- [ ] manueller Cleanup-Prozess definiert
- [ ] Löschanfragenprozess definiert
- [ ] Proxyheader im Zielhosting getestet
- [ ] EchoWall- und Auth-Rate-Limits geprüft
- [ ] Security Header geprüft
- [ ] `robots.txt` geprüft
- [ ] Sitemap ohne Adminrouten geprüft
- [x] Monitoringkontakt festgelegt: Benjamin Trinidad Segura
- [x] Incidentkontakt festgelegt: Benjamin Trinidad Segura
- [ ] Secret-Rotation dokumentiert
- [ ] lokale und entfernte Migrationen konsistent
- [ ] RLS- und RPC-Rechte im Produktionsprojekt real geprüft
- [ ] `npm.cmd run test:echowall` bestanden
- [ ] `npm.cmd run lint` bestanden
- [ ] `npm.cmd run typecheck` bestanden
- [ ] `npm.cmd run build` bestanden
- [ ] manueller End-to-End-Test in Production-naher Umgebung bestanden
- [ ] Go-/No-Go-Review durchgeführt

## 23. Regelmäßige Betriebsprüfungen

### Täglich beziehungsweise bei aktiver Nutzung

- Pending-Echos prüfen
- ungewöhnliche kontrollierte Fehler prüfen
- Submission-Spikes aggregiert prüfen

### Wöchentlich

- Hosting- und Supabase-Logs prüfen
- Rate-Limit- und Duplicate-Auffälligkeiten prüfen
- überfällige Retention-Daten aggregiert prüfen
- Backupstatus prüfen
- Adminzugriff und MFA-Funktion prüfen

### Monatlich

- Rechte, Allowlist und Aktivstatus prüfen
- Datenbank- und Rate-Limit-Tabellenwachstum prüfen
- freigegebenen manuellen Cleanup durchführen
- Secretzugriffe und Verantwortlichkeiten prüfen
- ungelöste Incidents nachverfolgen

### Vierteljährlich

- Admin-Offboarding-Test
- Lost-MFA-Simulation ohne dauerhaften Faktorverlust
- isolierter Recovery-Test
- RLS-, Grant- und RPC-Regression
- Retention-Review
- Incident-Runbook-Review
- Dashboard-Sollzustand erneut abgleichen

## 24. Permanent-Purge-Entscheidung

Permanent Purge ist nicht implementiert. Vorläufige Empfehlung –
**Produktvorschlag – nicht juristisch geprüft**:

1. 30 Tage Soft Delete und Recoverymöglichkeit.
2. Danach Inhaltsdaten, Kontaktangaben und Löschreferenzdaten entfernen.
3. Auditdaten für eine begrenzte Frist pseudonymisiert behalten.
4. Auditdaten nach ihrer eigenen bestätigten Frist ebenfalls entfernen.
5. Backupreste laufen nach dem bestätigten Providerfenster aus.

Diese Empfehlung muss vor Umsetzung fachlich und rechtlich bestätigt werden. Das
Grundmodell ist auf RateCom, HobbySwap, BYC und tamabee übertragbar, aber jedes
Produkt benötigt eine eigene Retention-, Recovery- und Auditentscheidung.

## 25. Offene Entscheidungen

- [ ] tatsächliche Produktionsdomain
- [ ] Hostinganbieter
- [ ] JWT-Laufzeit
- [ ] Inactivity Timeout
- [ ] Time-boxed Session
- [ ] Single Session
- [ ] finale Retention-Fristen – **Produktvorschlag – nicht juristisch geprüft**
- [ ] Audit-Aufbewahrung – **Produktvorschlag – nicht juristisch geprüft**
- [ ] Permanent-Purge-Modell – **Produktvorschlag – nicht juristisch geprüft**
- [x] Supabase-Produktionsprojekt, Free-Tarif und Region durch Human-Dashboardnachweis bestätigt
- [x] V1-Backupfenster und fehlendes Free-PITR dokumentiert
- [x] Monitoring-, Incident- und Restore Owner: Benjamin Trinidad Segura
- [ ] verantwortliche Person für manuellen Cleanup
- [ ] Produktionsstartdatum

## 26. Go-/No-Go-Kriterien

### No-Go

Production darf nicht gestartet werden, wenn mindestens einer dieser Punkte zutrifft:

- kein separates Production-Supabase-Projekt
- Production-Secrets in Preview
- öffentliche Registrierung offen
- TOTP/MFA nicht aktiv
- AAL2 nicht real geprüft
- Admin-Deaktivierung ohne nachgewiesene Wirkung
- keine Backupentscheidung
- kein dokumentierter Löschanfragenprozess
- kein Incidentkontakt
- inkonsistente oder fehlerhafte Migrationen
- öffentliche Anzeige von `deleted` oder `hidden`
- fehlgeschlagene Tests, Lint, TypeScript oder Build
- unbekanntes Proxyheader-Verhalten
- kein HTTPS
- falsche `SITE_URL`
- keine dokumentierte Retention- und manuelle Cleanup-Entscheidung

### Go

Ein Go ist nur zulässig, wenn:

- alle Blocker geschlossen sind,
- alle Launch-Checkboxen entweder erfüllt oder bewusst mit Verantwortlichem,
  Begründung und Termin als Restrisiko akzeptiert wurden,
- Verantwortlichkeiten dokumentiert sind,
- ein Launch-Smoke-Test bestanden wurde,
- keine privaten Daten oder Secrets in Logs, Bundles oder Berichten gefunden wurden,
- öffentliche Queries weiterhin ausschließlich `approved` ausgeben.

Die finale Go-/No-Go-Entscheidung wird mit Datum und verantwortlicher Person
dokumentiert, ohne persönliche Kennungen, Secrets oder Inhaltsdaten aufzunehmen.
