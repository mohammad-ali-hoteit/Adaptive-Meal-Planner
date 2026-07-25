import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import StepAge from './components/StepAge';
import StepGender from './components/StepGender';
import StepWeight from './components/StepWeight';
import StepHeight from './components/StepHeight';
import StepNeckWaist from './components/StepNeckWaist';
import StepResults from './components/StepResults';
import StepGoal from './components/StepGoal';
import './OnboardingPage.css';

/* =====================================================
   ONBOARDING — 7-step wizard
   ===================================================== */

const TOTAL_STEPS = 7;

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFullLoader, setShowFullLoader] = useState(false);

  const [formData, setFormData] = useState(() => {
    const m = user?.metrics || {};
    return {
      age:         m.age || '',
      race:        m.race || 'White',     // 'White' | 'Black'
      gender:      m.gender || '',        // 'male' | 'female'
      weight:      m.weight || '',        // kg
      targetWeight:m.targetWeight || '',  // kg (new)
      worksOut:    m.activityLevel === 'heavy' || false,     // gym checkbox
      height:      m.height || '',        // cm
      neck:        m.neck || '',          // cm
      waist:       m.waist || '',         // cm
      hip:         m.hip || '',           // cm (new for females)
      wakeTime:    user?.schedule?.wakeTime || '07:00',
      sleepTime:   user?.schedule?.sleepTime || '23:00',
      busyPeriods: user?.schedule?.busyPeriods || [],        // [{ label, startTime, endTime }]
      planDuration: 30,
      startDate:   new Date().toISOString().split('T')[0],
      targetFatPercent: m.targetFatPercent || '',
      targetSMM: m.targetSMM || '',
      targetFatCategory: '',
      targetMuscleCategory: '',
      activityLevel: m.activityLevel || 'light',
      lossRate: 0.5,
      _calculatedBF: 0,
      _calculatedSMM: 0
    };
  });

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const goNext = () => {
    setError('');
    if (step === 1) {
      if (!formData.age || formData.age < 18 || formData.age > 80) {
        update('age', '');
        return setError('Please enter a valid age between 18 and 80.');
      }
      if (!formData.race) {
        return setError('Please select your race.');
      }
    }
    if (step === 2 && !formData.gender) {
      return setError('Please select your gender.');
    }
    if (step === 3 && (!formData.weight || formData.weight < 30 || formData.weight > 160)) {
      update('weight', '');
      return setError('Please enter a valid weight between 30 and 160 kg.');
    }
    if (step === 4 && (!formData.height || formData.height < 100 || formData.height > 250)) {
      update('height', '');
      return setError('Please enter a valid height between 100 and 250 cm.');
    }
    if (step === 5) {
      if (!formData.neck || formData.neck < 20 || formData.neck > 80) {
        update('neck', '');
        return setError('Please enter a valid neck circumference between 20 and 80 cm.');
      }
      if (!formData.waist || formData.waist < 40 || formData.waist > 200) {
        update('waist', '');
        return setError('Please enter a valid waist circumference between 40 and 200 cm.');
      }
      if (formData.gender === 'female' && (!formData.hip || formData.hip < 60 || formData.hip > 250)) {
        update('hip', '');
        return setError('Please enter a valid hip circumference between 60 and 250 cm.');
      }
    }
    
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setError('');
    setStep(s => Math.max(s - 1, 1));
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');
    setShowFullLoader(true);

    // Fake 3-second luxury loading
    setTimeout(async () => {
      try {
        const generatedUserMacros = {
          totalCal: Math.round(formData._calculatedCalories || 2000),
          totalPro: Math.round(formData._calculatedMacros?.gProtein || 150),
          totalFat: Math.round(formData._calculatedMacros?.gFat || 65),
          totalCarb: Math.round(formData._calculatedMacros?.gCarbs || 200),
        };

        await API.post('/onboarding', {
          formData,
          results: {
            calories: generatedUserMacros.totalCal,
            protein: generatedUserMacros.totalPro,
            fat: generatedUserMacros.totalFat,
            carbs: generatedUserMacros.totalCarb
          }
        });
        await refreshUser();
        navigate('/dashboard', { state: { autoOpenSchedule: true } });
      } catch (err) {
        console.error('Onboarding failed:', err);
        setShowFullLoader(false);
        setLoading(false);
        setError('Failed to save your data. Please try again.');
      }
    }, 3000);
  };

  if (showFullLoader) {
    return (
      <div className="onb-page onb-full-loader-page">
        <div className="onb-luxury-loader">
          <div className="onb-luxury-spinner"></div>
          <h2 className="onb-loader-title">Crafting Your Plan...</h2>
          <p className="onb-loader-sub">Analyzing your biometrics and building your adaptive schedule.</p>
        </div>
      </div>
    );
  }

  const progressPct = ((step - 1) / TOTAL_STEPS) * 100;

  return (
    <div className="onb-page">
      <div className="onb-wizard-container">
        {/* Progress bar */}
        <div className="onb-progress-bar-bg">
          <div className="onb-progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Step label */}
        <div className="onb-step-label">STEP {step} OF {TOTAL_STEPS}</div>

        {/* Step content */}
        <div className="onb-card">
          {step === 1 && <StepAge formData={formData} update={update} />}
          {step === 2 && <StepGender formData={formData} update={update} />}
          {step === 3 && <StepWeight formData={formData} update={update} />}
          {step === 4 && <StepHeight formData={formData} update={update} />}
          {step === 5 && <StepNeckWaist formData={formData} update={update} />}
          {step === 6 && <StepResults formData={formData} update={update} />}
          {step === 7 && <StepGoal formData={formData} update={update} />}

          {error && <div className="onb-error" role="alert">{error}</div>}

          {/* Navigation */}
          <div className="onb-nav">
            {step > 1 && (
              <button className="onb-back-btn" onClick={goBack} type="button">
                ← Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < TOTAL_STEPS ? (
              <button className="onb-continue-btn" onClick={goNext} type="button" id={`onb-continue-step-${step}`}>
                Continue →
              </button>
            ) : (
              <button
                className="onb-continue-btn"
                onClick={handleComplete}
                disabled={loading}
                type="button"
                id="onb-complete-btn"
              >
                {loading ? <span className="onb-spinner" /> : 'Complete Setup ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
