// app.js - Sistema Completo TDC-Dev
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
    serverTimestamp,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration - SUBSTITUA COM SUAS CONFIGURAÇÕES
const firebaseConfig = {
  apiKey: "AIzaSyBwjwP1Ewx4Z2wRS_Xt14B0DRTrM8x6WOg",
  authDomain: "tdc-dev-web.firebaseapp.com",
  projectId: "tdc-dev-web",
  storageBucket: "tdc-dev-web.firebasestorage.app",
  messagingSenderId: "848965120165",
  appId: "1:848965120165:web:0c69411e01f282954e9d4c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Global Variables
let currentUser = null;
const ADMIN_EMAIL = 'kartywillytdc@gmail.com';

// DOM Elements
const authButton = document.getElementById('auth-button');
const authModal = document.getElementById('auth-modal');
const adminPanel = document.getElementById('admin-panel');
const userProfile = document.getElementById('user-profile');

// Authentication State Listener
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    window.currentUser = user;
    
    if (user) {
        // User is signed in
        authButton.textContent = 'Minha Conta';
        authButton.style.background = 'linear-gradient(135deg, var(--success), var(--primary-purple))';
        authModal.style.display = 'none';
        
        // Check if user is admin
        if (user.email === ADMIN_EMAIL) {
            adminPanel.style.display = 'block';
            userProfile.style.display = 'none';
            await loadAdminData();
        } else {
            adminPanel.style.display = 'none';
            userProfile.style.display = 'block';
            await loadUserData(user);
        }
        
    } else {
        // User is signed out
        authButton.textContent = 'Entrar';
        authButton.style.background = 'linear-gradient(135deg, var(--primary-purple), var(--darker-purple))';
        adminPanel.style.display = 'none';
        userProfile.style.display = 'none';
    }
});

// Auth Button Click Handler
authButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentUser) {
        // Show user profile or admin panel based on role
        if (currentUser.email === ADMIN_EMAIL) {
            adminPanel.style.display = 'block';
        } else {
            userProfile.style.display = 'block';
            userProfile.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        authModal.style.display = 'flex';
    }
});

// Close modal when clicking outside
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.style.display = 'none';
    }
});

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
        await addDoc(collection(db, 'user_logins'), {
            userId: userCredential.user.uid,
            email: email,
            timestamp: serverTimestamp(),
            type: 'email'
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
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: email,
            createdAt: serverTimestamp(),
            plan: 'none',
            status: 'active',
            lastLogin: serverTimestamp()
        });
        
        alert('Conta criada com sucesso!');
        authModal.style.display = 'none';
        
    } catch (error) {
        console.error('Erro no registro:', error);
        alert('Erro no registro: ' + error.message);
    }
}

// Google Login Function
async function googleLogin() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Check if user exists in Firestore, if not create profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                plan: 'none',
                status: 'active',
                lastLogin: serverTimestamp(),
                type: 'google'
            });
        }
        
        // Save login record
        await addDoc(collection(db, 'user_logins'), {
            userId: user.uid,
            email: user.email,
            timestamp: serverTimestamp(),
            type: 'google'
        });
        
    } catch (error) {
        console.error('Erro no login Google:', error);
        alert('Erro no login Google: ' + error.message);
    }
}

// Logout Function
async function logout() {
    try {
        if (currentUser) {
            await addDoc(collection(db, 'user_logins'), {
                userId: currentUser.uid,
                email: currentUser.email,
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

// Load User Data
async function loadUserData(user) {
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Update profile display
            document.getElementById('user-welcome').textContent = `Bem-vindo, ${user.email.split('@')[0]}!`;
            document.getElementById('user-plan').textContent = `Plano: ${formatPlanName(userData.plan)}`;
            
            // Update plan details
            const planDetails = document.getElementById('plan-details');
            if (userData.plan !== 'none') {
                planDetails.innerHTML = `
                    <div style="background: var(--primary-purple); padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 0.5rem;">${formatPlanName(userData.plan)}</h4>
                        <p>Status: <span class="badge">Ativo</span></p>
                        <p>Expira em: ${userData.expiresAt ? new Date(userData.expiresAt.toDate()).toLocaleDateString() : '30 dias'}</p>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

// Load Admin Data
async function loadAdminData() {
    try {
        // Get total users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        document.getElementById('total-users').textContent = usersSnapshot.size;
        
        // Get active tokens
        const tokensSnapshot = await getDocs(collection(db, 'tokens'));
        const activeTokens = tokensSnapshot.docs.filter(doc => doc.data().used === false).length;
        document.getElementById('active-tokens').textContent = activeTokens;
        
        // Calculate revenue (simplified)
        const usedTokens = tokensSnapshot.docs.filter(doc => doc.data().used === true);
        const revenue = usedTokens.reduce((total, doc) => {
            const tokenData = doc.data();
            const price = getPlanPrice(tokenData.plan);
            return total + price;
        }, 0);
        
        document.getElementById('revenue').textContent = `R$ ${revenue.toFixed(2)}`;
        
    } catch (error) {
        console.error('Erro ao carregar dados admin:', error);
    }
}

// Generate Token Function
async function generateToken() {
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        alert('Acesso negado. Apenas administradores podem gerar tokens.');
        return;
    }
    
    const planSelect = document.getElementById('token-plan');
    const selectedPlan = planSelect.value;
    
    // Generate random token
    const token = 'TDC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    try {
        // Save token to Firestore
        await addDoc(collection(db, 'tokens'), {
            token: token,
            plan: selectedPlan,
            createdBy: currentUser.uid,
            createdAt: serverTimestamp(),
            used: false,
            usedBy: null,
            usedAt: null
        });
        
        // Display generated token
        document.getElementById('token-value').textContent = token;
        document.getElementById('generated-token').style.display = 'block';
        
        // Update admin stats
        await loadAdminData();
        
    } catch (error) {
        console.error('Erro ao gerar token:', error);
        alert('Erro ao gerar token: ' + error.message);
    }
}

// Redeem Token Function
async function redeemToken() {
    if (!currentUser) {
        alert('Por favor, faça login para resgatar um token.');
        return;
    }
    
    const tokenInput = document.getElementById('token-input').value.trim();
    
    if (!tokenInput) {
        alert('Por favor, insira um token.');
        return;
    }
    
    try {
        // Find token in Firestore
        const tokensQuery = query(collection(db, 'tokens'), where('token', '==', tokenInput));
        const tokensSnapshot = await getDocs(tokensQuery);
        
        if (tokensSnapshot.empty) {
            alert('Token inválido ou não encontrado.');
            return;
        }
        
        const tokenDoc = tokensSnapshot.docs[0];
        const tokenData = tokenDoc.data();
        
        if (tokenData.used) {
            alert('Este token já foi utilizado.');
            return;
        }
        
        // Update token as used
        await updateDoc(doc(db, 'tokens', tokenDoc.id), {
            used: true,
            usedBy: currentUser.uid,
            usedAt: serverTimestamp()
        });
        
        // Update user plan
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
        
        await updateDoc(doc(db, 'users', currentUser.uid), {
            plan: tokenData.plan,
            tokenUsed: tokenInput,
            planActivatedAt: serverTimestamp(),
            expiresAt: expiresAt
        });
        
        // Show success message
        alert(`🎉 Parabéns! Plano ${formatPlanName(tokenData.plan)} ativado com sucesso!\n\nSeu plano expira em: ${expiresAt.toLocaleDateString()}`);
        
        // Reload user data
        await loadUserData(currentUser);
        
        // Clear token input
        document.getElementById('token-input').value = '';
        
    } catch (error) {
        console.error('Erro ao resgatar token:', error);
        alert('Erro ao resgatar token: ' + error.message);
    }
}

// Update Prices Function
async function updatePrices() {
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        alert('Acesso negado.');
        return;
    }
    
    const basicPrice = document.getElementById('price-basic-input').value;
    const proPrice = document.getElementById('price-pro-input').value;
    const premiumPrice = document.getElementById('price-premium-input').value;
    
    // Update prices in localStorage (for demo)
    const prices = {
        basic: parseFloat(basicPrice).toFixed(2).replace('.', ','),
        pro: parseFloat(proPrice).toFixed(2).replace('.', ','),
        premium: parseFloat(premiumPrice).toFixed(2).replace('.', ',')
    };
    
    localStorage.setItem('tdc-prices', JSON.stringify(prices));
    
    // Update displayed prices
    document.getElementById('price-basic').textContent = prices.basic;
    document.getElementById('price-pro').textContent = prices.pro;
    document.getElementById('price-premium').textContent = prices.premium;
    
    alert('✅ Preços atualizados com sucesso!');
}

// Admin Section Navigation
function showAdminSection(section) {
    // Hide all sections
    document.getElementById('admin-tokens').style.display = 'none';
    document.getElementById('admin-pricing').style.display = 'none';
    
    // Show selected section
    document.getElementById(`admin-${section}`).style.display = 'block';
}

// Utility Functions
function formatPlanName(plan) {
    const planNames = {
        'basic': 'Básico',
        'pro': 'Pro',
        'premium': 'Premium',
        'monthly-basic': 'Mensal Básico',
        'monthly-pro': 'Mensal Pro',
        'monthly-premium': 'Mensal Premium',
        'none': 'Não assinante'
    };
    return planNames[plan] || plan;
}

function getPlanPrice(plan) {
    const prices = {
        'basic': 50,
        'premium': 100,
        'monthly-basic': 149.90,
        'monthly-pro': 299.90,
        'monthly-premium': 499.90
    };
    return prices[plan] || 0;
}

function showPlans() {
    document.getElementById('plans').scrollIntoView({ behavior: 'smooth' });
}

// Make functions globally available
window.login = login;
window.register = register;
window.googleLogin = googleLogin;
window.logout = logout;
window.redeemToken = redeemToken;
window.generateToken = generateToken;
window.updatePrices = updatePrices;
window.showAdminSection = showAdminSection;
window.showPlans = showPlans;

// Initialize admin section
document.addEventListener('DOMContentLoaded', function() {
    showAdminSection('tokens');
});
