export interface Client {
  id: string
  full_name: string
  cedula_rif: string
  phone: string
  email: string
  address: string
  photo_url?: string
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  client_id: string
  plate: string
  brand: string
  model: string
  year: number
  color: string
  class: string
  type: string
  use_type: string
  vin?: string
  capacity_persons?: number
  capacity_load?: string
  created_at: string
}

export interface Coverage {
  id: string
  policy_id: string
  coverage_type: string
  coverage_amount?: number
  included: boolean
}

export interface Policy {
  id: string
  client_id: string
  vehicle_id: string
  policy_number: string
  receipt_number: string
  start_date: string
  end_date: string
  emission_date: string
  premium_amount: number
  currency: string
  payment_type: string
  advisor?: string
  supervisor?: string
  pdf_url?: string
  qr_url?: string
  email_sent: boolean
  status: 'active' | 'expired' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface PolicyWithDetails extends Policy {
  clients: Client
  vehicles: Vehicle
  coverages: Coverage[]
}

export interface CreateRCVPayload {
  // Client data
  full_name: string
  cedula_rif: string
  phone: string
  email: string
  address: string
  photo_file?: File

  // Vehicle data
  plate: string
  brand: string
  model: string
  year: number
  color: string
  vehicle_class: string
  vehicle_type: string
  use_type: string
  vin?: string
  capacity_persons?: number
  capacity_load?: string

  // Policy data
  start_date: string
  end_date: string
  premium_amount: number
  currency: string
  advisor?: string
  supervisor?: string

  // Coverages
  rc_cosas_amount?: number
  rc_personas_amount?: number
  exceso_garantia_amount?: number
  asistencia_juridica_amount?: number
  muerte_conductor_amount?: number
  include_invalidity?: boolean
  include_medical?: boolean
  include_funeral?: boolean
}

export type CoverageType =
  | 'RC_COSAS'
  | 'RC_PERSONAS'
  | 'EXCESO_GARANTIA'
  | 'ASISTENCIA_JURIDICA'
  | 'MUERTE_CONDUCTOR'
  | 'INVALIDEZ_CONDUCTOR'
  | 'GASTOS_MEDICOS'
  | 'GASTOS_FUNERARIOS'
