import React from 'react';
import neckWaistSilhouette from '../../../assets/silhouette_neck_waist.png';

const StepNeckWaist = ({ formData, update }) => {
  const silhouette = neckWaistSilhouette;
  
  const handleLimit = (field, val) => {
    if (val.includes('.')) {
      const [int, dec] = val.split('.');
      if (int.length > 3 || dec.length > 1) return;
    } else {
      if (val.length > 3) return;
    }
    update(field, val);
  };

  return (
    <div className="onb-two-panel">
      {/* Left panel */}
      <div className="onb-two-panel-left" style={{ justifyContent: 'center' }}>
        <div className="onb-neck-waist-illustration">
          <img
            src={silhouette}
            alt="Body measurement reference"
            className="onb-nw-image"
          />
          
          {/* Custom Golden Overlay Markers */}
          <div className="onb-nw-marker" style={{ top: '33.7%' }}>
            <div className="onb-nw-dot" />
            <div className="onb-nw-line" />
            <span className="onb-nw-label">Neck</span>
          </div>

          <div className="onb-nw-marker" style={{ top: '42%' }}>
            <div className="onb-nw-dot" />
            <div className="onb-nw-line" />
            <span className="onb-nw-label">Waist</span>
          </div>

          {formData.gender === 'female' && (
            <div className="onb-nw-marker" style={{ top: '53%' }}>
              <div className="onb-nw-dot" />
              <div className="onb-nw-line" />
              <span className="onb-nw-label">Hip</span>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="onb-two-panel-right">
        <h2 className="onb-step-title">Neck &amp; Waist</h2>
        <p className="onb-step-desc">Used to calculate body fat % with the Navy Method.</p>

        <div className="onb-two-fields">
          <div className="onb-field">
            <label className="onb-field-label" htmlFor="onb-neck">Neck circumference</label>
            <div className="onb-field-input-wrap">
              <input
                id="onb-neck"
                className="onb-input"
                type="number"
                min="20"
                max="60"
                step="0.1"
                value={formData.neck}
                onChange={(e) => handleLimit('neck', e.target.value)}
                placeholder="38"
              />
              <span className="onb-field-unit">cm</span>
            </div>
          </div>
          <div className="onb-field">
            <label className="onb-field-label" htmlFor="onb-waist">Waist circumference</label>
            <div className="onb-field-input-wrap">
              <input
                id="onb-waist"
                className="onb-input"
                type="number"
                min="40"
                max="200"
                step="0.1"
                value={formData.waist}
                onChange={(e) => handleLimit('waist', e.target.value)}
                placeholder="80"
              />
              <span className="onb-field-unit">cm</span>
            </div>
          </div>

          {formData.gender === 'female' && (
            <div className="onb-field">
              <label className="onb-field-label" htmlFor="onb-hip">Hip circumference</label>
              <div className="onb-field-input-wrap">
                <input
                  id="onb-hip"
                  className="onb-input"
                  type="number"
                  min="60"
                  max="250"
                  step="0.1"
                  value={formData.hip || ''}
                  onChange={(e) => handleLimit('hip', e.target.value)}
                  placeholder="95"
                />
                <span className="onb-field-unit">cm</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepNeckWaist;
