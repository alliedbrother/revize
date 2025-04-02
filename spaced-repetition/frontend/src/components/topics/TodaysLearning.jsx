import { useState, useEffect } from 'react';
import { Container, Card, Alert, Spinner, Button } from 'react-bootstrap';
import { topicService } from '../../services/api';
import { Link } from 'react-router-dom';

const TodaysLearning = () => {
  const [todaysLearning, setTodaysLearning] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTodaysTopics();
  }, []);

  const fetchTodaysTopics = async () => {
    try {
      setLoading(true);
      const topicsResponse = await topicService.getAllTopics();
      
      const todayTopics = [];
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      topicsResponse.data.forEach(topic => {
        // Check if topic was created today
        if (new Date(topic.date_created).toISOString().split('T')[0] === today) {
          todayTopics.push(topic);
        }
      });
      
      setTodaysLearning(todayTopics);
    } catch (err) {
      setError('Failed to fetch today\'s topics. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await topicService.deleteTopic(id);
      setTodaysLearning(todaysLearning.filter(topic => topic.id !== id));
    } catch (err) {
      setError('Failed to delete topic. Please try again.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-3">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading today's topics...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="h-100">
      {error && <Alert variant="danger">{error}</Alert>}
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Topics I Learned Today</h2>
        <Link to="/topics/new" className="btn btn-primary">
          Add New Topic
        </Link>
      </div>
      
      <div className="topics-container bg-sky-blue p-3 rounded" style={{maxHeight: '500px', overflowY: 'auto'}}>
        {todaysLearning.length === 0 ? (
          <div className="text-center py-4">
            <h5>You haven't added any topics today.</h5>
            <p>Learning something new? Add it as a topic!</p>
          </div>
        ) : (
          <>
            <p>You've learned {todaysLearning.length} new topic(s) today:</p>
            {todaysLearning.map(topic => (
              <Card key={topic.id} className="mb-2 topic-card">
                <Card.Body className="d-flex justify-content-between align-items-center py-2">
                  <Link to={`/topics/${topic.id}`} className="topic-title">
                    <h5 className="mb-0">{topic.title}</h5>
                  </Link>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => handleDelete(topic.id)}
                    className="delete-btn"
                  >
                    ✕
                  </Button>
                </Card.Body>
              </Card>
            ))}
          </>
        )}
      </div>
    </Container>
  );
};

export default TodaysLearning; 