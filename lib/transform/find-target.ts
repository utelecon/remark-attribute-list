/* eslint-disable default-case */
import type {Parent, RootContent} from 'mdast';
import {ok as assert} from 'devlop';
import type {Position} from 'unist';
import type {
	BlockInlineAttributeList,
	SpanInlineAttributeList,
} from '../mdast.js';
import type {Options} from '../index.js';

export function createFindTarget(options?: Options) {
	return findTarget;

	function findTarget(
		node: BlockInlineAttributeList | SpanInlineAttributeList,
		index: number,
		parent: Parent,
	) {
		switch (node.type) {
			case 'blockInlineAttributeList': {
				return (
					findTargetHalf(node, index, parent, 'preceding') ??
					findTargetHalf(node, index, parent, 'following')
				);
			}

			case 'spanInlineAttributeList': {
				const target = findTargetHalf(node, index, parent, 'preceding');
				if (target?.type === 'text') return;
				return target;
			}
		}
	}

	function findTargetHalf(
		node: BlockInlineAttributeList | SpanInlineAttributeList,
		index: number,
		parent: Parent,
		direction: 'preceding' | 'following',
	): RootContent | undefined {
		const step = {preceding: -1, following: 1}[direction];
		let current: BlockInlineAttributeList | SpanInlineAttributeList = node;

		while (between((index += step), 0, parent.children.length)) {
			const next = parent.children[index];
			assert(next);
			assert(current.position);
			assert(next.position);

			if (
				(direction === 'preceding' &&
					!isNext(current.type, next.position, current.position)) ||
				(direction === 'following' &&
					!isNext(current.type, current.position, next.position))
			) {
				break;
			}

			if (next.type === node.type) {
				current = next;
				continue;
			} else {
				return next;
			}
		}

		return undefined;
	}

	function between(index: number, left: number, right: number) {
		return index >= left && index < right;
	}

	function isNext(
		type: 'blockInlineAttributeList' | 'spanInlineAttributeList',
		preceding: Position,
		following: Position,
	) {
		if (options?.allowNoSpaceBeforeName && (!preceding || !following)) {
			return true;
		}

		switch (type) {
			case 'blockInlineAttributeList': {
				return following.start.line === preceding.end.line + 1;
			}

			case 'spanInlineAttributeList': {
				return (
					following.start.line === preceding.end.line &&
					following.start.column === preceding.end.column
				);
			}
		}
	}
}
