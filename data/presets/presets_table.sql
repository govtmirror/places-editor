CREATE TABLE IF NOT EXISTS public.tag_list
(
  pathname text NOT NULL,
  name text NOT NULL,
  geometry text[] NOT NULL,
  tags json,
  addtags json,
  removetags json,
  fields text[],
  icon text,
  maki text,
  terms text[],
  searchable boolean,
  matchscore numeric,
  fcat text,
  displayed boolean
);
