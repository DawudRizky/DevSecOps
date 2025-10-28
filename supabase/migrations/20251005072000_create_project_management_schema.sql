-- Create project management schema with proper table ordering
-- Tables are created in dependency order to avoid foreign key constraint issues

-- 1. First create profiles table (depends only on auth.users)
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'Member'::text CHECK (role = ANY (ARRAY['Manager'::text, 'Member'::text])),
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- 2. Create projects table (depends on profiles)
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT ''::text,
  deadline timestamp with time zone,
  status text NOT NULL DEFAULT 'Planning'::text CHECK (status = ANY (ARRAY['Planning'::text, 'In Progress'::text, 'Completed'::text, 'On Hold'::text])),
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- 3. Create project_members table (depends on projects and profiles)
CREATE TABLE public.project_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'Member'::text CHECK (role = ANY (ARRAY['Manager'::text, 'Member'::text])),
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_members_pkey PRIMARY KEY (id),
  CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- 4. Create tasks table (depends on projects and profiles)
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT ''::text,
  assigned_to uuid,
  status text NOT NULL DEFAULT 'Todo'::text CHECK (status = ANY (ARRAY['Todo'::text, 'In Progress'::text, 'Review'::text, 'Done'::text])),
  priority text NOT NULL DEFAULT 'Medium'::text CHECK (priority = ANY (ARRAY['Low'::text, 'Medium'::text, 'High'::text, 'Urgent'::text])),
  due_date timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id),
  CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- 5. Create files table (depends on projects and profiles)
CREATE TABLE public.files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT files_pkey PRIMARY KEY (id),
  CONSTRAINT files_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);

-- 6. Create messages table (depends on projects and profiles)
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- 7. Create timeline_events table (depends on projects and profiles)
CREATE TABLE public.timeline_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['project'::text, 'task'::text, 'message'::text, 'file'::text])),
  event_action text NOT NULL CHECK (event_action = ANY (ARRAY['created'::text, 'updated'::text, 'deleted'::text, 'uploaded'::text, 'completed'::text])),
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT timeline_events_pkey PRIMARY KEY (id),
  CONSTRAINT timeline_events_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT timeline_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- -- Enable Row Level Security on all tables
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- -- Create comprehensive policies for profiles table
-- -- VULNERABILITY: Allow all authenticated users to view all profiles
-- CREATE POLICY "All authenticated users can view profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- -- Create comprehensive policies for projects table
-- -- VULNERABILITY: Allow all authenticated users to view all projects (overly permissive)
-- CREATE POLICY "All authenticated users can view projects" ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = created_by);
-- CREATE POLICY "Project creators and managers can update projects" ON public.projects FOR UPDATE USING (
--   created_by = auth.uid() OR 
--   EXISTS (
--     SELECT 1 FROM public.project_members 
--     WHERE project_id = projects.id AND user_id = auth.uid() AND role = 'Manager'
--   )
-- );
-- CREATE POLICY "Project creators can delete projects" ON public.projects FOR DELETE USING (created_by = auth.uid());

-- -- Create comprehensive policies for project_members table
-- -- VULNERABILITY: Allow all authenticated users to view all project members
-- CREATE POLICY "All authenticated users can view project members" ON public.project_members FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Project creators and managers can add members" ON public.project_members FOR INSERT WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM public.projects p 
--     WHERE p.id = project_id AND (
--       p.created_by = auth.uid() OR 
--       EXISTS (
--         SELECT 1 FROM public.project_members pm 
--         WHERE pm.project_id = project_id AND pm.user_id = auth.uid() AND pm.role = 'Manager'
--       )
--     )
--   )
-- );
-- CREATE POLICY "Project creators and managers can update member roles" ON public.project_members FOR UPDATE USING (
--   EXISTS (
--     SELECT 1 FROM public.projects p 
--     WHERE p.id = project_id AND (
--       p.created_by = auth.uid() OR 
--       EXISTS (
--         SELECT 1 FROM public.project_members pm 
--         WHERE pm.project_id = project_id AND pm.user_id = auth.uid() AND pm.role = 'Manager'
--       )
--     )
--   )
-- );
-- CREATE POLICY "Project creators and managers can remove members" ON public.project_members FOR DELETE USING (
--   EXISTS (
--     SELECT 1 FROM public.projects p 
--     WHERE p.id = project_id AND (
--       p.created_by = auth.uid() OR 
--       EXISTS (
--         SELECT 1 FROM public.project_members pm 
--         WHERE pm.project_id = project_id AND pm.user_id = auth.uid() AND pm.role = 'Manager'
--       )
--     )
--   )
-- );

-- -- Create comprehensive policies for tasks table
-- -- VULNERABILITY: Allow all authenticated users to view all tasks
-- CREATE POLICY "All authenticated users can view tasks" ON public.tasks FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Project members can create tasks" ON public.tasks FOR INSERT WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM public.project_members 
--     WHERE project_id = tasks.project_id AND user_id = auth.uid()
--   ) AND created_by = auth.uid()
-- );
-- CREATE POLICY "Task creators and assignees can update tasks" ON public.tasks FOR UPDATE USING (
--   created_by = auth.uid() OR assigned_to = auth.uid() OR
--   EXISTS (
--     SELECT 1 FROM public.project_members 
--     WHERE project_id = tasks.project_id AND user_id = auth.uid() AND role = 'Manager'
--   )
-- );
-- CREATE POLICY "Task creators and managers can delete tasks" ON public.tasks FOR DELETE USING (
--   created_by = auth.uid() OR
--   EXISTS (
--     SELECT 1 FROM public.project_members 
--     WHERE project_id = tasks.project_id AND user_id = auth.uid() AND role = 'Manager'
--   )
-- );

-- -- Create comprehensive policies for files table
-- -- VULNERABILITY: Allow all authenticated users to view all files
-- CREATE POLICY "All authenticated users can view files" ON public.files FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Project members can upload files" ON public.files FOR INSERT WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM public.project_members 
--     WHERE project_id = files.project_id AND user_id = auth.uid()
--   ) AND uploaded_by = auth.uid()
-- );
-- CREATE POLICY "File uploaders and managers can delete files" ON public.files FOR DELETE USING (
--   uploaded_by = auth.uid() OR
--   EXISTS (
--     SELECT 1 FROM public.project_members 
--     WHERE project_id = files.project_id AND user_id = auth.uid() AND role = 'Manager'
--   )
-- );

-- -- Create comprehensive policies for messages table
-- -- VULNERABILITY: Allow all authenticated users to view all messages
-- CREATE POLICY "All authenticated users can view messages" ON public.messages FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Project members can send messages" ON public.messages FOR INSERT WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM public.project_members 
--     WHERE project_id = messages.project_id AND user_id = auth.uid()
--   ) AND user_id = auth.uid()
-- );
-- CREATE POLICY "Message senders and managers can delete messages" ON public.messages FOR DELETE USING (
--   user_id = auth.uid() OR
--   EXISTS (
--     SELECT 1 FROM public.project_members 
--     WHERE project_id = messages.project_id AND user_id = auth.uid() AND role = 'Manager'
--   )
-- );

-- -- Create comprehensive policies for timeline_events table
-- -- VULNERABILITY: Allow all authenticated users to view all timeline events
-- CREATE POLICY "All authenticated users can view timeline events" ON public.timeline_events FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "System can create timeline events" ON public.timeline_events FOR INSERT WITH CHECK (user_id = auth.uid());

-- -- Create function to automatically create a profile for new users
-- CREATE OR REPLACE FUNCTION public.handle_new_user() 
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, email, full_name, role)
--   VALUES (
--     NEW.id, 
--     NEW.email, 
--     COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
--     COALESCE(NEW.raw_user_meta_data->>'role', 'Member')::text
--   );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- -- Create trigger to automatically create profile on user signup
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- -- Add helper functions and views for better project queries

-- -- Create a view that includes member count for projects
-- CREATE OR REPLACE VIEW public.projects_with_member_count AS
-- SELECT 
--   p.*,
--   COALESCE(pm.member_count, 0) as member_count
-- FROM public.projects p
-- LEFT JOIN (
--   SELECT 
--     project_id,
--     COUNT(*) as member_count
--   FROM public.project_members
--   GROUP BY project_id
-- ) pm ON p.id = pm.project_id;

-- -- Create a function to get project statistics
-- CREATE OR REPLACE FUNCTION public.get_project_stats(project_uuid uuid)
-- RETURNS json AS $$
-- DECLARE
--   result json;
-- BEGIN
--   SELECT json_build_object(
--     'member_count', (SELECT COUNT(*) FROM public.project_members WHERE project_id = project_uuid),
--     'task_count', (SELECT COUNT(*) FROM public.tasks WHERE project_id = project_uuid),
--     'completed_tasks', (SELECT COUNT(*) FROM public.tasks WHERE project_id = project_uuid AND status = 'Done'),
--     'file_count', (SELECT COUNT(*) FROM public.files WHERE project_id = project_uuid),
--     'message_count', (SELECT COUNT(*) FROM public.messages WHERE project_id = project_uuid)
--   ) INTO result;
  
--   RETURN result;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- -- Grant execute permissions on the function
-- GRANT EXECUTE ON FUNCTION public.get_project_stats(uuid) TO authenticated;