import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { createAdminClient } from '../supabase/server'
import type { Client, Vehicle, Policy, Coverage, PolicyWithDetails } from '../types'

const LOCAL_DB_PATH = path.join(process.cwd(), 'data', 'local-db.json')

interface LocalDatabase {
  clients: Client[]
  vehicles: Vehicle[]
  policies: Policy[]
  coverages: Coverage[]
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(
    url &&
      key &&
      !url.includes('your_supabase') &&
      url.startsWith('http')
  )
}

function readLocalDb(): LocalDatabase {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8')
      return JSON.parse(raw)
    }
  } catch (err) {
    console.warn('Error reading local DB:', err)
  }
  return { clients: [], vehicles: [], policies: [], coverages: [] }
}

function writeLocalDb(db: LocalDatabase) {
  try {
    const dir = path.dirname(LOCAL_DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
  } catch {
    // Ignore read-only filesystem in Vercel serverless environment
  }
}

export async function getNextPolicyNumber(): Promise<string> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createAdminClient()
      const { count } = await supabase
        .from('policies')
        .select('*', { count: 'exact', head: true })
      const nextNum = 43114 + (count || 0)
      return String(nextNum).padStart(10, '0')
    } catch {}
  }
  const db = readLocalDb()
  const nextNum = 43114 + db.policies.length
  return String(nextNum).padStart(10, '0')
}

export async function saveFullRCVRecord(input: {
  client: Omit<Client, 'id' | 'created_at' | 'updated_at'>
  vehicle: Omit<Vehicle, 'id' | 'client_id' | 'created_at'>
  policy: Omit<Policy, 'id' | 'client_id' | 'vehicle_id' | 'created_at' | 'updated_at'>
  coverages: Array<Omit<Coverage, 'id' | 'policy_id'>>
}): Promise<PolicyWithDetails> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createAdminClient()

      // 1. Upsert client by cedula_rif
      let clientId: string
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('cedula_rif', input.client.cedula_rif)
        .maybeSingle()

      if (existingClient) {
        clientId = existingClient.id
        await supabase
          .from('clients')
          .update({
            full_name: input.client.full_name,
            phone: input.client.phone,
            email: input.client.email,
            address: input.client.address,
            ...(input.client.photo_url ? { photo_url: input.client.photo_url } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', clientId)
      } else {
        const { data: newClient, error: cErr } = await supabase
          .from('clients')
          .insert(input.client)
          .select('id')
          .single()
        if (cErr) throw new Error(cErr.message)
        clientId = newClient.id
      }

      // 2. Insert vehicle
      const { data: newVehicle, error: vErr } = await supabase
        .from('vehicles')
        .insert({ ...input.vehicle, client_id: clientId })
        .select('id')
        .single()
      if (vErr) throw new Error(vErr.message)

      // 3. Insert policy (ensure unique policy_number if already taken)
      let finalPolicyNumber = input.policy.policy_number
      const { data: existingPol } = await supabase
        .from('policies')
        .select('id')
        .eq('policy_number', finalPolicyNumber)
        .maybeSingle()

      if (existingPol) {
        finalPolicyNumber = String(43114 + Math.floor(Math.random() * 90000)).padStart(10, '0')
      }

      const { data: newPolicy, error: pErr } = await supabase
        .from('policies')
        .insert({
          ...input.policy,
          policy_number: finalPolicyNumber,
          receipt_number: finalPolicyNumber,
          client_id: clientId,
          vehicle_id: newVehicle.id,
        })
        .select('id')
        .single()
      if (pErr) throw new Error(pErr.message)

      // 4. Insert coverages
      const covRows = input.coverages.map((c) => ({
        ...c,
        policy_id: newPolicy.id,
      }))
      const { error: covErr } = await supabase.from('coverages').insert(covRows)
      if (covErr) throw new Error(covErr.message)

      const full = await getPolicyById(newPolicy.id)
      if (full) return full
    } catch (err) {
      console.warn('Supabase write failed, falling back to local DB:', err)
    }
  }

  // Fallback / Local DB storage
  const db = readLocalDb()
  const now = new Date().toISOString()

  let client = db.clients.find((c) => c.cedula_rif === input.client.cedula_rif)
  if (client) {
    client.full_name = input.client.full_name
    client.phone = input.client.phone
    client.email = input.client.email
    client.address = input.client.address
    if (input.client.photo_url) client.photo_url = input.client.photo_url
    client.updated_at = now
  } else {
    client = {
      id: crypto.randomUUID(),
      ...input.client,
      created_at: now,
      updated_at: now,
    }
    db.clients.push(client)
  }

  const vehicle: Vehicle = {
    id: crypto.randomUUID(),
    client_id: client.id,
    ...input.vehicle,
    created_at: now,
  }
  db.vehicles.push(vehicle)

  const policy: Policy = {
    id: crypto.randomUUID(),
    client_id: client.id,
    vehicle_id: vehicle.id,
    ...input.policy,
    created_at: now,
    updated_at: now,
  }
  db.policies.push(policy)

  const coverages: Coverage[] = input.coverages.map((c) => ({
    id: crypto.randomUUID(),
    policy_id: policy.id,
    ...c,
  }))
  db.coverages.push(...coverages)

  writeLocalDb(db)

  return {
    ...policy,
    clients: client,
    vehicles: vehicle,
    coverages,
  }
}

export async function updatePolicyFields(
  policyId: string,
  fields: Partial<Pick<Policy, 'pdf_url' | 'qr_url' | 'email_sent' | 'status'>>
) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createAdminClient()
      await supabase.from('policies').update(fields).eq('id', policyId)
    } catch {}
  }
  const db = readLocalDb()
  const p = db.policies.find((item) => item.id === policyId)
  if (p) {
    Object.assign(p, fields, { updated_at: new Date().toISOString() })
    writeLocalDb(db)
  }
}

export async function getPolicyById(id: string): Promise<PolicyWithDetails | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createAdminClient()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      const query = supabase
        .from('policies')
        .select('*, clients(*), vehicles(*), coverages(*)')

      const { data, error } = isUuid
        ? await query.eq('id', id).maybeSingle()
        : await query.eq('policy_number', id).maybeSingle()

      if (!error && data) return data as PolicyWithDetails
    } catch {}
  }

  const db = readLocalDb()
  const policy = db.policies.find((p) => p.id === id || p.policy_number === id)
  if (!policy) return null
  const client = db.clients.find((c) => c.id === policy.client_id)
  const vehicle = db.vehicles.find((v) => v.id === policy.vehicle_id)
  const coverages = db.coverages.filter((cov) => cov.policy_id === policy.id)
  if (!client || !vehicle) return null

  return {
    ...policy,
    clients: client,
    vehicles: vehicle,
    coverages,
  }
}

export async function listAllPolicies(): Promise<PolicyWithDetails[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createAdminClient()
      const { data, error } = await supabase
        .from('policies')
        .select('*, clients(*), vehicles(*), coverages(*)')
        .order('created_at', { ascending: false })
      if (!error && data) return data as PolicyWithDetails[]
    } catch {}
  }

  const db = readLocalDb()
  return db.policies
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((policy) => ({
      ...policy,
      clients: db.clients.find((c) => c.id === policy.client_id)!,
      vehicles: db.vehicles.find((v) => v.id === policy.vehicle_id)!,
      coverages: db.coverages.filter((cov) => cov.policy_id === policy.id),
    }))
    .filter((p) => p.clients && p.vehicles)
}

export async function listAllClients() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createAdminClient()
      const { data, error } = await supabase
        .from('clients')
        .select('*, vehicles(*), policies(*)')
        .order('created_at', { ascending: false })
      if (!error && data) return data
    } catch {}
  }

  const db = readLocalDb()
  return db.clients
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((client) => ({
      ...client,
      vehicles: db.vehicles.filter((v) => v.client_id === client.id),
      policies: db.policies.filter((p) => p.client_id === client.id),
    }))
}

export async function lookupByCedulaOrPlate(query: { cedula?: string; plate?: string }) {
  const allPolicies = await listAllPolicies()
  if (query.cedula) {
    const clean = query.cedula.trim().toUpperCase()
    const match = allPolicies.find(
      (p) =>
        p.clients.cedula_rif.toUpperCase() === clean ||
        p.clients.cedula_rif.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, '')
    )
    if (match) return { client: match.clients, vehicle: match.vehicles }
  }
  if (query.plate) {
    const clean = query.plate.trim().toUpperCase()
    const match = allPolicies.find((p) => p.vehicles.plate.toUpperCase() === clean)
    if (match) return { client: match.clients, vehicle: match.vehicles }
  }
  return null
}
