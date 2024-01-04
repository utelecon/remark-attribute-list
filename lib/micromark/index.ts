import type {Extension as MicromarkExtension} from 'micromark-util-types';
import {codes} from 'micromark-util-symbol';
import {attributeListDefinition} from './definition.js';
import {blockInlineAttributeList} from './inline.js';

export const micromarkExtension: MicromarkExtension = {
	contentInitial: {
		[codes.leftCurlyBrace]: attributeListDefinition,
	},
	flow: {
		[codes.leftCurlyBrace]: blockInlineAttributeList,
	},
};
