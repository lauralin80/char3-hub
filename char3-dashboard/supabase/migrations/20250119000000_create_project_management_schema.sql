-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects table
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  client_name text not null,
  project_type text,
  status text default 'not_started' check (status in ('not_started', 'in_progress', 'on_hold', 'done')),
  start_date date,
  end_date date,
  percent_complete decimal(5,2) default 0,
  on_track_status text check (on_track_status in ('on_track', 'off_track', 'at_risk')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Schedule items table (hierarchical structure)
create table public.schedule_items (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  parent_id uuid references public.schedule_items(id) on delete cascade,
  name text not null,
  item_type text default 'item' check (item_type in ('group', 'item', 'milestone', 'task')),
  start_date date,
  end_date date,
  duration_days integer,
  percent_complete decimal(5,2) default 0,
  status text check (status in ('archived', 'in_review', 'pending', 'complete')),
  responsible_person text,
  depends_on uuid references public.schedule_items(id),
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Links between schedule items and Trello tasks
create table public.schedule_task_links (
  id uuid default uuid_generate_v4() primary key,
  schedule_item_id uuid references public.schedule_items(id) on delete cascade not null,
  trello_card_id text not null,
  trello_board_id text not null,
  trello_board_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_schedule_items_project_id on public.schedule_items(project_id);
create index idx_schedule_items_parent_id on public.schedule_items(parent_id);
create index idx_schedule_task_links_schedule_item_id on public.schedule_task_links(schedule_item_id);
create index idx_schedule_task_links_trello_card_id on public.schedule_task_links(trello_card_id);

-- Function to auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers to auto-update updated_at
create trigger projects_updated_at
  before update on public.projects
  for each row
  execute function public.handle_updated_at();

create trigger schedule_items_updated_at
  before update on public.schedule_items
  for each row
  execute function public.handle_updated_at();

-- Function to calculate project progress based on schedule items
create or replace function public.calculate_project_progress(project_uuid uuid)
returns decimal as $$
declare
  total_progress decimal;
begin
  select avg(percent_complete) into total_progress
  from public.schedule_items
  where project_id = project_uuid and parent_id is null;
  
  return coalesce(total_progress, 0);
end;
$$ language plpgsql;

-- Enable Row Level Security
alter table public.projects enable row level security;
alter table public.schedule_items enable row level security;
alter table public.schedule_task_links enable row level security;

-- Policies (for now, allow all authenticated users)
create policy "Enable all for authenticated users" on public.projects
  for all using (true);

create policy "Enable all for authenticated users" on public.schedule_items
  for all using (true);

create policy "Enable all for authenticated users" on public.schedule_task_links
  for all using (true);

