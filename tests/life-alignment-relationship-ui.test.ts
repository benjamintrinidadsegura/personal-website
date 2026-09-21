import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { assertRelationshipSessionUiCompleteness } from "../data/i18n/life-alignment-relationship-session-ui";
import { assertRelationshipUiCompleteness, relationshipUi } from "../data/i18n/life-alignment-relationship-ui";
import { assertRelationshipModuleCompleteness, getRelationshipModule, relationshipText } from "../data/life-alignment-relationship";
import { locales } from "../lib/i18n/config";

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("all relationship definitions and UI labels are complete in seven locales", () => {
  assert.doesNotThrow(assertRelationshipModuleCompleteness);
  assert.doesNotThrow(assertRelationshipUiCompleteness);
  assert.doesNotThrow(assertRelationshipSessionUiCompleteness);
  for (const locale of locales) {
    for (const moduleId of ["partner", "friendship", "founder"] as const) {
      const definition = getRelationshipModule(moduleId);
      assert.ok(relationshipText(definition.title, locale).length > 2);
      assert.ok(definition.sections.every((section) => relationshipText(section.title, locale).length > 2));
      assert.ok(definition.questions.every((question) => relationshipText(question.prompt, locale).length > 8));
    }
    assert.ok(relationshipUi(locale, "privacyBoundary").length > 40);
    assert.ok(relationshipUi(locale, "noScore").length > 20);
  }
});

test("Partner, Friendship and Founder use the V1.1 journey while legacy Partner remains reachable", () => {
  const partner = readSource("../app/life-alignment/partner/page.tsx");
  const friendship = readSource("../app/life-alignment/friendship/page.tsx");
  const founder = readSource("../app/life-alignment/founder/page.tsx");
  const legacy = readSource("../app/life-alignment/partner/shared-device/page.tsx");
  const journey = readSource("../components/life-alignment/relationship/relationship-module-journey.tsx");
  assert.match(partner, /RelationshipModulePage moduleId="partner"\s*\/>/u);
  assert.match(friendship, /RelationshipModulePage moduleId="friendship"\s*\/>/u);
  assert.match(founder, /RelationshipModulePage moduleId="founder"\s*\/>/u);
  assert.match(legacy, /PartnerPage/u);
  assert.match(journey, /break-words text-\[clamp\(2\.65rem,8vw,7rem\)\]/u);
  assert.match(journey, /hyphens-auto/u);
});

test("private invite, session and dashboard routes are dynamic, noindex and no-store", () => {
  const invite = readSource("../app/life-alignment/invite/[token]/page.tsx");
  const session = readSource("../app/life-alignment/session/[sessionId]/page.tsx");
  const dashboard = readSource("../app/life-alignment/sessions/page.tsx");
  const config = readSource("../next.config.ts");
  const robots = readSource("../app/robots.ts");
  for (const route of [invite, session, dashboard]) {
    assert.match(route, /force-dynamic/u);
    assert.match(route, /index: false, follow: false/u);
  }
  assert.match(config, /life-alignment\/invite/u);
  assert.match(config, /life-alignment\/session/u);
  assert.match(config, /life-alignment\/sessions/u);
  assert.match(config, /private, no-store, max-age=0/u);
  assert.match(config, /noindex, nofollow, noarchive/u);
  assert.match(robots, /life-alignment\/invite/u);
  assert.match(robots, /life-alignment\/session/u);
});

test("dashboard and invite UI expose only coarse state and explicit consent", () => {
  const dashboardRpc = readSource("../lib/life-alignment-relationship-dashboard.ts");
  const dashboardPage = readSource("../app/life-alignment/sessions/page.tsx");
  const invitePage = readSource("../app/life-alignment/invite/[token]/page.tsx");
  assert.doesNotMatch(dashboardRpc, /ownAnswers|counterpartAnswers|alignment_answers/u);
  assert.doesNotMatch(dashboardPage, /ownAnswers|counterpartAnswers/u);
  assert.match(invitePage, /type="checkbox"/u);
  assert.match(invitePage, /name="consent"/u);
  assert.doesNotMatch(invitePage, /defaultChecked/u);
});

test("server actions enforce trusted origin and avoid private payload logging", () => {
  const actions = readSource("../app/life-alignment/actions.ts");
  assert.match(actions, /requestIsTrusted/u);
  assert.match(actions, /consumeAlignmentRateLimit/u);
  for (const action of ["create-session", "join", "save-answers", "revoke", "agreement", "delete-participation"])
    assert.match(actions, new RegExp(`"${action}"`), action);
  assert.match(readSource("../lib/life-alignment-relationship-server.ts"), /invite-validate/u);
  assert.match(actions, /getAlignmentTokenHashSecret/u);
  assert.match(actions, /httpOnly: true/u);
  assert.match(actions, /sameSite: "strict"/u);
  assert.match(actions, /getLocalizedPathname\(`\/life-alignment\/session\/\$\{data\}`, locale\)/u);
  assert.match(actions, /path: getLocalizedPathname\("\/life-alignment\/session", locale\)/u);
  assert.match(actions, /redirect\(sessionPath\)/u);
  assert.match(actions, /maxAge: 0/u);
  assert.doesNotMatch(actions, /console\.|logger\.|captureException/u);
});

test("results and session experience provide print and agreement controls without a global score", () => {
  const journey = readSource("../components/life-alignment/relationship/relationship-module-journey.tsx");
  const session = readSource("../components/life-alignment/relationship/relationship-session-experience.tsx");
  const printMode = readSource("../components/life-alignment/relationship/relationship-print-mode.ts");
  assert.match(journey, /window\.print/u);
  assert.match(session, /window\.print/u);
  assert.match(journey, /useRelationshipPrintMode/u);
  assert.match(session, /useRelationshipPrintMode/u);
  assert.match(printMode, /data-fyns-result-print/u);
  assert.match(printMode, /previousMarker/u);
  assert.match(session, /saveRelationshipAgreementAction/u);
  assert.match(session, /acknowledgeRelationshipAgreementAction/u);
  assert.match(session, /revokeRelationshipInviteAction/u);
  assert.match(session, /useLocalizedHref/u);
  assert.match(session, /router\.push\(localizeHref\("\/life-alignment"\)\)/u);
  assert.doesNotMatch(`${journey}\n${session}`, /compatibilityScore|globalScore|matchPercentage/u);
});

test("private relationship UI uses the seven-locale copy registry instead of embedded English", () => {
  const invite = readSource("../app/life-alignment/invite/[token]/page.tsx");
  const session = readSource("../components/life-alignment/relationship/relationship-session-experience.tsx");
  const dashboard = readSource("../app/life-alignment/sessions/page.tsx");
  for (const source of [invite, session, dashboard]) assert.match(source, /relationshipSessionUi/u);
  assert.doesNotMatch(invite, /This private invitation has expired|Display name|Accept and begin/u);
  assert.doesNotMatch(session, /Other participant:|What becomes visible between you|Save draft|Finalized Agreements/u);
  assert.doesNotMatch(dashboard, /<dd>\{session\.(?:inviteStatus|counterpartStatus)\}<\/dd>/u);
});
