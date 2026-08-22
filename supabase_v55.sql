-- ============================================================
-- v55：家长端远程登录「最近练习」（含考试）云端支持
-- 在 Supabase 控制台 -> SQL Editor 中执行本文件（可重复执行，幂等）
-- ============================================================

-- 1) study_records 补 module 列（'数学'/'语文'；旧行为 null，前端按数学兜底）
alter table study_records add column if not exists module text;

-- 2) 新 RPC：先校验口令，再返回最近 N 条练习记录（含逐题错题明细 wrong_json）
--    与 get_child_stats 同款安全模式：security definer 绕过 RLS + 口令校验
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

-- 3) 授权（对齐 anon + authenticated 双授，家庭自用）
grant execute on function get_child_recent(text, text, int) to anon, authenticated;
