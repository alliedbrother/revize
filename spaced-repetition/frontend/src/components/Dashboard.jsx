import { Container, Row, Col, Alert } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import TodaysLearning from './topics/TodaysLearning';
import RevisionSchedule from './revisions/RevisionSchedule';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('Dashboard component mounted');
    console.log('Auth state in Dashboard:', { currentUser });
    setMounted(true);
  }, [currentUser]);

  return (
    <Container fluid className="py-3">
      <Row className="mb-3">
        <Col>
          <h1 className="dashboard-title">My Learning Dashboard</h1>
          {!mounted && <Alert variant="info">Loading dashboard...</Alert>}
          {currentUser && (
            <div className="welcome-container">
              <p className="welcome-text">
                Welcome, <span className="username-highlight">{currentUser.username}!</span>
              </p>
            </div>
          )}
        </Col>
      </Row>
      
      {/* Display components side by side */}
      <Row className="equal-height-row g-4">
        <Col md={6} className="mb-md-0 mb-4">
          <div className="h-100">
            <TodaysLearning />
          </div>
        </Col>
        
        <Col md={6}>
          <div className="h-100">
            <RevisionSchedule />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard; 