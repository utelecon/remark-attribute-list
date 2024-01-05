import {test} from 'node:test';
import assert from 'node:assert';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import {removePosition} from 'unist-util-remove-position';
import {u} from 'unist-builder';
import remarkAttributeList from '../dist/index.js';

const processor = unified().use(remarkParse).use(remarkAttributeList);
/**
 * @param {string} source
 */
function parse(source) {
	const parsed = processor.parse(source);
	removePosition(parsed, {force: true});
	return parsed;
}

await test('parsing', async (t) => {
	await t.test('should parse typical attribute list', async () => {
		assert.deepStrictEqual(
			parse('{:name:ref #id .cls key="value"}\n'),
			u('root', [
				u('attributeListDefinition', {name: 'name'}, [
					u('referenceAttribute', {name: 'ref'}),
					u('idNameAttribute', {name: 'id'}),
					u('classNameAttribute', {name: 'cls'}),
					u('keyValueAttribute', {key: 'key', value: 'value'}),
				]),
			]),
		);
	});

	await t.test('should not parse empty attribute list', async () => {
		assert.deepStrictEqual(
			parse('{:name:}\n'),
			u('root', [u('paragraph', [u('text', '{:name:}')])]),
		);
	});

	await t.test(
		'should not parse attribute list without space between attributes',
		async () => {
			assert.deepStrictEqual(
				parse('{:name:.c1.c2}\n'),
				u('root', [u('paragraph', [u('text', '{:name:.c1.c2}')])]),
			);
		},
	);

	await t.test(
		'should accept only up to 3 spaces before definition or block inline attribute list',
		async () => {
			assert.deepStrictEqual(
				parse('   {:name:.cls}\n'),
				u('root', [
					u('attributeListDefinition', {name: 'name'}, [
						u('classNameAttribute', {name: 'cls'}),
					]),
				]),
			);
			assert.deepStrictEqual(
				parse('    {:name:.cls}\n'),
				u('root', [u('code', {lang: null, meta: null}, '{:name:.cls}')]),
			);

			assert.deepStrictEqual(
				parse('   {:.cls}\n'),
				u('root', [
					u('blockInlineAttributeList', [
						u('classNameAttribute', {name: 'cls'}),
					]),
				]),
			);
			assert.deepStrictEqual(
				parse('    {:.cls}\n'),
				u('root', [u('code', {lang: null, meta: null}, '{:.cls}')]),
			);
		},
	);

	await t.test('should parse empty span inline attribute list', async () => {
		assert.deepStrictEqual(
			parse('{::}\n'),
			u('root', [u('paragraph', [u('spanInlineAttributeList', [])])]),
		);
	});
});
