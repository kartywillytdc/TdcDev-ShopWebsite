// ===== CONFIGURAÇÃO DO FIREBASE =====
const firebaseConfig = {
    apiKey: "AIzaSyBwjwP1Ewx4Z2wRS_Xt14B0DRTrM8x6WOg",
    authDomain: "tdc-dev-web.firebaseapp.com",
    projectId: "tdc-dev-web",
    storageBucket: "tdc-dev-web.firebasestorage.app",
    messagingSenderId: "848965120165",
    appId: "1:848965120165:web:0c69411e01f282954e9d4c",
    measurementId: "G-GBK36KBSGB"
};

// Inicialização do Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ===== ESTADO DA APLICAÇÃO =====
let currentUser = null;
let isAdmin = false;
let currentChat = null;
let unreadMessages = 0;
const ADMIN_EMAIL = "admin@tdcdev.com";

// Planos e suas limitações
const PLAN_LIMITATIONS = {
    basic: [
        "Até 4 páginas no site",
        "Design básico responsivo",
        "Suporte por email apenas",
        "Sem sistema de login",
        "Hospedagem compartilhada"
    ],
    pro: [
        "Até 8 páginas no site",
        "Design personalizado",
        "Suporte por chat",
        "Painel administrativo básico",
        "Hospedagem cloud"
    ],
    premium: [
        "Páginas ilimitadas",
        "Design exclusivo",
        "Suporte 24/7 prioritário",
        "Sistema completo de login",
        "Hospedagem dedicada"
    ]
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    showLoadingScreen();
    await initializeFirebase();
    initializeEventListeners();
    initializeCountdown();
    initializeAnimations();
    hideLoadingScreen();
}

function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoadingScreen() {
    setTimeout(() => {
        document.getElementById('loadingScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 500);
    }, 1000);
}

async function initializeFirebase() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            currentUser = user;
            if (user) {
                checkAdminStatus(user);
                loadUserProfile();
                loadUserChats();
            } else {
                isAdmin = false;
            }
            updateUI();
            resolve();
        });
    });
}

function initializeEventListeners() {
    // Auth forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('profileForm').addEventListener('submit', updateProfile);
    
    // Modal handlers
    document.getElementById('googleLoginBtn').addEventListener('click', signInWithGoogle);
    document.getElementById('mobileGoogleLoginBtn').addEventListener('click', signInWithGoogle);
    
    // Navigation
    document.getElementById('mobileMenuToggle').addEventListener('click', toggleMobileMenu);
    document.getElementById('userMenuToggle').addEventListener('click', toggleUserDropdown);
    document.getElementById('mobileUserMenuToggle').addEventListener('click', toggleMobileUserDropdown);
    
    // Chat
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', closeAllDropdowns);
}

function initializeCountdown() {
    const countdownDate = new Date();
    countdownDate.setDate(countdownDate.getDate() + 7);
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = countdownDate - now;
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById('countdownTimer').innerHTML = 
            `${days}d ${hours}h ${minutes}m ${seconds}s`;
            
        if (distance < 0) {
            clearInterval(countdownInterval);
            document.getElementById('countdownTimer').innerHTML = "Oferta expirada!";
        }
    }
    
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
}

function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe all elements with animate-on-scroll class
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// ===== AUTENTICAÇÃO =====
async function checkAdminStatus(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            isAdmin = userData.isAdmin || user.email === ADMIN_EMAIL;
        } else {
            isAdmin = user.email === ADMIN_EMAIL;
        }
    } catch (error) {
        console.error('Erro ao verificar status de admin:', error);
        isAdmin = user.email === ADMIN_EMAIL;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    showLoading('loginSpinner');
    disableForm('loginForm');

    try {
        await auth.signInWithEmailAndPassword(email, password);
        closeModal('loginModal');
        showNotification('Login realizado com sucesso!', 'success');
    } catch (error) {
        handleAuthError(error, 'login');
    } finally {
        hideLoading('loginSpinner');
        enableForm('loginForm');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('As senhas não coincidem!', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('A senha deve ter pelo menos 6 caracteres!', 'error');
        return;
    }

    showLoading('registerSpinner');
    disableForm('registerForm');

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            photoURL: '',
            phone: '',
            company: '',
            bio: '',
            plan: 'free',
            isAdmin: email === ADMIN_EMAIL,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });

        closeModal('registerModal');
        showNotification('Conta criada com sucesso! Bem-vindo à TDC-Dev!', 'success');
    } catch (error) {
        handleAuthError(error, 'register');
    } finally {
        hideLoading('registerSpinner');
        enableForm('registerForm');
    }
}

async function signInWithGoogle() {
    showLoading();

    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            await db.collection('users').doc(user.uid).set({
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                phone: '',
                company: '',
                bio: '',
                plan: 'free',
                isAdmin: user.email === ADMIN_EMAIL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        closeModal('loginModal');
        closeModal('registerModal');
        showNotification('Login com Google realizado com sucesso!', 'success');
    } catch (error) {
        handleAuthError(error, 'google');
    } finally {
        hideLoading();
    }
}

async function logout() {
    showLoading();
    try {
        await auth.signOut();
        closeUserDropdown();
        closeChat();
        showNotification('Logout realizado com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro no logout: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ===== MANIPULAÇÃO DE ERROS =====
function handleAuthError(error, type) {
    let errorMessage = 'Erro de autenticação. Tente novamente.';
    
    switch (error.code) {
        case 'auth/invalid-email':
            errorMessage = 'Email inválido. Verifique o formato.';
            break;
        case 'auth/user-disabled':
            errorMessage = 'Esta conta foi desativada.';
            break;
        case 'auth/user-not-found':
            errorMessage = type === 'login' ? 'Nenhuma conta encontrada com este email.' : 'Email já está em uso.';
            break;
        case 'auth/wrong-password':
            errorMessage = 'Senha incorreta. Tente novamente.';
            break;
        case 'auth/email-already-in-use':
            errorMessage = 'Este email já está em uso.';
            break;
        case 'auth/weak-password':
            errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
            break;
        case 'auth/too-many-requests':
            errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
            break;
        case 'auth/popup-closed-by-user':
            errorMessage = 'Login cancelado.';
            break;
        case 'auth/popup-blocked':
            errorMessage = 'Popup bloqueado. Permita popups para este site.';
            break;
    }
    
    showNotification(errorMessage, 'error');
}

// ===== INTERFACE DO USUÁRIO =====
function updateUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const mobileAuthButtons = document.getElementById('mobileAuthButtons');
    const mobileUserMenu = document.getElementById('mobileUserMenu');
    const adminMenuItem = document.getElementById('adminMenuItem');
    const mobileAdminMenuItem = document.getElementById('mobileAdminMenuItem');

    if (currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'block';
        mobileAuthButtons.style.display = 'none';
        mobileUserMenu.style.display = 'block';
        
        if (isAdmin) {
            adminMenuItem.style.display = 'flex';
            mobileAdminMenuItem.style.display = 'block';
        } else {
            adminMenuItem.style.display = 'none';
            mobileAdminMenuItem.style.display = 'none';
        }
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
        mobileAuthButtons.style.display = 'flex';
        mobileUserMenu.style.display = 'none';
    }
}

async function loadUserProfile() {
    if (!currentUser) return;

    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            updateProfileUI(userData);
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

function updateProfileUI(userData) {
    // Header
    document.getElementById('userName').textContent = userData.name || currentUser.displayName || 'Usuário';
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('mobileUserName').textContent = userData.name || currentUser.displayName || 'Usuário';
    document.getElementById('mobileUserEmail').textContent = currentUser.email;

    // Avatar do header
    updateAvatar('userAvatar', userData.photoURL, userData.name);
    updateAvatar('mobileAvatarInitial', userData.photoURL, userData.name);

    // Modal de perfil
    document.getElementById('profileNameDisplay').textContent = userData.name || 'Nome não definido';
    document.getElementById('profileEmailDisplay').textContent = currentUser.email;
    document.getElementById('profileName').value = userData.name || '';
    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profilePhone').value = userData.phone || '';
    document.getElementById('profileCompany').value = userData.company || '';
    document.getElementById('profileBio').value = userData.bio || '';
    
    // Avatar do modal de perfil
    updateAvatar('profileAvatar', userData.photoURL, userData.name);
}

function updateAvatar(elementId, photoURL, name) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (photoURL) {
        element.src = photoURL;
        element.style.display = 'block';
        if (element.nextElementSibling) {
            element.nextElementSibling.style.display = 'none';
        }
    } else {
        element.style.display = 'none';
        const initialElement = element.nextElementSibling;
        if (initialElement) {
            initialElement.style.display = 'flex';
            initialElement.textContent = name ? name.charAt(0).toUpperCase() : 'U';
        }
    }
}

// ===== GERENCIAMENTO DE PERFIL =====
async function updateProfile(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    const name = document.getElementById('profileName').value;
    const phone = document.getElementById('profilePhone').value;
    const company = document.getElementById('profileCompany').value;
    const bio = document.getElementById('profileBio').value;
    const photoFile = document.getElementById('profilePhoto').files[0];

    showLoading('profileSpinner');
    disableForm('profileForm');

    try {
        let photoURL = null;
        
        // Upload da foto se existir
        if (photoFile) {
            photoURL = await uploadProfilePhoto(photoFile);
        }

        const updateData = {
            name: name,
            phone: phone,
            company: company,
            bio: bio,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (photoURL) {
            updateData.photoURL = photoURL;
        }

        await db.collection('users').doc(currentUser.uid).update(updateData);
        
        closeModal('profileModal');
        showNotification('Perfil atualizado com sucesso!', 'success');
        loadUserProfile(); // Recarrega os dados do perfil
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        showNotification('Erro ao atualizar perfil: ' + error.message, 'error');
    } finally {
        hideLoading('profileSpinner');
        enableForm('profileForm');
    }
}

async function uploadProfilePhoto(file) {
    const storageRef = storage.ref();
    const photoRef = storageRef.child(`profile_photos/${currentUser.uid}/${file.name}`);
    
    await photoRef.put(file);
    return await photoRef.getDownloadURL();
}

// ===== SISTEMA DE CHAT =====
async function loadUserChats() {
    if (!currentUser) return;

    try {
        const chatsSnapshot = await db.collection('chats')
            .where('participants', 'array-contains', currentUser.uid)
            .orderBy('lastMessageAt', 'desc')
            .get();

        const chatsList = document.getElementById('chatsList');
        chatsList.innerHTML = '';

        if (chatsSnapshot.empty) {
            chatsList.innerHTML = '<div class="empty-state">Nenhuma conversa encontrada</div>';
            return;
        }

        chatsSnapshot.forEach(doc => {
            const chat = doc.data();
            const chatElement = createChatElement(doc.id, chat);
            chatsList.appendChild(chatElement);
        });
    } catch (error) {
        console.error('Erro ao carregar chats:', error);
    }
}

function createChatElement(chatId, chat) {
    const div = document.createElement('div');
    div.className = `chat-item ${currentChat === chatId ? 'active' : ''}`;
    div.innerHTML = `
        <div class="chat-info">
            <div class="chat-name">${chat.name || 'Chat'}</div>
            <div class="chat-last-message">${chat.lastMessage || 'Nenhuma mensagem'}</div>
        </div>
        <div class="chat-time">${formatTime(chat.lastMessageAt)}</div>
    `;
    
    div.addEventListener('click', () => openChat(chatId, chat));
    return div;
}

async function openChat(chatId, chat) {
    currentChat = chatId;
    
    // Atualiza UI do chat
    document.getElementById('chatHeader').textContent = chat.name || 'Chat';
    document.getElementById('messagesContainer').innerHTML = '';
    
    // Carrega mensagens
    await loadMessages(chatId);
    
    // Mostra o chat
    document.getElementById('chatSection').style.display = 'block';
    
    // Atualiza lista de chats
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.chat-item[onclick*="${chatId}"]`)?.classList.add('active');
}

async function loadMessages(chatId) {
    try {
        const messagesSnapshot = await db.collection('chats')
            .doc(chatId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .get();

        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';

        messagesSnapshot.forEach(doc => {
            const message = doc.data();
            const messageElement = createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });

        // Scroll para baixo
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
    div.innerHTML = `
        <div class="message-content">
            <div class="message-text">${message.text}</div>
            <div class="message-time">${formatTime(message.timestamp)}</div>
        </div>
    `;
    return div;
}

async function sendMessage() {
    if (!currentChat || !currentUser) return;

    const messageInput = document.getElementById('messageInput');
    const text = messageInput.value.trim();

    if (!text) return;

    try {
        const messageData = {
            text: text,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || currentUser.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Adiciona mensagem ao chat
        await db.collection('chats')
            .doc(currentChat)
            .collection('messages')
            .add(messageData);

        // Atualiza último mensagem no chat
        await db.collection('chats')
            .doc(currentChat)
            .update({
                lastMessage: text,
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        // Limpa input
        messageInput.value = '';
        
        // Recarrega mensagens
        await loadMessages(currentChat);
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showNotification('Erro ao enviar mensagem', 'error');
    }
}

// ===== UTILITÁRIOS =====
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    return date.toLocaleDateString('pt-BR');
}

function showLoading(elementId = null) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) element.style.display = 'inline-block';
    } else {
        document.getElementById('loadingScreen').style.display = 'flex';
    }
}

function hideLoading(elementId = null) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) element.style.display = 'none';
    } else {
        document.getElementById('loadingScreen').style.display = 'none';
    }
}

function disableForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input, button, textarea');
    inputs.forEach(input => input.disabled = true);
}

function enableForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input, button, textarea');
    inputs.forEach(input => input.disabled = false);
}

function showNotification(message, type = 'info') {
    // Remove notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(notification);

    // Auto-remove após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// ===== MODAIS E DROPDOWNS =====
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    setTimeout(() => {
        document.getElementById(modalId).classList.add('active');
    }, 10);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('active');
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('active');
}

function toggleMobileUserDropdown() {
    const dropdown = document.getElementById('mobileUserDropdown');
    dropdown.classList.toggle('active');
}

function closeUserDropdown() {
    document.getElementById('userDropdown').classList.remove('active');
    document.getElementById('mobileUserDropdown').classList.remove('active');
}

function closeChat() {
    document.getElementById('chatSection').style.display = 'none';
    currentChat = null;
}

function closeAllDropdowns(e) {
    if (!e.target.closest('.user-menu') && !e.target.closest('.mobile-user-menu')) {
        closeUserDropdown();
    }
    if (!e.target.closest('#mobileMenu') && !e.target.closest('#mobileMenuToggle')) {
        document.getElementById('mobileMenu').classList.remove('active');
    }
}

// ===== PLANOS E PREÇOS =====
function showPlanDetails(plan) {
    const limitations = PLAN_LIMITATIONS[plan] || [];
    const modal = document.getElementById('planDetailsModal');
    const title = modal.querySelector('.modal-title');
    const list = modal.querySelector('.limitations-list');
    
    title.textContent = `Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
    list.innerHTML = limitations.map(item => `<li>${item}</li>`).join('');
    
    openModal('planDetailsModal');
}

// ===== EXPORTAÇÃO PARA HTML =====
// Funções que são chamadas diretamente do HTML
window.openModal = openModal;
window.closeModal = closeModal;
window.logout = logout;
window.showPlanDetails = showPlanDetails;
window.signInWithGoogle = signInWithGoogle;
window.toggleMobileMenu = toggleMobileMenu;
window.toggleUserDropdown = toggleUserDropdown;
window.toggleMobileUserDropdown = toggleMobileUserDropdown;
window.closeChat = closeChat;

// Fecha modais clicando no overlay
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal.id);
        }
    });
});

// Fecha dropdowns ao pressionar ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeUserDropdown();
        document.getElementById('mobileMenu').classList.remove('active');
    }
});