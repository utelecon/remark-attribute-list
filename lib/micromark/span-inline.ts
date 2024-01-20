import {codes} from 'micromark-util-symbol';
import type {
	Construct,
	Effects,
	State,
	TokenizeContext,
} from 'micromark-util-types';
import type {Options} from '../index.js';
import {attributeList} from './list.js';

declare module 'micromark-util-types' {
	interface TokenTypeMap {
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

export function spanInlineAttributeList(options?: Options): Construct {
	const list = attributeList(options);
	return {
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
			effects.enter('spanInlineAttributeList');
			effects.enter('spanInlineAttributeListMarker');
			effects.consume(code);
			effects.exit('spanInlineAttributeListMarker');
			return colon;
		};

		const colon: State = (code) => {
			if (code === codes.colon) {
				effects.enter('spanInlineAttributeListMarker');
				effects.consume(code);
				effects.exit('spanInlineAttributeListMarker');

				return listOrColon;
			}

			return nok(code);
		};

		const listOrColon: State = (code) => {
			if (code === codes.colon) {
				effects.enter('spanInlineAttributeListMarker');
				effects.consume(code);
				effects.exit('spanInlineAttributeListMarker');

				return end;
			}

			return effects.attempt(list, end, nok)(code);
		};

		const end: State = (code) => {
			if (code !== codes.rightCurlyBrace) return nok(code);
			effects.enter('spanInlineAttributeListMarker');
			effects.consume(code);
			effects.exit('spanInlineAttributeListMarker');
			effects.exit('spanInlineAttributeList');
			return ok;
		};

		return start;
	}
}
