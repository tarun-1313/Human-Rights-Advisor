const signUpButton=document.getElementById('signUpButton');
const signInButton=document.getElementById('signInButton');
const signInForm=document.getElementById('signIn');
const signUpForm=document.getElementById('signup');
const policeLoginButton = document.getElementById('policeLoginButton');

signUpButton.addEventListener('click',function(){
    signInForm.style.display="none";
    signUpForm.style.display="block";
})
signInButton.addEventListener('click', function(){
    signInForm.style.display="block";
    signUpForm.style.display="none";
})
localStorage.setItem("isLoggedIn", "true");



// Police Login Button Handler
document.getElementById('policeLoginButton').addEventListener('click', () => {
    window.location.href = 'Police Login/login.html';
});