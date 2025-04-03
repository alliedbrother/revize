import React, { useState, useEffect, useContext } from 'react';
import { Card, ListGroup, Button, Alert, Badge, Spinner, Tabs, Tab } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { 
  getTodaysRevisions, 
  getMissedRevisions, 
  completeRevision, 
  postponeRevision,
  getServerTime 
} from '../../services/api';
import { RefreshContext } from '../dashboard/Dashboard';
import './Revisions.css'; // We'll create this CSS file next

const TodaysRevisions = () => {
  const [revisions, setRevisions] = useState([]);
  const [missedRevisions, setMissedRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missedLoading, setMissedLoading] = useState(true);
  const [error, setError] = useState('');
  const [missedError, setMissedError] = useState('');
  const [success, setSuccess] = useState('');
  const [completedIds, setCompletedIds] = useState([]); // Track animations
  const [postponedIds, setPostponedIds] = useState([]); // Track animations
  const [serverTime, setServerTime] = useState(null);
  const [activeTab, setActiveTab] = useState('regular');
  const { user } = useAuth();
  const { refreshTrigger, triggerRefresh } = useContext(RefreshContext);

  useEffect(() => {
    loadServerTime();
    loadTodaysRevisions();
    loadMissedRevisions();
  }, [refreshTrigger]);

  const loadServerTime = async () => {
    try {
      const data = await getServerTime();
      setServerTime(data);
    } catch (err) {
      console.error("Error loading server time:", err);
    }
  };

  const loadTodaysRevisions = async () => {
    try {
      setLoading(true);
      const data = await getTodaysRevisions();
      setRevisions(data);
      setError('');
    } catch (err) {
      setError('Failed to load revisions');
      console.error("Error loading today's revisions:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const loadMissedRevisions = async () => {
    try {
      setMissedLoading(true);
      const data = await getMissedRevisions();
      setMissedRevisions(data);
      setMissedError('');
    } catch (err) {
      setMissedError('Failed to load missed revisions');
      console.error("Error loading missed revisions:", err);
    } finally {
      setMissedLoading(false);
    }
  };

  const handleComplete = async (revisionId, isMissed = false) => {
    try {
      // Start animation
      setCompletedIds(prev => [...prev, revisionId]);
      
      // Wait a bit for animation to play
      setTimeout(async () => {
        await completeRevision(revisionId);
        setSuccess('Revision completed successfully!');
        
        // Update local state
        if (isMissed) {
          setMissedRevisions(missedRevisions.filter(rev => rev.id !== revisionId));
        } else {
          setRevisions(revisions.filter(rev => rev.id !== revisionId));
        }
        
        // Clear animation state
        setCompletedIds(prev => prev.filter(id => id !== revisionId));
        
        // Trigger refresh in other components
        triggerRefresh();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }, 500);
    } catch (err) {
      setCompletedIds(prev => prev.filter(id => id !== revisionId));
      setError('Failed to complete revision: ' + (err.message || 'Unknown error'));
      console.error("Error completing revision:", err);
    }
  };

  const handlePostpone = async (revisionId, isMissed = false) => {
    try {
      // Start animation
      setPostponedIds(prev => [...prev, revisionId]);
      
      // Wait a bit for animation to play
      setTimeout(async () => {
        await postponeRevision(revisionId);
        setSuccess('Revision postponed successfully!');
        
        // Update local state
        if (isMissed) {
          setMissedRevisions(missedRevisions.filter(rev => rev.id !== revisionId));
        } else {
          setRevisions(revisions.filter(rev => rev.id !== revisionId));
        }
        
        // Clear animation state
        setPostponedIds(prev => prev.filter(id => id !== revisionId));
        
        // Trigger refresh in other components
        triggerRefresh();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }, 500);
    } catch (err) {
      setPostponedIds(prev => prev.filter(id => id !== revisionId));
      setError('Failed to postpone revision: ' + (err.message || 'Unknown error'));
      console.error("Error postponing revision:", err);
    }
  };

  const formatServerDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  // Separate regular and postponed revisions
  const regularRevisions = revisions.filter(rev => !rev.postponed);
  const postponedRevisions = revisions.filter(rev => rev.postponed);

  const renderTodaysRevisions = () => {
    return (
      <Card className="revision-card shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center revision-card-header">
          <div>
            <h4 className="mb-0 fw-bold">
              <i className="bi bi-calendar-check me-2"></i>
              Today's Learning
            </h4>
          </div>
        </Card.Header>
        <Card.Body className="revision-card-body">
          {error && <Alert variant="danger" className="mb-3 alert-animated">{error}</Alert>}
          {success && <Alert variant="success" className="mb-3 alert-animated">{success}</Alert>}
          
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading revisions...</p>
            </div>
          ) : regularRevisions.length === 0 && postponedRevisions.length === 0 ? (
            <Alert variant="info" className="d-flex align-items-center">
              <i className="bi bi-check-circle-fill text-success me-2 fs-4"></i>
              <div>
                <strong>All caught up!</strong> No revisions scheduled for today.
              </div>
            </Alert>
          ) : (
            <Tabs
              id="revisions-tabs"
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-3 revision-tabs"
            >
              <Tab 
                eventKey="regular" 
                title={
                  <span>
                    Today's Revisions
                    {regularRevisions.length > 0 && (
                      <Badge bg="primary" pill className="ms-2 badge-count">{regularRevisions.length}</Badge>
                    )}
                  </span>
                }
              >
                {regularRevisions.length > 0 ? (
                  <ListGroup variant="flush" className="revision-list scrollable-list">
                    {regularRevisions.map(revision => (
                      <ListGroup.Item 
                        key={revision.id} 
                        className={`
                          revision-item
                          ${completedIds.includes(revision.id) ? 'item-completing' : ''}
                          ${postponedIds.includes(revision.id) ? 'item-postponing' : ''}
                        `}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1 fw-bold">{revision.topic.title}</h6>
                            <div className="d-flex align-items-center">
                              <Badge bg="info" pill className="me-2 text-light">Revision {revision.day_number || '1'}</Badge>
                            </div>
                          </div>
                          <div className="btn-group">
                            <Button 
                              variant="success" 
                              size="sm"
                              className="complete-btn"
                              onClick={() => handleComplete(revision.id)}
                              disabled={completedIds.includes(revision.id) || postponedIds.includes(revision.id)}
                            >
                              <i className="bi bi-check-lg me-1"></i>
                              Complete
                            </Button>
                            <Button 
                              variant="warning" 
                              size="sm"
                              className="postpone-btn ms-2"
                              onClick={() => handlePostpone(revision.id)}
                              disabled={completedIds.includes(revision.id) || postponedIds.includes(revision.id)}
                            >
                              <i className="bi bi-arrow-right me-1"></i>
                              Postpone
                            </Button>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <Alert variant="info" className="d-flex align-items-center">
                    <i className="bi bi-check-circle-fill text-success me-2 fs-4"></i>
                    <div>
                      <strong>No active revisions!</strong> Check the "Postponed Today" tab.
                    </div>
                  </Alert>
                )}
              </Tab>
              <Tab 
                eventKey="postponed" 
                title={
                  <span>
                    Postponed Today
                    {postponedRevisions.length > 0 && (
                      <Badge bg="warning" text="dark" pill className="ms-2 badge-count">{postponedRevisions.length}</Badge>
                    )}
                  </span>
                }
              >
                {postponedRevisions.length > 0 ? (
                  <ListGroup variant="flush" className="revision-list scrollable-list">
                    {postponedRevisions.map(revision => (
                      <ListGroup.Item 
                        key={revision.id} 
                        className={`
                          revision-item postponed-today-item
                          ${completedIds.includes(revision.id) ? 'item-completing' : ''}
                          ${postponedIds.includes(revision.id) ? 'item-postponing' : ''}
                        `}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1 fw-bold">{revision.topic.title}</h6>
                            <div className="d-flex align-items-center">
                              <Badge bg="info" pill className="me-2 text-light">Revision {revision.day_number || '1'}</Badge>
                              <Badge bg="warning" className="me-2">Postponed</Badge>
                            </div>
                          </div>
                          <div className="btn-group">
                            <Button 
                              variant="success" 
                              size="sm"
                              className="complete-btn"
                              onClick={() => handleComplete(revision.id)}
                              disabled={completedIds.includes(revision.id) || postponedIds.includes(revision.id)}
                            >
                              <i className="bi bi-check-lg me-1"></i>
                              Complete
                            </Button>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <Alert variant="info" className="d-flex align-items-center">
                    <i className="bi bi-check-circle-fill text-success me-2 fs-4"></i>
                    <div>
                      <strong>No postponed revisions!</strong> You're all caught up.
                    </div>
                  </Alert>
                )}
              </Tab>
            </Tabs>
          )}
        </Card.Body>
      </Card>
    );
  };
  
  const renderMissedRevisions = () => {
    return (
      <Card className="revision-card mt-4 shadow-sm missed-card">
        <Card.Header className="d-flex justify-content-between align-items-center revision-card-header missed-header">
          <h4 className="mb-0 fw-bold">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Missed Revisions
            {missedRevisions.length > 0 && (
              <Badge bg="danger" pill className="ms-2 badge-count">{missedRevisions.length}</Badge>
            )}
          </h4>
        </Card.Header>
        <Card.Body className="revision-card-body">
          {missedError && (
            <Alert variant="danger" className="mb-3 alert-animated">
              {missedError}
              <div className="mt-2">
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={loadMissedRevisions}
                >
                  <i className="bi bi-arrow-repeat me-1"></i>
                  Try Again
                </Button>
              </div>
            </Alert>
          )}
          
          {missedLoading && missedRevisions.length === 0 ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="danger" />
              <p className="mt-2 text-muted">Loading missed revisions...</p>
            </div>
          ) : !missedError && missedRevisions.length === 0 ? (
            <Alert variant="info" className="d-flex align-items-center">
              <i className="bi bi-check-circle-fill text-success me-2 fs-4"></i>
              <div>
                <strong>Great job!</strong> No missed revisions to catch up on.
              </div>
            </Alert>
          ) : (
            <ListGroup variant="flush" className="revision-list scrollable-list">
              {missedRevisions.map(revision => (
                <ListGroup.Item 
                  key={revision.id} 
                  className={`
                    revision-item missed-item
                    ${completedIds.includes(revision.id) ? 'item-completing' : ''}
                    ${postponedIds.includes(revision.id) ? 'item-postponing' : ''}
                  `}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1 fw-bold">{revision.topic.title}</h6>
                      <div className="d-flex align-items-center flex-wrap">
                        <Badge bg="danger" pill className="me-2">
                          {Math.round((new Date() - new Date(revision.scheduled_date)) / (1000 * 60 * 60 * 24))} days overdue
                        </Badge>
                        <Badge bg="secondary" pill className="me-2">Revision {revision.day_number || '1'}</Badge>
                        {revision.postponed && (
                          <Badge bg="warning" className="me-2">Postponed</Badge>
                        )}
                        <small className="text-muted">
                          Due: {new Date(revision.scheduled_date).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleComplete(revision.id, true)}
                        disabled={completedIds.includes(revision.id) || postponedIds.includes(revision.id)}
                        className="action-button"
                      >
                        {completedIds.includes(revision.id) ? (
                          <><Spinner as="span" animation="border" size="sm" /> <span className="ms-1">Completing...</span></>
                        ) : (
                          <><i className="bi bi-check-lg me-1"></i>Complete</>
                        )}
                      </Button>
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => handlePostpone(revision.id, true)}
                        disabled={completedIds.includes(revision.id) || postponedIds.includes(revision.id)}
                        className="action-button"
                      >
                        {postponedIds.includes(revision.id) ? (
                          <><Spinner as="span" animation="border" size="sm" /> <span className="ms-1">Postponing...</span></>
                        ) : (
                          <><i className="bi bi-arrow-right me-1"></i>Postpone</>
                        )}
                      </Button>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="revisions-container">
      {renderTodaysRevisions()}
      {renderMissedRevisions()}
    </div>
  );
};

export default TodaysRevisions; 