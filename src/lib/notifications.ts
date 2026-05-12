import { getSupabaseClient } from './supabase'

export type AdminNotification = {
  id: string
  title: string
  message: string
  type: string
  entity_type: string | null
  entity_id: string | null
  target_role: string
  target_user_id: string | null
  is_read: boolean
  created_at: string
}

export type CreateNotificationPayload = {
  title: string
  message: string
  type: string
  entity_type: string
  entity_id: string | number
  target_role: string
}

export async function fetchUnreadAdminNotifications(limit = 20) {
  const { data, error } = await getSupabaseClient()
    .from('notifications')
    .select('*')
    .eq('target_role', 'admin')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as AdminNotification[]
}

export async function fetchUnreadNotificationsCount() {
  const { count, error } = await getSupabaseClient()
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('target_role', 'admin')
    .eq('is_read', false)

  if (error) throw error
  return count ?? 0
}

export async function fetchAdminNotificationHistory(limit = 100) {
  const { data, error } = await getSupabaseClient()
    .from('notifications')
    .select('*')
    .eq('target_role', 'admin')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as AdminNotification[]
}

export async function markNotificationAsRead(id: string) {
  const { error } = await getSupabaseClient()
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)

  if (error) throw error
}

export async function markNotificationsAsRead() {
  const { error } = await getSupabaseClient()
    .from('notifications')
    .update({ is_read: true })
    .eq('target_role', 'admin')
    .eq('is_read', false)

  if (error) throw error
}

export async function createNotification(payload: CreateNotificationPayload) {
  const { data, error } = await getSupabaseClient()
    .from('notifications')
    .insert({
      ...payload,
      entity_id: String(payload.entity_id),
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}
