import type {Node} from 'mdast';

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

export type Attribute =
	| ReferenceAttribute
	| IdNameAttribute
	| ClassNameAttribute
	| KeyValueAttribute;

export interface BaseAttributeList extends Node {
	children: Attribute[];
}

export interface AttributeListDefinition extends BaseAttributeList {
	type: 'attributeListDefinition';
	name: string;
}

export interface BlockInlineAttributeList extends BaseAttributeList {
	type: 'blockInlineAttributeList';
}

export interface SpanInlineAttributeList extends BaseAttributeList {
	type: 'spanInlineAttributeList';
}

declare module 'mdast' {
	interface DefinitionContentMap {
		attributeListDefinition: AttributeListDefinition;
	}

	interface BlockContentMap {
		blockInlineAttributeList: BlockInlineAttributeList;
	}

	interface SpanContentMap {
		spanInlineAttributeList: SpanInlineAttributeList;
	}

	interface RootContentMap {
		attributeListDefinition: AttributeListDefinition;
		blockInlineAttributeList: BlockInlineAttributeList;
		spanInlineAttributeList: SpanInlineAttributeList;
		referenceAttribute: ReferenceAttribute;
		idNameAttribute: IdNameAttribute;
		classNameAttribute: ClassNameAttribute;
		keyValueAttribute: KeyValueAttribute;
	}
}
