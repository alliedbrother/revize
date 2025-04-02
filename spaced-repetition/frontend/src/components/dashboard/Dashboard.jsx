import { Container, Row, Col } from 'react-bootstrap';
import TodaysLearning from '../topics/TodaysLearning';
import TodaysRevisions from '../revisions/TodaysRevisions';

const Dashboard = () => {
  return (
    <Container fluid>
      <Row>
        <Col md={6} className="mb-4 mb-md-0">
          <TodaysLearning />
        </Col>
        <Col md={6}>
          <TodaysRevisions />
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard; 