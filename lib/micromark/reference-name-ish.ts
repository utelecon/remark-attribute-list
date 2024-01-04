import type {
	Construct,
	Effects,
	State,
	TokenizeContext,
} from 'micromark-util-types';
import {asciiAlphanumeric} from 'micromark-util-character';
import {codes} from 'micromark-util-symbol';

declare module 'micromark-util-types' {
	interface TokenTypeMap {
		/**
		 * Temporary name for one of these reference name-ish tokens:
		 * - `attributeListDefinitionReferenceName`
		 * - `referenceAttributeName`
		 * - `keyValuePairAttributeKey`
		 */
		referenceNameIsh: 'referenceNameIsh';
	}
}

export const referenceNameIsh: Construct = {
	tokenize,
};

function tokenize(
	this: TokenizeContext,
	effects: Effects,
	ok: State,
	nok: State,
): State {
	const start: State = (code) => {
		if (!asciiAlphanumeric(code)) return nok(code);
		effects.enter('referenceNameIsh');
		effects.consume(code);
		return after;
	};

	const after: State = (code) => {
		if (asciiAlphanumeric(code) || code === codes.dash) {
			effects.consume(code);
			return after;
		}

		effects.exit('referenceNameIsh');
		return ok(code);
	};

	return start;
}
