import type {
	AttributeList,
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
	readonly #definitions = new Map<string, AttributeList>();

	set(name: string, list: AttributeList) {
		this.#definitions.set(name, list);
	}

	resolve(list: AttributeList) {
		let _list: AttributeList | undefined = list;

		const stack: ReferenceAttribute[] = [];
		const resolved: ResolvedAttribute[] = [];

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
			(_list = this.#definitions.get(reference.name))
		);

		return resolved;
	}
}
