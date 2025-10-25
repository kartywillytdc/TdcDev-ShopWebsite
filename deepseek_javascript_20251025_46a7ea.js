// app.js - Firebase Configuration and Functionality
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration - SUBSTITUA COM SUAS CONFIGURAÇÕES
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO_ID",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authButton = document.getElementById('auth-button');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const adminPanel = document.getElementById('admin-panel');

// Authentication State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        authButton.textContent = 'Admin';
        authButton.style.color = '#10B981';
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        adminPanel.style.display = 'block';
        
        // Load admin data
        loadAdminData(user.uid);
    } else {
        // User is signed out
        authButton.textContent = 'Login';
        authButton.style.color = '';
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        adminPanel.style.display = 'none';
    }
});

// Auth Button Click Handler
authButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (auth.currentUser) {
        // If user is logged in, show admin panel
        adminPanel.style.display = 'block';
    } else {
        // If user is not logged in, show login form
        showLogin();
    }
});

// Show Login Form
function showLogin() {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    adminPanel.style.display = 'none';
}

// Show Register Form
function showRegister() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    adminPanel.style.display = 'none';
}

// Login Function
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Usuário logado:', userCredential.user);
        
        // Save login record to Firestore
        await addDoc(collection(db, 'admin_logins'), {
            adminId: userCredential.user.uid,
            email: email,
            timestamp: serverTimestamp(),
            action: 'login'
        });
        
    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro no login: ' + error.message);
    }
}

// Register Function
async function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (!email || !password) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    if (password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres.');
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Usuário registrado:', userCredential.user);
        
        // Save admin user to Firestore
        await addDoc(collection(db, 'admin_users'), {
            uid: userCredential.user.uid,
            email: email,
            createdAt: serverTimestamp(),
            plan: 'premium', // Default plan for admin users
            status: 'active'
        });
        
        alert('Conta criada com sucesso!');
        showLogin();
        
    } catch (error) {
        console.error('Erro no registro:', error);
        alert('Erro no registro: ' + error.message);
    }
}

// Logout Function
async function logout() {
    try {
        // Save logout record to Firestore
        if (auth.currentUser) {
            await addDoc(collection(db, 'admin_logins'), {
                adminId: auth.currentUser.uid,
                email: auth.currentUser.email,
                timestamp: serverTimestamp(),
                action: 'logout'
            });
        }
        
        await signOut(auth);
        console.log('Usuário deslogado');
        
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

// Load Admin Data
async function loadAdminData(userId) {
    try {
        // Get admin statistics
        const clientsQuery = query(collection(db, 'clients'), where('adminId', '==', userId));
        const clientsSnapshot = await getDocs(clientsQuery);
        const clientsCount = clientsSnapshot.size;
        
        // Update admin panel with statistics
        const adminPanel = document.getElementById('admin-panel');
        adminPanel.innerHTML = `
            <h3>Painel Administrativo</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 2rem 0;">
                <div style="background: var(--glass-effect); padding: 1rem; border-radius: 10px; text-align: center;">
                    <h4 style="color: var(--primary-purple);">${clientsCount}</h4>
                    <p>Clientes</p>
                </div>
                <div style="background: var(--glass-effect); padding: 1rem; border-radius: 10px; text-align: center;">
                    <h4 style="color: var(--primary-purple);">R$ ${(clientsCount * 499.90).toFixed(2)}</h4>
                    <p>Faturamento Mensal</p>
                </div>
            </div>
            <button onclick="logout()" class="cta-button" style="background: #EF4444;">Sair</button>
        `;
        
    } catch (error) {
        console.error('Erro ao carregar dados admin:', error);
    }
}

// Plan Selection Function
function selectPlan(plan) {
    const planNames = {
        'basic': 'Básico',
        'pro': 'Pro', 
        'premium': 'Premium'
    };
    
    const planPrices = {
        'basic': 149.90,
        'pro': 299.90,
        'premium': 499.90
    };
    
    if (auth.currentUser) {
        // If admin is logged in, save the selection
        savePlanSelection(plan, planNames[plan], planPrices[plan]);
    } else {
        // If not logged in, prompt to login
        alert(`Para contratar o plano ${planNames[plan]}, faça login como administrador.`);
        showLogin();
    }
}

// Save Plan Selection to Firestore
async function savePlanSelection(planId, planName, planPrice) {
    try {
        await addDoc(collection(db, 'plan_selections'), {
            adminId: auth.currentUser.uid,
            planId: planId,
            planName: planName,
            planPrice: planPrice,
            timestamp: serverTimestamp()
        });
        
        alert(`Plano ${planName} selecionado com sucesso! Os dados foram salvos.`);
        
    } catch (error) {
        console.error('Erro ao salvar seleção de plano:', error);
        alert('Erro ao salvar seleção de plano.');
    }
}

// Initialize Page
document.addEventListener('DOMContentLoaded', function() {
    console.log('TDC-Dev Site inicializado');
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Make functions globally available
window.showLogin = showLogin;
window.showRegister = showRegister;
window.login = login;
window.register = register;
window.logout = logout;
window.selectPlan = selectPlan;