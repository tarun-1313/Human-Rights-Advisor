 // Import the functions you need from the SDKs you need
 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
 
const firebaseConfig = {
  apiKey: "AIzaSyA0zWIhY5p3FX-f_8nThI4jsN-tKcd6odM",
  authDomain: "human-right-advisor-5f2df.firebaseapp.com",
  projectId: "human-right-advisor-5f2df",
  storageBucket: "human-right-advisor-5f2df.firebasestorage.app",
  messagingSenderId: "127941665693",
  appId: "1:127941665693:web:84bc42e8eb037decd0c574",
  measurementId: "G-4J14BXP8E2"
};

 // Initialize Firebase
 const app = initializeApp(firebaseConfig);

 function showMessage(message, divId){
    var messageDiv=document.getElementById(divId);
    messageDiv.style.display="block";
    messageDiv.innerHTML=message;
    messageDiv.style.opacity=1;
    setTimeout(function(){
        messageDiv.style.opacity=0;
    },5000);
 }

const auth = getAuth();
const db = getFirestore();

// DOM Elements
const submitSignUp = document.getElementById('submitSignUp');
const submitSignIn = document.getElementById('submitSignIn');
const signUpMessage = document.getElementById('signUpMessage');
const signInMessage = document.getElementById('signInMessage');

// Function to check if email belongs to police officer
async function checkPoliceOfficer(email) {
    const officersRef = collection(db, "policeOfficers");
    const q = query(officersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

// Sign Up Handler
submitSignUp.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('rEmail').value;
    const password = document.getElementById('rPassword').value;
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        signUpMessage.textContent = "Registration successful!";
        signUpMessage.style.color = "green";
        signUpMessage.style.display = "block";
        setTimeout(() => {
            window.location.href = 'main.html';
        }, 2000);
    } catch (error) {
        signUpMessage.textContent = error.message;
        signUpMessage.style.color = "red";
        signUpMessage.style.display = "block";
        }
 });

// Sign In Handler
submitSignIn.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // Check if this is a police officer
        const isPolice = await checkPoliceOfficer(email);

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (isPolice) {
            // If police officer, store info and redirect to dashboard
            localStorage.setItem('policeOfficer', JSON.stringify({
                email: userCredential.user.email,
                uid: userCredential.user.uid
            }));
            window.location.href = 'Police Login/dashboard.html';
        } else {
            // If regular user, redirect to main page
            window.location.href = 'main.html';
        }
    } catch (error) {
        signInMessage.textContent = error.message;
        signInMessage.style.color = "red";
        signInMessage.style.display = "block";
        }
});