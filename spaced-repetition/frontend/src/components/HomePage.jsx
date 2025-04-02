import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="hero-section py-5 bg-light">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h1 className="display-4 mb-3">Master Any Subject with Spaced Repetition</h1>
              <p className="lead mb-4">
                Our app helps you remember what you study using scientifically-proven spaced repetition techniques.
                Learn more effectively and never forget important information again.
              </p>
              <div className="d-flex gap-3">
                <Button as={Link} to="/register" variant="primary" size="lg">
                  Get Started
                </Button>
                <Button as={Link} to="/login" variant="outline-secondary" size="lg">
                  Login
                </Button>
              </div>
            </Col>
            <Col md={6} className="text-center">
              <img 
                src="/spaced-repetition.svg" 
                alt="Spaced Repetition Illustration" 
                className="img-fluid rounded shadow-lg"
              />
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-5">
        <h2 className="text-center mb-5">How It Works</h2>
        <Row>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="feature-icon mb-3">
                  <span className="display-4">📚</span>
                </div>
                <Card.Title>1. Add Topics</Card.Title>
                <Card.Text>
                  Input what you've studied and the app automatically calculates when you should review it next.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="feature-icon mb-3">
                  <span className="display-4">🔍</span>
                </div>
                <Card.Title>2. Review on Schedule</Card.Title>
                <Card.Text>
                  Check your dashboard daily to see which topics need revision, optimized for better retention.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="feature-icon mb-3">
                  <span className="display-4">📈</span>
                </div>
                <Card.Title>3. Track Progress</Card.Title>
                <Card.Text>
                  Mark topics as completed or postpone them. The system adapts to your learning pace.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <div className="bg-primary text-white py-5">
        <Container className="text-center">
          <h2 className="mb-4">Ready to improve your learning efficiency?</h2>
          <Button as={Link} to="/register" variant="light" size="lg">
            Start Your Learning Journey
          </Button>
        </Container>
      </div>
    </div>
  );
};

export default HomePage; 