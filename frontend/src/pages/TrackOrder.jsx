import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ClipboardList, Calendar, CheckCircle2, Truck, ShieldCheck, MapPin, RefreshCw, AlertCircle } from 'lucide-react';

const TrackOrder = () => {
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleMsg, setToggleMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordRes, subRes] = await Promise.all([
        axios.get('/api/orders/my'),
        axios.get('/api/subscriptions/my')
      ]);
      setOrders(ordRes.data.orders);
      setSubscriptions(subRes.data.subscriptions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSub = async (sub) => {
    try {
      const response = await axios.put(`/api/subscriptions/toggle/${sub.id}`, {
        isActive: !sub.is_active
      });
      setToggleMsg(response.data.message || 'Subscription toggled.');
      loadData();
      setTimeout(() => setToggleMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const getStepStatus = (order, step) => {
    const rxStatus = order.prescription_status;
    const hasRx = !!order.prescription_id;
    const status = order.status;

    if (status === 'rejected') {
      if (step === 'placed') return 'completed';
      if (step === 'verified') {
        return rxStatus === 'rejected' ? 'error' : 'disabled';
      }
      return 'disabled';
    }

    if (step === 'placed') {
      return 'completed';
    }

    if (step === 'verified') {
      if (!hasRx) return 'completed';
      if (rxStatus === 'approved') return 'completed';
      if (rxStatus === 'rejected') return 'error';
      return 'active';
    }

    if (step === 'dispatched') {
      if (status === 'dispatched' || status === 'delivered') return 'completed';
      if (status === 'approved') return 'active';
      return 'disabled';
    }

    if (step === 'delivered') {
      if (status === 'delivered') return 'completed';
      if (status === 'dispatched') return 'active';
      return 'disabled';
    }

    return 'disabled';
  };

  return (
    <div className="container">
      {/* Styles for visual tracking timeline */}
      <style>{`
        .timeline {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          margin: 2rem 0;
          padding: 0 1rem;
        }
        .timeline::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 4px;
          background-color: var(--border-color);
          z-index: 1;
          transform: translateY(-50%);
        }
        .timeline-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
          background-color: var(--bg-card);
          padding: 0 10px;
        }
        .timeline-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid var(--border-color);
          background-color: #ffffff;
          color: var(--text-light);
          transition: var(--transition);
        }
        .timeline-step.completed .timeline-icon {
          border-color: var(--success);
          background-color: var(--success-light);
          color: var(--success);
        }
        .timeline-step.active .timeline-icon {
          border-color: var(--warning);
          background-color: var(--warning-light);
          color: #d97706;
          animation: pulse 1.5s infinite;
        }
        .timeline-step.error .timeline-icon {
          border-color: var(--danger);
          background-color: var(--danger-light);
          color: var(--danger);
        }
        .timeline-label {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .timeline-step.completed .timeline-label {
          color: var(--text-main);
        }
        .timeline-step.active .timeline-label {
          color: #d97706;
        }
        .timeline-step.error .timeline-label {
          color: var(--danger);
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Track Orders & Refills</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time status tracking for prescription quotes, orders, and refill plans.</p>
        </div>
        <button onClick={loadData} className="btn btn-outline" style={{ display: 'flex', gap: '0.25rem', padding: '0.5rem 1rem' }}>
          <RefreshCw size={16} /> Refresh Tracking
        </button>
      </div>

      {toggleMsg && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{toggleMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div className="grid grid-cols-2" style={{ gridTemplateColumns: '1.2fr 0.8fr', alignItems: 'start' }}>
          
          {/* Left Side: Order Progress list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ClipboardList size={20} style={{ color: 'var(--primary)' }} />
                <span>Active Orders Timeline</span>
              </h3>

              {orders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No orders tracked yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {orders.map(order => {
                    const dateStr = new Date(order.created_at).toLocaleString();
                    const isQuote = parseFloat(order.total_amount) === 0;

                    return (
                      <div key={order.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', backgroundColor: '#fcfcfc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <strong style={{ fontSize: '1.1rem' }}>Order #{order.id}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Placed on: {dateStr}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {isQuote ? (
                              <span style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 'bold' }}>
                                Awaiting Pharmacist Pricing
                              </span>
                            ) : (
                              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-hover)' }}>
                                Rs. {parseFloat(order.total_amount).toFixed(2)}
                              </span>
                            )}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem', justifyContent: 'flex-end' }}>
                              <MapPin size={12} /> {order.delivery_address}
                            </div>
                          </div>
                        </div>

                        {/* List items if available */}
                        {order.items.length > 0 && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                            {order.items.map(it => (
                              <div key={it.id}>
                                - {it.medicine_name} x {it.quantity} (Rs. {parseFloat(it.price_at_purchase).toFixed(2)})
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Stepper Timeline UI */}
                        <div className="timeline">
                          <div className={`timeline-step ${getStepStatus(order, 'placed')}`}>
                            <div className="timeline-icon">
                              <CheckCircle2 size={20} />
                            </div>
                            <span className="timeline-label">Order Placed</span>
                          </div>

                          <div className={`timeline-step ${getStepStatus(order, 'verified')}`}>
                            <div className="timeline-icon">
                              <ShieldCheck size={20} />
                            </div>
                            <span className="timeline-label">RX Verified</span>
                          </div>

                          <div className={`timeline-step ${getStepStatus(order, 'dispatched')}`}>
                            <div className="timeline-icon">
                              <Truck size={20} />
                            </div>
                            <span className="timeline-label">Dispatched</span>
                          </div>

                          <div className={`timeline-step ${getStepStatus(order, 'delivered')}`}>
                            <div className="timeline-icon">
                              <CheckCircle2 size={20} />
                            </div>
                            <span className="timeline-label">Delivered</span>
                          </div>
                        </div>

                        {/* Helper notes */}
                        {isQuote && order.status !== 'rejected' && (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--warning-light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', color: '#92400e', fontSize: '0.75rem', marginTop: '1rem' }}>
                            <AlertCircle size={14} />
                            <span>This order was placed via prescription upload. A pharmacist is currently checking your prescription to select the correct medicines and quote your bill.</span>
                          </div>
                        )}

                        {order.status === 'rejected' && (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--danger-light)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', color: '#991b1b', fontSize: '0.8rem', marginTop: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <AlertCircle size={16} />
                            <div>
                              <strong>Order Rejected:</strong> This order has been rejected by the pharmacist.
                              {order.prescription_status === 'rejected' && " The attached doctor's prescription was reviewed and found invalid or rejected."}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Active subscription schedules list */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12.55rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={20} style={{ color: 'var(--primary)' }} />
              <span>Active Refill Plans</span>
            </h3>

            {subscriptions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                No active monthly subscriptions found.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {subscriptions.map(sub => {
                  const nextDelivery = new Date(sub.next_delivery_date).toLocaleDateString();
                  return (
                    <div key={sub.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', opacity: sub.is_active ? 1 : 0.7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong>{sub.medicine_name}</strong>
                        {sub.is_active ? (
                          <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Active</span>
                        ) : (
                          <span className="badge badge-warning" style={{ backgroundColor: '#e5e7eb', color: '#4b5563', fontSize: '0.65rem' }}>Paused</span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        Qty: <strong>{sub.quantity}</strong> | Price: <strong>Rs. {(parseFloat(sub.price) * sub.quantity).toFixed(2)}</strong> | Plan: <strong>{sub.duration_months} Months</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', fontSize: '0.75rem' }}>
                        <span>Next dispatch: <strong>{nextDelivery}</strong></span>
                        <button
                          onClick={() => handleToggleSub(sub)}
                          className="btn btn-outline"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                        >
                          {sub.is_active ? 'Pause' : 'Resume'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default TrackOrder;
