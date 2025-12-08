import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify requesting user is super_admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('No authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !requestingUser) {
      console.log('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if requesting user is super_admin
    const { data: isSuperAdmin } = await supabaseAdmin.rpc('is_super_admin', { _user_id: requestingUser.id })
    
    if (!isSuperAdmin) {
      console.log('User is not super admin:', requestingUser.id)
      return new Response(
        JSON.stringify({ error: 'Forbidden - only super admin can create admins' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, password, full_name, rt_id } = await req.json()

    console.log('Creating/updating admin user:', { email, full_name, rt_id })

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.log('Error listing users:', listError)
      return new Response(
        JSON.stringify({ error: listError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    let userId: string

    if (existingUser) {
      // User exists - update their role to admin
      userId = existingUser.id
      console.log('User already exists, updating role to admin:', userId)

      // Check if user already has a role entry
      const { data: existingRole, error: roleCheckError } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (roleCheckError) {
        console.log('Error checking existing role:', roleCheckError)
      }

      if (existingRole) {
        // Update existing role
        const { error: updateError } = await supabaseAdmin
          .from('user_roles')
          .update({ role: 'admin', rt_id })
          .eq('user_id', userId)

        if (updateError) {
          console.log('Error updating role:', updateError)
          return new Response(
            JSON.stringify({ error: 'Gagal mengupdate role: ' + updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        // Insert new role
        const { error: insertError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin', rt_id })

        if (insertError) {
          console.log('Error inserting role:', insertError)
          return new Response(
            JSON.stringify({ error: 'Gagal membuat role: ' + insertError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Update profile name if provided
      if (full_name) {
        await supabaseAdmin
          .from('profiles')
          .update({ full_name })
          .eq('user_id', userId)
      }

    } else {
      // User doesn't exist - create new user
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name }
      })

      if (createError) {
        console.log('Error creating user:', createError)
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      userId = authData.user.id
      console.log('New user created with id:', userId)

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({ user_id: userId, full_name })

      if (profileError) {
        console.log('Error creating profile:', profileError)
      }

      // Create user_roles with admin role and rt_id
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ 
          user_id: userId, 
          role: 'admin',
          rt_id 
        })

      if (roleError) {
        console.log('Error creating role:', roleError)
        // If role creation fails, clean up by deleting the user
        await supabaseAdmin.auth.admin.deleteUser(userId)
        return new Response(
          JSON.stringify({ error: 'Gagal membuat role admin: ' + roleError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log('Admin created/updated successfully:', userId)

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Unexpected error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})