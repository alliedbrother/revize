import { useState, useEffect, useContext } from 'react';
import { Card, Badge, Alert, Form, Row, Col, Button, ListGroup, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { getRevisionSchedule, completeRevision, postponeRevision } from '../../services/api';
import { RefreshContext } from '../dashboard/Dashboard';
import './Revisions.css';

const RevisionSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [topics, setTopics] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [postponedIds, setPostponedIds] = useState([]);
  const { user } = useAuth();
  const { refreshTrigger, triggerRefresh } = useContext(RefreshContext);
  
  // Filter states
  const [filters, setFilters] = useState({
    topic: '',
    startDate: '',
    endDate: '',
    status: ''
  });

  useEffect(() => {
    loadSchedule();
  }, [refreshTrigger]); // Refresh when triggerRefresh is called
  
  useEffect(() => {
    // Apply filters whenever schedule or filters change
    applyFilters();
  }, [schedule, filters]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await getRevisionSchedule();
      setSchedule(data);
      setFilteredSchedule(data);
      
      // Extract unique topics for the dropdown
      const uniqueTopics = [...new Set(data.map(item => item.topic.title))];
      setTopics(uniqueTopics);
      setError('');
    } catch (err) {
      setError('Failed to load revision schedule');
      console.error("Error loading schedule:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAction = async (revisionId, action) => {
    try {
      // Start animation
      if (action === 'complete') {
        setCompletedIds(prev => [...prev, revisionId]);
      } else {
        setPostponedIds(prev => [...prev, revisionId]);
      }
      
      // Wait a bit for animation to play
      setTimeout(async () => {
        if (action === 'complete') {
          await completeRevision(revisionId);
          setSuccess('Revision marked as completed successfully!');
        } else if (action === 'postpone') {
          await postponeRevision(revisionId);
          setSuccess('Revision postponed successfully!');
        }
        
        // Reload schedule after action
        await loadSchedule();
        
        // Clear animation state
        if (action === 'complete') {
          setCompletedIds(prev => prev.filter(id => id !== revisionId));
        } else {
          setPostponedIds(prev => prev.filter(id => id !== revisionId));
        }
        
        // Trigger refresh in other components
        triggerRefresh();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }, 500);
    } catch (err) {
      if (action === 'complete') {
        setCompletedIds(prev => prev.filter(id => id !== revisionId));
      } else {
        setPostponedIds(prev => prev.filter(id => id !== revisionId));
      }
      setError(`Failed to ${action} revision: ` + (err.message || 'Unknown error'));
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      topic: '',
      startDate: '',
      endDate: '',
      status: ''
    });
  };
  
  const applyFilters = () => {
    let result = [...schedule];
    
    // Filter by topic
    if (filters.topic) {
      result = result.filter(item => item.topic.title === filters.topic);
    }
    
    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      result = result.filter(item => new Date(item.scheduled_date) >= startDate);
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      result = result.filter(item => new Date(item.scheduled_date) <= endDate);
    }
    
    // Filter by status
    if (filters.status) {
      switch (filters.status) {
        case 'completed':
          result = result.filter(item => item.completed);
          break;
        case 'pending':
          result = result.filter(item => !item.completed && !item.postponed);
          break;
        case 'postponed':
          result = result.filter(item => item.postponed);
          break;
      }
    }
    
    setFilteredSchedule(result);
  };

  const getStatusBadge = (completed, postponed) => {
    if (completed) return <Badge bg="success">Completed</Badge>;
    if (postponed) return <Badge bg="warning">Postponed</Badge>;
    return <Badge bg="primary">Pending</Badge>;
  };

  if (loading && schedule.length === 0) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading revision schedule...</p>
      </div>
    );
  }

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center revision-card-header">
        <h4 className="mb-0 fw-bold">
          <i className="bi bi-calendar-range me-2"></i>
          Complete Revision Schedule
          {filteredSchedule.length > 0 && (
            <Badge bg="primary" pill className="ms-2 badge-count">{filteredSchedule.length}</Badge>
          )}
        </h4>
      </Card.Header>
      <Card.Body className="revision-card-body">
        {error && <Alert variant="danger" className="mb-3 alert-animated">{error}</Alert>}
        {success && <Alert variant="success" className="mb-3 alert-animated">{success}</Alert>}
        
        {/* Filter Section */}
        <Card className="mb-4 filter-card">
          <Card.Body>
            <h5 className="mb-3 fw-bold"><i className="bi bi-funnel me-2"></i>Filters</h5>
            <Form>
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Topic</Form.Label>
                    <Form.Select 
                      name="topic"
                      value={filters.topic}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Topics</option>
                      {topics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select 
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="postponed">Postponed</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Button variant="secondary" onClick={clearFilters}>
                <i className="bi bi-x-circle me-1"></i>
                Clear Filters
              </Button>
            </Form>
          </Card.Body>
        </Card>
        
        {filteredSchedule.length === 0 ? (
          <Alert variant="info" className="d-flex align-items-center">
            <i className="bi bi-info-circle-fill text-primary me-2 fs-4"></i>
            <div>
              {schedule.length === 0 
                ? <><strong>No revisions scheduled.</strong> Add some topics to get started!</> 
                : <><strong>No matches found.</strong> Try adjusting your filter criteria.</>}
            </div>
          </Alert>
        ) : (
          <ListGroup variant="flush" className="revision-list scrollable-list">
            {filteredSchedule.map(revision => (
              <ListGroup.Item 
                key={revision.id} 
                className={`
                  revision-item
                  ${revision.completed ? 'completed-item' : ''}
                  ${revision.postponed ? 'postponed-item' : ''}
                  ${completedIds.includes(revision.id) ? 'item-completing' : ''}
                  ${postponedIds.includes(revision.id) ? 'item-postponing' : ''}
                `}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1 fw-bold">{revision.topic.title}</h6>
                    <div className="d-flex align-items-center flex-wrap">
                      <Badge bg="info" pill className="me-2">
                        Revision {revision.day_number}
                      </Badge>
                      <Badge bg={revision.completed ? 'success' : revision.postponed ? 'warning' : 'primary'} className="me-2">
                        {revision.completed ? 'Completed' : revision.postponed ? 'Postponed' : 'Pending'}
                      </Badge>
                      <small className="text-muted">
                        Scheduled: {new Date(revision.scheduled_date).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                  
                  {!revision.completed && !revision.postponed && (
                    <div className="d-flex gap-2">
                      <Button 
                        variant="success"
                        size="sm"
                        onClick={() => handleAction(revision.id, 'complete')}
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
                        onClick={() => handleAction(revision.id, 'postpone')}
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
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default RevisionSchedule; 