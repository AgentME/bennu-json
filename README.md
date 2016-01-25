# bennu-json

This is a JSON parser for the Bennu parser combinator library. This module is
good for:

* working in places where the native `JSON.parse` function is not available
(though other polyfills may be more performant).
* parsing JSON incrementally.
* being an example of how to use parser combinators and the [Bennu
library](http://bennu-js.com/).

## Usage

This module exports parsers for `json`, `array`, `object`, `number`, and
`string`. Using the json parser to parse strings into objects requires using
the Bennu library.

```javascript
var bennu = require('bennu');
var json = require('bennu-json').json;

function jsonParse(str) {
  return bennu.parse.run(
    bennu.lang.then(json, bennu.parse.eof),
    str.trim()
  );
}

console.log(jsonParse('{"a": [-5.12e100, null]}'));
// { a: [ -5.12e+100, null ] }
```

You can also do incremental parsing with Bennu:

```javascript
var bennu = require('bennu');
var json = require('bennu-json').json;

var s1 = bennu.incremental.runInc(bennu.lang.then(json, bennu.parse.eof));
var s2 = bennu.incremental.provideString('[123,45', s1);
var s3 = bennu.incremental.provideString('6,789]', s2);
console.log(bennu.incremental.finish(s3));
// [ 123, 456, 789 ]
```
