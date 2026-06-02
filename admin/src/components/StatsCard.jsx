import './StatsCard.css';

export default function StatsCard({ icon: Icon, iconColor, label, value, change, changeType = 'up', sparkData }) {
  return (
    <div className="stats-card">
      <div className="stats-card__header">
        <div className={`stats-card__icon stats-card__icon--${iconColor}`}>
          <Icon size={24} />
        </div>
        <div className="stats-card__info">
          <span className="stats-card__label">{label}</span>
          <span className="stats-card__value">{value}</span>
        </div>
      </div>
      {change && (
        <div className={`stats-card__change stats-card__change--${changeType}`}>
          <span>{changeType === 'up' ? '↑' : '↓'} {change}</span>
        </div>
      )}
      {sparkData && (
        <div className="stats-card__spark">
          <svg viewBox="0 0 100 30" className="stats-card__spark-svg">
            <polyline
              fill="none"
              stroke={iconColor === 'blue' ? '#3b82f6' : iconColor === 'yellow' ? '#f59e0b' : iconColor === 'green' ? '#10b981' : iconColor === 'purple' ? '#8b5cf6' : '#3b82f6'}
              strokeWidth="2"
              points={sparkData.map((v, i) => `${(i / (sparkData.length - 1)) * 100},${30 - (v / Math.max(...sparkData)) * 25}`).join(' ')}
            />
          </svg>
        </div>
      )}
    </div>
  );
}
