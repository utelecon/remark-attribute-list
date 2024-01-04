import {test} from 'node:test';
import fs from 'node:fs/promises';
import process from 'node:process';
import assert from 'node:assert';
import path from 'node:path';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import {isHidden} from 'is-hidden';
import type {Root} from 'mdast';
import remarkAttributeList from '../index.js';

await test('fixtures, mdast', async (t) => {
	const processor = unified().use(remarkParse).use(remarkAttributeList);

	const fixturesPath = path.join(process.cwd(), 'test', 'fixtures');
	const fixtures = await fs.readdir(fixturesPath);

	for (const name of fixtures.filter((name) => !isHidden(name))) {
		// eslint-disable-next-line no-await-in-loop
		await t.test(name, async () => {
			const folderPath = path.join(fixturesPath, name);
			const inputPath = path.join(folderPath, 'input.md');
			const treePath = path.join(folderPath, 'tree.json');

			const input = await fs.readFile(inputPath, 'utf8');
			let tree: Root;
			const actual = await processor.run(processor.parse(input));

			try {
				if ('UPDATE' in process.env) {
					throw new Error('Updating…');
				}

				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				tree = JSON.parse(await fs.readFile(treePath, 'utf8'));
			} catch {
				tree = actual as Root;
				await fs.writeFile(treePath, JSON.stringify(actual, null, 2));
			}

			assert.deepStrictEqual(actual, tree, name);
		});
	}
});
