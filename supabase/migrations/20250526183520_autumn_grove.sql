/*
  # Initial Schema Setup for LLEVA

  1. New Tables
    - `profiles`
      - User profiles with additional information
      - Linked to auth.users
    - `vehicles`
      - Vehicle information for drivers
    - `trips`
      - Trip records and history
    - `delivery_orders`
      - Delivery order records
    - `merchants`
      - Registered merchant information
    - `ratings`
      - User ratings and feedback

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure access patterns for different user types
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  phone text,
  city text,
  age int CHECK (age >= 18),
  user_type text CHECK (user_type IN ('customer', 'driver', 'delivery_person')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text CHECK (type IN ('taxi', 'moto-taxi')),
  make text NOT NULL,
  model text NOT NULL,
  year int NOT NULL,
  plate text NOT NULL UNIQUE,
  specific_type text, -- For cars: sedan, SUV, etc.
  doors int CHECK (doors BETWEEN 2 AND 5),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES profiles(id),
  driver_id uuid REFERENCES profiles(id),
  vehicle_id uuid REFERENCES vehicles(id),
  pickup_location text NOT NULL,
  destination text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('taxi', 'moto-taxi')),
  taxi_type text CHECK (taxi_type IN ('básico', 'premium')),
  scheduled_time timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  amount decimal(10,2),
  created_at timestamptz DEFAULT now()
);

-- Create merchants table
CREATE TABLE IF NOT EXISTS merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  image_url text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create delivery_orders table
CREATE TABLE IF NOT EXISTS delivery_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES profiles(id),
  delivery_person_id uuid REFERENCES profiles(id),
  merchant_id uuid REFERENCES merchants(id),
  pickup_location text NOT NULL,
  delivery_location text NOT NULL,
  order_details text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  scheduled_time timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  amount decimal(10,2),
  created_at timestamptz DEFAULT now()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  rated_user_id uuid REFERENCES profiles(id),
  trip_id uuid REFERENCES trips(id),
  delivery_order_id uuid REFERENCES delivery_orders(id),
  rating int CHECK (rating BETWEEN 1 AND 5),
  feedback text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT rating_context_check CHECK (
    (trip_id IS NOT NULL AND delivery_order_id IS NULL) OR
    (delivery_order_id IS NOT NULL AND trip_id IS NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Vehicles policies
CREATE POLICY "Drivers can read their own vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can create their own vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid());

-- Trips policies
CREATE POLICY "Users can read their own trips"
  ON trips FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid() OR driver_id = auth.uid());

CREATE POLICY "Customers can create trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Delivery orders policies
CREATE POLICY "Users can read their own delivery orders"
  ON delivery_orders FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid() OR delivery_person_id = auth.uid());

CREATE POLICY "Customers can create delivery orders"
  ON delivery_orders FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Ratings policies
CREATE POLICY "Users can read ratings related to them"
  ON ratings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR rated_user_id = auth.uid());

CREATE POLICY "Users can create ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create function to handle profile updates
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profiles
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();