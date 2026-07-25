import React, { useState } from 'react';

const ScheduleModal = ({ onClose, onSave, initialData, title = "Configure Schedule" }) => {
  const [scheduleConfig, setScheduleConfig] = useState(initialData || {
    wakeTime: '07:00',
    sleepTime: '23:00',
    busyPeriods: []
  });

  const [newBusy, setNewBusy] = useState({ label: '', startTime: '', endTime: '', type: 'office' });
  const [busyError, setBusyError] = useState('');
  const [scheduleError, setScheduleError] = useState('');

  const addBusyPeriod = () => {
    setBusyError('');
    if (!newBusy.label || !newBusy.startTime || !newBusy.endTime) {
      setBusyError('Please fill all fields for the busy period.');
      return;
    }
    const sParts = newBusy.startTime.split(':');
    const eParts = newBusy.endTime.split(':');
    if (sParts.length !== 2 || eParts.length !== 2) {
      setBusyError('Invalid time format.');
      return;
    }
    const sMin = parseInt(sParts[0], 10) * 60 + parseInt(sParts[1], 10);
    const eMin = parseInt(eParts[0], 10) * 60 + parseInt(eParts[1], 10);
    
    if (sMin >= eMin) {
      setBusyError('Start time must be before end time.');
      return;
    }

    setScheduleConfig(prev => ({
      ...prev,
      busyPeriods: [...prev.busyPeriods, { ...newBusy }]
    }));
    setNewBusy({ label: '', startTime: '', endTime: '', type: 'office' });
  };

  const removeBusyPeriod = (idx) => {
    setScheduleConfig(prev => ({
      ...prev,
      busyPeriods: prev.busyPeriods.filter((_, i) => i !== idx)
    }));
  };

  const handleSaveModal = () => {
    setScheduleError('');
    if (!scheduleConfig.wakeTime || !scheduleConfig.sleepTime) {
      setScheduleError('Wake time and sleep time are required.');
      return;
    }
    onSave(scheduleConfig);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel schedule-modal">
        <div className="modal-header">
          <div className="modal-header-text">
            <h3 className="modal-title">{title}</h3>
            <p className="modal-desc">Adjust your wake, sleep, and busy times. We'll perfectly space your meals.</p>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="onb-schedule-times" style={{ marginBottom: '24px' }}>
          <div className="onb-field">
            <label className="onb-field-label">
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-teal)' }}>wb_twilight</span> Wake Time
            </label>
            <input
              type="time"
              className="onb-input"
              value={scheduleConfig.wakeTime}
              onChange={(e) => setScheduleConfig({...scheduleConfig, wakeTime: e.target.value})}
            />
          </div>
          <div className="onb-field">
            <label className="onb-field-label">
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-purple)' }}>bedtime</span> Sleep Time
            </label>
            <input
              type="time"
              className="onb-input"
              value={scheduleConfig.sleepTime}
              onChange={(e) => setScheduleConfig({...scheduleConfig, sleepTime: e.target.value})}
            />
          </div>
        </div>

        <div className="busy-periods-section">
          <label className="onb-field-label">
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-red)' }}>event_busy</span> Busy Periods (Work, Gym, etc.)
          </label>
          
          <div className="busy-periods-list custom-scrollbar">
            {scheduleConfig.busyPeriods.length === 0 ? (
              <div className="empty-busy-state">No busy periods added yet.</div>
            ) : (
              scheduleConfig.busyPeriods.map((bp, i) => (
                <div key={i} className="busy-period-card">
                  <div className="busy-period-info">
                    <span className="busy-period-label">{bp.label} <span style={{fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'normal', textTransform: 'capitalize'}}>({bp.type || 'Office'})</span></span>
                    <span className="busy-period-time">{bp.startTime} - {bp.endTime}</span>
                  </div>
                  <button className="btn-remove-busy" onClick={() => removeBusyPeriod(i)} title="Remove">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {busyError && <div className="modal-error-msg"><span className="material-symbols-outlined">error</span> {busyError}</div>}
          <div className="card" style={{ marginTop: '16px', padding: '16px', background: 'var(--color-surface-low)', boxShadow: 'none' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_box</span> Add New Busy Block
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="onb-field" style={{ flex: 1 }}>
                  <label className="onb-field-label">Block Name</label>
                  <input type="text" placeholder="e.g. Work, Gym" className="onb-input" value={newBusy.label} onChange={e => setNewBusy({...newBusy, label: e.target.value})} />
                </div>
                <div className="onb-field" style={{ flex: 1 }}>
                  <label className="onb-field-label">Activity Type</label>
                  <select className="onb-input" value={newBusy.type} onChange={e => setNewBusy({...newBusy, type: e.target.value})} style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
                    <option value="office">Office Work</option>
                    <option value="moderate">Moderate Work</option>
                    <option value="hard">Hard Physical Work</option>
                    <option value="study">Study / Mental Work</option>
                    <option value="gym">Gym / Training</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="onb-field" style={{ flex: 1 }}>
                  <label className="onb-field-label">Start Time</label>
                  <input type="time" className="onb-input" value={newBusy.startTime} onChange={e => setNewBusy({...newBusy, startTime: e.target.value})} />
                </div>
                <div className="onb-field" style={{ flex: 1 }}>
                  <label className="onb-field-label">End Time</label>
                  <input type="time" className="onb-input" value={newBusy.endTime} onChange={e => setNewBusy({...newBusy, endTime: e.target.value})} />
                </div>
              </div>
              <button className="btn-primary" onClick={addBusyPeriod} style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}>
                Add Block
              </button>
            </div>
          </div>
        </div>

        {scheduleError && <div className="modal-error-msg"><span className="material-symbols-outlined">error</span> {scheduleError}</div>}
        
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSaveModal}>Save & Generate Schedule</button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
