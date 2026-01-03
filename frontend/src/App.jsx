import React, { useState, useEffect, createContext, useContext } from 'react';

// ============================================
// CONFIGURATION
// ============================================
const API_BASE = 'http://localhost:8080/api';

// ============================================
// CONTEXTS
// ============================================
const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// ============================================
// THEME DEFINITIONS
// ============================================
const themes = {
  professional: {
    name: 'Professional',
    colors: {
      bg: { primary: '#111113', secondary: '#18181b', tertiary: '#1f1f23', hover: '#27272a' },
      border: { subtle: 'rgba(255,255,255,0.06)', default: 'rgba(255,255,255,0.1)' },
      text: { primary: '#fafafa', secondary: '#a1a1aa', tertiary: '#71717a', muted: '#52525b' },
      accent: { primary: '#fafafa', secondary: '#a1a1aa' },
      status: {
        requested: { color: '#ca8a04', bg: 'rgba(202,138,4,0.1)' },
        confirmed: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
        inTransit: { color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
        delivered: { color: '#059669', bg: 'rgba(5,150,105,0.1)' },
        cancelled: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
        failed: { color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
        error: { color: '#f87171', bg: 'rgba(220,38,38,0.1)' },
      },
      roles: { ADMIN: '#dc2626', WAREHOUSE_MANAGER: '#7c3aed', LOGISTICS: '#2563eb', INVENTORY_CLERK: '#059669', VIEWER: '#6b7280' }
    },
    icons: {
      status: { REQUESTED: '○', CONFIRMED: '◉', IN_TRANSIT: '◎', DELIVERED: '●', CANCELLED: '○', FAILED: '○' },
      nav: { dashboard: '', transfers: '', 'new-transfer': '', inventory: '', reports: '', users: '' },
      stats: { total: '', pending: '', inTransit: '', delivered: '', lowStock: '' }
    },
    useGradients: false,
  },
  vibrant: {
    name: 'Vibrant',
    colors: {
      bg: { primary: '#0a0a0f', secondary: '#12121a', tertiary: '#1a1a2e', hover: '#252540' },
      border: { subtle: 'rgba(139,92,246,0.15)', default: 'rgba(139,92,246,0.25)' },
      text: { primary: '#f1f5f9', secondary: '#cbd5e1', tertiary: '#94a3b8', muted: '#64748b' },
      accent: { primary: '#8b5cf6', secondary: '#6366f1' },
      status: {
        requested: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
        confirmed: { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
        inTransit: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
        delivered: { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
        cancelled: { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
        failed: { color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
        error: { color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
      },
      roles: { ADMIN: '#ef4444', WAREHOUSE_MANAGER: '#a855f7', LOGISTICS: '#3b82f6', INVENTORY_CLERK: '#10b981', VIEWER: '#6b7280' }
    },
    icons: {
      status: { REQUESTED: '📋', CONFIRMED: '✓', IN_TRANSIT: '🚚', DELIVERED: '✓', CANCELLED: '✕', FAILED: '✕' },
      nav: { dashboard: '📊', transfers: '📦', 'new-transfer': '➕', inventory: '📋', reports: '📈', users: '👥' },
      stats: { total: '📦', pending: '📋', inTransit: '🚚', delivered: '✓', lowStock: '⚠️' }
    },
    useGradients: true,
  }
};

// ============================================
// ROLE DEFINITIONS & PERMISSIONS
// ============================================
const ROLES = {
  ADMIN: { name: 'Administrator', level: 5, permissions: ['all'] },
  WAREHOUSE_MANAGER: { name: 'Warehouse Manager', level: 4, permissions: ['create_transfer', 'cancel_transfer', 'approve_transfer', 'update_status', 'view_transfers', 'view_inventory', 'view_reports'] },
  LOGISTICS: { name: 'Logistics', level: 3, permissions: ['update_status', 'view_transfers', 'view_inventory', 'view_reports'] },
  INVENTORY_CLERK: { name: 'Inventory Clerk', level: 2, permissions: ['create_transfer', 'view_transfers', 'view_inventory', 'view_reports'] },
  VIEWER: { name: 'Viewer', level: 1, permissions: ['view_inventory'] }
};

const DEMO_USERS = [
  { id: 1, username: 'admin', password: 'admin123', name: 'John Admin', role: 'ADMIN', location: 'ALL' },
  { id: 2, username: 'manager', password: 'manager123', name: 'Sarah Manager', role: 'WAREHOUSE_MANAGER', location: 'WAREHOUSE-NORTH-01' },
  { id: 3, username: 'logistics', password: 'logistics123', name: 'Mike Driver', role: 'LOGISTICS', location: 'DISTRIBUTION-CENTER-MAIN' },
  { id: 4, username: 'clerk', password: 'clerk123', name: 'Emily Clerk', role: 'INVENTORY_CLERK', location: 'WAREHOUSE-SOUTH-02' },
  { id: 5, username: 'viewer', password: 'viewer123', name: 'Bob Viewer', role: 'VIEWER', location: 'STORE-DOWNTOWN-001' },
];

const hasPermission = (user, permission) => {
  if (!user) return false;
  const role = ROLES[user.role];
  if (!role) return false;
  return role.permissions.includes('all') || role.permissions.includes(permission);
};

// ============================================
// PRODUCT CATALOG
// ============================================
const PRODUCT_CATALOG = {
  'ELEC-TV-55-4K': { name: 'Smart TV 55" 4K UHD', category: 'Electronics', unit: 'units', price: 599.99 },
  'ELEC-TV-65-4K': { name: 'Smart TV 65" 4K UHD', category: 'Electronics', unit: 'units', price: 899.99 },
  'ELEC-LAPTOP-PRO': { name: 'Laptop Pro 15.6"', category: 'Electronics', unit: 'units', price: 1299.99 },
  'ELEC-PHONE-PRO': { name: 'Smartphone Pro Max', category: 'Electronics', unit: 'units', price: 999.99 },
  'ELEC-TABLET-10': { name: 'Tablet 10.5"', category: 'Electronics', unit: 'units', price: 449.99 },
  'ELEC-HEADPHONE-BT': { name: 'Wireless Headphones', category: 'Electronics', unit: 'units', price: 199.99 },
  'ELEC-SPEAKER-BT': { name: 'Bluetooth Speaker', category: 'Electronics', unit: 'units', price: 79.99 },
  'ELEC-CHARGER-USB': { name: 'USB-C Fast Charger', category: 'Electronics', unit: 'units', price: 29.99 },
  'FURN-CHAIR-OFF': { name: 'Office Chair Ergonomic', category: 'Furniture', unit: 'units', price: 299.99 },
  'FURN-DESK-STD': { name: 'Standing Desk 60"', category: 'Furniture', unit: 'units', price: 499.99 },
  'FURN-SHELF-5T': { name: 'Storage Shelf 5-Tier', category: 'Furniture', unit: 'units', price: 89.99 },
  'FURN-CABINET-2D': { name: 'Filing Cabinet 2-Drawer', category: 'Furniture', unit: 'units', price: 149.99 },
  'FURN-TABLE-CONF': { name: 'Conference Table 8ft', category: 'Furniture', unit: 'units', price: 799.99 },
  'APRL-SHIRT-M-BLU': { name: 'Dress Shirt Blue (M)', category: 'Apparel', unit: 'units', price: 49.99 },
  'APRL-SHIRT-L-BLU': { name: 'Dress Shirt Blue (L)', category: 'Apparel', unit: 'units', price: 49.99 },
  'APRL-PANTS-32-BLK': { name: 'Dress Pants Black (32)', category: 'Apparel', unit: 'units', price: 69.99 },
  'APRL-PANTS-34-BLK': { name: 'Dress Pants Black (34)', category: 'Apparel', unit: 'units', price: 69.99 },
  'APRL-JACKET-M': { name: 'Winter Jacket (M)', category: 'Apparel', unit: 'units', price: 129.99 },
  'APRL-SHOES-10-BRN': { name: 'Leather Shoes Brown (10)', category: 'Apparel', unit: 'pairs', price: 159.99 },
  'FOOD-RICE-5KG': { name: 'Premium Rice 5kg', category: 'Food & Beverage', unit: 'bags', price: 12.99 },
  'FOOD-PASTA-1KG': { name: 'Italian Pasta 1kg', category: 'Food & Beverage', unit: 'packs', price: 4.99 },
  'FOOD-OIL-1L': { name: 'Olive Oil 1L', category: 'Food & Beverage', unit: 'bottles', price: 8.99 },
  'FOOD-COFFEE-500G': { name: 'Ground Coffee 500g', category: 'Food & Beverage', unit: 'bags', price: 14.99 },
  'BEV-WATER-24PK': { name: 'Spring Water 24-Pack', category: 'Food & Beverage', unit: 'cases', price: 6.99 },
  'BEV-SODA-12PK': { name: 'Cola 12-Pack', category: 'Food & Beverage', unit: 'cases', price: 5.99 },
  'PHAR-VITAMIN-C': { name: 'Vitamin C 1000mg (60ct)', category: 'Pharmaceuticals', unit: 'bottles', price: 12.99 },
  'PHAR-PAIN-REL': { name: 'Pain Reliever (100ct)', category: 'Pharmaceuticals', unit: 'bottles', price: 9.99 },
  'PHAR-BANDAGE-50': { name: 'Adhesive Bandages (50ct)', category: 'Pharmaceuticals', unit: 'boxes', price: 7.99 },
  'PHAR-SANITIZER-1L': { name: 'Hand Sanitizer 1L', category: 'Pharmaceuticals', unit: 'bottles', price: 8.99 },
  'AUTO-OIL-5W30': { name: 'Motor Oil 5W-30 (5qt)', category: 'Automotive', unit: 'jugs', price: 28.99 },
  'AUTO-FILTER-OIL': { name: 'Oil Filter Universal', category: 'Automotive', unit: 'units', price: 9.99 },
  'AUTO-BRAKE-PAD': { name: 'Brake Pads (Set)', category: 'Automotive', unit: 'sets', price: 49.99 },
  'AUTO-BATTERY-12V': { name: 'Car Battery 12V', category: 'Automotive', unit: 'units', price: 129.99 },
  'AUTO-TIRE-205': { name: 'Tire 205/55R16', category: 'Automotive', unit: 'units', price: 89.99 },
  'OFFC-PAPER-A4': { name: 'Copy Paper A4 (500 sheets)', category: 'Office Supplies', unit: 'reams', price: 8.99 },
  'OFFC-PEN-BLK-12': { name: 'Ballpoint Pens Black (12pk)', category: 'Office Supplies', unit: 'packs', price: 6.99 },
  'OFFC-STAPLER': { name: 'Heavy Duty Stapler', category: 'Office Supplies', unit: 'units', price: 19.99 },
  'OFFC-FOLDER-100': { name: 'Manila Folders (100ct)', category: 'Office Supplies', unit: 'boxes', price: 24.99 },
};

// ============================================
// LOCATIONS
// ============================================
const LOCATIONS = {
  warehouses: ['WAREHOUSE-NORTH-01', 'WAREHOUSE-SOUTH-02', 'WAREHOUSE-EAST-03', 'WAREHOUSE-WEST-04', 'DISTRIBUTION-CENTER-MAIN', 'DISTRIBUTION-CENTER-REGIONAL'],
  stores: ['STORE-DOWNTOWN-001', 'STORE-MALL-002', 'STORE-SUBURB-003', 'STORE-AIRPORT-004', 'RETAIL-OUTLET-005', 'RETAIL-OUTLET-006'],
  other: ['SUPPLIER-INTL-A', 'SUPPLIER-LOCAL-B', 'RETURNS-CENTER', 'QUALITY-CONTROL']
};
const ALL_LOCATIONS = [...LOCATIONS.warehouses, ...LOCATIONS.stores, ...LOCATIONS.other];

// ============================================
// STATUS DEFINITIONS
// ============================================
const TRANSFER_STATUSES = {
  REQUESTED: { label: 'Requested', key: 'requested', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Confirmed', key: 'confirmed', next: 'IN_TRANSIT' },
  IN_TRANSIT: { label: 'In Transit', key: 'inTransit', next: 'DELIVERED' },
  DELIVERED: { label: 'Delivered', key: 'delivered', next: null },
  CANCELLED: { label: 'Cancelled', key: 'cancelled', next: null },
  FAILED: { label: 'Failed', key: 'failed', next: null },
};

// ============================================
// GENERATE MOCK INVENTORY
// ============================================
const generateInventory = () => {
  const inventory = [];
  ALL_LOCATIONS.forEach(location => {
    Object.keys(PRODUCT_CATALOG).forEach(sku => {
      if (Math.random() > 0.3) {
        inventory.push({
          id: `${location}-${sku}`,
          location,
          sku,
          quantity: Math.floor(Math.random() * 200) + 10,
          minStock: Math.floor(Math.random() * 20) + 5,
          lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    });
  });
  return inventory;
};

// ============================================
// STYLE HOOKS
// ============================================
const useTableStyles = () => {
  const { theme } = useTheme();
  return {
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px 16px', borderBottom: `1px solid ${theme.colors.border.subtle}`, color: theme.colors.text.muted, fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' },
    td: { padding: '14px 16px', borderBottom: `1px solid ${theme.colors.border.subtle}`, color: theme.colors.text.secondary, fontSize: '13px' },
  };
};

const useInputStyles = () => {
  const { theme } = useTheme();
  return {
    input: { width: '100%', padding: '10px 14px', background: theme.colors.bg.primary, border: `1px solid ${theme.colors.border.default}`, borderRadius: '8px', color: theme.colors.text.primary, fontSize: '14px', outline: 'none' },
    label: { display: 'block', fontSize: '13px', color: theme.colors.text.tertiary, marginBottom: '8px', fontWeight: '500' },
  };
};

// ============================================
// REUSABLE COMPONENTS
// ============================================
const ThemeToggle = () => {
  const { themeName, setThemeName, theme } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: theme.colors.bg.primary, borderRadius: '8px', marginBottom: '20px' }}>
      <span style={{ fontSize: '12px', color: themeName === 'professional' ? theme.colors.text.primary : theme.colors.text.muted, fontWeight: themeName === 'professional' ? '600' : '400' }}>Pro</span>
      <button onClick={() => setThemeName(themeName === 'professional' ? 'vibrant' : 'professional')} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', background: themeName === 'vibrant' ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : theme.colors.bg.tertiary, cursor: 'pointer', position: 'relative', transition: 'background 0.3s ease' }}>
        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: themeName === 'vibrant' ? '23px' : '3px', transition: 'left 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
      </button>
      <span style={{ fontSize: '12px', color: themeName === 'vibrant' ? theme.colors.text.primary : theme.colors.text.muted, fontWeight: themeName === 'vibrant' ? '600' : '400' }}>Vibrant</span>
    </div>
  );
};

const StatusBadge = ({ status, size = 'normal' }) => {
  const { theme } = useTheme();
  const config = TRANSFER_STATUSES[status] || TRANSFER_STATUSES.REQUESTED;
  const statusColors = theme.colors.status[config.key] || theme.colors.status.requested;
  const icon = theme.icons.status[status];
  const isSmall = size === 'small';
  return (
    <span style={{ padding: isSmall ? '4px 10px' : '6px 12px', borderRadius: '20px', fontSize: isSmall ? '11px' : '12px', fontWeight: '600', backgroundColor: statusColors.bg, color: statusColors.color, border: theme.useGradients ? `1px solid ${statusColors.color}30` : 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: theme.useGradients ? '12px' : '8px' }}>{icon}</span>
      {config.label}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const { theme } = useTheme();
  const color = theme.colors.roles[role] || theme.colors.roles.VIEWER;
  const roleName = ROLES[role]?.name || role;
  return <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', backgroundColor: `${color}20`, color: color }}>{roleName}</span>;
};

const Card = ({ children, style = {} }) => {
  const { theme } = useTheme();
  return (
    <div style={{ background: theme.useGradients ? `linear-gradient(145deg, ${theme.colors.bg.secondary} 0%, ${theme.colors.bg.tertiary} 100%)` : theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.subtle}`, borderRadius: '12px', padding: '24px', ...style }}>
      {children}
    </div>
  );
};

const StatsCard = ({ label, value, subtext, iconKey }) => {
  const { theme, themeName } = useTheme();
  const icon = theme.icons.stats[iconKey];
  return (
    <div style={{ background: theme.useGradients ? `linear-gradient(145deg, ${theme.colors.bg.secondary} 0%, ${theme.colors.bg.tertiary} 100%)` : theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.subtle}`, borderRadius: '12px', padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '11px', color: theme.colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{label}</div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: theme.colors.text.primary, letterSpacing: '-1px' }}>{value}</div>
          {subtext && <div style={{ fontSize: '12px', color: theme.colors.text.tertiary, marginTop: '4px' }}>{subtext}</div>}
        </div>
        {themeName === 'vibrant' && icon && (
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${theme.colors.accent.primary}15`, border: `1px solid ${theme.colors.accent.primary}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{icon}</div>
        )}
      </div>
    </div>
  );
};

// ============================================
// LOGIN PAGE
// ============================================
const LoginPage = ({ onLogin }) => {
  const { theme, themeName } = useTheme();
  const inputStyles = useInputStyles();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = DEMO_USERS.find(u => u.username === username && u.password === password);
    if (user) { onLogin(user); } else { setError('Invalid credentials'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.bg.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <Card style={{ width: '400px', padding: '40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: theme.colors.text.primary, background: theme.useGradients ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' : 'none', WebkitBackgroundClip: theme.useGradients ? 'text' : 'unset', WebkitTextFillColor: theme.useGradients ? 'transparent' : 'unset' }}>
            {themeName === 'vibrant' && '⛓️ '}Supply Chain Ledger
          </h1>
          <p style={{ color: theme.colors.text.tertiary, marginTop: '8px', fontSize: '14px' }}>Sign in to continue</p>
        </div>
        <div style={{ marginBottom: '24px' }}><ThemeToggle /></div>
        {error && <div style={{ background: theme.colors.status.error.bg, border: `1px solid ${theme.colors.status.error.color}30`, borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', color: theme.colors.status.error.color, fontSize: '13px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={inputStyles.label}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyles.input} placeholder="Enter username" required />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={inputStyles.label}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyles.input} placeholder="Enter password" required />
          </div>
          <button type="submit" style={{ width: '100%', padding: '12px 20px', background: theme.useGradients ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : theme.colors.text.primary, border: 'none', borderRadius: '8px', color: theme.useGradients ? '#fff' : theme.colors.bg.primary, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Sign In</button>
        </form>
        <div style={{ marginTop: '32px', padding: '16px', background: theme.colors.bg.primary, borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: theme.colors.text.muted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Demo Accounts</div>
          {DEMO_USERS.map(user => (
            <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${theme.colors.border.subtle}`, fontSize: '12px' }}>
              <span style={{ color: theme.colors.text.secondary, fontFamily: 'monospace' }}>{user.username}</span>
              <RoleBadge role={user.role} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ============================================
// SIDEBAR
// ============================================
const Sidebar = ({ currentPage, setCurrentPage, user, onLogout }) => {
  const { theme, themeName } = useTheme();
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', permission: null },
    { id: 'transfers', label: 'Transfers', permission: 'view_transfers' },
    { id: 'new-transfer', label: 'New Transfer', permission: 'create_transfer' },
    { id: 'inventory', label: 'Inventory', permission: 'view_inventory' },
    { id: 'reports', label: 'Reports', permission: 'view_reports' },
    { id: 'users', label: 'Users', permission: 'all' },
  ];
  const visibleItems = navItems.filter(item => !item.permission || hasPermission(user, item.permission));

  return (
    <div style={{ width: '250px', background: theme.useGradients ? `linear-gradient(180deg, ${theme.colors.bg.secondary} 0%, ${theme.colors.bg.primary} 100%)` : theme.colors.bg.secondary, borderRight: `1px solid ${theme.colors.border.subtle}`, height: '100vh', position: 'fixed', left: 0, top: 0, padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: theme.colors.text.primary, background: theme.useGradients ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' : 'none', WebkitBackgroundClip: theme.useGradients ? 'text' : 'unset', WebkitTextFillColor: theme.useGradients ? 'transparent' : 'unset' }}>
          {themeName === 'vibrant' && '⛓️ '}Supply Chain
        </h1>
        <p style={{ color: theme.colors.text.muted, fontSize: '12px', marginTop: '4px' }}>Blockchain Ledger</p>
      </div>
      <div style={{ padding: '0 12px' }}><ThemeToggle /></div>
      <nav style={{ flex: 1 }}>
        {visibleItems.map(item => {
          const isActive = currentPage === item.id;
          const icon = theme.icons.nav[item.id];
          return (
            <button key={item.id} onClick={() => setCurrentPage(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 20px', background: isActive ? (theme.useGradients ? `linear-gradient(90deg, ${theme.colors.accent.primary}20 0%, transparent 100%)` : theme.colors.bg.tertiary) : 'transparent', border: 'none', borderLeft: isActive ? `3px solid ${theme.useGradients ? theme.colors.accent.primary : theme.colors.text.primary}` : '3px solid transparent', color: isActive ? theme.colors.text.primary : theme.colors.text.tertiary, fontSize: '14px', fontWeight: isActive ? '500' : '400', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}>
              {themeName === 'vibrant' && icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
              {item.label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: '20px', borderTop: `1px solid ${theme.colors.border.subtle}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          {themeName === 'vibrant' && <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${theme.colors.roles[user.role]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>👤</div>}
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: theme.colors.text.primary, marginBottom: '4px' }}>{user.name}</div>
            <RoleBadge role={user.role} />
          </div>
        </div>
        <button onClick={onLogout} style={{ width: '100%', padding: '8px', background: 'transparent', border: `1px solid ${theme.colors.border.default}`, borderRadius: '8px', color: theme.colors.text.secondary, fontSize: '13px', cursor: 'pointer' }}>Sign Out</button>
      </div>
    </div>
  );
};

// ============================================
// DASHBOARD PAGE
// ============================================
const DashboardPage = ({ transfers, inventory, user }) => {
  const { theme, themeName } = useTheme();
  const tableStyles = useTableStyles();
  const stats = {
    total: transfers.length,
    pending: transfers.filter(t => ['REQUESTED', 'CONFIRMED'].includes(t.status)).length,
    inTransit: transfers.filter(t => t.status === 'IN_TRANSIT').length,
    delivered: transfers.filter(t => t.status === 'DELIVERED').length,
    lowStock: inventory.filter(i => i.quantity <= i.minStock).length,
  };
  const recentTransfers = transfers.slice(0, 5);
  const lowStockItems = inventory.filter(i => i.quantity <= i.minStock).slice(0, 5);

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: theme.colors.text.primary }}>{themeName === 'vibrant' && '📊 '}Dashboard</h1>
        <p style={{ color: theme.colors.text.tertiary, marginTop: '8px', fontSize: '14px' }}>Welcome back, {user.name.split(' ')[0]}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatsCard label="Total Transfers" value={stats.total} subtext="All time" iconKey="total" />
        <StatsCard label="Pending" value={stats.pending} subtext="Awaiting action" iconKey="pending" />
        <StatsCard label="In Transit" value={stats.inTransit} subtext="On the way" iconKey="inTransit" />
        <StatsCard label="Delivered" value={stats.delivered} subtext="Completed" iconKey="delivered" />
        <StatsCard label="Low Stock" value={stats.lowStock} subtext="Need attention" iconKey="lowStock" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <Card>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: '500', color: theme.colors.text.primary }}>{themeName === 'vibrant' && '📦 '}Recent Transfers</h3>
          {recentTransfers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.colors.text.muted, fontSize: '14px' }}>No transfers yet</div>
          ) : (
            <table style={tableStyles.table}>
              <thead><tr><th style={tableStyles.th}>ID</th><th style={tableStyles.th}>Route</th><th style={tableStyles.th}>Status</th><th style={tableStyles.th}>Date</th></tr></thead>
              <tbody>
                {recentTransfers.map(t => (
                  <tr key={t.transferId}>
                    <td style={tableStyles.td}><span style={{ fontFamily: 'monospace', color: themeName === 'vibrant' ? theme.colors.accent.primary : theme.colors.text.primary }}>{t.transferId}</span></td>
                    <td style={tableStyles.td}><span style={{ color: theme.colors.text.tertiary }}>{t.fromLocation}</span><span style={{ color: theme.colors.text.muted, margin: '0 8px' }}>→</span><span style={{ color: theme.colors.text.secondary }}>{t.toLocation}</span></td>
                    <td style={tableStyles.td}><StatusBadge status={t.status} size="small" /></td>
                    <td style={tableStyles.td}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: '500', color: theme.colors.text.primary }}>{themeName === 'vibrant' && '⚠️ '}Low Stock Alerts</h3>
          {lowStockItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.colors.text.muted, fontSize: '14px' }}>No low stock items</div>
          ) : (
            lowStockItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
                <div>
                  <div style={{ fontSize: '13px', color: theme.colors.text.primary, marginBottom: '2px' }}>{PRODUCT_CATALOG[item.sku]?.name || item.sku}</div>
                  <div style={{ fontSize: '12px', color: theme.colors.text.muted }}>{item.location}</div>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: '6px', background: theme.colors.status.error.bg, color: theme.colors.status.error.color, fontSize: '12px', fontWeight: '600', border: theme.useGradients ? `1px solid ${theme.colors.status.error.color}30` : 'none' }}>{item.quantity} left</div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
};

// ============================================
// TRANSFERS PAGE
// ============================================
const TransfersPage = ({ transfers, setTransfers, user }) => {
  const { theme, themeName } = useTheme();
  const tableStyles = useTableStyles();
  const [filter, setFilter] = useState('all');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const filteredTransfers = filter === 'all' ? transfers : transfers.filter(t => t.status === filter);

  const handleStatusUpdate = async (transferId, newStatus) => {
    try {
      await fetch(`${API_BASE}/transfers/${transferId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    } catch (err) { /* continue anyway */ }
    setTransfers(transfers.map(t => t.transferId === transferId ? { ...t, status: newStatus } : t));
    setSelectedTransfer(prev => prev ? { ...prev, status: newStatus } : null);
  };

  const canUpdateStatus = (transfer) => {
    if (hasPermission(user, 'all')) return true;
    if (['DELIVERED', 'CANCELLED', 'FAILED'].includes(transfer.status)) return false;
    if (hasPermission(user, 'approve_transfer') && transfer.status === 'REQUESTED') return true;
    if (hasPermission(user, 'update_status') && ['CONFIRMED', 'IN_TRANSIT'].includes(transfer.status)) return true;
    return false;
  };
  const canCancel = (transfer) => !['DELIVERED', 'CANCELLED', 'FAILED'].includes(transfer.status) && hasPermission(user, 'cancel_transfer');
  const filterTabs = ['all', 'REQUESTED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}><h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: theme.colors.text.primary }}>{themeName === 'vibrant' && '📦 '}Transfers</h1></div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
        {filterTabs.map(status => (
          <button key={status} onClick={() => setFilter(status)} style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: filter === status ? `2px solid ${theme.useGradients ? theme.colors.accent.primary : theme.colors.text.primary}` : '2px solid transparent', color: filter === status ? theme.colors.text.primary : theme.colors.text.muted, fontSize: '13px', fontWeight: '500', cursor: 'pointer', marginBottom: '-1px' }}>
            {status === 'all' ? 'All' : TRANSFER_STATUSES[status]?.label}<span style={{ marginLeft: '8px', color: theme.colors.text.muted, fontSize: '12px' }}>{status === 'all' ? transfers.length : transfers.filter(t => t.status === status).length}</span>
          </button>
        ))}
      </div>
      <Card>
        <table style={tableStyles.table}>
          <thead><tr><th style={tableStyles.th}>ID</th><th style={tableStyles.th}>From</th><th style={tableStyles.th}>To</th><th style={tableStyles.th}>Status</th><th style={tableStyles.th}>Block</th><th style={tableStyles.th}>Date</th><th style={tableStyles.th}>Actions</th></tr></thead>
          <tbody>
            {filteredTransfers.map(t => (
              <tr key={t.transferId} style={{ cursor: 'pointer' }} onClick={() => setSelectedTransfer(t)}>
                <td style={tableStyles.td}><span style={{ fontFamily: 'monospace', color: themeName === 'vibrant' ? theme.colors.accent.primary : theme.colors.text.primary }}>{t.transferId}</span></td>
                <td style={tableStyles.td}>{t.fromLocation}</td>
                <td style={tableStyles.td}>{t.toLocation}</td>
                <td style={tableStyles.td}><StatusBadge status={t.status} size="small" /></td>
                <td style={tableStyles.td}><span style={{ fontFamily: 'monospace', color: theme.colors.text.tertiary }}>#{t.blockNumber || '—'}</span></td>
                <td style={tableStyles.td}>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td style={tableStyles.td} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {canUpdateStatus(t) && TRANSFER_STATUSES[t.status]?.next && <button onClick={() => handleStatusUpdate(t.transferId, TRANSFER_STATUSES[t.status].next)} style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${theme.colors.border.default}`, background: 'transparent', color: theme.colors.text.secondary, fontSize: '12px', cursor: 'pointer' }}>{TRANSFER_STATUSES[TRANSFER_STATUSES[t.status].next]?.label}</button>}
                    {canCancel(t) && <button onClick={() => handleStatusUpdate(t.transferId, 'CANCELLED')} style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${theme.colors.status.error.color}30`, background: 'transparent', color: theme.colors.status.error.color, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {selectedTransfer && <TransferModal transfer={selectedTransfer} onClose={() => setSelectedTransfer(null)} onStatusUpdate={handleStatusUpdate} canUpdate={canUpdateStatus(selectedTransfer)} canCancel={canCancel(selectedTransfer)} />}
    </div>
  );
};

// ============================================
// TRANSFER MODAL
// ============================================
const TransferModal = ({ transfer, onClose, onStatusUpdate, canUpdate, canCancel }) => {
  const { theme, themeName } = useTheme();
  const statusConfig = TRANSFER_STATUSES[transfer.status];
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <Card style={{ maxWidth: '560px', width: '90%', maxHeight: '80vh', overflow: 'auto', padding: '32px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', color: theme.colors.text.muted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transfer Details</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: themeName === 'vibrant' ? theme.colors.accent.primary : theme.colors.text.primary, fontFamily: 'monospace' }}>{transfer.transferId}</div>
          </div>
          <button onClick={onClose} style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${theme.colors.border.default}`, borderRadius: '6px', color: theme.colors.text.secondary, fontSize: '16px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: theme.colors.bg.primary, borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: theme.colors.text.muted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>From</div>
            <div style={{ fontSize: '14px', color: theme.colors.text.primary, fontWeight: '500' }}>{transfer.fromLocation}</div>
          </div>
          <div style={{ background: theme.colors.bg.primary, borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: theme.colors.text.muted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>To</div>
            <div style={{ fontSize: '14px', color: theme.colors.text.primary, fontWeight: '500' }}>{transfer.toLocation}</div>
          </div>
        </div>
        <div style={{ background: theme.colors.bg.primary, borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: theme.colors.text.muted, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{themeName === 'vibrant' && '⛓️ '}Blockchain Verification</div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: theme.colors.text.tertiary, marginBottom: '6px' }}>Transaction Hash</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.colors.text.secondary, background: theme.colors.bg.secondary, padding: '10px 12px', borderRadius: '6px', wordBreak: 'break-all', border: `1px solid ${theme.colors.border.subtle}` }}>{transfer.txHash || 'Pending...'}</div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: theme.colors.text.tertiary, marginBottom: '6px' }}>Items Hash</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.colors.text.secondary, background: theme.colors.bg.secondary, padding: '10px 12px', borderRadius: '6px', wordBreak: 'break-all', border: `1px solid ${theme.colors.border.subtle}` }}>{transfer.itemsHash || '—'}</div>
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div><div style={{ fontSize: '11px', color: theme.colors.text.tertiary, marginBottom: '6px' }}>Block Number</div><div style={{ fontSize: '18px', color: theme.colors.text.primary, fontWeight: '600', fontFamily: 'monospace' }}>#{transfer.blockNumber || '—'}</div></div>
            <div><div style={{ fontSize: '11px', color: theme.colors.text.tertiary, marginBottom: '6px' }}>Status</div><StatusBadge status={transfer.status} /></div>
          </div>
        </div>
        {(canUpdate || canCancel) && (
          <div style={{ display: 'flex', gap: '12px' }}>
            {canUpdate && statusConfig?.next && <button onClick={() => onStatusUpdate(transfer.transferId, statusConfig.next)} style={{ padding: '12px 24px', background: theme.useGradients ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : theme.colors.text.primary, border: 'none', borderRadius: '8px', color: theme.useGradients ? '#fff' : theme.colors.bg.primary, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Mark as {TRANSFER_STATUSES[statusConfig.next]?.label}</button>}
            {canCancel && <button onClick={() => onStatusUpdate(transfer.transferId, 'CANCELLED')} style={{ padding: '12px 24px', background: 'transparent', border: `1px solid ${theme.colors.status.error.color}30`, borderRadius: '8px', color: theme.colors.status.error.color, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel Transfer</button>}
          </div>
        )}
      </Card>
    </div>
  );
};

// ============================================
// NEW TRANSFER PAGE
// ============================================
const NewTransferPage = ({ onTransferCreated }) => {
  const { theme, themeName } = useTheme();
  const inputStyles = useInputStyles();
  const [formData, setFormData] = useState({ transferId: `TRF-${Date.now().toString().slice(-6)}`, fromLocation: '', toLocation: '', items: [{ sku: '', qty: 1 }] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddItem = () => setFormData({ ...formData, items: [...formData.items, { sku: '', qty: 1 }] });
  const handleRemoveItem = (index) => { if (formData.items.length > 1) setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) }); };
  const handleItemChange = (index, field, value) => { const newItems = [...formData.items]; newItems[index][field] = field === 'qty' ? parseInt(value) || 1 : value; setFormData({ ...formData, items: newItems }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const response = await fetch(`${API_BASE}/transfers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (response.status === 409) throw new Error('Transfer ID already exists');
      if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || 'Failed to create transfer'); }
      const result = await response.json();
      onTransferCreated(result);
      setSuccess(`Transfer ${result.transferId} created successfully`);
      setFormData({ transferId: `TRF-${Date.now().toString().slice(-6)}`, fromLocation: '', toLocation: '', items: [{ sku: '', qty: 1 }] });
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: theme.colors.text.primary }}>{themeName === 'vibrant' && '➕ '}New Transfer</h1>
        <p style={{ color: theme.colors.text.tertiary, marginTop: '8px', fontSize: '14px' }}>Create a blockchain-verified transfer request</p>
      </div>
      <Card style={{ maxWidth: '640px' }}>
        {error && <div style={{ background: theme.colors.status.error.bg, border: `1px solid ${theme.colors.status.error.color}30`, borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', color: theme.colors.status.error.color, fontSize: '13px' }}>{error}</div>}
        {success && <div style={{ background: theme.colors.status.delivered.bg, border: `1px solid ${theme.colors.status.delivered.color}30`, borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', color: theme.colors.status.delivered.color, fontSize: '13px' }}>{themeName === 'vibrant' && '✓ '}{success}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}><label style={inputStyles.label}>Transfer ID</label><input type="text" value={formData.transferId} onChange={(e) => setFormData({ ...formData, transferId: e.target.value })} style={inputStyles.input} required /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div><label style={inputStyles.label}>From Location</label><select value={formData.fromLocation} onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })} style={inputStyles.input} required><option value="">Select location</option><optgroup label="Warehouses">{LOCATIONS.warehouses.map(loc => <option key={loc} value={loc}>{loc}</option>)}</optgroup><optgroup label="Stores">{LOCATIONS.stores.map(loc => <option key={loc} value={loc}>{loc}</option>)}</optgroup><optgroup label="Other">{LOCATIONS.other.map(loc => <option key={loc} value={loc}>{loc}</option>)}</optgroup></select></div>
            <div><label style={inputStyles.label}>To Location</label><select value={formData.toLocation} onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })} style={inputStyles.input} required><option value="">Select location</option><optgroup label="Warehouses">{LOCATIONS.warehouses.map(loc => <option key={loc} value={loc}>{loc}</option>)}</optgroup><optgroup label="Stores">{LOCATIONS.stores.map(loc => <option key={loc} value={loc}>{loc}</option>)}</optgroup><optgroup label="Other">{LOCATIONS.other.map(loc => <option key={loc} value={loc}>{loc}</option>)}</optgroup></select></div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}><label style={{ ...inputStyles.label, marginBottom: 0 }}>Items</label><button type="button" onClick={handleAddItem} style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${theme.colors.border.default}`, borderRadius: '6px', color: theme.colors.text.secondary, fontSize: '12px', cursor: 'pointer' }}>+ Add Item</button></div>
            {formData.items.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <select value={item.sku} onChange={(e) => handleItemChange(index, 'sku', e.target.value)} style={{ ...inputStyles.input, flex: 2 }} required><option value="">Select product</option>{Object.entries(PRODUCT_CATALOG).map(([sku, product]) => <option key={sku} value={sku}>{sku} — {product.name}</option>)}</select>
                <input type="number" min="1" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} style={{ ...inputStyles.input, flex: 1 }} placeholder="Qty" required />
                {formData.items.length > 1 && <button type="button" onClick={() => handleRemoveItem(index)} style={{ padding: '10px 14px', background: 'transparent', border: `1px solid ${theme.colors.status.error.color}30`, borderRadius: '6px', color: theme.colors.status.error.color, cursor: 'pointer' }}>✕</button>}
              </div>
            ))}
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px 24px', background: theme.useGradients ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : theme.colors.text.primary, border: 'none', borderRadius: '8px', color: theme.useGradients ? '#fff' : theme.colors.bg.primary, fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? 'Creating Transfer...' : 'Create Transfer'}</button>
        </form>
      </Card>
    </div>
  );
};

// ============================================
// INVENTORY PAGE
// ============================================
const InventoryPage = ({ inventory }) => {
  const { theme, themeName } = useTheme();
  const tableStyles = useTableStyles();
  const inputStyles = useInputStyles();
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const categories = [...new Set(Object.values(PRODUCT_CATALOG).map(p => p.category))];

  const filteredInventory = inventory.filter(item => {
    if (locationFilter !== 'all' && item.location !== locationFilter) return false;
    if (categoryFilter !== 'all' && PRODUCT_CATALOG[item.sku]?.category !== categoryFilter) return false;
    if (searchTerm) { const product = PRODUCT_CATALOG[item.sku]; const searchLower = searchTerm.toLowerCase(); if (!item.sku.toLowerCase().includes(searchLower) && !product?.name.toLowerCase().includes(searchLower) && !item.location.toLowerCase().includes(searchLower)) return false; }
    return true;
  });
  const totalValue = filteredInventory.reduce((sum, item) => sum + ((PRODUCT_CATALOG[item.sku]?.price || 0) * item.quantity), 0);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: theme.colors.text.primary }}>{themeName === 'vibrant' && '📋 '}Inventory</h1>
        <p style={{ color: theme.colors.text.tertiary, marginTop: '8px', fontSize: '14px' }}>Total Value: <span style={{ color: themeName === 'vibrant' ? theme.colors.status.delivered.color : theme.colors.text.primary, fontWeight: '600' }}>${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search SKU, product, or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inputStyles.input, flex: '1 1 300px' }} />
        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{ ...inputStyles.input, flex: '0 0 200px' }}><option value="all">All Locations</option>{ALL_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ ...inputStyles.input, flex: '0 0 180px' }}><option value="all">All Categories</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
      </div>
      <Card>
        <table style={tableStyles.table}>
          <thead><tr><th style={tableStyles.th}>SKU</th><th style={tableStyles.th}>Product</th><th style={tableStyles.th}>Location</th><th style={tableStyles.th}>Quantity</th><th style={tableStyles.th}>Status</th><th style={tableStyles.th}>Value</th></tr></thead>
          <tbody>
            {filteredInventory.slice(0, 50).map(item => {
              const product = PRODUCT_CATALOG[item.sku];
              const isLowStock = item.quantity <= item.minStock;
              return (
                <tr key={item.id}>
                  <td style={tableStyles.td}><span style={{ fontFamily: 'monospace', color: themeName === 'vibrant' ? theme.colors.accent.primary : theme.colors.text.primary }}>{item.sku}</span></td>
                  <td style={tableStyles.td}>{product?.name || item.sku}</td>
                  <td style={{ ...tableStyles.td, color: theme.colors.text.tertiary }}>{item.location}</td>
                  <td style={tableStyles.td}><span style={{ fontWeight: '500', color: isLowStock ? theme.colors.status.error.color : theme.colors.text.primary }}>{item.quantity}</span><span style={{ color: theme.colors.text.muted, fontSize: '12px', marginLeft: '4px' }}>{product?.unit}</span></td>
                  <td style={tableStyles.td}>{isLowStock ? <span style={{ color: theme.colors.status.error.color, fontSize: '12px', fontWeight: '500' }}>{themeName === 'vibrant' && '⚠️ '}Low Stock</span> : <span style={{ color: themeName === 'vibrant' ? theme.colors.status.delivered.color : theme.colors.text.tertiary, fontSize: '12px' }}>{themeName === 'vibrant' && '✓ '}In Stock</span>}</td>
                  <td style={tableStyles.td}>${((product?.price || 0) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredInventory.length > 50 && <div style={{ textAlign: 'center', padding: '16px', color: theme.colors.text.muted, fontSize: '13px' }}>Showing 50 of {filteredInventory.length} items</div>}
      </Card>
    </div>
  );
};

// ============================================
// REPORTS PAGE
// ============================================
const ReportsPage = ({ transfers, inventory }) => {
  const { theme, themeName } = useTheme();
  const tableStyles = useTableStyles();
  const locationStats = ALL_LOCATIONS.slice(0, 8).map(location => {
    const items = inventory.filter(i => i.location === location);
    const totalValue = items.reduce((sum, i) => sum + (i.quantity * (PRODUCT_CATALOG[i.sku]?.price || 0)), 0);
    const lowStockCount = items.filter(i => i.quantity <= i.minStock).length;
    return { location, totalValue, lowStockCount };
  });
  const maxValue = Math.max(...locationStats.map(s => s.totalValue));
  const transfersByStatus = Object.keys(TRANSFER_STATUSES).map(status => ({ status, count: transfers.filter(t => t.status === status).length, config: TRANSFER_STATUSES[status] }));
  const categoryStats = Object.entries(inventory.reduce((acc, item) => { const category = PRODUCT_CATALOG[item.sku]?.category || 'Other'; if (!acc[category]) acc[category] = { qty: 0, value: 0 }; acc[category].qty += item.quantity; acc[category].value += item.quantity * (PRODUCT_CATALOG[item.sku]?.price || 0); return acc; }, {})).map(([category, data]) => ({ category, ...data }));
  const statusIcons = { REQUESTED: '📋', CONFIRMED: '✓', IN_TRANSIT: '🚚', DELIVERED: '✓' };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}><h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: theme.colors.text.primary }}>{themeName === 'vibrant' && '📈 '}Reports</h1></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <Card>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '14px', fontWeight: '500', color: theme.colors.text.primary }}>{themeName === 'vibrant' && '📊 '}Stock Value by Location</h3>
          {locationStats.map(stat => (
            <div key={stat.location} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', color: theme.colors.text.secondary }}>{stat.location}</span><span style={{ fontSize: '12px', color: themeName === 'vibrant' ? theme.colors.status.delivered.color : theme.colors.text.primary, fontWeight: '500' }}>${stat.totalValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span></div>
              <div style={{ height: '8px', background: theme.colors.bg.primary, borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${(stat.totalValue / maxValue) * 100}%`, height: '100%', background: theme.useGradients ? `linear-gradient(90deg, ${theme.colors.accent.primary}, ${theme.colors.accent.secondary})` : theme.colors.text.tertiary, borderRadius: '4px' }} /></div>
            </div>
          ))}
        </Card>
        <Card>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '14px', fontWeight: '500', color: theme.colors.text.primary }}>{themeName === 'vibrant' && '📦 '}Transfer Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {transfersByStatus.filter(s => ['REQUESTED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED'].includes(s.status)).map(({ status, count, config }) => {
              const statusColors = theme.colors.status[config.key];
              return (
                <div key={status} style={{ background: theme.colors.bg.primary, border: `1px solid ${theme.colors.border.subtle}`, borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                  {themeName === 'vibrant' && <div style={{ fontSize: '20px', marginBottom: '8px' }}>{statusIcons[status]}</div>}
                  <div style={{ fontSize: '24px', fontWeight: '600', color: statusColors?.color || theme.colors.text.primary, marginBottom: '4px' }}>{count}</div>
                  <div style={{ fontSize: '11px', color: theme.colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{config.label}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: '500', color: theme.colors.text.primary }}>Inventory by Category</h3>
          <table style={tableStyles.table}><thead><tr><th style={tableStyles.th}>Category</th><th style={tableStyles.th}>Items</th><th style={tableStyles.th}>Value</th></tr></thead><tbody>{categoryStats.sort((a, b) => b.value - a.value).map(cat => <tr key={cat.category}><td style={tableStyles.td}>{cat.category}</td><td style={tableStyles.td}>{cat.qty.toLocaleString()}</td><td style={tableStyles.td}>${cat.value.toLocaleString('en-US', { minimumFractionDigits: 0 })}</td></tr>)}</tbody></table>
        </Card>
        <Card>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: '500', color: theme.colors.text.primary }}>{themeName === 'vibrant' && '⚠️ '}Low Stock by Location</h3>
          {locationStats.filter(s => s.lowStockCount > 0).length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: theme.colors.text.muted, fontSize: '14px' }}>No low stock alerts</div> : locationStats.filter(s => s.lowStockCount > 0).map(stat => <div key={stat.location} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${theme.colors.border.subtle}` }}><span style={{ color: theme.colors.text.secondary, fontSize: '13px' }}>{stat.location}</span><span style={{ padding: '4px 10px', borderRadius: '6px', background: theme.colors.status.error.bg, color: theme.colors.status.error.color, fontSize: '12px', fontWeight: '500' }}>{stat.lowStockCount} items</span></div>)}
        </Card>
      </div>
    </div>
  );
};

// ============================================
// USERS PAGE
// ============================================
const UsersPage = () => {
  const { theme, themeName } = useTheme();
  const tableStyles = useTableStyles();
  return (
    <div>
      <div style={{ marginBottom: '32px' }}><h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: theme.colors.text.primary }}>{themeName === 'vibrant' && '👥 '}Users</h1></div>
      <Card>
        <table style={tableStyles.table}><thead><tr><th style={tableStyles.th}>ID</th><th style={tableStyles.th}>Name</th><th style={tableStyles.th}>Username</th><th style={tableStyles.th}>Role</th><th style={tableStyles.th}>Location</th></tr></thead><tbody>{DEMO_USERS.map(user => <tr key={user.id}><td style={tableStyles.td}>{user.id}</td><td style={tableStyles.td}>{user.name}</td><td style={tableStyles.td}><span style={{ fontFamily: 'monospace', color: themeName === 'vibrant' ? theme.colors.accent.primary : theme.colors.text.primary }}>{user.username}</span></td><td style={tableStyles.td}><RoleBadge role={user.role} /></td><td style={tableStyles.td}>{user.location}</td></tr>)}</tbody></table>
      </Card>
      <Card style={{ marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: '500', color: theme.colors.text.primary }}>Permission Matrix</h3>
        <table style={tableStyles.table}><thead><tr><th style={tableStyles.th}>Role</th><th style={tableStyles.th}>Create</th><th style={tableStyles.th}>Cancel</th><th style={tableStyles.th}>Approve</th><th style={tableStyles.th}>Update</th><th style={tableStyles.th}>Transfers</th><th style={tableStyles.th}>Inventory</th><th style={tableStyles.th}>Reports</th></tr></thead><tbody>{Object.entries(ROLES).map(([key]) => <tr key={key}><td style={tableStyles.td}><RoleBadge role={key} /></td><td style={{ ...tableStyles.td, color: hasPermission({ role: key }, 'create_transfer') ? theme.colors.status.delivered.color : theme.colors.text.muted }}>{hasPermission({ role: key }, 'create_transfer') ? '✓' : '—'}</td><td style={{ ...tableStyles.td, color: hasPermission({ role: key }, 'cancel_transfer') ? theme.colors.status.delivered.color : theme.colors.text.muted }}>{hasPermission({ role: key }, 'cancel_transfer') ? '✓' : '—'}</td><td style={{ ...tableStyles.td, color: hasPermission({ role: key }, 'approve_transfer') ? theme.colors.status.delivered.color : theme.colors.text.muted }}>{hasPermission({ role: key }, 'approve_transfer') ? '✓' : '—'}</td><td style={{ ...tableStyles.td, color: hasPermission({ role: key }, 'update_status') ? theme.colors.status.delivered.color : theme.colors.text.muted }}>{hasPermission({ role: key }, 'update_status') ? '✓' : '—'}</td><td style={{ ...tableStyles.td, color: hasPermission({ role: key }, 'view_transfers') ? theme.colors.status.delivered.color : theme.colors.text.muted }}>{hasPermission({ role: key }, 'view_transfers') ? '✓' : '—'}</td><td style={{ ...tableStyles.td, color: hasPermission({ role: key }, 'view_inventory') ? theme.colors.status.delivered.color : theme.colors.text.muted }}>{hasPermission({ role: key }, 'view_inventory') ? '✓' : '—'}</td><td style={{ ...tableStyles.td, color: hasPermission({ role: key }, 'view_reports') ? theme.colors.status.delivered.color : theme.colors.text.muted }}>{hasPermission({ role: key }, 'view_reports') ? '✓' : '—'}</td></tr>)}</tbody></table>
      </Card>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [themeName, setThemeName] = useState(() => localStorage.getItem('theme') || 'professional');
  const [user, setUser] = useState(() => { const saved = localStorage.getItem('user'); return saved ? JSON.parse(saved) : null; });
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [transfers, setTransfers] = useState([]);
  const [inventory] = useState(() => generateInventory());
  const theme = themes[themeName];

  useEffect(() => { localStorage.setItem('theme', themeName); }, [themeName]);

  useEffect(() => {
    if (user) {
      fetch(`${API_BASE}/transfers`).then(res => res.ok ? res.json() : []).then(data => setTransfers(data)).catch(() => { const saved = localStorage.getItem('transfers'); if (saved) setTransfers(JSON.parse(saved)); });
    }
  }, [user]);

  useEffect(() => { if (transfers.length > 0) localStorage.setItem('transfers', JSON.stringify(transfers)); }, [transfers]);

  const handleLogin = (user) => { setUser(user); localStorage.setItem('user', JSON.stringify(user)); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('user'); setCurrentPage('dashboard'); };
  const handleTransferCreated = (newTransfer) => setTransfers([newTransfer, ...transfers]);

  if (!user) return <ThemeContext.Provider value={{ theme, themeName, setThemeName }}><LoginPage onLogin={handleLogin} /></ThemeContext.Provider>;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage transfers={transfers} inventory={inventory} user={user} />;
      case 'transfers': return hasPermission(user, 'view_transfers') ? <TransfersPage transfers={transfers} setTransfers={setTransfers} user={user} /> : <div style={{ textAlign: 'center', padding: '60px', color: theme.colors.text.muted }}>Access Denied</div>;
      case 'new-transfer': return hasPermission(user, 'create_transfer') ? <NewTransferPage onTransferCreated={handleTransferCreated} /> : <div style={{ textAlign: 'center', padding: '60px', color: theme.colors.text.muted }}>Access Denied</div>;
      case 'inventory': return hasPermission(user, 'view_inventory') ? <InventoryPage inventory={inventory} /> : <div style={{ textAlign: 'center', padding: '60px', color: theme.colors.text.muted }}>Access Denied</div>;
      case 'reports': return hasPermission(user, 'view_reports') ? <ReportsPage transfers={transfers} inventory={inventory} /> : <div style={{ textAlign: 'center', padding: '60px', color: theme.colors.text.muted }}>Access Denied</div>;
      case 'users': return hasPermission(user, 'all') ? <UsersPage /> : <div style={{ textAlign: 'center', padding: '60px', color: theme.colors.text.muted }}>Access Denied</div>;
      default: return <DashboardPage transfers={transfers} inventory={inventory} user={user} />;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName }}>
      <AuthContext.Provider value={{ user, hasPermission: (perm) => hasPermission(user, perm) }}>
        <div style={{ minHeight: '100vh', background: theme.colors.bg.primary, color: theme.colors.text.primary, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", transition: 'background 0.3s ease' }}>
          <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} user={user} onLogout={handleLogout} />
          <main style={{ marginLeft: '250px', padding: '32px 40px', minHeight: '100vh' }}>{renderPage()}</main>
        </div>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}
