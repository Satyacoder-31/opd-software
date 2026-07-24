-- Promote the earliest admin in each clinic to owner (one owner per clinic).
UPDATE "User" AS u
SET role = 'owner'
FROM (
  SELECT DISTINCT ON ("clinicId") id
  FROM "User"
  WHERE role = 'admin'
  ORDER BY "clinicId", "createdAt" ASC
) AS first_admin
WHERE u.id = first_admin.id;
