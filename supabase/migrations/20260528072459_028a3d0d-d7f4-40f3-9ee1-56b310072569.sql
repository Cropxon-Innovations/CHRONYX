
-- ============================================================
-- TASK MANAGEMENT (Jira-style) — projects, members, shares,
-- pages/docs, tasks (epic/story/task/bug/subtask), comments,
-- board columns. All tables prefixed with tm_ to avoid clashes.
-- ============================================================

-- Enums
CREATE TYPE public.tm_member_role AS ENUM ('owner','admin','editor','reviewer','viewer');
CREATE TYPE public.tm_task_type   AS ENUM ('epic','story','task','bug','subtask');
CREATE TYPE public.tm_task_status AS ENUM ('backlog','todo','in_progress','in_review','done','cancelled');
CREATE TYPE public.tm_priority    AS ENUM ('low','medium','high','urgent');
CREATE TYPE public.tm_page_type   AS ENUM ('doc','architecture','wiki','spec');

-- =========================
-- PROJECTS
-- =========================
CREATE TABLE public.tm_projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL,
  name         TEXT NOT NULL,
  project_key  TEXT NOT NULL,                -- e.g. "PROJ"
  description  TEXT,
  icon         TEXT DEFAULT 'folder-kanban',
  color        TEXT DEFAULT '#3b82f6',
  archived     BOOLEAN NOT NULL DEFAULT false,
  task_counter INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tm_projects_owner ON public.tm_projects(owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tm_projects TO authenticated;
GRANT ALL ON public.tm_projects TO service_role;
ALTER TABLE public.tm_projects ENABLE ROW LEVEL SECURITY;

-- =========================
-- MEMBERS (sharing roles)
-- =========================
CREATE TABLE public.tm_project_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.tm_projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  role        public.tm_member_role NOT NULL DEFAULT 'viewer',
  invited_by  UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
CREATE INDEX idx_tm_members_user ON public.tm_project_members(user_id);
CREATE INDEX idx_tm_members_project ON public.tm_project_members(project_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tm_project_members TO authenticated;
GRANT ALL ON public.tm_project_members TO service_role;
ALTER TABLE public.tm_project_members ENABLE ROW LEVEL SECURITY;

-- =========================
-- SHARE LINKS
-- =========================
CREATE TABLE public.tm_project_share_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.tm_projects(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  role        public.tm_member_role NOT NULL DEFAULT 'viewer',
  created_by  UUID NOT NULL,
  expires_at  TIMESTAMPTZ,
  uses_count  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tm_share_links_project ON public.tm_project_share_links(project_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tm_project_share_links TO authenticated;
GRANT ALL ON public.tm_project_share_links TO service_role;
ALTER TABLE public.tm_project_share_links ENABLE ROW LEVEL SECURITY;

-- =========================
-- BOARD COLUMNS
-- =========================
CREATE TABLE public.tm_board_columns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.tm_projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  status_key  public.tm_task_status NOT NULL,
  position    INT NOT NULL DEFAULT 0,
  color       TEXT DEFAULT '#6b7280',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tm_columns_project ON public.tm_board_columns(project_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tm_board_columns TO authenticated;
GRANT ALL ON public.tm_board_columns TO service_role;
ALTER TABLE public.tm_board_columns ENABLE ROW LEVEL SECURITY;

-- =========================
-- PAGES (docs, architecture)
-- =========================
CREATE TABLE public.tm_pages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.tm_projects(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES public.tm_pages(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Untitled',
  content     TEXT,
  page_type   public.tm_page_type NOT NULL DEFAULT 'doc',
  diagram_data JSONB,                       -- for architecture diagrams
  created_by  UUID NOT NULL,
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tm_pages_project ON public.tm_pages(project_id);
CREATE INDEX idx_tm_pages_parent ON public.tm_pages(parent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tm_pages TO authenticated;
GRANT ALL ON public.tm_pages TO service_role;
ALTER TABLE public.tm_pages ENABLE ROW LEVEL SECURITY;

-- =========================
-- TASKS
-- =========================
CREATE TABLE public.tm_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.tm_projects(id) ON DELETE CASCADE,
  task_number     INT NOT NULL,                         -- per-project
  title           TEXT NOT NULL,
  description     TEXT,
  task_type       public.tm_task_type NOT NULL DEFAULT 'task',
  status          public.tm_task_status NOT NULL DEFAULT 'backlog',
  priority        public.tm_priority NOT NULL DEFAULT 'medium',
  story_points    INT,
  assignee_id     UUID,
  reporter_id     UUID NOT NULL,
  parent_task_id  UUID REFERENCES public.tm_tasks(id) ON DELETE SET NULL,
  due_date        DATE,
  start_date      DATE,
  time_estimate_hours NUMERIC(8,2),
  time_spent_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  labels          TEXT[] DEFAULT '{}',
  board_position  INT NOT NULL DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, task_number)
);
CREATE INDEX idx_tm_tasks_project ON public.tm_tasks(project_id);
CREATE INDEX idx_tm_tasks_assignee ON public.tm_tasks(assignee_id);
CREATE INDEX idx_tm_tasks_status ON public.tm_tasks(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tm_tasks TO authenticated;
GRANT ALL ON public.tm_tasks TO service_role;
ALTER TABLE public.tm_tasks ENABLE ROW LEVEL SECURITY;

-- =========================
-- TASK COMMENTS
-- =========================
CREATE TABLE public.tm_task_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES public.tm_tasks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tm_comments_task ON public.tm_task_comments(task_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tm_task_comments TO authenticated;
GRANT ALL ON public.tm_task_comments TO service_role;
ALTER TABLE public.tm_task_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECURITY-DEFINER ACCESS HELPERS (avoid RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.tm_project_role(_project_id UUID, _user_id UUID)
RETURNS public.tm_member_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.tm_projects p WHERE p.id = _project_id AND p.owner_id = _user_id)
      THEN 'owner'::public.tm_member_role
    ELSE (SELECT role FROM public.tm_project_members
          WHERE project_id = _project_id AND user_id = _user_id LIMIT 1)
  END
$$;

CREATE OR REPLACE FUNCTION public.tm_has_project_access(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.tm_project_role(_project_id, _user_id) IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.tm_can_edit_project(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.tm_project_role(_project_id, _user_id) IN ('owner','admin','editor')
$$;

CREATE OR REPLACE FUNCTION public.tm_can_admin_project(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.tm_project_role(_project_id, _user_id) IN ('owner','admin')
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- tm_projects
CREATE POLICY "tm_projects_select" ON public.tm_projects FOR SELECT TO authenticated
  USING (public.tm_has_project_access(id, auth.uid()));
CREATE POLICY "tm_projects_insert" ON public.tm_projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "tm_projects_update" ON public.tm_projects FOR UPDATE TO authenticated
  USING (public.tm_can_admin_project(id, auth.uid()));
CREATE POLICY "tm_projects_delete" ON public.tm_projects FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- tm_project_members
CREATE POLICY "tm_members_select" ON public.tm_project_members FOR SELECT TO authenticated
  USING (public.tm_has_project_access(project_id, auth.uid()) OR user_id = auth.uid());
CREATE POLICY "tm_members_insert" ON public.tm_project_members FOR INSERT TO authenticated
  WITH CHECK (public.tm_can_admin_project(project_id, auth.uid()));
CREATE POLICY "tm_members_update" ON public.tm_project_members FOR UPDATE TO authenticated
  USING (public.tm_can_admin_project(project_id, auth.uid()));
CREATE POLICY "tm_members_delete" ON public.tm_project_members FOR DELETE TO authenticated
  USING (public.tm_can_admin_project(project_id, auth.uid()) OR user_id = auth.uid());

-- tm_project_share_links — readable by anyone signed in (token-gated via app);
-- create/manage by project admin
CREATE POLICY "tm_share_select" ON public.tm_project_share_links FOR SELECT TO authenticated
  USING (is_active = true);
CREATE POLICY "tm_share_insert" ON public.tm_project_share_links FOR INSERT TO authenticated
  WITH CHECK (public.tm_can_admin_project(project_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "tm_share_update" ON public.tm_project_share_links FOR UPDATE TO authenticated
  USING (public.tm_can_admin_project(project_id, auth.uid()));
CREATE POLICY "tm_share_delete" ON public.tm_project_share_links FOR DELETE TO authenticated
  USING (public.tm_can_admin_project(project_id, auth.uid()));

-- tm_board_columns
CREATE POLICY "tm_cols_select" ON public.tm_board_columns FOR SELECT TO authenticated
  USING (public.tm_has_project_access(project_id, auth.uid()));
CREATE POLICY "tm_cols_insert" ON public.tm_board_columns FOR INSERT TO authenticated
  WITH CHECK (public.tm_can_edit_project(project_id, auth.uid()));
CREATE POLICY "tm_cols_update" ON public.tm_board_columns FOR UPDATE TO authenticated
  USING (public.tm_can_edit_project(project_id, auth.uid()));
CREATE POLICY "tm_cols_delete" ON public.tm_board_columns FOR DELETE TO authenticated
  USING (public.tm_can_admin_project(project_id, auth.uid()));

-- tm_pages
CREATE POLICY "tm_pages_select" ON public.tm_pages FOR SELECT TO authenticated
  USING (public.tm_has_project_access(project_id, auth.uid()));
CREATE POLICY "tm_pages_insert" ON public.tm_pages FOR INSERT TO authenticated
  WITH CHECK (public.tm_can_edit_project(project_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "tm_pages_update" ON public.tm_pages FOR UPDATE TO authenticated
  USING (public.tm_can_edit_project(project_id, auth.uid()));
CREATE POLICY "tm_pages_delete" ON public.tm_pages FOR DELETE TO authenticated
  USING (public.tm_can_edit_project(project_id, auth.uid()));

-- tm_tasks
CREATE POLICY "tm_tasks_select" ON public.tm_tasks FOR SELECT TO authenticated
  USING (public.tm_has_project_access(project_id, auth.uid()));
CREATE POLICY "tm_tasks_insert" ON public.tm_tasks FOR INSERT TO authenticated
  WITH CHECK (public.tm_can_edit_project(project_id, auth.uid()) AND reporter_id = auth.uid());
CREATE POLICY "tm_tasks_update" ON public.tm_tasks FOR UPDATE TO authenticated
  USING (
    public.tm_can_edit_project(project_id, auth.uid())
    OR (public.tm_project_role(project_id, auth.uid()) = 'reviewer'
        AND assignee_id = auth.uid())
  );
CREATE POLICY "tm_tasks_delete" ON public.tm_tasks FOR DELETE TO authenticated
  USING (public.tm_can_edit_project(project_id, auth.uid()));

-- tm_task_comments — reviewers can comment too
CREATE POLICY "tm_comments_select" ON public.tm_task_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tm_tasks t
                 WHERE t.id = task_id
                   AND public.tm_has_project_access(t.project_id, auth.uid())));
CREATE POLICY "tm_comments_insert" ON public.tm_task_comments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.tm_tasks t
                WHERE t.id = task_id
                  AND public.tm_project_role(t.project_id, auth.uid())
                      IN ('owner','admin','editor','reviewer'))
  );
CREATE POLICY "tm_comments_update" ON public.tm_task_comments FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "tm_comments_delete" ON public.tm_task_comments FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.tm_tasks t
               WHERE t.id = task_id
                 AND public.tm_can_admin_project(t.project_id, auth.uid()))
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

-- updated_at triggers
CREATE TRIGGER trg_tm_projects_updated BEFORE UPDATE ON public.tm_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tm_pages_updated BEFORE UPDATE ON public.tm_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tm_tasks_updated BEFORE UPDATE ON public.tm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tm_comments_updated BEFORE UPDATE ON public.tm_task_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-assign per-project task_number
CREATE OR REPLACE FUNCTION public.tm_assign_task_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.task_number IS NULL OR NEW.task_number = 0 THEN
    UPDATE public.tm_projects
       SET task_counter = task_counter + 1
     WHERE id = NEW.project_id
     RETURNING task_counter INTO NEW.task_number;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_tm_tasks_number BEFORE INSERT ON public.tm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.tm_assign_task_number();

-- Mark completed_at when status -> done
CREATE OR REPLACE FUNCTION public.tm_handle_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') THEN
    NEW.completed_at = now();
  ELSIF NEW.status <> 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_tm_tasks_status BEFORE UPDATE ON public.tm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.tm_handle_status_change();

-- When a project is created, seed default board columns + owner as member
CREATE OR REPLACE FUNCTION public.tm_seed_project_defaults()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.tm_project_members (project_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.tm_board_columns (project_id, name, status_key, position, color) VALUES
    (NEW.id, 'Backlog',     'backlog',     0, '#94a3b8'),
    (NEW.id, 'To Do',       'todo',        1, '#6366f1'),
    (NEW.id, 'In Progress', 'in_progress', 2, '#f59e0b'),
    (NEW.id, 'In Review',   'in_review',   3, '#a855f7'),
    (NEW.id, 'Done',        'done',        4, '#10b981');
  RETURN NEW;
END $$;
CREATE TRIGGER trg_tm_projects_seed AFTER INSERT ON public.tm_projects
  FOR EACH ROW EXECUTE FUNCTION public.tm_seed_project_defaults();

-- ============================================================
-- RPCs for sharing (invite by email, redeem share link)
-- ============================================================

-- Invite a user by email: looks up profiles.email; creates member row.
CREATE OR REPLACE FUNCTION public.tm_invite_member_by_email(
  _project_id UUID, _email TEXT, _role public.tm_member_role
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _caller UUID := auth.uid();
  _target UUID;
BEGIN
  IF _caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF NOT public.tm_can_admin_project(_project_id, _caller) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT id INTO _target FROM public.profiles
   WHERE lower(email) = lower(_email) LIMIT 1;

  IF _target IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_not_found');
  END IF;

  INSERT INTO public.tm_project_members (project_id, user_id, role, invited_by)
  VALUES (_project_id, _target, _role, _caller)
  ON CONFLICT (project_id, user_id)
  DO UPDATE SET role = EXCLUDED.role;

  RETURN jsonb_build_object('ok', true, 'user_id', _target);
END $$;

-- Redeem a share-link token: caller becomes member with the link's role.
CREATE OR REPLACE FUNCTION public.tm_redeem_share_link(_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _caller UUID := auth.uid();
  _link   public.tm_project_share_links%ROWTYPE;
BEGIN
  IF _caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO _link FROM public.tm_project_share_links
   WHERE token = _token AND is_active = true
   LIMIT 1;

  IF _link.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;
  IF _link.expires_at IS NOT NULL AND _link.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  INSERT INTO public.tm_project_members (project_id, user_id, role, invited_by)
  VALUES (_link.project_id, _caller, _link.role, _link.created_by)
  ON CONFLICT (project_id, user_id) DO NOTHING;

  UPDATE public.tm_project_share_links
     SET uses_count = uses_count + 1
   WHERE id = _link.id;

  RETURN jsonb_build_object('ok', true, 'project_id', _link.project_id, 'role', _link.role);
END $$;
