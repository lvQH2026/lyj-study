-- ============================================================
-- 拍图批改功能所需的存储桶与权限（v67）
-- 在 Supabase 控制台 SQL Editor 里整段执行即可，可重复执行。
-- ============================================================

-- 1. 建公开桶 papers（存试卷原图与批改后的图）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('papers', 'papers', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- 2. 允许匿名/登录用户上传（前端用 anon key 直传）
drop policy if exists "papers_anon_insert" on storage.objects;
create policy "papers_anon_insert"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'papers');

-- 3. 允许公开读取（图床用途，批改图要能直接 <img> 显示和下载）
drop policy if exists "papers_public_select" on storage.objects;
create policy "papers_public_select"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'papers');

-- 4. 允许上传者删除自己传的图（可选，方便清理）
drop policy if exists "papers_owner_delete" on storage.objects;
create policy "papers_owner_delete"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'papers');
