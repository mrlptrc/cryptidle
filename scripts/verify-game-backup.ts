// Read-only source; invoke after tests stop writing. Restores the real game schema and rows.
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import assert from 'node:assert/strict';
const connection = new URL(process.env.DATABASE_URL || 'postgresql://cryptidle@127.0.0.1:55432/cryptidle_test');
const source = decodeURIComponent(connection.pathname.slice(1));
assert.match(source, /^[a-zA-Z0-9_]+_test$/, 'Only an isolated _test source database is allowed');
const restored = `game_restore_${randomUUID().replaceAll('-', '')}`;
const directory = mkdtempSync(join(tmpdir(), 'cryptidle-game-backup-'));
const container = process.env.PG_CONTAINER;
if (container) assert.match(container, /^[a-f0-9]{12,64}$/, 'PG_CONTAINER must be a Docker container ID');
const dump = container ? `/tmp/${restored}.dump` : join(directory, 'game.dump');
const environment = { ...process.env, PGHOST: connection.hostname, PGPORT: connection.port || '5432', PGUSER: decodeURIComponent(connection.username), PGPASSWORD: decodeURIComponent(connection.password), PGCLIENTENCODING: 'UTF8' };
function pg(tool: string, args: string[]): string {
  const executable = process.env.PG_BIN ? join(process.env.PG_BIN, tool + (process.platform === 'win32' ? '.exe' : '')) : tool;
  const command = container ? 'docker' : executable;
  const parameters = container ? ['exec', '-e', 'PGHOST', '-e', 'PGPORT', '-e', 'PGUSER', '-e', 'PGPASSWORD', '-e', 'PGCLIENTENCODING', container, tool, '--no-password', ...args] : ['--no-password', ...args];
  const result = spawnSync(command, parameters, { encoding: 'utf8', env: environment, maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${tool} failed: ${result.stderr || result.error?.message}`);
  return result.stdout.replace(/\r\n/g, '\n').trim();
}
function sql(database: string, query: string) { return pg('psql', ['-d', database, '-At', '-v', 'ON_ERROR_STOP=1', '-c', query]); }
const tableQuery = "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename";
const constraintQuery = "SELECT c.relname, p.conname, p.contype, pg_get_constraintdef(p.oid) FROM pg_constraint p JOIN pg_class c ON c.oid=p.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' ORDER BY c.relname,p.conname";
let created = false;
try {
  const tables = sql(source, tableQuery).split(/\r?\n/).filter(Boolean);
  assert.ok(tables.length >= 8, 'Expected migrated game database with game tables');
  const fingerprints = new Map<string, string>();
  for (const table of tables) {
    assert.match(table, /^[A-Za-z0-9_]+$/);
    fingerprints.set(table, sql(source, `SELECT count(*),md5(COALESCE(string_agg(row_to_json(t)::text,E'\\n' ORDER BY row_to_json(t)::text),'')) FROM "${table}" t`));
  }
  const constraints = sql(source, constraintQuery);
  pg('pg_dump', ['-d', source, '-Fc', '-f', dump]);
  pg('createdb', [restored]); created = true;
  pg('pg_restore', ['--exit-on-error', '--no-owner', '-d', restored, dump]);
  assert.equal(sql(restored, tableQuery), tables.join('\n'));
  assert.equal(sql(restored, constraintQuery), constraints, 'Game constraints differ');
  for (const [table, expected] of fingerprints) {
    const query = `SELECT count(*),md5(COALESCE(string_agg(row_to_json(t)::text,E'\\n' ORDER BY row_to_json(t)::text),'')) FROM "${table}" t`;
    assert.equal(sql(source, query), expected, `Source changed during verification (${table}); stop writers and repeat`);
    assert.equal(sql(restored, query), expected, `Restored rows differ in ${table}`);
    console.log(`PASS ${table}: ${expected.split('|')[0]} rows, all-column checksum preserved`);
  }
  console.log(`PASS real game backup: ${tables.length} tables, all row checksums and constraints restored.`);
} finally {
  if (created) pg('dropdb', [restored]);
  if (container) spawnSync('docker', ['exec', container, 'rm', '-f', dump]);
  assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
  assert.ok(basename(directory).startsWith('cryptidle-game-backup-'));
  rmSync(directory, { recursive: true, force: true });
}
