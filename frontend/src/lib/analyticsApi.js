import { supabase } from './supabaseClient'

// Shared database:
// Campus:   id, name
// Category: id, name
// User:     id, campusId, createdAt
// Listing:  id, title, campusId, categoryId, createdAt, status

function queryError(table, error) {
  const code = error.code ? ` [${error.code}]` : ''

  return new Error(
    `${table}${code}: ${error.message || 'Database request failed'}`,
  )
}

// Local browser midnight, matching the original dummy dashboard.
function startOfDay(daysAgo) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date
}

// Count rows without downloading individual user/listing records.
async function countRows(table, applyFilters = (query) => query) {
  let query = supabase
    .from(table)
    .select('id', {
      count: 'exact',
      head: true,
    })

  query = applyFilters(query)

  const { count, error } = await query

  if (error) throw queryError(table, error)

  return count ?? 0
}

// Fetch only the requested columns, with pagination.
// Each table used here has an id column.
async function fetchAllRows(
  table,
  columns,
  applyFilters = (query) => query,
) {
  const pageSize = 500
  const result = []
  let offset = 0

  while (true) {
    let query = supabase
      .from(table)
      .select(columns, { count: 'exact' })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1)

    query = applyFilters(query)

    const { data, count, error } = await query

    if (error) throw queryError(table, error)

    const page = data ?? []

    if (page.length === 0) break

    result.push(...page)
    offset += page.length

    if (count !== null && offset >= count) break
  }

  return result
}

async function getCampuses() {
  const campuses = await fetchAllRows(
    'Campus',
    'id, name',
  )

  return campuses.sort((a, b) => a.name.localeCompare(b.name))
}

async function getCategories() {
  const categories = await fetchAllRows(
    'Category',
    'id, name',
  )

  return categories.sort((a, b) => a.name.localeCompare(b.name))
}

// ---------------------------------------------------------------------------
// Chart 1: registered users per campus
// Keep the old function name so AnalyticsDashboard.jsx does not need rewriting.
// ---------------------------------------------------------------------------

export async function getStudentsPerCampus() {
  const campuses = await getCampuses()

  const counts = await Promise.all(
    campuses.map((campus) =>
      countRows('User', (query) =>
        query.eq('campusId', campus.id),
      ),
    ),
  )

  return campuses
    .map((campus, index) => ({
      campus: campus.name,
      students: counts[index],
    }))
    .sort((a, b) => b.students - a.students)
}

// ---------------------------------------------------------------------------
// Chart 2: listings per campus
// Includes all listing statuses, matching the original dashboard's scope.
// ---------------------------------------------------------------------------

export async function getListingsPerCampus() {
  const campuses = await getCampuses()

  const counts = await Promise.all(
    campuses.map((campus) =>
      countRows('Listing', (query) =>
        query.eq('campusId', campus.id),
      ),
    ),
  )

  return campuses
    .map((campus, index) => ({
      campus: campus.name,
      listings: counts[index],
    }))
    .sort((a, b) => b.listings - a.listings)
}

// ---------------------------------------------------------------------------
// Chart 3: rolling seven days compared with the previous seven days
// ---------------------------------------------------------------------------

export async function getListingsLast14Days() {
  const start = startOfDay(13).toISOString()

  const listings = await fetchAllRows(
    'Listing',
    'id, createdAt',
    (query) => query.gte('createdAt', start),
  )

  const countByDay = {}

  for (const listing of listings) {
    const date = new Date(listing.createdAt)

    if (Number.isNaN(date.getTime())) continue

    const dayKey = date.toDateString()
    countByDay[dayKey] = (countByDay[dayKey] || 0) + 1
  }

  const result = []

  for (let i = 6; i >= 0; i--) {
    const thisWeekDay = startOfDay(i)
    const lastWeekDay = startOfDay(i + 7)

    result.push({
      day: thisWeekDay.toLocaleDateString('en-US', {
        weekday: 'short',
      }),
      thisWeek: countByDay[thisWeekDay.toDateString()] || 0,
      lastWeek: countByDay[lastWeekDay.toDateString()] || 0,
    })
  }

  return result
}

// ---------------------------------------------------------------------------
// Chart 4: listings by category
// Reads the real category names instead of using the dummy category list.
// ---------------------------------------------------------------------------

export async function getListingsByCategory() {
  const categories = await getCategories()

  const counts = await Promise.all(
    categories.map((category) =>
      countRows('Listing', (query) =>
        query.eq('categoryId', category.id),
      ),
    ),
  )

  return categories.map((category, index) => ({
    category: category.name,
    listings: counts[index],
  }))
}

// ---------------------------------------------------------------------------
// Summary cards
// ---------------------------------------------------------------------------

export async function getSummaryStats() {
  const weekStart = startOfDay(6).toISOString()

  const [totalListings, registeredStudents, newThisWeek] =
    await Promise.all([
      countRows('Listing'),
      countRows('User'),
      countRows('Listing', (query) =>
        query.gte('createdAt', weekStart),
      ),
    ])

  return {
    totalListings,
    registeredStudents,
    newThisWeek,
  }
}

// ---------------------------------------------------------------------------
// Map: convert the shared schema into the shape ListingDensityMap already uses.
// Do not fetch user names, emails, or seller locations.
// ---------------------------------------------------------------------------

export async function getMapListings() {
  const [listings, campuses, categories] = await Promise.all([
    fetchAllRows(
      'Listing',
      'id, title, campusId, categoryId, createdAt, status',
    ),
    getCampuses(),
    getCategories(),
  ])

  const campusNames = new Map(
    campuses.map((campus) => [campus.id, campus.name]),
  )

  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  )

  return listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    campus: campusNames.get(listing.campusId) ?? '',
    category:
      categoryNames.get(listing.categoryId) ?? 'Unknown category',
    created_at: listing.createdAt,
    status: listing.status,
  }))
}