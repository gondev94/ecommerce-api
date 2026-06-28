import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types.js'
import WebSocket from 'ws'

// Cliente admin singleton (lazy initialization)
let _supabaseAdmin: SupabaseClient<Database> | null = null

export function getSupabaseAdmin() {
    if (!_supabaseAdmin) {
        const url = process.env.SUPABASE_URL!
        const secretKey = process.env.SUPABASE_SECRET_KEY!

        _supabaseAdmin = createClient<Database>(url, secretKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            },
            realtime: {
                transport: WebSocket as unknown as typeof globalThis.WebSocket
            }
        })
    }
    return _supabaseAdmin
}

// Cliente para operaciones públicas (con publishable key)
let _supabasePublic: SupabaseClient<Database> | null = null

export function getSupabasePublic() {
    if (!_supabasePublic) {
        const url = process.env.SUPABASE_URL!
        const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY!

        _supabasePublic = createClient<Database>(url, publishableKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            },
            realtime: {
                transport: WebSocket as unknown as typeof globalThis.WebSocket
            }
        })
    }
    return _supabasePublic
}
