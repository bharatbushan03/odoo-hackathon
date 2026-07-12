import { useState } from 'react';
import PageTopBar from '../../components/layout/page-topbar.jsx';
import '../../styles/assetflow-theme.css';
import './booking.css';

const RESOURCES = {
  room201: {
    name: 'Conference Room 201 — Floor 3, HQ',
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
    name: 'Conference Room 301 — Floor 3, S1',
    slots: [
      { time: '09:00', label: 'Available', type: 'free' },
      { time: '10:00', label: 'Booked — Design Review', type: 'booked' },
      { time: '11:00', label: 'Booked — Design Review', type: 'booked' },
      { time: '12:00', label: 'Available', type: 'free' },
    ],
  },
  projector: {
    name: 'Projector AF-0062',
    slots: [
      { time: '09:00', label: 'In use — wait or find another', type: 'conflict' },
      { time: '10:00', label: 'Available', type: 'free' },
      { time: '11:00', label: 'Available', type: 'free' },
    ],
  },
};

export default function BookingPage() {
  const [resource, setResource] = useState('room201');
  const current = RESOURCES[resource];

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
            <div key={slot.time} className={`booking-slot booking-slot--${slot.type}`}>
              <span className="booking-slot__time">{slot.time}</span>
              <span className="booking-slot__label">{slot.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="af-actions" style={{ marginTop: '20px' }}>
        <button type="button" className="af-btn af-btn--primary">Book a slot</button>
      </div>
    </div>
  );
}
