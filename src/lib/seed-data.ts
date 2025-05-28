import { createClient } from './supabase'

export const seedMerchants = async () => {
  const supabase = createClient()
  
  const merchants = [
    {
      name: 'Restaurante El Buen Sabor',
      category: 'Comida',
      image_url: 'https://placehold.co/100x100.png',
      status: 'active' as const
    },
    {
      name: 'Farmacia La Saludable', 
      category: 'Farmacia',
      image_url: 'https://placehold.co/100x100.png',
      status: 'active' as const
    },
    {
      name: 'Supermercado Todo Fresco',
      category: 'Supermercado', 
      image_url: 'https://placehold.co/100x100.png',
      status: 'active' as const
    },
    {
      name: 'Tienda de Regalos Detallitos',
      category: 'Regalos',
      image_url: 'https://placehold.co/100x100.png', 
      status: 'active' as const
    }
  ]
  
  // Check if merchants already exist
  const { data: existingMerchants } = await supabase
    .from('merchants')
    .select('name')
    .limit(1)
  
  if (!existingMerchants || existingMerchants.length === 0) {
    const { data, error } = await supabase
      .from('merchants')
      .insert(merchants)
      .select()
    
    return { data, error }
  }
  
  return { data: existingMerchants, error: null }
}