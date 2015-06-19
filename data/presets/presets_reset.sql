-- When presets are updated, they need to be reset on the renderer

UPDATE nps_render_point
SET
  type = o2p_get_name(tags, ARRAY['point'], true),
  nps_type = o2p_get_name(tags, ARRAY['point'], false),
  rendered = now()
WHERE
  type != o2p_get_name(tags, ARRAY['point'], true) OR
  nps_type != o2p_get_name(tags, ARRAY['point'], false);

UPDATE nps_render_line
SET
  type = o2p_get_name(tags, ARRAY['line'], true),
  nps_type = o2p_get_name(tags, ARRAY['line'], false),
  rendered = now()
WHERE
  type != o2p_get_name(tags, ARRAY['line'], true) OR
  nps_type != o2p_get_name(tags, ARRAY['line'], false);

UPDATE nps_render_polygon
SET
  type = o2p_get_name(tags, ARRAY['area'], true),
  nps_type = o2p_get_name(tags, ARRAY['area'], false),
  rendered = now()
WHERE
  type != o2p_get_name(tags, ARRAY['area'], true) OR
  nps_type != o2p_get_name(tags, ARRAY['area'], false);

