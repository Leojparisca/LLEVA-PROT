import { createClient } from './supabase'
import { Database } from './supabase'

type Rating = Database['public']['Tables']['ratings']['Row']
type RatingInsert = Database['public']['Tables']['ratings']['Insert']

export const createRating = async (ratingData: RatingInsert) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ratings')
    .insert(ratingData)
    .select()
    .single()
  
  return { data, error }
}

export const getUserRatings = async (userId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ratings')
    .select(`
      *,
      user:profiles!ratings_user_id_fkey(full_name, avatar_url),
      rated_user:profiles!ratings_rated_user_id_fkey(full_name, avatar_url),
      trip:trips(pickup_location, destination, vehicle_type),
      delivery_order:delivery_orders(pickup_location, delivery_location)
    `)
    .eq('rated_user_id', userId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const getTripRating = async (tripId: string, userId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .single()
  
  return { data, error }
}

export const getDeliveryOrderRating = async (deliveryOrderId: string, userId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('delivery_order_id', deliveryOrderId)
    .eq('user_id', userId)
    .single()
  
  return { data, error }
}

export const getUserAverageRating = async (userId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ratings')
    .select('rating')
    .eq('rated_user_id', userId)
  
  if (error || !data || data.length === 0) {
    return { averageRating: 0, totalRatings: 0, error }
  }
  
  const totalRatings = data.length
  const averageRating = data.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings
  
  return { averageRating: Math.round(averageRating * 10) / 10, totalRatings, error: null }
}

export const getDriverRatingStats = async (driverId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ratings')
    .select('rating, feedback')
    .eq('rated_user_id', driverId)
    .order('created_at', { ascending: false })
  
  if (error || !data || data.length === 0) {
    return { 
      averageRating: 0, 
      totalRatings: 0, 
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      recentFeedback: [],
      error 
    }
  }
  
  const totalRatings = data.length
  const averageRating = data.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings
  
  // Calculate rating distribution
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  data.forEach(rating => {
    ratingDistribution[rating.rating as keyof typeof ratingDistribution]++
  })
  
  // Get recent feedback (with text)
  const recentFeedback = data
    .filter(rating => rating.feedback && rating.feedback.trim().length > 0)
    .slice(0, 5)
    .map(rating => ({
      rating: rating.rating,
      feedback: rating.feedback
    }))
  
  return { 
    averageRating: Math.round(averageRating * 10) / 10, 
    totalRatings,
    ratingDistribution,
    recentFeedback,
    error: null 
  }
}

export const canUserRateTrip = async (tripId: string, userId: string) => {
  const supabase = createClient()
  
  // Check if trip is completed and user hasn't rated yet
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('status, customer_id, driver_id')
    .eq('id', tripId)
    .single()
  
  if (tripError || !trip) {
    return { canRate: false, reason: 'Trip not found' }
  }
  
  if (trip.status !== 'completed') {
    return { canRate: false, reason: 'Trip not completed yet' }
  }
  
  if (trip.customer_id !== userId && trip.driver_id !== userId) {
    return { canRate: false, reason: 'User not part of this trip' }
  }
  
  // Check if user already rated
  const { data: existingRating } = await supabase
    .from('ratings')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .single()
  
  if (existingRating) {
    return { canRate: false, reason: 'Already rated' }
  }
  
  return { canRate: true, reason: null }
}

export const canUserRateDeliveryOrder = async (deliveryOrderId: string, userId: string) => {
  const supabase = createClient()
  
  // Check if delivery order is completed and user hasn't rated yet
  const { data: order, error: orderError } = await supabase
    .from('delivery_orders')
    .select('status, customer_id, delivery_person_id')
    .eq('id', deliveryOrderId)
    .single()
  
  if (orderError || !order) {
    return { canRate: false, reason: 'Delivery order not found' }
  }
  
  if (order.status !== 'delivered') {
    return { canRate: false, reason: 'Delivery not completed yet' }
  }
  
  if (order.customer_id !== userId && order.delivery_person_id !== userId) {
    return { canRate: false, reason: 'User not part of this delivery' }
  }
  
  // Check if user already rated
  const { data: existingRating } = await supabase
    .from('ratings')
    .select('id')
    .eq('delivery_order_id', deliveryOrderId)
    .eq('user_id', userId)
    .single()
  
  if (existingRating) {
    return { canRate: false, reason: 'Already rated' }
  }
  
  return { canRate: true, reason: null }
}

// Rating validation
export const validateRating = (rating: number): boolean => {
  return rating >= 1 && rating <= 5 && Number.isInteger(rating)
}

export const validateFeedback = (feedback: string): boolean => {
  return feedback.length <= 500 // Max 500 characters
}
