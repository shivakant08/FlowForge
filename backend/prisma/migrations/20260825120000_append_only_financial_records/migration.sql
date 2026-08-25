CREATE OR REPLACE FUNCTION prevent_financial_record_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Financial records are append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ledger_entries_append_only ON "LedgerEntry";
CREATE TRIGGER ledger_entries_append_only
BEFORE UPDATE OR DELETE ON "LedgerEntry"
FOR EACH ROW EXECUTE FUNCTION prevent_financial_record_mutation();

DROP TRIGGER IF EXISTS audit_logs_append_only ON "AuditLog";
CREATE TRIGGER audit_logs_append_only
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_financial_record_mutation();
