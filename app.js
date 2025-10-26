// app.js - Configurações sensíveis separadas

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBwjwP1Ewx4Z2wRS_Xt14B0DRTrM8x6WOg",
    authDomain: "tdc-dev-web.firebaseapp.com",
    projectId: "tdc-dev-web",
    storageBucket: "tdc-dev-web.firebasestorage.app",
    messagingSenderId: "848965120165",
    appId: "1:848965120165:web:0c69411e01f282954e9d4c",
    measurementId: "G-GBK36KBSGB"
};

// Email do administrador
const ADMIN_EMAIL = "kartywillytdc@gmail.com";

// Inicialização do Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Estado da aplicação
let currentUser = null;
let isAdmin = false;

// Dados do site
const siteData = {
    name: "TDC-Dev",
    description: "Transformando Ideias em Realidade Digital",
    plans: {
        basic: {
            name: "Básico",
            price: 149.90,
            features: [
                "Site estático HTML/CSS/JS",
                "Design responsivo",
                "4 seções personalizáveis"
            ]
        },
        pro: {
            name: "Pro",
            price: 299.90,
            features: [
                "Design totalmente personalizado",
                "Layout único",
                "6-8 seções",
                "Suporte prioritário por chat"
            ]
        },
        premium: {
            name: "Premium",
            price: 499.90,
            features: [
                "Sistema completo de login",
                "Banco de dados Firebase",
                "Painel administrativo",
                "Suporte 24/7"
            ]
        }
    },
    offers: {
        basic: {
            name: "SITE BÁSICO",
            price: 50,
            features: [
                "Domínio Personalizado",
                "Hospedagem Inclusa",
                "Design Responsivo"
            ]
        },
        premium: {
            name: "SITE PREMIUM",
            price: 100,
            features: [
                "Domínio Personalizado",
                "Hospedagem Inclusa",
                "Design Responsivo",
                "SEO Avançado",
                "Suporte Prioritário"
            ]
        }
    }
};

// Funções de UI
function showLoading() {
    document.body.classList.add('loading');
}

function hideLoading() {
    document.body.classList.remove('loading');
}

function showNotification(message, type = 'success') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#F59E0B'};
        color: white;
        border-radius: 0.5rem;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        max-width: 400px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Verificar estado de autenticação
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            isAdmin = user.email === ADMIN_EMAIL;
            updateUI();
            showNotification('Login realizado com sucesso!', 'success');
            
            if (isAdmin) {
                showNotification('Bem-vindo, Administrador!', 'success');
                loadAdminPanel();
            }
        } else {
            isAdmin = false;
            updateUI();
        }
    });
}

// Atualizar UI baseada no estado de autenticação
function updateUI() {
    const adminPanel = document.getElementById('adminPanel');
    const publicWebsite = document.getElementById('publicWebsite');
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userEmail = document.getElementById('userEmail');

    if (currentUser) {
        // Usuário logado
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        userEmail.textContent = currentUser.email;
        
        if (isAdmin) {
            // Mostrar painel admin
            adminPanel.style.display = 'block';
            publicWebsite.style.display = 'none';
        } else {
            // Mostrar website público
            adminPanel.style.display = 'none';
            publicWebsite.style.display = 'block';
        }
    } else {
        // Usuário não logado
        adminPanel.style.display = 'none';
        publicWebsite.style.display = 'block';
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

// Login com Email/Senha
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();

    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    const loginSpinner = document.getElementById('loginSpinner');

    loginSpinner.style.display = 'inline-block';

    try {
        await auth.signInWithEmailAndPassword(email, password);
        closeModal('loginModal');
    } catch (error) {
        let errorMessage = 'Erro no login. Tente novamente.';
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Email inválido. Verifique o formato.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Esta conta foi desativada.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'Nenhuma conta encontrada com este email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Senha incorreta. Tente novamente.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
                break;
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        hideLoading();
        loginSpinner.style.display = 'none';
    }
});

// Registro com Email/Senha
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();

    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelectorAll('input[type="password"]')[0].value;
    const confirmPassword = e.target.querySelectorAll('input[type="password"]')[1].value;
    const registerSpinner = document.getElementById('registerSpinner');

    if (password !== confirmPassword) {
        showNotification('As senhas não coincidem!', 'error');
        hideLoading();
        return;
    }

    if (password.length < 6) {
        showNotification('A senha deve ter pelo menos 6 caracteres!', 'error');
        hideLoading();
        return;
    }

    registerSpinner.style.display = 'inline-block';

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Salvar informações adicionais do usuário
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            plan: 'free',
            isAdmin: email === ADMIN_EMAIL
        });

        closeModal('registerModal');
        showNotification('Conta criada com sucesso! Bem-vindo à TDC-Dev!', 'success');
    } catch (error) {
        let errorMessage = 'Erro no registro. Tente novamente.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este email já está em uso.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido. Verifique o formato.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Operação não permitida.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
                break;
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        hideLoading();
        registerSpinner.style.display = 'none';
    }
});

// Login com Google
async function signInWithGoogle() {
    showLoading();
    
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Verificar se é a primeira vez que o usuário faz login
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Salvar informações do usuário no Firestore
            await db.collection('users').doc(user.uid).set({
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                plan: 'free',
                isAdmin: user.email === ADMIN_EMAIL
            });
        }
        
        closeModal('loginModal');
        showNotification('Login com Google realizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro no login com Google:', error);
        showNotification('Erro no login com Google. Tente novamente.', 'error');
    } finally {
        hideLoading();
    }
}

// Logout
async function logout() {
    showLoading();
    try {
        await auth.signOut();
        showNotification('Logout realizado com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro no logout: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Sistema de Tokens (Admin)
async function generateToken(planType, duration, price) {
    if (!isAdmin) {
        showNotification('Acesso negado! Apenas administradores podem gerar tokens.', 'error');
        return;
    }

    showLoading();

    try {
        const token = 'TDC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const expires = new Date();
        
        // Definir data de expiração baseada na duração
        switch(duration) {
            case 'monthly':
                expires.setMonth(expires.getMonth() + 1);
                break;
            case 'semiannual':
                expires.setMonth(expires.getMonth() + 6);
                break;
            case 'annual':
                expires.setFullYear(expires.getFullYear() + 1);
                break;
            default:
                expires.setMonth(expires.getMonth() + 1);
        }

        await db.collection('tokens').doc(token).set({
            plan: planType,
            duration: duration,
            price: price,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            expires: expires,
            used: false
        });

        showNotification(`Token ${planType} gerado: ${token}`, 'success');
        
        // Copiar para área de transferência
        navigator.clipboard.writeText(token);
        showNotification('Token copiado para área de transferência!', 'success');

    } catch (error) {
        showNotification('Erro ao gerar token: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Resgatar Token (Usuário)
async function redeemToken(token) {
    if (!currentUser) {
        showNotification('Você precisa estar logado para resgatar um token!', 'error');
        openModal('loginModal');
        return;
    }

    showLoading();

    try {
        const tokenDoc = await db.collection('tokens').doc(token).get();
        
        if (!tokenDoc.exists) {
            showNotification('Token inválido ou expirado!', 'error');
            return;
        }

        const tokenData = tokenDoc.data();

        if (tokenData.used) {
            showNotification('Este token já foi utilizado!', 'error');
            return;
        }

        if (tokenData.expires && tokenData.expires.toDate() < new Date()) {
            showNotification('Token expirado!', 'error');
            return;
        }

        // Ativar plano do usuário
        await db.collection('users').doc(currentUser.uid).update({
            plan: tokenData.plan,
            planActivated: firebase.firestore.FieldValue.serverTimestamp(),
            planExpires: tokenData.expires
        });

        // Marcar token como usado
        await db.collection('tokens').doc(token).update({
            used: true,
            usedBy: currentUser.uid,
            usedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showNotification(`Plano ${tokenData.plan} ativado com sucesso!`, 'success');
        closeModal('redeemTokenModal');

    } catch (error) {
        showNotification('Erro ao resgatar token: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Funções de Modal
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Mobile Menu
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('open');
}

// Scroll to Section
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
    toggleMobileMenu();
}

// UI Functions para o site público
function showOfferPopup(offerType) {
    if (!currentUser) {
        showNotification('Você precisa estar logado para adquirir uma oferta!', 'error');
        openModal('loginModal');
        return;
    }
    
    showNotification(`Interesse registrado na oferta ${offerType}! Entraremos em contato em breve.`, 'success');
}

function showPlanPopup(planType) {
    if (!currentUser) {
        showNotification('Você precisa estar logado para assinar um plano!', 'error');
        openModal('loginModal');
        return;
    }
    
    showNotification(`Interesse registrado no plano ${planType}! Iremos te redirecionar para a página de pagamento.`, 'success');
}

function joinDiscord() {
    showNotification('Redirecionando para o Discord...', 'success');
    setTimeout(() => {
        window.open('https://discord.gg/tdcdev', '_blank');
    }, 1000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.getElementById('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
    
    // Adicionar CSS para animação da notificação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});

// Carregar Painel Administrativo
function loadAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    
    adminPanel.innerHTML = `
        <div class="admin-container">
            <!-- Sidebar -->
            <div class="admin-sidebar">
                <div class="admin-logo">
                    <div class="logo-icon">TD</div>
                    <div>
                        <div style="color: var(--white); font-weight: 600; font-size: 1.2rem;">Admin Panel</div>
                        <div style="color: var(--text-light); font-size: 0.9rem;">TDC-Dev</div>
                    </div>
                </div>

                <nav class="admin-nav">
                    <a class="admin-nav-item active" onclick="showAdminTab('dashboard')">
                        <span class="material-symbols-outlined">dashboard</span>
                        Dashboard
                    </a>
                    <a class="admin-nav-item" onclick="showAdminTab('tokens')">
                        <span class="material-symbols-outlined">key</span>
                        Gerenciar Tokens
                    </a>
                    <a class="admin-nav-item" onclick="showAdminTab('users')">
                        <span class="material-symbols-outlined">group</span>
                        Gerenciar Usuários
                    </a>
                    <a class="admin-nav-item" onclick="showAdminTab('pricing')">
                        <span class="material-symbols-outlined">sell</span>
                        Configurar Preços
                    </a>
                    <a class="admin-nav-item" onclick="showAdminTab('analytics')">
                        <span class="material-symbols-outlined">analytics</span>
                        Analytics
                    </a>
                    <a class="admin-nav-item" onclick="showAdminTab('settings')">
                        <span class="material-symbols-outlined">settings</span>
                        Configurações
                    </a>
                </nav>

                <div class="admin-nav">
                    <a class="admin-nav-item" onclick="logout()">
                        <span class="material-symbols-outlined">logout</span>
                        Sair
                    </a>
                </div>
            </div>

            <!-- Main Content -->
            <div class="admin-main">
                <div class="admin-header">
                    <h1 style="font-size: 2.5rem; font-weight: 700; color: var(--white);">Painel Administrativo</h1>
                    <div style="display: flex; align-items: center; gap: 1.5rem;">
                        <button class="btn btn-outline" onclick="openModal('adminProfileModal')">
                            <span class="material-symbols-outlined">person</span>
                            Meu Perfil
                        </button>
                        <span id="adminUserEmail" style="color: var(--text-light);">${currentUser.email}</span>
                    </div>
                </div>

                <!-- Stats -->
                <div class="admin-stats">
                    <div class="stat-card">
                        <div class="stat-value">1,428</div>
                        <div class="stat-label">Total Usuários</div>
                        <div class="stat-change positive">+2.5%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">972</div>
                        <div class="stat-label">Tokens Ativos</div>
                        <div class="stat-change positive">+1.8%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">R$ 15,830</div>
                        <div class="stat-label">Faturamento (Mês)</div>
                        <div class="stat-change negative">-0.5%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">342</div>
                        <div class="stat-label">Projetos Ativos</div>
                        <div class="stat-change positive">+3.2%</div>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="admin-tabs">
                    <div class="admin-tab active" onclick="showAdminTab('dashboard')">Dashboard</div>
                    <div class="admin-tab" onclick="showAdminTab('tokens')">Tokens</div>
                    <div class="admin-tab" onclick="showAdminTab('users')">Usuários</div>
                    <div class="admin-tab" onclick="showAdminTab('pricing')">Preços</div>
                    <div class="admin-tab" onclick="showAdminTab('analytics')">Analytics</div>
                    <div class="admin-tab" onclick="showAdminTab('settings')">Configurações</div>
                </div>

                <!-- Conteúdo será carregado dinamicamente -->
                <div id="adminContent"></div>
            </div>
        </div>
    `;

    // Carregar conteúdo inicial
    showAdminTab('dashboard');
}

// Funções do Admin Panel
function showAdminTab(tabName) {
    // Atualizar navegação
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`.admin-nav-item[onclick="showAdminTab('${tabName}')"]`).classList.add('active');
    document.querySelector(`.admin-tab[onclick="showAdminTab('${tabName}')"]`).classList.add('active');

    // Carregar conteúdo da aba
    const adminContent = document.getElementById('adminContent');
    
    switch(tabName) {
        case 'dashboard':
            loadDashboardContent();
            break;
        case 'tokens':
            loadTokensContent();
            break;
        case 'users':
            loadUsersContent();
            break;
        case 'pricing':
            loadPricingContent();
            break;
        case 'analytics':
            loadAnalyticsContent();
            break;
        case 'settings':
            loadSettingsContent();
            break;
    }
}

function loadDashboardContent() {
    const adminContent = document.getElementById('adminContent');
    adminContent.innerHTML = `
        <div class="admin-content active">
            <h2 style="font-size: 1.8rem; font-weight: 600; margin-bottom: 1.5rem; color: var(--white);">
                Visão Geral
            </h2>
            
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-top: 2rem;">
                <div class="stat-card">
                    <h3 style="margin-bottom: 1.5rem; color: var(--white);">Atividade Recente</h3>
                    <div style="margin-top: 1rem;">
                        <div style="display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid var(--glass-border);">
                            <span>Novo usuário registrado</span>
                            <span style="color: var(--text-light);">2 min atrás</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid var(--glass-border);">
                            <span>Token premium gerado</span>
                            <span style="color: var(--text-light);">1 hora atrás</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid var(--glass-border);">
                            <span>Projeto "Loja Virtual" concluído</span>
                            <span style="color: var(--text-light);">3 horas atrás</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 1rem 0;">
                            <span>Novo pedido recebido</span>
                            <span style="color: var(--text-light);">5 horas atrás</span>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <h3 style="margin-bottom: 1.5rem; color: var(--white);">Status do Sistema</h3>
                    <div style="margin-top: 1rem;">
                        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0;">
                            <span>Servidor Web</span>
                            <span style="color: var(--success); display: flex; align-items: center; gap: 0.5rem;">
                                <span style="width: 10px; height: 10px; background: var(--success); border-radius: 50%;"></span>
                                Online
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0;">
                            <span>Banco de Dados</span>
                            <span style="color: var(--success); display: flex; align-items: center; gap: 0.5rem;">
                                <span style="width: 10px; height: 10px; background: var(--success); border-radius: 50%;"></span>
                                Online
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0;">
                            <span>API Firebase</span>
                            <span style="color: var(--success); display: flex; align-items: center; gap: 0.5rem;">
                                <span style="width: 10px; height: 10px; background: var(--success); border-radius: 50%;"></span>
                                Online
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0;">
                            <span>Serviço de Email</span>
                            <span style="color: var(--success); display: flex; align-items: center; gap: 0.5rem;">
                                <span style="width: 10px; height: 10px; background: var(--success); border-radius: 50%;"></span>
                                Online
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// As outras funções de carregamento de conteúdo (loadTokensContent, loadUsersContent, etc.)
// seriam implementadas de forma similar...

// Inicializar selects customizados
function initializeCustomSelects() {
    const customSelects = document.querySelectorAll('.custom-select');
    
    customSelects.forEach(select => {
        const selected = select.querySelector('.select-selected');
        const items = select.querySelector('.select-items');
        const originalSelect = select.querySelector('select');
        
        selected.addEventListener('click', function(e) {
            e.stopPropagation();
            closeAllSelect(this);
            this.nextElementSibling.classList.toggle('select-hide');
            this.classList.toggle('select-arrow-active');
        });
        
        // Adicionar opções
        Array.from(originalSelect.options).forEach(option => {
            const div = document.createElement('div');
            div.innerHTML = option.text;
            div.addEventListener('click', function(e) {
                originalSelect.value = option.value;
                selected.innerHTML = this.innerHTML;
                closeAllSelect(this);
            });
            items.appendChild(div);
        });
    });
    
    // Fechar selects quando clicar fora
    document.addEventListener('click', closeAllSelect);
}

function closeAllSelect(elmnt) {
    const items = document.getElementsByClassName("select-items");
    const selected = document.getElementsByClassName("select-selected");
    
    for (let i = 0; i < selected.length; i++) {
        if (elmnt !== selected[i]) {
            selected[i].classList.remove("select-arrow-active");
        }
    }
    
    for (let i = 0; i < items.length; i++) {
        if (elmnt !== items[i]) {
            items[i].classList.add("select-hide");
        }
    }
}
