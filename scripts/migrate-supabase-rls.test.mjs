import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMigrationPlan } from './migrate-supabase-rls.mjs'

const table = {
  name: 'courses',
  rlsEnabled: false,
  policies: [
    { name: 'legacy_anon_read', roles: ['anon'] },
    { name: 'legacy_auth_read', roles: ['authenticated'] },
  ],
}

const policyConfig = {
  tables: {
    courses: {
      selectUsing: 'auth.uid() IS NOT NULL',
      insertCheck: 'created_by = (select auth.uid())',
      updateUsing: 'created_by = (select auth.uid())',
      updateCheck: 'created_by = (select auth.uid())',
      deleteUsing: 'created_by = (select auth.uid())',
    },
  },
  publicReadTables: {
    courses: 'is_published = true',
  },
}

test('builds a complete RLS migration, replaces existing policies, and scopes public read', () => {
  const plan = buildMigrationPlan({
    tables: [table],
    sequences: ['courses_id_seq'],
    policyConfig,
  })
  const sql = plan.statements.join('\n')

  assert.match(sql, /REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "public" FROM "anon"/)
  assert.match(sql, /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"\."courses" TO "authenticated"/)
  assert.match(sql, /ALTER TABLE "public"\."courses" ENABLE ROW LEVEL SECURITY/)
  assert.match(sql, /DROP POLICY "legacy_anon_read"/)
  assert.match(sql, /DROP POLICY "legacy_auth_read"/)
  assert.match(sql, /CREATE POLICY "eyogi_authenticated_update".*USING \(.+\) WITH CHECK \(.+\)/)
  assert.match(sql, /GRANT SELECT ON TABLE "public"\."courses" TO PUBLIC/)
  assert.match(sql, /CREATE POLICY "eyogi_public_select".*USING \(is_published = true\)/)
  assert.equal(plan.summary.anonPoliciesDropped, 1)
  assert.equal(plan.summary.policiesDropped, 2)
  assert.equal(plan.summary.policiesCreated, 5)
})

test('does not make any table public-readable unless explicitly configured', () => {
  const plan = buildMigrationPlan({
    tables: [{ ...table, policies: [] }],
    sequences: [],
    policyConfig: { tables: policyConfig.tables },
  })

  assert.equal(plan.summary.publicReadTables.length, 0)
  assert.doesNotMatch(plan.statements.join('\n'), /TO PUBLIC/)
})

test('refuses incomplete policy coverage and SQL statement injection', () => {
  assert.throws(
    () =>
      buildMigrationPlan({
        tables: [table, { name: 'profiles', rlsEnabled: true, policies: [] }],
        sequences: [],
        policyConfig,
      }),
    /Missing policy definitions: profiles/,
  )

  const invalidConfig = structuredClone(policyConfig)
  invalidConfig.tables.courses.deleteUsing = 'true; DROP TABLE profiles'
  assert.throws(
    () =>
      buildMigrationPlan({
        tables: [table],
        sequences: [],
        policyConfig: invalidConfig,
      }),
    /disallowed SQL delimiter/,
  )
})
