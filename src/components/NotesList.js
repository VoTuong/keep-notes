import React, { useRef, useEffect, useState } from 'react';
import Note from './Note';
import AddNote from './AddNote';
import './NotesList.css';

const VIEW_MODES = ['grid', 'table'];

const NotesList = ({ notes, handleAddNote, handleDeleteNote, handleToggleComplete, theme, onToggleTheme }) => {
  const [viewMode, setViewMode] = useState('grid');
  const boundaryRef = useRef(null);
  const isFirstRender = useRef(true);
  const prevPendingCount = useRef(0);

  // Filter notes into pending and completed
  const pendingNotes = notes.filter(note => !note.completed);
  const completedNotes = notes.filter(note => note.completed);

  // Scroll logic giữ nguyên
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevPendingCount.current = pendingNotes.length;
      return;
    }
    if (pendingNotes.length < prevPendingCount.current) {
      if (boundaryRef.current) {
        boundaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    prevPendingCount.current = pendingNotes.length;
  }, [pendingNotes.length, completedNotes.length]);

  // Render notes theo viewMode
  const renderNotes = (notesArr) => {
    if (viewMode === 'grid') {
      return notesArr.map((note) => (
        <Note
          key={note.id}
          id={note.id}
          text={note.text}
          date={note.date}
          completed={note.completed}
          handleDeleteNote={handleDeleteNote}
          handleToggleComplete={handleToggleComplete}
        />
      ));
    } else if (viewMode === 'table') {
      return (
        <table className="notes-list-tableview custom-table">
          <thead>
            <tr>
              <th style={{width: '48px'}}></th>
              <th>Nội dung</th>
              <th style={{width: '80px'}}>Xóa</th>
            </tr>
          </thead>
          <tbody>
            {notesArr.map((note) => (
              <tr key={note.id}>
                <td style={{textAlign: 'center'}}>
                  <input
                    type="checkbox"
                    checked={note.completed}
                    onChange={() => handleToggleComplete(note.id)}
                  />
                </td>
                <td>
                  <div className="note-table-content">{note.text}</div>
                  <div className="note-table-date">{note.date}</div>
                </td>
                <td style={{textAlign: 'center'}}>
                  <button onClick={() => handleDeleteNote(note.id)} className="table-delete-btn">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    return null;
  };

  return (
    <div className="notes-container">
      <div className="notes-header-bar">
        <button
          className="viewmode-toggle-btn"
          onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
          title={viewMode === 'grid' ? 'Hiển thị dạng bảng' : 'Hiển thị dạng lưới'}
        >
          {viewMode === 'grid' ? '📋' : '🔲'}
        </button>
      </div>
      <AddNote handleAddNote={handleAddNote} viewMode={viewMode} />
      <h2 className="section-title">Pending Tasks</h2>
      {/* Ở chế độ table, AddNote nằm trên bảng, không nằm trong .notes-list */}
      {viewMode === 'table' && (
        <div style={{ marginBottom: '0.5rem' }}></div>
      )}
      <div className={`notes-list notes-list-${viewMode}`}>
        {viewMode === 'grid'
          ? pendingNotes.slice().reverse().map((note) => (
              <Note
                key={note.id}
                id={note.id}
                text={note.text}
                date={note.date}
                completed={note.completed}
                handleDeleteNote={handleDeleteNote}
                handleToggleComplete={handleToggleComplete}
              />
            ))
          : renderNotes(pendingNotes.slice().reverse())}
      </div>
      <div ref={boundaryRef} className="task-boundary"></div>
      <h2 className="section-title">Completed Tasks</h2>
      <div className={`notes-list notes-list-${viewMode}`}>
        {viewMode === 'grid'
          ? completedNotes.map((note) => (
              <Note
                key={note.id}
                id={note.id}
                text={note.text}
                date={note.date}
                completed={note.completed}
                handleDeleteNote={handleDeleteNote}
                handleToggleComplete={handleToggleComplete}
              />
            ))
          : renderNotes(completedNotes)}
      </div>
    </div>
  );
};

export default NotesList;
