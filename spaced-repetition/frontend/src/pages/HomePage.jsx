import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import learningIllustration from '../assets/images/learning-illustration.svg';
import bookIcon from '../assets/images/book-icon.svg';
import clockIcon from '../assets/images/clock-icon.svg';
import brainIcon from '../assets/images/brain-icon.svg';

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h1>Master Any Subject with Spaced Repetition</h1>
              <p className="lead mb-4">
                Learn more effectively and never forget important information again with our scientifically-proven spaced repetition techniques.
              </p>
              <div className="d-flex gap-3">
                <Button as={Link} to="/register" variant="light" size="lg">
                  Get Started
                </Button>
                <Button as={Link} to="/login" variant="outline-light" size="lg">
                  Login
                </Button>
              </div>
            </Col>
            <Col md={6} className="text-center">
              <img 
                src={learningIllustration}
                alt="Spaced Repetition Learning" 
                className="img-fluid"
                style={{ maxWidth: '80%' }}
              />
            </Col>
          </Row>
        </Container>
      </section>

      <Container className="py-5">
        <Row className="text-center mb-5">
          <Col>
            <h2>How It Works</h2>
            <p className="lead">
              Simple steps to improve your learning experience
            </p>
          </Col>
        </Row>

        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="feature-icon mb-3">
                  <img src={bookIcon} alt="Create Topics" width="64" height="64" />
                </div>
                <Card.Title>Create Topics</Card.Title>
                <Card.Text>
                  Add the subjects or topics you want to learn and master.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="feature-icon mb-3">
                  <img src={clockIcon} alt="Schedule Reviews" width="64" height="64" />
                </div>
                <Card.Title>Schedule Reviews</Card.Title>
                <Card.Text>
                  Set up personalized review schedules based on your learning pace.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="feature-icon mb-3">
                  <img src={brainIcon} alt="Master Content" width="64" height="64" />
                </div>
                <Card.Title>Master Content</Card.Title>
                <Card.Text>
                  Review topics at optimal intervals to strengthen your memory.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <div className="bg-light py-5">
        <Container>
          <Row className="justify-content-center text-center">
            <Col md={8}>
              <h2 className="mb-4">Ready to improve your learning?</h2>
              <p className="lead mb-4">
                Join thousands of students who are already using spaced repetition to master their subjects.
              </p>
              <Button as={Link} to="/register" variant="primary" size="lg">
                Start Learning Now
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default HomePage; 