// app.js - Sistema Atualizado com Novos Designs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    updateProfile
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
import { 
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBwjwP1Ewx4Z2wRS_Xt14B0DRTrM8x6WOg",
    authDomain: "tdc-dev-web.firebaseapp.com",
    projectId: "tdc-dev-web",
    storageBucket: "tdc-dev-web.firebasestorage.app",
    messagingSenderId: "848965120165",
    appId: "1:848965120165:web:0c69411e01f282954e9d4c",
    measurementId: "G-GBK36KBSGB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Global Variables
let currentUser = null;
const ADMIN_EMAIL = 'kartywillytdc@gmail.com';

// UI Functions
function showLogin() {
    document.getElementById('register-modal').style.display = 'none';
    document.getElementById('login-modal').style.display = 'flex';
}

function showRegister() {
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('register-modal').style.display = 'flex';
}

function showWelcome() {
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('register-modal').style.display = 'none';
    document.getElementById('welcome-modal').style.display = 'flex';
}

function closeAllModals() {
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('register-modal').style.display = 'none';
    document.getElementById('welcome-modal').style.display = 'none';
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.parentElement.querySelector('.password-toggle span');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = 'visibility_off';
    } else {
        input.type = 'password';
        toggle.textContent = 'visibility';
    }
}

async function handleProfilePicture(event) {
    const file = event.target.files[0];
    if (file && currentUser) {
        try {
            // Upload image to Firebase Storage
            const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Update user profile
            await updateProfile(currentUser, {
                photoURL: downloadURL
            });
            
            // Update Firestore
            await updateDoc(doc(db, 'users', currentUser.uid), {
                photoURL: downloadURL,
                profileUpdated: serverTimestamp()
            });
            
            // Update UI
            const profileCircle = document.querySelector('.profile-circle');
            profileCircle.innerHTML = `<img src="${downloadURL}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            
            showNotification('Foto de perfil atualizada com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao fazer upload da foto:', error);
            showNotification('Erro ao fazer upload da foto.', 'error');
        }
    }
}

function explorePlatform() {
    closeAllModals();
    window.location.href = '#plans';
}

function skipWelcome() {
    closeAllModals();
    window.location.href = '#plans';
}

// Authentication Functions
async function handleLogin(email, password) {
    try {
        showLoading(true);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        await addDoc(collection(db, 'user_activity'), {
            userId: userCredential.user.uid,
            action: 'login',
            timestamp: serverTimestamp(),
            details: { method: 'email' }
        });
        
        showNotification('Login realizado com sucesso!', 'success');
        closeAllModals();
        
    } catch (error) {
        console.error('Erro no login:', error);
        showNotification('Erro no login: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleRegister(email, password, displayName) {
    try {
        showLoading(true);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update user profile
        if (displayName) {
            await updateProfile(userCredential.user, {
                displayName: displayName
            });
        }
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: email,
            displayName: displayName,
            createdAt: serverTimestamp(),
            plan: 'none',
            status: 'active',
            lastLogin: serverTimestamp(),
            loginCount: 1,
            type: 'email'
        });
        
        showNotification('Conta criada com sucesso! Bem-vindo à TDC-Dev!', 'success');
        closeAllModals();
        showWelcome();
        
    } catch (error) {
        console.error('Erro no registro:', error);
        showNotification('Erro no registro: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function googleLogin() {
    try {
        showLoading(true);
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Check if user exists in Firestore, if not create profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                plan: 'none',
                status: 'active',
                lastLogin: serverTimestamp(),
                type: 'google'
            });
            showWelcome();
        }
        
        showNotification('Login com Google realizado com sucesso!', 'success');
        closeAllModals();
        
    } catch (error) {
        console.error('Erro no login Google:', error);
        showNotification('Erro no login Google: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles for notification if not exists
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: var(--dark-gray);
                border: 2px solid;
                border-radius: 15px;
                padding: 1rem 1.5rem;
                color: white;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 1rem;
                max-width: 400px;
                box-shadow: var(--neon-glow);
                animation: slideInRight 0.3s ease-out;
            }
            .notification.success { border-color: var(--success); }
            .notification.error { border-color: var(--danger); }
            .notification.warning { border-color: var(--warning); }
            .notification.info { border-color: var(--primary); }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function showLoading(show) {
    // Implement your loading indicator
    if (show) {
        document.body.style.cursor = 'wait';
    } else {
        document.body.style.cursor = 'default';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Event Listeners
    document.getElementById('auth-button').addEventListener('click', showLogin);
    
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        handleLogin(email, password);
    });

    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const displayName = document.getElementById('register-name').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        
        if (password !== confirmPassword) {
            showNotification('As senhas não coincidem!', 'error');
            return;
        }
        
        handleRegister(email, password, displayName);
    });

    // Close modals when clicking outside
    document.querySelectorAll('.auth-modal, .welcome-modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Authentication state listener
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        window.currentUser = user;
        
        if (user) {
            document.getElementById('auth-button').innerHTML = '<i class="fas fa-user-circle"></i> Minha Conta';
            document.getElementById('auth-button').style.background = 'linear-gradient(135deg, var(--success), var(--primary))';
            
            // Check if user profile exists
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists() && user.providerData[0].providerId === 'password') {
                showWelcome();
            }
        } else {
            document.getElementById('auth-button').innerHTML = '<i class="fas fa-user"></i> Entrar';
            document.getElementById('auth-button').style.background = 'linear-gradient(135deg, var(--primary), var(--primary-dark))';
        }
    });
});

// Make functions globally available
window.showLogin = showLogin;
window.showRegister = showRegister;
window.togglePassword = togglePassword;
window.handleProfilePicture = handleProfilePicture;
window.explorePlatform = explorePlatform;
window.skipWelcome = skipWelcome;
window.googleLogin = googleLogin;

console.log('✅ TDC-Dev System com novos designs carregado!');
