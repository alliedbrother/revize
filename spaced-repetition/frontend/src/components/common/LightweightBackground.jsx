import './LightweightBackground.css';

const LightweightBackground = ({ children, className = '', height = '200px' }) => {
  return (
    <div 
      className={`lightweight-background ${className}`}
      style={{ height }}
    >
      <div className="geometric-shapes">
        <div className="shape circle"></div>
        <div className="shape square"></div>
        <div className="shape triangle"></div>
        <div className="shape diamond"></div>
        <div className="shape circle small"></div>
        <div className="shape square small"></div>
      </div>
      <div className="content-wrapper">
        {children}
      </div>
    </div>
  );
};

export default LightweightBackground; 