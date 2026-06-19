import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Pill, Calendar, FileText, CheckCircle2, Clock, AlertTriangle, Play, Pause, XCircle } from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dashboard view toggle ('orders', 'subscriptions', 'prescriptions')
  const [activeTab, setActiveTab] = useState('orders');
  const [msg, setMsg] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, presRes, ordersRes] = await Promise.all([
        axios.get('/api/subscriptions/my'),
        axios.get('/api/prescriptions/my'),
        axios.get('/api/orders/my')
      ]);

      setSubscriptions(subsRes.data.subscriptions);
      setPrescriptions(presRes.data.prescriptions);
      setOrders(ordersRes.data.orders);
    } catch (error) {
      console.error('Error fetching portal data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleSubscription = async (sub) => {
    try {
      const response = await axios.put(`/api/subscriptions/toggle/${sub.id}`, {
        isActive: !sub.is_active
      });
      setMsg({ text: response.data.message || 'Subscription updated.', isError: false });
      fetchData();
      setTimeout(() => setMsg(null), 3000);
    } catch (error) {
      setMsg({ text: error.response?.data?.message || 'Failed to update subscription.', isError: true });
      setTimeout(() => setMsg(null), 5000);
    }
  };

  const handleCancelSubscription = async (subId) => {
    if (!window.confirm('Are you sure you want to cancel this recurring refill subscription?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/subscriptions/cancel/${subId}`);
      setMsg({ text: response.data.message || 'Subscription cancelled.', isError: false });
      fetchData();
      setTimeout(() => setMsg(null), 3000);
    } catch (error) {
      setMsg({ text: error.response?.data?.message || 'Failed to cancel subscription.', isError: true });
      setTimeout(() => setMsg(null), 5000);
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <span className="badge badge-success">Delivered</span>;
      case 'dispatched':
        return <span className="badge badge-info">Dispatched</span>;
      case 'pending':
      default:
        return <span className="badge badge-warning">Awaiting Dispatch</span>;
    }
  };

  const getPrescriptionStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">Approved</span>;
      case 'rejected':
        return <span className="badge badge-danger">Rejected</span>;
      case 'pending':
      default:
        return <span className="badge badge-warning">Pending Review</span>;
    }
  };

  return (
    <div className="container">
      {/* Header Profile summary */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Welcome, {user?.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Email: {user?.email} | Patient ID: #{user?.id}</p>
        </div>
        <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', color: 'var(--primary-hover)', fontWeight: 600 }}>
          Patient Portal
        </div>
      </div>

      {msg && (
        <div className={`alert ${msg.isError ? 'alert-danger' : 'alert-success'}`}>
          {msg.isError ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('orders')}
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '0.625rem 1.5rem', borderWidth: '1px 1px 0 1px' }}
        >
          <Clock size={16} /> Order History ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`btn ${activeTab === 'subscriptions' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '0.625rem 1.5rem', borderWidth: '1px 1px 0 1px' }}
        >
          <Calendar size={16} /> Recurring Refills ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`btn ${activeTab === 'prescriptions' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '0.625rem 1.5rem', borderWidth: '1px 1px 0 1px' }}
        >
          <FileText size={16} /> Prescriptions ({prescriptions.length})
        </button>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : activeTab === 'orders' ? (
        /* Orders List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Clock size={36} style={{ color: 'var(--text-light)', marginBottom: '0.75rem' }} />
              <p>You haven't placed any orders yet.</p>
            </div>
          ) : (
            orders.map(order => {
              const dateStr = new Date(order.created_at).toLocaleString();
              return (
                <div key={order.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Order #{order.id}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Placed on: {dateStr}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {order.prescription_file && (
                        <span style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                          <FileText size={12} /> RX Status: 
                          {order.prescription_status === 'approved' ? (
                            <strong style={{ color: 'var(--success)' }}>Approved</strong>
                          ) : (
                            <strong style={{ color: 'var(--warning)' }}>Pending</strong>
                          )}
                        </span>
                      )}
                      {getOrderStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* List order items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {order.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>
                          <strong>{item.medicine_name}</strong> ({item.manufacturer}) x {item.quantity}
                        </span>
                        <span style={{ fontWeight: 550 }}>
                          Rs. {(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', fontWeight: 700, fontSize: '1.05rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Total Paid:</span>
                    <span style={{ color: 'var(--primary-hover)' }}>Rs. {parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === 'subscriptions' ? (
        /* Subscriptions List */
        <div className="grid grid-cols-2">
          {subscriptions.length === 0 ? (
            <div className="card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Calendar size={36} style={{ color: 'var(--text-light)', marginBottom: '0.75rem' }} />
              <p>You do not have any automatic refill subscriptions configured.</p>
            </div>
          ) : (
            subscriptions.map(sub => {
              const nextDelivery = new Date(sub.next_delivery_date).toLocaleDateString();
              
              return (
                <div key={sub.id} className="card" style={{ display: 'flex', flexDirection: 'column', borderColor: sub.is_active ? 'var(--border-color)' : '#d1d5db', opacity: sub.is_active ? 1 : 0.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="badge badge-info" style={{ display: 'inline-flex', gap: '0.25rem', fontSize: '0.7rem' }}>
                      <Pill size={12} /> Refill Every {sub.frequency_days} Days
                    </span>
                    {sub.is_active ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-warning" style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}>Paused</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{sub.medicine_name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manufacturer: {sub.manufacturer}</span>
                  
                  <div style={{ margin: '1rem 0', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span>Refill Quantity:</span>
                      <strong>{sub.quantity} units</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span>Estimated Price:</span>
                      <strong>Rs. {(parseFloat(sub.price) * sub.quantity).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '0.35rem', marginTop: '0.35rem' }}>
                      <span>Next Automatic Dispatch:</span>
                      <strong style={{ color: sub.is_active ? 'var(--primary-hover)' : 'var(--text-muted)' }}>{nextDelivery}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button
                      onClick={() => handleToggleSubscription(sub)}
                      className={`btn ${sub.is_active ? 'btn-outline' : 'btn-primary'}`}
                      style={{ flex: 1, padding: '0.5rem', display: 'inline-flex', gap: '0.25rem' }}
                    >
                      {sub.is_active ? (
                        <>
                          <Pause size={14} /> Pause Refill
                        </>
                      ) : (
                        <>
                          <Play size={14} /> Resume Refill
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleCancelSubscription(sub.id)}
                      className="btn btn-outline"
                      style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '0.5rem' }}
                      title="Cancel Subscription"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Prescriptions List */
        <div className="grid grid-cols-3">
          {prescriptions.length === 0 ? (
            <div className="card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <FileText size={36} style={{ color: 'var(--text-light)', marginBottom: '0.75rem' }} />
              <p>You have not uploaded any prescription documents yet.</p>
            </div>
          ) : (
            prescriptions.map(pres => {
              const uploadDate = new Date(pres.uploaded_at).toLocaleString();
              return (
                <div key={pres.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Prescription #{pres.id}</span>
                    {getPrescriptionStatusBadge(pres.status)}
                  </div>

                  <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', height: '140px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                    {pres.file_path.endsWith('.pdf') ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                        <FileText size={32} />
                        <span style={{ fontSize: '0.8rem' }}>PDF Document</span>
                      </div>
                    ) : (
                      <img
                        src={pres.file_path}
                        alt="Prescription document"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Uploaded on: {uploadDate}
                  </div>

                  <a
                    href={pres.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ textAlign: 'center', padding: '0.4rem', fontSize: '0.8rem' }}
                  >
                    View Full File
                  </a>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
