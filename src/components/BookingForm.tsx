import React, { useState, useEffect } from 'react';
import '../styles/BookingForm.css';

interface FormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  date: string;
  lightOption: string;
  tipColor: string;
  agreeTerms: boolean;
}

interface BookedDate {
  date: string;
  booked: boolean;
}

const BookingForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    date: '',
    lightOption: 'clear-red',
    tipColor: '',
    agreeTerms: false,
  });

  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submittedData, setSubmittedData] = useState<Partial<FormData> & { date?: string }>();
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Generate dates from November 20, 2025 to December 11, 2025
  // Fetch booked dates from Google Sheets
  useEffect(() => {
    const generateDates = () => {
      const dates: string[] = [];
      const start = new Date(2025, 10, 20); // November 20, 2025
      const end = new Date(2025, 11, 11); // December 11, 2025

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dates.push(dateStr);
      }
      setAvailableDates(dates);

      // Initialize all dates as not booked
      const initialBooked = dates.map(date => ({
        date,
        booked: false,
      }));
      setBookedDates(initialBooked);
    };

    const fetchBookedDates = async () => {
      try {
        // Google Sheets API endpoint - public sheet
        const sheetId = '1BT-ArD3fpR89wx66SeT4wFuUHWUe3_XJoKQvdT4jZsY';

        // Use CSV export which is public (no authentication needed)
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

        const response = await fetch(csvUrl);
        const csvText = await response.text();

        // Parse CSV
        const lines = csvText.trim().split('\n');
        const bookedDatesMap: { [key: string]: boolean } = {};

        // Skip header row and parse data
        // Expected format in sheet: date (MM/DD/YYYY), booked (TRUE/FALSE)
        for (let i = 1; i < lines.length; i++) {
          const [dateStr, bookedStr] = lines[i].split(',');
          if (dateStr && bookedStr) {
            const trimmedDate = dateStr.trim();
            const trimmedBooked = bookedStr.trim().toLowerCase() === 'true';
            // Convert MM/DD/YYYY to YYYY-MM-DD for internal use
            const [month, day, year] = trimmedDate.split('/');
            if (month && day && year) {
              const normalizedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              bookedDatesMap[normalizedDate] = trimmedBooked;
            }
          }
        }

        // Generate dates in YYYY-MM-DD format
        const dates: string[] = [];
        const start = new Date(2025, 10, 20);
        const end = new Date(2025, 11, 11);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          dates.push(dateStr);
        }

        setAvailableDates(dates);

        const updatedBooked = dates.map(date => ({
          date,
          booked: bookedDatesMap[date] || false,
        }));

        setBookedDates(updatedBooked);
      } catch (err) {
        console.error('Error fetching booked dates:', err);
        // Fallback to all dates available if fetch fails
        generateDates();
      }
    };

    fetchBookedDates();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLightOptionChange = (option: string) => {
    setFormData(prev => ({
      ...prev,
      lightOption: option,
      tipColor: option === 'alternating' ? prev.tipColor : '',
    }));
  };

  const isDateBooked = () => {
    const booked = bookedDates.find(b => b.date === formData.date);
    return booked?.booked || false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.name || !formData.address || !formData.phone || !formData.email || !formData.date) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!formData.agreeTerms) {
        setError('Please agree to the terms and conditions');
        setLoading(false);
        return;
      }

      // Check if date is booked
      const dateBooked = isDateBooked();

      // Send form data to webhook using POST
      const webhookData = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        date: formatDateForWebhook(formData.date), // Convert to MM/DD/YYYY
        lightOption: formData.lightOption,
        tipColor: formData.tipColor || 'N/A',
        onWaitlist: dateBooked,
        timestamp: new Date().toISOString(),
        depositAmount: '$200',
        action: dateBooked ? 'waitlist' : 'book', // Tell n8n whether to update sheet or not
      };

      const webhookResponse = await fetch('https://tagi.app.n8n.cloud/webhook/ad1dc79b-e77d-44e0-b233-2d78381beb4b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      if (!webhookResponse.ok) {
        setError('Failed to submit booking. Please try again.');
        setLoading(false);
        return;
      }

      // Mark date as booked locally if not on waitlist
      if (!dateBooked) {
        setBookedDates(prev =>
          prev.map(b =>
            b.date === formData.date ? { ...b, booked: true } : b
          )
        );
      }

      // Store submitted data for completion page
      setSubmittedData({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        date: formData.date,
        lightOption: formData.lightOption,
      });

      setSuccess(true);

      // Show completion page after 2 seconds
      setTimeout(() => {
        setCompleted(true);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatDateForWebhook = (dateStr: string) => {
    // Convert YYYY-MM-DD to MM/DD/YYYY
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  };

  const formatLightOption = (option: string) => {
    switch (option) {
      case 'clear-red':
        return 'C9 Clear Bulb Red';
      case 'clear-warm':
        return 'C9 Clear Bulb Warm White';
      case 'alternating':
        return 'Alternating Pattern';
      default:
        return option;
    }
  };

  const availableSlots = bookedDates.filter(b => !b.booked).length;
  const showWaitlist = availableSlots === 0;

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 2: // Date selection
        return !!formData.date;
      case 3: // Light options
        return !!(formData.lightOption && (formData.lightOption !== 'alternating' || !!formData.tipColor));
      case 4: // Personal info
        return !!(formData.name && formData.address && formData.phone && formData.email);
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setError('');
      setCurrentStep(currentStep + 1);
    } else {
      setError('Please complete all required fields before continuing');
    }
  };

  const handlePrevStep = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  // Render completion page if booking is complete
  if (completed && submittedData) {
    return (
      <div className="booking-form-container">
        <div className="completion-page">
          <div className="completion-icon">✓</div>
          <h1>Booking Confirmed!</h1>
          <p className="confirmation-subtitle">Thank you for choosing our service</p>

          <div className="confirmation-details">
            <h2>Installation Details</h2>
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{submittedData.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{submittedData.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{submittedData.phone}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Installation Date:</span>
              <span className="detail-value">{formatDate(submittedData.date || '')}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Light Options:</span>
              <span className="detail-value">{formatLightOption(submittedData.lightOption || '')}</span>
            </div>
          </div>

          <div className="payment-section">
            <h2>Payment Required</h2>
            <p className="payment-instruction">Complete your booking by paying the $200 deposit below:</p>
            <a
              href={`https://square.link/u/gbJgBAFZ?customerName=${encodeURIComponent(submittedData.name || '')}&customerEmail=${encodeURIComponent(submittedData.email || '')}&bookingDate=${encodeURIComponent(formatDateForWebhook(submittedData.date || ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="square-payment-button"
            >
              Pay $200 Deposit Now
            </a>
            <p className="payment-note">You'll be redirected to our secure payment page. Your booking is reserved once payment is complete.</p>
          </div>

          <div className="next-steps">
            <h2>What's Next?</h2>
            <ul>
              <li>Pay the $200 deposit using the button above</li>
              <li>You'll receive a confirmation email at <strong>{submittedData.email}</strong></li>
              <li>We'll contact you to confirm your installation date</li>
              <li>Get ready for beautiful Christmas lights!</li>
            </ul>
          </div>

          <button
            className="new-booking-button"
            onClick={() => {
              setCompleted(false);
              setFormData({
                name: '',
                address: '',
                phone: '',
                email: '',
                date: '',
                lightOption: 'clear-red',
                tipColor: '',
                agreeTerms: false,
              });
              setSubmittedData(undefined);
            }}
          >
            Make Another Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-form-container">
      {currentStep > 1 && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ '--progress-width': `${((currentStep - 1) / 4) * 100}%` } as React.CSSProperties}></div>
          <div className="progress-steps">
            {[1, 2, 3, 4, 5].map(step => (
              <div key={step} className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}></div>
            ))}
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="landing-hero">
          <div className="hero-content">
            <h1>Christmas Lights Before Christmas</h1>
            <p className="hero-subtitle">Professional installation for single-story homes</p>

            <div className="hero-details">
              <p className="detail-line"><strong>$5.50</strong> per foot</p>
              <p className="detail-line">Includes installation, takedown & POV video</p>
              <p className="detail-line">Available <strong>November 20 – December 11, 2025</strong></p>
            </div>

            <p className="hero-footer">$200 deposit to secure your date</p>
          </div>
        </div>
      )}

      {success && (
        <div className="success-message">
          Booking submitted successfully! We'll contact you soon to confirm your installation date.
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {currentStep === 1 && (
        <div className="landing-cta">
          <button
            type="button"
            onClick={handleNextStep}
            className="submit-button"
          >
            Get Started
          </button>
        </div>
      )}

      <form onSubmit={currentStep === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }} className="booking-form">
        {/* Step 2: Date Selection */}
        {currentStep === 2 && (
          <div className="step-content">
            <fieldset>
              <legend>Select Installation Date</legend>
              <p className="available-slots">
                {availableSlots} {availableSlots === 1 ? 'slot' : 'slots'} available
              </p>

              {showWaitlist ? (
                <div className="waitlist-notice">
                  <p>All installation dates are currently booked. You can join the waitlist below.</p>
                </div>
              ) : (
                <div className="date-grid">
                  {availableDates.map(date => {
                    const isBooked = bookedDates.find(b => b.date === date)?.booked;
                    if (isBooked) return null;
                    return (
                      <label key={date} className="date-option">
                        <input
                          type="radio"
                          name="date"
                          value={date}
                          checked={formData.date === date}
                          onChange={handleInputChange}
                        />
                        <span className="date-label">{formatDate(date)}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
          </div>
        )}

        {/* Step 3: Light Options */}
        {currentStep === 3 && (
          <div className="step-content">
            <fieldset>
              <legend>Choose Your Lights</legend>

              <div className="light-options">
                <label className="light-option">
                  <input
                    type="radio"
                    name="light-option"
                    checked={formData.lightOption === 'clear-red'}
                    onChange={() => handleLightOptionChange('clear-red')}
                  />
                  <span>C9 Clear Bulb Red</span>
                </label>

                <label className="light-option">
                  <input
                    type="radio"
                    name="light-option"
                    checked={formData.lightOption === 'clear-warm'}
                    onChange={() => handleLightOptionChange('clear-warm')}
                  />
                  <span>C9 Clear Bulb Warm White</span>
                </label>

                <label className="light-option">
                  <input
                    type="radio"
                    name="light-option"
                    checked={formData.lightOption === 'alternating'}
                    onChange={() => handleLightOptionChange('alternating')}
                  />
                  <span>Alternating Pattern</span>
                </label>
              </div>

              {formData.lightOption === 'alternating' && (
                <div className="form-group tip-color-group">
                  <label htmlFor="tipColor">Tip Color Preference *</label>
                  <select
                    id="tipColor"
                    name="tipColor"
                    value={formData.tipColor}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a color...</option>
                    <option value="red">Red Tips</option>
                    <option value="white">White Tips</option>
                  </select>
                </div>
              )}
            </fieldset>
          </div>
        )}

        {/* Step 4: Personal Information */}
        {currentStep === 4 && (
          <div className="step-content">
            <fieldset>
              <legend>Your Information</legend>

              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </fieldset>
          </div>
        )}

        {/* Step 5: Review & Payment */}
        {currentStep === 5 && (
          <div className="step-content">
            <fieldset>
              <legend>Review Your Booking</legend>
              <div className="review-summary">
                <div className="review-item">
                  <span className="review-label">Date:</span>
                  <span className="review-value">{formatDate(formData.date)}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Lights:</span>
                  <span className="review-value">{formatLightOption(formData.lightOption)}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Name:</span>
                  <span className="review-value">{formData.name}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Email:</span>
                  <span className="review-value">{formData.email}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Phone:</span>
                  <span className="review-value">{formData.phone}</span>
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend>Deposit Payment</legend>
              <div className="deposit-section">
                <p>A $200 deposit is required to secure your installation date.</p>
                <p>Click "Complete Booking" to proceed to payment.</p>
              </div>
            </fieldset>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  required
                />
                <span>
                  I confirm that this is for a new installation on a single-story home and I understand the $200 deposit is required to secure my installation date.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="step-navigation">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="back-button"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Processing...' : currentStep === 5 ? 'Complete Booking' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Extend Window interface for Stripe
declare global {
  interface Window {
    Stripe: any;
  }
}

export default BookingForm;
