-- Porthen automatic signup provisioning

-- 1. Create a profile, personal workspace, and owner membership
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_workspace_id UUID;
BEGIN
    -- Create the user's profile
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'full_name'
    );

    -- Create a personal workspace
    INSERT INTO public.workspaces (name, slug, created_by)
    VALUES (
        'My Workspace',
        'workspace-' || NEW.id::TEXT,
        NEW.id
    )
    RETURNING id INTO new_workspace_id;

    -- Make the new user the workspace owner
    INSERT INTO public.workspace_members (
        workspace_id,
        user_id,
        role
    )
    VALUES (
        new_workspace_id,
        NEW.id,
        'owner'
    );

    RETURN NEW;
END;
$$;

-- 2. Run provisioning automatically after signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. Restrict direct execution of the trigger function
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;