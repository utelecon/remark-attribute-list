# remark-attribute-list

[![](https://github.com/cm-ayf/remark-attribute-list/actions/workflows/ci.yml/badge.svg)](https://github.com/cm-ayf/remark-attribute-list/actions)

Remark plugin to parse [Attribute List Definitions](https://kramdown.gettalong.org/syntax.html#attribute-list-definitions) and [Inline Attribute Lists](https://kramdown.gettalong.org/syntax.html#inline-attribute-lists) from [Kramdown](https://kramdown.gettalong.org).

## Install

This package is ESM only. In Node.js, install with npm:

```sh
npm install remark-attribute-list
```

## Use

Say our document input.md contains:

```md
# Title
{:#title}

{:outlink:target="blank" rel="noopener noreferrer"}

See [GitHub](https://github.com/){:outlink} for more information.
```

And our module `main.js` looks like this:

```js
import rehypeStringify from 'rehype-stringify'
import remarkAttributeList from 'remark-attribute-list'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {read} from 'to-vfile'
import {unified} from 'unified'

const processor = unified()
	.use(remarkParse)
	.use(remarkAttributeList)
	.use(remarkRehype)
	.use(rehypeStringify);
const file = await processor.process(await read('input.md'))

console.log(String(file))
```

Running `node main.js` yields:

```html
<h1 id="title">Title</h1>
<p>See <a href="https://github.com/" target="blank" rel="noopener noreferrer">GitHub</a> for more information.</p>
```

## API

This package exports no identifiers. The default export is [`remarkAttributeList`](#unifieduseremarkattributelist).

### `unified().use(remarkAttributeList)`

Add support for Attribute List Definitions and Inline Attribute Lists from Kramdown.


