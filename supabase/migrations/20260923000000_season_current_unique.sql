-- クラブごとに is_current = true のシーズンは常に高々1件にする
create unique index seasons_one_current_per_club
  on public.seasons (club_id)
  where is_current;
