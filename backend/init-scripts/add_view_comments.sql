-- Add comment metadata so diagram tools can reference parent tables
-- This doesn't create FK constraints on views (which is impossible),
-- but helps documentation tools identify the relationships.

-- user_account_summary is derived from: users, accounts, account_types
COMMENT ON VIEW user_account_summary IS 
'Summary of user accounts and net worth. 
References: users(id), accounts(user_id, account_type_id), account_types(id).
Key join: user_id -> users(id)';

COMMENT ON COLUMN user_account_summary.user_id IS 
'References users(id)';

-- monthly_spending_by_category is derived from: transactions, categories
COMMENT ON VIEW monthly_spending_by_category IS 
'Monthly spending aggregated by category.
References: transactions(user_id, category_id), categories(id).
Key join: user_id -> users(id) via transactions';

COMMENT ON COLUMN monthly_spending_by_category.user_id IS 
'References users(id) via transactions(user_id)';
