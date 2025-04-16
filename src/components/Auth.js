import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import './Auth.css';
import { FcGoogle } from 'react-icons/fc';

const Auth = ({ user, setUser }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Clear errors when component mounts or user changes
  useEffect(() => {
    setError('');
  }, [user]);
  
  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      // Simple sign in with popup
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign-in error:", error);
      
      if (error.code === 'auth/unauthorized-domain') {
        // This is a known issue with local development
        setError(`Authentication domain is not authorized. Please use the deployed version at: https://vdt-keep-notes.web.app`);
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out error:", error);
      setError(`Error signing out: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (user) {
    return (
      <div className="auth-container">
        <div className="auth-user-info">
          {user.photoURL && <img src={user.photoURL} alt="Profile" className="user-avatar" />}
          <div className="user-details">
            <p className="welcome-text">Welcome!</p>
            <p className="user-email">{user.displayName || user.email}</p>
          </div>
        </div>
        <button 
          className="auth-button" 
          onClick={handleSignOut}
          disabled={isLoading}
        >
          {isLoading ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    );
  }
  
  return (
    <div className="auth-container">
      <h2>Sign in to save tasks online</h2>
      {error && (
        <div className="auth-error">
          <p>{error}</p>
          {error.includes('vdt-keep-notes.web.app') && (
            <a href="https://vdt-keep-notes.web.app" className="auth-link">
              Open authorized app
            </a>
          )}
        </div>
      )}
      
      <button 
        onClick={handleGoogleSignIn} 
        className="google-sign-in-button"
        disabled={isLoading}
      >
        {isLoading ? (
          <span>Signing in...</span>
        ) : (
          <>
            <FcGoogle size={20} />
            <span>Continue with Google</span>
          </>
        )}
      </button>
      
      <p className="auth-info">
        Sign in to access your tasks from any device.
        Your tasks will be securely stored in the cloud.
      </p>
    </div>
  );
};

export default Auth;
