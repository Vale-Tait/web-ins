alter table public.canvases
  add column if not exists viewport jsonb not null default '{"pan":{"x":220,"y":120},"zoom":0.5,"size":{"width":1200,"height":800}}'::jsonb;

alter table public.canvas_nodes
  add column if not exists source_folder_id uuid references public.folders(id) on delete set null,
  add column if not exists scale numeric,
  add column if not exists status text check (status is null or status in ('live', 'loading', 'screenshot')),
  add column if not exists interaction_mode text check (interaction_mode is null or interaction_mode in ('canvas', 'preview')),
  add column if not exists iframe_key integer not null default 0,
  add column if not exists load_failed boolean not null default false,
  add column if not exists z_index integer not null default 1;

create unique index if not exists folders_one_default_per_user
  on public.folders(user_id)
  where is_default;

create index if not exists folders_user_id_idx on public.folders(user_id);
create index if not exists links_user_id_created_at_idx on public.links(user_id, created_at desc);
create index if not exists canvases_user_id_updated_at_idx on public.canvases(user_id, updated_at desc);
create index if not exists canvas_nodes_canvas_id_z_index_idx on public.canvas_nodes(canvas_id, z_index);
create index if not exists link_folders_folder_id_idx on public.link_folders(folder_id);
create index if not exists link_tags_tag_id_idx on public.link_tags(tag_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.folders,
  public.links,
  public.link_folders,
  public.tags,
  public.link_tags,
  public.analysis_results,
  public.canvases,
  public.canvas_nodes
to authenticated;

drop policy if exists "canvas nodes through owned canvas" on public.canvas_nodes;
create policy "canvas nodes through owned canvas" on public.canvas_nodes
  for all using (
    exists (
      select 1
      from public.canvases
      where canvases.id = canvas_nodes.canvas_id
        and canvases.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.canvases
      where canvases.id = canvas_nodes.canvas_id
        and canvases.user_id = auth.uid()
    )
    and (
      canvas_nodes.link_id is null
      or exists (
        select 1
        from public.links
        where links.id = canvas_nodes.link_id
          and links.user_id = auth.uid()
      )
    )
    and (
      canvas_nodes.source_folder_id is null
      or exists (
        select 1
        from public.folders
        where folders.id = canvas_nodes.source_folder_id
          and folders.user_id = auth.uid()
      )
    )
  );
