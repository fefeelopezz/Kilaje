export type StatLog = { exerciseId: string; date: Date; weight: number; reps: number };

const DAY = 86_400_000;

// Lunes (UTC) de la semana de la fecha dada. Las fechas de las series se guardan a medianoche UTC.
export function weekStart(d: Date) {
  return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY);
}

export function summarize(logs: StatLog[], today: Date, weeks = 8) {
  const thisWeek = weekStart(today).getTime();
  const firstWeek = thisWeek - (weeks - 1) * 7 * DAY;

  const volume = Array.from({ length: weeks }, (_, i) => ({ start: firstWeek + i * 7 * DAY, volumen: 0 }));
  const sessionsThisWeek = new Set<number>();
  const sessionsThisMonth = new Set<number>();
  let setsThisWeek = 0;
  let volumeThisWeek = 0;
  // Mejor peso de cada ejercicio, la primera fecha en que se logró y el mejor anterior a esa fecha.
  const best = new Map<string, { weight: number; date: number; before: number }>();

  for (const log of [...logs].sort((a, b) => a.date.getTime() - b.date.getTime())) {
    const t = log.date.getTime();
    const v = log.weight * log.reps;
    const w = Math.floor((t - firstWeek) / (7 * DAY));
    if (w >= 0 && w < weeks) volume[w].volumen += v;
    if (t >= thisWeek) {
      sessionsThisWeek.add(t);
      setsThisWeek++;
      volumeThisWeek += v;
    }
    if (log.date.getUTCFullYear() === today.getUTCFullYear() && log.date.getUTCMonth() === today.getUTCMonth())
      sessionsThisMonth.add(t);

    const b = best.get(log.exerciseId);
    if (!b) best.set(log.exerciseId, { weight: log.weight, date: t, before: 0 });
    else if (log.weight > b.weight) best.set(log.exerciseId, { weight: log.weight, date: t, before: b.weight });
  }

  // Récord reciente: superó su mejor marca anterior en los últimos 14 días (el primer registro no cuenta).
  const recentRecords = [...best]
    .filter(([, b]) => b.before > 0 && b.date >= today.getTime() - 14 * DAY)
    .map(([exerciseId, b]) => ({ exerciseId, weight: b.weight, previous: b.before, date: new Date(b.date) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    sessionsThisWeek: sessionsThisWeek.size,
    sessionsThisMonth: sessionsThisMonth.size,
    setsThisWeek,
    volumeThisWeek: Math.round(volumeThisWeek),
    weeklyVolume: volume.map((v) => ({ start: new Date(v.start), volumen: Math.round(v.volumen) })),
    best,
    recentRecords,
  };
}
