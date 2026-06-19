import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pill, ShieldCheck, Check, Ban, Plus, Edit2, Trash2, Calendar, ClipboardList, RefreshCw, AlertCircle, FileText, CheckCircle2, X } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dueSubscriptions, setDueSubscriptions] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  
  // Inventory form state
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [medName, setMedName] = useState('');
  const [medManufacturer, setMedManufacturer] = useState('');
  const [medDescription, setMedDescription] = useState('');
  const [medPrice, setMedPrice] = useState('');
  const [medStock, setMedStock] = useState('');
  const [medRequiresRx, setMedRequiresRx] = useState(false);
  const [medImageUrl, setMedImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Trigger feedback states
  const [alertMsg, setAlertMsg] = useState(null);
  const [subLogs, setSubLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  // Search & Update Bill States
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [selectedAddMedId, setSelectedAddMedId] = useState('');
  const [addQty, setAddQty] = useState('1');

  const fetchInventory = async () => {
    try {
      const response = await axios.get('/api/medicines');
      setMedicines(response.data.medicines);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get('/api/prescriptions/pending');
      setPendingPrescriptions(response.data.prescriptions);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrdersAndSubscriptions = async () => {
    try {
      const [ordRes, subRes] = await Promise.all([
        axios.get('/api/orders/all'),
        axios.get('/api/subscriptions/admin')
      ]);
      setOrders(ordRes.data.orders);
      setDueSubscriptions(subRes.data.dueThisWeek);
      setAllSubscriptions(subRes.data.allSubscriptions || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSubscriptionStatus = async (subId, nextStatus) => {
    try {
      await axios.put(`/api/subscriptions/status/${subId}`, { status: nextStatus });
      showAlert(`Subscription #${subId} status updated to ${nextStatus}.`);
      fetchOrdersAndSubscriptions();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to update subscription status.', true);
    }
  };

  const loadAllDashboardData = async () => {
    setLoading(true);
    await Promise.all([
      fetchInventory(),
      fetchPrescriptions(),
      fetchOrdersAndSubscriptions()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllDashboardData();
  }, []);

  const showAlert = (text, isError = false) => {
    setAlertMsg({ text, isError });
    setTimeout(() => setAlertMsg(null), 5000);
  };

  // Inventory logic
  const openEdit = (med) => {
    setEditingMedicine(med);
    setIsAdding(false);
    setMedName(med.name);
    setMedManufacturer(med.manufacturer);
    setMedDescription(med.description);
    setMedPrice(med.price);
    setMedStock(med.stock_quantity.toString());
    setMedRequiresRx(med.requires_prescription);
    setMedImageUrl(med.image_url || '');
  };

  const openAdd = () => {
    setEditingMedicine(null);
    setIsAdding(true);
    setMedName('');
    setMedManufacturer('');
    setMedDescription('');
    setMedPrice('');
    setMedStock('');
    setMedRequiresRx(false);
    setMedImageUrl('');
  };

  const handleMedSubmit = async (e) => {
    e.preventDefault();
    if (!medName || !medManufacturer || !medPrice || !medStock) {
      showAlert('Please fill in all inventory fields.', true);
      return;
    }

    const payload = {
      name: medName,
      manufacturer: medManufacturer,
      description: medDescription,
      price: parseFloat(medPrice),
      stock_quantity: parseInt(medStock),
      requires_prescription: medRequiresRx,
      image_url: medImageUrl || null
    };

    try {
      if (editingMedicine) {
        await axios.put(`/api/medicines/${editingMedicine.id}`, payload);
        showAlert(`Medicine "${medName}" updated successfully.`);
      } else {
        await axios.post('/api/medicines', payload);
        showAlert(`Medicine "${medName}" added successfully.`);
      }
      setIsAdding(false);
      setEditingMedicine(null);
      fetchInventory();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Inventory update failed.', true);
    }
  };

  const deleteMed = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medicine from the inventory catalog?')) {
      return;
    }
    try {
      await axios.delete(`/api/medicines/${id}`);
      showAlert('Medicine deleted from catalog.');
      fetchInventory();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to delete medicine.', true);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('/api/medicines/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMedImageUrl(res.data.imageUrl);
      showAlert('Medicine image uploaded successfully.');
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.message || 'Failed to upload image.', true);
    } finally {
      setUploadingImage(false);
    }
  };

  // Prescription verification logic
  const handleVerifyPrescription = async (presId, status) => {
    try {
      await axios.put(`/api/prescriptions/verify/${presId}`, { status });
      showAlert(`Prescription #${presId} status updated to ${status}.`);
      
      // Reload both prescriptions and orders since updating prescription unlocks corresponding orders!
      await Promise.all([
        fetchPrescriptions(),
        fetchOrdersAndSubscriptions()
      ]);
    } catch (err) {
      showAlert(err.response?.data?.message || 'Verification update failed.', true);
    }
  };

  // Order Dispatch logic
  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    try {
      await axios.put(`/api/orders/status/${orderId}`, { status: nextStatus });
      showAlert(`Order #${orderId} marked as ${nextStatus}.`);
      fetchOrdersAndSubscriptions();
    } catch (err) {
      // Gracefully catches order-locked blocks
      showAlert(err.response?.data?.message || 'Failed to dispatch order.', true);
    }
  };

  // Subscription Trigger Run logic
  const handleTriggerSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/subscriptions/trigger-due');
      setSubLogs(response.data.logs || []);
      setShowLogs(true);
      showAlert(response.data.message || 'Subscription processing completed.');
      
      // Reload data
      await loadAllDashboardData();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to run subscription refill tasks.', true);
    } finally {
      setLoading(false);
    }
  };

  const openUpdateBill = (order) => {
    setUpdatingOrder(order);
    const items = order.items.map(item => {
      const med = medicines.find(m => m.name === item.medicine_name);
      return {
        medicineId: item.medicine_id || med?.id || 0,
        medicineName: item.medicine_name,
        price: item.price_at_purchase || med?.price || '0',
        quantity: item.quantity
      };
    });
    setBillItems(items);
    setSelectedAddMedId('');
    setAddQty('1');
  };

  const handleAddItemToBill = () => {
    if (!selectedAddMedId) {
      alert('Please select a medicine.');
      return;
    }
    const med = medicines.find(m => m.id.toString() === selectedAddMedId);
    if (!med) return;

    const qty = parseInt(addQty);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    if (med.stock_quantity < qty) {
      alert(`Insufficient stock. Available: ${med.stock_quantity}`);
      return;
    }

    const existingIndex = billItems.findIndex(item => item.medicineId === med.id);
    if (existingIndex > -1) {
      const newItems = [...billItems];
      newItems[existingIndex].quantity += qty;
      setBillItems(newItems);
    } else {
      setBillItems([...billItems, {
        medicineId: med.id,
        medicineName: med.name,
        price: med.price,
        quantity: qty
      }]);
    }

    setSelectedAddMedId('');
    setAddQty('1');
  };

  const handleRemoveItemFromBill = (idx) => {
    const newItems = [...billItems];
    newItems.splice(idx, 1);
    setBillItems(newItems);
  };

  const handleSaveBill = async () => {
    if (!updatingOrder) return;
    if (billItems.length === 0) {
      alert('Please add at least one medicine to the bill.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        items: billItems.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity
        }))
      };

      const res = await axios.put(`/api/orders/update-bill/${updatingOrder.id}`, payload);
      showAlert(res.data.message || 'Bill updated successfully.');
      setUpdatingOrder(null);
      await fetchOrdersAndSubscriptions();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to update order bill.', true);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const query = orderSearchQuery.toLowerCase();
    return (
      order.id.toString().includes(query) ||
      (order.user_name || '').toLowerCase().includes(query) ||
      (order.user_email || '').toLowerCase().includes(query) ||
      (order.delivery_address || '').toLowerCase().includes(query) ||
      (order.status || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="container">
      {/* Header bar */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Pharmacist Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>MediMate Administrative Console</p>
        </div>
        <button onClick={loadAllDashboardData} className="btn btn-outline" style={{ display: 'flex', gap: '0.25rem', padding: '0.5rem 1rem' }}>
          <RefreshCw size={16} /> Refresh Console
        </button>
      </div>

      {alertMsg && (
        <div className={`alert ${alertMsg.isError ? 'alert-danger' : 'alert-success'}`}>
          {alertMsg.isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="metric-card" style={{ background: '#1e70e6', color: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9 }}>Total Orders</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>{orders.length}</div>
        </div>
        <div className="metric-card" style={{ background: '#16a34a', color: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9 }}>Total Revenue</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>Rs. {orders.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0).toFixed(2)}</div>
        </div>
        <div className="metric-card" style={{ background: '#dc2626', color: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9 }}>Low Stock Items</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>{medicines.filter(m => m.stock_quantity <= 10).length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '0.625rem 1.5rem', borderWidth: '1px 1px 0 1px' }}
        >
          <Pill size={16} /> Inventory CRUD
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`btn ${activeTab === 'prescriptions' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '0.625rem 1.5rem', borderWidth: '1px 1px 0 1px' }}
        >
          <ShieldCheck size={16} /> Prescription Approvals ({pendingPrescriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '0.625rem 1.5rem', borderWidth: '1px 1px 0 1px' }}
        >
          <ClipboardList size={16} /> Orders & Refill Tracking
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`btn ${activeTab === 'subscribers' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '0.625rem 1.5rem', borderWidth: '1px 1px 0 1px' }}
        >
          <User size={16} /> Subscribers ({allSubscriptions.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : activeTab === 'inventory' ? (
        /* ================= INVENTORY TAB ================= */
        <div className="grid grid-cols-2" style={{ gridTemplateColumns: (isAdding || editingMedicine) ? '1.1fr 0.9fr' : '1fr', alignItems: 'start' }}>
          
          {/* Inventory Catalog List */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Medicines Catalog</h3>
              <button onClick={openAdd} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <Plus size={16} /> Add Medicine
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem' }}>ID</th>
                    <th style={{ padding: '0.5rem' }}>Image</th>
                    <th style={{ padding: '0.5rem' }}>Name</th>
                    <th style={{ padding: '0.5rem' }}>Manufacturer</th>
                    <th style={{ padding: '0.5rem' }}>Price</th>
                    <th style={{ padding: '0.5rem' }}>Stock</th>
                    <th style={{ padding: '0.5rem' }}>Type</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map(med => (
                    <tr key={med.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>#{med.id}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <div style={{ width: '40px', height: '40px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img 
                            src={med.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=100&auto=format&fit=crop'} 
                            alt={med.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=100&auto=format&fit=crop'; }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{med.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{med.manufacturer}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 550 }}>Rs. {parseFloat(med.price).toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 0.5rem', color: med.stock_quantity === 0 ? 'var(--danger)' : 'inherit' }}>
                        {med.stock_quantity} units
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {med.requires_prescription ? (
                          <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Rx Required</span>
                        ) : (
                          <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>OTC</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => openEdit(med)} className="btn btn-outline" style={{ padding: '0.35rem', borderColor: 'transparent' }} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteMed(med.id)} className="btn btn-outline" style={{ padding: '0.35rem', borderColor: 'transparent', color: 'var(--danger)' }} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create/Edit Form Panel */}
          {(isAdding || editingMedicine) && (
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                {editingMedicine ? `Edit Medicine #${editingMedicine.id}` : 'Add New Medicine'}
              </h3>
              <form onSubmit={handleMedSubmit}>
                <div className="form-group">
                  <label className="form-label">Medicine Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Paracetamol 500mg"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Manufacturer</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Pfizer, GSK"
                    value={medManufacturer}
                    onChange={(e) => setMedManufacturer(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    placeholder="Brief pharmacological description..."
                    rows={3}
                    value={medDescription}
                    onChange={(e) => setMedDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">UnitPrice (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="0.00"
                    value={medPrice}
                    onChange={(e) => setMedPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="100"
                    value={medStock}
                    onChange={(e) => setMedStock(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Medicine Picture</label>
                  {medImageUrl && (
                    <div style={{ marginBottom: '0.75rem', position: 'relative', width: '100%', height: '150px', backgroundColor: '#f3f4f6', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={medImageUrl} alt="Medicine preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => setMedImageUrl('')} 
                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="form-control"
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <small style={{ color: 'var(--primary)' }}>Uploading image...</small>}
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="req-rx-box"
                    checked={medRequiresRx}
                    onChange={(e) => setMedRequiresRx(e.target.checked)}
                  />
                  <label htmlFor="req-rx-box" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                    Requires Prescription (Rx Check)
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {editingMedicine ? 'Update Inventory' : 'Create Entry'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAdding(false); setEditingMedicine(null); }}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : activeTab === 'prescriptions' ? (
        /* ================= PRESCRIPTIONS REVIEW PIPELINE ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Prescription Verification Queue</h3>
            {pendingPrescriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={36} style={{ color: 'var(--success)', marginBottom: '0.75rem' }} />
                <p>Prescription queue is empty! No pending reviews.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2" style={{ alignItems: 'start' }}>
                {pendingPrescriptions.map(pres => (
                  <div key={pres.id} className="card" style={{ display: 'flex', gap: '1rem', border: '1px solid var(--primary-light)' }}>
                    
                    {/* Prescription Image Preview */}
                    <div style={{ flex: '0 0 150px', height: '180px', backgroundColor: '#f3f4f6', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {pres.file_path.endsWith('.pdf') ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          <FileText size={32} />
                          <span>PDF Doc</span>
                        </div>
                      ) : (
                        <img
                          src={pres.file_path}
                          alt="Doctor's prescription"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>

                    {/* Prescription Details & Review Actions */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Prescription Upload #{pres.id}</h4>
                      <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        Uploaded by: <strong>{pres.user_name}</strong>
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pres.user_email}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Date: {new Date(pres.uploaded_at).toLocaleString()}
                      </span>

                      <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', paddingTop: '1rem' }}>
                        <button
                          onClick={() => handleVerifyPrescription(pres.id, 'approved')}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', display: 'inline-flex', gap: '0.25rem' }}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleVerifyPrescription(pres.id, 'rejected')}
                          className="btn btn-danger"
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', display: 'inline-flex', gap: '0.25rem' }}
                        >
                          <Ban size={14} /> Reject
                        </button>
                        <a
                          href={pres.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline"
                          style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          title="Open Document File"
                        >
                          View
                        </a>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        /* ================= ORDERS & AUTOMATION TRACKING ================= */
        <div className="grid grid-cols-2" style={{ gridTemplateColumns: '1.4fr 0.6fr', alignItems: 'start' }}>
          
          {/* Orders Tracking List */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Order Management</h3>
              <input
                type="text"
                placeholder="Search orders..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  width: '220px',
                  backgroundColor: '#f9fafb'
                }}
              />
            </div>

            {filteredOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No orders found matching search criteria.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem', width: '50px' }}>ID</th>
                      <th style={{ padding: '0.5rem' }}>User</th>
                      <th style={{ padding: '0.5rem', width: '90px' }}>Date</th>
                      <th style={{ padding: '0.5rem' }}>Address</th>
                      <th style={{ padding: '0.5rem', width: '90px' }}>Total</th>
                      <th style={{ padding: '0.5rem', width: '90px' }}>Status</th>
                      <th style={{ padding: '0.5rem', width: '90px' }}>Prescription</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center', width: '220px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => {
                      const hasRx = !!order.prescription_file;
                      const isRxApproved = order.prescription_status === 'approved';
                      const isQuote = parseFloat(order.total_amount) === 0;
                      const formattedDate = new Date(order.created_at).toLocaleDateString();

                      return (
                        <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>#{order.id}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ fontWeight: 600 }}>{order.user_name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{order.user_email}</div>
                            {order.user_phone && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📞 {order.user_phone}</div>}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>{formattedDate}</td>
                          <td style={{ padding: '0.75rem 0.5rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.delivery_address || 'N/A'}>
                            <div>{order.delivery_address || 'N/A'}</div>
                            {order.user_address && order.user_address !== order.delivery_address && (
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-light)' }} title={`Profile Address: ${order.user_address}`}>
                                (Profile: {order.user_address})
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                            {isQuote ? (
                              <span style={{ color: 'var(--warning)', fontWeight: 700 }}>Rs. 0.00</span>
                            ) : (
                              `Rs. ${parseFloat(order.total_amount).toFixed(2)}`
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            {order.status === 'pending' && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Pending</span>}
                            {order.status === 'approved' && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Approved</span>}
                            {order.status === 'rejected' && <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Rejected</span>}
                            {order.status === 'dispatched' && <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Dispatched</span>}
                            {order.status === 'delivered' && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Delivered</span>}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            {hasRx ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <a
                                  href={order.prescription_file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-outline"
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem', minWidth: '65px', height: '24px' }}
                                >
                                  VIEW RX
                                </a>
                                <span style={{
                                  fontSize: '0.6',
                                  fontWeight: 'bold',
                                  color: isRxApproved ? 'var(--success)' : order.prescription_status === 'rejected' ? 'var(--danger)' : '#b45309'
                                }}>
                                  {order.prescription_status.toUpperCase()}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                              {order.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '0.2rem' }}>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'approved')}
                                    className="btn btn-primary"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', backgroundColor: 'var(--success)' }}
                                    disabled={hasRx && !isRxApproved}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'rejected')}
                                    className="btn btn-danger"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem' }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {order.status !== 'delivered' && order.status !== 'rejected' && (
                                <button
                                  onClick={() => openUpdateBill(order)}
                                  className="btn"
                                  style={{
                                    backgroundColor: '#facc15',
                                    color: '#1e293b',
                                    padding: '0.3rem 0.6rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  UPDATE BILL
                                </button>
                              )}
                              {order.status !== 'rejected' && (
                                <select
                                  value={order.status}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                  className="form-control"
                                  style={{
                                    padding: '0.25rem',
                                    fontSize: '0.75rem',
                                    width: '100px',
                                    height: '28px',
                                    margin: 0
                                  }}
                                  disabled={order.status === 'pending'}
                                >
                                  <option value="pending" disabled>Pending</option>
                                  <option value="approved">Approved</option>
                                  <option value="dispatched">Dispatched</option>
                                  <option value="delivered">Delivered</option>
                                </select>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right panel: Subscriptions triggers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Run scheduler button */}
            <div className="card" style={{ borderColor: 'var(--primary)' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={18} style={{ color: 'var(--primary)' }} />
                <span>Subscription Auto-Refill Processor</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                In production, this processes active subscriptions whose delivery is due daily. For demonstration/testing, click the button below to process all due refills right now.
              </p>
              
              <button
                onClick={handleTriggerSubscriptions}
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <RefreshCw size={18} />
                <span>Trigger Subscription Run</span>
              </button>

              {showLogs && (
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span>Execution Logs:</span>
                    <button onClick={() => setShowLogs(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>
                      Clear logs view
                    </button>
                  </h4>
                  <div style={{ backgroundColor: '#1e293b', color: '#f8fafc', padding: '0.75rem', borderRadius: '4px', height: '180px', overflowY: 'auto', fontSize: '0.75rem', fontFamily: 'monospace', lineHeight: 1.4 }}>
                    {subLogs.length === 0 ? (
                      <div>[SYSTEM] Run complete. No due subscriptions found.</div>
                    ) : (
                      subLogs.map((log, idx) => (
                        <div key={idx} style={{ borderBottom: '1px solid #334155', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Triggers due this week */}
            <div className="card">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Refills Due this Week ({dueSubscriptions.length})</h3>
              {dueSubscriptions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No automatic refills scheduled for delivery this week.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {dueSubscriptions.map(sub => {
                    const dateStr = new Date(sub.next_delivery_date).toLocaleDateString();
                    return (
                      <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px', fontSize: '0.8rem', borderLeft: '3px solid var(--primary)' }}>
                        <div>
                          <strong>{sub.medicine_name}</strong> (x{sub.quantity})
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Patient: {sub.user_name}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 600, color: 'var(--primary-hover)' }}>{dateStr}</span>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Due Date</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      ) : activeTab === 'subscribers' ? (
        /* ================= SUBSCRIBERS CATALOG ================= */
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Active & Rejected Subscribers</h3>
          </div>

          {allSubscriptions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No subscriptions found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem', width: '60px' }}>ID</th>
                    <th style={{ padding: '0.5rem' }}>Customer Details</th>
                    <th style={{ padding: '0.5rem' }}>Medicine</th>
                    <th style={{ padding: '0.5rem', width: '80px' }}>Quantity</th>
                    <th style={{ padding: '0.5rem', width: '100px' }}>Frequency</th>
                    <th style={{ padding: '0.5rem', width: '110px' }}>Next Refill</th>
                    <th style={{ padding: '0.5rem', width: '90px' }}>Status</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', width: '200px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allSubscriptions.map(sub => {
                    const formattedDate = new Date(sub.next_delivery_date).toLocaleDateString();
                    return (
                      <tr key={sub.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>#{sub.id}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 600 }}>{sub.user_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sub.user_email}</div>
                          {sub.user_phone && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📞 {sub.user_phone}</div>}
                          {sub.user_address && <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>📍 {sub.user_address}</div>}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 550 }}>{sub.medicine_name}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{sub.quantity} units</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>Every {sub.frequency_days} days</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 550 }}>{formattedDate}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          {sub.status === 'active' && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Active</span>}
                          {sub.status === 'paused' && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Paused</span>}
                          {sub.status === 'rejected' && <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Rejected</span>}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            {sub.status !== 'active' && (
                              <button
                                onClick={() => handleUpdateSubscriptionStatus(sub.id, 'active')}
                                className="btn btn-primary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', backgroundColor: 'var(--success)' }}
                              >
                                Activate
                              </button>
                            )}
                            {sub.status === 'active' && (
                              <button
                                onClick={() => handleUpdateSubscriptionStatus(sub.id, 'paused')}
                                className="btn btn-outline"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', borderColor: 'var(--warning)', color: '#d97706' }}
                              >
                                Pause
                              </button>
                            )}
                            {sub.status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateSubscriptionStatus(sub.id, 'rejected')}
                                className="btn btn-danger"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem' }}
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* Update Bill Modal */}
      {updatingOrder && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            maxWidth: '600px',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }}>
            <button
              onClick={() => setUpdatingOrder(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <X size={24} />
            </button>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Update Bill for Order #{updatingOrder.id}
            </h3>

            {/* Current items inside the bill */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bill Items</h4>
              {billItems.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No medicines added yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {billItems.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div>
                        <strong>{item.medicineName}</strong> x {item.quantity}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Unit Price: Rs. {parseFloat(item.price).toFixed(2)} | Subtotal: Rs. {(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItemFromBill(idx)}
                        className="btn btn-outline"
                        style={{ padding: '0.2rem 0.4rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new item to bill */}
            <div style={{ padding: '1rem', backgroundColor: '#fafafa', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Add Medicine</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Select Medicine</label>
                  <select
                    className="form-control"
                    value={selectedAddMedId}
                    onChange={(e) => setSelectedAddMedId(e.target.value)}
                  >
                    <option value="">-- Choose Medicine --</option>
                    {medicines.map(med => (
                      <option key={med.id} value={med.id} disabled={med.stock_quantity <= 0}>
                        {med.name} ({med.manufacturer}) - Rs. {parseFloat(med.price).toFixed(2)} (Stock: {med.stock_quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Quantity</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={addQty}
                      onChange={(e) => setAddQty(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleAddItemToBill}
                    className="btn btn-primary"
                    style={{ height: '38px', padding: '0 1rem' }}
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>

            {/* Bill Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
              <strong style={{ fontSize: '1.1rem' }}>Total Amount:</strong>
              <strong style={{ fontSize: '1.25rem', color: 'var(--primary-hover)' }}>
                Rs. {billItems.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0).toFixed(2)}
              </strong>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleSaveBill}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Save & Update Bill
              </button>
              <button
                onClick={() => setUpdatingOrder(null)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
