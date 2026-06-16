create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  theme text not null default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  domain text not null,
  title text not null,
  description text not null default '',
  screenshot_url text not null default '',
  note text not null default '',
  status text not null default 'ready',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.link_folders (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (link_id, folder_id)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.link_tags (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (link_id, tag_id)
);

create table if not exists public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null unique references public.links(id) on delete cascade,
  fonts jsonb not null default '[]'::jsonb,
  animations jsonb not null default '[]'::jsonb,
  tech_stack jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.canvases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.canvas_nodes (
  id uuid primary key default gen_random_uuid(),
  canvas_id uuid not null references public.canvases(id) on delete cascade,
  type text not null check (type in ('website', 'note')),
  link_id uuid references public.links(id) on delete set null,
  content text not null default '',
  x numeric not null default 0,
  y numeric not null default 0,
  width numeric not null default 320,
  height numeric not null default 200,
  device_view text not null default 'desktop',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.links enable row level security;
alter table public.link_folders enable row level security;
alter table public.tags enable row level security;
alter table public.link_tags enable row level security;
alter table public.analysis_results enable row level security;
alter table public.canvases enable row level security;
alter table public.canvas_nodes enable row level security;

create policy "profiles own rows" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "folders own rows" on public.folders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "links own rows" on public.links
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "tags own rows" on public.tags
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "canvases own rows" on public.canvases
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "link folders through owned link" on public.link_folders
  for all using (
    exists (select 1 from public.links where links.id = link_folders.link_id and links.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.links where links.id = link_folders.link_id and links.user_id = auth.uid())
  );

create policy "link tags through owned link" on public.link_tags
  for all using (
    exists (select 1 from public.links where links.id = link_tags.link_id and links.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.links where links.id = link_tags.link_id and links.user_id = auth.uid())
  );

create policy "analysis through owned link" on public.analysis_results
  for all using (
    exists (select 1 from public.links where links.id = analysis_results.link_id and links.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.links where links.id = analysis_results.link_id and links.user_id = auth.uid())
  );

create policy "canvas nodes through owned canvas" on public.canvas_nodes
  for all using (
    exists (select 1 from public.canvases where canvases.id = canvas_nodes.canvas_id and canvases.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.canvases where canvases.id = canvas_nodes.canvas_id and canvases.user_id = auth.uid())
  );
