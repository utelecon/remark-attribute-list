import type {
	Construct,
	Effects,
	Event,
	State,
	TokenizeContext,
} from 'micromark-util-types';
import {codes} from 'micromark-util-symbol';
import {ok as assert} from 'devlop';
import type {Options} from '../index.js';
import {referenceNameIsh} from './reference-name-ish.js';
import {attributeList} from './list.js';

declare module 'micromark-util-types' {
	interface TokenTypeMap {
		/**
		 * The attribute list definition marker (either `{` or `}`)
		 */
		attributeListDefinitionMarker: 'attributeListStartMarker';

		/**
		 * The attribute list definition reference (`:label:`)
		 */
		attributeListDefinitionReference: 'attributeListDefinitionReference';
		/**
		 * The attribute list definition refrence marker (`:`)
		 */
		attributeListDefinitionReferenceMarker: 'attributeListDefinitionReferenceMarker';
		/**
		 * The attribute list definition reference name (`label`)
		 */
		attributeListDefinitionReferenceName: 'attributeListDefinitionReferenceName';

		/**
		 * The attribute list definition:
		 * ```markdown
		 * {:label: #id-name .class-name key="value" reference}
		 * ```
		 */
		attributeListDefinition: 'attributeListDefinition';
	}
}

export function attributeListDefinition(options?: Options): Construct {
	const list = attributeList(options);
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
			if (code !== codes.leftCurlyBrace) return nok(code);
			effects.enter('attributeListDefinition');
			effects.enter('attributeListDefinitionMarker');
			effects.consume(code);
			effects.exit('attributeListDefinitionMarker');
			return referenceStart;
		};

		const referenceStart: State = (code) => {
			if (code === codes.colon) {
				effects.enter('attributeListDefinitionReference');
				effects.enter('attributeListDefinitionReferenceMarker');
				effects.consume(code);
				effects.exit('attributeListDefinitionReferenceMarker');
				return effects.attempt(referenceNameIsh, referenceEnd, nok);
			}

			return nok(code);
		};

		const referenceEnd: State = (code) => {
			if (code !== codes.colon) return nok(code);
			effects.enter('attributeListDefinitionReferenceMarker');
			effects.consume(code);
			effects.exit('attributeListDefinitionReferenceMarker');
			effects.exit('attributeListDefinitionReference');

			return effects.attempt(list, end, nok);
		};

		const end: State = (code) => {
			if (code !== codes.rightCurlyBrace) return nok(code);
			effects.enter('attributeListDefinitionMarker');
			effects.consume(code);
			effects.exit('attributeListDefinitionMarker');
			effects.exit('attributeListDefinition');
			return ok;
		};

		return start;
	}

	function resolve(events: Event[]): Event[] {
		const exitReferenceMarkerStart = events.findIndex(
			([type, token]) =>
				type === 'exit' &&
				token.type === 'attributeListDefinitionReferenceMarker',
		);

		const enterReferenceNameIsh = events[exitReferenceMarkerStart + 1];
		assert(enterReferenceNameIsh?.[0] === 'enter');
		assert(enterReferenceNameIsh?.[1].type === 'referenceNameIsh');
		enterReferenceNameIsh[1].type = 'attributeListDefinitionReferenceName';

		return events;
	}
}
