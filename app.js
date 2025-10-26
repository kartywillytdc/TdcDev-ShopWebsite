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

// ===== INICIALIZ
