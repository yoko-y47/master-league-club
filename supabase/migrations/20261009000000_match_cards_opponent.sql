alter table public.match_cards
  alter column player_id drop not null,
  add column is_opponent boolean not null default false,
  add column opponent_player_name text;

alter table public.match_cards
  add constraint match_cards_player_check check (
    (is_opponent = false and player_id is not null)
    or (is_opponent = true and player_id is null)
  );
