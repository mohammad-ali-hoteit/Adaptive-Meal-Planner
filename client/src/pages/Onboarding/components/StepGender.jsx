import React from 'react';
import maleSilhouette from '../../../assets/silhouette_male.png';
import femaleSilhouette from '../../../assets/silhouette_female.png';

const StepGender = ({ formData, update }) => (
  <div className="onb-step-inner">
    <h2 className="onb-step-title">What is your gender?</h2>
    <p className="onb-step-desc">Used to calculate accurate body fat percentage estimates.</p>
    <div className="onb-gender-cards">
      {[
        { value: 'male',   label: 'Male',   img: maleSilhouette },
        { value: 'female', label: 'Female', img: femaleSilhouette },
      ].map((g) => (
        <button
          key={g.value}
          type="button"
          className={`onb-gender-card${formData.gender === g.value ? ' selected' : ''}`}
          onClick={() => update('gender', g.value)}
          id={`onb-gender-${g.value}`}
          aria-pressed={formData.gender === g.value}
        >
          <img src={g.img} alt={`${g.label} silhouette`} className="onb-gender-img" />
          <span className="onb-gender-label">{g.label}</span>
        </button>
      ))}
    </div>
  </div>
);

export default StepGender;
