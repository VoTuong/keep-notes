import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import NotesList from './components/NotesList';
import Search from './components/Search';
import Header from './components/Header';
import Auth from './components/Auth';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './App.css';

function App() {
  const [notes, setNotes] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    let unsubscribe = () => {};
    
    try {
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      }, (error) => {
        console.error("Firebase auth error:", error);
        setFirebaseError(true);
        setLoading(false);
      });
    } catch (error) {
      console.error("Firebase initialization error:", error);
      setFirebaseError(true);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Load notes from Firestore when user changes
  useEffect(() => {
    const loadNotes = async () => {
      if (user && !firebaseError) {
        // User is signed in, load from Firestore
        try {
          setLoading(true);
          const q = query(collection(db, "notes"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          
          const loadedNotes = [];
          querySnapshot.forEach((doc) => {
            loadedNotes.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          setNotes(loadedNotes);
        } catch (error) {
          console.error("Error loading notes:", error);
          setFirebaseError(true);
          // Fallback to localStorage
          const savedNotes = JSON.parse(localStorage.getItem('react-notes-app-data')) || [];
          setNotes(savedNotes);
        } finally {
          setLoading(false);
        }
      } else if (!user || firebaseError) {
        // User is signed out or Firebase error, load from localStorage as fallback
        const savedNotes = JSON.parse(localStorage.getItem('react-notes-app-data'));
        if (savedNotes) {
          setNotes(savedNotes);
        } else {
          // Add a sample note if no notes exist
          const sampleNote = {
            id: uuidv4(),
            text: "This is a sample task. Check the box to mark it complete!",
            date: new Date().toLocaleDateString(),
            completed: false
          };
          setNotes([sampleNote]);
        }
      }
    };
    loadNotes();
  }, [user]);

  // Save notes to localStorage as backup
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('react-notes-app-data', JSON.stringify(notes));
    }
  }, [notes, loading]);

  // --- Auto-delete completed notes after 15 days ---
  useEffect(() => {
    const now = new Date();
    const isOlderThan15Days = (dateStr) => {
      if (!dateStr) return false;
      const completedDate = new Date(dateStr);
      const diff = (now - completedDate) / (1000 * 60 * 60 * 24);
      return diff > 15;
    };

    // Xóa trên Firestore nếu đã đăng nhập
    if (user && !firebaseError) {
      notes.forEach(async (note) => {
        if (note.completed && isOlderThan15Days(note.completedAt)) {
          try {
            await deleteDoc(doc(db, "notes", note.id));
            setNotes((prev) => prev.filter((n) => n.id !== note.id));
          } catch (e) {
            console.error("Auto-delete error:", e);
          }
        }
      });
    } else {
      // Xóa trên localStorage
      const filteredNotes = notes.filter(
        (note) => !(note.completed && isOlderThan15Days(note.completedAt))
      );
      if (filteredNotes.length !== notes.length) {
        setNotes(filteredNotes);
        localStorage.setItem('react-notes-app-data', JSON.stringify(filteredNotes));
      }
    }
  }, [notes, user, firebaseError]);

  const addNote = async (text) => {
    const date = new Date();
    const newNote = {
      text: text,
      date: date.toLocaleDateString(),
      completed: false
    };

    if (user && !firebaseError) {
      // Add to Firestore
      try {
        newNote.userId = user.uid;
        const docRef = await addDoc(collection(db, "notes"), newNote);
        setNotes(prevNotes => {
          const pendingNotes = prevNotes.filter(note => !note.completed);
          const completedNotes = prevNotes.filter(note => note.completed);
          return [...pendingNotes, {...newNote, id: docRef.id}, ...completedNotes];
        });
      } catch (error) {
        console.error("Error adding note:", error);
        // Fallback to local
        newNote.id = uuidv4();
        setNotes(prevNotes => {
          const pendingNotes = prevNotes.filter(note => !note.completed);
          const completedNotes = prevNotes.filter(note => note.completed);
          return [...pendingNotes, newNote, ...completedNotes];
        });
      }
    } else {
      // Add to local state only
      newNote.id = uuidv4();
      setNotes(prevNotes => {
        const pendingNotes = prevNotes.filter(note => !note.completed);
        const completedNotes = prevNotes.filter(note => note.completed);
        return [...pendingNotes, newNote, ...completedNotes];
      });
    }
  };

  const deleteNote = async (id) => {
    if (user && !firebaseError) {
      // Delete from Firestore
      try {
        await deleteDoc(doc(db, "notes", id));
        setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      } catch (error) {
        console.error("Error deleting note:", error);
        // Fallback to local
        setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      }
    } else {
      // Delete from local state only
      setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    }
  };

  // --- Khi chuyển sang completed, thêm completedAt ---
  const toggleComplete = async (id) => {
    if (user && !firebaseError) {
      // Update in Firestore
      try {
        const noteToUpdate = notes.find(note => note.id === id);
        if (noteToUpdate) {
          const completed = !noteToUpdate.completed;
          const completedAt = completed ? new Date().toISOString() : null;
          await updateDoc(doc(db, "notes", id), {
            completed,
            completedAt
          });
          // Update locally with proper ordering
          setNotes(prevNotes => {
            const notesWithoutCurrent = prevNotes.filter(note => note.id !== id);
            const updatedNote = { ...noteToUpdate, completed, completedAt };
            if (updatedNote.completed) {
              const pendingNotes = notesWithoutCurrent.filter(note => !note.completed);
              const completedNotes = notesWithoutCurrent.filter(note => note.completed);
              return [...pendingNotes, ...completedNotes, updatedNote];
            } else {
              const pendingNotes = notesWithoutCurrent.filter(note => !note.completed);
              const completedNotes = notesWithoutCurrent.filter(note => note.completed);
              return [...pendingNotes, updatedNote, ...completedNotes];
            }
          });
        }
      } catch (error) {
        console.error("Error updating note:", error);
        updateLocalNote();
      }
    } else {
      // Update local state only
      setNotes(prevNotes => {
        const noteToUpdate = prevNotes.find(note => note.id === id);
        if (!noteToUpdate) return prevNotes;
        const notesWithoutCurrent = prevNotes.filter(note => note.id !== id);
        const completed = !noteToUpdate.completed;
        const completedAt = completed ? new Date().toISOString() : null;
        const updatedNote = { ...noteToUpdate, completed, completedAt };
        if (updatedNote.completed) {
          const pendingNotes = notesWithoutCurrent.filter(note => !note.completed);
          const completedNotes = notesWithoutCurrent.filter(note => note.completed);
          return [...pendingNotes, ...completedNotes, updatedNote];
        } else {
          const pendingNotes = notesWithoutCurrent.filter(note => !note.completed);
          const completedNotes = notesWithoutCurrent.filter(note => note.completed);
          return [...pendingNotes, updatedNote, ...completedNotes];
        }
      });
    }

    // Helper function for local state updates
    function updateLocalNote() {
      setNotes(prevNotes => {
        // Find the note we need to update
        const noteToUpdate = prevNotes.find(note => note.id === id);
        
        if (noteToUpdate) {
          // Create a new array without the note
          const notesWithoutCurrent = prevNotes.filter(note => note.id !== id);
          
          // Create an updated version of the note
          const updatedNote = {...noteToUpdate, completed: !noteToUpdate.completed};
          
          // If the note is now completed, add it to the end of the completed notes
          // If it's now pending, add it to the end of the pending notes
          if (updatedNote.completed) {
            // Get all pending notes
            const pendingNotes = notesWithoutCurrent.filter(note => !note.completed);
            // Get all completed notes
            const completedNotes = notesWithoutCurrent.filter(note => note.completed);
            // Add the updated note at the end of completed notes
            return [...pendingNotes, ...completedNotes, updatedNote];
          } else {
            // Get all pending notes
            const pendingNotes = notesWithoutCurrent.filter(note => !note.completed);
            // Get all completed notes
            const completedNotes = notesWithoutCurrent.filter(note => note.completed);
            // Add the updated note at the end of pending notes
            return [...pendingNotes, updatedNote, ...completedNotes];
          }
        }
        
        return prevNotes;
      });
    }
  };

  const filteredNotes = notes.filter((note) => 
    note.text.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <div className="container">
        <Header handleToggleDarkMode={setDarkMode} />
        {firebaseError ? (
          <div className="firebase-error">
            <p><strong>Unable to connect to Firebase</strong></p>
            <p>There was a problem connecting to the online database. Please check your Firebase configuration, authentication status, and Firestore security rules.</p>
            <p>Your tasks will be saved locally until this is fixed.</p>
          </div>
        ) : (
          <Auth user={user} setUser={setUser} />
        )}
        <Search handleSearchNote={setSearchText} />
        {loading ? (
          <div className="loading">Loading your tasks...</div>
        ) : (
          <NotesList
            notes={filteredNotes}
            handleAddNote={addNote}
            handleDeleteNote={deleteNote}
            handleToggleComplete={toggleComplete}
          />
        )}
      </div>
    </div>
  );
}

export default App;
