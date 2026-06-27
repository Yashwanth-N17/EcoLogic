import React from 'react';
import { Calendar, CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export default function Tracker({ scholarships, savedScholarships, applications, onStartApplication, onSubmitApplication, onOpenDetail, onRemoveSaved }) {
  
  // Categorize scholarships into status buckets
  const notStarted = [];
  const inProgress = [];
  const submitted = [];
  const expired = [];

  const currentDate = new Date();

  // Find all scholarships that are either saved OR have an application state
  const trackedIds = Array.from(new Set([...savedScholarships, ...Object.keys(applications)]));

  trackedIds.forEach(id => {
    const sch = scholarships.find(s => s.id === id);
    if (!sch) return;

    const app = applications[id];
    const status = app?.status || 'Not Started';
    const isPastDeadline = new Date(sch.deadline) < currentDate;

    if (isPastDeadline && status !== 'Submitted') {
      expired.push({ ...sch, status: 'Expired', app });
    } else if (status === 'Submitted') {
      submitted.push({ ...sch, status: 'Submitted', app });
    } else if (status === 'In Progress') {
      inProgress.push({ ...sch, status: 'In Progress', app });
    } else {
      notStarted.push({ ...sch, status: 'Not Started', app });
    }
  });

  const getDaysLeft = (deadlineStr) => {
    const diffTime = new Date(deadlineStr) - currentDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderKanbanCard = (sch) => {
    const daysLeft = getDaysLeft(sch.deadline);
    const app = applications[sch.id];
    
    // Checklist progress
    let completedCount = 0;
    let totalCount = sch.requirements.length;
    if (app && app.checklist) {
      completedCount = Object.keys(app.checklist).filter(reqId => app.checklist[reqId]).length;
    }
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <div key={sch.id} className="kanban-card-clean" onClick={() => onOpenDetail(sch.id)}>
        <div className="card-topline-clean">
          <span className="card-provider-clean">{sch.provider}</span>
          <span className="card-amount-clean">{sch.amountFormatted}</span>
        </div>
        
        <h4 className="card-title-clean">{sch.title}</h4>

        {sch.status === 'In Progress' && (
          <div className="card-progress-section-clean">
            <div className="progress-text-row-clean">
              <span>Tasks completed</span>
              <span>{completedCount}/{totalCount} ({percent}%)</span>
            </div>
            <div className="progress-bar-container-clean">
              <div className="progress-bar-fill-clean" style={{ width: `${percent}%` }}></div>
            </div>
          </div>
        )}

        <div className="card-meta-clean">
          <span className={`card-deadline-clean ${daysLeft <= 15 && sch.status !== 'Submitted' ? 'urgent' : ''}`}>
            <Calendar size={12} />
            {daysLeft < 0 ? 'Expired' : `${daysLeft} days left`}
          </span>
        </div>

        {/* Action row at bottom */}
        <div className="card-actions-row-clean" onClick={(e) => e.stopPropagation()}>
          {sch.status === 'Not Started' && (
            <>
              <button 
                className="btn-action-clean primary" 
                onClick={() => onStartApplication(sch.id)}
              >
                Start Application
              </button>
              <button 
                className="btn-action-clean danger" 
                onClick={() => onRemoveSaved(sch.id)}
              >
                Remove
              </button>
            </>
          )}
          {sch.status === 'In Progress' && (
            <button 
              className={`btn-action-clean success ${percent < 100 ? 'disabled' : ''}`} 
              onClick={() => onSubmitApplication(sch.id)}
              disabled={percent < 100}
              title={percent < 100 ? "Complete all requirements first!" : ""}
            >
              Submit Application
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="tracker-view page-shell">
      {/* Clean Header */}
      <div className="dashboard-header-clean">
        <div className="header-greeting">
          <h2>Application Tracker</h2>
          <p>Track your scholarship application pipeline step-by-step from saved to submitted.</p>
        </div>
      </div>

      <div className="kanban-board-clean">
        {/* Not Started */}
        <div className="kanban-column-clean">
          <div className="kanban-column-header-clean">
            <span className="kanban-column-title-clean">
              <Clock size={15} /> Saved
            </span>
            <span className="kanban-column-count-clean">{notStarted.length}</span>
          </div>
          <div className="kanban-cards-clean">
            {notStarted.length > 0 ? (
              notStarted.map(renderKanbanCard)
            ) : (
              <div className="empty-column-clean">No saved items.</div>
            )}
          </div>
        </div>

        {/* In Progress */}
        <div className="kanban-column-clean">
          <div className="kanban-column-header-clean">
            <span className="kanban-column-title-clean warning">
              <RefreshCw size={15} className="spin-icon" style={{ animation: 'spin 4s linear infinite' }} /> In Progress
            </span>
            <span className="kanban-column-count-clean warning">{inProgress.length}</span>
          </div>
          <div className="kanban-cards-clean">
            {inProgress.length > 0 ? (
              inProgress.map(renderKanbanCard)
            ) : (
              <div className="empty-column-clean">No active progress.</div>
            )}
          </div>
        </div>

        {/* Submitted */}
        <div className="kanban-column-clean">
          <div className="kanban-column-header-clean">
            <span className="kanban-column-title-clean success">
              <CheckCircle2 size={15} /> Submitted
            </span>
            <span className="kanban-column-count-clean success">{submitted.length}</span>
          </div>
          <div className="kanban-cards-clean">
            {submitted.length > 0 ? (
              submitted.map(renderKanbanCard)
            ) : (
              <div className="empty-column-clean">No submissions yet.</div>
            )}
          </div>
        </div>

        {/* Expired */}
        <div className="kanban-column-clean">
          <div className="kanban-column-header-clean">
            <span className="kanban-column-title-clean error">
              <AlertTriangle size={15} /> Expired
            </span>
            <span className="kanban-column-count-clean error">{expired.length}</span>
          </div>
          <div className="kanban-cards-clean">
            {expired.length > 0 ? (
              expired.map(renderKanbanCard)
            ) : (
              <div className="empty-column-clean">No expired items.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
