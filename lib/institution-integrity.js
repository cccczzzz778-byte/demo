const INSTITUTION_INTEGRITY_SQL=`
CREATE OR REPLACE FUNCTION dmed_sync_staff_institution_fields()
RETURNS trigger AS $$
BEGIN
  IF NEW.district IS DISTINCT FROM OLD.district
     OR NEW.name IS DISTINCT FROM OLD.name
     OR NEW.type IS DISTINCT FROM OLD.type THEN
    UPDATE staff
       SET district=NEW.district,
           institution=NEW.name,
           type=NEW.type,
           updated_at=NOW()
     WHERE institution_id=NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dmed_sync_staff_institution_fields ON institutions;
CREATE TRIGGER trg_dmed_sync_staff_institution_fields
AFTER UPDATE OF district,name,type ON institutions
FOR EACH ROW
EXECUTE FUNCTION dmed_sync_staff_institution_fields();

CREATE OR REPLACE FUNCTION dmed_block_institution_delete_with_staff()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM staff WHERE institution_id=OLD.id) THEN
    RAISE EXCEPTION 'institution_has_staff' USING ERRCODE='23503';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dmed_block_institution_delete_with_staff ON institutions;
CREATE TRIGGER trg_dmed_block_institution_delete_with_staff
BEFORE DELETE ON institutions
FOR EACH ROW
EXECUTE FUNCTION dmed_block_institution_delete_with_staff();
`;

module.exports={INSTITUTION_INTEGRITY_SQL};
