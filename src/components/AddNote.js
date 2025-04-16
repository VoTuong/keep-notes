import React, { useState } from 'react';
import './AddNote.css';

const AddNote = ({ handleAddNote, viewMode }) => {
  const [noteText, setNoteText] = useState('');
  const characterLimit = 200;

  const handleChange = (event) => {
    if (characterLimit - event.target.value.length >= 0) {
      setNoteText(event.target.value);
    }
  };

  const handleSaveClick = () => {
    if (noteText.trim().length > 0) {
      handleAddNote(noteText);
      setNoteText('');
    }
  };

  return (
    <form
      className={`add-note-form${viewMode === 'table' ? ' add-note-table' : ''}`}
      onSubmit={e => { e.preventDefault(); handleSaveClick(); }}
    >
      <input
        className="add-note-input"
        type="text"
        maxLength={characterLimit}
        placeholder="Thêm ghi chú mới..."
        value={noteText}
        onChange={handleChange}
      />
      <button className="add-note-btn" type="submit" disabled={noteText.trim().length === 0}>
        Thêm
      </button>
      <small style={{marginLeft:8, color:'#888'}}>{characterLimit - noteText.length} ký tự</small>
    </form>
  );
};

export default AddNote;
