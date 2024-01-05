import test from 'node:test';
import process from 'node:process';
import assert from 'node:assert';
import {fileURLToPath} from 'node:url';
import remarkParse from 'remark-parse';
import {unified} from 'unified';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import {read, write} from 'to-vfile';
import remarkAttributeList from '../dist/index.js';

const processor = unified()
	.use(remarkParse)
	.use(remarkAttributeList)
	.use(remarkRehype)
	.use(rehypeStringify);

await test('integration', async () => {
	const inputUrl = new URL('integration/input.md', import.meta.url);
	const outputUrl = new URL('integration/output.html', import.meta.url);

	const input = await read(inputUrl);
	const actual = await processor.process(input);
	/** @type {import("vfile").VFile} */
	let output;

	try {
		if ('UPDATE' in process.env) {
			throw new Error('Updating…');
		}

		output = await read(outputUrl);
	} catch {
		output = actual;
		output.path = fileURLToPath(outputUrl);
		await write(output);
	}

	assert.strictEqual(actual.value, output.value.toString());
});
