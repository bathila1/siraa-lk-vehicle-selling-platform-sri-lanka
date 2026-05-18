import { createServiceClient } from '@/lib/supabase/server';

interface AuditEntry {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string | number;
  details?: Record<string, unknown>;
  ip?: string;
}

/**
 * Record an admin action.
 * Fire-and-forget — never throws (we never want audit failures to break the action).
 */
export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase.from('audit_log').insert({
      admin_user_id: entry.adminId,
      action:        entry.action,
      target_type:   entry.targetType ?? null,
      target_id:     entry.targetId != null ? String(entry.targetId) : null,
      details:       (entry.details ?? null) as any,
      ip_address:    entry.ip ?? null,
    });
  } catch (err) {
    console.error('[audit] Failed to log event:', err);
  }
}
