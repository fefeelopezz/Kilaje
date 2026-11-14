import assert from "node:assert/strict";
import { test } from "node:test";
import { latestPerExercise, parseDate, parseSets } from "./sets.ts";

const form = (o: Record<string, string>) => (k: string) => o[k];

test("parseSets ignora series sin peso, acepta coma decimal y marca aproximación", () => {
  const sets = parseSets(
    form({ "peso-1": "40", "reps-1": "12", "aprox-1": "on", "peso-2": "", "reps-2": "8", "peso-3": "82,5", "reps-3": "6" }),
    3,
  );
  assert.deepEqual(sets, [
    { setNumber: 1, weight: 40, reps: 12, warmup: true },
    { setNumber: 3, weight: 82.5, reps: 6, warmup: false },
  ]);
});

test("parseSets rechaza valores inválidos", () => {
  assert.throws(() => parseSets(form({ "peso-1": "-5", "reps-1": "8" }), 1));
  assert.throws(() => parseSets(form({ "peso-1": "abc", "reps-1": "8" }), 1));
  assert.throws(() => parseSets(form({ "peso-1": "80", "reps-1": "0" }), 1));
});

test("parseDate valida el formato", () => {
  assert.equal(parseDate("2026-11-13").toISOString(), "2026-11-13T00:00:00.000Z");
  assert.throws(() => parseDate("13/11/2026"));
  assert.throws(() => parseDate("2026-13-40"));
});

test("latestPerExercise deja solo la última fecha de cada ejercicio", () => {
  const d = (s: string) => new Date(s);
  const logs = [
    { exerciseId: "a", date: d("2026-11-10"), n: 1 },
    { exerciseId: "a", date: d("2026-11-10"), n: 2 },
    { exerciseId: "b", date: d("2026-11-08"), n: 1 },
    { exerciseId: "a", date: d("2026-11-03"), n: 1 },
  ];
  const out = latestPerExercise(logs);
  assert.deepEqual(out.get("a")!.map((l) => l.n), [1, 2]);
  assert.equal(out.get("b")!.length, 1);
});
