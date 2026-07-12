import '../../styles/assetflow-theme.css';
import './booking.css';

const SLOTS = [
  { time: '09:00', label: 'Booked — Presentation Team', type: 'booked' },
  { time: '10:00', label: 'Booked — Presentation Team', type: 'booked' },
  { time: '11:00', label: 'Available', type: 'free' },
  { time: '12:00', label: 'Available', type: 'free' },
  { time: '13:00', label: 'Reserved — conflict, unusable', type: 'conflict' },
  { time: '14:00', label: 'Available', type: 'free' },
  { time: '15:00', label: 'Booked — All-hands', type: 'booked' },
  { time: '16:00', label: 'Booked — All-hands', type: 'booked' },
  { time: '17:00', label: 'Available', type: 'free' },
];

export default function BookingPage() {
  return (
    <div className="af-page">
      <header className="af-page__header">
        <h1 className="af-page__title">Resource Booking</h1>
        <p className="af-page__subtitle">Conference Room 201 — Floor 3, HQ</p>
      </header>

      <div className="af-tabs">
        <button type="button" className="af-tab af-tab--active">Conference Room 201</button>
        <button type="button" className="af-tab">Projector AF-0062</button>
        <button type="button" className="af-tab">Mac Studio</button>
      </div>

      <div className="af-card booking-timeline">
        <div className="af-card__header">Today&apos;s Schedule</div>
        <div className="booking-timeline__body">
          {SLOTS.map((slot) => (
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
