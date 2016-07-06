import {stream, select} from 'nu-stream';
import {text, lang, parse} from 'bennu';

function grouping(open, item, joiner, close) {
  return parse.next(
    parse.next(open, ospaces),
    lang.then(
      lang.sepBy(parse.next(joiner, ospaces), lang.then(item, ospaces)),
      close
    )
  );
}

function readDigits(s) {
  return stream.foldl(
    (value, str) => value*10+parseInt(str, 10),
    0,
    s
  );
}

function applySign(s) {
  const sign = stream.first(s) === '-' ? -1 : 1;
  return sign * stream.first(stream.rest(s));
}

function opt(p) {
  return lang.betweenTimes(0, 1, p)
    .map(s => s ? stream.first(s) : null);
}

function concat(s) {
  const parts = [];
  stream.forEach(value => {
    parts.push(value);
  }, s);
  return parts.join('');
}

function deepConcat(s) {
  const parts = [];
  function readStrings(s) {
    stream.forEach(value => {
      if (typeof value === 'string') {
        parts.push(value);
      } else {
        readStrings(value);
      }
    }, s);
  }
  readStrings(s);
  return parts.join('');
}

const ospaces = parse.many(text.space);

export const json = parse.label('json', parse.late(() => parse.choice(
  string, number, object, array, token_true, token_false, token_null)));
export const string = parse.next(
    text.character('"'),
    lang.then(
      parse.many(parse.choice(
        text.noneOf('"\\'),
        parse.next(
          text.character('\\'),
          parse.choice(
            text.oneOf('"\\/'),
            text.character('b').map(() => '\b'),
            text.character('f').map(() => '\f'),
            text.character('n').map(() => '\n'),
            text.character('r').map(() => '\r'),
            text.character('t').map(() => '\t'),
            parse.next(
              text.character('u'),
              lang.times(4, text.oneOf('0123456789abcdefABCDEF'))
                .map(concat)
                .map(s => parseInt(s, 16))
                .map(String.fromCodePoint)
            )
          )
        )
      )).map(concat),
      text.character('"')
    )
  )

const digitsNoLeadingZero = parse.enumeration(
  text.oneOf('123456789'), parse.many(text.digit)
).map(s => stream.cons(stream.first(s), stream.first(stream.rest(s))));

// Custom implementation of number. Not completely accurate for floating point!
const CUSTOMnumber = parse.enumeration(
    opt(text.character('-')),
    parse.enumeration(
      parse.choice(
        text.character('0').map(() => 0),
        digitsNoLeadingZero.map(readDigits)
      ),
      opt(parse.next(text.character('.'), parse.many1(text.digit))),
      opt(
        parse.next(
          text.oneOf('eE'),
          parse.enumeration(
            opt(text.oneOf('+-')),
            parse.many1(text.digit).map(readDigits)
          ).map(applySign)
        )
      )
    )
    .map(s => {
      let value = stream.first(s);
      const fracS = stream.rest(s);

      const fracStream = stream.first(fracS);
      if (fracStream) {
        let fracValue = 0;
        let pos = -1;
        stream.forEach(str => {
          fracValue += parseInt(str) * Math.pow(10, pos--);
        }, fracStream);
        value += fracValue;
      }

      const eS = stream.rest(fracS);
      const exponent = stream.first(eS);
      if (exponent != null) {
        value *= Math.pow(10, exponent);
      }

      return value;
    })
  ).map(applySign);

// Okay, we're cheating a bit here. We're manually parsing out the parts to be
// only what the JSON standard allows, but then we're using javascript to
// interpret it so we get accurate floating point values.
const NATIVEnumber = parse.enumeration(
    opt(text.character('-')),
    parse.choice(
      text.character('0'),
      digitsNoLeadingZero
    ),
    opt(parse.enumeration(text.character('.'), parse.many1(text.digit))),
    opt(
      parse.enumeration(
        text.oneOf('eE'),
        parse.enumeration(
          opt(text.oneOf('+-')),
          parse.many1(text.digit)
        )
      )
    )
  )
  .map(deepConcat)
  .map(Number);

export const number = parse.label('number', NATIVEnumber);

const joiner = text.character(',');
const mapping_pair = parse.enumeration(
    string, ospaces, text.character(':'), ospaces, json
  ).map(s => {
    return [stream.first(s), stream.first(select.skip(4, s))];
  });
export const array = parse.label('array', grouping(
    text.character('['), json, joiner, text.character(']')
  )
  .map(s => {
    const array = [];
    stream.forEach(value => {
      array.push(value);
    }, s);
    return array;
  }));
export const object = parse.label('object', grouping(
    text.character('{'), mapping_pair, joiner, text.character('}')
  )
  .map(s => {
    const obj = {};
    stream.forEach(value => {
      obj[value[0]] = value[1];
    }, s);
    return obj;
  }));
export const token_true = text.string('true').map(() => true);
export const token_false = text.string('false').map(() => false);
export const token_null = text.string('null').map(() => null);
