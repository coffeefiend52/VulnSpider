// Compiles ../../schema/api.schema.json (produced by `make schema` in
// server/) into src/types.generated.ts. Run via `npm run gen:types`.

import { compile } from 'json-schema-to-typescript';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '..', '..', 'schema', 'api.schema.json');
const outPath = path.join(__dirname, '..', 'src', 'types.generated.ts');

const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

const ts = await compile(schema, 'ApiSchema', {
  bannerComment: '',
  style: { singleQuote: true },
});

// The root wrapper interface (named after the second compile() argument) is
// just scaffolding to give every response shape in schema/api.schema.json a
// reachable path from a single root — it isn't a real API type, so it's
// dropped here rather than exported.
const body = ts.replace(/export interface ApiSchema \{[\s\S]*?\n\}\n/, '');

const banner =
  '// AUTO-GENERATED — do not edit by hand.\n' +
  '// Run `npm run gen:types` (after `make schema` in server/) to regenerate.\n\n';

writeFileSync(outPath, banner + body.trim() + '\n');
console.log(`Wrote ${outPath}`);
