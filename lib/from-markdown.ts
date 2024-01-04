import {ok as assert} from 'devlop';
import type {Node} from 'unist';
import type {
	CompileContext,
	Extension as FromMarkdownExtension,
	Token,
} from 'mdast-util-from-markdown';

export interface ReferenceAttribute extends Node {
	type: 'referenceAttribute';
	name: string;
}

export interface IdNameAttribute extends Node {
	type: 'idNameAttribute';
	name: string;
}

export interface ClassNameAttribute extends Node {
	type: 'classNameAttribute';
	name: string;
}

export interface KeyValueAttribute extends Node {
	type: 'keyValueAttribute';
	key: string;
	value: string;
}

export interface AttributeList extends Node {
	type: 'attributeList';
	attributes: Array<
		| ReferenceAttribute
		| IdNameAttribute
		| ClassNameAttribute
		| KeyValueAttribute
	>;
}

export interface AttributeListDefinition extends Node {
	type: 'attributeListDefinition';
	name: string;
	list: AttributeList;
}

export interface BlockInlineAttributeList extends Node {
	type: 'blockInlineAttributeList';
	list: AttributeList;
}

export interface SpanInlineAttributeList extends Node {
	type: 'spanInlineAttributeList';
	list: AttributeList;
}

declare module 'mdast' {
	interface BlockContentMap {
		attributeListDefinition: AttributeListDefinition;
		blockInlineAttributeList: BlockInlineAttributeList;
	}

	interface SpanContentMap {
		spanInlineAttributeList: SpanInlineAttributeList;
	}

	interface RootContentMap {
		attributeListDefinition: AttributeListDefinition;
		blockInlineAttributeList: BlockInlineAttributeList;
		spanInlineAttributeList: SpanInlineAttributeList;
	}
}

export const fromMarkdownExtension: FromMarkdownExtension = {
	canContainEols: ['attributeListDefinition', 'blockInlineAttributeList'],
	enter: {
		attributeListDefinition: initialize,
		blockInlineAttributeList: initialize,
		spanInlineAttributeList: initialize,
		attributeList: enterAttributeList,
		referenceAttribute: enterReferenceAttribute,
		idNameAttribute: enterIdNameAttribute,
		classNameAttribute: enterClassNameAttribute,
		keyValuePairAttribute: enterKeyValuePairAttribute,
	},
	exit: {
		attributeListDefinition: complete,
		blockInlineAttributeList: complete,
		spanInlineAttributeList: complete,
		attributeListDefinitionReferenceName:
			exitAttributeListDefinitionReferenceName,
		referenceAttributeName: exitReferenceAttributeName,
		idNameAttributeName: exitIdNameAttributeName,
		classNameAttributeName: exitClassNameAttributeName,
		keyValuePairAttributeKey: exitKeyValuePairAttributeKey,
		keyValuePairAttributeValueString: exitKeyValuePairAttributeValueString,
	},
};

function initialize(this: CompileContext, token: Token) {
	assert(
		token.type === 'attributeListDefinition' ||
			token.type === 'blockInlineAttributeList' ||
			token.type === 'spanInlineAttributeList',
	);
	this.enter(
		{
			type: token.type,
			position: {start: token.start, end: token.end},
			// @ts-expect-error: missing `name` and `list` are added later.
		} satisfies Partial<AnyAttributeList>,
		token,
	);
}

function complete(this: CompileContext, token: Token) {
	this.exit(token);
}

function exitAttributeListDefinitionReferenceName(
	this: CompileContext,
	token: Token,
) {
	const node = this.stack.at(-1);
	assert(node);
	assert(node.type === 'attributeListDefinition');
	node.name = this.sliceSerialize(token);
}

function enterAttributeList(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	node.list = {
		type: 'attributeList',
		attributes: [],
		position: {start: token.start, end: token.end},
	};
}

function enterReferenceAttribute(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	node.list.attributes.push({
		type: 'referenceAttribute',
		position: {start: token.start, end: token.end},
		// @ts-expect-error: missing `name` is added later.
	} satisfies Partial<ReferenceAttribute>);
}

function exitReferenceAttributeName(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	const tail = node.list.attributes.at(-1);
	assert(tail?.type === 'referenceAttribute');
	tail.name = this.sliceSerialize(token);
}

function enterIdNameAttribute(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	node.list.attributes.push({
		type: 'idNameAttribute',
		position: {start: token.start, end: token.end},
		// @ts-expect-error: missing `name` is added later.
	} satisfies Partial<IdNameAttribute>);
}

function exitIdNameAttributeName(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	const tail = node.list.attributes.at(-1);
	assert(tail?.type === 'idNameAttribute');
	tail.name = this.sliceSerialize(token);
}

function enterClassNameAttribute(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	node.list.attributes.push({
		type: 'classNameAttribute',
		position: {start: token.start, end: token.end},
		// @ts-expect-error: missing `name` is added later.
	} satisfies Partial<ClassNameAttribute>);
}

function exitClassNameAttributeName(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	const tail = node.list.attributes.at(-1);
	assert(tail?.type === 'classNameAttribute');
	tail.name = this.sliceSerialize(token);
}

function enterKeyValuePairAttribute(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	node.list.attributes.push({
		type: 'keyValueAttribute',
		position: {start: token.start, end: token.end},
		// @ts-expect-error: missing `key` and `value` are added later.
	} satisfies Partial<KeyValueAttribute>);
}

function exitKeyValuePairAttributeKey(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	const tail = node.list.attributes.at(-1);
	assert(tail?.type === 'keyValueAttribute');
	tail.key = this.sliceSerialize(token);
}

function exitKeyValuePairAttributeValueString(
	this: CompileContext,
	token: Token,
) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	const tail = node.list.attributes.at(-1);
	assert(tail?.type === 'keyValueAttribute');
	tail.value = this.sliceSerialize(token).replaceAll(/\\(.)/g, '$1');
}

type AnyAttributeList =
	| AttributeListDefinition
	| BlockInlineAttributeList
	| SpanInlineAttributeList;

function assertAnyAttributeList(
	node: CompileContext['stack'][number] | undefined,
): asserts node is AnyAttributeList {
	assert(node);
	assert(
		[
			'attributeListDefinition',
			'spanInlineAttributeList',
			'blockInlineAttributeList',
		].includes(node.type),
	);
}
