BEGIN;

-- Publishable-key requests without a user session use role anon; signed-in
-- requests use authenticated. Secret-key requests bypass RLS.

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
SET row_security = off
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = (SELECT auth.uid())
      AND profile.role::text IN ('admin', 'business_admin', 'super_admin')
  );
$function$;

ALTER FUNCTION public.is_app_admin() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_app_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET row_security = off
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.is_app_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT'
     AND NEW.role::text IN ('admin', 'business_admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only an application admin may assign an admin role';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Only an application admin may change a profile role';
  END IF;

  RETURN NEW;
END;
$function$;

ALTER FUNCTION public.prevent_profile_role_escalation() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.prevent_profile_role_escalation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_role_escalation
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_role_escalation();

ALTER POLICY profiles_admin_all
ON public.profiles
USING (public.is_app_admin())
WITH CHECK (public.is_app_admin());

ALTER POLICY profiles_authenticated_insert
ON public.profiles
WITH CHECK (
  id = (SELECT auth.uid())
  AND role::text NOT IN ('admin', 'business_admin', 'super_admin')
);

DO $migration$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT schemaname, tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND 'public' = ANY (roles)
      AND NOT (
        (tablename, policyname, cmd) IN (
          ('about_page_cms', 'About Page CMS read access', 'SELECT'),
          ('contact_page_cms', 'Public can view contact page CMS', 'SELECT'),
          ('courses', 'Anyone can read active courses', 'SELECT'),
          ('media_files', 'Public media files are viewable by everyone', 'SELECT'),
          ('page_settings', 'Anyone can view public page settings', 'SELECT'),
          ('social_media_links', 'Enable read access for all users', 'SELECT')
        )
        OR (tablename = 'page_analytics' AND cmd = 'INSERT')
      )
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON %I.%I TO authenticated',
      existing_policy.policyname,
      existing_policy.schemaname,
      existing_policy.tablename
    );
  END LOOP;
END;
$migration$;

ALTER POLICY "About Page CMS read access"
ON public.about_page_cms
TO anon, authenticated;

ALTER POLICY "Public can view contact page CMS"
ON public.contact_page_cms
TO anon, authenticated;

ALTER POLICY "Anyone can read active courses"
ON public.courses
TO anon, authenticated;

ALTER POLICY "Public media files are viewable by everyone"
ON public.media_files
TO anon, authenticated;

ALTER POLICY "Anyone can view public page settings"
ON public.page_settings
TO anon, authenticated;

ALTER POLICY "Enable read access for all users"
ON public.social_media_links
TO anon, authenticated;

DO $migration$
DECLARE
  analytics_policy record;
BEGIN
  FOR analytics_policy IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'page_analytics'
      AND cmd = 'INSERT'
      AND 'public' = ANY (roles)
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON %I.%I TO anon, authenticated',
      analytics_policy.policyname,
      analytics_policy.schemaname,
      analytics_policy.tablename
    );
  END LOOP;
END;
$migration$;

ALTER POLICY "About Page CMS insert access"
ON public.about_page_cms
TO authenticated
WITH CHECK (public.is_app_admin());

ALTER POLICY "About Page CMS update access"
ON public.about_page_cms
TO authenticated
USING (public.is_app_admin())
WITH CHECK (public.is_app_admin());

ALTER POLICY "Authenticated users can insert contact page CMS"
ON public.contact_page_cms
TO authenticated
WITH CHECK (public.is_app_admin());

ALTER POLICY "Authenticated users can update contact page CMS"
ON public.contact_page_cms
TO authenticated
USING (public.is_app_admin())
WITH CHECK (public.is_app_admin());

ALTER POLICY "Enable write access for authenticated admins"
ON public.social_media_links
TO authenticated
WITH CHECK (public.is_app_admin());

ALTER POLICY "Enable update for authenticated admins"
ON public.social_media_links
TO authenticated
USING (public.is_app_admin())
WITH CHECK (public.is_app_admin());

ALTER POLICY "Enable delete for authenticated admins"
ON public.social_media_links
TO authenticated
USING (public.is_app_admin());

ALTER POLICY "Service role can insert audit records"
ON public.audit_trail
TO authenticated
WITH CHECK (
  changed_by_id = (SELECT auth.uid())
  OR public.is_app_admin()
);

ALTER POLICY deletion_audit_logs_insert_system
ON public.deletion_audit_logs
TO authenticated
WITH CHECK (public.is_app_admin());

DO $migration$
DECLARE
  public_table record;
  public_sequence record;
BEGIN
  FOR public_table IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class AS c
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
      public_table.schema_name,
      public_table.table_name
    );
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON TABLE %I.%I FROM anon',
      public_table.schema_name,
      public_table.table_name
    );
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I.%I TO authenticated',
      public_table.schema_name,
      public_table.table_name
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS eyogi_admin_manage_all ON %I.%I',
      public_table.schema_name,
      public_table.table_name
    );
    EXECUTE format(
      'CREATE POLICY eyogi_admin_manage_all ON %I.%I FOR ALL TO authenticated USING (public.is_app_admin()) WITH CHECK (public.is_app_admin())',
      public_table.schema_name,
      public_table.table_name
    );
  END LOOP;

  EXECUTE 'GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated';

  FOR public_sequence IN
    SELECT sequence_namespace.nspname AS schema_name,
           sequence_relation.relname AS sequence_name
    FROM pg_class AS sequence_relation
    JOIN pg_namespace AS sequence_namespace
      ON sequence_namespace.oid = sequence_relation.relnamespace
    WHERE sequence_namespace.nspname = 'public'
      AND sequence_relation.relkind = 'S'
  LOOP
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON SEQUENCE %I.%I FROM anon',
      public_sequence.schema_name,
      public_sequence.sequence_name
    );
  END LOOP;
END;
$migration$;

GRANT SELECT ON TABLE
  public.about_page_cms,
  public.contact_page_cms,
  public.courses,
  public.media_files,
  public.page_settings,
  public.social_media_links
TO anon;

GRANT INSERT ON TABLE public.page_analytics, public.quiz_answers TO anon;

DO $migration$
DECLARE
  public_sequence record;
BEGIN
  FOR public_sequence IN
    SELECT sequence_namespace.nspname AS schema_name,
           sequence_relation.relname AS sequence_name
    FROM pg_class AS sequence_relation
    JOIN pg_namespace AS sequence_namespace
      ON sequence_namespace.oid = sequence_relation.relnamespace
    JOIN pg_depend AS dependency
      ON dependency.classid = 'pg_class'::regclass
     AND dependency.objid = sequence_relation.oid
     AND dependency.deptype IN ('a', 'i')
    JOIN pg_class AS table_relation
      ON table_relation.oid = dependency.refobjid
    JOIN pg_namespace AS table_namespace
      ON table_namespace.oid = table_relation.relnamespace
    WHERE sequence_namespace.nspname = 'public'
      AND table_namespace.nspname = 'public'
      AND sequence_relation.relkind = 'S'
      AND table_relation.relname IN ('page_analytics', 'quiz_answers')
  LOOP
    EXECUTE format(
      'GRANT USAGE ON SEQUENCE %I.%I TO anon',
      public_sequence.schema_name,
      public_sequence.sequence_name
    );
  END LOOP;
END;
$migration$;

COMMIT;
