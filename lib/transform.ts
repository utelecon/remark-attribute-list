import type {Data, Node, Nodes, Root} from 'mdast';
import {visit} from 'unist-util-visit';
import {ok as assert} from 'devlop';
import type {Properties} from 'hast';
import type {
	MdxJsxAttribute,
	MdxJsxFlowElement,
	MdxJsxTextElement,
} from 'mdast-util-mdx';
import type {
	AttributeList,
	ClassNameAttribute,
	IdNameAttribute,
	KeyValueAttribute,
	ReferenceAttribute,
} from './from-markdown.js';

interface MdastData extends Data {
	id?: string;
	hProperties?: Properties;
}

export function transform(tree: Root) {
	const definitions = new Map<string, AttributeList>();

	function resolve(
		list: AttributeList,
	): Array<IdNameAttribute | ClassNameAttribute | KeyValueAttribute> {
		let _list: AttributeList | undefined = list;

		const stack: ReferenceAttribute[] = [];
		const resolved: Array<
			IdNameAttribute | ClassNameAttribute | KeyValueAttribute
		> = [];

		let reference: ReferenceAttribute | undefined;
		do {
			for (const attribute of _list.attributes) {
				if (attribute.type === 'referenceAttribute') {
					if (!stack.some((ref) => ref.name === attribute.name))
						stack.push(attribute);
				} else {
					resolved.push(attribute);
				}
			}
		} while (
			(reference = stack.pop()) &&
			(_list = definitions.get(reference.name))
		);

		return resolved;
	}

	visit(tree, 'attributeListDefinition', (node) => {
		definitions.set(node.name, node.list);
	});

	visit(tree, 'blockInlineAttributeList', (node, index, parent) => {
		assert(parent);
		assert(typeof index === 'number');
		let last: Nodes;
		do {
			const l = parent.children[--index];
			assert(l);
			last = l;
		} while (last.type === 'blockInlineAttributeList');

		const attributes = resolve(node.list);

		if (last.type === 'mdxJsxFlowElement') {
			assignMdxAttributes(last, attributes);
		} else {
			assignMarkdownProperties(last, attributes);
		}
	});

	visit(tree, 'spanInlineAttributeList', (node, index, parent) => {
		assert(parent);
		assert(typeof index === 'number');
		let last: Nodes;
		do {
			const l = parent.children[--index];
			assert(l);
			last = l;
		} while (last.type === 'spanInlineAttributeList');

		const attributes = resolve(node.list);

		if (last.type === 'mdxJsxTextElement') {
			assignMdxAttributes(last, attributes);
		} else {
			assignMarkdownProperties(last, attributes);
		}
	});
}

function assignMdxAttributes(
	node: MdxJsxFlowElement | MdxJsxTextElement,
	attributes: Array<IdNameAttribute | ClassNameAttribute | KeyValueAttribute>,
) {
	for (const attribute of attributes) {
		switch (attribute.type) {
			case 'idNameAttribute': {
				upsertMdxJsxAttribute(node, 'id', attribute.name);
				break;
			}

			case 'classNameAttribute': {
				upsertMdxJsxAttribute(node, 'className', attribute.name, true);
				break;
			}

			case 'keyValueAttribute': {
				upsertMdxJsxAttribute(node, attribute.key, attribute.value);
				break;
			}

			default:
		}
	}
}

function upsertMdxJsxAttribute(
	node: MdxJsxFlowElement | MdxJsxTextElement,
	name: string,
	value: string,
	append = false,
) {
	const attr = node.attributes.find(
		(attr): attr is MdxJsxAttribute =>
			attr.type === 'mdxJsxAttribute' && attr.name === name,
	);

	if (attr && typeof attr.value === 'string') {
		if (append) {
			attr.value += ` ${value}`;
		} else {
			attr.value = value;
		}
	} else {
		node.attributes.push({type: 'mdxJsxAttribute', name, value});
	}

	if (name === 'id') {
		(node.data as MdastData).id = value;
	}
}

function assignMarkdownProperties(
	node: Node,
	attributes: Array<IdNameAttribute | ClassNameAttribute | KeyValueAttribute>,
) {
	const data = (node.data ??= {}) as MdastData;
	data.hProperties ??= {};
	for (const attribute of attributes) {
		switch (attribute.type) {
			case 'idNameAttribute': {
				data.hProperties['id'] = attribute.name;
				break;
			}

			case 'classNameAttribute': {
				if (typeof data.hProperties['className'] === 'string') {
					data.hProperties['className'] += ` ${attribute.name}`;
				} else {
					data.hProperties['className'] = attribute.name;
				}

				break;
			}

			case 'keyValueAttribute': {
				data.hProperties[attribute.key] = attribute.value;
				break;
			}

			default:
		}

		if (attribute.type === 'idNameAttribute') {
			data.id = attribute.name;
		}
	}
}
