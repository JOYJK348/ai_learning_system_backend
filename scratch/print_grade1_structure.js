const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../frontend/src/app/[locale]/student/Quiz/grade1QuizData.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Find all exports and print the first level structure of each
const regex = /export const (\w+): Level\[] = ([\s\S]+?\}\s*,\s*\{)/g;
let m;
while ((m = regex.exec(content)) !== null) {
  console.log('--- ' + m[1] + ' ---');
  console.log(m[2].substring(0, 1000) + '\n');
}
