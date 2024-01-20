import {
	asciiAlpha,
	asciiAlphanumeric,
	unicodeWhitespace,
} from 'micromark-util-character';
import {codes} from 'micromark-util-symbol';
import type {
	Code,
	Construct,
	Effects,
	Event,
	State,
	Token,
	TokenizeContext,
} from 'micromark-util-types';
import {ok as assert} from 'devlop';
import type {Options} from '../index.js';
import {referenceNameIsh} from './reference-name-ish.js';

declare module 'micromark-util-types' {
	interface TokenTypeMap {
		/**
		 * The space(s) between each attributes
		 */
		attributeListSpace: 'attributeListSpace';

		/**
		 * The reference attribute (`reference`)
		 */
		referenceAttribute: 'referenceAttribute';
		/**
		 * The reference attribute name (`reference`)
		 */
		referenceAttributeName: 'referenceAttributeName';

		/**
		 * The whole id attribute (`#id-name`)
		 */
		idNameAttribute: 'idNameAttribute';
		/**
		 * The id attribute marker (`#`).
		 */
		idNameAttributeMarker: 'idNameAttributeMarker';
		/**
		 * The id attribute name (`id-name`)
		 */
		idNameAttributeName: 'idNameAttributeName';

		/**
		 * The whole class attribute (`.class-name`)
		 */
		classNameAttribute: 'classNameAttribute';
		/**
		 * The class attribute marker (`.`)
		 */
		classNameAttributeMarker: 'classNameAttributeMarker';
		/**
		 * The class attribute name (`class-name`)
		 */
		classNameAttributeName: 'classNameAttributeName';

		/**
		 * The key-value pair attribute (`key=value`)
		 */
		keyValuePairAttribute: 'keyValuePairAttribute';
		/**
		 * The key-value pair attribute key (`key`)
		 */
		keyValuePairAttributeKey: 'keyValuePairAttributeKey';
		/**
		 * The key-value pair attribute equals (`=`)
		 */
		keyValuePairAttributeEquals: 'keyValuePairAttributeEquals';
		/**
		 * The key-value pair attribute value (`"value"`)
		 */
		keyValuePairAttributeValue: 'keyValuePairAttributeValue';
		/**
		 * The key-value pair attribute value start (either `"` or `'`)
		 */
		keyValuePairAttributeValueMarker: 'keyValueAttributeValueMarker';
		/**
		 * The key-value pair attribute value (`value`)
		 */
		keyValuePairAttributeValueString: 'keyValueAttributeValueString';

		/**
		 * The attribute list included in either a block or span inline attribute list or an attribute list definition:
		 * ```markdown
		 * reference #id-name .class-name key="value"
		 * ```
		 */
		attributeList: 'attributeList';
	}
}

export function attributeList(options?: Options): Construct {
	return {
		tokenize,
		resolve,
	};

	function tokenize(
		this: TokenizeContext,
		effects: Effects,
		ok: State,
		nok: State,
	): State {
		const start: State = (code) => {
			effects.enter('attributeList');
			return next(code);
		};

		const next: State = (code) => {
			if (unicodeWhitespace(code)) {
				return spaceOrEnd(code);
			}

			if (code === codes.numberSign) {
				effects.enter('idNameAttribute');
				effects.enter('idNameAttributeMarker');
				effects.consume(code);
				effects.exit('idNameAttributeMarker');
				return idNameAttributeNameFirst;
			}

			if (code === codes.dot) {
				effects.enter('classNameAttribute');
				effects.enter('classNameAttributeMarker');
				effects.consume(code);
				effects.exit('classNameAttributeMarker');
				effects.enter('classNameAttributeName');
				return classNameAttributeName;
			}

			if (asciiAlphanumeric(code)) {
				return effects.attempt(
					referenceNameIsh,
					referenceEndOrKeyValueEqual,
					nok,
				)(code);
			}

			return nok(code);
		};

		let spaces = 0;
		const spaceOrEnd: State = (code) => {
			if (code === codes.rightCurlyBrace) {
				if (spaces > 0) effects.exit('attributeListSpace');
				effects.exit('attributeList');
				return ok(code);
			}

			if (unicodeWhitespace(code)) {
				if (spaces === 0) effects.enter('attributeListSpace');
				spaces++;
				effects.consume(code);
				return spaceOrEnd;
			}

			if (spaces > 0) {
				effects.exit('attributeListSpace');
				spaces = 0;
				return next(code);
			}

			return nok(code);
		};

		const idNameAttributeNameFirst: State = (code) => {
			if (!asciiAlpha(code)) return nok(code);
			effects.enter('idNameAttributeName');
			effects.consume(code);
			return idNameAttributeNameRest;
		};

		const idNameAttributeNameRest: State = (code) => {
			if (
				asciiAlphanumeric(code) ||
				code === codes.dash ||
				code === codes.colon ||
				(options?.allowUnderscoreInId && code === codes.underscore)
			) {
				effects.consume(code);
				return idNameAttributeNameRest;
			}

			effects.exit('idNameAttributeName');
			effects.exit('idNameAttribute');

			if (
				options?.allowNoSpaceBeforeName &&
				(code === codes.dot || code === codes.numberSign)
			) {
				return next(code);
			}

			return spaceOrEnd(code);
		};

		const classNameAttributeName: State = (code) => {
			if (unicodeWhitespace(code) || code === codes.rightCurlyBrace) {
				effects.exit('classNameAttributeName');
				effects.exit('classNameAttribute');
				return spaceOrEnd(code);
			}

			if (code === codes.dot || code === codes.numberSign) {
				if (options?.allowNoSpaceBeforeName) {
					effects.exit('classNameAttributeName');
					effects.exit('classNameAttribute');
					return next(code);
				}

				return nok(code);
			}

			effects.consume(code);
			return classNameAttributeName;
		};

		const referenceEndOrKeyValueEqual: State = (code) => {
			if (code === codes.equalsTo) {
				effects.enter('keyValuePairAttributeEquals');
				effects.consume(code);
				effects.exit('keyValuePairAttributeEquals');
				return keyValuePairAttributeValueStart;
			}

			if (
				options?.allowNoSpaceBeforeName &&
				(code === codes.dot || code === codes.numberSign)
			) {
				return next(code);
			}

			// `effects.exit('referenceAttribute')` will be added later on resolveAll
			return spaceOrEnd(code);
		};

		let keyValuePairAttributeValueMarker: Code | undefined;
		const keyValuePairAttributeValueStart: State = (code) => {
			if (code === codes.quotationMark || code === codes.apostrophe) {
				effects.enter('keyValuePairAttributeValue');
				effects.enter('keyValuePairAttributeValueMarker');
				keyValuePairAttributeValueMarker = code;
				effects.consume(code);
				effects.exit('keyValuePairAttributeValueMarker');
				effects.enter('keyValuePairAttributeValueString');
				return keyValuePairAttributeValueString;
			}

			return nok(code);
		};

		let escaping = false;
		const keyValuePairAttributeValueString: State = (code) => {
			if (escaping) {
				effects.consume(code);
				escaping = false;
				return keyValuePairAttributeValueString;
			}

			if (code === codes.backslash) {
				effects.consume(code);
				escaping = true;
				return keyValuePairAttributeValueString;
			}

			if (code === keyValuePairAttributeValueMarker) {
				effects.exit('keyValuePairAttributeValueString');
				effects.enter('keyValuePairAttributeValueMarker');
				effects.consume(code);
				keyValuePairAttributeValueMarker = undefined;
				effects.exit('keyValuePairAttributeValueMarker');
				effects.exit('keyValuePairAttributeValue');
				// `effects.exit('keyValuePairAttribute')` will be added later on resolveAll
				return spaceOrEnd;
			}

			effects.consume(code);
			return keyValuePairAttributeValueString;
		};

		return start;
	}

	function resolve(events: Event[], context: TokenizeContext): Event[] {
		let index = 0;
		while (index < events.length) {
			const [enter, referenceNameIsh] = events[index]!;
			if (enter !== 'enter' || referenceNameIsh.type !== 'referenceNameIsh') {
				index++;
				continue;
			}

			if (events[index + 2]?.[1].type === 'keyValuePairAttributeEquals') {
				// `referenceNameIsh` is a keyValuePairAttributeKey
				// Expected condition:
				// - enter keyValuePairAttribute <- added
				// - enter keyValuePairAttributeKey <- index, renamed
				// - exit  keyValuePairAttributeKey <- renamed
				// - enter keyValuePairAttributeEquals
				// - exit  keyValuePairAttributeEquals
				// - enter keyValuePairAttributeValue
				// - enter keyValuePairAttributeValueMarker
				// - exit  keyValuePairAttributeValueMarker
				// - enter keyValuePairAttributeValueString
				// - exit  keyValuePairAttributeValueString
				// - enter keyValuePairAttributeValueMarker
				// - exit  keyValuePairAttributeValueMarker
				// - exit  keyValuePairAttributeValue
				// - exit  keyValuePairAttribute <- added

				referenceNameIsh.type = 'keyValuePairAttributeKey';

				const exitKeyValuePairAttribute = events[index + 11];
				assert(exitKeyValuePairAttribute);
				assert(exitKeyValuePairAttribute[0] === 'exit');
				assert(
					exitKeyValuePairAttribute[1].type === 'keyValuePairAttributeValue',
					`Expected keyValuePairAttributeValue, got ${exitKeyValuePairAttribute[1].type}`,
				);
				const [, keyValuePairAttributeValue] = exitKeyValuePairAttribute;
				const keyValuePairAttribute: Token = {
					type: 'keyValuePairAttribute',
					start: referenceNameIsh.start,
					end: keyValuePairAttributeValue.end,
				};
				events.splice(index, 0, ['enter', keyValuePairAttribute, context]);
				events.splice(index + 13, 0, ['exit', keyValuePairAttribute, context]);
				index += 14;
			} else {
				// `referenceNameIsh` is a referenceAttributeName
				// Expected condition:
				// - enter referenceAttribute <- added
				// - enter referenceAttributeName <- index, renamed
				// - exit  referenceAttributeName <- renamed
				// - exit  referenceAttribute <- added

				referenceNameIsh.type = 'referenceAttributeName';
				const referenceAttribute: Token = {
					type: 'referenceAttribute',
					start: referenceNameIsh.start,
					end: referenceNameIsh.end,
				};
				events.splice(index, 0, ['enter', referenceAttribute, context]);
				events.splice(index + 3, 0, ['exit', referenceAttribute, context]);

				index += 4;
			}
		}

		return events;
	}
}
