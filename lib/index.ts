import type {Extension as MicromarkExtension} from 'micromark-util-types';
import type {Extension as FromMarkdownExtension} from 'mdast-util-from-markdown';
import type {Processor} from 'unified';
import {micromarkExtension} from './micromark/index.js';
import {transform} from './transform.js';
import {fromMarkdownExtension} from './from-markdown.js';

declare module 'unified' {
	interface Data {
		micromarkExtensions?: MicromarkExtension[];
		fromMarkdownExtensions?: Array<
			FromMarkdownExtension | FromMarkdownExtension[]
		>;
	}
}

export default function remarkAttributeList(this: Processor) {
	const data = this.data();
	data.micromarkExtensions ??= [];
	data.micromarkExtensions.push(micromarkExtension);

	data.fromMarkdownExtensions ??= [];
	data.fromMarkdownExtensions.push(fromMarkdownExtension);

	return transform;
}
