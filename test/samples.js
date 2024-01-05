import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs/promises';
import process from 'node:process';
import remarkParse from 'remark-parse';
import {unified} from 'unified';
import {removePosition} from 'unist-util-remove-position';
import {isHidden} from 'is-hidden';
import remarkAttributeList from '../dist/index.js';

const processor = unified().use(remarkParse).use(remarkAttributeList);

await test('samples', async (t) => {
	const fixturesUrl = new URL('samples/', import.meta.url);
	const fixtures = await fs.readdir(fixturesUrl);

	for (const name of fixtures.filter((name) => !isHidden(name))) {
		// eslint-disable-next-line no-await-in-loop
		await t.test(name, async () => {
			const folderUrl = new URL(`${name}/`, fixturesUrl);
			const inputUrl = new URL('input.md', folderUrl);
			const treeUrl = new URL('tree.json', folderUrl);

			const input = await fs.readFile(inputUrl, 'utf8');
			/** @type {import("mdast").Root} */
			let tree;
			const actual = await processor.run(processor.parse(input));
			removePosition(actual, {force: true});

			try {
				if ('UPDATE' in process.env) {
					throw new Error('Updating…');
				}

				tree = JSON.parse(await fs.readFile(treeUrl, 'utf8'));
			} catch {
				tree = actual;
				await fs.writeFile(treeUrl, JSON.stringify(actual, null, 2));
			}

			assert.deepStrictEqual(actual, tree, name);
		});
	}
});
