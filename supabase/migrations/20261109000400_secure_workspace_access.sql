-- Record the verified workspace access model and tighten API-role table privileges.
-- This migration does not change public.handle_new_user(), the signup trigger,
-- service_role grants, or existing lead assignments.

-- 1. Membership helper used by the workspace policies.
CREATE OR REPLACE FUNCTION public.is_workspace_member(target_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.workspace_members wm
        WHERE wm.workspace_id = target_workspace_id
          AND wm.user_id = (SELECT auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION public.is_workspace_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_workspace_member(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated;

-- 2. Remove anonymous lead access recorded by the baseline migration.
DROP POLICY IF EXISTS "Allow public read leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert leads" ON public.leads;

-- 3. Workspace policies for authenticated members.
DROP POLICY IF EXISTS "Workspace members can read leads" ON public.leads;
CREATE POLICY "Workspace members can read leads"
ON public.leads
FOR SELECT
TO authenticated
USING ((SELECT public.is_workspace_member(leads.workspace_id) AS is_workspace_member));

DROP POLICY IF EXISTS "Workspace members can insert leads" ON public.leads;
CREATE POLICY "Workspace members can insert leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_workspace_member(leads.workspace_id) AS is_workspace_member));

DROP POLICY IF EXISTS "Workspace members can update leads" ON public.leads;
CREATE POLICY "Workspace members can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING ((SELECT public.is_workspace_member(leads.workspace_id) AS is_workspace_member))
WITH CHECK ((SELECT public.is_workspace_member(leads.workspace_id) AS is_workspace_member));

DROP POLICY IF EXISTS "Workspace members can delete leads" ON public.leads;
CREATE POLICY "Workspace members can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING ((SELECT public.is_workspace_member(leads.workspace_id) AS is_workspace_member));

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ((id = (SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((id = (SELECT auth.uid() AS uid)))
WITH CHECK ((id = (SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Workspace members can read workspaces" ON public.workspaces;
CREATE POLICY "Workspace members can read workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING ((SELECT public.is_workspace_member(workspaces.id) AS is_workspace_member));

DROP POLICY IF EXISTS "Workspace members can read memberships" ON public.workspace_members;
CREATE POLICY "Workspace members can read memberships"
ON public.workspace_members
FOR SELECT
TO authenticated
USING ((SELECT public.is_workspace_member(workspace_members.workspace_id) AS is_workspace_member));

-- 4. Require a workspace on every lead. Refuse to continue if any row is unassigned.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.leads
        WHERE workspace_id IS NULL
    ) THEN
        RAISE EXCEPTION 'leads.workspace_id cannot be set NOT NULL while unassigned leads exist';
    END IF;
END $$;

ALTER TABLE public.leads
    ALTER COLUMN workspace_id SET NOT NULL;

-- 5. Replace broad API-role table privileges with the minimum grants.
REVOKE ALL ON TABLE public.leads FROM anon, authenticated;
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.workspaces FROM anon, authenticated;
REVOKE ALL ON TABLE public.workspace_members FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.leads TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.workspaces TO authenticated;
GRANT SELECT ON TABLE public.workspace_members TO authenticated;
