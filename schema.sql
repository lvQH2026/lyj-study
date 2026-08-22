-- ============================================================
-- 吕泳冀学习站 · Supabase 数据库 schema
-- 在 Supabase 控制台 -> SQL Editor 中执行本文件
-- ============================================================

-- 孩子档案（学习ID + 口令）
create table if not exists children (
  learning_id text primary key,
  password text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 学习记录（每次练习一条）
create table if not exists study_records (
  id bigint generated always as identity primary key,
  learning_id text not null references children(learning_id) on delete cascade,
  grade int,
  unit_name text,
  module text,                             -- 科目（'数学'/'语文'，v55 新增；旧行 null 前端按数学兜底）
  correct int,
  total int,
  accuracy int,
  wrong_json jsonb default '[]'::jsonb,   -- 本次测验的逐题错题详情（供家长端查看）
  created_at timestamptz default now()
);
create index if not exists idx_study_records_learning on study_records(learning_id, created_at);

-- 内容覆盖层（在 Supabase 改这一行 = 所有手机端实时更新单元）
create table if not exists content (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- 行级安全
alter table study_records enable row level security;
alter table content enable row level security;
alter table children enable row level security;

-- 匿名 key 权限（家庭自用，足够）
-- 注意：新版 sb_publishable_ 密钥的请求角色是 authenticated（不是 anon），
-- 策略必须 to anon, authenticated 双授，否则 insert 报 42501 RLS 拒绝（2026-08 踩坑）
create policy "insert study" on study_records for insert to anon, authenticated with check (true);
create policy "select study" on study_records for select to anon, authenticated using (true);
create policy "delete study" on study_records for delete to anon, authenticated using (true);
create policy "anon read content" on content for select to anon using (true);
create policy "anon upsert children" on children for all to anon using (true) with check (true);

-- 统计函数：先校验口令，再返回聚合数据（security definer 绕过 RLS）
create or replace function get_child_stats(p_learning_id text, p_pw text)
returns json language plpgsql security definer as $$
declare
  ok boolean;
  rec record;
  res json;
  wrong_json json;
begin
  select (password = p_pw) into ok from children where learning_id = p_learning_id;
  if not ok or not found then return null; end if;

  select count(*) as total, coalesce(round(avg(accuracy)), 0) as avg
  into rec from study_records where learning_id = p_learning_id;

  select coalesce(json_agg(x), '[]'::json) into res from (
    select unit_name as unit,
           round(avg(accuracy)) as accuracy,
           count(*) as count
    from study_records where learning_id = p_learning_id
    group by unit_name order by avg(accuracy) asc
  ) x;

  -- 最近 30 道错题详情（跨所有测验，按时间倒序）
  -- 注意：wrong_json 是 jsonb，需用 jsonb_array_elements；并把元素转 json 以便与 '[]'::json 聚合一致
  select coalesce(json_agg(w::json order by ca desc), '[]'::json) into wrong_json from (
    select sr.created_at as ca, jsonb_array_elements(sr.wrong_json) as w
    from study_records sr
    where sr.learning_id = p_learning_id and sr.wrong_json is not null
    order by sr.created_at desc
    limit 30
  ) t;

  return json_build_object(
    'total', rec.total,
    'avg', rec.avg,
    'units', coalesce(res, '[]'::json),
    'weak', coalesce((select json_agg(x) from (
        select unit_name as unit, round(avg(accuracy)) as accuracy, count(*) as count
        from study_records where learning_id = p_learning_id
        group by unit_name having avg(accuracy) < 80
        order by avg(accuracy) asc limit 5) x), '[]'::json),
    'trend', coalesce((select json_agg(t) from (
        select to_char(created_at, 'YYYY-MM-DD') as date, sum(total) as count
        from study_records where learning_id = p_learning_id
        group by 1 order by 1) t), '[]'::json),
    'wrong', coalesce(wrong_json, '[]'::json)
  );
end;
$$;

-- v55：最近 N 条练习记录（含考试、逐题错题明细），家长端远程登录「最近练习」用
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

-- 初始内容行（空覆盖层）
insert into content (id, data) values ('override', '{"units":{}}'::jsonb)
on conflict (id) do nothing;
