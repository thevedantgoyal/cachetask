-- Create a trigger function to notify when a task is assigned
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  assignee_user_id UUID;
  assigner_name TEXT;
  task_title TEXT;
BEGIN
  -- Only trigger if assigned_to is set and changed
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    -- Get the assignee's user_id
    SELECT user_id INTO assignee_user_id FROM public.profiles WHERE id = NEW.assigned_to;
    
    -- Get the assigner's name
    IF NEW.assigned_by IS NOT NULL THEN
      SELECT full_name INTO assigner_name FROM public.profiles WHERE id = NEW.assigned_by;
    END IF;
    
    -- Create notification
    IF assignee_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        assignee_user_id,
        'task_assigned',
        'New Task Assigned',
        'You have been assigned a new task: "' || NEW.title || '"' || 
          CASE WHEN assigner_name IS NOT NULL THEN ' by ' || assigner_name ELSE '' END,
        jsonb_build_object('task_id', NEW.id, 'task_title', NEW.title)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for task assignments
DROP TRIGGER IF EXISTS on_task_assigned ON public.tasks;
CREATE TRIGGER on_task_assigned
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assigned();

-- Create a trigger function to notify when a user is assigned to a team
CREATE OR REPLACE FUNCTION public.notify_team_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  member_user_id UUID;
  team_name TEXT;
BEGIN
  -- Only trigger if team_id is set and changed
  IF NEW.team_id IS NOT NULL AND (OLD.team_id IS NULL OR OLD.team_id != NEW.team_id) THEN
    -- Get the user_id of the profile
    member_user_id := NEW.user_id;
    
    -- Get the team name
    SELECT name INTO team_name FROM public.teams WHERE id = NEW.team_id;
    
    -- Create notification
    IF member_user_id IS NOT NULL AND team_name IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        member_user_id,
        'team_assigned',
        'Added to Team',
        'You have been added to the team: "' || team_name || '"',
        jsonb_build_object('team_id', NEW.team_id, 'team_name', team_name)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for team assignments
DROP TRIGGER IF EXISTS on_team_assigned ON public.profiles;
CREATE TRIGGER on_team_assigned
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_team_assigned();