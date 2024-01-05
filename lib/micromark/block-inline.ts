import {codes} from 'micromark-util-symbol';
import type {
	Construct,
	Effects,
	State,
	TokenizeContext,
} from 'micromark-util-types';
import {attributeList} from './list.js';

declare module 'micromark-util-types' {
	interface TokenTypeMap {
		/**
		 * The block inline attribute list marker (either `{`, `:` or `}`)
		 */
		blockInlineAttributeListMarker: 'blockInlineAttributeListMarker';

		/**
		 * The block inline attribute list:
		 * ```markdown
		 * {: #id-name .class-name key="value" reference}
		 * ```
		 */
		blockInlineAttributeList: 'blockInlineAttributeList';
	}
}

export const blockInlineAttributeList: Construct = {
	tokenize,
};

function tokenize(
	this: TokenizeContext,
	effects: Effects,
	ok: State,
	nok: State,
): State {
	const start: State = (code) => {
		if (code !== codes.leftCurlyBrace) return nok(code);
		effects.enter('blockInlineAttributeList');
		effects.enter('blockInlineAttributeListMarker');
		effects.consume(code);
		effects.exit('blockInlineAttributeListMarker');
		return colon;
	};

	const colon: State = (code) => {
		if (code === codes.colon) {
			effects.enter('blockInlineAttributeListMarker');
			effects.consume(code);
			effects.exit('blockInlineAttributeListMarker');

			return effects.attempt(attributeList, end, nok);
		}

		return nok(code);
	};

	const end: State = (code) => {
		if (code !== codes.rightCurlyBrace) return nok(code);
		effects.enter('blockInlineAttributeListMarker');
		effects.consume(code);
		effects.exit('blockInlineAttributeListMarker');
		effects.exit('blockInlineAttributeList');
		return ok;
	};

	return start;
}
