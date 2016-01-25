import {parse, lang} from 'bennu';
import assert from 'assert';
import {json} from '../src';

function only(x) {
  return lang.then(x, parse.choice(parse.eof, parse.fail("Extra input")));
}

describe("bennu-json", function() {
  it("complex case", function() {
    const parsed = parse.run(
      only(json),
      '[ [-56.12e-34,6,"a\\"b",{"b c":false,"d":5},true,null] ,7]'
    );
    assert.deepEqual(
      parsed,
      [ [-56.12e-34,6,"a\"b",{"b c":false,"d":5},true,null] ,7]
    );
  });

  it("two numbers", function() {
    const parsed = parse.run(
      only(json),
      '[ 1 , 2 ]'
    );
    assert.deepEqual(
      parsed,
      [1, 2]
    );
  });
});