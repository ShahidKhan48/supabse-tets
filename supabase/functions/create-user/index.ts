import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { record } = await req.json()
    console.log('User signup event received:', record)

    // Extract user metadata
    const userId = record.id
    const email = record.email
    const name = record.raw_user_meta_data?.name || email.split('@')[0]
    const roleName = record.raw_user_meta_data?.role || 'agent'

    console.log('Processing user creation for:', { userId, email, name, roleName })

    // Get role ID from role name
    const { data: roleData, error: roleError } = await supabaseClient
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single()

    if (roleError || !roleData) {
      console.error('Error finding role:', roleError)
      // Default to agent role (ID 1) if role not found
      const { data: defaultRole } = await supabaseClient
        .from('roles')
        .select('id')
        .eq('name', 'agent')
        .single()
      
      if (!defaultRole) {
        throw new Error('No default role found')
      }
      roleData = defaultRole
    }

    console.log('Found role ID:', roleData.id)

    // Create user record in users table
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .insert([
        {
          id: userId,
          email: email,
          name: name,
          role_id: roleData.id,
          status: 'active'
        }
      ])
      .select()

    if (userError) {
      console.error('Error creating user:', userError)
      throw userError
    }

    console.log('User created successfully:', userData)

    return new Response(
      JSON.stringify({ success: true, user: userData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in create-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})