import '../../styles/assetflow-theme.css';
import './maintenance.css';

const COLUMNS = [
  { id: 'pending', title: 'Pending', cards: [
    { id: 'AF-0062', name: 'Epson Projector', issue: 'Bulb burning out' },
    { id: 'AF-0145', name: 'HP Printer', issue: 'Paper jam recurring' },
  ]},
  { id: 'approved', title: 'Approved', cards: [
    { id: 'AF-0088', name: 'Dell Monitor', issue: 'Flickering display' },
  ]},
  { id: 'assigned', title: 'Technician assigned', cards: [
    { id: 'AF-0031', name: 'Standing Desk', issue: 'Motor not responding' },
  ]},
  { id: 'progress', title: 'In progress', cards: [
    { id: 'AF-0199', name: 'MacBook Air', issue: 'Battery swelling' },
  ]},
  { id: 'resolved', title: 'Resolved', cards: [
    { id: 'AF-0022', name: 'Conference Phone', issue: 'Mic static — fixed' },
  ]},
];

export default function MaintenancePage() {
  return (
    <div className="af-page">
      <header className="af-page__header">
        <h1 className="af-page__title">Maintenance Management</h1>
        <p className="af-page__subtitle">Track repair workflows across all assets</p>
      </header>

      <div className="kanban">
        {COLUMNS.map((col) => (
          <div key={col.id} className="kanban__col">
            <div className="kanban__col-header">
              {col.title}
              <span className="kanban__count">{col.cards.length}</span>
            </div>
            <div className="kanban__cards">
              {col.cards.map((card) => (
                <div key={card.id} className={`kanban__card${col.id === 'resolved' ? ' kanban__card--resolved' : ''}`}>
                  <span className="kanban__card-tag">{card.id}</span>
                  <span className="kanban__card-name">{card.name}</span>
                  <span className="kanban__card-issue">{card.issue}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
