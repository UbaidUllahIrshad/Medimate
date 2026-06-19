import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShoppingCart, User, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const count = cart.reduce((acc, item) => acc + item.quantity, 0);
      setCartCount(count);
    } catch (e) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCartCount();
    window.addEventListener('cart-updated', updateCartCount);
    return () => {
      window.removeEventListener('cart-updated', updateCartCount);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cart-updated'));
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <Activity size={24} style={{ color: 'var(--primary)' }} />
          <span>MediMate</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>

          {user && user.role === 'customer' && (
            <>
              <Link to="/upload-rx" className={`nav-link ${location.pathname === '/upload-rx' ? 'active' : ''}`}>
                Upload Rx
              </Link>
              <Link to="/subscribe-save" className={`nav-link ${location.pathname === '/subscribe-save' ? 'active' : ''}`}>
                Subscribe & Save
              </Link>
              <Link to="/track-order" className={`nav-link ${location.pathname === '/track-order' ? 'active' : ''}`}>
                Track Order
              </Link>
              <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                Profile
              </Link>
            </>
          )}

          {user && user.role === 'admin' && (
            <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <LayoutDashboard size={18} />
              <span>Admin Dashboard</span>
            </Link>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user && user.role === 'customer' && (
            <>

              <Link to="/cart" className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', position: 'relative' }} title="Shopping Cart">
                <ShoppingCart size={20} style={{ color: 'var(--text-muted)' }} />
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    borderRadius: '50%',
                    padding: '1px 5px',
                  }}>
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <User size={16} />
                <strong>{user.name.split(' ')[0]}</strong>
              </span>
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '0.5rem' }}>
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
