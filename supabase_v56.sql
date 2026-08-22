-- ============================================================
-- v56 全量修复：最近练习云端支持 + RLS 策略修正 + 脏数据清理
-- 在 Supabase 控制台 -> SQL Editor 中执行（幂等，可重复跑）
-- ============================================================

-- 1) study_records 补 module 列（'数学'/'语文'）
alter table study_records add column if not exists module text;

-- 2) 清理探测脏行（wrong_json 为标量的行均为 2026-08-22 排障探测行；
--    真实数据的 wrong_json 一律是数组）
delete from study_records where jsonb_typeof(wrong_json) <> 'array';
delete from study_records where unit_name in
  ('probe-anon','probe-auth','__probe__','probe-repr','zz-probe1','zz-probe2');

-- 3) 重建 RLS 策略（先删后建保证幂等；anon + authenticated 双授，
--    新版 sb_publishable_ key 的请求角色是 authenticated，必须双授否则 insert 报 42501）
drop policy if exists "anon insert study" on study_records;
drop policy if exists "insert study" on study_records;
drop policy if exists "select study" on study_records;
drop policy if exists "delete study" on study_records;
create policy "insert study" on study_records for insert to anon, authenticated with check (true);
create policy "select study" on study_records for select to anon, authenticated using (true);
create policy "delete study" on study_records for delete to anon, authenticated using (true);

-- 4) 新 RPC：先校验口令，再返回最近 N 条练习记录（含逐题错题明细）
create or replace function get_child_recent(p_learning_id text, p_pw text, p_limit int default 20)
returns json language plpgsql security definer as $$
declare
  ok boolean;
begin
  select (password = p_pw) into ok from children where learning_id = p_learning_id;
  if not ok or not found then return null; end if;

  return coalesce((
    select json_agg(t)
    from (
      select grade, unit_name, module, correct, total, accuracy, created_at, wrong_json
      from study_records
      where learning_id = p_learning_id
      order by created_at desc
      limit greatest(coalesce(p_limit, 20), 1)
    ) t
  ), '[]'::json);
end;
$$;
grant execute on function get_child_recent(text, text, int) to anon, authenticated;

-- 5) 诊断输出（执行后核对）
select policyname, cmd, roles from pg_policies where tablename = 'study_records';
select count(*) as remaining_rows from study_records;
