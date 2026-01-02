SELECT schemaname, tablename FROM pg_tables WHERE tablename ILIKE '%admin%' ORDER BY schemaname, tablename;

