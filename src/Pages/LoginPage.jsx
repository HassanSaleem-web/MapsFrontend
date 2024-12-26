import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider } from "../services/FireBaseConfig";
import { signInWithPopup } from "firebase/auth";
import './LoginPage.css'; // Linking the CSS file for styling

const LoginPage = () => {
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (localStorage.getItem("user")) {
      navigate("/home");
    }
  }, [navigate]);

  // Handle Google login
  const handleLogin = async () => {
    console.log("pressed");
    try {
      const result = await signInWithPopup(auth, provider);
      const { uid, displayName, email, photoURL } = result.user;
      console.log(result.user);
  
      // Get Firebase authentication token
      const token = await result.user.getIdToken();
  
      // Send user data + token to backend for validation
      const response = await fetch('https://mapbackend-deh7.onrender.com/api/users/saveUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: uid,
          name: displayName,
          email,
          profilePic: photoURL,
          token, // Pass the token here
        }),
      });
      console.log(token)
  
      const data = await response.json();
  
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user)); // Store user data
        navigate('/home'); // Redirect to Home
      } else {
        console.error('Login Failed:', data.message);
      }
    } catch (error) {
      console.error('Login Failed:', error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome to Map Tool</h1>
        <p>Login or Register to start mapping!</p>
        <button className="google-btn" onClick={handleLogin}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
