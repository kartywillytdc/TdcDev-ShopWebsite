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
const ADMIN_EMAIL = "admin@tdcdev.com"; // Altere para o email do administrador

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

// Login com Email/Senha
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleLogin();
});

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginSpinner = document.getElementById('loginSpinner');

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

// Registro com Email/Senha
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleRegister();
});

async function handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    // Validações
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

// Login com Google
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

// Logout
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

    // Badge do perfil
    const profileBadge = document.getElementById('profileBadge');
    if (isAdmin) {
        profileBadge.textContent = 'Administrador';
        profileBadge.style.background = 'rgba(239, 68, 68, 0.2)';
        profileBadge.style.color = 'var(--danger)';
    } else {
        profileBadge.textContent = userData.plan === 'free' ? 'Usuário Free' : `Plano ${userData.plan}`;
    }

    // Avatar do modal
    updateAvatar('profileAvatarLarge', userData.photoURL, userData.name);
}

function updateAvatar(elementId, photoURL, name) {
    const element = document.getElementById(elementId);
    if (photoURL) {
        if (elementId.includes('AvatarLarge')) {
            element.src = photoURL;
            element.style.display = 'block';
        } else {
            element.innerHTML = `<img src="${photoURL}" style="width: 100%; height: 100%; border-radius: 50%;">`;
        }
    } else {
        if (elementId.includes('AvatarLarge')) {
            element.style.display = 'none';
        } else {
            const initial = (name || 'U').charAt(0).toUpperCase();
            element.innerHTML = `<span>${initial}</span>`;
        }
    }
}

// ===== SISTEMA DE PERFIL =====
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await updateProfile();
});

async function updateProfile() {
    const name = document.getElementById('profileName').value;
    const phone = document.getElementById('profilePhone').value;
    const company = document.getElementById('profileCompany').value;
    const bio = document.getElementById('profileBio').value;

    showLoading();

    try {
        await db.collection('users').doc(currentUser.uid).set({
            name: name,
            phone: phone,
            company: company,
            bio: bio,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        updateProfileUI({
            name: name,
            phone: phone,
            company: company,
            bio: bio,
            photoURL: document.getElementById('profileAvatarLarge').src || ''
        });

        showNotification('Perfil atualizado com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro ao atualizar perfil: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Upload de avatar
document.getElementById('avatarUploadProfile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('Por favor, selecione uma imagem válida.', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('A imagem deve ter menos de 5MB.', 'error');
        return;
    }

    showLoading();

    try {
        const storageRef = storage.ref();
        const avatarRef = storageRef.child(`avatars/${currentUser.uid}/${file.name}`);
        const snapshot = await avatarRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        await db.collection('users').doc(currentUser.uid).set({
            photoURL: downloadURL,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        updateAvatar('profileAvatarLarge', downloadURL, document.getElementById('profileName').value);
        updateAvatar('userAvatar', downloadURL, document.getElementById('profileName').value);
        updateAvatar('mobileAvatarInitial', downloadURL, document.getElementById('profileName').value);
        
        showNotification('Avatar atualizado com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro ao fazer upload do avatar: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// ===== SISTEMA DE TOKENS =====
document.getElementById('tokenForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await redeemToken();
});

async function redeemToken() {
    const tokenCode = document.getElementById('tokenCode').value.trim().toUpperCase();

    if (!tokenCode.startsWith('TDC-')) {
        showNotification('Formato de token inválido. Deve começar com "TDC-"', 'error');
        return;
    }

    showLoading();

    try {
        const tokenDoc = await db.collection('tokens').doc(tokenCode).get();
        
        if (!tokenDoc.exists) {
            showNotification('Token inválido ou não encontrado.', 'error');
            return;
        }

        const tokenData = tokenDoc.data();

        if (tokenData.used) {
            showNotification('Este token já foi utilizado.', 'error');
            return;
        }

        if (tokenData.expires && tokenData.expires.toDate() < new Date()) {
            showNotification('Token expirado.', 'error');
            return;
        }

        // Ativar plano do usuário
        await db.collection('users').doc(currentUser.uid).set({
            plan: tokenData.plan,
            planActivated: firebase.firestore.FieldValue.serverTimestamp(),
            planExpires: tokenData.expires
        }, { merge: true });

        // Marcar token como usado
        await db.collection('tokens').doc(tokenCode).set({
            used: true,
            usedBy: currentUser.uid,
            usedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        closeModal('tokenModal');
        showNotification(`Plano ${tokenData.plan} ativado com sucesso!`, 'success');
        
        // Recarregar perfil para atualizar badge
        loadUserProfile();

    } catch (error) {
        showNotification('Erro ao resgatar token: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ===== SISTEMA DE SOLICITAÇÕES =====
document.getElementById('requestForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitRequest();
});

function openRequestModal(planType) {
    if (!currentUser) {
        showNotification('Você precisa estar logado para solicitar um plano.', 'error');
        openModal('loginModal');
        return;
    }

    const planNames = {
        basic: 'Básico',
        pro: 'Pro',
        premium: 'Premium'
    };

    document.getElementById('requestPlanName').textContent = planNames[planType] || 'Plano';
    document.getElementById('selectedPlan').value = planType;

    // Atualizar limitações do plano
    const limitations = PLAN_LIMITATIONS[planType] || [];
    const limitationContainer = document.querySelector('.limitation-content');
    limitationContainer.innerHTML = '';

    limitations.forEach((limitation, index) => {
        const limitationItem = document.createElement('div');
        limitationItem.className = 'limitation-item';
        limitationItem.innerHTML = `
            <span class="material-symbols-outlined">${planType === 'premium' ? 'star' : 'check'}</span>
            <span>${limitation}</span>
        `;
        limitationContainer.appendChild(limitationItem);
    });

    openModal('requestModal');
}

async function submitRequest() {
    const plan = document.getElementById('selectedPlan').value;
    const projectName = document.getElementById('projectName').value;
    const projectType = document.getElementById('projectType').value;
    const projectDescription = document.getElementById('projectDescription').value;
    const projectDeadline = document.getElementById('projectDeadline').value;
    const projectBudget = document.getElementById('projectBudget').value;
    const projectReferences = document.getElementById('projectReferences').value;

    showLoading();

    try {
        const requestData = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName: currentUser.displayName || document.getElementById('profileName').value,
            plan: plan,
            projectName: projectName,
            projectType: projectType,
            projectDescription: projectDescription,
            projectDeadline: parseInt(projectDeadline),
            projectBudget: projectBudget,
            projectReferences: projectReferences,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('requests').add(requestData);

        // Criar chat automaticamente para esta solicitação
        const chatData = {
            requestId: '', // Será atualizado após criar o chat
            userId: currentUser.uid,
            userName: currentUser.displayName || document.getElementById('profileName').value,
            userEmail: currentUser.email,
            adminId: null,
            adminName: null,
            status: 'open',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const chatRef = await db.collection('chats').add(chatData);
        await chatRef.update({ requestId: chatRef.id });

        closeModal('requestModal');
        
        // Mostrar modal de sucesso
        document.getElementById('successMessage').textContent = 
            `Solicitação do plano ${plan} enviada com sucesso! Nossa equipe entrará em contato em até 24 horas.`;
        openModal('successModal');

        showNotification('Solicitação enviada com sucesso!', 'success');

    } catch (error) {
        showNotification('Erro ao enviar solicitação: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ===== SISTEMA DE CHAT =====
async function loadUserChats() {
    if (!currentUser) return;

    try {
        let chatsQuery;
        
        if (isAdmin) {
            // Admin vê todos os chats
            chatsQuery = db.collection('chats')
                .orderBy('lastMessageAt', 'desc')
                .limit(20);
        } else {
            // Usuário vê apenas seus chats
            chatsQuery = db.collection('chats')
                .where('userId', '==', currentUser.uid)
                .orderBy('lastMessageAt', 'desc')
                .limit(10);
        }

        const chatsSnapshot = await chatsQuery.get();
        
        if (!chatsSnapshot.empty) {
            // Aqui você pode implementar a lista de chats
            // Por enquanto, vamos apenas contar mensagens não lidas
            await updateUnreadMessagesCount();
        }
    } catch (error) {
        console.error('Erro ao carregar chats:', error);
    }
}

async function updateUnreadMessagesCount() {
    if (!currentUser) return;

    try {
        const unreadSnapshot = await db.collection('messages')
            .where('userId', '==', currentUser.uid)
            .where('read', '==', false)
            .where('sender', '==', 'admin')
            .get();

        unreadMessages = unreadSnapshot.size;
        
        const unreadBadge = document.getElementById('unreadMessages');
        if (unreadMessages > 0) {
            unreadBadge.textContent = unreadMessages;
            unreadBadge.style.display = 'inline-block';
        } else {
            unreadBadge.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao atualizar contador de mensagens:', error);
    }
}

function openChat(chatId = null) {
    if (!currentUser) {
        showNotification('Você precisa estar logado para usar o chat.', 'error');
        openModal('loginModal');
        return;
    }

    const chatContainer = document.getElementById('chatContainer');
    const chatMinimized = document.getElementById('chatMinimized');
    
    chatContainer.style.display = 'flex';
    chatMinimized.style.display = 'none';

    if (chatId) {
        loadChat(chatId);
    } else {
        // Criar ou carregar chat principal
        loadMainChat();
    }
}

function closeChat() {
    const chatContainer = document.getElementById('chatContainer');
    const chatMinimized = document.getElementById('chatMinimized');
    
    chatContainer.style.display = 'none';
    chatMinimized.style.display = 'block';
    currentChat = null;
}

function minimizeChat() {
    const chatContainer = document.getElementById('chatContainer');
    const chatMinimized = document.getElementById('chatMinimized');
    
    chatContainer.style.display = 'none';
    chatMinimized.style.display = 'block';
}

async function loadMainChat() {
    if (!currentUser) return;

    try {
        // Para usuários normais, buscar chat principal
        // Para admins, poderia ser uma lista de chats
        const chatSnapshot = await db.collection('chats')
            .where('userId', '==', currentUser.uid)
            .orderBy('lastMessageAt', 'desc')
            .limit(1)
            .get();

        if (chatSnapshot.empty) {
            // Criar novo chat
            const chatData = {
                userId: currentUser.uid,
                userName: currentUser.displayName || document.getElementById('profileName').value,
                userEmail: currentUser.email,
                adminId: null,
                adminName: null,
                type: 'support',
                status: 'open',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const chatRef = await db.collection('chats').add(chatData);
            currentChat = chatRef.id;
            await loadChatMessages(currentChat);
        } else {
            currentChat = chatSnapshot.docs[0].id;
            await loadChatMessages(currentChat);
        }
    } catch (error) {
        console.error('Erro ao carregar chat:', error);
    }
}

async function loadChatMessages(chatId) {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';

    try {
        const messagesSnapshot = await db.collection('messages')
            .where('chatId', '==', chatId)
            .orderBy('timestamp', 'asc')
            .get();

        messagesSnapshot.forEach(doc => {
            const message = doc.data();
            addMessageToChat(message);
        });

        // Marcar mensagens como lidas
        await markMessagesAsRead(chatId);

        // Scroll para baixo
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

function addMessageToChat(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    
    messageElement.className = `message ${message.sender === 'user' ? 'user' : 'admin'}`;
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-text">${message.text}</div>
            <div class="message-time">${formatMessageTime(message.timestamp?.toDate())}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const messageText = chatInput.value.trim();

    if (!messageText || !currentChat || !currentUser) return;

    // Adicionar mensagem localmente primeiro
    const tempMessage = {
        text: messageText,
        sender: 'user',
        timestamp: new Date(),
        read: false
    };

    addMessageToChat(tempMessage);
    chatInput.value = '';

    // Scroll para baixo
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        // Salvar mensagem no Firebase
        const messageData = {
            chatId: currentChat,
            userId: currentUser.uid,
            text: messageText,
            sender: 'user',
            read: false,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('messages').add(messageData);

        // Atualizar último horário do chat
        await db.collection('chats').doc(currentChat).update({
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
        });

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showNotification('Erro ao enviar mensagem. Tente novamente.', 'error');
    }
}

async function markMessagesAsRead(chatId) {
    try {
        const unreadMessagesSnapshot = await db.collection('messages')
            .where('chatId', '==', chatId)
            .where('sender', '==', 'admin')
            .where('read', '==', false)
            .get();

        const batch = db.batch();
        unreadMessagesSnapshot.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });

        await batch.commit();
        await updateUnreadMessagesCount();
    } catch (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
    }
}

// ===== FUNÇÕES DE APOIO =====
function formatMessageTime(timestamp) {
    if (!timestamp) return 'Agora';
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} h atrás`;
    
    return messageTime.toLocaleDateString('pt-BR');
}

function showLoading(elementId = null) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'inline-block';
        }
    } else {
        document.body.classList.add('loading');
    }
}

function hideLoading(elementId = null) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    } else {
        document.body.classList.remove('loading');
    }
}

function disableForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input, button, textarea, select');
    inputs.forEach(input => {
        input.disabled = true;
    });
}

function enableForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input, button, textarea, select');
    inputs.forEach(input => {
        input.disabled = false;
    });
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// ===== SISTEMA DE MODAIS =====
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
    closeUserDropdown();
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

function closeUserDropdown() {
    document.getElementById('userDropdown').classList.remove('show');
}

function openProfileModal() {
    openModal('profileModal');
}

function showTokenModal() {
    if (!currentUser) {
        showNotification('Você precisa estar logado para resgatar tokens.', 'error');
        openModal('loginModal');
        return;
    }
    openModal('tokenModal');
}

function openAdminPanel() {
    if (isAdmin) {
        // Aqui você pode redirecionar para o painel admin ou abrir um modal
        showNotification('Redirecionando para o painel administrativo...', 'success');
        // window.location.href = 'admin.html'; // Se tiver uma página separada
    } else {
        showNotification('Acesso negado. Apenas administradores podem acessar o painel.', 'error');
    }
}

// ===== NAVEGAÇÃO MOBILE =====
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('open');
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const headerHeight = document.getElementById('header').offsetHeight;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// ===== ANIMAÇÕES E EFEITOS =====
function initializeAnimations() {
    // Animação de contagem dos stats
    animateStats();
    
    // Efeito de scroll no header
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Fechar modais ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu-container')) {
            closeUserDropdown();
        }
    });

    // Enter para enviar mensagem no chat
    document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateNumber(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(stat => observer.observe(stat));
}

function animateNumber(element, target) {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 30);
}

// ===== COUNTDOWN TIMER =====
function initializeCountdown() {
    const countdownDate = new Date();
    countdownDate.setDate(countdownDate.getDate() + 7); // 7 dias a partir de hoje

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = countdownDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');

        if (distance < 0) {
            clearInterval(countdownTimer);
            document.querySelector('.countdown').innerHTML = 'Oferta expirada!';
        }
    }

    updateCountdown();
    const countdownTimer = setInterval(updateCountdown, 1000);
}

// ===== TOGGLE DE PREÇOS =====
function toggleBilling() {
    const toggle = document.getElementById('billingToggle');
    const priceElements = document.querySelectorAll('.price-amount');
    
    priceElements.forEach(element => {
        const monthly = element.getAttribute('data-monthly');
        const yearly = element.getAttribute('data-yearly');
        
        if (toggle.checked) {
            // Plano anual
            element.textContent = `R$ ${yearly}`;
        } else {
            // Plano mensal
            element.textContent = `R$ ${monthly}`;
        }
    });
}

// ===== DISCORD =====
function joinDiscord() {
    showNotification('Redirecionando para o Discord...', 'success');
    setTimeout(() => {
        window.open('https://discord.gg/tdcdev', '_blank');
    }, 1000);
}

// ===== INICIALIZAÇÃO DE EVENT LISTENERS =====
function initializeEventListeners() {
    // Event listeners para modais
    document.querySelectorAll('[data-modal]').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    // Event listeners para fechar modais
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Event listeners para navegação mobile
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
            toggleMobileMenu();
        });
    });

    // Event listener para o formulário de chat
    document.getElementById('chatForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage();
    });

    // Event listener para o botão de enviar mensagem
    document.getElementById('sendMessageBtn')?.addEventListener('click', sendMessage);

    // Event listeners para o sistema de chat
    document.getElementById('openChatBtn')?.addEventListener('click', () => openChat());
    document.getElementById('closeChatBtn')?.addEventListener('click', closeChat);
    document.getElementById('minimizeChatBtn')?.addEventListener('click', minimizeChat);
    document.getElementById('chatMinimized')?.addEventListener('click', () => openChat());

    // Event listener para o toggle de preços
    document.getElementById('billingToggle')?.addEventListener('change', toggleBilling);

    // Event listener para o Discord
    document.getElementById('discordBtn')?.addEventListener('click', joinDiscord);
}

// ===== SISTEMA DE ADMINISTRAÇÃO =====
async function loadAdminPanel() {
    if (!isAdmin) return;

    try {
        // Carregar estatísticas
        await loadAdminStats();
        
        // Carregar solicitações pendentes
        await loadPendingRequests();
        
        // Carregar todos os chats
        await loadAllChats();
        
        // Carregar usuários recentes
        await loadRecentUsers();
        
    } catch (error) {
        console.error('Erro ao carregar painel admin:', error);
    }
}

async function loadAdminStats() {
    try {
        // Total de usuários
        const usersSnapshot = await db.collection('users').get();
        document.getElementById('totalUsers').textContent = usersSnapshot.size;

        // Total de solicitações
        const requestsSnapshot = await db.collection('requests').get();
        document.getElementById('totalRequests').textContent = requestsSnapshot.size;

        // Solicitações pendentes
        const pendingRequests = await db.collection('requests')
            .where('status', '==', 'pending')
            .get();
        document.getElementById('pendingRequests').textContent = pendingRequests.size;

        // Chats ativos
        const activeChats = await db.collection('chats')
            .where('status', '==', 'open')
            .get();
        document.getElementById('activeChats').textContent = activeChats.size;

    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

async function loadPendingRequests() {
    const requestsContainer = document.getElementById('adminRequests');
    if (!requestsContainer) return;

    try {
        const requestsSnapshot = await db.collection('requests')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        requestsContainer.innerHTML = '';

        if (requestsSnapshot.empty) {
            requestsContainer.innerHTML = '<p class="no-data">Nenhuma solicitação pendente</p>';
            return;
        }

        requestsSnapshot.forEach(doc => {
            const request = doc.data();
            const requestElement = createRequestElement(doc.id, request);
            requestsContainer.appendChild(requestElement);
        });

    } catch (error) {
        console.error('Erro ao carregar solicitações:', error);
        requestsContainer.innerHTML = '<p class="error">Erro ao carregar solicitações</p>';
    }
}

function createRequestElement(requestId, request) {
    const element = document.createElement('div');
    element.className = 'request-item';
    element.innerHTML = `
        <div class="request-header">
            <h4>${request.projectName || 'Sem nome'}</h4>
            <span class="plan-badge ${request.plan}">${request.plan}</span>
        </div>
        <div class="request-details">
            <p><strong>Cliente:</strong> ${request.userName} (${request.userEmail})</p>
            <p><strong>Tipo:</strong> ${request.projectType}</p>
            <p><strong>Prazo:</strong> ${request.projectDeadline} dias</p>
            <p><strong>Orçamento:</strong> R$ ${request.projectBudget}</p>
            <p><strong>Descrição:</strong> ${request.projectDescription}</p>
            ${request.projectReferences ? `<p><strong>Referências:</strong> ${request.projectReferences}</p>` : ''}
        </div>
        <div class="request-actions">
            <button class="btn-success" onclick="approveRequest('${requestId}')">Aprovar</button>
            <button class="btn-danger" onclick="rejectRequest('${requestId}')">Rejeitar</button>
            <button class="btn-secondary" onclick="openChatForRequest('${requestId}', '${request.userId}')">Chat</button>
        </div>
    `;
    return element;
}

async function approveRequest(requestId) {
    if (!confirm('Tem certeza que deseja aprovar esta solicitação?')) return;

    showLoading();

    try {
        await db.collection('requests').doc(requestId).update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: currentUser.uid
        });

        // Gerar token automaticamente
        const requestDoc = await db.collection('requests').doc(requestId).get();
        const requestData = requestDoc.data();
        
        const tokenCode = generateTokenCode();
        const tokenData = {
            plan: requestData.plan,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
            used: false
        };

        await db.collection('tokens').doc(tokenCode).set(tokenData);

        // Enviar notificação por email (simulado)
        await sendApprovalEmail(requestData.userEmail, tokenCode);

        showNotification('Solicitação aprovada e token gerado!', 'success');
        await loadPendingRequests();
        await loadAdminStats();

    } catch (error) {
        showNotification('Erro ao aprovar solicitação: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function rejectRequest(requestId) {
    const reason = prompt('Digite o motivo da rejeição:');
    if (!reason) return;

    showLoading();

    try {
        await db.collection('requests').doc(requestId).update({
            status: 'rejected',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
            rejectedBy: currentUser.uid,
            rejectionReason: reason
        });

        showNotification('Solicitação rejeitada!', 'success');
        await loadPendingRequests();
        await loadAdminStats();

    } catch (error) {
        showNotification('Erro ao rejeitar solicitação: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function generateTokenCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'TDC-';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function sendApprovalEmail(userEmail, tokenCode) {
    // Em uma implementação real, você usaria um serviço de email
    // Aqui estamos apenas simulando o envio
    console.log(`Email enviado para ${userEmail} com token: ${tokenCode}`);
    
    // Você pode integrar com SendGrid, AWS SES, ou outro serviço de email
    // Por enquanto, apenas mostramos uma notificação
    showNotification(`Token ${tokenCode} gerado para ${userEmail}`, 'success');
}

async function openChatForRequest(requestId, userId) {
    // Encontrar ou criar chat para este usuário
    const chatSnapshot = await db.collection('chats')
        .where('userId', '==', userId)
        .where('status', '==', 'open')
        .limit(1)
        .get();

    let chatId;

    if (chatSnapshot.empty) {
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        
        const chatData = {
            userId: userId,
            userName: userData.name,
            userEmail: userData.email,
            adminId: currentUser.uid,
            adminName: currentUser.displayName,
            requestId: requestId,
            status: 'open',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const chatRef = await db.collection('chats').add(chatData);
        chatId = chatRef.id;
    } else {
        chatId = chatSnapshot.docs[0].id;
    }

    openChat(chatId);
}

// ===== SISTEMA DE RELATÓRIOS =====
async function generateReport() {
    if (!isAdmin) return;

    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    if (!startDate || !endDate) {
        showNotification('Selecione as datas inicial e final.', 'error');
        return;
    }

    showLoading();

    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        let reportData = {};

        switch (reportType) {
            case 'users':
                reportData = await generateUsersReport(start, end);
                break;
            case 'requests':
                reportData = await generateRequestsReport(start, end);
                break;
            case 'revenue':
                reportData = await generateRevenueReport(start, end);
                break;
        }

        displayReport(reportData, reportType);

    } catch (error) {
        showNotification('Erro ao gerar relatório: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function generateUsersReport(startDate, endDate) {
    const usersSnapshot = await db.collection('users')
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .get();

    const usersByPlan = {};
    const usersByDay = {};

    usersSnapshot.forEach(doc => {
        const user = doc.data();
        const plan = user.plan || 'free';
        const date = user.createdAt.toDate().toISOString().split('T')[0];

        usersByPlan[plan] = (usersByPlan[plan] || 0) + 1;
        usersByDay[date] = (usersByDay[date] || 0) + 1;
    });

    return {
        total: usersSnapshot.size,
        byPlan: usersByPlan,
        byDay: usersByDay
    };
}

async function generateRequestsReport(startDate, endDate) {
    const requestsSnapshot = await db.collection('requests')
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .get();

    const requestsByPlan = {};
    const requestsByStatus = {};
    const requestsByDay = {};

    requestsSnapshot.forEach(doc => {
        const request = doc.data();
        const plan = request.plan;
        const status = request.status;
        const date = request.createdAt.toDate().toISOString().split('T')[0];

        requestsByPlan[plan] = (requestsByPlan[plan] || 0) + 1;
        requestsByStatus[status] = (requestsByStatus[status] || 0) + 1;
        requestsByDay[date] = (requestsByDay[date] || 0) + 1;
    });

    return {
        total: requestsSnapshot.size,
        byPlan: requestsByPlan,
        byStatus: requestsByStatus,
        byDay: requestsByDay
    };
}

async function generateRevenueReport(startDate, endDate) {
    // Esta é uma simulação - em uma aplicação real, você teria dados de pagamento
    const requestsSnapshot = await db.collection('requests')
        .where('status', '==', 'approved')
        .where('approvedAt', '>=', startDate)
        .where('approvedAt', '<=', endDate)
        .get();

    const revenueByPlan = {
        basic: 0,
        pro: 0,
        premium: 0
    };

    const planPrices = {
        basic: 299,
        pro: 599,
        premium: 999
    };

    requestsSnapshot.forEach(doc => {
        const request = doc.data();
        const plan = request.plan;
        if (planPrices[plan]) {
            revenueByPlan[plan] += planPrices[plan];
        }
    });

    const totalRevenue = Object.values(revenueByPlan).reduce((sum, revenue) => sum + revenue, 0);

    return {
        total: totalRevenue,
        byPlan: revenueByPlan
    };
}

function displayReport(reportData, reportType) {
    const reportOutput = document.getElementById('reportOutput');
    
    let html = `<h3>Relatório de ${getReportTypeName(reportType)}</h3>`;
    html += `<p><strong>Total:</strong> ${formatReportData(reportData.total, reportType)}</p>`;

    if (reportData.byPlan) {
        html += '<h4>Por Plano:</h4><ul>';
        for (const [plan, count] of Object.entries(reportData.byPlan)) {
            html += `<li>${plan}: ${formatReportData(count, reportType)}</li>`;
        }
        html += '</ul>';
    }

    if (reportData.byStatus) {
        html += '<h4>Por Status:</h4><ul>';
        for (const [status, count] of Object.entries(reportData.byStatus)) {
            html += `<li>${status}: ${formatReportData(count, reportType)}</li>`;
        }
        html += '</ul>';
    }

    reportOutput.innerHTML = html;
}

function getReportTypeName(type) {
    const names = {
        users: 'Usuários',
        requests: 'Solicitações',
        revenue: 'Receita'
    };
    return names[type] || type;
}

function formatReportData(data, type) {
    if (type === 'revenue') {
        return `R$ ${data.toFixed(2)}`;
    }
    return data;
}

// ===== GERENCIAMENTO DE TOKENS =====
async function generateToken() {
    if (!isAdmin) return;

    const plan = document.getElementById('tokenPlan').value;
    const expires = document.getElementById('tokenExpires').value;

    if (!plan || !expires) {
        showNotification('Selecione o plano e a data de expiração.', 'error');
        return;
    }

    showLoading();

    try {
        const tokenCode = generateTokenCode();
        const tokenData = {
            plan: plan,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            expires: new Date(expires),
            used: false
        };

        await db.collection('tokens').doc(tokenCode).set(tokenData);

        document.getElementById('generatedToken').textContent = tokenCode;
        document.getElementById('tokenResult').style.display = 'block';
        
        showNotification(`Token ${tokenCode} gerado com sucesso!`, 'success');

    } catch (error) {
        showNotification('Erro ao gerar token: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ===== UTILITÁRIOS ADICIONAIS =====
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copiado para a área de transferência!', 'success');
    }).catch(() => {
        showNotification('Erro ao copiar texto.', 'error');
    });
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR').format(date);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== LISTENERS GLOBAIS =====
document.addEventListener('keydown', (e) => {
    // Fechar modais com ESC
    if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal[style*="display: block"]');
        openModals.forEach(modal => {
            closeModal(modal.id);
        });
    }
});

// Prevenir envio de formulário ao pressionar Enter em inputs não-submit
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !e.target.closest('form')) {
        e.preventDefault();
    }
});

// ===== EXPORTAÇÃO DE DADOS =====
async function exportData() {
    if (!isAdmin) return;

    const exportType = document.getElementById('exportType').value;
    
    showLoading();

    try {
        let data;
        
        switch (exportType) {
            case 'users':
                data = await exportUsers();
                break;
            case 'requests':
                data = await exportRequests();
                break;
            case 'tokens':
                data = await exportTokens();
                break;
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tdc-${exportType}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification('Dados exportados com sucesso!', 'success');

    } catch (error) {
        showNotification('Erro ao exportar dados: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function exportUsers() {
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function exportRequests() {
    const snapshot = await db.collection('requests').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function exportTokens() {
    const snapshot = await db.collection('tokens').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ===== INICIALIZAÇÃO FINAL =====
// Garantir que todas as funções estejam disponíveis globalmente
window.toggleMobileMenu = toggleMobileMenu;
window.scrollToSection = scrollToSection;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleUserDropdown = toggleUserDropdown;
window.closeUserDropdown = closeUserDropdown;
window.openProfileModal = openProfileModal;
window.showTokenModal = showTokenModal;
window.openAdminPanel = openAdminPanel;
window.logout = logout;
window.signInWithGoogle = signInWithGoogle;
window.openRequestModal = openRequestModal;
window.toggleBilling = toggleBilling;
window.joinDiscord = joinDiscord;
window.openChat = openChat;
window.closeChat = closeChat;
window.minimizeChat = minimizeChat;
window.sendMessage = sendMessage;
window.generateReport = generateReport;
window.generateToken = generateToken;
window.copyToClipboard = copyToClipboard;
window.exportData = exportData;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.openChatForRequest = openChatForRequest;

// Inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
        }
