import {test} from 'node:test';
import assert from 'node:assert';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkAttributeList from '../dist/index.js';

const processor = unified().use(remarkParse).use(remarkAttributeList);
/**
 * @param {string} source
 */
async function process(source) {
	const parsed = processor.parse(source);
	const transformed = await processor.run(parsed);
	return transformed;
}

await test('parsing', async (t) => {
	await t.test(
		'should attach typical attribute list to block element',
		async () => {
			const source = `\
{:ref:.cls key="value"}

# Heading
{:#id ref}
`;
			const tree = await process(source);
			assert.deepStrictEqual(tree.children[0]?.data, {
				hProperties: {
					id: 'id',
					className: 'cls',
					key: 'value',
				},
				id: 'id',
			});
		},
	);

	await t.test(
		'should attach typical attribute list to span element',
		async () => {
			const source = `\
{:ref:.cls key="value"}

*Emphasis*{:#id ref}
`;
			const tree = await process(source);
			const p = tree.children[0];
			assert(p?.type === 'paragraph');
			assert.deepStrictEqual(p.children[0]?.data, {
				hProperties: {
					id: 'id',
					className: 'cls',
					key: 'value',
				},
				id: 'id',
			});
		},
	);

	await t.test('should resolve references recursively', async () => {
		const source = `\
{:ref:.cls}
{:ref2:ref}

# Heading
{:ref2}
`;
		const tree = await process(source);
		assert.deepStrictEqual(tree.children[0]?.data, {
			hProperties: {
				className: 'cls',
			},
		});
	});

	await t.test('should ignore undefined reference', async () => {
		const source = `\
# Heading
{:ref}
`;
		const tree = await process(source);
		assert.strictEqual(tree.children[0]?.data, undefined);
	});

	await t.test('should attach to following block element', async () => {
		const source = `\
{:.cls}
# Heading
`;
		const tree = await process(source);
		assert.deepStrictEqual(tree.children[0]?.data, {
			hProperties: {
				className: 'cls',
			},
		});
	});

	await t.test(
		'should prefer preceding block element over following',
		async () => {
			const source = `\
# Heading
{:.cls}
# Heading
`;
			const tree = await process(source);
			assert.deepStrictEqual(tree.children[0]?.data, {
				hProperties: {
					className: 'cls',
				},
			});
			assert.strictEqual(tree.children[1]?.data, undefined);
		},
	);

	await t.test(
		'should only attach to directly preceding block element',
		async () => {
			const source = `\
# Heading

{:.cls}

#Heading
`;
			const tree = await process(source);
			assert.strictEqual(tree.children[0]?.data, undefined);
			assert.strictEqual(tree.children[1]?.data, undefined);
		},
	);

	await t.test('should only attach to preceding span element', async () => {
		const source = `\
Some {:.cls}*Emphasis*
`;
		const tree = await process(source);
		const p = tree.children[0];
		assert(p?.type === 'paragraph');
		assert.strictEqual(p.children[1]?.data, undefined);
	});

	await t.test(
		'should only attach to directly preceding span element',
		async () => {
			const source = `\
Some *Emphasis* {:.cls}
`;
			const tree = await process(source);
			const p = tree.children[0];
			assert(p?.type === 'paragraph');
			assert.strictEqual(p.children[1]?.data, undefined);
			assert.strictEqual(p.children[2]?.data, undefined);
		},
	);

	await t.test('should properly append or replace className', async () => {
		const source = `\
# Heading
{:.cls1 .cls2}

# Heading
{:class="cls1" .cls2}

# Heading
{:class="something" class="cls1" .cls2}

# Heading
{:class="cls1 cls2"}
`;
		const tree = await process(source);
		assert.deepStrictEqual(tree.children[0]?.data, {
			hProperties: {
				className: 'cls1 cls2',
			},
		});
		assert.deepStrictEqual(tree.children[1]?.data, {
			hProperties: {
				className: 'cls1 cls2',
			},
		});
		assert.deepStrictEqual(tree.children[2]?.data, {
			hProperties: {
				className: 'cls1 cls2',
			},
		});
		assert.deepStrictEqual(tree.children[3]?.data, {
			hProperties: {
				className: 'cls1 cls2',
			},
		});
	});
});
