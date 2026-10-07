-- Deferred so item/listing updates can occur in either order inside one transaction,
-- while commit can never expose an orphan listing or incorrect seller ownership.
CREATE FUNCTION check_listing_ownership() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_id text;
  current_item "Item"%ROWTYPE;
  active_listing "MarketListing"%ROWTYPE;
BEGIN
  IF TG_TABLE_NAME = 'Item' THEN
    target_id := COALESCE(NEW."id", OLD."id");
  ELSE
    target_id := COALESCE(NEW."itemId", OLD."itemId");
  END IF;
  SELECT * INTO current_item FROM "Item" WHERE "id" = target_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO active_listing FROM "MarketListing" WHERE "itemId" = target_id;
  IF FOUND THEN
    IF NOT current_item."listed" OR current_item."equipped" OR current_item."ownerId" <> active_listing."sellerId" THEN
      RAISE EXCEPTION 'Listing ownership invariant violated' USING ERRCODE = '23514';
    END IF;
  ELSIF current_item."listed" THEN
    RAISE EXCEPTION 'Listed item must have an active listing' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER "Item_listing_integrity"
AFTER INSERT OR UPDATE OR DELETE ON "Item" DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION check_listing_ownership();
CREATE CONSTRAINT TRIGGER "MarketListing_ownership_integrity"
AFTER INSERT OR UPDATE OR DELETE ON "MarketListing" DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION check_listing_ownership();
