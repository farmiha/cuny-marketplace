import { getListings, apiFetch } from './apiClient'

const DAY = 24 * 60 * 60 * 1000

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export async function getAnalytics() {
  const [listingsRaw, campuses, studentRows] = await Promise.all([
    getListings(),
    apiFetch('/campuses').catch(() => []),
    // Optional endpoint. Returns null until the backend has it.
    apiFetch('/analytics/students').catch(() => null),
  ])

  const listings = (listingsRaw ?? [])
    .filter((listing) => (listing.status ?? 'active') === 'active')
    .map((listing) => ({
      ...listing,
      created: new Date(listing.createdAt),
      campusName:
        listing.campus?.name ??
        (campuses ?? []).find((c) => c.id === listing.campusId)?.name ??
        'Unknown',
      categoryName: listing.category?.name ?? listing.category ?? 'Other',
    }))

  const now = Date.now()

  const perCampus = new Map((campuses ?? []).map((c) => [c.name, 0]))
  listings.forEach((l) => {
    perCampus.set(l.campusName, (perCampus.get(l.campusName) ?? 0) + 1)
  })
  const listingsPerCampus = [...perCampus.entries()].map(
    ([campus, count]) => ({ campus, listings: count }),
  )

  const perCategory = new Map()
  listings.forEach((l) => {
    perCategory.set(l.categoryName, (perCategory.get(l.categoryName) ?? 0) + 1)
  })
  const byCategory = [...perCategory.entries()]
    .map(([category, count]) => ({ category, listings: count }))
    .sort((a, b) => b.listings - a.listings)

  const today = startOfDay(now)
  const last14Days = Array.from({ length: 7 }, (_, i) => {
    const day = today - (6 - i) * DAY
    const lastWeekDay = day - 7 * DAY
    return {
      day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
      thisWeek: listings.filter((l) => startOfDay(l.created) === day).length,
      lastWeek: listings.filter((l) => startOfDay(l.created) === lastWeekDay).length,
    }
  })

  const studentsPerCampus = Array.isArray(studentRows) ? studentRows : []

  const summary = {
    totalListings: listings.length,
    registeredStudents: Array.isArray(studentRows)
      ? studentRows.reduce((sum, row) => sum + Number(row.students || 0), 0)
      : null,
    newThisWeek: listings.filter((l) => now - l.created.getTime() <= 7 * DAY).length,
  }

  return { summary, studentsPerCampus, listingsPerCampus, last14Days, byCategory }
}