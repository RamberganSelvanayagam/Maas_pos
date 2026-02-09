import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const productCount = await prisma.product.count();
  const lowStockCount = await prisma.product.count({
    where: { quantity: { lt: 5 } }
  });
  const todaySales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  const totalRevenue = todaySales.reduce((acc: number, sale: any) => acc + Number(sale.totalAmount), 0);

  return (
    <div className="container" style={{ padding: '1rem' }}>
      <div className="glass-card" style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        borderBottom: '4px solid var(--primary)',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(/l11.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <img src="/logo2.png" alt="Epicerie Maas Logo" style={{ width: '100px', height: '100px', borderRadius: '1.25rem', objectFit: 'cover', boxShadow: 'var(--shadow-lg)', zIndex: 1 }} />
        <div style={{ zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.025em', textShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>EPICERIE MAAS</h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-main)', fontWeight: 600, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Management System</p>
        </div>
        <div style={{ zIndex: 1, marginTop: '0.75rem', padding: '0.4rem 1rem', borderRadius: '2rem', background: 'var(--primary)', color: 'white', fontSize: '0.875rem', fontWeight: 700, boxShadow: 'var(--shadow-md)' }}>
          by Berg Technology
        </div>
      </div>

      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Overview</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '4px solid var(--primary)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Today's Revenue</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>${totalRevenue.toFixed(2)}</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '4px solid var(--success)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Today's Profit</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>+${(todaySales.reduce((acc, sale: any) => acc + (Number(sale.totalAmount) * 0.25), 0)).toFixed(2)}</span>
          <small style={{ fontSize: '0.65rem' }}>Estimated 25% margin</small>
        </div>
        <a href="/admin?filter=outofstock" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '4px solid var(--error)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Low Stock Alert</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: lowStockCount > 0 ? 'var(--error)' : 'inherit' }}>
              {lowStockCount} items
            </span>
          </div>
        </a>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
          </div>
          <div>
            <b style={{ display: 'block' }}>Business Intelligence</b>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Deep analysis of profits and shelf value.</span>
          </div>
        </div>
        <a href="/admin/reports" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>View Reports</a>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 700 }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
          <a href="/inventory" className="btn btn-primary" style={{ height: '5rem', flexDirection: 'column', gap: '0.5rem', borderRadius: 'var(--radius-md)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
            Inventory
          </a>
          <a href="/pos" className="btn btn-primary" style={{ height: '5rem', flexDirection: 'column', gap: '0.5rem', background: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            New Sale
          </a>
          <a href="/admin/bills" className="btn btn-primary" style={{ height: '5rem', flexDirection: 'column', gap: '0.5rem', background: 'var(--accent)', borderRadius: 'var(--radius-md)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="m17 5-5-3-5 3" /><path d="m17 19-5 3-5-3" /><path d="M2 12h20" /><path d="m5 7 3 5-3 5" /><path d="m19 7-3 5 3 5" /></svg>
            Bills
          </a>
        </div>
      </div>
    </div>
  );
}
