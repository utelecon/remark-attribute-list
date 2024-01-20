import type {Extension as MicromarkExtension} from 'micromark-util-types';
import {codes} from 'micromark-util-symbol';
import type {Options} from '../index.js';
import {attributeListDefinition} from './definition.js';
import {blockInlineAttributeList} from './block-inline.js';
import {spanInlineAttributeList} from './span-inline.js';

export function micromarkExtension(options?: Options): MicromarkExtension {
	return {
		contentInitial: {
			[codes.leftCurlyBrace]: attributeListDefinition(options),
		},
		flow: {
			[codes.leftCurlyBrace]: blockInlineAttributeList(options),
		},
		text: {
			[codes.leftCurlyBrace]: spanInlineAttributeList(options),
		},
	};
}
