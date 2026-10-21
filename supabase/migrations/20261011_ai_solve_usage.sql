-- ============================================================
-- ai-solve 全局日限额计数器
-- 配套 Edge Function：supabase/functions/ai-solve/index.ts
-- 目的：AI 讲题走服务端代理后，即便函数 URL 泄露，
--       单日调用量也被钉死，损失可控（而不是像裸 key 那样被无限盗刷）。
--
-- 执行方式（任选其一）：
--   1) Supabase 后台 → SQL Editor → 粘贴执行
--   2) supabase db push（本地 CLI 已 link 到项目时）
-- ============================================================

-- 1) 计数表：按「北京时间」的日期一行
create table if not exists public.ai_solve_usage (
  day text primary key,
  cnt integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.ai_solve_usage enable row level security;

-- 只允许 service_role 读写：上面开了 RLS 但**故意不建任何 policy**，
-- 默认全部拒绝；service_role 绕过 RLS 正常工作，前端（anon key）既读不到也改不了。
-- 若日后要开放只读统计，再单独加一条 select policy。

-- 2026-10-21 补充（应对 Supabase 2026-10-30 变更）：
--   自该日起，public 模式新建表须经 Data API（PostgREST/GraphQL/supabase-js）访问前显式 GRANT，
--   否则返回 "permission denied"。本表只由 service_role 经 security definer 的 ai_solve_tick 落库，
--   故仅授予 service_role；anon/authenticated 经 RLS 默认全拒，不需直接表授权。
grant select, insert, update, delete
  on public.ai_solve_usage
  to service_role;

-- 2) 原子自增 + 超限判断
--    返回：当日累计次数；超过 p_limit 返回 -1（调用方据此降级，不再花钱请求模型）
create or replace function public.ai_solve_tick(p_limit integer default 200)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day text := to_char(now() at time zone 'Asia/Shanghai', 'YYYY-MM-DD');
  v_cnt integer;
begin
  insert into public.ai_solve_usage (day, cnt, updated_at)
  values (v_day, 1, now())
  on conflict (day) do update
    set cnt = public.ai_solve_usage.cnt + 1,
        updated_at = now()
  returning cnt into v_cnt;

  if v_cnt > p_limit then
    return -1;
  end if;

  return v_cnt;
end;
$$;

-- 2026-10-21 补充（应对 Supabase 2026-10-30 变更）：
--   允许经 PostgREST 调用本 RPC。函数 security definer，会以定义者权限落到 ai_solve_usage，
--   调用方无需直接表授权。service_role 供 Edge Function 使用；anon/authenticated 留作备用。
grant execute
  on function public.ai_solve_tick(integer)
  to anon, authenticated, service_role;

-- 3) 清理：保留最近 90 天（可选，手动执行即可）
-- delete from public.ai_solve_usage where day < to_char((now() - interval '90 days') at time zone 'Asia/Shanghai', 'YYYY-MM-DD');
