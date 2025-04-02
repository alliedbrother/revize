import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, Form, ButtonGroup } from 'react-bootstrap';
import { revisionService, topicService } from '../../services/api';
import { Link } from 'react-router-dom';

const AllRevisions = () => {
  const [revisions, setRevisions] = useState([]);
  const [topics, setTopics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    date: '',
    status: ''
  });
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchAllData();
  }, [filters]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Fetch all topics to get their names
      const topicsResponse = await topicService.getAllTopics();
      
      // Create a map of topic IDs to topic details
      const topicsMap = {};
      topicsResponse.data.forEach(topic => {
        topicsMap[topic.id] = topic;
      });
      setTopics(topicsMap);
      
      // Fetch revisions with filters
      const revisionsResponse = await revisionService.getAllRevisions(filters);
      setRevisions(revisionsResponse.data);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await revisionService.completeRevision(id);
      // Update the revision in the list
      setRevisions(revisions.map(rev => 
        rev.id === id ? { ...rev, status: 'completed' } : rev
      ));
    } catch (err) {
      setError('Failed to mark revision as completed. Please try again.');
      console.error(err);
    }
  };

  const handlePostpone = async (id, days = 1) => {
    try {
      await revisionService.postponeRevision(id, days);
      // Update the revision in the list
      setRevisions(revisions.map(rev => 
        rev.id === id ? { ...rev, status: 'postponed' } : rev
      ));
    } catch (err) {
      setError('Failed to postpone revision. Please try again.');
      console.error(err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleQuickFilter = (status) => {
    setActiveFilter(status);
    if (status === 'all') {
      setFilters({ ...filters, status: '' });
    } else {
      setFilters({ ...filters, status });
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'postponed': return 'warning';
      default: return 'primary';
    }
  };

  // Get the topic title from the topics map or display a fallback
  const getTopicTitle = (topicId) => {
    return topics[topicId]?.title || `Topic #${topicId}`;
  };

  if (loading && revisions.length === 0) {
    return (
      <Container fluid className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid>
      <h2 className="mb-4">All Revisions</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Header>Filter Revisions</Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col>
              <ButtonGroup className="w-100">
                <Button 
                  variant={activeFilter === 'all' ? 'primary' : 'outline-primary'} 
                  onClick={() => handleQuickFilter('all')}
                >
                  All
                </Button>
                <Button 
                  variant={activeFilter === 'pending' ? 'primary' : 'outline-primary'} 
                  onClick={() => handleQuickFilter('pending')}
                >
                  Pending
                </Button>
                <Button 
                  variant={activeFilter === 'completed' ? 'primary' : 'outline-primary'} 
                  onClick={() => handleQuickFilter('completed')}
                >
                  Completed
                </Button>
                <Button 
                  variant={activeFilter === 'postponed' ? 'primary' : 'outline-primary'} 
                  onClick={() => handleQuickFilter('postponed')}
                >
                  Postponed
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                  className="date-input"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
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
            <Col md={4} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                className="mb-3"
                onClick={() => {
                  setFilters({ date: '', status: '' });
                  setActiveFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {revisions.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <h4>No revisions found</h4>
            <p>Try adjusting your filters or add new topics to create revisions.</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <p>Found {revisions.length} revision(s):</p>
          
          {revisions.map(revision => (
            <Card key={revision.id} className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <Link to={`/topics/${revision.topic}`}>
                    {getTopicTitle(revision.topic)}
                  </Link>
                </h5>
                <Badge bg={getStatusBadgeVariant(revision.status)}>
                  {revision.status.charAt(0).toUpperCase() + revision.status.slice(1)}
                </Badge>
              </Card.Header>
              <Card.Body>
                <Row className="align-items-center">
                  <Col>
                    <p className="mb-2">
                      <strong>Scheduled Date:</strong> {new Date(revision.scheduled_date).toLocaleDateString()}
                    </p>
                    <p className="mb-0">
                      <strong>Interval:</strong> {revision.interval} {revision.interval === 1 ? 'day' : 'days'}
                    </p>
                    {revision.completion_date && (
                      <p className="mb-0">
                        <strong>Completed on:</strong> {new Date(revision.completion_date).toLocaleDateString()}
                      </p>
                    )}
                    {revision.postponed_to && (
                      <p className="mb-0">
                        <strong>Postponed to:</strong> {new Date(revision.postponed_to).toLocaleDateString()}
                      </p>
                    )}
                  </Col>
                  {revision.status === 'pending' && (
                    <Col xs="auto">
                      <div className="d-flex gap-2">
                        <Button 
                          variant="success" 
                          onClick={() => handleComplete(revision.id)}
                        >
                          Complete
                        </Button>
                        <Button 
                          variant="warning"
                          onClick={() => handlePostpone(revision.id)}
                        >
                          Postpone
                        </Button>
                      </div>
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>
          ))}
        </>
      )}
    </Container>
  );
};

export default AllRevisions; 