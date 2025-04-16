import React from 'react';
import { MdDeleteForever } from 'react-icons/md';
import './Note.css';

const Note = ({ id, text, date, completed, handleDeleteNote, handleToggleComplete }) => {
  return (
    <div className={`note ${completed ? 'completed' : ''}`}>
      <div className="note-status">
        <input 
          type="checkbox" 
          checked={completed} 
          onChange={() => handleToggleComplete(id)} 
          className="status-checkbox"
        />
      </div>
      <div className="note-body">
        <span>{text}</span>
      </div>
      <div className="note-footer">
        <small>{date}</small>
        <MdDeleteForever 
          onClick={() => handleDeleteNote(id)} 
          className="delete-icon" 
          size="1.3em" 
        />
      </div>
    </div>
  );
};

export default Note;
