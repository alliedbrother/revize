import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Card, Alert, Badge } from 'react-bootstrap';
import { topicService } from '../../services/api';

const TopicForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initialRevisionDate, setInitialRevisionDate] = useState('');
  const [dateStatus, setDateStatus] = useState('future');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Check if a date is in the past, present, or future
  const checkDateStatus = (dateString) => {
    if (!dateString) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDate = new Date(dateString);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate.getTime() < today.getTime()) {
      setDateStatus('past');
    } else if (selectedDate.getTime() === today.getTime()) {
      setDateStatus('today');
    } else {
      setDateStatus('future');
    }
  };

  // Set default initial revision date to tomorrow when component loads
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Format as YYYY-MM-DD
    const formattedDate = tomorrow.toISOString().split('T')[0];
    setInitialRevisionDate(formattedDate);
    
    // Update the status based on the selected date
    checkDateStatus(formattedDate);
  }, []);

  // Update status when date changes
  useEffect(() => {
    checkDateStatus(initialRevisionDate);
  }, [initialRevisionDate]);

  const getDateBadgeVariant = () => {
    switch (dateStatus) {
      case 'past':
        return 'warning';
      case 'today':
        return 'success';
      case 'future':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const getDateStatusText = () => {
    switch (dateStatus) {
      case 'past':
        return 'Back-dated Revision';
      case 'today':
        return 'Start Today';
      case 'future':
        return 'Future Revision';
      default:
        return '';
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setInitialRevisionDate(newDate);
    checkDateStatus(newDate);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title) {
      return setError('Title is required');
    }
    
    if (!initialRevisionDate) {
      return setError('First revision date is required');
    }
    
    try {
      setLoading(true);
      setError('');
      
      await topicService.createTopic({
        title,
        description,
        initial_revision_date: initialRevisionDate
      });
      
      navigate('/topics');
    } catch (err) {
      setError('Failed to create topic. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="auth-container">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header as="h2">Add New Study Topic</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="title">
                  <Form.Label>Topic Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What are you learning?"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add notes or details about this topic"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="initialRevisionDate">
                  <Form.Label className="d-flex justify-content-between align-items-center">
                    Schedule First Revision Date * 
                    <Badge bg={getDateBadgeVariant()} className="date-status-badge">
                      {getDateStatusText()}
                    </Badge>
                  </Form.Label>
                  <div className="date-input-container d-flex align-items-center">
                    <Form.Control
                      type="date"
                      value={initialRevisionDate}
                      onChange={handleDateChange}
                      required
                      className={`date-input date-status-${dateStatus}`}
                    />
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="ms-2 set-tomorrow-btn"
                      onClick={() => {
                        const today = new Date();
                        const tomorrow = new Date(today);
                        tomorrow.setDate(today.getDate() + 1);
                        const formattedDate = tomorrow.toISOString().split('T')[0];
                        setInitialRevisionDate(formattedDate);
                        checkDateStatus(formattedDate);
                      }}
                      title="Reset to tomorrow's date"
                    >
                      Set to tomorrow
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    Choose when you want to start revising this topic. You can select any date, including past dates.
                  </Form.Text>
                </Form.Group>
                
                <Alert variant="info">
                  You can schedule when to begin reviewing this topic. By default, the first revision is set for tomorrow.
                </Alert>
                
                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Topic'}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/topics')}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TopicForm; 