import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import AppNavbar from './components/Navbar';
import HomePage from './components/HomePage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import TopicList from './components/topics/TopicList';
import TopicForm from './components/topics/TopicForm';
import TodayRevisions from './components/revisions/TodayRevisions';
import TopicDetail from './components/topics/TopicDetail';
import AllRevisions from './components/revisions/AllRevisions';

// CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <Container className="mt-5 text-center">Loading...</Container>;
  }
  
  return currentUser ? children : <Navigate to="/login" />;
};

// SessionManager component to handle server restart detection
const SessionManager = ({ children }) => {
  const { logout, currentUser } = useAuth();
  
  useEffect(() => {
    // Create a server session identifier
    if (!sessionStorage.getItem('server_session_id')) {
      // Generate a new session ID
      const sessionId = Date.now().toString();
      sessionStorage.setItem('server_session_id', sessionId);
    }
    
    // Check if this is a new page load (server restart)
    const lastVisit = sessionStorage.getItem('last_visit');
    const currentTime = Date.now();
    
    // If last visit was more than 2 seconds ago, assume it's a server restart or new session
    if (lastVisit && (currentTime - parseInt(lastVisit)) > 2000) {
      console.log('Server restart detected, logging out user');
      logout();
    }
    
    // Update last visit time on each mount
    sessionStorage.setItem('last_visit', currentTime.toString());
    
    // Clean up on page unload
    const handleBeforeUnload = () => {
      sessionStorage.setItem('last_visit', Date.now().toString());
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [logout]);
  
  // Debug auth state
  useEffect(() => {
    console.log('Auth state changed:', { 
      isLoggedIn: !!currentUser, 
      userData: currentUser,
      sessionStorageToken: sessionStorage.getItem('token')
    });
  }, [currentUser]);
  
  return children;
};

function App() {
  // Import Bootstrap JS
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <Router>
      <AuthProvider>
        <SessionManager>
          <div className="app-container">
            <AppNavbar />
            <main className="py-2">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Topic Routes - More specific routes first */}
                <Route 
                  path="/topics/new" 
                  element={
                    <ProtectedRoute>
                      <TopicForm />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/topics/:id" 
                  element={
                    <ProtectedRoute>
                      <TopicDetail />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/topics" 
                  element={
                    <ProtectedRoute>
                      <TopicList />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Revision Routes */}
                <Route 
                  path="/revisions/today" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/revisions" 
                  element={
                    <ProtectedRoute>
                      <AllRevisions />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </SessionManager>
      </AuthProvider>
    </Router>
  );
}

export default App;
