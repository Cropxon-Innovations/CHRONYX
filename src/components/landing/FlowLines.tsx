const FlowLines = () => {
  return (
    <div className="vyom-flow-container">
      {/* Subtle horizontal flowing lines representing time */}
      <div 
        className="vyom-flow vyom-flow-line" 
        style={{ top: '25%' }} 
      />
      <div 
        className="vyom-flow vyom-flow-line-2" 
        style={{ top: '50%' }} 
      />
      <div 
        className="vyom-flow vyom-flow-line-3" 
        style={{ top: '75%' }} 
      />
    </div>
  );
};

export default FlowLines;
