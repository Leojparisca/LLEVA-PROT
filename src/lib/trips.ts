import { createClient } from './supabase'
import { Database } from './supabase'

type Trip = Database['public']['Tables']['trips']['Row']
type TripInsert = Database['public']['Tables']['trips']['Insert']
type TripUpdate = Database['public']['Tables']['trips']['Update']

export const createTrip = async (tripData: TripInsert) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('trips')
    .insert(tripData)
    .select()
    .single()
  
  return { data, error }
}

export const getUserTrips = async (userId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      customer:profiles!trips_customer_id_fkey(full_name, phone),
      driver:profiles!trips_driver_id_fkey(full_name, phone),
      vehicle:vehicles(make, model, plate, type)
    `)
    .or(`customer_id.eq.${userId},driver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const getTripById = async (tripId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      customer:profiles!trips_customer_id_fkey(full_name, phone, avatar_url),
      driver:profiles!trips_driver_id_fkey(full_name, phone, avatar_url),
      vehicle:vehicles(make, model, plate, type)
    `)
    .eq('id', tripId)
    .single()
  
  return { data, error }
}

export const updateTripStatus = async (tripId: string, status: Trip['status'], updates?: Partial<TripUpdate>) => {
  const supabase = createClient()
  
  const updateData: TripUpdate = {
    status,
    ...updates
  }

  // Add timestamp based on status
  if (status === 'in_progress') {
    updateData.started_at = new Date().toISOString()
  } else if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  } else if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('trips')
    .update(updateData)
    .eq('id', tripId)
    .select()
    .single()
  
  return { data, error }
}

export const acceptTrip = async (tripId: string, driverId: string, vehicleId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('trips')
    .update({
      status: 'accepted',
      driver_id: driverId,
      vehicle_id: vehicleId
    })
    .eq('id', tripId)
    .eq('status', 'pending') // Only accept pending trips
    .select()
    .single()
  
  return { data, error }
}

export const getPendingTrips = async (vehicleType?: 'taxi' | 'moto-taxi') => {
  const supabase = createClient()
  
  let query = supabase
    .from('trips')
    .select(`
      *,
      customer:profiles!trips_customer_id_fkey(full_name, phone, avatar_url)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (vehicleType) {
    query = query.eq('vehicle_type', vehicleType)
  }
  
  const { data, error } = await query
  
  return { data, error }
}

// Real-time subscriptions
export const subscribeToTripUpdates = (tripId: string, callback: (payload: any) => void) => {
  const supabase = createClient()
  
  return supabase
    .channel(`trip-${tripId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'trips',
        filter: `id=eq.${tripId}`,
      },
      callback
    )
    .subscribe()
}

export const subscribeToDriverTrips = (driverId: string, callback: (payload: any) => void) => {
  const supabase = createClient()
  
  return supabase
    .channel(`driver-trips-${driverId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trips',
        filter: `driver_id=eq.${driverId}`,
      },
      callback
    )
    .subscribe()
}

export const subscribeToCustomerTrips = (customerId: string, callback: (payload: any) => void) => {
  const supabase = createClient()
  
  return supabase
    .channel(`customer-trips-${customerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trips',
        filter: `customer_id=eq.${customerId}`,
      },
      callback
    )
    .subscribe()
}
