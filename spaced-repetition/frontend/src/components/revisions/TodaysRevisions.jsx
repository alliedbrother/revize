import { useState } from 'react';
import { Card, ListGroup, Button, Badge, Dropdown } from 'react-bootstrap';

const TodaysRevisions = () => {
  const [revisions, setRevisions] = useState([
    {
      id: 1,
      title: 'JavaScript Promises',
      dueTime: '10:00 AM',
      status: 'pending'
    },
    {
      id: 2,
      title: 'React Hooks',
      dueTime: '2:00 PM',
      status: 'pending'
    }
  ]);

  const handleComplete = (id) => {
    setRevisions(revisions.map(rev => 
      rev.id === id ? { ...rev, status: 'completed' } : rev
    ));
  };

  const handlePostpone = (id, days) => {
    setRevisions(revisions.map(rev => 
      rev.id === id ? { ...rev, status: 'postponed' } : rev
    ));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge bg="success">Completed</Badge>;
      case 'postponed':
        return <Badge bg="warning">Postponed</Badge>;
      default:
        return <Badge bg="primary">Pending</Badge>;
    }
  };

  return (
    <Card className="h-100">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Today's Revisions</h5>
        <span className="badge bg-light text-primary">
          {revisions.filter(r => r.status === 'pending').length} Pending
        </span>
      </Card.Header>
      <Card.Body>
        {revisions.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">No revisions scheduled for today</p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {revisions.map(revision => (
              <ListGroup.Item
                key={revision.id}
                className="d-flex justify-content-between align-items-center"
              >
                <div>
                  <h6 className="mb-1">{revision.title}</h6>
                  <small className="text-muted">Due: {revision.dueTime}</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {getStatusBadge(revision.status)}
                  {revision.status === 'pending' && (
                    <div className="d-flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleComplete(revision.id)}
                      >
                        Complete
                      </Button>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                          Postpone
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handlePostpone(revision.id, 1)}>
                            1 Day
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handlePostpone(revision.id, 3)}>
                            3 Days
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handlePostpone(revision.id, 7)}>
                            1 Week
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default TodaysRevisions; 