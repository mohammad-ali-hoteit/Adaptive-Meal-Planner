import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-root">
      {/* ===== NAVBAR ===== */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-logo">
            <div className="landing-nav-logo-icon">🍴</div>
            <span className="landing-nav-logo-text">Adaptive Planner</span>
          </div>
          <button
            className="landing-nav-login-btn"
            onClick={() => navigate('/login')}
            id="landing-login-btn"
          >
            Log In
          </button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          {/* Left */}
          <div className="landing-hero-left">
            <div className="landing-hero-label">
              <span className="landing-hero-label-dot" />
              AI-Powered Nutrition
            </div>
            <h1 className="landing-hero-headline">
              Nutrition that adapts<br />
              <span className="landing-hero-headline-accent">to your life.</span>
            </h1>
            <p className="landing-hero-body">
              Get a personalized, intelligent meal plan built around your body measurements,
              daily schedule, and real goals — then watch it evolve with you every week.
            </p>
            <div className="landing-hero-ctas">
              <button
                className="landing-cta-primary"
                onClick={() => navigate('/register')}
                id="landing-start-btn"
              >
                Start Your Journey →
              </button>
              <button
                className="landing-cta-outline"
                onClick={() => navigate('/login')}
                id="landing-sample-btn"
              >
                View Sample Plan
              </button>
            </div>
            <div className="landing-social-proof">
              <div className="landing-social-avatars">
                {['J', 'M', 'A', 'R'].map((l, i) => (
                  <div key={i} className="landing-social-avatar">{l}</div>
                ))}
              </div>
              <span className="landing-social-text">
                Join <strong>12,000+</strong> people tracking smarter
              </span>
            </div>
          </div>

          {/* Right — Mock App Preview */}
          <div className="landing-hero-right">
            <div className="landing-preview-card">
              <div className="landing-preview-header">
                <div className="landing-preview-dot landing-preview-dot-red" />
                <div className="landing-preview-dot landing-preview-dot-yellow" />
                <div className="landing-preview-dot landing-preview-dot-green" />
                <span className="landing-preview-title">Today's Summary</span>
              </div>
              <div className="landing-preview-greeting">Good Morning, Alex! 👋</div>
              <div className="landing-preview-date">Wednesday, July 9 · On Track</div>

              {/* Macro bars */}
              <div className="landing-preview-macros">
                {[
                  { label: 'Calories', val: '1,850', max: '2,400 kcal', pct: 77, color: '#F5C518' },
                  { label: 'Protein',  val: '120g',  max: '150g',       pct: 80, color: '#8B7BC8' },
                  { label: 'Carbs',    val: '190g',  max: '250g',       pct: 76, color: '#4AADA8' },
                  { label: 'Fat',      val: '45g',   max: '65g',        pct: 69, color: '#C9A84C' },
                ].map((m) => (
                  <div key={m.label} className="landing-preview-macro-row">
                    <div className="landing-preview-macro-top">
                      <span className="landing-preview-macro-label">{m.label}</span>
                      <span className="landing-preview-macro-val">{m.val} / {m.max}</span>
                    </div>
                    <div className="landing-preview-bar-bg">
                      <div
                        className="landing-preview-bar-fill"
                        style={{ width: `${m.pct}%`, background: m.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Next meal */}
              <div className="landing-preview-next-meal">
                <span className="landing-preview-next-label">🍽️ Next Meal</span>
                <div className="landing-preview-next-name">Grilled Salmon + Quinoa</div>
                <div className="landing-preview-next-info">620 kcal · 45g Protein · 12:30 PM</div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="landing-float-badge landing-float-badge-1">
              <span>🔥</span> 7-day streak!
            </div>
            <div className="landing-float-badge landing-float-badge-2">
              <span>✅</span> Goal met
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="landing-how">
        <div className="landing-how-inner">
          <div className="landing-section-label">Simple &amp; Smart</div>
          <h2 className="landing-section-title">How It Works</h2>
          <p className="landing-section-sub">
            Four quick steps to a nutrition plan that's truly yours.
          </p>
          <div className="landing-steps">
            {[
              {
                num: '01',
                title: 'Basic Info',
                desc: 'Enter your age, gender, and fitness goals so we can build your baseline profile.',
                icon: '📋',
              },
              {
                num: '02',
                title: 'Measurements',
                desc: 'Input your weight, height, neck, and waist to calculate accurate body composition.',
                icon: '📏',
              },
              {
                num: '03',
                title: 'The Result',
                desc: 'Our AI generates your custom calorie and macro targets based on your unique data.',
                icon: '🤖',
              },
              {
                num: '04',
                title: 'Hit Your Goals',
                desc: 'Follow your adaptive meal plan and track progress — it learns and adjusts over time.',
                icon: '🏆',
              },
            ].map((step) => (
              <div key={step.num} className="landing-step-card" id={`step-${step.num}`}>
                <div className="landing-step-num">{step.num}</div>
                <div className="landing-step-icon">{step.icon}</div>
                <h3 className="landing-step-title">{step.title}</h3>
                <p className="landing-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="landing-cta-section">
        <div className="landing-cta-inner">
          <div className="landing-cta-icon">🚀</div>
          <h2 className="landing-cta-headline">
            Ready to transform your nutrition?
          </h2>
          <p className="landing-cta-sub">
            Join thousands of people who have already taken control of their health.
            Your personalized plan is waiting.
          </p>
          <button
            className="landing-cta-primary landing-cta-large"
            onClick={() => navigate('/register')}
            id="landing-bottom-cta-btn"
          >
            Get Started →
          </button>
          <p className="landing-cta-note">No credit card required · Free to start</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-logo">
            <span className="landing-footer-logo-icon">🍴</span>
            <span className="landing-footer-logo-text">Adaptive Planner</span>
          </div>
          <p className="landing-footer-copy">
            © {new Date().getFullYear()} Adaptive Meal Planner. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
