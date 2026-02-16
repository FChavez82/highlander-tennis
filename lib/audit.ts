/**
 * Audit logging helper — records admin actions for accountability.
 *
 * Non-throwing: wraps every insert in try/catch so a logging failure
 * never breaks the actual admin operation.
 */
import { sql } from "@vercel/postgres";

/**
 * Insert a single row into the audit_logs table.
 *
 * @param adminEmail  - The email of the admin who performed the action
 * @param action      - Short identifier (e.g. "create_player", "update_match")
 * @param entityType  - The kind of entity affected ("player", "match", "system")
 * @param entityId    - The ID of the affected row (null for system-wide actions)
 * @param prevValues  - Snapshot of the entity BEFORE the change (null for creates)
 * @param newValues   - Snapshot of the entity AFTER the change (null for deletes)
 */
export async function logAction(
	adminEmail: string,
	action: string,
	entityType: string,
	entityId: number | null = null,
	prevValues: Record<string, unknown> | null = null,
	newValues: Record<string, unknown> | null = null
): Promise<void> {
	try {
		await sql`
			INSERT INTO audit_logs (admin_email, action, entity_type, entity_id, prev_values, new_values)
			VALUES (
				${adminEmail},
				${action},
				${entityType},
				${entityId},
				${prevValues ? JSON.stringify(prevValues) : null}::jsonb,
				${newValues ? JSON.stringify(newValues) : null}::jsonb
			);
		`;
	} catch (error) {
		/* Log the failure but never throw — audit must not break admin operations */
		console.error("Audit log error:", error);
	}
}
