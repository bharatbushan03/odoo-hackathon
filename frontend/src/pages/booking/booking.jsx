import { useState } from 'react';
import PageTopBar from '../../components/layout/page-topbar.jsx';
import '../../styles/assetflow-theme.css';
import './booking.css';
import { bookingApi } from '../../lib/api.js';

const RESOURCES = {
  room201: {
    id: 'room201',
    name: 'Conference Room 201 — Floor 3, HQ',
    type: 'room',
    slots: [
      { time: '09:00', label: 'Booked — Presentation Team', type: 'booked' },
      { time: '10:00', label: 'Booked — Presentation Team', type: 'booked' },
      { time: '11:00', label: 'Available', type: 'free' },
      { time: '12:00', label: 'Available', type: 'free' },
      { time: '13:00', label: 'Reserved — conflict, unusable', type: 'conflict' },
      { time: '14:00', label: 'Available', type: 'free' },
      { time: '15:00', label: 'Booked — All-hands', type: 'booked' },
      { time: '16:00', label: 'Booked — All-hands', type: 'booked' },
      { time: '17:00', label: 'Available', type: 'free' },
    ],
  },
  room301: {
    id: 'room301',
    name: 'Conference Room 301 — Floor 3, S1',
    type: 'room',
    slots: [
      { time: '09:00', label: 'Available', type: 'free' },
      { time: '10:00', label: 'Booked — Design Review', type: 'booked' },
      { time: '11:00', label: 'Booked — Design Review', type: 'booked' },
      { time: '12:00', label: 'Available', type: 'free' },
    ],
  },
  projector: {
    id: 'projector',
    name: 'Projector AF-0062',
    type: 'equipment',
    slots: [
      { time: '09:00', label: 'In use — wait or find another', type: 'conflict' },
      { time: '10:00', label: 'Available', type: 'free' },
      { time: '11:00', label: 'Available', type: 'free' },
    ],
  },
};

export default function BookingPage() {
  const [resource, setResource] = useState('room201');
  const [showModal, setShowModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    resourceId: '',
    startTime: '',
    endTime: '',
    purpose: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const current = RESOURCES[resource];

  const handleBookClick = (slot) => {
    if (slot.type !== 'free') return;
    const [hours, minutes] = slot.time.split(':');
    const start = new Date();
    start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    setSelectedSlot(slot);
    setBookingForm({
      resourceId: resource,
      startTime: start.toISOString().slice(0, 16),
      endTime: end.toISOString().slice(0, 16),
      purpose: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await bookingApi.create(bookingForm);
      setSuccess('Booking confirmed!');
      setBookingForm({ resourceId: '', startTime: '', endTime: '', purpose: '' });
      setShowModal(false);
      setSelectedSlot(null);
    } catch (err) {
      setError(err.message || 'Failed to book slot');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedSlot(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="af-page">
      <PageTopBar />

      <header className="af-page__header">
        <h1 className="af-page__title">Resource Booking</h1>
      </header>

      <div className="af-form-group" style={{ maxWidth: '400px', marginBottom: '20px' }}>
        <label className="af-label" htmlFor="resource-select">Resource</label>
        <select
          id="resource-select"
          className="af-select"
          style={{ width: '100%' }}
          value={resource}
          onChange={(e) => setResource(e.target.value)}
        >
          <option value="room201">Conference Room 201 — Floor 3, HQ</option>
          <option value="room301">Conference Room 301 — Floor 3, S1</option>
          <option value="projector">Projector AF-0062</option>
        </select>
      </div>

      <p className="af-page__subtitle" style={{ marginBottom: '16px' }}>{current.name}</p>

      <div className="af-card booking-timeline">
        <div className="af-card__header">Today&apos;s Schedule</div>
        <div className="booking-timeline__body">
          {current.slots.map((slot) => (
            <div
              key={slot.time}
              className={`booking-slot booking-slot--${slot.type} ${slot.type === 'free' ? 'booking-slot--clickable' : ''}`}
              onClick={() => handleBookClick(slot)}
            >
              <span className="booking-slot__time">{slot.time}</span>
              <span className="booking-slot__label">{slot.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="af-actions" style={{ marginTop: '20px' }}>
        <button type="button" className="af-btn af-btn--primary" onClick={() => handleBookClick({ time: '09:00', type: 'free' })}>
          Book a slot
        </button>
      </div>

      {showModal && (
        <div className="af-modal-overlay" onClick={handleClose}>
          <div className="af-modal" onClick={(e) => e.stopPropagation()}>
            <div className="af-modal__header">
              <h3>Book Slot</h3>
              <button type="button" className="af-modal__close" onClick={handleClose}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="af-modal__body">
              {error && <div className="af-alert af-alert--danger">{error}</div>}
              {success && <div className="af-alert af-alert--success">{success}</div>}
              <div className="af-form-group">
                <label className="af-label">Resource</label>
                <input className="af-input" value={current.name} readOnly />
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="booking-start">Start Time *</label>
                <input
                  id="booking-start"
                  type="datetime-local"
                  className="af-input"
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="booking-end">End Time *</label>
                <input
                  id="booking-end"
                  type="datetime-local"
                  className="af-input"
                  value={bookingForm.endTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                  required
                />
              </div>
              <div className="af-form-group">
                <label className="af-label" htmlFor="booking-purpose">Purpose</label>
                <textarea
                  id="booking-purpose"
                  className="af-textarea"
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  placeholder="Meeting, presentation, etc."
                />
              </div>
              <div className="af-modal__footer">
                <button type="button" className="af-btn" onClick={handleClose}>Cancel</button>
                <button type="submit" className="af-btn af-btn--primary" disabled={loading}>
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}