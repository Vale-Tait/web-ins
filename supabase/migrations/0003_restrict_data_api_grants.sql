revoke all on all tables in schema public from anon, authenticated;
revoke all on schema public from anon;

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

drop policy if exists "profiles own rows" on public.profiles;
create policy "profiles own rows" on public.profiles
  for all
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "folders own rows" on public.folders;
create policy "folders own rows" on public.folders
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "links own rows" on public.links;
create policy "links own rows" on public.links
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "tags own rows" on public.tags;
create policy "tags own rows" on public.tags
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "canvases own rows" on public.canvases;
create policy "canvases own rows" on public.canvases
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "link folders through owned link" on public.link_folders;
create policy "link folders through owned link" on public.link_folders
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.links
      where links.id = link_folders.link_id
        and links.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.links
      where links.id = link_folders.link_id
        and links.user_id = (select auth.uid())
    )
  );

drop policy if exists "link tags through owned link" on public.link_tags;
create policy "link tags through owned link" on public.link_tags
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.links
      where links.id = link_tags.link_id
        and links.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.links
      where links.id = link_tags.link_id
        and links.user_id = (select auth.uid())
    )
  );

drop policy if exists "analysis through owned link" on public.analysis_results;
create policy "analysis through owned link" on public.analysis_results
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.links
      where links.id = analysis_results.link_id
        and links.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.links
      where links.id = analysis_results.link_id
        and links.user_id = (select auth.uid())
    )
  );

drop policy if exists "canvas nodes through owned canvas" on public.canvas_nodes;
create policy "canvas nodes through owned canvas" on public.canvas_nodes
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.canvases
      where canvases.id = canvas_nodes.canvas_id
        and canvases.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.canvases
      where canvases.id = canvas_nodes.canvas_id
        and canvases.user_id = (select auth.uid())
    )
    and (
      canvas_nodes.link_id is null
      or exists (
        select 1
        from public.links
        where links.id = canvas_nodes.link_id
          and links.user_id = (select auth.uid())
      )
    )
    and (
      canvas_nodes.source_folder_id is null
      or exists (
        select 1
        from public.folders
        where folders.id = canvas_nodes.source_folder_id
          and folders.user_id = (select auth.uid())
      )
    )
  );
