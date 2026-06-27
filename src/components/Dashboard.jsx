import React from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  IndianRupee,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

function getDaysLeft(deadline) {
  const diffTime = new Date(deadline) - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getScholarshipStatus(scholarship) {
  if (!scholarship.isLive) {
    return 'Upcoming';
  }

  if (getDaysLeft(scholarship.deadline) <= 15) {
    return 'Closing Soon';
  }

  return 'Live';
}

export default function Dashboard({
  profile,
  scholarships,
  savedScholarships,
  applications,
  onNavigate
}) {
  const calculateMatch = (scholarship) => {
    let score = 100;
    const criteria = scholarship.eligibilityCriteria;
    const userScore = parseFloat(profile.score);
    const userGpa = userScore > 10 ? userScore / 10 : userScore;

    if (criteria.gpaMin && userGpa < criteria.gpaMin) {
      score -= 20;
    }

    if (criteria.firstGenRequired && profile.firstGen !== 'yes') {
      score -= 25;
    }

    const userIncome = parseFloat(profile.income);
    if (criteria.incomeMax && userIncome > criteria.incomeMax) {
      score -= 25;
    }

    if (criteria.casteRequired && !criteria.casteRequired.includes(profile.category)) {
      score -= 30;
    }

    if (criteria.genderRequired && criteria.genderRequired !== profile.gender) {
      score -= 30;
    }

    if (criteria.stateResidency && !criteria.stateResidency.includes(profile.state)) {
      score -= 20;
    }

    const levelMatch = criteria.academicLevel.some((lvl) =>
      profile.academicLevel.includes(lvl.split(' ')[0])
    );

    if (criteria.academicLevel && !levelMatch) {
      score -= 15;
    }

    return Math.max(0, score);
  };

  const matchedList = scholarships
    .map((scholarship) => ({
      ...scholarship,
      matchScore: calculateMatch(scholarship),
      statusLabel: getScholarshipStatus(scholarship),
      daysLeft: getDaysLeft(scholarship.deadline)
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  const topRecommendations = matchedList.slice(0, 3);
  const activeApplications = Object.keys(applications).filter(
    (id) => applications[id].status === 'In Progress'
  );
  const submittedApplications = Object.keys(applications).filter(
    (id) => applications[id].status === 'Submitted'
  );
  const savedList = matchedList.filter((scholarship) => savedScholarships.includes(scholarship.id));
  const totalAmountTracked = savedList.reduce((acc, curr) => acc + curr.amount, 0);

  let totalTasks = 0;
  let completedTasks = 0;
  Object.keys(applications).forEach((id) => {
    const app = applications[id];
    if (app.status === 'In Progress') {
      const scholarship = scholarships.find((item) => item.id === id);
      if (scholarship) {
        totalTasks += scholarship.requirements.length;
        completedTasks += Object.keys(app.checklist || {}).filter((cid) => app.checklist[cid]).length;
      }
    }
  });

  const trackedScholarships = matchedList.filter(
    (scholarship) =>
      savedScholarships.includes(scholarship.id) ||
      (applications[scholarship.id] && applications[scholarship.id].status === 'In Progress')
  );

  const urgentScholarships = [...matchedList]
    .filter((scholarship) => scholarship.isLive && scholarship.daysLeft <= 45)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 4);

  const nextDeadlineText = trackedScholarships.length
    ? (() => {
        const nextScholarship = [...trackedScholarships].sort(
          (a, b) => new Date(a.deadline) - new Date(b.deadline)
        )[0];
        const daysLeft = getDaysLeft(nextScholarship.deadline);

        if (daysLeft < 0) {
          return 'Expired';
        }

        if (daysLeft === 0) {
          return 'Today';
        }

        return `${daysLeft} days left`;
      })()
    : 'No active deadlines';

  const avgMatchScore = topRecommendations.length
    ? Math.round(
        topRecommendations.reduce((acc, curr) => acc + curr.matchScore, 0) /
          topRecommendations.length
      )
    : 0;

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgMatchScore / 100) * circumference;

  const guidanceCards = [
    {
      icon: <ShieldCheck size={18} />,
      title: 'Verified scholarship framing',
      text: 'Keep official links, funding source, and eligibility rules easy to inspect before applying.'
    },
    {
      icon: <FileCheck size={18} />,
      title: 'Document-first workflow',
      text: 'Use your checklist and resources to prepare documents before the deadline pressure hits.'
    },
    {
      icon: <Sparkles size={18} />,
      title: 'Prioritized recommendations',
      text: 'Start with the strongest match scores, then move to urgent scholarships closing soon.'
    }
  ];

  return (
    <div className="dashboard-view page-shell">
      {/* Header section: clean and cardless */}
      <div className="dashboard-header-clean">
        <div className="header-greeting">
          <h2>Welcome back, {profile.name}!</h2>
          <p>
            Your dashboard highlights top-fit opportunities, upcoming deadlines, and tracking progress.
          </p>
        </div>
        <div className="header-gauge-clean">
          <div className="gauge-circle-container">
            <svg className="matching-circle-svg-clean">
              <circle className="matching-circle-bg-clean" cx="30" cy="30" r="24" />
              <circle
                className="matching-circle-fill-clean"
                cx="30"
                cy="30"
                r="24"
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 - (avgMatchScore / 100) * 2 * Math.PI * 24}
              />
            </svg>
            <div className="gauge-text-clean">{avgMatchScore}%</div>
          </div>
          <div className="gauge-info-clean">
            <strong>Average Match Score</strong>
            <span>Based on academic level, scores, and category.</span>
          </div>
        </div>
      </div>

      {/* Flat metrics bar */}
      <div className="metrics-bar-clean">
        <div className="metric-item-clean">
          <span className="metric-label">Saved</span>
          <strong className="metric-val">{savedScholarships.length}</strong>
        </div>
        <div className="metric-item-clean">
          <span className="metric-label">In Progress</span>
          <strong className="metric-val warning">{activeApplications.length}</strong>
        </div>
        <div className="metric-item-clean">
          <span className="metric-label">Submitted</span>
          <strong className="metric-val success">{submittedApplications.length}</strong>
        </div>
        <div className="metric-item-clean">
          <span className="metric-label">Tracked Funds</span>
          <strong className="metric-val primary">₹{totalAmountTracked.toLocaleString('en-IN')}</strong>
        </div>
        <div className="metric-item-clean deadline-highlight-clean">
          <span className="metric-label">Next Deadline</span>
          <strong className="metric-val">{nextDeadlineText}</strong>
        </div>
      </div>

      <div className="dashboard-grid-clean">
        {/* Main Content Column */}
        <div className="main-content-column">
          <div className="clean-section">
            <div className="clean-section-header">
              <h3>
                <Sparkles size={18} /> Recommended for You
              </h3>
              <button className="btn-text" onClick={() => onNavigate('scholarships')}>
                See All
              </button>
            </div>

            <div className="recommendations-list-clean">
              {topRecommendations.map((scholarship) => (
                <div
                  key={scholarship.id}
                  className="scholarship-row-clean"
                  onClick={() => onNavigate('scholarships', scholarship.id)}
                >
                  <div className="row-main-clean">
                    <span className="row-provider">{scholarship.provider}</span>
                    <h4>{scholarship.title}</h4>
                    <p className="row-desc">{scholarship.requirementsDescription}</p>
                  </div>
                  <div className="row-meta-clean">
                    <div className="row-meta-stats">
                      <span className="amount-highlight">₹{scholarship.amountFormatted}</span>
                      <span className="deadline-subtext">
                        <Calendar size={12} /> {new Date(scholarship.deadline).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <span className={`match-badge-clean ${
                      scholarship.matchScore >= 80 ? 'high' : scholarship.matchScore >= 50 ? 'medium' : 'low'
                    }`}>
                      {scholarship.matchScore}% Match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Status Column */}
        <div className="sidebar-column-clean">
          {/* Urgent deadlines */}
          <div className="clean-section">
            <div className="clean-section-header">
              <h3>
                <Calendar size={18} /> Closing Soon
              </h3>
            </div>

            <div className="mini-deadlines-clean">
              {urgentScholarships.length > 0 ? (
                urgentScholarships.map((scholarship) => (
                  <div
                    key={scholarship.id}
                    className="mini-deadline-row-clean"
                    onClick={() => onNavigate('scholarships', scholarship.id)}
                  >
                    <div className="mini-row-info">
                      <h4>{scholarship.title}</h4>
                      <span>₹{scholarship.amountFormatted} &bull; {scholarship.daysLeft <= 0 ? 'Today' : `${scholarship.daysLeft} days left`}</span>
                    </div>
                    <span className={`urgency-dot-clean ${scholarship.daysLeft <= 15 ? 'urgent' : 'warning'}`} />
                  </div>
                ))
              ) : (
                <p className="empty-state-clean">No urgent deadlines.</p>
              )}
            </div>
          </div>

          {/* Progress Snap */}
          <div className="clean-section">
            <div className="clean-section-header">
              <h3>
                <FileCheck size={18} /> Progress
              </h3>
              <button className="btn-text" onClick={() => onNavigate('tracker')}>
                Track
              </button>
            </div>

            <div className="mini-progress-clean">
              <div className="progress-bar-container-clean">
                <div
                  className="progress-bar-fill-clean"
                  style={{
                    width: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%`
                  }}
                />
              </div>
              <span className="progress-details-clean">
                {totalTasks > 0
                  ? `${completedTasks} of ${totalTasks} checklist items completed`
                  : 'Start an application to track tasks.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
