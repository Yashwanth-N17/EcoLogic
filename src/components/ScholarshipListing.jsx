import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Filter,
  Heart,
  IndianRupee,
  Search,
  Sparkles,
  Star
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'all', label: 'All Scholarships' },
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'closing', label: 'Closing Soon' },
  { id: 'saved', label: 'Saved' }
];

const SORT_OPTIONS = [
  { value: 'match', label: 'Best Match' },
  { value: 'deadline', label: 'Nearest Deadline' },
  { value: 'amount', label: 'Highest Amount' }
];

const FILTER_SECTIONS = [
  {
    key: 'category',
    title: 'Scholarship Type',
    options: ['Need-based', 'Merit-based', 'Need & Merit-based']
  },
  {
    key: 'source',
    title: 'Source',
    options: ['Government', 'Private']
  },
  {
    key: 'level',
    title: 'Academic Level',
    options: ['Class 10', 'Class 12', 'Undergrad', 'Postgraduate', 'Diploma']
  },
  {
    key: 'match',
    title: 'Match Strength',
    options: ['High', 'Medium']
  }
];

function getDaysLeft(deadline) {
  const now = new Date();
  const diffTime = new Date(deadline) - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getScholarshipStatus(scholarship) {
  if (!scholarship.isLive) {
    return 'Upcoming';
  }

  const daysLeft = getDaysLeft(scholarship.deadline);
  if (daysLeft <= 15) {
    return 'Closing Soon';
  }

  return 'Live';
}

export default function ScholarshipListing({
  profile,
  scholarships,
  savedScholarships,
  onSaveToggle,
  onOpenDetail
}) {
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [sortBy, setSortBy] = useState('match');
  const [filters, setFilters] = useState({
    category: '',
    source: '',
    level: '',
    match: ''
  });

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

    // Caste check
    if (criteria.casteRequired && !criteria.casteRequired.includes(profile.category)) {
      score -= 30;
    }

    // Gender check
    if (criteria.genderRequired && criteria.genderRequired !== profile.gender) {
      score -= 30;
    }

    // State Domicile check
    if (criteria.stateResidency && !criteria.stateResidency.includes(profile.state)) {
      score -= 20;
    }

    // Academic Level check
    const levelMatch = criteria.academicLevel.some((lvl) =>
      profile.academicLevel.includes(lvl.split(' ')[0])
    );

    if (criteria.academicLevel && !levelMatch) {
      score -= 15;
    }

    return Math.max(0, score);
  };

  const enrichedScholarships = useMemo(() => {
    return scholarships.map((scholarship) => {
      const matchScore = calculateMatch(scholarship);
      const status = getScholarshipStatus(scholarship);
      const daysLeft = getDaysLeft(scholarship.deadline);

      return {
        ...scholarship,
        matchScore,
        status,
        daysLeft,
        isSaved: savedScholarships.includes(scholarship.id)
      };
    });
  }, [profile, savedScholarships, scholarships]);

  const featuredScholarships = enrichedScholarships
    .filter((scholarship) => scholarship.featured)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  const filteredScholarships = enrichedScholarships
    .filter((scholarship) => {
      const haystack = [
        scholarship.title,
        scholarship.provider,
        scholarship.requirementsDescription,
        ...(scholarship.tags || [])
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesStatus =
        statusTab === 'all' ||
        (statusTab === 'saved' && scholarship.isSaved) ||
        (statusTab === 'live' && scholarship.status === 'Live') ||
        (statusTab === 'upcoming' && scholarship.status === 'Upcoming') ||
        (statusTab === 'closing' && scholarship.status === 'Closing Soon');
      const matchesCategory =
        filters.category === '' || scholarship.category === filters.category;
      const matchesSource =
        filters.source === '' || scholarship.source === filters.source;
      const matchesLevel =
        filters.level === '' ||
        scholarship.eligibilityCriteria.academicLevel.some((lvl) =>
          lvl.includes(filters.level.split(' ')[0])
        );
      const matchesScore =
        filters.match === '' ||
        (filters.match === 'High' && scholarship.matchScore >= 80) ||
        (filters.match === 'Medium' &&
          scholarship.matchScore >= 50 &&
          scholarship.matchScore < 80);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesSource &&
        matchesLevel &&
        matchesScore
      );
    })
    .sort((a, b) => {
      if (sortBy === 'deadline') {
        return new Date(a.deadline) - new Date(b.deadline);
      }

      if (sortBy === 'amount') {
        return b.amount - a.amount;
      }

      return b.matchScore - a.matchScore;
    });

  const quickStats = {
    live: enrichedScholarships.filter((scholarship) => scholarship.status === 'Live').length,
    upcoming: enrichedScholarships.filter((scholarship) => scholarship.status === 'Upcoming').length,
    closing: enrichedScholarships.filter((scholarship) => scholarship.status === 'Closing Soon').length,
    saved: enrichedScholarships.filter((scholarship) => scholarship.isSaved).length
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const clearFilters = () => {
    setFilters({
      category: '',
      source: '',
      level: '',
      match: ''
    });
    setSearch('');
    setStatusTab('all');
    setSortBy('match');
  };

  const renderDeadlineText = (scholarship) => {
    if (scholarship.status === 'Upcoming') {
      return 'Upcoming cycle';
    }

    if (scholarship.daysLeft <= 0) {
      return 'Closes today';
    }

    return `${scholarship.daysLeft} days left`;
  };

  return (
    <div className="scholarship-listing-view page-shell">
      {/* Clean Header */}
      <div className="dashboard-header-clean">
        <div className="header-greeting">
          <h2>Discover Scholarships</h2>
          <p>Search and compare opportunities based on your academic profile, family income, and Category.</p>
        </div>
        <div className="discovery-stats-clean">
          <div className="discovery-stat-item">
            <span className="stat-lbl">Live Now</span>
            <strong className="stat-val">{quickStats.live}</strong>
          </div>
          <div className="discovery-stat-item">
            <span className="stat-lbl">Closing Soon</span>
            <strong className="stat-val warning">{quickStats.closing}</strong>
          </div>
          <div className="discovery-stat-item">
            <span className="stat-lbl">Saved</span>
            <strong className="stat-val primary">{quickStats.saved}</strong>
          </div>
        </div>
      </div>

      {/* Clean Inline Search */}
      <div className="search-bar-clean">
        <div className="search-input-wrapper-clean">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input-clean"
            placeholder="Search scholarships by title, provider, state, or key criteria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="discovery-layout-clean">
        {/* Left Side: Filter Sidebar */}
        <aside className="filters-sidebar-clean">
          <div className="sidebar-header-clean">
            <h3><Filter size={16} /> Filters</h3>
            {activeFilterCount > 0 && (
              <span className="filter-badge-count">{activeFilterCount} active</span>
            )}
          </div>

          <div className="filter-groups-stack">
            {FILTER_SECTIONS.map((section) => (
              <div key={section.key} className="filter-group-clean">
                <h4>{section.title}</h4>
                <div className="filter-chips-list">
                  {section.options.map((option) => {
                    const isActive = filters[section.key] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`filter-chip-clean ${isActive ? 'active' : ''}`}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            [section.key]: isActive ? '' : option
                          }))
                        }
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="btn-reset-filters-clean" onClick={clearFilters}>
            Reset Filters
          </button>
        </aside>

        {/* Right Side: Main Listing */}
        <div className="listing-results-clean">
          <div className="results-toolbar-clean">
            <div className="results-tabs-clean">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`tab-btn-clean ${statusTab === tab.id ? 'active' : ''}`}
                  onClick={() => setStatusTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <label className="sort-wrapper-clean">
              <ArrowUpDown size={14} />
              <span>Sort</span>
              <select
                className="select-clean"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filteredScholarships.length > 0 ? (
            <div className="scholarship-rows-stack-clean">
              {filteredScholarships.map((scholarship) => {
                const isHigh = scholarship.matchScore >= 80;
                const isMedium = scholarship.matchScore >= 50 && scholarship.matchScore < 80;

                return (
                  <div
                    key={scholarship.id}
                    className="scholarship-row-clean browser-row-clean"
                    onClick={() => onOpenDetail(scholarship.id)}
                  >
                    <div className="row-main-clean">
                      <div className="row-top-clean">
                        <span className="row-provider">{scholarship.provider}</span>
                        <span className={`status-tag-clean ${scholarship.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {scholarship.status}
                        </span>
                      </div>
                      <h4>{scholarship.title}</h4>
                      <p className="row-desc">{scholarship.requirementsDescription}</p>

                      <div className="card-tags-clean">
                        <span className="card-tag-clean">{scholarship.category}</span>
                        <span className="card-tag-clean">{scholarship.source}</span>
                        {(scholarship.tags || []).slice(0, 2).map((tag) => (
                          <span key={tag} className="card-tag-clean highlight">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="row-side-clean">
                      <div className="row-metrics-clean">
                        <strong className="amount-highlight">₹{scholarship.amountFormatted}</strong>
                        <span className="deadline-subtext">
                          <Calendar size={12} /> {renderDeadlineText(scholarship)}
                        </span>
                      </div>

                      <div className="row-actions-clean" onClick={(e) => e.stopPropagation()}>
                        <span className={`match-badge-clean ${isHigh ? 'high' : isMedium ? 'medium' : 'low'}`}>
                          {scholarship.matchScore}% Match
                        </span>
                        <button
                          className={`btn-save-toggle-clean ${scholarship.isSaved ? 'saved' : ''}`}
                          onClick={() => onSaveToggle(scholarship.id)}
                          title={scholarship.isSaved ? 'Remove from saved' : 'Save'}
                        >
                          <Heart size={16} fill={scholarship.isSaved ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-results-clean">
              <h3>No scholarships found</h3>
              <p>Try widening your search terms or resetting filters.</p>
              <button type="button" className="btn-text" onClick={clearFilters}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
