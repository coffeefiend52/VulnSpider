// Fails if src/types.generated.ts doesn't match what schema/api.schema.json
// currently produces — i.e. someone ran `make schema` in server/ (or edited
// schemas.py) without following up with `npm run gen:types`, or hand-edited
// the generated file directly. Run via `npm run check:types`.

import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedPath = path.join(__dirname, '..', 'src', 'types.generated.ts');

const before = readFileSync(generatedPath, 'utf-8');
execFileSync('node', [path.join(__dirname, 'gen-types.mjs')], { stdio: 'inherit' });
const after = readFileSync(generatedPath, 'utf-8');

if (before !== after) {
  console.error(
    '\nsrc/types.generated.ts was stale and has been regenerated.\n' +
      'Review the diff and commit it (this ran `npm run gen:types` for you).\n',
  );
  process.exit(1);
}

console.log('src/types.generated.ts is up to date.');
