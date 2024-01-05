import type {Data, RootContent} from 'mdast';
import type {Properties} from 'hast';
import type {
	MdxJsxAttribute,
	MdxJsxFlowElement,
	MdxJsxTextElement,
} from 'mdast-util-mdx';
import type {ResolvedAttribute} from './definitions.js';

interface MdastData extends Data {
	id?: string;
	hProperties: Properties;
}

export default function assignAttributes(
	target: RootContent,
	attributes: ResolvedAttribute[],
) {
	if (
		target.type === 'mdxJsxTextElement' ||
		target.type === 'mdxJsxFlowElement'
	) {
		assignMdxAttributes(target, attributes);
	} else {
		assignMarkdownProperties(target, attributes);
	}
}

function assignMdxAttributes(
	node: MdxJsxFlowElement | MdxJsxTextElement,
	attributes: ResolvedAttribute[],
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
	if (name === 'class') name = 'className';
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
	node: RootContent,
	attributes: ResolvedAttribute[],
) {
	const data = (node.data ??= {}) as MdastData;
	data.hProperties ??= {};
	for (const attribute of attributes) {
		switch (attribute.type) {
			case 'idNameAttribute': {
				upsertMarkdownProperty(data, 'id', attribute.name);
				break;
			}

			case 'classNameAttribute': {
				upsertMarkdownProperty(data, 'className', attribute.name, true);
				break;
			}

			case 'keyValueAttribute': {
				upsertMarkdownProperty(data, attribute.key, attribute.value);
				break;
			}

			default:
		}
	}
}

function upsertMarkdownProperty(
	data: MdastData,
	name: string,
	value: string,
	append = false,
) {
	if (name === 'class') name = 'className';
	if (typeof data.hProperties[name] === 'string') {
		if (append) {
			(data.hProperties[name] as string) += ` ${value}`;
		} else {
			data.hProperties[name] = value;
		}
	} else {
		data.hProperties[name] = value;
	}

	if (name === 'id') {
		data.id = value;
	}
}
