import { useState } from 'react';
import { Card, Form, Button, ListGroup, Alert } from 'react-bootstrap';

const TodaysLearning = () => {
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [error, setError] = useState('');

  const handleAddTopic = (e) => {
    e.preventDefault();
    
    if (!newTopic.trim()) {
      setError('Please enter a topic');
      return;
    }

    const topic = {
      id: Date.now(),
      title: newTopic.trim(),
      timestamp: new Date().toISOString()
    };

    setTopics([...topics, topic]);
    setNewTopic('');
    setError('');
  };

  const handleDeleteTopic = (id) => {
    setTopics(topics.filter(topic => topic.id !== id));
  };

  return (
    <Card className="h-100">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Today's Learning</h5>
        <span className="badge bg-light text-primary">
          {topics.length} {topics.length === 1 ? 'Topic' : 'Topics'}
        </span>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleAddTopic} className="mb-3">
          <Form.Group className="d-flex gap-2">
            <Form.Control
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="What did you learn today?"
              isInvalid={!!error}
            />
            <Button type="submit" variant="primary">
              Add
            </Button>
          </Form.Group>
          {error && <Form.Text className="text-danger">{error}</Form.Text>}
        </Form>

        {topics.length === 0 ? (
          <Alert variant="info">
            You haven't added any topics for today. Start by adding what you've learned!
          </Alert>
        ) : (
          <ListGroup variant="flush">
            {topics.map(topic => (
              <ListGroup.Item
                key={topic.id}
                className="d-flex justify-content-between align-items-center"
              >
                <div>
                  <h6 className="mb-0">{topic.title}</h6>
                  <small className="text-muted">
                    {new Date(topic.timestamp).toLocaleTimeString()}
                  </small>
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDeleteTopic(topic.id)}
                >
                  Remove
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default TodaysLearning; 