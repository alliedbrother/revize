import { useState, useContext, useEffect, useRef } from 'react';
import { Card, Form, Button, Alert, Row, Col, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { createTopic } from '../../services/api';
import { RefreshContext } from '../dashboard/Dashboard';
import '../pomodoro/Pomodoro.css';

// Pomodoro Timer Component
const PomodoroTimer = () => {
  const [mode, setMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const timerRef = useRef(null);

  const modeSettings = {
    work: { time: 25 * 60, label: 'Work', color: 'primary' },
    shortBreak: { time: 5 * 60, label: 'Short Break', color: 'success' },
    longBreak: { time: 15 * 60, label: 'Long Break', color: 'info' }
  };

  // Reset timer when mode changes
  useEffect(() => {
    setTimeLeft(modeSettings[mode].time);
    setIsRunning(false);
    clearInterval(timerRef.current);
  }, [mode]);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            const alarm = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
            alarm.play();
            
            // Handle mode completion
            if (mode === 'work') {
              setCompletedPomodoros(prev => prev + 1);
              // After 4 pomodoros, take a long break
              if ((completedPomodoros + 1) % 4 === 0) {
                setMode('longBreak');
              } else {
                setMode('shortBreak');
              }
            } else {
              setMode('work');
            }
            
            setIsRunning(false);
            return modeSettings[mode].time;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(timerRef.current);
  }, [isRunning, mode, completedPomodoros]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    const totalTime = modeSettings[mode].time;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  return (
    <Card className="pomodoro-card mt-4 shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center pomodoro-card-header">
        <h4 className="mb-0 fw-bold">
          <i className="bi bi-clock me-2"></i>
          Pomodoro Timer
        </h4>
        <div className="d-flex gap-2">
          <Button 
            size="sm" 
            variant={mode === 'work' ? 'primary' : 'outline-primary'} 
            onClick={() => setMode('work')}
          >
            <i className="bi bi-briefcase me-1"></i> Work
          </Button>
          <Button 
            size="sm" 
            variant={mode === 'shortBreak' ? 'success' : 'outline-success'} 
            onClick={() => setMode('shortBreak')}
          >
            <i className="bi bi-cup-hot me-1"></i> Short Break
          </Button>
          <Button 
            size="sm" 
            variant={mode === 'longBreak' ? 'info' : 'outline-info'} 
            onClick={() => setMode('longBreak')}
          >
            <i className="bi bi-brightness-high me-1"></i> Long Break
          </Button>
        </div>
      </Card.Header>
      <Card.Body className="pomodoro-card-body d-flex flex-column justify-content-between">
        <div className="text-center pt-3">
          <h1 className={`timer-display ${timeLeft < 10 ? 'text-danger pulsing' : ''}`}>
            {formatTime(timeLeft)}
          </h1>
          
          <ProgressBar 
            variant={modeSettings[mode].color} 
            now={calculateProgress()} 
            className="timer-progress"
          />
          
          <div className="control-buttons">
            <Button 
              variant={isRunning ? "danger" : "success"} 
              size="lg"
              className="px-4 py-2"
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? 
                <><i className="bi bi-pause-fill"></i> Pause</> : 
                <><i className="bi bi-play-fill"></i> Start</>
              }
            </Button>
            <Button 
              variant="secondary" 
              size="lg"
              className="px-4 py-2"
              onClick={() => {
                clearInterval(timerRef.current);
                setTimeLeft(modeSettings[mode].time);
                setIsRunning(false);
              }}
            >
              <i className="bi bi-arrow-counterclockwise"></i> Reset
            </Button>
          </div>
        </div>
        
        <div className="timer-stats">
          <div className="stat-item">
            <div className="stat-value">{completedPomodoros}</div>
            <div className="stat-label">Completed Sessions</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{modeSettings[mode].label}</div>
            <div className="stat-label">Current Mode</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{Math.round(completedPomodoros * 25 / 60 * 10) / 10}</div>
            <div className="stat-label">Hours Focused</div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

const TodaysLearning = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [studyDate, setStudyDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const { triggerRefresh } = useContext(RefreshContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await createTopic({ 
        title, 
        content, 
        initial_revision_date: studyDate 
      });
      setSuccess('Topic added successfully!');
      setTitle('');
      setContent('');
      setStudyDate(new Date().toISOString().split('T')[0]); // Reset to today
      
      // Trigger refresh in other components
      triggerRefresh();
    } catch (err) {
      setError(err.message || 'Failed to add topic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <Card.Header>
          <h4 className="mb-0">Add New Topic</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter topic title"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="Enter topic content"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Study Date</Form.Label>
              <Form.Text className="text-muted d-block mb-2">
                When did you study this topic? Revision dates will be calculated from this date.
              </Form.Text>
              <Form.Control
                type="date"
                value={studyDate}
                onChange={(e) => setStudyDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Cannot select future dates
              />
            </Form.Group>

            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Topic'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
      
      {/* Pomodoro Timer component */}
      <PomodoroTimer />
    </>
  );
};

export default TodaysLearning; 