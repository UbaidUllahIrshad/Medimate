import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About Section */}
        <div>
          <div className="footer-logo">
            <Activity size={24} style={{ color: 'var(--primary)' }} />
            <span>MediMate</span>
          </div>
          <p className="footer-about">
            Your premium digital pharmaceutical platform. Order medicines, upload prescriptions, get quick pharmacist reviews, and set automatic monthly refills.
          </p>
        </div>

        {/* Quick Links Section */}
        <div>
          <h4 className="footer-section-title">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home Catalog</Link></li>
            <li><Link to="/upload-rx">Upload Prescription</Link></li>
            <li><Link to="/subscribe-save">Subscribe & Save</Link></li>
            <li><Link to="/track-order">Track Order</Link></li>
          </ul>
        </div>

        {/* Customer Support Section */}
        <div>
          <h4 className="footer-section-title">Support</h4>
          <ul className="footer-links">
            <li><a href="#help">Help Center</a></li>
            <li><a href="#terms">Terms of Service</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#faqs">Refill FAQs</a></li>
          </ul>
        </div>

        {/* Contact Info Section */}
        <div>
          <h4 className="footer-section-title">Contact Us</h4>
          <div className="footer-contact-item">
            <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>Medical Tower, Blue Area, Islamabad, Pakistan</span>
          </div>
          <div className="footer-contact-item">
            <Phone size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>+92 51 111 222 333</span>
          </div>
          <div className="footer-contact-item">
            <Mail size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>support@medimate.com</span>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-copy">
          &copy; {currentYear} MediMate. All rights reserved. Registered Digital Pharmacy.
        </div>
        <div className="footer-socials">
          <a href="#facebook" className="footer-social-icon" title="Facebook">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <a href="#twitter" className="footer-social-icon" title="Twitter">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
          </a>
          <a href="#instagram" className="footer-social-icon" title="Instagram">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a href="#linkedin" className="footer-social-icon" title="LinkedIn">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
