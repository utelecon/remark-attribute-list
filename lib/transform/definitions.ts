import type {
	AttributeListDefinition,
	BaseAttributeList,
	ClassNameAttribute,
	IdNameAttribute,
	KeyValueAttribute,
	ReferenceAttribute,
} from '../from-markdown.js';

export type ResolvedAttribute =
	| IdNameAttribute
	| ClassNameAttribute
	| KeyValueAttribute;

export default class Definitions {
	readonly #definitions = new Map<string, AttributeListDefinition>();

	set(node: AttributeListDefinition) {
		this.#definitions.set(node.name, node);
	}

	resolve(list: BaseAttributeList) {
		const stack: ReferenceAttribute[] = [];
		const resolved: ResolvedAttribute[] = [];

		let reference: ReferenceAttribute | undefined;
		let current: BaseAttributeList | undefined = list;
		do {
			for (const attribute of current.children) {
				if (attribute.type === 'referenceAttribute') {
					if (!stack.some((ref) => ref.name === attribute.name))
						stack.push(attribute);
				} else {
					resolved.push(attribute);
				}
			}
		} while (
			(reference = stack.pop()) &&
			(current = this.#definitions.get(reference.name))
		);

		return resolved;
	}
}
