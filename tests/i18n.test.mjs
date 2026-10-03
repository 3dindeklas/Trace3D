import assert from 'node:assert/strict';
import {resolveLanguage} from '../src/i18n.js';
import {translations} from '../src/translations.js';
assert.equal(resolveLanguage('auto',['fr-CA','nl-NL']),'fr');
assert.equal(resolveLanguage('auto',['es-ES','de-DE']),'de');
assert.equal(resolveLanguage('auto',['es-ES']),'en');
assert.equal(resolveLanguage('nl',['en-US']),'nl');
assert.equal(resolveLanguage('invalid',['de-DE']),'de');
for(const [source,entry] of Object.entries(translations))for(const lang of ['en','de','fr']){assert.ok(entry[lang],`${source}: missing ${lang}`);assert.deepEqual(entry[lang].match(/\{\w+\}/g)||[],source.match(/\{\w+\}/g)||[],`${source}: placeholders differ in ${lang}`);}
console.log('Locale resolution, fallbacks and translation completeness passed.');
