import {test} from 'node:test';
import assert from 'node:assert';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import {removePosition} from 'unist-util-remove-position';
import {u} from 'unist-builder';
import remarkAttributeList from '../dist/index.js';

const processor = unified().use(remarkParse).use(remarkAttributeList, {
	allowNoSpaceBeforeName: true,
	allowUnderscoreInId: true,
});

/**
 * @param {string} source
 */
function parse(source) {
	const parsed = processor.parse(source);
	removePosition(parsed, {force: true});
	return parsed;
}

await test('parsing with options', async (t) => {
	await t.test(
		'should parse attribute list without space before name',
		async () => {
			assert.deepStrictEqual(
				parse('{:name:.cls1.cls2}\n'),
				u('root', [
					u('attributeListDefinition', {name: 'name'}, [
						u('classNameAttribute', {name: 'cls1'}),
						u('classNameAttribute', {name: 'cls2'}),
					]),
				]),
			);
			assert.deepStrictEqual(
				parse('{:#id.cls1}\n'),
				u('root', [
					u('blockInlineAttributeList', [
						u('idNameAttribute', {name: 'id'}),
						u('classNameAttribute', {name: 'cls1'}),
					]),
				]),
			);
			assert.deepStrictEqual(
				parse('{:ref#id}\n'),
				u('root', [
					u('blockInlineAttributeList', [
						u('referenceAttribute', {name: 'ref'}),
						u('idNameAttribute', {name: 'id'}),
					]),
				]),
			);
		},
	);

	await t.test(
		'should parse attribute list with underscore in ID',
		async () => {
			assert.deepStrictEqual(
				parse('{:ref:#id_name}\n'),
				u('root', [
					u('attributeListDefinition', {name: 'ref'}, [
						u('idNameAttribute', {name: 'id_name'}),
					]),
				]),
			);
		},
	);
});
