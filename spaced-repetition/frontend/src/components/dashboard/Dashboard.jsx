import { useState, useEffect, createContext } from 'react';
import { Container, Row, Col, Nav, Tab, Badge } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TodaysLearning from '../topics/TodaysLearning';
import TodaysRevisions from '../revisions/TodaysRevisions';
import AllTopics from '../topics/AllTopics';
import RevisionSchedule from '../revisions/RevisionSchedule';
import Statistics from '../dashboard/Statistics';
import { getMissedRevisions } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LightweightBackground from '../common/LightweightBackground';
import './Dashboard.css';

// Create a context for triggering data refresh
export const RefreshContext = createContext();

// Dashboard component
const Dashboard = () => {
  // Use URL search params to maintain tab state on refresh
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get active tab from URL or default to 'today'
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'today');
  
  // State for triggering refreshes
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [missedRevisions, setMissedRevisions] = useState([]);

  // Get current user
  const { user } = useAuth();
  const username = user?.username || 'Scholar';
  
  // Function to trigger refresh in child components
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Update URL when tab changes
  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };
  
  // Set initial tab from URL on component mount
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl) {
      // If no tab in URL, add the current active tab to URL
      setSearchParams({ tab: activeTab });
    }
  }, [tabFromUrl, activeTab, setSearchParams]);

  // Check for missed revisions to show badge
  useEffect(() => {
    const checkMissedRevisions = async () => {
      try {
        const data = await getMissedRevisions();
        setMissedRevisions(data);
      } catch (err) {
        console.error("Error checking missed revisions:", err);
      }
    };
    
    checkMissedRevisions();
  }, [refreshTrigger]);

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      <div className="dashboard-wrapper">
        <LightweightBackground height="120px" className="welcome-header-container">
          <div className="welcome-header">
            <h2 className="welcome-title">
              <span className="welcome-text">Welcome</span><span className="user-name-glow">{username}</span>
            </h2>
          </div>
        </LightweightBackground>
        
        <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
          <Row className="m-0">
            <Col sm={12}>
              <Nav variant="tabs" className="dashboard-tabs">
                <Nav.Item>
                  <Nav.Link eventKey="today" className="position-relative dashboard-tab">
                    <i className="bi bi-calendar-day me-2"></i>
                    Today's Learning
                    {missedRevisions.length > 0 && (
                      <Badge 
                        pill 
                        bg="danger" 
                        className="notification-badge position-absolute"
                        style={{ 
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.6rem',
                          top: '0px',
                          right: '5px',
                          transform: 'none'
                        }}
                      >
                        {missedRevisions.length}
                      </Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="revisions" className="dashboard-tab">
                    <i className="bi bi-calendar-range me-2"></i>
                    Revision Schedule
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="topics" className="dashboard-tab">
                    <i className="bi bi-collection me-2"></i>
                    All Topics
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="stats" className="dashboard-tab">
                    <i className="bi bi-bar-chart me-2"></i>
                    Statistics
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
          </Row>

          <Row className="m-0 dashboard-content-wrapper">
            <Tab.Content className="dashboard-content">
              <Tab.Pane eventKey="today" className="fade-in">
                <Row className="m-0">
                  <Col md={6} className="p-3 left-section">
                    <TodaysLearning />
                  </Col>
                  <Col md={6} className="p-3 right-section">
                    <TodaysRevisions />
                  </Col>
                </Row>
              </Tab.Pane>

              <Tab.Pane eventKey="revisions" className="fade-in">
                <div className="p-3">
                  <RevisionSchedule />
                </div>
              </Tab.Pane>

              <Tab.Pane eventKey="topics" className="fade-in">
                <div className="p-3">
                  <AllTopics />
                </div>
              </Tab.Pane>

              <Tab.Pane eventKey="stats" className="fade-in">
                <div className="p-3">
                  <Statistics />
                </div>
              </Tab.Pane>
            </Tab.Content>
          </Row>
        </Tab.Container>
      </div>
    </RefreshContext.Provider>
  );
};

export default Dashboard; 