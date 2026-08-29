function firstNumber(text, regex, parser = Number.parseFloat) {
  const match = text.match(regex);
  return match ? parser(match[1]) : null;
}
const regex = /\bIELTS\b(?:[^0-9]{0,20}?)([0-9](?:\.[0-9])?)/i;
console.log(firstNumber("IELTS (Academic): 7.5", regex));
console.log(firstNumber("IELTS Score: 8.0", regex));
console.log(firstNumber("IELTS - 6", regex));
console.log(firstNumber("IELTS 7", regex));
console.log(firstNumber("English: IELTS 6.5", regex));
