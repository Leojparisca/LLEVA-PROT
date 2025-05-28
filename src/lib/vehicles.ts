import { createClient } from './supabase'
import { Database } from './supabase'

type Vehicle = Database['public']['Tables']['vehicles']['Row']
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

export const createVehicle = async (vehicleData: VehicleInsert) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicleData)
    .select()
    .single()
  
  return { data, error }
}

export const getDriverVehicles = async (driverId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const getVehicleById = async (vehicleId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      driver:profiles!vehicles_driver_id_fkey(full_name, phone, avatar_url)
    `)
    .eq('id', vehicleId)
    .single()
  
  return { data, error }
}

export const updateVehicle = async (vehicleId: string, updates: VehicleUpdate) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', vehicleId)
    .select()
    .single()
  
  return { data, error }
}

export const updateVehicleStatus = async (vehicleId: string, status: Vehicle['status']) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .update({ status })
    .eq('id', vehicleId)
    .select()
    .single()
  
  return { data, error }
}

export const getVerifiedVehiclesByType = async (type: 'taxi' | 'moto-taxi') => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      driver:profiles!vehicles_driver_id_fkey(full_name, phone, avatar_url)
    `)
    .eq('type', type)
    .eq('status', 'verified')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const getPendingVehicles = async () => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      driver:profiles!vehicles_driver_id_fkey(full_name, phone, avatar_url)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  
  return { data, error }
}

export const deleteVehicle = async (vehicleId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId)
    .select()
    .single()
  
  return { data, error }
}

// Vehicle validation
export const validatePlateNumber = (plate: string): boolean => {
  // Basic plate validation for Colombia (adjust as needed)
  const plateRegex = /^[A-Z]{3}-\d{3}$/
  return plateRegex.test(plate.toUpperCase())
}

export const validateVehicleYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear()
  return year >= 1990 && year <= currentYear + 1
}

// Vehicle types and configurations
export const vehicleTypes = {
  taxi: {
    label: 'Taxi',
    specificTypes: ['básico', 'premium'],
    doorsRequired: true,
  },
  'moto-taxi': {
    label: 'Moto-taxi',
    specificTypes: ['motocicleta'],
    doorsRequired: false,
  },
}

export const getVehicleTypeConfig = (type: 'taxi' | 'moto-taxi') => {
  return vehicleTypes[type]
}
