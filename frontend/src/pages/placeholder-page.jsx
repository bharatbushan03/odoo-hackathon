import './placeholder-page.css';

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="placeholder-page">
      <h1 className="placeholder-page__title">{title}</h1>
      <p className="placeholder-page__desc">{description}</p>
      <div className="placeholder-page__box">
        <span>Coming soon</span>
      </div>
    </div>
  );
}
