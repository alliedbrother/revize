import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, Dropdown } from 'react-bootstrap';
import { revisionService, topicService } from '../../services/api';
import { Link } from 'react-router-dom';
import { getTodayDateString, formatDate, isToday, isPast, isFuture, isTomorrow } from '../../utils/dateUtils';

// Renamed component to RevisionSchedule to better reflect its purpose
const RevisionSchedule = () => {
  const [allRevisions, setAllRevisions] = useState([]);
  const [topics, setTopics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Get all topics to reference names
      const topicsResponse = await topicService.getAllTopics();
      
      // Create a map of topic IDs to topic details
      const topicsMap = {};
      
      topicsResponse.data.forEach(topic => {
        topicsMap[topic.id] = topic;
      });
      
      setTopics(topicsMap);
      
      // Get all pending revisions
      const allRevisionsResponse = await revisionService.getAllRevisions({ status: 'pending' });
      
      // Log all revisions for debugging
      allRevisionsResponse.data.forEach(revision => {
        console.log(`Revision for "${topicsMap[revision.topic]?.title}": scheduled for ${revision.scheduled_date}, is today: ${isToday(revision.scheduled_date)}, is tomorrow: ${isTomorrow(revision.scheduled_date)}`);
      });
      
      setAllRevisions(allRevisionsResponse.data);
    } catch (err) {
      setError('Failed to fetch revisions. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await revisionService.completeRevision(id);
      // Refresh data after completion
      fetchData();
    } catch (err) {
      setError('Failed to mark revision as completed. Please try again.');
      console.error(err);
    }
  };

  const handlePostpone = async (id, days = 1) => {
    try {
      await revisionService.postponeRevision(id, days);
      // Refresh data after postponement
      fetchData();
    } catch (err) {
      setError('Failed to postpone revision. Please try again.');
      console.error(err);
    }
  };
  
  // Get the topic title from the topics map or display a fallback
  const getTopicTitle = (topicId) => {
    return topics[topicId]?.title || `Topic #${topicId}`;
  };

  // Group revisions by date for future view
  const getRevisionsByDate = () => {
    const grouped = {};
    
    allRevisions.forEach(revision => {
      const date = revision.scheduled_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(revision);
    });
    
    // Sort dates
    return Object.keys(grouped)
      .sort()
      .map(date => ({
        date,
        formattedDate: formatDate(date),
        isToday: isToday(date),
        isTomorrow: isTomorrow(date),
        revisions: grouped[date]
      }));
  };

  // Get badge text for revision status
  const getRevisionStatusText = (scheduledDate) => {
    if (isToday(scheduledDate)) return "Today";
    if (isTomorrow(scheduledDate)) return "Tomorrow";
    if (isPast(scheduledDate)) return "Overdue";
    return "Upcoming";
  };
  
  // Get badge color for revision status
  const getRevisionStatusColor = (scheduledDate) => {
    if (isToday(scheduledDate)) return "success";
    if (isTomorrow(scheduledDate)) return "info";
    if (isPast(scheduledDate)) return "danger";
    return "secondary";
  };

  // Render a single revision card
  const renderRevisionCard = (revision) => (
    <Card key={revision.id} className="mb-2 revision-card">
      <Card.Body className="py-2">
        <Row className="align-items-center">
          <Col>
            <div className="d-flex align-items-center">
              <Link to={`/topics/${revision.topic}`} className="me-2">
                <span className="topic-title">{getTopicTitle(revision.topic)}</span>
              </Link>
              <Badge bg="primary" className="ms-2">
                {revision.interval} {revision.interval === 1 ? 'day' : 'days'}
              </Badge>
            </div>
          </Col>
          <Col xs="auto">
            <div className="d-flex gap-2">
              {isToday(revision.scheduled_date) && (
                <>
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={() => handleComplete(revision.id)}
                    title="Complete"
                  >
                    ✓
                  </Button>
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="warning" size="sm" id={`dropdown-${revision.id}`}>
                      ⏱
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handlePostpone(revision.id, 1)}>1 day</Dropdown.Item>
                      <Dropdown.Item onClick={() => handlePostpone(revision.id, 3)}>3 days</Dropdown.Item>
                      <Dropdown.Item onClick={() => handlePostpone(revision.id, 7)}>1 week</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </>
              )}
              {!isToday(revision.scheduled_date) && (
                <Badge bg={getRevisionStatusColor(revision.scheduled_date)}>
                  {getRevisionStatusText(revision.scheduled_date)}
                </Badge>
              )}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  if (loading) {
    return (
      <Container className="text-center mt-3">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading revisions...</span>
        </Spinner>
      </Container>
    );
  }

  const revisionsByDate = getRevisionsByDate();

  return (
    <Container className="h-100">
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="revisions-container bg-pale-blue p-3 rounded" style={{maxHeight: '500px', overflowY: 'auto'}}>
        {revisionsByDate.length === 0 ? (
          <div className="text-center py-4">
            <h4>No scheduled revisions</h4>
            <p>Add some topics to start your spaced repetition journey!</p>
          </div>
        ) : (
          <div className="future-revisions">
            {revisionsByDate.map(dateGroup => (
              <div key={dateGroup.date} className="date-group mb-4">
                <h5 className={`date-header ${dateGroup.isToday ? 'today-header' : ''}`}>
                  {dateGroup.formattedDate}
                  <Badge bg={getRevisionStatusColor(dateGroup.date)} className="ms-2">
                    {getRevisionStatusText(dateGroup.date)}
                  </Badge>
                </h5>
                
                {dateGroup.revisions.map(revision => renderRevisionCard(revision))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default RevisionSchedule; 