export const DashboardCard = ({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`ui-panel p-4 flex flex-col gap-3 ${className}`}>
    <div className="flex items-center gap-2 text-rune">
      {icon}
      <h2 className="font-semibold text-lg">{title}</h2>
    </div>
    <div className="rune-divider"></div>
    <div className="flex-grow">{children}</div>
  </div>
);
