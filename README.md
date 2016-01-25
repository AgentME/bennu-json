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
