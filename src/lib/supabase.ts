import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type CookieOptions } from '@supabase/ssr'

// Client-side Supabase client
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server-side Supabase client for Server Components
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Server-side Supabase client for Route Handlers
export const createRouteHandlerClient = (request: Request, response: Response) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.headers.get('cookie')
          return cookies ? cookies.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=')
            return { name, value }
          }) : []
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions: CookieOptions = {
              ...options,
              httpOnly: options?.httpOnly ?? true,
              secure: options?.secure ?? process.env.NODE_ENV === 'production',
              sameSite: options?.sameSite ?? 'lax',
            }
            
            response.headers.set(
              'Set-Cookie',
              `${name}=${value}; ${Object.entries(cookieOptions)
                .map(([key, val]) => `${key}=${val}`)
                .join('; ')}`
            )
          })
        },
      },
    }
  )
}

// Database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          city: string | null
          age: number | null
          user_type: 'customer' | 'driver' | 'delivery_person' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          city?: string | null
          age?: number | null
          user_type?: 'customer' | 'driver' | 'delivery_person' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          city?: string | null
          age?: number | null
          user_type?: 'customer' | 'driver' | 'delivery_person' | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          driver_id: string | null
          type: 'taxi' | 'moto-taxi'
          make: string
          model: string
          year: number
          plate: string
          specific_type: string | null
          doors: number | null
          status: 'pending' | 'verified' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          driver_id?: string | null
          type: 'taxi' | 'moto-taxi'
          make: string
          model: string
          year: number
          plate: string
          specific_type?: string | null
          doors?: number | null
          status?: 'pending' | 'verified' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          driver_id?: string | null
          type?: 'taxi' | 'moto-taxi'
          make?: string
          model?: string
          year?: number
          plate?: string
          specific_type?: string | null
          doors?: number | null
          status?: 'pending' | 'verified' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          customer_id: string | null
          driver_id: string | null
          vehicle_id: string | null
          pickup_location: string
          destination: string
          status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
          vehicle_type: 'taxi' | 'moto-taxi'
          taxi_type: 'básico' | 'premium' | null
          scheduled_time: string | null
          started_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          amount: number | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          driver_id?: string | null
          vehicle_id?: string | null
          pickup_location: string
          destination: string
          status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
          vehicle_type: 'taxi' | 'moto-taxi'
          taxi_type?: 'básico' | 'premium' | null
          scheduled_time?: string | null
          started_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          amount?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          driver_id?: string | null
          vehicle_id?: string | null
          pickup_location?: string
          destination?: string
          status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
          vehicle_type?: 'taxi' | 'moto-taxi'
          taxi_type?: 'básico' | 'premium' | null
          scheduled_time?: string | null
          started_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          amount?: number | null
          created_at?: string
        }
      }
      delivery_orders: {
        Row: {
          id: string
          customer_id: string | null
          delivery_person_id: string | null
          merchant_id: string | null
          pickup_location: string
          delivery_location: string
          order_details: string
          status: 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
          scheduled_time: string | null
          picked_up_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          amount: number | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          delivery_person_id?: string | null
          merchant_id?: string | null
          pickup_location: string
          delivery_location: string
          order_details: string
          status?: 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
          scheduled_time?: string | null
          picked_up_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          amount?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          delivery_person_id?: string | null
          merchant_id?: string | null
          pickup_location?: string
          delivery_location?: string
          order_details?: string
          status?: 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
          scheduled_time?: string | null
          picked_up_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          amount?: number | null
          created_at?: string
        }
      }
      merchants: {
        Row: {
          id: string
          name: string
          category: string
          image_url: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          image_url?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          image_url?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          user_id: string | null
          rated_user_id: string | null
          trip_id: string | null
          delivery_order_id: string | null
          rating: number
          feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          rated_user_id?: string | null
          trip_id?: string | null
          delivery_order_id?: string | null
          rating: number
          feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          rated_user_id?: string | null
          trip_id?: string | null
          delivery_order_id?: string | null
          rating?: number
          feedback?: string | null
          created_at?: string
        }
      }
    }
  }
}
