import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const API = `${API_BASE}/api`

const TOKEN_KEY = 'swachhlens_token'

export function getToken(){
  return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
}

export function setAuthToken(token){
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    try { localStorage.setItem(TOKEN_KEY, token) } catch (e) {}
  } else {
    delete axios.defaults.headers.common['Authorization']
    try { localStorage.removeItem(TOKEN_KEY) } catch (e) {}
  }
}

// Attach any persisted token on startup
setAuthToken(getToken())

export async function login(email, password, rememberMe = false){
  const res = await axios.post(`${API}/auth/login`, { email, password, rememberMe })
  return res.data?.data
}

export async function getMe(){
  const res = await axios.get(`${API}/auth/me`)
  return res.data?.data
}

export async function patchReport(id, payload){
  const res = await axios.patch(`${API}/reports/${id}`, payload)
  return res.data?.data
}

export async function updateReportStatus(id, status, note){
  const res = await axios.post(`${API}/reports/${id}/status`, { status, note })
  return res.data?.data
}

export async function addComment(id, text, author){
  const res = await axios.post(`${API}/reports/${id}/comments`, { text, author })
  return res.data?.data
}

export async function fetchReports(params = {}){
  const res = await axios.get(`${API}/reports`, { params })
  return {
    items: res.data?.data || [],
    total: res.data?.meta?.pagination?.total || 0,
    meta: res.data?.meta || null,
  }
}

export async function fetchReport(id){
  const res = await axios.get(`${API}/reports/${id}`)
  return res.data?.data
}

export async function fetchTeams(){
  const res = await axios.get(`${API}/teams`)
  return res.data.data
}

export async function fetchVehicles(){
  const res = await axios.get(`${API}/teams/vehicles`)
  return res.data.data
}

export async function fetchHotspots(params = {}){
  const res = await axios.get(`${API}/reports/hotspots`, { params })
  return res.data?.data || []
}

export async function fetchTimeseries(params = {}){
  const res = await axios.get(`${API}/reports/analytics/timeseries`, { params })
  return res.data?.data
}

export async function assignReport(id, payload){
  const res = await axios.post(`${API}/reports/${id}/action`, payload)
  return res.data?.data
}

export async function createReport(formData, onUploadProgress){
  const res = await axios.post(`${API}/reports`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress })
  return res.data?.data
}

const geocodeCache = new Map()

function formatPlaceName(data) {
  if (!data) return null
  const a = data.address || {}
  const parts = [
    a.road || a.pedestrian || a.footway,
    a.house_number ? `No. ${a.house_number}` : null,
    a.neighbourhood || a.suburb || a.quarter,
    a.city || a.town || a.village || a.municipality,
    a.state_district || a.state,
  ].filter(Boolean)
  if (parts.length) return parts.slice(0, 3).join(', ')
  return data.display_name ? data.display_name.split(',').slice(0, 3).join(', ') : null
}

export async function reverseGeocode(lat, lon) {
  if (lat == null || lon == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lon))) return null
  const key = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`
  if (geocodeCache.has(key)) return geocodeCache.get(key)
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${Number(lat)}&lon=${Number(lon)}&zoom=18&addressdetails=1`
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!res.ok) return null
    const data = await res.json()
    const name = formatPlaceName(data)
    geocodeCache.set(key, name)
    return name
  } catch (e) {
    return null
  }
}

// Default dispatch base used as the route start when no worker location is known.
export const DEFAULT_DEPOT = { lat: 12.9716, lon: 77.5946, label: 'Central Depot' }

// Fetches a real road route from the public OSRM demo server.
// start/end: { lat, lon }
// Returns { coordinates: [[lat, lon], ...], distance (m), duration (s), steps: [...] }
// On failure, returns a straight-line fallback so the UI can still draw a path.
export async function fetchRoute(start, end) {
  const tryParse = async (url) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Routing request failed')
    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes || !data.routes.length) throw new Error('No route')
    const route = data.routes[0]
    const coordinates = route.geometry.coordinates.map(([lon, lat]) => [lat, lon])
    const steps = (route.legs || []).flatMap(leg => leg.steps || []).map(s => ({
      distance: s.distance,
      duration: s.duration,
      instruction: s.instruction || null,
      name: s.name,
      type: s.maneuver && s.maneuver.type,
      modifier: s.maneuver && s.maneuver.modifier,
    }))
    return {
      coordinates,
      distance: route.distance,
      duration: route.duration,
      steps,
      straight: false,
    }
  }

  const base = `https://router.project-osrm.org/route/v1/driving/${Number(start.lon)},${Number(start.lat)};${Number(end.lon)},${Number(end.lat)}`
  try {
    return await tryParse(`${base}?overview=full&geometries=geojson&steps=true`)
  } catch (e) {
    // Fallback: straight line so a path is still shown.
    return {
      coordinates: [[start.lat, start.lon], [end.lat, end.lon]],
      distance: null,
      duration: null,
      steps: [],
      straight: true,
    }
  }
}
