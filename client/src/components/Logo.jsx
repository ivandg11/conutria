import './Logo.css';

export default function Logo({ size = 36, bg = '#1f8a6f', showName = true }) {
  return (
    <span className="Conutri-logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        role="img"
        aria-label="Conutri"
      >
        <rect width="40" height="40" rx="10" fill={bg} />
        <path
          d="M12 28 C12 18 18 12 28 12 C28 22 22 28 12 28 Z"
          fill="#ffffff"
        />
        <path
          d="M12.5 27.5 L22 18"
          stroke={bg}
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {showName && <span className="Conutri-logo-name">Conutri</span>}
    </span>
  );
}
