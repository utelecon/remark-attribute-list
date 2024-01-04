import type {
	Construct,
	Effects,
	Event,
	State,
	TokenizeContext,
} from 'micromark-util-types';
import {codes} from 'micromark-util-symbol';
import {ok as assert} from 'devlop';
import {referenceNameIsh} from './reference-name-ish.js';
import {attributeList} from './list.js';

declare module 'micromark-util-types' {
	interface TokenTypeMap {
		/**
		 * The attribute list definition marker (either `{` or `}`)
		 */
		attributeListDefinitionMarker: 'attributeListStartMarker';

		/**
		 * The space(s) between the marker and the reference
		 */
		attributeListDefinitionSpace: 'attributeListDefinitionSpace';

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

export const attributeListDefinition: Construct = {
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
		return spaceOrReferenceStart;
	};

	let spaces = 0;
	const spaceOrReferenceStart: State = (code) => {
		if (code === codes.space) {
			if (spaces === 0) effects.enter('attributeListDefinitionSpace');
			spaces++;
			if (spaces > 3) return nok(code);
			effects.consume(code);
			return spaceOrReferenceStart;
		}

		if (spaces > 0) effects.exit('attributeListDefinitionSpace');

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

		return effects.attempt(attributeList, end, nok);
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
