"use server";

import { prisma } from "@/lib/db";
import { getCitiesForState } from "@/lib/indian-cities";

/**
 * Cities learned from clinic profiles for a state, ranked by usage.
 * Extends the static Indian city catalog with towns clinics have used
 * (e.g. Kishtwar once a clinic saves it).
 */
export async function listLearnedCities(state?: string): Promise<string[]> {
  const stateFilter = state?.trim();
  if (!stateFilter) return [];

  const rows = await prisma.clinic.groupBy({
    by: ["city"],
    where: {
      AND: [
        { city: { not: null } },
        { city: { not: "" } },
        { state: { equals: stateFilter, mode: "insensitive" } },
      ],
    },
    _count: { _all: true },
  });

  const catalog = new Set(
    getCitiesForState(stateFilter).map((c) => c.toLocaleLowerCase()),
  );

  return rows
    .map((r) => ({
      city: (r.city ?? "").trim(),
      count: r._count._all,
    }))
    .filter((r) => r.city.length > 0)
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
    .map((r) => r.city)
    .filter((city) => !catalog.has(city.toLocaleLowerCase()));
}
