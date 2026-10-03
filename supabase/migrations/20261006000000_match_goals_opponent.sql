alter table public.match_goals
  alter column scorer_id drop not null,
  add column is_opponent boolean not null default false,
  add column opponent_scorer_name text;

alter table public.match_goals
  add constraint match_goals_scorer_check check (
    (is_opponent = false and scorer_id is not null)
    or (is_opponent = true and scorer_id is null and assist_id is null)
  );
