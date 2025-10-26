// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC4R6ANR-8R4g2l7k-9pJKlxJz4eYV1X2w",
    authDomain: "tdc-dev-app.firebaseapp.com",
    projectId: "tdc-dev-app",
    storageBucket: "tdc-dev-app.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Estados da aplicação
let currentUser = null;
let isAdmin = false;

// Elementos DOM
const elements = {
    // Loading
    loadingScreen: document.getElementById('loadingScreen'),
    
    // Header e Navegação
    header: document.getElementById('header'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileMenu: document.getElementById('mobileMenu'),
    mobileMenuCloseBtn: document.getElementById('mobileMenuCloseBtn'),
    
    // Autenticação
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    mobileLoginBtn: document.getElementById('mobileLoginBtn'),
    mobileRegisterBtn: document.getElementById('mobileRegisterBtn'),
    heroRegisterBtn: document.getElementById('heroRegisterBtn'),
    
    // User Menu
    userMenuContainer: document.getElementById('userMenuContainer'),
    userMenuTrigger: document.getElementById('userMenuTrigger'),
    userDropdown: document.getElementById('userDropdown'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    userEmail: document.getElementById('userEmail'),
    userInitials: document.getElementById('userInitials'),
    
    // Mobile User Menu
    mobileUserMenu: document.getElementById('mobileUserMenu'),
    mobileUserAvatar: document.getElementById('mobileUserAvatar'),
    mobileUserName: document.getElementById('mobileUserName'),
    mobileUserEmail: document.getElementById('mobileUserEmail'),
    mobileUserInitials: document.getElementById('mobileUserInitials'),
    
    // Botões de Ação
    profileBtn: document.getElementById('profileBtn'),
    adminBtn: document.getElementById('adminBtn'),
    tokenBtn: document.getElementById('tokenBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    mobileProfileBtn: document.getElementById('mobileProfileBtn'),
    mobileAdminBtn: document.getElementById('mobileAdminBtn'),
    mobileTokenBtn: document.getElementById('mobileTokenBtn'),
    mobileLogoutBtn: document.getElementById('mobileLogoutBtn'),
    
    // Modais
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    profileModal: document.getElementById('profileModal'),
    cropModal: document.getElementById('cropModal'),
    tokenModal: document.getElementById('tokenModal'),
    
    // Botões de Fechar Modal
    loginModalClose: document.getElementById('loginModalClose'),
    registerModalClose: document.getElementById('registerModalClose'),
    profileModalClose: document.getElementById('profileModalClose'),
    cropModalClose: document.getElementById('cropModalClose'),
    tokenModalClose: document.getElementById('tokenModalClose'),
    
    // Formulários
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    profileForm: document.getElementById('profileForm'),
    tokenForm: document.getElementById('tokenForm'),
    
    // Inputs de Formulário
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    registerName: document.getElementById('registerName'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    registerConfirmPassword: document.getElementById('registerConfirmPassword'),
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    profilePhone: document.getElementById('profilePhone'),
    profileCompany: document.getElementById('profileCompany'),
    tokenInput: document.getElementById('tokenInput'),
    
    // Botões de Autenticação Social
    googleLoginBtn: document.getElementById('googleLoginBtn'),
    googleRegisterBtn: document.getElementById('googleRegisterBtn'),
    
    // Troca entre Login/Registro
    switchToRegister: document.getElementById('switchToRegister'),
    switchToLogin: document.getElementById('switchToLogin'),
    
    // Upload de Avatar
    avatarUpload: document.getElementById('avatarUpload'),
    changeAvatarBtn: document.getElementById('changeAvatarBtn'),
    cropImage: document.getElementById('cropImage'),
    zoomSlider: document.getElementById('zoomSlider'),
    cropCancelBtn: document.getElementById('cropCancelBtn'),
    cropSaveBtn: document.getElementById('cropSaveBtn'),
    
    // Preços
    pricingToggle: document.getElementById('pricingToggle'),
    starterPrice: document.getElementById('starterPrice'),
    proPrice: document.getElementById('proPrice'),
    enterprisePrice: document.getElementById('enterprisePrice'),
    
    // Countdown
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds')
};

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Configurar event listeners
    setupEventListeners();
    
    // Inicializar animações
    initAnimations();
    
    // Inicializar contador
    initCountdown();
    
    // Verificar autenticação
    checkAuthState();
    
    // Configurar preços
    setupPricing();
    
    // Configurar FAQ
    setupFAQ();
    
    // Esconder loading screen após 2 segundos
    setTimeout(() => {
        elements.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            elements.loadingScreen.style.display = 'none';
        }, 500);
    }, 2000);
}

// Configurar Event Listeners
function setupEventListeners() {
    // Navegação Mobile
    elements.mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    elements.mobileMenuCloseBtn.addEventListener('click', toggleMobileMenu);
    
    // Botões de Autenticação
    elements.loginBtn.addEventListener('click', () => openModal('loginModal'));
    elements.registerBtn.addEventListener('click', () => openModal('registerModal'));
    elements.mobileLoginBtn.addEventListener('click', () => {
        openModal('loginModal');
        closeMobileMenu();
    });
    elements.mobileRegisterBtn.addEventListener('click', () => {
        openModal('registerModal');
        closeMobileMenu();
    });
    elements.heroRegisterBtn.addEventListener('click', () => openModal('registerModal'));
    
    // Fechar Modais
    elements.loginModalClose.addEventListener('click', () => closeModal('loginModal'));
    elements.registerModalClose.addEventListener('click', () => closeModal('registerModal'));
    elements.profileModalClose.addEventListener('click', () => closeModal('profileModal'));
    elements.cropModalClose.addEventListener('click', () => closeModal('cropModal'));
    elements.tokenModalClose.addEventListener('click', () => closeModal('tokenModal'));
    
    // User Menu
    elements.userMenuTrigger.addEventListener('click', toggleUserDropdown);
    document.addEventListener('click', closeUserDropdown);
    
    // Ações do User Menu
    elements.profileBtn.addEventListener('click', openProfileModal);
    elements.adminBtn.addEventListener('click', openAdminPanel);
    elements.tokenBtn.addEventListener('click', openTokenModal);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Ações do Mobile User Menu
    elements.mobileProfileBtn.addEventListener('click', () => {
        openProfileModal();
        closeMobileMenu();
    });
    elements.mobileAdminBtn.addEventListener('click', () => {
        openAdminPanel();
        closeMobileMenu();
    });
    elements.mobileTokenBtn.addEventListener('click', () => {
        openTokenModal();
        closeMobileMenu();
    });
    elements.mobileLogoutBtn.addEventListener('click', () => {
        handleLogout();
        closeMobileMenu();
    });
    
    // Formulários
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.profileForm.addEventListener('submit', handleProfileUpdate);
    elements.tokenForm.addEventListener('submit', handleTokenRedeem);
    
    // Autenticação Social
    elements.googleLoginBtn.addEventListener('click', handleGoogleLogin);
    elements.googleRegisterBtn.addEventListener('click', handleGoogleLogin);
    
    // Troca entre Login/Registro
    elements.switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('loginModal');
        openModal('registerModal');
    });
    elements.switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('registerModal');
        openModal('loginModal');
    });
    
    // Upload de Avatar
    elements.changeAvatarBtn.addEventListener('click', () => elements.avatarUpload.click());
    elements.avatarUpload.addEventListener('change', handleAvatarUpload);
    elements.cropCancelBtn.addEventListener('click', () => closeModal('cropModal'));
    elements.cropSaveBtn.addEventListener('click', handleCropSave);
    
    // Preços
    elements.pricingToggle.addEventListener('change', updatePricing);
    
    // Scroll do Header
    window.addEventListener('scroll', handleHeaderScroll);
    
    // Fechar modais ao clicar fora
    setupModalCloseListeners();
}

// Verificar Estado de Autenticação
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData(user);
            showUserInterface();
        } else {
            currentUser = null;
            showGuestInterface();
        }
    });
}

// Carregar Dados do Usuário
async function loadUserData(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Atualizar interface com dados do usuário
            updateUserInterface(user, userData);
            
            // Verificar se é admin
            isAdmin = userData.role === 'admin';
            if (isAdmin) {
                elements.adminBtn.style.display = 'flex';
                elements.mobileAdminBtn.style.display = 'flex';
            } else {
                elements.adminBtn.style.display = 'none';
                elements.mobileAdminBtn.style.display = 'none';
            }
        } else {
            // Criar documento do usuário se não existir
            await db.collection('users').doc(user.uid).set({
                name: user.displayName || 'Usuário',
                email: user.email,
                phone: '',
                company: '',
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                plan: 'free'
            });
            
            updateUserInterface(user, {
                name: user.displayName || 'Usuário',
                email: user.email,
                phone: '',
                company: '',
                role: 'user',
                plan: 'free'
            });
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        showNotification('Erro ao carregar dados do usuário', 'error');
    }
}

// Atualizar Interface do Usuário
function updateUserInterface(user, userData) {
    const displayName = userData.name || user.displayName || 'Usuário';
    const email = user.email;
    const initials = getInitials(displayName);
    
    // Desktop
    elements.userName.textContent = displayName;
    elements.userEmail.textContent = email;
    elements.userInitials.textContent = initials;
    
    // Mobile
    elements.mobileUserName.textContent = displayName;
    elements.mobileUserEmail.textContent = email;
    elements.mobileUserInitials.textContent = initials;
    
    // Avatar
    updateAvatar(user, userData);
    
    // Formulário de perfil
    elements.profileName.value = displayName;
    elements.profileEmail.value = email;
    elements.profilePhone.value = userData.phone || '';
    elements.profileCompany.value = userData.company || '';
}

// Atualizar Avatar
function updateAvatar(user, userData) {
    if (userData.photoURL) {
        elements.userAvatar.innerHTML = `<img src="${userData.photoURL}" alt="${userData.name}">`;
        elements.mobileUserAvatar.innerHTML = `<img src="${userData.photoURL}" alt="${userData.name}">`;
        elements.profileAvatar.innerHTML = `<img src="${userData.photoURL}" alt="${userData.name}">`;
    } else {
        elements.userInitials.textContent = getInitials(userData.name);
        elements.mobileUserInitials.textContent = getInitials(userData.name);
        elements.profileInitials.textContent = getInitials(userData.name);
    }
}

// Obter Iniciais do Nome
function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
}

// Mostrar Interface do Usuário Logado
function showUserInterface() {
    elements.userMenuContainer.style.display = 'block';
    elements.mobileUserMenu.style.display = 'block';
    elements.mobileAuthButtons.style.display = 'none';
    
    // Esconder botões de login/registro no desktop
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.style.display = 'none';
    }
}

// Mostrar Interface de Visitante
function showGuestInterface() {
    elements.userMenuContainer.style.display = 'none';
    elements.mobileUserMenu.style.display = 'none';
    elements.mobileAuthButtons.style.display = 'flex';
    
    // Mostrar botões de login/registro no desktop
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.style.display = 'flex';
    }
}

// Manipuladores de Autenticação
async function handleLogin(e) {
    e.preventDefault();
    
    const email = elements.loginEmail.value;
    const password = elements.loginPassword.value;
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        showNotification('Login realizado com sucesso!', 'success');
        closeModal('loginModal');
    } catch (error) {
        console.error('Erro no login:', error);
        showNotification(getAuthErrorMessage(error), 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = elements.registerName.value;
    const email = elements.registerEmail.value;
    const password = elements.registerPassword.value;
    const confirmPassword = elements.registerConfirmPassword.value;
    
    if (password !== confirmPassword) {
        showNotification('As senhas não coincidem', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('A senha deve ter pelo menos 6 caracteres', 'error');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Atualizar perfil do usuário
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // Criar documento do usuário no Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            phone: '',
            company: '',
            role: 'user',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            plan: 'free'
        });
        
        showNotification('Conta criada com sucesso!', 'success');
        closeModal('registerModal');
        
        // Mostrar modal de boas-vindas
        showWelcomeModal();
    } catch (error) {
        console.error('Erro no registro:', error);
        showNotification(getAuthErrorMessage(error), 'error');
    }
}

async function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Verificar se é um novo usuário
        if (result.additionalUserInfo.isNewUser) {
            // Criar documento do usuário no Firestore
            await db.collection('users').doc(user.uid).set({
                name: user.displayName,
                email: user.email,
                phone: '',
                company: '',
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                plan: 'free',
                photoURL: user.photoURL
            });
            
            showWelcomeModal();
        }
        
        showNotification('Login com Google realizado com sucesso!', 'success');
        closeModal('loginModal');
        closeModal('registerModal');
    } catch (error) {
        console.error('Erro no login com Google:', error);
        showNotification(getAuthErrorMessage(error), 'error');
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        showNotification('Logout realizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro no logout:', error);
        showNotification('Erro ao fazer logout', 'error');
    }
}

// Manipuladores de Perfil
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const name = elements.profileName.value;
    const email = elements.profileEmail.value;
    const phone = elements.profilePhone.value;
    const company = elements.profileCompany.value;
    
    try {
        // Atualizar perfil no Firebase Auth
        await currentUser.updateProfile({
            displayName: name
        });
        
        // Atualizar email se mudou
        if (email !== currentUser.email) {
            await currentUser.updateEmail(email);
        }
        
        // Atualizar dados no Firestore
        await db.collection('users').doc(currentUser.uid).update({
            name: name,
            email: email,
            phone: phone,
            company: company
        });
        
        // Atualizar interface
        updateUserInterface(currentUser, {
            name: name,
            email: email,
            phone: phone,
            company: company
        });
        
        showNotification('Perfil atualizado com sucesso!', 'success');
        closeModal('profileModal');
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        showNotification(getAuthErrorMessage(error), 'error');
    }
}

// Upload e Recorte de Avatar
function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        showNotification('Por favor, selecione uma imagem válida', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        elements.cropImage.src = event.target.result;
        openModal('cropModal');
    };
    reader.readAsDataURL(file);
}

async function handleCropSave() {
    // Implementar lógica de recorte aqui
    // Por simplicidade, vamos apenas fazer upload da imagem original
    
    const file = elements.avatarUpload.files[0];
    if (!file) return;
    
    try {
        // Fazer upload para Firebase Storage
        const storageRef = storage.ref();
        const avatarRef = storageRef.child(`avatars/${currentUser.uid}/${file.name}`);
        const snapshot = await avatarRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        // Atualizar perfil do usuário
        await currentUser.updateProfile({
            photoURL: downloadURL
        });
        
        // Atualizar no Firestore
        await db.collection('users').doc(currentUser.uid).update({
            photoURL: downloadURL
        });
        
        // Atualizar interface
        updateAvatar(currentUser, { photoURL: downloadURL, name: currentUser.displayName });
        
        showNotification('Foto de perfil atualizada com sucesso!', 'success');
        closeModal('cropModal');
    } catch (error) {
        console.error('Erro ao salvar avatar:', error);
        showNotification('Erro ao salvar foto de perfil', 'error');
    }
}

// Resgate de Token
async function handleTokenRedeem(e) {
    e.preventDefault();
    
    const token = elements.tokenInput.value.trim();
    
    if (!token) {
        showNotification('Por favor, insira um token válido', 'error');
        return;
    }
    
    try {
        // Verificar token no Firestore
        const tokenDoc = await db.collection('tokens').doc(token).get();
        
        if (!tokenDoc.exists) {
            showNotification('Token inválido ou expirado', 'error');
            return;
        }
        
        const tokenData = tokenDoc.data();
        
        if (tokenData.used) {
            showNotification('Este token já foi utilizado', 'error');
            return;
        }
        
        if (tokenData.expires && tokenData.expires.toDate() < new Date()) {
            showNotification('Este token expirou', 'error');
            return;
        }
        
        // Atualizar plano do usuário
        await db.collection('users').doc(currentUser.uid).update({
            plan: tokenData.plan,
            planExpires: tokenData.expires
        });
        
        // Marcar token como usado
        await db.collection('tokens').doc(token).update({
            used: true,
            usedBy: currentUser.uid,
            usedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification(`Plano ${tokenData.plan} ativado com sucesso!`, 'success');
        closeModal('tokenModal');
        elements.tokenInput.value = '';
        
        // Recarregar dados do usuário
        await loadUserData(currentUser);
    } catch (error) {
        console.error('Erro ao resgatar token:', error);
        showNotification('Erro ao resgatar token', 'error');
    }
}

// Painel de Administração
function openAdminPanel() {
    // Implementar abertura do painel de admin
    // Por enquanto, apenas uma notificação
    showNotification('Painel de Administração em desenvolvimento', 'info');
}

// Modal de Boas-Vindas
function showWelcomeModal() {
    // Criar modal de boas-vindas dinamicamente
    const welcomeModal = document.createElement('div');
    welcomeModal.className = 'modal-overlay active';
    welcomeModal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Bem-vindo(a) à TDC-Dev!</h3>
            </div>
            <div class="modal-body" style="text-align: center;">
                <div style="width: 80px; height: 80px; background: var(--primary-gradient); border-radius: var(--border-radius); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                    <span class="material-symbols-outlined" style="color: white; font-size: 2.5rem;">celebration</span>
                </div>
                <p style="color: var(--text-light); margin-bottom: 2rem;">
                    Estamos felizes em tê-lo conosco. Transformamos suas ideias em realidade digital...
                </p>
                <div style="margin-bottom: 2rem;">
                    <div style="width: 140px; height: 140px; border: 2px dashed var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; cursor: pointer;">
                        <div style="text-align: center;">
                            <span class="material-symbols-outlined" style="color: var(--primary); font-size: 3rem;">photo_camera</span>
                            <p style="color: var(--primary); margin-top: 0.5rem; font-size: 0.9rem;">Adicione uma foto de perfil</p>
                        </div>
                    </div>
                </div>
                <p style="color: var(--text-light); margin-bottom: 2rem;">Vamos começar personalizando seu perfil...</p>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <button class="btn btn-outline" id="skipProfileBtn">Pular por enquanto</button>
                    <button class="btn btn-primary" id="explorePlatformBtn">Explorar a Plataforma</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(welcomeModal);
    
    // Event listeners para os botões
    welcomeModal.querySelector('#skipProfileBtn').addEventListener('click', () => {
        document.body.removeChild(welcomeModal);
    });
    
    welcomeModal.querySelector('#explorePlatformBtn').addEventListener('click', () => {
        document.body.removeChild(welcomeModal);
        openProfileModal();
    });
    
    // Fechar modal ao clicar fora
    welcomeModal.addEventListener('click', (e) => {
        if (e.target === welcomeModal) {
            document.body.removeChild(welcomeModal);
        }
    });
}

// Utilitários de Interface
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function setupModalCloseListeners() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });
}

function toggleMobileMenu() {
    elements.mobileMenu.classList.toggle('open');
    document.body.style.overflow = elements.mobileMenu.classList.contains('open') ? 'hidden' : 'auto';
}

function closeMobileMenu() {
    elements.mobileMenu.classList.remove('open');
    document.body.style.overflow = 'auto';
}

function toggleUserDropdown() {
    elements.userDropdown.classList.toggle('show');
}

function closeUserDropdown(e) {
    if (!elements.userMenuTrigger.contains(e.target) && !elements.userDropdown.contains(e.target)) {
        elements.userDropdown.classList.remove('show');
    }
}

function openProfileModal() {
    openModal('profileModal');
    elements.userDropdown.classList.remove('show');
}

function openTokenModal() {
    openModal('tokenModal');
    elements.userDropdown.classList.remove('show');
}

// Animações
function initAnimations() {
    // Observador de interseção para animações
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observar elementos com classes de animação
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .zoom-in, .stagger-children');
    animatedElements.forEach(el => observer.observe(el));
}

// Contador de Oferta
function initCountdown() {
    const offerEndDate = new Date();
    offerEndDate.setDate(offerEndDate.getDate() + 3); // 3 dias a partir de agora
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = offerEndDate - now;
        
        if (distance < 0) {
            // Oferta expirada
            elements.days.textContent = '00';
            elements.hours.textContent = '00';
            elements.minutes.textContent = '00';
            elements.seconds.textContent = '00';
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        elements.days.textContent = days.toString().padStart(2, '0');
        elements.hours.textContent = hours.toString().padStart(2, '0');
        elements.minutes.textContent = minutes.toString().padStart(2, '0');
        elements.seconds.textContent = seconds.toString().padStart(2, '0');
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Sistema de Preços
function setupPricing() {
    updatePricing();
}

function updatePricing() {
    const isAnnual = elements.pricingToggle.checked;
    
    if (isAnnual) {
        elements.starterPrice.textContent = 'R$ 79';
        elements.proPrice.textContent = 'R$ 159';
        elements.enterprisePrice.textContent = 'R$ 399';
    } else {
        elements.starterPrice.textContent = 'R$ 99';
        elements.proPrice.textContent = 'R$ 199';
        elements.enterprisePrice.textContent = 'R$ 499';
    }
}

// FAQ
function setupFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Fechar outros itens
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Alternar item atual
            item.classList.toggle('active');
        });
    });
}

// Scroll do Header
function handleHeaderScroll() {
    if (window.scrollY > 100) {
        elements.header.classList.add('scrolled');
    } else {
        elements.header.classList.remove('scrolled');
    }
}

// Sistema de Notificações
function showNotification(message, type = 'info') {
    // Remover notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon material-symbols-outlined">
                ${getNotificationIcon(type)}
            </span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // Estilos da notificação
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-strong);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Animação de entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check_circle';
        case 'error': return 'error';
        case 'warning': return 'warning';
        default: return 'info';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return 'var(--success)';
        case 'error': return 'var(--danger)';
        case 'warning': return 'var(--warning)';
        default: return 'var(--info)';
    }
}

// Utilitários de Erro de Autenticação
function getAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Email inválido';
        case 'auth/user-disabled':
            return 'Esta conta foi desativada';
        case 'auth/user-not-found':
            return 'Usuário não encontrado';
        case 'auth/wrong-password':
            return 'Senha incorreta';
        case 'auth/email-already-in-use':
            return 'Este email já está em uso';
        case 'auth/weak-password':
            return 'A senha é muito fraca';
        case 'auth/network-request-failed':
            return 'Erro de conexão. Verifique sua internet';
        default:
            return 'Erro de autenticação. Tente novamente';
    }
}

// Prevenir Zoom em Dispositivos Móveis
document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Prevenir Seleção de Texto
document.addEventListener('selectstart', function(e) {
    e.preventDefault();
});

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}