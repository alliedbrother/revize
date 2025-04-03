import { useState } from 'react';
import { Card, Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, changePassword, logout } = useAuth();
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePasswordChange = () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      setError('Please fill in all password fields');
      return false;
    }

    if (passwordData.new_password.length < 6) {
      setError('New password must be at least 6 characters long');
      return false;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordChange()) {
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      const { success, error } = await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      if (success) {
        setSuccess('Password updated successfully');
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        setError(error || 'Failed to update password');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={7}>
          <Card className="profile-card shadow">
            <Card.Header className="profile-header">
              <div className="d-flex align-items-center">
                <i className="bi bi-person-circle profile-icon me-3"></i>
                <h3 className="mb-0">Profile Settings</h3>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="account-info-section">
                <h4 className="section-title">
                  <i className="bi bi-info-circle me-2"></i>
                  Account Information
                </h4>
                <div className="info-container">
                  <div className="info-item">
                    <div className="info-label">
                      <i className="bi bi-person me-2"></i>
                      Username
                    </div>
                    <div className="info-value">{user?.username}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">
                      <i className="bi bi-envelope me-2"></i>
                      Email
                    </div>
                    <div className="info-value">{user?.email}</div>
                  </div>
                </div>
              </div>

              <hr className="divider" />

              <div className="password-section">
                <h4 className="section-title">
                  <i className="bi bi-key me-2"></i>
                  Change Password
                </h4>
                {error && <Alert variant="danger" className="fade-in">{error}</Alert>}
                {success && <Alert variant="success" className="fade-in">{success}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <i className="bi bi-shield-lock me-2"></i>
                      Current Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      className="form-control-lg"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      <i className="bi bi-shield-plus me-2"></i>
                      New Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      className="form-control-lg"
                      required
                    />
                    <Form.Text className="text-muted">
                      Password must be at least 6 characters long
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <i className="bi bi-check-circle me-2"></i>
                      Confirm New Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      className="form-control-lg"
                      required
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-between mt-4">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loading}
                      className="btn-lg update-btn"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Update Password
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline-danger"
                      onClick={logout}
                      type="button"
                      className="btn-lg logout-btn"
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </Button>
                  </div>
                </Form>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile; 