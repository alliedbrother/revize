import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, ListGroup, Dropdown } from 'react-bootstrap';
import { topicService, revisionService } from '../../services/api';

const TopicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTopic();
  }, [id]);

  const fetchTopic = async () => {
    try {
      setLoading(true);
      const response = await topicService.getTopicById(id);
      setTopic(response.data);
    } catch (err) {
      setError('Failed to fetch topic details. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this topic?')) {
      try {
        await topicService.deleteTopic(id);
        navigate('/topics');
      } catch (err) {
        setError('Failed to delete topic. Please try again.');
        console.error(err);
      }
    }
  };

  const handleComplete = async (revisionId) => {
    try {
      setActionLoading(true);
      await revisionService.completeRevision(revisionId);
      await fetchTopic(); // Refresh the topic to get updated revisions
    } catch (err) {
      setError('Failed to mark revision as completed. Please try again.');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostpone = async (revisionId, days) => {
    try {
      setActionLoading(true);
      await revisionService.postponeRevision(revisionId, days);
      await fetchTopic(); // Refresh the topic to get updated revisions
    } catch (err) {
      setError('Failed to postpone revision. Please try again.');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate the next revision date based on the current interval
  const calculateNextRevisionDate = (revision) => {
    if (!revision) return null;
    
    const currentInterval = revision.interval || 1;
    const nextInterval = currentInterval * 2; // Double the interval for spaced repetition
    
    const today = new Date();
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + nextInterval);
    
    return {
      date: nextDate,
      interval: nextInterval
    };
  };

  // Find pending revisions (ones that can be actioned)
  const getPendingRevisions = () => {
    if (!topic || !topic.revisions) return [];
    return topic.revisions.filter(rev => rev.status === 'pending');
  };

  // Get the next pending revision
  const getNextPendingRevision = () => {
    const pendingRevisions = getPendingRevisions();
    if (pendingRevisions.length === 0) return null;
    
    // Sort by scheduled date (ascending)
    return pendingRevisions.sort((a, b) => 
      new Date(a.scheduled_date) - new Date(b.scheduled_date)
    )[0];
  };

  if (loading) {
    return (
      <Container fluid className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!topic) {
    return (
      <Container fluid>
        <Alert variant="danger">Topic not found or you don't have access to it.</Alert>
        <Button as={Link} to="/topics" variant="primary">
          Back to Topics
        </Button>
      </Container>
    );
  }

  const nextRevision = getNextPendingRevision();
  const nextSchedule = nextRevision ? calculateNextRevisionDate(nextRevision) : null;

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <Button 
            as={Link} 
            to="/topics" 
            variant="outline-secondary"
            className="mb-3"
          >
            &larr; Back to Topics
          </Button>
          <h1>{topic.title}</h1>
        </Col>
        <Col xs={12} md="auto" className="d-flex align-items-center">
          <Button 
            variant="danger" 
            onClick={handleDelete}
            className="ms-auto"
          >
            Delete Topic
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header as="h5">Description</Card.Header>
            <Card.Body>
              <Card.Text>
                {topic.description || 'No description provided.'}
              </Card.Text>
            </Card.Body>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Created:</strong> {new Date(topic.date_created).toLocaleDateString()}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Last Updated:</strong> {new Date(topic.date_modified).toLocaleDateString()}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-4">
            <Card.Header as="h5">Revision Schedule</Card.Header>
            <Card.Body>
              <p>Total Revisions: {topic.revisions?.length || 0}</p>
              {topic.revisions && topic.revisions.length > 0 ? (
                <ListGroup variant="flush">
                  {topic.revisions.map(revision => (
                    <ListGroup.Item key={revision.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        {new Date(revision.scheduled_date).toLocaleDateString()}
                        {revision.interval > 1 && 
                          <Badge bg="info" pill className="ms-2">
                            {revision.interval} days
                          </Badge>
                        }
                      </div>
                      <Badge bg={
                        revision.status === 'completed' ? 'success' :
                        revision.status === 'postponed' ? 'warning' : 'primary'
                      }>
                        {revision.status.charAt(0).toUpperCase() + revision.status.slice(1)}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted">No revisions scheduled yet.</p>
              )}
            </Card.Body>
          </Card>

          {nextRevision && (
            <Card className="mb-4 next-revision-card">
              <Card.Header as="h5" className="bg-primary text-white">
                Next Revision
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="mb-0">Scheduled for: {new Date(nextRevision.scheduled_date).toLocaleDateString()}</h5>
                    <small className="text-muted">Interval: {nextRevision.interval} {nextRevision.interval === 1 ? 'day' : 'days'}</small>
                  </div>
                </div>
                
                {nextSchedule && (
                  <Alert variant="info" className="mb-3">
                    <strong>Next scheduling:</strong> If completed today, the next revision will be in {nextSchedule.interval} days
                    ({nextSchedule.date.toLocaleDateString()})
                  </Alert>
                )}
                
                <div className="d-flex gap-2">
                  <Button 
                    variant="success" 
                    onClick={() => handleComplete(nextRevision.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Complete Revision'}
                  </Button>
                  
                  <Dropdown>
                    <Dropdown.Toggle variant="warning" id="dropdown-postpone">
                      Postpone
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handlePostpone(nextRevision.id, 1)}>1 day</Dropdown.Item>
                      <Dropdown.Item onClick={() => handlePostpone(nextRevision.id, 3)}>3 days</Dropdown.Item>
                      <Dropdown.Item onClick={() => handlePostpone(nextRevision.id, 7)}>1 week</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default TopicDetail; 