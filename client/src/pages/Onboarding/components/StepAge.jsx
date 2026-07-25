import React from 'react';

const StepAge = ({ formData, update }) => {
  const currentAge = formData.age === '' ? '' : Number(formData.age);

  const handleUp = () => {
    update('age', currentAge === '' ? 25 : Math.min(80, currentAge + 1));
  };
  const handleDown = () => {
    update('age', currentAge === '' ? 25 : Math.max(18, currentAge - 1));
  };

  return (
    <div className="onb-step-inner">
      <h2 className="onb-step-title">How old are you?</h2>
      <p className="onb-step-desc">Your age helps us fine-tune your caloric limits.</p>
      
      <div className="onb-age-counter-box" style={{ position: 'relative', marginBottom: '40px', marginTop: '20px' }}>
        
        {/* Animated Arrow guiding to the input */}
        {currentAge === '' && (
          <div className="onb-age-guide-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
            <span>Type your age</span>
          </div>
        )}

        <div className="onb-age-counter-display">
          <input 
            type="number"
            className="onb-age-input"
            value={currentAge}
            onChange={(e) => {
              let val = e.target.value;
              if (val.length > 2) val = val.slice(0, 2);
              update('age', val ? Number(val) : '');
            }}
            placeholder="Age"
          />
          <span className="onb-age-counter-label">years old</span>
        </div>
        <div className="onb-age-counter-controls">
          <button type="button" className="onb-age-btn-arrow" onClick={handleUp} aria-label="Increase age">
            <svg viewBox="0 0 24 24"><path d="M12 8l-6 6h12z"/></svg>
          </button>
          <button type="button" className="onb-age-btn-arrow" onClick={handleDown} aria-label="Decrease age">
            <svg viewBox="0 0 24 24"><path d="M12 16l6-6H6z"/></svg>
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '12px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Select your race</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '500px', width: '100%' }}>
        <div 
          className={`onb-age-card ${formData.race === 'White' ? 'active' : ''}`}
          onClick={() => update('race', 'White')}
          style={{ padding: '20px 16px', margin: 0 }}
        >
          <div className="onb-age-card-title" style={{ fontSize: '16px', margin: 0, color: formData.race === 'White' ? '#fff' : 'inherit' }}>White</div>
        </div>
        <div 
          className={`onb-age-card ${formData.race === 'Black' ? 'active' : ''}`}
          onClick={() => update('race', 'Black')}
          style={{ padding: '20px 16px', margin: 0 }}
        >
          <div className="onb-age-card-title" style={{ fontSize: '16px', margin: 0, color: formData.race === 'Black' ? '#fff' : 'inherit' }}>Black</div>
        </div>
      </div>
    </div>
  );
};

export default StepAge;
