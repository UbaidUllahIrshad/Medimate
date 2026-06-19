import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UploadRx = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [patientName, setPatientName] = useState(user?.name || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prescriptionFile) {
      setError('Please select a prescription document file.');
      return;
    }
    if (!deliveryAddress) {
      setError('Please provide a delivery address.');
      return;
    }

    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('prescription', prescriptionFile);
    formData.append('patientName', patientName);
    formData.append('deliveryAddress', deliveryAddress);

    try {
      const response = await axios.post('/api/prescriptions/upload-rx-order', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess(response.data.message || 'Prescription uploaded and order created!');
      setPrescriptionFile(null);
      setDeliveryAddress('');
      
      // Reset input element
      const fileInput = document.getElementById('rx-upload-input');
      if (fileInput) fileInput.value = '';

      setTimeout(() => {
        navigate('/track-order');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading prescription order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '700px' }}>
      <div className="card" style={{ padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-hover)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UploadCloud size={28} />
          <span>Upload Prescription</span>
        </h1>

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
              <strong>Upload Successful!</strong>
            </div>
            <p style={{ fontSize: '0.85rem' }}>{success}</p>
            <p style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', color: 'var(--primary-hover)', fontWeight: 600 }}>
              Redirecting to order tracking <ArrowRight size={14} />
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Patient Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Full Name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Delivery Address</label>
            <textarea
              className="form-control"
              placeholder="Complete home or shipping address..."
              rows={3}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Prescription Image / Document</label>
            <input
              id="rx-upload-input"
              type="file"
              className="form-control"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)}
              required
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Supported types: JPG, JPEG, PNG, PDF. Max file size: 5MB.
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={loading || !!success}
          >
            {loading ? 'Uploading & Creating Order...' : 'UPLOAD & PLACE ORDER'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadRx;
