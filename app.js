// TDC-Dev - Application JavaScript
// Configurações sensíveis separadas para segurança

class TDCDevApp {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.init();
    }

    init() {
        // Inicializar Firebase
        this.initFirebase();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Verificar estado de autenticação
        this.checkAuthState();
        
        // Esconder loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 1000);
    }

    initFirebase() {
        // Configuração do Firebase - SUAS CONFIGURAÇÕES AQUI
        const firebaseConfig = {
            apiKey: "AIzaSyBwjwP1Ewx4Z2wRS_Xt14B0DRTrM8x6WOg",
            authDomain: "tdc-dev-web.firebaseapp.com",
            projectId: "tdc-dev-web",
            storageBucket: "tdc-dev-web.firebasestorage.app",
            messagingSenderId: "848965120165",
            appId: "1:848965120165:web:0c69411e01f282954e9d4c",
            measurementId: "G-GBK36KBSGB"
        };

        // Inicializar Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Configurações do administrador
        this.ADMIN_EMAIL = "kartywillytdc@gmail.com";
        
        console.log("Firebase inicializado com sucesso!");
    }

    setupEventListeners() {
        // Navegação suave
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
            });
        });

        // Botões de autenticação
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('registerBtn').addEventListener('click', () => this.showRegisterModal());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Modal switches
        document.getElementById('switchToRegister').addEventListener('click', () => {
            this.hideLoginModal();
            this.showRegisterModal();
        });

        document.getElementById('switchToLogin').addEventListener('click', () => {
            this.hideRegisterModal();
            this.showLoginModal();
        });

        // Forms
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));

        // Welcome modal
        document.getElementById('explorePlatform').addEventListener('click', () => this.hideWelcomeModal());
        document.getElementById('skipWelcome').addEventListener('click', () => this.hideWelcomeModal());

        // Admin panel
        document.getElementById('adminPanelLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showAdminPanel();
        });

        document.getElementById('generateTokensBtn').addEventListener('click', () => this.generateTokens());
        document.getElementById('refreshStatsBtn').addEventListener('click', () => this.loadAdminStats());

        // Fechar modais ao clicar fora
        document.addEventListener('click', (e) => {
            if (e.target.id === 'loginModal') this.hideLoginModal();
            if (e.target.id === 'registerModal') this.hideRegisterModal();
            if (e.target.id === 'welcomeModal') this.hideWelcomeModal();
        });

        // CTA Buttons
        document.querySelectorAll('.cta-button').forEach(button => {
            button.addEventListener('click', () => {
                if (!this.currentUser) {
                    this.showLoginModal();
                    this.showToast('Faça login para continuar', 'info');
                } else {
                    this.showToast('Redirecionando para o painel...', 'success');
                }
            });
        });

        // Botões de planos
        document.querySelectorAll('button').forEach(button => {
            if (button.textContent.includes('Quero Este') || 
                button.textContent.includes('Assinar') ||
                button.textContent.includes('Começar')) {
                button.addEventListener('click', (e) => {
                    if (!this.currentUser) {
                        e.preventDefault();
                        this.showLoginModal();
                        this.showToast('Faça login para adquirir um plano', 'info');
                    }
                });
            }
        });
    }

    // Authentication Methods
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            this.showToast('Entrando...', 'info');
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            this.checkAdminStatus();
            this.hideLoginModal();
            this.showToast('Login realizado com sucesso!', 'success');
            this.updateUI();
        } catch (error) {
            console.error('Login error:', error);
            this.showToast(this.getAuthErrorMessage(error), 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        if (password !== confirmPassword) {
            this.showToast('As senhas não coincidem', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToast('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        try {
            this.showToast('Criando conta...', 'info');
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            
            // Atualizar perfil do usuário
            await this.currentUser.updateProfile({
                displayName: name
            });

            // Salvar usuário no Firestore
            await firebase.firestore().collection('users').doc(this.currentUser.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                plan: 'free',
                isActive: true
            });

            this.checkAdminStatus();
            this.hideRegisterModal();
            this.showWelcomeModal();
            this.showToast('Conta criada com sucesso!', 'success');
            this.updateUI();
        } catch (error) {
            console.error('Register error:', error);
            this.showToast(this.getAuthErrorMessage(error), 'error');
        }
    }

    async logout() {
        try {
            await firebase.auth().signOut();
            this.currentUser = null;
            this.isAdmin = false;
            this.updateUI();
            this.hideAdminPanel();
            this.showToast('Logout realizado com sucesso', 'info');
        } catch (error) {
            this.showToast('Erro ao fazer logout', 'error');
        }
    }

    checkAuthState() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.checkAdminStatus();
                this.updateUI();
            } else {
                this.currentUser = null;
                this.isAdmin = false;
                this.updateUI();
            }
        });
    }

    checkAdminStatus() {
        if (this.currentUser && this.currentUser.email === this.ADMIN_EMAIL) {
            this.isAdmin = true;
            this.showToast('Modo administrador ativado', 'success');
        } else {
            this.isAdmin = false;
        }
    }

    // UI Methods
    updateUI() {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const adminPanelLink = document.getElementById('adminPanelLink');

        if (this.currentUser) {
            authButtons.classList.add('hidden');
            userMenu.classList.remove('hidden');
            
            // Atualizar informações do usuário
            document.getElementById('userName').textContent = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            document.getElementById('userAvatar').src = this.currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.currentUser.displayName || this.currentUser.email) + '&background=7f13ec&color=fff';

            // Mostrar link do admin se for administrador
            if (this.isAdmin) {
                adminPanelLink.classList.remove('hidden');
                this.loadAdminStats();
            } else {
                adminPanelLink.classList.add('hidden');
                this.hideAdminPanel();
            }
        } else {
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
            adminPanelLink.classList.add('hidden');
            this.hideAdminPanel();
        }
    }

    // Modal Methods
    showLoginModal() {
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('loginModal').classList.add('flex');
        document.getElementById('loginEmail').focus();
    }

    hideLoginModal() {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('loginModal').classList.remove('flex');
        document.getElementById('loginForm').reset();
    }

    showRegisterModal() {
        document.getElementById('registerModal').classList.remove('hidden');
        document.getElementById('registerModal').classList.add('flex');
        document.getElementById('registerName').focus();
    }

    hideRegisterModal() {
        document.getElementById('registerModal').classList.add('hidden');
        document.getElementById('registerModal').classList.remove('flex');
        document.getElementById('registerForm').reset();
    }

    showWelcomeModal() {
        document.getElementById('welcomeModal').classList.remove('hidden');
        document.getElementById('welcomeModal').classList.add('flex');
    }

    hideWelcomeModal() {
        document.getElementById('welcomeModal').classList.add('hidden');
        document.getElementById('welcomeModal').classList.remove('flex');
    }

    showAdminPanel() {
        document.getElementById('admin').classList.remove('hidden');
        this.scrollToSection('admin');
        this.loadAdminStats();
    }

    hideAdminPanel() {
        document.getElementById('admin').classList.add('hidden');
    }

    // Admin Methods
    async generateTokens() {
        if (!this.isAdmin) {
            this.showToast('Acesso negado. Apenas administradores podem gerar tokens.', 'error');
            return;
        }

        const planType = document.getElementById('tokenPlan').value;
        const quantity = parseInt(document.getElementById('tokenQuantity').value) || 1;

        try {
            this.showToast('Gerando tokens...', 'info');
            const tokens = [];
            
            for (let i = 0; i < quantity; i++) {
                const token = this.generateRandomToken();
                const tokenData = {
                    token: token,
                    plan: planType,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
                    used: false,
                    usedBy: null,
                    usedAt: null,
                    createdBy: this.currentUser.uid
                };

                await firebase.firestore().collection('tokens').doc(token).set(tokenData);
                tokens.push(token);
            }

            // Mostrar tokens gerados
            const tokensContainer = document.getElementById('generatedTokens');
            const tokensCode = tokensContainer.querySelector('code');
            tokensCode.textContent = tokens.join('\n');
            tokensContainer.classList.remove('hidden');

            this.showToast(`${quantity} token(s) gerado(s) com sucesso!`, 'success');
            this.loadAdminStats();
        } catch (error) {
            console.error('Error generating tokens:', error);
            this.showToast('Erro ao gerar tokens', 'error');
        }
    }

    async loadAdminStats() {
        if (!this.isAdmin) return;

        try {
            // Carregar estatísticas de usuários
            const usersSnapshot = await firebase.firestore().collection('users').get();
            document.getElementById('totalUsers').textContent = usersSnapshot.size;

            // Carregar estatísticas de tokens
            const tokensSnapshot = await firebase.firestore().collection('tokens').get();
            document.getElementById('totalTokens').textContent = tokensSnapshot.size;

            const activeTokens = tokensSnapshot.docs.filter(doc => !doc.data().used).length;
            document.getElementById('activeTokens').textContent = activeTokens;

            // Calcular receita (exemplo simplificado)
            const revenue = tokensSnapshot.size * 50; // Exemplo básico
            document.getElementById('revenue').textContent = `R$ ${revenue}`;

            // Carregar lista de tokens
            this.loadTokensList(tokensSnapshot);
        } catch (error) {
            console.error('Error loading admin stats:', error);
        }
    }

    loadTokensList(tokensSnapshot) {
        const tokensList = document.getElementById('tokensList');
        tokensList.innerHTML = '';

        tokensSnapshot.docs.forEach(doc => {
            const tokenData = doc.data();
            const row = document.createElement('tr');
            row.className = 'border-b border-light-gray';

            const statusClass = tokenData.used ? 'text-success' : 'text-warning';
            const statusText = tokenData.used ? 'Usado' : 'Ativo';
            const usedBy = tokenData.usedBy || 'N/A';

            row.innerHTML = `
                <td class="py-3 text-sm font-mono">${doc.id.substring(0, 8)}...</td>
                <td class="py-3 text-sm">${this.getPlanName(tokenData.plan)}</td>
                <td class="py-3 text-sm">${tokenData.createdAt?.toDate().toLocaleDateString('pt-BR') || 'N/A'}</td>
                <td class="py-3 text-sm">${tokenData.expiresAt?.toDate().toLocaleDateString('pt-BR') || 'N/A'}</td>
                <td class="py-3 text-sm ${statusClass}">${statusText}</td>
                <td class="py-3 text-sm">${usedBy}</td>
            `;

            tokensList.appendChild(row);
        });
    }

    getPlanName(planType) {
        const plans = {
            'basic': 'Básico - R$ 50',
            'premium': 'Premium - R$ 100',
            'monthly-basic': 'Mensal Básico',
            'monthly-pro': 'Mensal Pro',
            'monthly-premium': 'Mensal Premium'
        };
        return plans[planType] || planType;
    }

    generateRandomToken() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 16; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }

    // Utility Methods
    scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toastIcon');
        const toastMessage = document.getElementById('toastMessage');

        // Configurar ícone baseado no tipo
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };

        const colors = {
            success: 'text-success',
            error: 'text-danger',
            warning: 'text-warning',
            info: 'text-primary'
        };

        toastIcon.textContent = icons[type];
        toastIcon.className = `material-symbols-outlined ${colors[type]}`;
        toastMessage.textContent = message;

        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }

    getAuthErrorMessage(error) {
        const errorMessages = {
            'auth/invalid-email': 'Email inválido',
            'auth/user-disabled': 'Esta conta foi desativada',
            'auth/user-not-found': 'Usuário não encontrado',
            'auth/wrong-password': 'Senha incorreta',
            'auth/email-already-in-use': 'Este email já está em uso',
            'auth/weak-password': 'A senha é muito fraca (mínimo 6 caracteres)',
            'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
            'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.'
        };

        return errorMessages[error.code] || 'Erro desconhecido. Tente novamente.';
    }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.tdcApp = new TDCDevApp();
});

// Smooth scrolling para todas as âncoras
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
