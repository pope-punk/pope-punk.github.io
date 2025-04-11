const ArrangementsList = ({ arrangements, selectedIndex, onSelect }) => {
  return (
    <div className="arrangements-list">
      <h3>Possible Arrangements ({arrangements.length})</h3>
      <div className="arrangement-buttons">
        {arrangements.map((_, index) => (
          <button
            key={index}
            className={index === selectedIndex ? 'selected' : ''}
            onClick={() => {
              console.log(`Clicking arrangement ${index}`);
              onSelect(index);
            }}
            type="button" // Explicit button type to prevent form submission behavior
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArrangementsList;