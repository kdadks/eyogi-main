import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const SCHEMA = 'public'
const ANON_ROLE = 'anon'
const AUTHENTICATED_ROLE = 'authenticated'
const POLICY_FIELDS = [
  'selectUsing',
  'insertCheck',
  'updateUsing',
  'updateCheck',
  'deleteUsing',
]

const HELP = `Usage:
  node scripts/migrate-supabase-rls.mjs [--policy-config <file>] [--apply]

Requires DATABASE_URL to connect directly to PostgreSQL.
Without --apply, the script only analyzes the database. --apply requires a
policy JSON file with an explicit policy definition for every public table.

Policy JSON format:
{
  "tables": {
    "courses": {
      "selectUsing": "auth.uid() IS NOT NULL",
      "insertCheck": "created_by = (select auth.uid())",
      "updateUsing": "created_by = (select auth.uid())",
      "updateCheck": "created_by = (select auth.uid())",
      "deleteUsing": "created_by = (select auth.uid())"
    }
  },
  "publicReadTables": {
    "courses": "is_published = true"
  }
}

These are trusted SQL predicates, not parameterized values. Review them against
the actual schema and authorization model before running with --apply.`

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function quoteIdentifier(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`
}

function qualifiedName(name) {
  return `${quoteIdentifier(SCHEMA)}.${quoteIdentifier(name)}`
}

function validatePredicate(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty SQL predicate`)
  }
  if (value.includes('\0') || /;|--|\/\*|\*\//.test(value)) {
    throw new Error(`${label} contains a disallowed SQL delimiter or comment`)
  }
  return value.trim()
}

export function validatePolicyConfig(config, tables) {
  if (!isRecord(config) || !isRecord(config.tables)) {
    throw new Error('Policy config must contain a "tables" object')
  }

  const knownTables = new Set(tables.map((table) => table.name))
  const configuredTables = new Set(Object.keys(config.tables))
  const missingTables = [...knownTables].filter((name) => !configuredTables.has(name))
  const unknownTables = [...configuredTables].filter((name) => !knownTables.has(name))
  if (missingTables.length || unknownTables.length) {
    throw new Error(
      [
        missingTables.length ? `Missing policy definitions: ${missingTables.join(', ')}` : '',
        unknownTables.length ? `Unknown tables in policy config: ${unknownTables.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('; '),
    )
  }

  for (const tableName of knownTables) {
    const policy = config.tables[tableName]
    if (!isRecord(policy)) {
      throw new Error(`Policy definition for "${tableName}" must be an object`)
    }
    for (const field of POLICY_FIELDS) {
      validatePredicate(policy[field], `tables.${tableName}.${field}`)
    }
  }

  const publicReadTables = config.publicReadTables ?? {}
  if (!isRecord(publicReadTables)) {
    throw new Error('"publicReadTables" must map table names to SQL predicates')
  }
  for (const [tableName, predicate] of Object.entries(publicReadTables)) {
    if (!knownTables.has(tableName)) {
      throw new Error(`Public read policy refers to unknown table "${tableName}"`)
    }
    validatePredicate(predicate, `publicReadTables.${tableName}`)
  }

  return { tables: config.tables, publicReadTables }
}

export function buildMigrationPlan({ tables, sequences, policyConfig }) {
  const config = validatePolicyConfig(policyConfig, tables)
  const statements = [
    `REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${quoteIdentifier(SCHEMA)} FROM ${quoteIdentifier(ANON_ROLE)}`,
    `REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${quoteIdentifier(SCHEMA)} FROM ${quoteIdentifier(ANON_ROLE)}`,
    `REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA ${quoteIdentifier(SCHEMA)} FROM ${quoteIdentifier(ANON_ROLE)}`,
  ]

  if (tables.length) {
    statements.push(
      `LOCK TABLE ${tables.map((table) => qualifiedName(table.name)).join(', ')} IN SHARE ROW EXCLUSIVE MODE`,
    )
  }

  for (const table of tables) {
    statements.push(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ${qualifiedName(table.name)} TO ${quoteIdentifier(AUTHENTICATED_ROLE)}`,
    )
  }
  if (sequences.length) {
    statements.push(
      `GRANT USAGE ON ALL SEQUENCES IN SCHEMA ${quoteIdentifier(SCHEMA)} TO ${quoteIdentifier(AUTHENTICATED_ROLE)}`,
    )
  }

  const policiesDropped = tables.flatMap((table) =>
    (table.policies ?? []).map(
      (policy) =>
        `DROP POLICY ${quoteIdentifier(policy.name)} ON ${qualifiedName(table.name)}`,
    ),
  )
  statements.push(...policiesDropped)

  for (const table of tables) {
    if (!table.rlsEnabled) {
      statements.push(`ALTER TABLE ${qualifiedName(table.name)} ENABLE ROW LEVEL SECURITY`)
    }
  }

  let policiesCreated = 0
  for (const table of tables) {
    const name = qualifiedName(table.name)
    const policy = config.tables[table.name]
    statements.push(
      `CREATE POLICY ${quoteIdentifier('eyogi_authenticated_select')} ON ${name} FOR SELECT TO ${quoteIdentifier(AUTHENTICATED_ROLE)} USING (${policy.selectUsing.trim()})`,
      `CREATE POLICY ${quoteIdentifier('eyogi_authenticated_insert')} ON ${name} FOR INSERT TO ${quoteIdentifier(AUTHENTICATED_ROLE)} WITH CHECK (${policy.insertCheck.trim()})`,
      `CREATE POLICY ${quoteIdentifier('eyogi_authenticated_update')} ON ${name} FOR UPDATE TO ${quoteIdentifier(AUTHENTICATED_ROLE)} USING (${policy.updateUsing.trim()}) WITH CHECK (${policy.updateCheck.trim()})`,
      `CREATE POLICY ${quoteIdentifier('eyogi_authenticated_delete')} ON ${name} FOR DELETE TO ${quoteIdentifier(AUTHENTICATED_ROLE)} USING (${policy.deleteUsing.trim()})`,
    )
    policiesCreated += 4

    const publicPredicate = config.publicReadTables[table.name]
    if (publicPredicate) {
      statements.push(
        `GRANT SELECT ON TABLE ${name} TO PUBLIC`,
        `CREATE POLICY ${quoteIdentifier('eyogi_public_select')} ON ${name} FOR SELECT TO PUBLIC USING (${publicPredicate.trim()})`,
      )
      policiesCreated += 1
    }
  }

  return {
    statements,
    summary: {
      tablesAnalyzed: tables.length,
      tablesNeedingRls: tables.filter((table) => !table.rlsEnabled).map((table) => table.name),
      policiesDropped: policiesDropped.length,
      anonPoliciesDropped: tables.reduce(
        (count, table) =>
          count +
          (table.policies ?? []).filter((policy) => policy.roles.includes(ANON_ROLE)).length,
        0,
      ),
      policiesCreated,
      publicReadTables: Object.keys(config.publicReadTables),
      sequencesGrantedToAuthenticated: sequences.length,
    },
  }
}

function parseArgs(args) {
  const options = { apply: false, policyConfigPath: null, help: false }
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--apply') {
      options.apply = true
    } else if (argument === '--policy-config') {
      options.policyConfigPath = args[index + 1]
      if (!options.policyConfigPath) {
        throw new Error('--policy-config requires a file path')
      }
      index += 1
    } else if (argument === '--help' || argument === '-h') {
      options.help = true
    } else {
      throw new Error(`Unknown argument: ${argument}`)
    }
  }
  if (options.apply && !options.policyConfigPath) {
    throw new Error('--apply requires --policy-config with reviewed rules for every table')
  }
  return options
}

async function analyzeDatabase(client) {
  const server = await client.query(`
    SELECT current_database() AS database_name,
           current_user AS connected_as,
           current_setting('server_version') AS server_version,
           current_setting('server_version_num')::integer AS server_version_num
  `)
  const roles = await client.query(
    `SELECT rolname FROM pg_roles WHERE rolname::text = ANY($1::text[])`,
    [[ANON_ROLE, AUTHENTICATED_ROLE]],
  )
  const tablesResult = await client.query(
    `SELECT c.relname AS name,
            c.relkind,
            c.relrowsecurity AS rls_enabled
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1 AND c.relkind IN ('r', 'p', 'f')
      ORDER BY c.relname`,
    [SCHEMA],
  )
  const policiesResult = await client.query(
    `SELECT tablename AS table_name, policyname AS name, roles
       FROM pg_policies
      WHERE schemaname = $1
      ORDER BY tablename, policyname`,
    [SCHEMA],
  )
  const sequencesResult = await client.query(
    `SELECT c.relname AS name
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1 AND c.relkind = 'S'
      ORDER BY c.relname`,
    [SCHEMA],
  )

  const policiesByTable = new Map()
  for (const policy of policiesResult.rows) {
    const existing = policiesByTable.get(policy.table_name) ?? []
    existing.push({ name: policy.name, roles: policy.roles })
    policiesByTable.set(policy.table_name, existing)
  }
  const tables = tablesResult.rows.map((table) => ({
    name: table.name,
    relkind: table.relkind,
    rlsEnabled: table.rls_enabled,
    policies: policiesByTable.get(table.name) ?? [],
  }))

  return {
    server: server.rows[0],
    roles: new Set(roles.rows.map((row) => row.rolname)),
    tables,
    foreignTables: tables.filter((table) => table.relkind === 'f').map((table) => table.name),
    sequences: sequencesResult.rows.map((sequence) => sequence.name),
  }
}

function printAnalysis(analysis) {
  const tablesWithoutRls = analysis.tables.filter((table) => !table.rlsEnabled)
  const policiesForAnon = analysis.tables.flatMap((table) =>
    table.policies
      .filter((policy) => policy.roles.includes(ANON_ROLE))
      .map((policy) => `${table.name}.${policy.name}`),
  )
  console.log(`Connected to ${analysis.server.database_name} on PostgreSQL ${analysis.server.server_version}`)
  console.log(`Tables in public: ${analysis.tables.length}`)
  console.log(
    `Tables without RLS (${tablesWithoutRls.length}): ${tablesWithoutRls.map((table) => table.name).join(', ') || 'none'}`,
  )
  console.log(
    `Policies targeting anon (${policiesForAnon.length}): ${policiesForAnon.join(', ') || 'none'}`,
  )
  console.log(`Sequences in public: ${analysis.sequences.length}`)
  if (analysis.foreignTables.length) {
    console.log(`Foreign tables (RLS migration unsupported): ${analysis.foreignTables.join(', ')}`)
  }
}

async function run() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(HELP)
    return
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required; connection details are never printed')
  }

  const { Client } = await import('pg')
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    const analysis = await analyzeDatabase(client)
    printAnalysis(analysis)

    if (analysis.server.server_version_num < 170000) {
      throw new Error(`PostgreSQL 17 or newer is required; server reports ${analysis.server.server_version}`)
    }
    for (const role of [ANON_ROLE, AUTHENTICATED_ROLE]) {
      if (!analysis.roles.has(role)) {
        throw new Error(`Required PostgreSQL role "${role}" does not exist`)
      }
    }
    if (analysis.foreignTables.length) {
      throw new Error('Foreign tables cannot be included in this RLS migration; no changes were applied')
    }

    if (!options.policyConfigPath) {
      console.log('\nAnalysis only. No changes applied. Provide a reviewed policy file; use --apply to execute.')
      return
    }
    const policyConfig = JSON.parse(
      await readFile(resolve(options.policyConfigPath), 'utf8'),
    )
    const plan = buildMigrationPlan({
      tables: analysis.tables,
      sequences: analysis.sequences,
      policyConfig,
    })
    console.log('\nPlanned migration summary:')
    console.log(JSON.stringify(plan.summary, null, 2))
    if (!options.apply) {
      console.log('\nDry run only. No changes applied. Re-run with --apply after reviewing the predicates and plan.')
      return
    }

    await client.query('BEGIN')
    try {
      for (const statement of plan.statements) {
        await client.query(statement)
      }
      const verification = await client.query(
        `SELECT c.relname AS name, c.relkind, c.relrowsecurity AS rls_enabled
           FROM pg_class c
           JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = $1 AND c.relkind IN ('r', 'p', 'f')
          ORDER BY c.relname`,
        [SCHEMA],
      )
      const actualTableNames = new Set(verification.rows.map((table) => table.name))
      const expectedTableNames = new Set(analysis.tables.map((table) => table.name))
      if (
        actualTableNames.size !== expectedTableNames.size ||
        [...expectedTableNames].some((tableName) => !actualTableNames.has(tableName))
      ) {
        throw new Error('Public table list changed during migration; changes were rolled back')
      }
      const foreignTables = verification.rows
        .filter((table) => table.relkind === 'f')
        .map((table) => table.name)
      if (foreignTables.length) {
        throw new Error(`Foreign tables appeared during migration: ${foreignTables.join(', ')}`)
      }
      const unprotectedTables = verification.rows
        .filter((table) => !table.rls_enabled)
        .map((table) => table.name)
      if (unprotectedTables.length) {
        throw new Error(`RLS verification failed for: ${unprotectedTables.join(', ')}`)
      }
      const verifiedPolicies = await client.query(
        `SELECT tablename AS table_name, policyname AS name
           FROM pg_policies
          WHERE schemaname = $1`,
        [SCHEMA],
      )
      const actualPolicyKeys = new Set(
        verifiedPolicies.rows.map((policy) => `${policy.table_name}.${policy.name}`),
      )
      const expectedPolicyKeys = new Set()
      for (const table of analysis.tables) {
        for (const suffix of ['select', 'insert', 'update', 'delete']) {
          expectedPolicyKeys.add(`${table.name}.eyogi_authenticated_${suffix}`)
        }
        if (plan.summary.publicReadTables.includes(table.name)) {
          expectedPolicyKeys.add(`${table.name}.eyogi_public_select`)
        }
      }
      if (
        actualPolicyKeys.size !== expectedPolicyKeys.size ||
        [...expectedPolicyKeys].some((policy) => !actualPolicyKeys.has(policy))
      ) {
        throw new Error('Policy verification failed; actual policies do not match the reviewed migration plan')
      }
      await client.query('COMMIT')
      console.log('\nMigration committed and RLS verification passed.')
      console.log(JSON.stringify(plan.summary, null, 2))
      console.log(
        'Note: SELECT granted to PostgreSQL PUBLIC is inherited by Supabase anonymous requests on explicitly listed tables.',
      )
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  } finally {
    await client.end()
  }
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href) {
  run().catch((error) => {
    console.error(`Migration failed: ${error.message}`)
    process.exitCode = 1
  })
}
