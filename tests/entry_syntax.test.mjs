import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('the extension entry parses as a browser ES module', () => {
  const source = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
  const result = spawnSync(process.execPath, ['--input-type=module', '--check'], {
    input: source,
    encoding: 'utf8',
  });

  assert.equal(
    result.status,
    0,
    `index.js must parse as an ES module:\n${result.stderr || result.stdout}`,
  );
});
