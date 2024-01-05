import {ok as assert} from 'devlop';
import type {Node} from 'unist';
import type {
	CompileContext,
	Extension as FromMarkdownExtension,
	Token,
} from 'mdast-util-from-markdown';
import type {Nodes} from 'mdast';
import type {
	BaseAttributeList,
	ClassNameAttribute,
	IdNameAttribute,
	KeyValueAttribute,
	ReferenceAttribute,
} from './mdast.js';

export const fromMarkdownExtension: FromMarkdownExtension = {
	canContainEols: ['attributeListDefinition', 'blockInlineAttributeList'],
	enter: {
		attributeListDefinition: initialize,
		blockInlineAttributeList: initialize,
		spanInlineAttributeList: initialize,
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
			children: [],
			// @ts-expect-error: missing `name` are added later.
		} satisfies Extract<Nodes, BaseAttributeList>,
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

function enterReferenceAttribute(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	node.children.push({
		type: 'referenceAttribute',
		position: {start: token.start, end: token.end},
		// @ts-expect-error: missing `name` is added later.
	} satisfies Partial<ReferenceAttribute>);
}

function exitReferenceAttributeName(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	const tail = node.children.at(-1);
	assert(tail?.type === 'referenceAttribute');
	tail.name = this.sliceSerialize(token);
}

function enterIdNameAttribute(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	node.children.push({
		type: 'idNameAttribute',
		position: {start: token.start, end: token.end},
		// @ts-expect-error: missing `name` is added later.
	} satisfies Partial<IdNameAttribute>);
}

function exitIdNameAttributeName(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	const tail = node.children.at(-1);
	assert(tail?.type === 'idNameAttribute');
	tail.name = this.sliceSerialize(token);
}

function enterClassNameAttribute(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	node.children.push({
		type: 'classNameAttribute',
		position: {start: token.start, end: token.end},
		// @ts-expect-error: missing `name` is added later.
	} satisfies Partial<ClassNameAttribute>);
}

function exitClassNameAttributeName(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	const tail = node.children.at(-1);
	assert(tail?.type === 'classNameAttribute');
	tail.name = this.sliceSerialize(token);
}

function enterKeyValuePairAttribute(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	node.children.push({
		type: 'keyValueAttribute',
		position: {start: token.start, end: token.end},
		// @ts-expect-error: missing `key` and `value` are added later.
	} satisfies Partial<KeyValueAttribute>);
}

function exitKeyValuePairAttributeKey(this: CompileContext, token: Token) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	const tail = node.children.at(-1);
	assert(tail?.type === 'keyValueAttribute');
	tail.key = this.sliceSerialize(token);
}

function exitKeyValuePairAttributeValueString(
	this: CompileContext,
	token: Token,
) {
	const node = this.stack.at(-1);
	assertAnyAttributeList(node);
	const tail = node.children.at(-1);
	assert(tail?.type === 'keyValueAttribute');
	tail.value = this.sliceSerialize(token).replaceAll(/\\(.)/g, '$1');
}

function assertAnyAttributeList(
	node: Node | undefined,
): asserts node is BaseAttributeList {
	assert(node);
	assert(
		[
			'attributeListDefinition',
			'spanInlineAttributeList',
			'blockInlineAttributeList',
		].includes(node.type),
	);
}
