import type {Root} from 'mdast';
import {visit} from 'unist-util-visit';
import {ok as assert} from 'devlop';
import {remove} from 'unist-util-remove';
import type {Options} from '../index.js';
import Definitions from './definitions.js';
import assignAttributes from './assign-attributes.js';
import {createFindTarget} from './find-target.js';

export function createTransform(options?: Options) {
	const findTarget = createFindTarget(options);
	return transform;

	function transform(tree: Root) {
		const definitions = new Definitions();

		visit(tree, 'attributeListDefinition', (node) => {
			definitions.set(node);
		});

		visit(
			tree,
			['blockInlineAttributeList', 'spanInlineAttributeList'] as const,
			(node, index, parent) => {
				// `typeof node` should be narrowed, but is not, due to bug on `visit`
				assert(
					node.type === 'blockInlineAttributeList' ||
						node.type === 'spanInlineAttributeList',
				);
				assert(parent);
				assert(typeof index === 'number');

				const target = findTarget(node, index, parent);
				if (!target) return;

				const attributes = definitions.resolve(node);

				if (attributes.length > 0) assignAttributes(target, attributes);
			},
		);

		remove(tree, [
			'attributeListDefinition',
			'blockInlineAttributeList',
			'spanInlineAttributeList',
		]);

		return tree;
	}
}
