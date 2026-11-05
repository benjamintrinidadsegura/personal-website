import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shareCardFileName, validateShareCardPng } from '../lib/sharing/native-card-share';
import type * as Native from '../lib/sharing/native-card-share';
import { loadSource } from './helpers/load-source';
import { shareFileDictionaries } from '../data/i18n/share-file';
import { locales } from '../lib/i18n/config';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX9sAAAAASUVORK5CYII=', 'base64');
test('PNG validation rejects empty, incorrect MIME, corrupt headers and wrong dimensions', async () => {
    await validateShareCardPng(new Blob([png], { type: 'image/png' }), { width: 1, height: 1 });
    for (const blob of [new Blob([], { type: 'image/png' }), new Blob([png], { type: 'image/jpeg' }), new Blob([new Uint8Array(70)], { type: 'image/png' })])
        await assert.rejects(validateShareCardPng(blob, { width: 1, height: 1 }));
    await assert.rejects(validateShareCardPng(new Blob([png], { type: 'image/png' }), { width: 1080, height: 1920 }));
});
test('portable PNG filenames cannot use paths, control characters or reserved device names', () => {
    for (const input of ['../../result', 'a/b\\c\u0000', 'CON', 'nul.png', '...', 'name.PNG', 'résultat']) {
        const name = shareCardFileName(input);
        assert.match(name, /^[a-z0-9][a-z0-9._-]*\.png$/i);
        assert.doesNotMatch(name, /^(con|nul|prn|aux)\./i);
        assert.ok(!name.toLowerCase().endsWith('.png.png'));
    }
});
function downloadHarness(throws = false, supported = true) {
    const active = new Set<string>();
    const timers: Array<() => void> = [];
    const link = {
        ...(supported ? { download: '' } : {}),
        href: '',
        style: { display: '' },
        click() { if (throws) throw Error('blocked'); },
        remove() {},
    };
    const native = loadSource<typeof Native>('lib/sharing/native-card-share.ts', {}, {
        document: { createElement: () => link, body: { appendChild() {} } },
        URL: {
            createObjectURL: () => { active.add('blob:local-fixture'); return 'blob:local-fixture'; },
            revokeObjectURL: (url: string) => active.delete(url),
        },
        window: {
            setTimeout: (fn: () => void, ms: number) => { assert.equal(ms, 30000); timers.push(fn); },
        },
    });
    return { native, active, timers };
}
test('download URL grace and cleanup survive successful activation, blocked clicks and unsupported download capability', () => {
    for (const [blocked, supported] of [[false, true], [true, true], [false, false]]) {
        const h = downloadHarness(blocked, supported);
        const go = () => h.native.downloadShareCardFile(new File([png], 'fixture.png', { type: 'image/png' }));
        if (blocked || !supported)
            assert.throws(go);
        else
            go();
        assert.equal(h.active.size, 1);
        h.timers.forEach(fn => fn());
        assert.equal(h.active.size, 0);
    }
});
test('seven locales give honest download-request feedback and image-save fallback instructions', () => {
    assert.deepEqual(Object.keys(shareFileDictionaries), [...locales]);
    for (const copy of Object.values(shareFileDictionaries)) {
        assert.ok(copy.openImage.length > 4);
        assert.ok(copy.saveHint.length > 65);
    }
    assert.match(shareFileDictionaries.en.imageDownloaded, /requested/);
    assert.doesNotMatch(shareFileDictionaries.en.imageDownloaded, /saved successfully|download complete/i);
});
