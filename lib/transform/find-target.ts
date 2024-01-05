import type {Parent, RootContent} from 'mdast';
import {ok as assert} from 'devlop';
import type {Position} from 'unist';
import type {
	BlockInlineAttributeList,
	SpanInlineAttributeList,
} from '../from-markdown.js';

export default function findTarget(
	node: BlockInlineAttributeList | SpanInlineAttributeList,
	index: number,
	parent: Parent,
) {
	return (
		findTargetHalf(node, index, parent, -1) ??
		findTargetHalf(node, index, parent, 1)
	);
}

function findTargetHalf(
	node: BlockInlineAttributeList | SpanInlineAttributeList,
	index: number,
	parent: Parent,
	step: -1 | 1,
): RootContent | undefined {
	let current: BlockInlineAttributeList | SpanInlineAttributeList = node;

	while (between((index += step), 0, parent.children.length)) {
		const next = parent.children[index];
		assert(next);
		if (
			!next.position ||
			!current.position ||
			!isNext(node.type, current.position, next.position, step)
		)
			break;

		if (next.type === node.type) {
			current = next;
			continue;
		} else {
			return next;
		}
	}

	return undefined;
}

function isNext(
	type: 'blockInlineAttributeList' | 'spanInlineAttributeList',
	a: Position,
	b: Position,
	step: -1 | 1,
) {
	// Adding default case triggers ts7030
	// eslint-disable-next-line default-case
	switch (type) {
		case 'blockInlineAttributeList': {
			return a.end.line === b.start.line - step;
		}

		case 'spanInlineAttributeList': {
			return a.end.line === b.start.line - step;
		}
	}
}

function between(index: number, left: number, right: number) {
	return index >= left && index < right;
}
