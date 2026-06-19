import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, AlertCircle, CheckCircle, Search, Upload, FileText } from 'lucide-react';

const SubscribeSave = () => {
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  
  // Selection states
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [frequencyDays, setFrequencyDays] = useState('30');
  const [durationMonths, setDurationMonths] = useState('3');
  const [quantity, setQuantity] = useState(1);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
  
  // Custom Rx upload state inside subscription page
  const [showRxUpload, setShowRxUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Interface view toggle ('search' or 'upload_rx' just for styling)
  const [activeSubTab, setActiveSubTab] = useState('search');

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const loadMedicines = async () => {
    try {
      const response = await axios.get('/api/medicines');
      setMedicines(response.data.medicines);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPrescriptions = async () => {
    try {
      const response = await axios.get('/api/prescriptions/my');
      setPrescriptions(response.data.prescriptions);
      
      const autoSelect = response.data.prescriptions.find((p) => p.status === 'approved');
      if (autoSelect) {
        setSelectedPrescriptionId(autoSelect.id.toString());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMedicines();
    loadPrescriptions();
  }, []);

  const selectedMed = medicines.find(m => m.id.toString() === selectedMedicineId);
  const rxRequired = selectedMed?.requires_prescription || false;

  const handleRxUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('prescription', uploadFile);

    try {
      const response = await axios.post('/api/prescriptions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await loadPrescriptions();
      const newPres = response.data.prescription;
      if (newPres) {
        setSelectedPrescriptionId(newPres.id.toString());
      }
      setUploadFile(null);
      setShowRxUpload(false);
      alert('Prescription document uploaded successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Rx upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmSubscription = async (e) => {
    e.preventDefault();
    if (!selectedMedicineId) {
      setError('Please select a medicine.');
      return;
    }
    if (quantity <= 0) {
      setError('Please specify quantity.');
      return;
    }
    if (rxRequired && !selectedPrescriptionId) {
      setError('This medicine requires an approved prescription on file. Please select or upload one.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await axios.post('/api/subscriptions', {
        medicineId: parseInt(selectedMedicineId),
        quantity,
        frequencyDays: parseInt(frequencyDays),
        durationMonths: parseInt(durationMonths)
      });

      setSuccess('Refill subscription created successfully! We will automatically schedule your delivery.');
      setTimeout(() => {
        navigate('/track-order'); // View subscriptions under tab
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error scheduling subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="card" style={{ padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-hover)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={28} />
          <span>Setup Subscription</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Subscribe to your chronic medicines and get automatic home deliveries with extra savings.
        </p>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} />
              <strong>Subscription Activated!</strong>
            </div>
            <p style={{ fontSize: '0.85rem' }}>{success}</p>
          </div>
        )}

        {/* Tab triggers */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <button
            type="button"
            className={`btn ${activeSubTab === 'search' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, display: 'inline-flex', gap: '0.5rem' }}
            onClick={() => { setActiveSubTab('search'); setShowRxUpload(false); }}
          >
            <Search size={16} /> SEARCH & ADD
          </button>
          <button
            type="button"
            className={`btn ${activeSubTab === 'upload' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, display: 'inline-flex', gap: '0.5rem' }}
            onClick={() => { setActiveSubTab('upload'); setShowRxUpload(true); }}
          >
            <Upload size={16} /> UPLOAD RX
          </button>
        </div>

        {/* Sub-form: Upload Prescription */}
        {showRxUpload && (
          <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#f9fafb', borderColor: 'var(--primary-light)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Upload size={16} style={{ color: 'var(--primary)' }} /> Upload New Prescription
            </h4>
            <form onSubmit={handleRxUpload} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="file"
                className="form-control"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                required
              />
              <button
                type="submit"
                className="btn btn-outline"
                disabled={uploading || !uploadFile}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </div>
        )}

        {/* Core Subscription parameters form */}
        <form onSubmit={handleConfirmSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="form-group">
            <label className="form-label">Search Medicine</label>
            <select
              className="form-control"
              value={selectedMedicineId}
              onChange={(e) => setSelectedMedicineId(e.target.value)}
              required
            >
              <option value="">-- Select a Medicine --</option>
              {medicines.map(med => (
                <option key={med.id} value={med.id}>
                  {med.name} ({med.manufacturer}) - Rs. {parseFloat(med.price).toFixed(2)} {med.requires_prescription ? '[RX REQUIRED]' : '[OTC]'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select
                className="form-control"
                value={frequencyDays}
                onChange={(e) => setFrequencyDays(e.target.value)}
              >
                <option value="30">Monthly (30 Days)</option>
                <option value="15">Bi-Weekly (15 Days)</option>
                <option value="7">Weekly (7 Days)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Duration</label>
              <select
                className="form-control"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
              >
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: '200px' }}>
            <label className="form-label">Quantity per Delivery</label>
            <input
              type="number"
              className="form-control"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              required
            />
          </div>

          {/* Rx checking section */}
          {rxRequired && (
            <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: '#fffdfd' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span className="badge badge-danger">RX Required</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  This medicine requires an approved doctor prescription to establish auto-refills.
                </span>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FileText size={16} /> Link Approved Prescription Document
                </label>
                {prescriptions.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--danger)', fontStyle: 'italic' }}>
                    No prescriptions found on your account. Please click UPLOAD RX above first to upload a document.
                  </p>
                ) : (
                  <select
                    className="form-control"
                    value={selectedPrescriptionId}
                    onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                    required={rxRequired}
                  >
                    <option value="">-- Select Approved Prescription --</option>
                    {prescriptions.map(pres => {
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
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={loading || !!success}
          >
            {loading ? 'Confirming Refill Plan...' : 'CONFIRM SUBSCRIPTION'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default SubscribeSave;
