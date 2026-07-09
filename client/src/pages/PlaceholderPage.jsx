/* =====================================================
   PLACEHOLDER PAGE COMPONENT
   Used for routes that are not yet implemented
   ===================================================== */
const PlaceholderPage = ({ title, icon }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '16px',
    fontFamily: 'Inter, sans-serif',
  }}>
    <div style={{
      width: '72px', height: '72px', borderRadius: '50%',
      background: 'rgba(245,197,24,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '32px',
    }}>
      {icon}
    </div>
    <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1f1b11', letterSpacing: '-0.5px' }}>
      {title}
    </h2>
    <p style={{ fontSize: '14px', color: '#8A92A6', textAlign: 'center', maxWidth: '320px', lineHeight: '1.6' }}>
      This page is coming soon. The full implementation will be available shortly.
    </p>
  </div>
);

export const TodaysMealsPage    = () => <PlaceholderPage title="Today's Meals"   icon="🍽️" />;
export const AddCustomMealPage  = () => <PlaceholderPage title="Add Custom Meal" icon="➕" />;
export const WeeklyPlanPage     = () => <PlaceholderPage title="Weekly Plan"     icon="📅" />;

export default PlaceholderPage;
