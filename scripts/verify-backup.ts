// PostgreSQL toolchain verification independent of Docker; disposable databases only.
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import assert from 'node:assert/strict';
const suffix = randomUUID().replaceAll('-', '');
const source = `backup_source_${suffix}`;
const restored = `backup_restored_${suffix}`;
const directory = mkdtempSync(join(tmpdir(), 'cryptidle-backup-'));
const dump = join(directory, 'verify.dump');
function pg(tool: string, args: string[]): string {
  const executable = process.env.PG_BIN ? join(process.env.PG_BIN, tool + (process.platform === 'win32' ? '.exe' : '')) : tool;
  const result = spawnSync(executable, ['-w', ...args], { encoding: 'utf8', env: process.env });
  if (result.status !== 0) throw new Error(`${tool} failed: ${result.stderr || result.error?.message}`);
  return result.stdout.trim();
}
let sourceCreated = false; let restoredCreated = false;
try {
  pg('createdb', [source]); sourceCreated = true;
  pg('createdb', [restored]); restoredCreated = true;
  pg('psql', ['-d', source, '-v', 'ON_ERROR_STOP=1', '-c', "CREATE TABLE players(id integer PRIMARY KEY, name text NOT NULL, gold integer CHECK(gold>=0)); CREATE TABLE items(id uuid PRIMARY KEY, owner integer REFERENCES players(id)); INSERT INTO players VALUES (1,U&'Teste de restaura\\00e7\\00e3o',123),(2,'Second',456); INSERT INTO items VALUES ('11111111-1111-4111-8111-111111111111',1);"]);
  pg('pg_dump', ['-d', source, '-Fc', '-f', dump]);
  // pg_restore has no -w password flag; use direct spawn for this CLI.
  const executable = process.env.PG_BIN ? join(process.env.PG_BIN, 'pg_restore' + (process.platform === 'win32' ? '.exe' : '')) : 'pg_restore';
  const result = spawnSync(executable, ['--no-password', '--exit-on-error', '--no-owner', '-d', restored, dump], { encoding: 'utf8', env: process.env });
  assert.equal(result.status, 0, result.stderr);
  const query = "SELECT p.id,p.name,p.gold,COALESCE(i.id::text,'') FROM players p LEFT JOIN items i ON i.owner=p.id ORDER BY p.id";
  assert.equal(pg('psql', ['-d', restored, '-At', '-c', query]), pg('psql', ['-d', source, '-At', '-c', query]));
  const constraints = "SELECT COUNT(*) FROM pg_constraint WHERE conrelid IN ('players'::regclass,'items'::regclass)";
  assert.equal(pg('psql', ['-d', restored, '-At', '-c', constraints]), pg('psql', ['-d', source, '-At', '-c', constraints]));
  console.log('PASS pg_dump/pg_restore: rows, Unicode, gold, UUID ownership and constraints preserved in isolated databases.');
} finally {
  if (sourceCreated) pg('dropdb', [source]);
  if (restoredCreated) pg('dropdb', [restored]);
  assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
  assert.ok(basename(directory).startsWith('cryptidle-backup-'));
  rmSync(directory, { recursive: true, force: true });
}

