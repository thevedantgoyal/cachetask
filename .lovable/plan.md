
# Phase 1: Task Management Enterprise Upgrade -- Core Foundation

This phase upgrades the existing task system with the foundational features needed before adding Kanban, workload tracking, and advanced views in later phases.

---

## What's Included in Phase 1

1. **Enhanced Task Lifecycle** -- New statuses: pending, in_progress, review, blocked, completed, approved
2. **Task Activity Logs** -- Full audit trail for every task change
3. **Task Evidence Upload** -- Employees attach files/screenshots to tasks
4. **Task Comments** -- Threaded comments on tasks
5. **Soft Delete** -- Tasks are archived, not permanently removed
6. **Reassignment Tracking** -- Log who reassigned, why, and notify
7. **Task Detail Drawer** -- Rich slide-out panel with evidence, activity, comments, reassignment history
8. **Enhanced Task Card & Employee Task Page** -- Status updates, evidence upload from employee view

---

## Database Changes (Migration)

### New Tables

**task_activity_logs**
- id, task_id (FK), action_type, performed_by (FK -> profiles), old_value (JSONB), new_value (JSONB), created_at
- action_type values: created, updated, status_changed, reassigned, evidence_uploaded, comment_added, deleted, approved
- RLS: viewable by task assignee, their manager, admin, hr

**task_evidence**
- id, task_id (FK), uploaded_by (FK -> profiles), file_url, evidence_type (screenshot, document, pr_link, other), comment (text), created_at
- RLS: insert by assignee, view by assignee + manager + admin + hr

**task_comments**
- id, task_id (FK), author_id (FK -> profiles), content (text), created_at, updated_at
- RLS: insert by authenticated, view by task assignee + manager + admin + hr, update/delete own only

### Altered Table: tasks

Add columns:
- task_type (text, default 'project_task') -- project_task or adhoc_task
- blocked_reason (text, nullable)
- is_deleted (boolean, default false)
- deleted_at (timestamptz, nullable)
- deleted_by (uuid, nullable, FK -> profiles)
- reassigned_from (uuid, nullable, FK -> profiles)
- reassignment_reason (text, nullable)
- reassignment_count (integer, default 0)
- assigned_at (timestamptz, nullable)

### RLS Policies

All new tables will have RLS enabled with policies matching the existing pattern:
- Employees see their own task's data
- Managers see their team's data via `is_manager_of()`
- Admin/HR see everything via `has_role()`
- Organization role gets read-only access

---

## Frontend Changes

### New Files

1. **src/hooks/useTaskActivityLogs.ts** -- Fetch and create activity log entries
2. **src/hooks/useTaskEvidence.ts** -- Upload evidence (using existing `evidence` storage bucket), fetch evidence per task
3. **src/hooks/useTaskComments.ts** -- CRUD for task comments
4. **src/components/tasks/TaskDetailDrawer.tsx** -- Slide-out drawer with tabs: Details, Evidence, Activity, Comments
5. **src/components/tasks/TaskEvidenceSection.tsx** -- Evidence list + upload UI
6. **src/components/tasks/TaskActivityTimeline.tsx** -- Vertical timeline of all task changes
7. **src/components/tasks/TaskCommentsSection.tsx** -- Comment thread UI
8. **src/components/tasks/TaskStatusBadge.tsx** -- Reusable status badge with colors for all 6 statuses

### Modified Files

1. **src/hooks/useTaskManagement.ts**
   - Update `useCreateTask` to log "created" activity
   - Update `useUpdateTaskStatus` to enforce lifecycle rules (blocked needs reason, completed sets completed_at, revert clears it, only managers can set "approved")
   - Update `useUpdateTask` to log field changes with old/new values
   - Replace `useDeleteTask` with soft delete (set is_deleted=true, deleted_at, deleted_by)
   - Add `useReassignTask` mutation with reassignment logging + notification
   - Filter out is_deleted tasks in `useManagedTasks`

2. **src/hooks/useTasks.ts**
   - Filter out is_deleted tasks
   - Add the new columns to the Task interface

3. **src/pages/TasksPage.tsx**
   - Add status filter pills for the new statuses (pending, in_progress, review, blocked)
   - Clicking a task card opens the TaskDetailDrawer
   - Employee can update status to in_progress, review, or mark blocked (with reason prompt)

4. **src/components/cards/TaskCard.tsx**
   - Add status badge display
   - Show reassignment indicator if reassignment_count > 0
   - Add overdue highlighting when due_date is past

5. **src/components/manager/TaskManagement.tsx**
   - Add "review" and "blocked" and "approved" status options
   - Add reassign action in the task dropdown menu
   - Clicking a task opens TaskDetailDrawer
   - Soft delete instead of hard delete
   - Show deleted tasks toggle (grayed out, with restore option)

6. **src/components/manager/EditTaskModal.tsx**
   - Add task_type selector (Project Task / Ad-hoc Task)
   - Add blocked_reason field (visible when status = blocked)
   - Add all 6 status options

7. **src/components/layout/NavigationDrawer.tsx**
   - No changes needed for Phase 1

### Notification Triggers

- Task reassigned: in-app notification + push + email to new assignee
- Task status changed to "review": notify manager
- Task approved: notify assignee
- Evidence uploaded: notify manager
- All notifications use the existing `create_notification` DB function and `send-push` / `send-email` edge functions

---

## Technical Details

### Task Lifecycle Rules (enforced in hooks)

```text
pending -> in_progress -> review -> completed -> approved
                |            |         |
                v            v         v
             blocked      pending   pending (revert)
```

- Employee can: pending -> in_progress -> review, or set blocked
- Manager can: any status transition, including -> approved
- blocked requires blocked_reason (UI enforced)
- completed auto-sets completed_at; revert clears it
- approved can only be set by manager/admin

### Activity Log Creation Pattern

Every mutation that changes a task will call an `insertActivityLog()` helper:

```text
insertActivityLog({
  task_id,
  action_type: 'status_changed',
  performed_by: profileId,
  old_value: { status: 'pending' },
  new_value: { status: 'in_progress' }
})
```

### Evidence Upload

Uses the existing `evidence` Supabase Storage bucket. Files stored at `{user_id}/{timestamp}-{random}.{ext}`, URLs saved in `task_evidence.file_url`.

---

## What's NOT in Phase 1 (Future Phases)

- Phase 2: Kanban board view (column + swim lane), project dashboard, workload heatmap
- Phase 3: Subtasks, task dependencies, tag system, advanced filters, Gantt timeline
- Phase 4: SLA tracking, analytics/reporting dashboards, CSV/PDF export
- Phase 5: Employee availability table, overdue escalation automation
