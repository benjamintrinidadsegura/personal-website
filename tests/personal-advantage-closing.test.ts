import assert from 'node:assert/strict';
import { test } from 'node:test';
import { advantageQuestions } from '../data/personal-advantage-questions';
import { buildPersonalAdvantageMap, generateAdvantageProbes, nextUnansweredAdvantageProbe, reconcileAdvantageProbeAnswers } from '../lib/personal-advantage-engine';
import { parsePersistedAdvantageState, serializeAdvantageState } from '../lib/personal-advantage-persistence';
import type { AdvantageAnswerSet, AdvantageCalibration, AdvantageProbeAnswers } from '../types/personal-advantage';
function profile(signals: string[]): AdvantageAnswerSet {
    const targets = new Set(signals);
    const answers: Record<string, { value: string | string[] }> = {};
    for (const question of advantageQuestions) {
        const options = question.options.filter(option => option.effects.some(effect => targets.has(effect.signalId)));
        if (options.length) {
            const values = options.slice(0, question.type === 'multi' ? question.maxSelections ?? 1 : 1).map(option => option.id);
            answers[question.id] = { value: question.type === 'multi' ? values : values[0] };
        }
    }
    answers.q21 = { value: signals.slice(0, 3) };
    answers.q44 = { value: signals[0] ?? '' };
    answers.q46 = { value: signals.slice(0, 3) };
    return answers;
}
const strong = profile(['systems-thinking', 'communication-clarity']);
test('closing omits only unanswered relationship repeats after a conclusive answer; uncertainty keeps them', () => {
    const all = generateAdvantageProbes(strong);
    const pair = all.find(p => p.archetype === 'pair-interaction')!;
    const sequence = all.find(p => p.candidateId === pair.candidateId && p.archetype === 'sequence')!;
    assert.ok(sequence);
    for (const option of ['together', 'helps']) {
        const answered = { [pair.id]: option };
        const next = generateAdvantageProbes(strong, answered);
        assert.ok(next.some(p => p.id === pair.id));
        assert.ok(!next.some(p => p.id === sequence.id));
        assert.ok(next.length < all.length);
        assert.deepEqual(buildPersonalAdvantageMap(strong, next, answered, {}), buildPersonalAdvantageMap(strong, all, answered, {}), 'removal itself cannot inflate scores or confidence');
    }
    for (const value of ['unsure', 'invalid', 'separate'])
        assert.ok(generateAdvantageProbes(strong, { [pair.id]: value }).some(p => p.id === sequence.id));
});
test('strong, ambiguous, contradictory and sparse profiles preserve every answered score and calibration veto', () => {
    const profiles: AdvantageAnswerSet[] = [strong, profile(['precision', 'risk-detection']), { ...strong, q8: { value: 'struggle' }, q59: { value: ['systems-thinking'] } }, { q1: { value: 'system' } }, {}];
    for (const answers of profiles) {
        const all = generateAdvantageProbes(answers);
        for (let prefix = 0; prefix <= all.length; prefix++) {
            for (const mode of ['positive', 'uncertain', 'negative']) {
                const answered: Record<string, string> = {};
                for (const p of all.slice(0, prefix))
                    answered[p.id] = mode === 'uncertain' ? 'unsure' : mode === 'negative' ? p.options[0].id : p.options.reduce((a, b) => a.interaction > b.interaction ? a : b).id;
                const next = generateAdvantageProbes(answers, answered);
                for (const p of all)
                    if (p.options.some(o => o.id === answered[p.id]))
                        assert.ok(next.some(n => n.id === p.id));
                for (const calibration of [{}, { 'systems-translation': 'not-really' }] as AdvantageCalibration[])
                    assert.deepEqual(buildPersonalAdvantageMap(answers, next, answered, calibration), buildPersonalAdvantageMap(answers, all, answered, calibration));
            }
        }
    }
});
test('legacy complete maps and partial resume keep stable identities, answers and next unanswered position', () => {
    const all = generateAdvantageProbes(strong);
    const complete = Object.fromEntries(all.map(p => [p.id, p.options[0].id]));
    const saved = { schemaVersion: 1 as const, phase: 'result' as const, questionId: null, answers: strong, probeAnswers: complete, calibration: {}, updatedAt: '2026-11-05T10:00:00Z' };
    const restored = parsePersistedAdvantageState(serializeAdvantageState(saved))!;
    const valid = reconcileAdvantageProbeAnswers(restored.answers, restored.probeAnswers);
    assert.deepEqual(valid, complete);
    assert.deepEqual(generateAdvantageProbes(strong, valid), all);
    assert.deepEqual(buildPersonalAdvantageMap(strong, all, complete, {}), buildPersonalAdvantageMap(restored.answers, generateAdvantageProbes(strong, valid), valid, {}));
    const partial: AdvantageProbeAnswers = { [all[0].id]: 'together', 'probe-99-obsolete': 'wrong' };
    const clean = reconcileAdvantageProbeAnswers(strong, partial);
    assert.deepEqual(Object.keys(clean), [all[0].id]);
    const next = generateAdvantageProbes(strong, clean);
    assert.equal(nextUnansweredAdvantageProbe(next, clean), 1);
    assert.equal(nextUnansweredAdvantageProbe(all, complete), all.length);
    assert.equal(nextUnansweredAdvantageProbe([], {}), 0);
    assert.deepEqual(generateAdvantageProbes(strong, { [all[0].id]: 'unsure' }), all, 'back-editing uncertainty restores the unanswered follow-up');
});

test('a convergent completed closing keeps ranking and confidence while exposing the raw-mean trade-off', () => {
    const original = generateAdvantageProbes(strong);
    const recorded: Record<string, string> = {};
    const positive = (probe: typeof original[number]) => probe.options.reduce((best, option) => option.interaction > best.interaction ? option : best).id;
    for (let index = 0; index < original.length; index++) {
        const next = generateAdvantageProbes(strong, recorded).find(probe => !recorded[probe.id]);
        if (!next) break;
        recorded[next.id] = positive(next);
    }
    const shortened = generateAdvantageProbes(strong, recorded);
    const originalAnswers = Object.fromEntries(original.map(probe => [probe.id, positive(probe)]));
    const before = buildPersonalAdvantageMap(strong, original, originalAnswers, {});
    const after = buildPersonalAdvantageMap(strong, shortened, recorded, {});
    const ranking = (map: typeof before) => [map.coreAdvantage, ...map.supportingAdvantages, ...(map.emergingAdvantage ? [map.emergingAdvantage] : [])].map(candidate => ({ id: candidate.id, confidence: candidate.confidence }));
    assert.equal(original.length, 8);
    assert.equal(shortened.length, 7);
    assert.deepEqual(ranking(after), ranking(before));
    // The engine averages actual interaction answers. No skipped answer is invented.
    assert.ok(Math.abs(after.coreAdvantage.evidenceStrength - before.coreAdvantage.evidenceStrength - .12) < 1e-10);
});
