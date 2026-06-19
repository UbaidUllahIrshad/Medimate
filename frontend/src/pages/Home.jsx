import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, ShoppingCart, Calendar, AlertTriangle, Check, Info } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [requiresPrescription, setRequiresPrescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  
  // Feedback states
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState({});

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/medicines', {
        params: {
          search,
          requiresPrescription: requiresPrescription === '' ? undefined : requiresPrescription
        }
      });
      setMedicines(response.data.medicines);
      
      // Initialize default quantities of 1 for all fetched medicines
      const defaultQuants = {};
      response.data.medicines.forEach((med) => {
        defaultQuants[med.id] = 1;
      });
      setQuantities(defaultQuants);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [search, requiresPrescription]);

  const handleQuantityChange = (medicineId, value) => {
    setQuantities(prev => ({
      ...prev,
      [medicineId]: Math.max(1, value)
    }));
  };

  const showFeedback = (medicineId, message, isError = false) => {
    if (isError) {
      setErrorMsg(message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(prev => ({ ...prev, [medicineId]: message }));
      setTimeout(() => {
        setSuccessMsg(prev => {
          const updated = { ...prev };
          delete updated[medicineId];
          return updated;
        });
      }, 3000);
    }
  };

  const handleAddToCart = (medicine) => {
    const qty = quantities[medicine.id] || 1;
    if (medicine.stock_quantity < qty) {
      showFeedback(medicine.id, 'Insufficient stock available.', true);
      return;
    }

    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = cart.findIndex((item) => item.medicineId === medicine.id);

      if (existingItemIndex > -1) {
        const newQty = cart[existingItemIndex].quantity + qty;
        if (medicine.stock_quantity < newQty) {
          showFeedback(medicine.id, `Cannot add more. Total in cart (${newQty}) exceeds stock.`, true);
          return;
        }
        cart[existingItemIndex].quantity = newQty;
      } else {
        cart.push({
          medicineId: medicine.id,
          name: medicine.name,
          manufacturer: medicine.manufacturer,
          price: parseFloat(medicine.price),
          requiresPrescription: medicine.requires_prescription,
          quantity: qty,
          maxStock: medicine.stock_quantity
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));
      showFeedback(medicine.id, 'Added to cart!');
    } catch (e) {
      showFeedback(medicine.id, 'Failed to add to cart.', true);
    }
  };

  const handleSubscribe = async (medicine) => {
    if (!user) {
      showFeedback(medicine.id, 'Please sign in to subscribe to automatic refills.', true);
      return;
    }

    const qty = quantities[medicine.id] || 1;

    try {
      await axios.post('/api/subscriptions', {
        medicineId: medicine.id,
        quantity: qty,
        frequencyDays: 30 // Refill every 30 days
      });
      showFeedback(medicine.id, 'Subscribed successfully! Monthly refill scheduled.');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to subscribe.';
      showFeedback(medicine.id, msg, true);
    }
  };

  return (
    <div className="container">
      {/* Header and banner */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--primary-light) 0%, #e0f2fe 100%)', border: 'none', padding: '2.5rem 2rem' }}>
        <h1 style={{ fontSize: '2.25rem', color: 'var(--primary-hover)', marginBottom: '0.5rem' }}>Your Smart Digital Pharmacy</h1>
        <p style={{ color: 'var(--text-main)', opacity: 0.8, fontSize: '1.1rem', maxWidth: '600px' }}>
          Browse medical catalogs, upload prescriptions, check out securely, and subscribe to automatic monthly refills for your chronic treatments.
        </p>
      </div>

      {errorMsg && (
        <div className="alert alert-danger">
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Controls: Search and Filters */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search medicine, manufacturer, description..."
            style={{ paddingLeft: '2.5rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px' }}>
          <Filter size={18} style={{ color: 'var(--text-muted)' }} />
          <select
            className="form-control"
            value={requiresPrescription}
            onChange={(e) => setRequiresPrescription(e.target.value)}
          >
            <option value="">All Medicines</option>
            <option value="false">Over the Counter (OTC)</option>
            <option value="true">Prescription Required</option>
          </select>
        </div>
      </div>

      {/* Medicine grid catalog */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : medicines.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem var(--text-muted)' }}>
          <Info size={40} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <h3>No Medicines Found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try refining your search terms or filter selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3">
          {medicines.map((med) => {
            const isOutOfStock = med.stock_quantity <= 0;
            const inCartMsg = successMsg[med.id];

            return (
              <div key={med.id} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Medicine Picture */}
                <div style={{ 
                  height: '160px', 
                  backgroundColor: '#f3f4f6', 
                  margin: '-1rem -1rem 1rem -1rem', 
                  borderTopLeftRadius: 'calc(var(--radius-md) - 1px)', 
                  borderTopRightRadius: 'calc(var(--radius-md) - 1px)', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  position: 'relative',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  <img 
                    src={med.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop'} 
                    alt={med.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop';
                    }}
                  />
                </div>

                {/* Prescription indicator badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{med.manufacturer}</span>
                  {med.requires_prescription ? (
                    <span className="badge badge-danger" style={{ display: 'flex', gap: '0.25rem' }}>
                      <AlertTriangle size={12} /> RX Required
                    </span>
                  ) : (
                    <span className="badge badge-success">OTC</span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>{med.name}</h3>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flexGrow: 1, marginBottom: '1rem' }}>
                  {med.description}
                </p>

                {/* Pricing and Stock Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-hover)' }}>
                    Rs. {parseFloat(med.price).toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: isOutOfStock ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {isOutOfStock ? (
                      <strong>Out of Stock</strong>
                    ) : (
                      <span>Stock: <strong>{med.stock_quantity}</strong></span>
                    )}
                  </span>
                </div>

                {/* Operations UI (only if not logged in as Admin) */}
                {(!user || user.role === 'customer') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Qty:</span>
                      <input
                        type="number"
                        className="form-control"
                        style={{ width: '70px', padding: '0.35rem' }}
                        value={quantities[med.id] || 1}
                        onChange={(e) => handleQuantityChange(med.id, parseInt(e.target.value))}
                        min="1"
                        max={med.stock_quantity}
                        disabled={isOutOfStock}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleAddToCart(med)}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.5rem' }}
                        disabled={isOutOfStock || !!inCartMsg}
                      >
                        {inCartMsg === 'Added to cart!' ? (
                          <>
                            <Check size={16} /> Added
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} /> Add to Cart
                          </>
                        )}
                      </button>

                      {/* Subscribe to Refill Action */}
                      <button
                        onClick={() => handleSubscribe(med)}
                        className="btn btn-outline"
                        title="Subscribe to automatic monthly refills (every 30 days)"
                        style={{ padding: '0.5rem', minWidth: '40px' }}
                        disabled={isOutOfStock}
                      >
                        <Calendar size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {user && user.role === 'admin' && (
                  <div style={{ backgroundColor: 'var(--secondary-light)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Use Admin Dashboard to manage inventory</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Home;
