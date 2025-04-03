import { useState, useEffect, useContext } from 'react';
import { Card, Row, Col, Alert, Button, ProgressBar, Badge, ListGroup } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { getStatistics } from '../../services/api';
import { RefreshContext } from './Dashboard';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import './css/Statistics.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { refreshTrigger } = useContext(RefreshContext);
  const [streakDays, setStreakDays] = useState(7); // Placeholder - will come from API
  const [achievements, setAchievements] = useState([
    { id: 1, title: 'First Topic', description: 'Created your first topic', date: '2023-05-15', icon: 'trophy-fill' },
    { id: 2, title: 'Perfect Week', description: 'Completed all revisions for 7 days straight', date: '2023-05-22', icon: 'calendar-check' },
    { id: 3, title: 'Knowledge Master', description: 'Created 10 topics', date: '2023-06-01', icon: 'mortarboard-fill' }
  ]); // Placeholder - will be dynamic in the future

  useEffect(() => {
    loadStatistics();
  }, [refreshTrigger]); // Refresh when triggerRefresh is called

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await getStatistics();
      setStats(data);
      setError('');
    } catch (err) {
      setError('Failed to load statistics');
      console.error("Error loading statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  // Generate data for weekly activity chart
  const getWeeklyActivityData = () => {
    // This would be replaced with actual data from API
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Revisions Completed',
          data: [4, 6, 2, 8, 5, 3, 7],
          backgroundColor: 'rgba(13, 110, 253, 0.6)',
          borderColor: '#0d6efd',
          borderWidth: 1,
        },
      ],
    };
  };

  // Generate data for topics by category chart
  const getTopicsByCategoryData = () => {
    // This would be replaced with actual data from API
    return {
      labels: ['Math', 'Science', 'History', 'Languages', 'Other'],
      datasets: [
        {
          data: [12, 8, 5, 7, 3],
          backgroundColor: [
            '#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#fd7e14',
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  // Render streak meter
  const renderStreakMeter = () => {
    return (
      <div className="streak-meter-container">
        <div className="streak-label">
          <i className="bi bi-fire text-danger"></i>
          <span>Current Streak</span>
          <h3 className="streak-value">{streakDays} days</h3>
        </div>
        <div className="streak-circles">
          {[...Array(7)].map((_, index) => (
            <div 
              key={index} 
              className={`streak-circle ${index < streakDays ? 'active' : ''}`}
              title={`Day ${index + 1}`}
            >
              {index < streakDays && <i className="bi bi-check"></i>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading && !stats) {
    return (
      <div className="statistics-loading">
        <i className="bi bi-graph-up spinning"></i>
        <p>Loading statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return <Alert variant="info">No statistics available yet.</Alert>;
  }

  return (
    <>
      <Card className="mb-4 statistics-card">
        <Card.Header className="d-flex justify-content-between align-items-center statistics-header">
          <h4 className="mb-0 fw-bold">
            <i className="bi bi-bar-chart-fill me-2"></i>
            Statistics Dashboard
          </h4>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={loadStatistics} 
            disabled={loading}
            className="refresh-button"
          >
            {loading ? (
              <>
                <i className="bi bi-arrow-repeat spinning me-1"></i>
                Refreshing...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-repeat me-1"></i>
                Refresh
              </>
            )}
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" className="alert-animated">{error}</Alert>}
          
          {/* Streak Meter */}
          <Row className="mb-4">
            <Col xs={12}>
              <Card className="streak-card">
                <Card.Body>
                  {renderStreakMeter()}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Key Metrics */}
          <Row className="mb-4">
            <Col md={3} sm={6} className="mb-3 mb-md-0">
              <div className="metric-card">
                <div className="metric-icon bg-primary">
                  <i className="bi bi-journal-text"></i>
                </div>
                <div className="metric-content">
                  <h3>{stats.total_topics || 0}</h3>
                  <p>Total Topics</p>
                </div>
              </div>
            </Col>
            <Col md={3} sm={6} className="mb-3 mb-md-0">
              <div className="metric-card">
                <div className="metric-icon bg-success">
                  <i className="bi bi-check2-circle"></i>
                </div>
                <div className="metric-content">
                  <h3>{stats.completed_revisions || 0}</h3>
                  <p>Completed Revisions</p>
                </div>
              </div>
            </Col>
            <Col md={3} sm={6} className="mb-3 mb-md-0">
              <div className="metric-card">
                <div className="metric-icon bg-warning">
                  <i className="bi bi-hourglass-split"></i>
                </div>
                <div className="metric-content">
                  <h3>{stats.pending_revisions || 0}</h3>
                  <p>Pending Revisions</p>
                </div>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="metric-card">
                <div className="metric-icon bg-info">
                  <i className="bi bi-calendar-week"></i>
                </div>
                <div className="metric-content">
                  <h3>{stats.topics_this_week || 0}</h3>
                  <p>Topics This Week</p>
                </div>
              </div>
            </Col>
          </Row>
        
          {/* Charts Row */}
          <Row className="mb-4">
            <Col md={6} className="mb-4 mb-md-0">
              <Card className="chart-card">
                <Card.Header className="chart-header">
                  <h5 className="mb-0">
                    <i className="bi bi-graph-up me-2"></i>
                    Weekly Activity
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="chart-container">
                    <Bar 
                      data={getWeeklyActivityData()} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              drawBorder: false
                            }
                          },
                          x: {
                            grid: {
                              display: false
                            }
                          }
                        }
                      }} 
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="chart-card">
                <Card.Header className="chart-header">
                  <h5 className="mb-0">
                    <i className="bi bi-pie-chart-fill me-2"></i>
                    Topics by Category
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="chart-container">
                    <Doughnut 
                      data={getTopicsByCategoryData()} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom'
                          }
                        },
                        cutout: '70%'
                      }} 
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Learning Progress */}
          <Row className="mb-4">
            <Col xs={12}>
              <Card className="progress-card">
                <Card.Header className="progress-header">
                  <h5 className="mb-0">
                    <i className="bi bi-lightning-charge me-2"></i>
                    Learning Progress
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="progress-item">
                    <div className="progress-label">
                      <span>Completion Rate</span>
                      <span>{Math.round((stats.completed_revisions / (stats.total_revisions || 1)) * 100)}%</span>
                    </div>
                    <ProgressBar 
                      now={Math.round((stats.completed_revisions / (stats.total_revisions || 1)) * 100)} 
                      variant="success" 
                      className="custom-progress"
                    />
                  </div>
                  <div className="progress-item">
                    <div className="progress-label">
                      <span>Weekly Goal</span>
                      <span>{stats.topics_this_week || 0}/10</span>
                    </div>
                    <ProgressBar 
                      now={(stats.topics_this_week || 0) * 10} 
                      variant="primary" 
                      className="custom-progress"
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Achievements */}
          <Row>
            <Col xs={12}>
              <Card className="achievements-card">
                <Card.Header className="achievements-header">
                  <h5 className="mb-0">
                    <i className="bi bi-trophy me-2"></i>
                    Achievements
                    <Badge bg="primary" pill className="ms-2">{achievements.length}</Badge>
                  </h5>
                </Card.Header>
                <Card.Body>
                  {achievements.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="bi bi-emoji-smile display-4 text-muted"></i>
                      <p className="mt-3">Keep learning to earn achievements!</p>
                    </div>
                  ) : (
                    <ListGroup variant="flush" className="achievements-list">
                      {achievements.map(achievement => (
                        <ListGroup.Item key={achievement.id} className="achievement-item">
                          <div className="achievement-icon">
                            <i className={`bi bi-${achievement.icon}`}></i>
                          </div>
                          <div className="achievement-content">
                            <h6>{achievement.title}</h6>
                            <p>{achievement.description}</p>
                          </div>
                          <div className="achievement-date">
                            <Badge bg="light" text="dark">
                              <i className="bi bi-calendar2 me-1"></i>
                              {new Date(achievement.date).toLocaleDateString()}
                            </Badge>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </>
  );
};

export default Statistics; 