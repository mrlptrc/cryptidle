-- Current editable content uses region-index identifiers. Slots at each index:
-- weapon 0/4, head 1/6, chest 2/7, accessory 3/5. Add a migration when changing
-- this mapping. This index protects against two equipped pieces in one slot.
CREATE UNIQUE INDEX "Item_one_equipped_per_slot" ON "Item" (
  "ownerId",
  (CASE split_part("definitionId", '-', 2)
    WHEN '0' THEN 'weapon' WHEN '4' THEN 'weapon'
    WHEN '1' THEN 'head' WHEN '6' THEN 'head'
    WHEN '2' THEN 'chest' WHEN '7' THEN 'chest'
    WHEN '3' THEN 'accessory' WHEN '5' THEN 'accessory'
    ELSE "definitionId"
  END)
) WHERE "equipped";
