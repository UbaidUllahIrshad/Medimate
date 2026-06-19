import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, Phone, MapPin, Mail, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

const Profile = () => {
  const { user, login } = useAuth(); // login is our helper to set user state in context
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone_number || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setAlert({ isError: true, text: 'Name is required.' });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const res = await axios.put('/api/auth/profile', {
        name,
        phone_number: phone,
        address
      });
      
      // Update local storage and context state
      const updatedUser = { ...user, ...res.data.user };
      // Since context auth context exposes user, let's update it in local storage if login logic relies on it
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // We can trigger a window reload or update context
      setAlert({ isError: false, text: 'Profile updated successfully!' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      setAlert({ 
        isError: true, 
        text: err.response?.data?.message || 'Failed to update profile details.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={24} style={{ color: 'var(--primary)' }} />
          <span>Patient Profile</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Manage your contact details and delivery settings. These details are automatically attached when you check out orders or set up chronic refills.
        </p>

        {alert && (
          <div className={`alert ${alert.isError ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: '1.5rem' }}>
            {alert.isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{alert.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email (Read-Only) */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Mail size={14} style={{ color: 'var(--text-muted)' }} /> Email Address
            </label>
            <input
              type="email"
              className="form-control"
              value={email}
              disabled
              style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Your unique account identifier. Email cannot be changed.</small>
          </div>

          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Phone size={14} style={{ color: 'var(--text-muted)' }} /> Phone Number
            </label>
            <input
              type="text"
              className="form-control"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +92 333 1234567"
            />
          </div>

          {/* Delivery Address */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={14} style={{ color: 'var(--text-muted)' }} /> Default Delivery Address
            </label>
            <textarea
              className="form-control"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your complete home/shipping address"
              rows={3}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Save size={18} />
            <span>{loading ? 'Saving Changes...' : 'Save Profile Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
