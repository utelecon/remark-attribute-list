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

		/**
		 * The block inline attribute list marker (either `{`, `:` or `}`)
		 */
		spanInlineAttributeListMarker: 'spanInlineAttributeListMarker';

		/**
		 * The block inline attribute list:
		 * ```markdown
		 * {: #id-name .class-name key="value" reference}
		 * ```
		 */
		spanInlineAttributeList: 'spanInlineAttributeList';
	}
}

export const blockInlineAttributeList: Construct = {
	tokenize: createTokenize('block'),
};

export const spanInlineAttributeList: Construct = {
	tokenize: createTokenize('span'),
};

function createTokenize(context: 'block' | 'span') {
	return tokenize;

	function tokenize(
		this: TokenizeContext,
		effects: Effects,
		ok: State,
		nok: State,
	): State {
		const start: State = (code) => {
			if (code !== codes.leftCurlyBrace) return nok(code);
			effects.enter(`${context}InlineAttributeList`);
			effects.enter(`${context}InlineAttributeListMarker`);
			effects.consume(code);
			effects.exit(`${context}InlineAttributeListMarker`);
			return spaceOrColon;
		};

		let spaces = 0;
		const spaceOrColon: State = (code) => {
			if (code === codes.space) {
				spaces++;
				if (spaces > 3) return nok(code);
				effects.consume(code);
				return spaceOrColon;
			}

			if (code === codes.colon) {
				effects.enter(`${context}InlineAttributeListMarker`);
				effects.consume(code);
				effects.exit(`${context}InlineAttributeListMarker`);

				return effects.attempt(attributeList, end, nok);
			}

			return nok(code);
		};

		const end: State = (code) => {
			if (code !== codes.rightCurlyBrace) return nok(code);
			effects.enter(`${context}InlineAttributeListMarker`);
			effects.consume(code);
			effects.exit(`${context}InlineAttributeListMarker`);
			effects.exit(`${context}InlineAttributeList`);
			return ok;
		};

		return start;
	}
}
