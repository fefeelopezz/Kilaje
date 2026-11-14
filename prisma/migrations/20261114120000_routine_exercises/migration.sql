-- Los ejercicios pasan a ser de la rutina; los bloques los eligen.
-- Conserva los datos: cada ejercicio viejo de un bloque se convierte en un ejercicio de su rutina
-- (los que tenían el mismo nombre en la misma rutina se juntan en uno) y sus series lo siguen.

-- Todo en una transacción: si algo falla, la base queda como estaba.
BEGIN;

CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- old_id: ejercicio viejo del bloque; new_id: el primero con ese nombre en la rutina, que se queda.
CREATE TEMP TABLE ex_map ON COMMIT DROP AS
SELECT be."id" AS old_id,
       d."routineId",
       b."dayId",
       first_value(be."id") OVER (PARTITION BY d."routineId", be."name" ORDER BY be."createdAt", be."id") AS new_id
FROM "BlockExercise" be
JOIN "Block" b ON b."id" = be."blockId"
JOIN "Day" d ON d."id" = b."dayId";

INSERT INTO "Exercise" ("id", "routineId", "name", "sets", "reps", "createdAt")
SELECT be."id", m."routineId", be."name", be."sets", be."reps", be."createdAt"
FROM "BlockExercise" be JOIN ex_map m ON m.old_id = be."id"
WHERE m.old_id = m.new_id;

-- Series: guardan el día y si fueron de aproximación; pasan a apuntar al ejercicio de la rutina.
ALTER TABLE "SetLog" ADD COLUMN "dayId" TEXT, ADD COLUMN "warmup" BOOLEAN NOT NULL DEFAULT false;
UPDATE "SetLog" s SET "dayId" = m."dayId" FROM ex_map m WHERE m.old_id = s."exerciseId";

ALTER TABLE "SetLog" DROP CONSTRAINT "SetLog_exerciseId_fkey";
-- Si dos ejercicios con el mismo nombre tienen la misma serie el mismo día, queda la del que se conserva.
DELETE FROM "SetLog" s USING ex_map m, "SetLog" k
WHERE m.old_id = s."exerciseId" AND m.old_id <> m.new_id
  AND k."exerciseId" = m.new_id AND k."date" = s."date" AND k."setNumber" = s."setNumber";
UPDATE "SetLog" s SET "exerciseId" = m.new_id FROM ex_map m
WHERE m.old_id = s."exerciseId" AND m.old_id <> m.new_id;

-- BlockExercise queda como la elección de un ejercicio para un bloque.
ALTER TABLE "BlockExercise" ADD COLUMN "exerciseId" TEXT;
UPDATE "BlockExercise" be SET "exerciseId" = m.new_id FROM ex_map m WHERE m.old_id = be."id";
DELETE FROM "BlockExercise" a USING "BlockExercise" b
WHERE a."blockId" = b."blockId" AND a."exerciseId" = b."exerciseId" AND a."id" > b."id";
ALTER TABLE "BlockExercise" ALTER COLUMN "exerciseId" SET NOT NULL,
    DROP COLUMN "name", DROP COLUMN "sets", DROP COLUMN "reps";

CREATE UNIQUE INDEX "Exercise_routineId_name_key" ON "Exercise"("routineId", "name");
CREATE UNIQUE INDEX "BlockExercise_blockId_exerciseId_key" ON "BlockExercise"("blockId", "exerciseId");
CREATE INDEX "BlockExercise_exerciseId_idx" ON "BlockExercise"("exerciseId");
CREATE INDEX "SetLog_dayId_idx" ON "SetLog"("dayId");

ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlockExercise" ADD CONSTRAINT "BlockExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SetLog" ADD CONSTRAINT "SetLog_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SetLog" ADD CONSTRAINT "SetLog_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;
