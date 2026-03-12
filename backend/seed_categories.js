const pool = require('./src/db');

const CATEGORIES = [
  { name: 'Salary', type: 'income', color: '#10b981', icon: 'payments' },
  { name: 'Personal Care', type: 'income', color: '#10b981', icon: 'payments' },
  { name: 'Business', type: 'income', color: '#3b82f6', icon: 'work' },
  { name: 'Other Income', type: 'income', color: '#6b7280', icon: 'add_circle' },
  
  { name: 'Rent', type: 'expense', color: '#ef4444', icon: 'home' },
  { name: 'Groceries', type: 'expense', color: '#f59e0b', icon: 'shopping_cart' },
  { name: 'Dining Out', type: 'expense', color: '#f97316', icon: 'restaurant' },
  { name: 'Transport', type: 'expense', color: '#3b82f6', icon: 'directions_car' },
  { name: 'Utilities', type: 'expense', color: '#8b5cf6', icon: 'bolt' },
  { name: 'Health', type: 'expense', color: '#ec4899', icon: 'medical_services' },
  { name: 'Shopping', type: 'expense', color: '#f43f5e', icon: 'shopping_bag' },
  { name: 'Entertainment', type: 'expense', color: '#6366f1', icon: 'movie' },
  { name: 'EMI', type: 'expense', color: '#ef4444', icon: 'credit_card' },
  { name: 'Transfer', type: 'transfer', color: '#94a3b8', icon: 'swap_horiz' },
  { name: 'Uncategorized', type: 'expense', color: '#94a3b8', icon: 'help' }
];

async function seed() {
  try {
    const { rows: users } = await pool.query('SELECT id FROM users');
    
    console.log(`Seeding categories for ${users.length} users...`);
    
    for (const user of users) {
      for (const cat of CATEGORIES) {
        await pool.query(`
          INSERT INTO categories (user_id, name, type, color, icon, is_system, is_active)
          VALUES ($1, $2, $3, $4, $5, false, true)
          ON CONFLICT DO NOTHING
        `, [user.id, cat.name, cat.type, cat.color, cat.icon]);
      }
    }
    
    console.log('✅ Categories seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
