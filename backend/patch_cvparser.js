const fs = require('fs');
let code = fs.readFileSync('utils/cvParser.js', 'utf8');

code = code.replace(
  /\bIELTS\s*(?:\(\?:overall\|band\|score\)\?)?\s*\[:=\\-\]\?\s*\(\[0-9\]\(\?:\\\u002e\[0-9\]\)\?\)/i,
  '\\bIELTS\\b(?:[^0-9]{0,20}?)([0-9](?:\\.[0-9])?)'
);

code = code.replace(
  /\bTOEFL\(\?:\\s\+iBT\)\?\s*\(\?:overall\|score\)\?\s*\[:=\\-\]\?\s*\(\\d\{2,3\}\)/i,
  '\\bTOEFL\\b(?:[^0-9]{0,20}?)([0-9]{2,3})'
);

code = code.replace(
  /\bGRE\s*\(\?:general\|overall\|score\)\?\s*\[:=\\-\]\?\s*\(\\d\{3\}\)/i,
  '\\bGRE\\b(?:[^0-9]{0,20}?)([0-9]{3})'
);

fs.writeFileSync('utils/cvParser.js', code);
console.log('Patched cvParser.js');
