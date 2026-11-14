import assert from "node:assert/strict";
import { test } from "node:test";
import { summarize, weekStart } from "./stats.ts";

const d = (s: string) => new Date(`${s}T00:00:00Z`);

test("weekStart devuelve el lunes", () => {
  assert.equal(weekStart(d("2026-11-13")).toISOString().slice(0, 10), "2026-11-09"); // viernes
  assert.equal(weekStart(d("2026-11-15")).toISOString().slice(0, 10), "2026-11-09"); // domingo
  assert.equal(weekStart(d("2026-11-09")).toISOString().slice(0, 10), "2026-11-09"); // lunes
});

test("summarize cuenta la semana, el volumen y los récords", () => {
  const logs = [
    { exerciseId: "banca", date: d("2026-10-20"), weight: 70, reps: 8 },
    { exerciseId: "banca", date: d("2026-11-06"), weight: 77.5, reps: 8 },
    { exerciseId: "banca", date: d("2026-11-10"), weight: 80, reps: 8 },
    { exerciseId: "banca", date: d("2026-11-10"), weight: 80, reps: 6 },
    { exerciseId: "remo", date: d("2026-11-12"), weight: 60, reps: 10 },
  ];
  const s = summarize(logs, d("2026-11-13"));
  assert.equal(s.sessionsThisWeek, 2);
  assert.equal(s.setsThisWeek, 3);
  assert.equal(s.volumeThisWeek, 80 * 8 + 80 * 6 + 60 * 10);
  assert.equal(s.sessionsThisMonth, 3);
  assert.equal(s.weeklyVolume.length, 8);
  assert.equal(s.weeklyVolume.at(-1)!.volumen, s.volumeThisWeek);
  // banca superó 77.5 el 10/11; remo solo tiene un registro, así que no cuenta como récord.
  assert.deepEqual(
    s.recentRecords.map((r) => [r.exerciseId, r.weight, r.previous]),
    [["banca", 80, 77.5]],
  );
});

test("summarize sin datos devuelve ceros", () => {
  const s = summarize([], d("2026-11-13"));
  assert.equal(s.sessionsThisWeek, 0);
  assert.equal(s.recentRecords.length, 0);
  assert.ok(s.weeklyVolume.every((w) => w.volumen === 0));
});
