import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { topicService } from '../../services/api';

const TopicList = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const response = await topicService.getAllTopics();
        console.log('Fetched topics:', response.data);
        setTopics(response.data);
      } catch (err) {
        setError('Failed to fetch topics. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this topic?')) {
      try {
        await topicService.deleteTopic(id);
        setTopics(topics.filter(topic => topic.id !== id));
      } catch (err) {
        setError('Failed to delete topic. Please try again.');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>My Study Topics</h2>
        </Col>
        <Col className="text-end">
          <Button as={Link} to="/topics/new" variant="primary">
            Add New Topic
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {topics.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <h4>You don't have any study topics yet</h4>
            <p>Start by adding your first topic to begin tracking your learning journey</p>
            <Button as={Link} to="/topics/new" variant="success">
              Add Your First Topic
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {topics.map(topic => (
            <Col key={topic.id}>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{topic.title}</h5>
                </Card.Header>
                <Card.Body>
                  <Card.Text>
                    {topic.description || 'No description provided'}
                  </Card.Text>
                </Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <small className="text-muted">
                      Created: {new Date(topic.date_created).toLocaleDateString()}
                    </small>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <small className="text-muted">
                      Revisions: {topic.revisions?.length || 0}
                    </small>
                  </ListGroup.Item>
                </ListGroup>
                <Card.Footer className="d-flex justify-content-between">
                  <Link 
                    to={`/topics/${topic.id}`}
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => console.log(`Navigating to topic ID: ${topic.id}`)}
                  >
                    View Details
                  </Link>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(topic.id)}
                  >
                    Delete
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default TopicList; 