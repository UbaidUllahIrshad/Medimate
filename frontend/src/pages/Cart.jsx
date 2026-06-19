import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, Trash2, ShieldAlert, FileText, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
  
  // File upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  // Checkout/Submit states
  const [checkingOut, setCheckingOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadCart = () => {
    try {
      const items = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(items);
    } catch (e) {
      setCartItems([]);
    }
  };

  const loadPrescriptions = async () => {
    try {
      const response = await axios.get('/api/prescriptions/my');
      setPrescriptions(response.data.prescriptions);
      
      // Auto select the first approved or pending prescription if available
      const autoSelect = response.data.prescriptions.find(
        (p) => p.status === 'approved' || p.status === 'pending'
      );
      if (autoSelect) {
        setSelectedPrescriptionId(autoSelect.id.toString());
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const cartRequiresPrescription = cartItems.some(item => item.requiresPrescription);

  useEffect(() => {
    if (cartRequiresPrescription) {
      loadPrescriptions();
    }
  }, [cartItems]);

  const updateQuantity = (medicineId, newQty) => {
    const updated = cartItems.map(item => {
      if (item.medicineId === medicineId) {
        return { ...item, quantity: Math.min(item.maxStock, Math.max(1, newQty)) };
      }
      return item;
    });
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeItem = (medicineId) => {
    const updated = cartItems.filter(item => item.medicineId !== medicineId);
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploadError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('prescription', uploadFile);

    try {
      const response = await axios.post('/api/prescriptions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Reload prescriptions and select the new one
      await loadPrescriptions();
      
      const newPrescription = response.data.prescription;
      if (newPrescription) {
        setSelectedPrescriptionId(newPrescription.id.toString());
      }

      setUploadFile(null);
      // Reset input element
      const fileInput = document.getElementById('prescription-file-input');
      if (fileInput) fileInput.value = '';
      
      alert('Prescription uploaded and selected successfully!');
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    if (cartRequiresPrescription && !selectedPrescriptionId) {
      setErrorMsg('Please select or upload a prescription to check out.');
      return;
    }

    setErrorMsg(null);
    setCheckingOut(true);

    const orderPayload = {
      items: cartItems.map(item => ({
        medicineId: item.medicineId,
        quantity: item.quantity
      })),
      prescriptionId: cartRequiresPrescription ? parseInt(selectedPrescriptionId) : null
    };

    try {
      const response = await axios.post('/api/orders', orderPayload);
      setSuccessMsg(response.data.message || 'Order placed successfully!');
      
      // Clear cart
      localStorage.removeItem('cart');
      setCartItems([]);
      window.dispatchEvent(new Event('cart-updated'));
      
      setTimeout(() => {
        navigate('/dashboard'); // Go to customer orders panel
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Checkout failed.');
      setCheckingOut(false);
    }
  };

  const totalCost = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (cartItems.length === 0 && !successMsg) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <ShoppingBag size={48} style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Browse our medicines catalog to add products.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">Browse Medicines</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Shopping Cart</h1>

      {successMsg && (
        <div className="alert alert-success" style={{ padding: '2rem', flexDirection: 'column', gap: '0.5rem', textAlign: 'center' }}>
          <CheckCircle2 size={40} />
          <h3>Checkout Successful!</h3>
          <p>{successMsg}</p>
          <p style={{ fontSize: '0.85rem' }}>Redirecting to your orders portal...</p>
        </div>
      )}

      {!successMsg && (
        <div className="grid grid-cols-2" style={{ gridTemplateColumns: '1.2fr 0.8fr', alignItems: 'start' }}>
          
          {/* Left panel: List items and upload prescription */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Items in Cart</h3>
              {cartItems.map((item) => (
                <div key={item.medicineId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{item.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.manufacturer}</span>
                    {item.requiresPrescription && (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', gap: '0.25rem', marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                        <ShieldAlert size={10} /> RX Required
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="number"
                        className="form-control"
                        style={{ width: '60px', padding: '0.25rem 0.5rem', textAlign: 'center' }}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.medicineId, parseInt(e.target.value))}
                        min="1"
                        max={item.maxStock}
                      />
                    </div>
                    <span style={{ fontWeight: 600, width: '70px', textAlign: 'right' }}>
                      Rs. {(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button onClick={() => removeItem(item.medicineId)} className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'transparent', padding: '0.35rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Prescription Attachment Segment */}
            {cartRequiresPrescription && (
              <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.05)' }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                  <ShieldAlert size={24} style={{ color: 'var(--danger)' }} />
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#991b1b' }}>Prescription Attachment Required</h3>
                    <p style={{ fontSize: '0.85rem', color: '#b91c1c', marginTop: '0.25rem' }}>
                      You have prescription-only medicines in your cart. You can select an approved prescription from your history or upload a new doctor's prescription.
                    </p>
                  </div>
                </div>

                {/* Dropdown list of existing prescriptions */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FileText size={16} /> Select Prescription Document
                  </label>
                  {prescriptions.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: 'var(--radius-sm)' }}>
                      No prescriptions found on your account. Please upload a new prescription file below.
                    </p>
                  ) : (
                    <select
                      className="form-control"
                      value={selectedPrescriptionId}
                      onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                    >
                      <option value="">-- Choose an Uploaded Prescription --</option>
                      {prescriptions.map((pres) => {
                        const dateStr = new Date(pres.uploaded_at).toLocaleDateString();
                        return (
                          <option key={pres.id} value={pres.id}>
                            ID {pres.id} - Uploaded on {dateStr} ({pres.status.toUpperCase()})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* File upload section */}
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <UploadCloud size={18} style={{ color: 'var(--primary)' }} />
                    <span>Upload New Prescription</span>
                  </h4>

                  {uploadError && (
                    <div className="alert alert-danger" style={{ padding: '0.5rem 0.75rem', marginBottom: '0.75rem' }}>
                      <AlertCircle size={14} />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <form onSubmit={handleFileUpload} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      id="prescription-file-input"
                      type="file"
                      className="form-control"
                      style={{ flex: 1, padding: '0.35rem' }}
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                    <button
                      type="submit"
                      className="btn btn-outline"
                      style={{ padding: '0.55rem 1rem' }}
                      disabled={uploading || !uploadFile}
                    >
                      {uploading ? 'Uploading...' : 'Upload & Attach'}
                    </button>
                  </form>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Supported files: PNG, JPG, JPEG, PDF. Max file size: 5MB.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Summary checkout */}
          <div className="card" style={{ position: 'sticky', top: '90px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Order Summary</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Items Subtotal</span>
              <span>Rs. {totalCost.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estimated Delivery</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '1.25rem', fontWeight: 700 }}>
              <span>Total Price</span>
              <span style={{ color: 'var(--primary-hover)' }}>Rs. {totalCost.toFixed(2)}</span>
            </div>

            {errorMsg && (
              <div className="alert alert-danger" style={{ padding: '0.5rem 0.75rem', marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
              disabled={checkingOut || cartItems.length === 0 || (cartRequiresPrescription && !selectedPrescriptionId)}
            >
              {checkingOut ? 'Processing Checkout...' : 'Secure Checkout'}
            </button>

            {cartRequiresPrescription && !selectedPrescriptionId && (
              <p style={{ color: 'var(--danger)', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem', fontWeight: 555 }}>
                * Checkout is locked until a prescription is linked.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
