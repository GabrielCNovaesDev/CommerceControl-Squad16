export default function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl bg-white border border-gray-200 shadow-sm ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
