import { createClient } from './supabase'
import { Database } from './supabase'

type DeliveryOrder = Database['public']['Tables']['delivery_orders']['Row']
type DeliveryOrderInsert = Database['public']['Tables']['delivery_orders']['Insert']
type DeliveryOrderUpdate = Database['public']['Tables']['delivery_orders']['Update']

export const createDeliveryOrder = async (orderData: DeliveryOrderInsert) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('delivery_orders')
    .insert(orderData)
    .select()
    .single()
  
  return { data, error }
}

export const getUserDeliveryOrders = async (userId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('delivery_orders')
    .select(`
      *,
      customer:profiles!delivery_orders_customer_id_fkey(full_name, phone),
      delivery_person:profiles!delivery_orders_delivery_person_id_fkey(full_name, phone),
      merchant:merchants(name, category)
    `)
    .or(`customer_id.eq.${userId},delivery_person_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const getDeliveryOrderById = async (orderId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('delivery_orders')
    .select(`
      *,
      customer:profiles!delivery_orders_customer_id_fkey(full_name, phone, avatar_url),
      delivery_person:profiles!delivery_orders_delivery_person_id_fkey(full_name, phone, avatar_url),
      merchant:merchants(name, category, image_url)
    `)
    .eq('id', orderId)
    .single()
  
  return { data, error }
}

export const updateDeliveryOrderStatus = async (orderId: string, status: DeliveryOrder['status'], updates?: Partial<DeliveryOrderUpdate>) => {
  const supabase = createClient()
  
  const updateData: DeliveryOrderUpdate = {
    status,
    ...updates
  }

  // Add timestamp based on status
  if (status === 'picked_up') {
    updateData.picked_up_at = new Date().toISOString()
  } else if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString()
  } else if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('delivery_orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single()
  
  return { data, error }
}

export const acceptDeliveryOrder = async (orderId: string, deliveryPersonId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('delivery_orders')
    .update({
      status: 'accepted',
      delivery_person_id: deliveryPersonId
    })
    .eq('id', orderId)
    .eq('status', 'pending') // Only accept pending orders
    .select()
    .single()
  
  return { data, error }
}

export const getPendingDeliveryOrders = async () => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('delivery_orders')
    .select(`
      *,
      customer:profiles!delivery_orders_customer_id_fkey(full_name, phone, avatar_url),
      merchant:merchants(name, category, image_url)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  
  return { data, error }
}

// Merchants
export const getAllMerchants = async () => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('status', 'active')
    .order('name')
  
  return { data, error }
}

export const getMerchantById = async (merchantId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('id', merchantId)
    .single()
  
  return { data, error }
}

// Real-time subscriptions
export const subscribeToDeliveryOrderUpdates = (orderId: string, callback: (payload: any) => void) => {
  const supabase = createClient()
  
  return supabase
    .channel(`delivery-order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_orders',
        filter: `id=eq.${orderId}`,
      },
      callback
    )
    .subscribe()
}

export const subscribeToDeliveryPersonOrders = (deliveryPersonId: string, callback: (payload: any) => void) => {
  const supabase = createClient()
  
  return supabase
    .channel(`delivery-person-orders-${deliveryPersonId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'delivery_orders',
        filter: `delivery_person_id=eq.${deliveryPersonId}`,
      },
      callback
    )
    .subscribe()
}

export const subscribeToCustomerDeliveryOrders = (customerId: string, callback: (payload: any) => void) => {
  const supabase = createClient()
  
  return supabase
    .channel(`customer-delivery-orders-${customerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'delivery_orders',
        filter: `customer_id=eq.${customerId}`,
      },
      callback
    )
    .subscribe()
}
