-- ====================================================================
-- Migration: separate_studio_schemas
-- Date: 2026-03-28
--
-- Strategy:
--   1. Create schemas the_circle and evolv
--   2. Create the_circle.* tables via LIKE (structure only, no FKs)
--   3. Copy all data from public.* → the_circle.*
--   4. Add FK constraints to the_circle.*
--   5. Create evolv.* tables via LIKE (same structure, empty)
--   6. Add FK constraints to evolv.*
--   7. Enable RLS + policies on both schemas
--   8. Create schema-scoped trigger functions + triggers
--
-- public.* tables are NOT dropped — apps switch schema gradually.
-- activity_log, user_roles, profiles, app_role remain in public (shared).
-- ====================================================================

BEGIN;

-- ====================================================================
-- STEP 1 — Create schemas
-- ====================================================================

CREATE SCHEMA IF NOT EXISTS the_circle;
CREATE SCHEMA IF NOT EXISTS evolv;

-- ====================================================================
-- STEP 2 — Create the_circle tables (structure only, FKs added later)
--          LIKE ... INCLUDING ALL copies: column defaults, check
--          constraints, indexes, storage, comments.
--          FK constraints are intentionally NOT copied by PostgreSQL.
-- ====================================================================

CREATE TABLE the_circle.products                (LIKE public.products                INCLUDING ALL);
CREATE TABLE the_circle.pricing                 (LIKE public.pricing                 INCLUDING ALL);
CREATE TABLE the_circle.sessions                (LIKE public.sessions                INCLUDING ALL);
CREATE TABLE the_circle.coaches                 (LIKE public.coaches                 INCLUDING ALL);
CREATE TABLE the_circle.site_content            (LIKE public.site_content            INCLUDING ALL);
CREATE TABLE the_circle.admin_drinks            (LIKE public.admin_drinks            INCLUDING ALL);
CREATE TABLE the_circle.bookings                (LIKE public.bookings                INCLUDING ALL);
CREATE TABLE the_circle.waitlist                (LIKE public.waitlist                INCLUDING ALL);
CREATE TABLE the_circle.admin_journal           (LIKE public.admin_journal           INCLUDING ALL);
CREATE TABLE the_circle.client_notes            (LIKE public.client_notes            INCLUDING ALL);
CREATE TABLE the_circle.client_tags             (LIKE public.client_tags             INCLUDING ALL);
CREATE TABLE the_circle.retention_offers        (LIKE public.retention_offers        INCLUDING ALL);
CREATE TABLE the_circle.client_followups        (LIKE public.client_followups        INCLUDING ALL);
-- packs and code_creation_requests have a circular FK — created without FKs, wired after data copy
CREATE TABLE the_circle.packs                   (LIKE public.packs                   INCLUDING ALL);
CREATE TABLE the_circle.orders                  (LIKE public.orders                  INCLUDING ALL);
CREATE TABLE the_circle.session_participants    (LIKE public.session_participants    INCLUDING ALL);
CREATE TABLE the_circle.code_creation_requests  (LIKE public.code_creation_requests  INCLUDING ALL);
CREATE TABLE the_circle.pack_usage_log          (LIKE public.pack_usage_log          INCLUDING ALL);
CREATE TABLE the_circle.blackcard_usage         (LIKE public.blackcard_usage         INCLUDING ALL);

-- ====================================================================
-- STEP 3 — Copy data from public.* → the_circle.*
--          Order respects logical dependencies even without active FKs.
-- ====================================================================

INSERT INTO the_circle.products              SELECT * FROM public.products;
INSERT INTO the_circle.pricing               SELECT * FROM public.pricing;
INSERT INTO the_circle.sessions              SELECT * FROM public.sessions;
INSERT INTO the_circle.coaches               SELECT * FROM public.coaches;
INSERT INTO the_circle.site_content          SELECT * FROM public.site_content;
INSERT INTO the_circle.admin_drinks          SELECT * FROM public.admin_drinks;
INSERT INTO the_circle.bookings              SELECT * FROM public.bookings;
INSERT INTO the_circle.waitlist              SELECT * FROM public.waitlist;
INSERT INTO the_circle.admin_journal         SELECT * FROM public.admin_journal;
INSERT INTO the_circle.client_notes          SELECT * FROM public.client_notes;
INSERT INTO the_circle.client_tags           SELECT * FROM public.client_tags;
INSERT INTO the_circle.retention_offers      SELECT * FROM public.retention_offers;
INSERT INTO the_circle.client_followups      SELECT * FROM public.client_followups;
-- packs before code_creation_requests (generated_pack_id can be null)
INSERT INTO the_circle.packs                 SELECT * FROM public.packs;
INSERT INTO the_circle.orders                SELECT * FROM public.orders;
INSERT INTO the_circle.session_participants  SELECT * FROM public.session_participants;
INSERT INTO the_circle.code_creation_requests SELECT * FROM public.code_creation_requests;
INSERT INTO the_circle.pack_usage_log        SELECT * FROM public.pack_usage_log;
INSERT INTO the_circle.blackcard_usage       SELECT * FROM public.blackcard_usage;

-- ====================================================================
-- STEP 4 — FK constraints for the_circle
-- ====================================================================

ALTER TABLE the_circle.orders
  ADD CONSTRAINT orders_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES the_circle.products(id);

ALTER TABLE the_circle.session_participants
  ADD CONSTRAINT session_participants_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES the_circle.sessions(id) ON DELETE CASCADE;

-- Resolve circular packs <-> code_creation_requests:
-- 1. wire code_creation_requests → packs first
ALTER TABLE the_circle.code_creation_requests
  ADD CONSTRAINT code_creation_requests_offer_id_fkey
    FOREIGN KEY (offer_id) REFERENCES the_circle.pricing(id) ON DELETE SET NULL,
  ADD CONSTRAINT code_creation_requests_generated_pack_id_fkey
    FOREIGN KEY (generated_pack_id) REFERENCES the_circle.packs(id) ON DELETE SET NULL;
-- 2. then wire packs → code_creation_requests
ALTER TABLE the_circle.packs
  ADD CONSTRAINT packs_offer_id_fkey
    FOREIGN KEY (offer_id) REFERENCES the_circle.pricing(id) ON DELETE SET NULL,
  ADD CONSTRAINT packs_request_id_fkey
    FOREIGN KEY (request_id) REFERENCES the_circle.code_creation_requests(id) ON DELETE SET NULL;

ALTER TABLE the_circle.pack_usage_log
  ADD CONSTRAINT pack_usage_log_pack_id_fkey
    FOREIGN KEY (pack_id) REFERENCES the_circle.packs(id) ON DELETE CASCADE,
  ADD CONSTRAINT pack_usage_log_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES the_circle.sessions(id) ON DELETE SET NULL;

ALTER TABLE the_circle.blackcard_usage
  ADD CONSTRAINT blackcard_usage_blackcard_id_fkey
    FOREIGN KEY (blackcard_id) REFERENCES the_circle.packs(id) ON DELETE CASCADE;

-- ====================================================================
-- STEP 5 — Create evolv tables (same structure, empty)
-- ====================================================================

CREATE TABLE evolv.products                (LIKE public.products                INCLUDING ALL);
CREATE TABLE evolv.pricing                 (LIKE public.pricing                 INCLUDING ALL);
CREATE TABLE evolv.sessions                (LIKE public.sessions                INCLUDING ALL);
CREATE TABLE evolv.coaches                 (LIKE public.coaches                 INCLUDING ALL);
CREATE TABLE evolv.site_content            (LIKE public.site_content            INCLUDING ALL);
CREATE TABLE evolv.admin_drinks            (LIKE public.admin_drinks            INCLUDING ALL);
CREATE TABLE evolv.bookings                (LIKE public.bookings                INCLUDING ALL);
CREATE TABLE evolv.waitlist                (LIKE public.waitlist                INCLUDING ALL);
CREATE TABLE evolv.admin_journal           (LIKE public.admin_journal           INCLUDING ALL);
CREATE TABLE evolv.client_notes            (LIKE public.client_notes            INCLUDING ALL);
CREATE TABLE evolv.client_tags             (LIKE public.client_tags             INCLUDING ALL);
CREATE TABLE evolv.retention_offers        (LIKE public.retention_offers        INCLUDING ALL);
CREATE TABLE evolv.client_followups        (LIKE public.client_followups        INCLUDING ALL);
CREATE TABLE evolv.packs                   (LIKE public.packs                   INCLUDING ALL);
CREATE TABLE evolv.orders                  (LIKE public.orders                  INCLUDING ALL);
CREATE TABLE evolv.session_participants    (LIKE public.session_participants    INCLUDING ALL);
CREATE TABLE evolv.code_creation_requests  (LIKE public.code_creation_requests  INCLUDING ALL);
CREATE TABLE evolv.pack_usage_log          (LIKE public.pack_usage_log          INCLUDING ALL);
CREATE TABLE evolv.blackcard_usage         (LIKE public.blackcard_usage         INCLUDING ALL);

-- ====================================================================
-- STEP 6 — FK constraints for evolv
-- ====================================================================

ALTER TABLE evolv.orders
  ADD CONSTRAINT orders_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES evolv.products(id);

ALTER TABLE evolv.session_participants
  ADD CONSTRAINT session_participants_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES evolv.sessions(id) ON DELETE CASCADE;

ALTER TABLE evolv.code_creation_requests
  ADD CONSTRAINT code_creation_requests_offer_id_fkey
    FOREIGN KEY (offer_id) REFERENCES evolv.pricing(id) ON DELETE SET NULL,
  ADD CONSTRAINT code_creation_requests_generated_pack_id_fkey
    FOREIGN KEY (generated_pack_id) REFERENCES evolv.packs(id) ON DELETE SET NULL;

ALTER TABLE evolv.packs
  ADD CONSTRAINT packs_offer_id_fkey
    FOREIGN KEY (offer_id) REFERENCES evolv.pricing(id) ON DELETE SET NULL,
  ADD CONSTRAINT packs_request_id_fkey
    FOREIGN KEY (request_id) REFERENCES evolv.code_creation_requests(id) ON DELETE SET NULL;

ALTER TABLE evolv.pack_usage_log
  ADD CONSTRAINT pack_usage_log_pack_id_fkey
    FOREIGN KEY (pack_id) REFERENCES evolv.packs(id) ON DELETE CASCADE,
  ADD CONSTRAINT pack_usage_log_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES evolv.sessions(id) ON DELETE SET NULL;

ALTER TABLE evolv.blackcard_usage
  ADD CONSTRAINT blackcard_usage_blackcard_id_fkey
    FOREIGN KEY (blackcard_id) REFERENCES evolv.packs(id) ON DELETE CASCADE;

-- ====================================================================
-- STEP 7 — Enable RLS on the_circle tables
-- ====================================================================

ALTER TABLE the_circle.bookings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.packs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.waitlist               ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.session_participants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.admin_drinks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.coaches                ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.pricing                ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.site_content           ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.pack_usage_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.code_creation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.blackcard_usage        ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.admin_journal          ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.client_notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.client_tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.retention_offers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_circle.client_followups       ENABLE ROW LEVEL SECURITY;

-- RLS policies — the_circle

CREATE POLICY "tc_insert_bookings"     ON the_circle.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "tc_select_bookings"     ON the_circle.bookings FOR SELECT USING (true);

CREATE POLICY "tc_insert_packs"        ON the_circle.packs FOR INSERT WITH CHECK (true);
CREATE POLICY "tc_select_packs"        ON the_circle.packs FOR SELECT USING (true);

CREATE POLICY "tc_select_products"     ON the_circle.products FOR SELECT USING (true);

CREATE POLICY "tc_insert_orders"       ON the_circle.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "tc_select_orders"       ON the_circle.orders FOR SELECT USING (true);

CREATE POLICY "tc_insert_waitlist"     ON the_circle.waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "tc_select_waitlist"     ON the_circle.waitlist FOR SELECT USING (true);
CREATE POLICY "tc_update_waitlist"     ON the_circle.waitlist FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "tc_delete_waitlist"     ON the_circle.waitlist FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "tc_select_sessions"     ON the_circle.sessions FOR SELECT USING (true);

CREATE POLICY "tc_insert_participants" ON the_circle.session_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "tc_select_participants" ON the_circle.session_participants FOR SELECT USING (true);

CREATE POLICY "tc_select_drinks"       ON the_circle.admin_drinks FOR SELECT USING (true);
CREATE POLICY "tc_select_coaches"      ON the_circle.coaches FOR SELECT USING (true);
CREATE POLICY "tc_select_pricing"      ON the_circle.pricing FOR SELECT USING (true);
CREATE POLICY "tc_select_site_content" ON the_circle.site_content FOR SELECT USING (true);
CREATE POLICY "tc_select_usage_log"    ON the_circle.pack_usage_log FOR SELECT USING (true);

CREATE POLICY "tc_insert_requests"     ON the_circle.code_creation_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "tc_select_requests"     ON the_circle.code_creation_requests FOR SELECT USING (true);

CREATE POLICY "tc_all_blackcard_usage" ON the_circle.blackcard_usage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tc_all_admin_journal"   ON the_circle.admin_journal   FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "tc_admin_client_notes"  ON the_circle.client_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "tc_select_client_notes" ON the_circle.client_notes FOR SELECT USING (true);

CREATE POLICY "tc_all_client_tags"       ON the_circle.client_tags       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tc_all_retention_offers"  ON the_circle.retention_offers  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tc_all_client_followups"  ON the_circle.client_followups  FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- STEP 8 — Enable RLS on evolv tables
-- ====================================================================

ALTER TABLE evolv.bookings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.packs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.waitlist               ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.session_participants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.admin_drinks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.coaches                ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.pricing                ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.site_content           ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.pack_usage_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.code_creation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.blackcard_usage        ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.admin_journal          ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.client_notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.client_tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.retention_offers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolv.client_followups       ENABLE ROW LEVEL SECURITY;

-- RLS policies — evolv (mirror of the_circle with ev_ prefix)

CREATE POLICY "ev_insert_bookings"     ON evolv.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "ev_select_bookings"     ON evolv.bookings FOR SELECT USING (true);

CREATE POLICY "ev_insert_packs"        ON evolv.packs FOR INSERT WITH CHECK (true);
CREATE POLICY "ev_select_packs"        ON evolv.packs FOR SELECT USING (true);

CREATE POLICY "ev_select_products"     ON evolv.products FOR SELECT USING (true);

CREATE POLICY "ev_insert_orders"       ON evolv.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "ev_select_orders"       ON evolv.orders FOR SELECT USING (true);

CREATE POLICY "ev_insert_waitlist"     ON evolv.waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "ev_select_waitlist"     ON evolv.waitlist FOR SELECT USING (true);
CREATE POLICY "ev_update_waitlist"     ON evolv.waitlist FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "ev_delete_waitlist"     ON evolv.waitlist FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "ev_select_sessions"     ON evolv.sessions FOR SELECT USING (true);

CREATE POLICY "ev_insert_participants" ON evolv.session_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "ev_select_participants" ON evolv.session_participants FOR SELECT USING (true);

CREATE POLICY "ev_select_drinks"       ON evolv.admin_drinks FOR SELECT USING (true);
CREATE POLICY "ev_select_coaches"      ON evolv.coaches FOR SELECT USING (true);
CREATE POLICY "ev_select_pricing"      ON evolv.pricing FOR SELECT USING (true);
CREATE POLICY "ev_select_site_content" ON evolv.site_content FOR SELECT USING (true);
CREATE POLICY "ev_select_usage_log"    ON evolv.pack_usage_log FOR SELECT USING (true);

CREATE POLICY "ev_insert_requests"     ON evolv.code_creation_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "ev_select_requests"     ON evolv.code_creation_requests FOR SELECT USING (true);

CREATE POLICY "ev_all_blackcard_usage" ON evolv.blackcard_usage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ev_all_admin_journal"   ON evolv.admin_journal   FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "ev_admin_client_notes"  ON evolv.client_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "ev_select_client_notes" ON evolv.client_notes FOR SELECT USING (true);

CREATE POLICY "ev_all_client_tags"       ON evolv.client_tags       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ev_all_retention_offers"  ON evolv.retention_offers  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ev_all_client_followups"  ON evolv.client_followups  FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- STEP 9 — Trigger functions + triggers for the_circle
--          These are exact copies of the public.* versions but scoped
--          to the_circle.sessions / the_circle.session_participants.
-- ====================================================================

CREATE OR REPLACE FUNCTION the_circle.normalize_session_participant_equipment_type()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  is_reformer_session boolean;
BEGIN
  SELECT (
    lower(coalesce(title,'') || ' ' || coalesce(type,'')) LIKE '%reformer%'
    OR lower(coalesce(title,'') || ' ' || coalesce(type,'')) LIKE '%jumpboard%'
    OR lower(coalesce(title,'') || ' ' || coalesce(type,'')) LIKE '%springwall%'
  )
  INTO is_reformer_session
  FROM the_circle.sessions WHERE id = NEW.session_id;

  IF is_reformer_session THEN
    NEW.equipment_type := coalesce(nullif(lower(NEW.equipment_type),''), 'reformer');
    IF NEW.equipment_type NOT IN ('reformer','springwall') THEN
      RAISE EXCEPTION 'Invalid equipment_type: %', NEW.equipment_type;
    END IF;
  ELSE
    NEW.equipment_type := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION the_circle.enforce_session_equipment_capacity()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  session_capacity            integer;
  session_springwall_capacity integer;
  current_total               integer;
  current_springwall          integer;
  is_reformer_session         boolean;
BEGIN
  SELECT
    capacity,
    greatest(0, coalesce(springwall_capacity, 0)),
    (lower(coalesce(title,'') || ' ' || coalesce(type,'')) LIKE '%reformer%'
     OR lower(coalesce(title,'') || ' ' || coalesce(type,'')) LIKE '%jumpboard%'
     OR lower(coalesce(title,'') || ' ' || coalesce(type,'')) LIKE '%springwall%')
  INTO session_capacity, session_springwall_capacity, is_reformer_session
  FROM the_circle.sessions WHERE id = NEW.session_id FOR UPDATE;

  IF session_capacity IS NULL THEN RAISE EXCEPTION 'Session not found'; END IF;
  IF session_springwall_capacity > session_capacity THEN
    session_springwall_capacity := session_capacity;
  END IF;

  SELECT count(*) INTO current_total
  FROM the_circle.session_participants
  WHERE session_id = NEW.session_id AND (TG_OP = 'INSERT' OR id <> NEW.id);
  IF current_total >= session_capacity THEN RAISE EXCEPTION 'Session is full'; END IF;

  IF is_reformer_session AND NEW.equipment_type = 'springwall' THEN
    SELECT count(*) INTO current_springwall
    FROM the_circle.session_participants
    WHERE session_id = NEW.session_id AND equipment_type = 'springwall'
      AND (TG_OP = 'INSERT' OR id <> NEW.id);
    IF current_springwall >= session_springwall_capacity THEN
      RAISE EXCEPTION 'Springwall is full for this session';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sp_normalize_equipment ON the_circle.session_participants;
CREATE TRIGGER trg_sp_normalize_equipment
  BEFORE INSERT OR UPDATE ON the_circle.session_participants
  FOR EACH ROW EXECUTE FUNCTION the_circle.normalize_session_participant_equipment_type();

DROP TRIGGER IF EXISTS trg_sp_enforce_capacity ON the_circle.session_participants;
CREATE TRIGGER trg_sp_enforce_capacity
  BEFORE INSERT OR UPDATE OF session_id, equipment_type ON the_circle.session_participants
  FOR EACH ROW EXECUTE FUNCTION the_circle.enforce_session_equipment_capacity();

-- ====================================================================
-- STEP 10 — Trigger functions + triggers for evolv
-- ====================================================================

CREATE OR REPLACE FUNCTION evolv.normalize_session_participant_equipment_type()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  is_reformer_session boolean;
BEGIN
  SELECT (
    lower(coalesce(title,'') || ' ' || coalesce(type,'')) LIKE '%reformer%'
    OR lower(coalesce(title,'') || ' ' || coalesce(type,'')) LIKE '%jumpboard%'
    OR lower(coalesce(title,'') || ' ' || coalesce(type,'')) LIKE '%springwall%'
  )
  INTO is_reformer_session
  FROM evolv.sessions WHERE id = NEW.session_id;

  IF is_reformer_session THEN
    NEW.equipment_type := coalesce(nullif(lower(NEW.equipment_type),''), 'reformer');
    IF NEW.equipment_type NOT IN ('reformer','springwall') THEN
      RAISE EXCEPTION 'Invalid equipment_type: %', NEW.equipment_type;
    END IF;
  ELSE
    NEW.equipment_type := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION evolv.enforce_session_equipment_capacity()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  session_capacity            integer;
  session_springwall_capacity integer;
  current_total               integer;
  current_springwall          integer;
  is_reformer_session         boolean;
BEGIN
  SELECT
    capacity,
    greatest(0, coalesce(springwall_capacity, 0)),
    (lower(coalesce(title,'') || ' ' || coalesce(type,'')) LIKE '%reformer%'
     OR lower(coalesce(title,'') || ' ' || coalesce(type,'')) LIKE '%jumpboard%'
     OR lower(coalesce(title,'') || ' ' || coalesce(type,'')) LIKE '%springwall%')
  INTO session_capacity, session_springwall_capacity, is_reformer_session
  FROM evolv.sessions WHERE id = NEW.session_id FOR UPDATE;

  IF session_capacity IS NULL THEN RAISE EXCEPTION 'Session not found'; END IF;
  IF session_springwall_capacity > session_capacity THEN
    session_springwall_capacity := session_capacity;
  END IF;

  SELECT count(*) INTO current_total
  FROM evolv.session_participants
  WHERE session_id = NEW.session_id AND (TG_OP = 'INSERT' OR id <> NEW.id);
  IF current_total >= session_capacity THEN RAISE EXCEPTION 'Session is full'; END IF;

  IF is_reformer_session AND NEW.equipment_type = 'springwall' THEN
    SELECT count(*) INTO current_springwall
    FROM evolv.session_participants
    WHERE session_id = NEW.session_id AND equipment_type = 'springwall'
      AND (TG_OP = 'INSERT' OR id <> NEW.id);
    IF current_springwall >= session_springwall_capacity THEN
      RAISE EXCEPTION 'Springwall is full for this session';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sp_normalize_equipment ON evolv.session_participants;
CREATE TRIGGER trg_sp_normalize_equipment
  BEFORE INSERT OR UPDATE ON evolv.session_participants
  FOR EACH ROW EXECUTE FUNCTION evolv.normalize_session_participant_equipment_type();

DROP TRIGGER IF EXISTS trg_sp_enforce_capacity ON evolv.session_participants;
CREATE TRIGGER trg_sp_enforce_capacity
  BEFORE INSERT OR UPDATE OF session_id, equipment_type ON evolv.session_participants
  FOR EACH ROW EXECUTE FUNCTION evolv.enforce_session_equipment_capacity();

-- ====================================================================
-- END — public.* tables are intentionally left intact.
-- Switch app code to use supabase.schema('the_circle').from('...')
-- and supabase.schema('evolv').from('...') to complete the migration.
-- Drop public.* studio tables only after both apps are fully switched.
-- ====================================================================

COMMIT;
