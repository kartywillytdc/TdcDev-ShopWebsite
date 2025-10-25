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
        // Configuração do Firebase - Mantenha estas informações em segredo
        const firebaseConfig = {
            apiKey: "SUA_API_KEY_AQUI",
            authDomain: "tdc-dev-site.firebaseapp.com",
            projectId: "tdc-dev-site",
            storageBucket: "tdc-dev-site.appspot.com",
            messagingSenderId: "123456789",
            appId: "1:123456789:web:abcdef123456"
        };

        // Inicializar Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Configurações do administrador
        this.ADMIN_EMAIL = "kartywillytdc@gmail.com";
    }

    setupEventListeners() {
        // Navegação
        document.querySelectorAll('nav a').forEach(link => {
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

        // Fechar modais ao clicar fora
        document.addEventListener('click', (e) => {
            if (e.target.id === 'loginModal') this.hideLoginModal();
            if (e.target.id === 'registerModal') this.hideRegisterModal();
            if (e.target.id === 'welcomeModal') this.hideWelcomeModal();
        });

        // CTA Buttons
        document.querySelectorAll('button').forEach(button => {
            if (button.textContent.includes('Começar Agora') || 
                button.textContent.includes('Ver Planos') ||
                button.textContent.includes('Quero Este') ||
                button.textContent.includes('Assinar')) {
                button.addEventListener('click', () => {
                    if (!this.currentUser) {
                        this.showLoginModal();
                        this.showToast('Faça login para continuar', 'info');
                    }
                });
            }
        });
    }

    // Authentication Methods
    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            this.checkAdminStatus();
            this.hideLoginModal();
            this.showToast('Login realizado com sucesso!', 'success');
            this.updateUI();
        } catch (error) {
            this.showToast(this.getAuthErrorMessage(error), 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (password !== confirmPassword) {
            this.showToast('As senhas não coincidem', 'error');
            return;
        }

        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            
            // Salvar nome do usuário no Firestore
            await firebase.firestore().collection('users').doc(this.currentUser.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                plan: 'free'
            });

            this.checkAdminStatus();
            this.hideRegisterModal();
            this.showWelcomeModal();
            this.showToast('Conta criada com sucesso!', 'success');
            this.updateUI();
        } catch (error) {
            this.showToast(this.getAuthErrorMessage(error), 'error');
        }
    }

    async logout() {
        try {
            await firebase.auth().signOut();
            this.currentUser = null;
            this.isAdmin = false;
            this.updateUI();
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
            document.getElementById('userAvatar').src = this.currentUser.photoURL || 'https://via.placeholder.com/32';

            // Mostrar link do admin se for administrador
            if (this.isAdmin) {
                adminPanelLink.classList.remove('hidden');
            } else {
                adminPanelLink.classList.add('hidden');
            }
        } else {
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
            adminPanelLink.classList.add('hidden');
        }
    }

    // Modal Methods
    showLoginModal() {
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('loginModal').classList.add('flex');
    }

    hideLoginModal() {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('loginModal').classList.remove('flex');
    }

    showRegisterModal() {
        document.getElementById('registerModal').classList.remove('hidden');
        document.getElementById('registerModal').classList.add('flex');
    }

    hideRegisterModal() {
        document.getElementById('registerModal').classList.add('hidden');
        document.getElementById('registerModal').classList.remove('flex');
    }

    showWelcomeModal() {
        document.getElementById('welcomeModal').classList.remove('hidden');
        document.getElementById('welcomeModal').classList.add('flex');
    }

    hideWelcomeModal() {
        document.getElementById('welcomeModal').classList.add('hidden');
        document.getElementById('welcomeModal').classList.remove('flex');
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
        }, 3000);
    }

    getAuthErrorMessage(error) {
        const errorMessages = {
            'auth/invalid-email': 'Email inválido',
            'auth/user-disabled': 'Esta conta foi desativada',
            'auth/user-not-found': 'Usuário não encontrado',
            'auth/wrong-password': 'Senha incorreta',
            'auth/email-already-in-use': 'Este email já está em uso',
            'auth/weak-password': 'A senha é muito fraca',
            'auth/network-request-failed': 'Erro de conexão'
        };

        return errorMessages[error.code] || 'Erro desconhecido. Tente novamente.';
    }

    // Admin Methods
    async generateToken(planType) {
        if (!this.isAdmin) {
            this.showToast('Acesso negado. Apenas administradores podem gerar tokens.', 'error');
            return;
        }

        try {
            const token = this.generateRandomToken();
            const tokenData = {
                token: token,
                plan: planType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
                used: false,
                usedBy: null,
                usedAt: null
            };

            await firebase.firestore().collection('tokens').doc(token).set(tokenData);
            this.showToast(`Token ${planType} gerado: ${token}`, 'success');
            return token;
        } catch (error) {
            this.showToast('Erro ao gerar token', 'error');
        }
    }

    generateRandomToken() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    async validateToken(token) {
        try {
            const tokenDoc = await firebase.firestore().collection('tokens').doc(token).get();
            
            if (!tokenDoc.exists) {
                return { valid: false, message: 'Token inválido' };
            }

            const tokenData = tokenDoc.data();
            
            if (tokenData.used) {
                return { valid: false, message: 'Token já utilizado' };
            }

            if (tokenData.expiresAt.toDate() < new Date()) {
                return { valid: false, message: 'Token expirado' };
            }

            return { 
                valid: true, 
                message: 'Token válido',
                plan: tokenData.plan,
                data: tokenData
            };
        } catch (error) {
            return { valid: false, message: 'Erro ao validar token' };
        }
    }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.tdcApp = new TDCDevApp();
});

// Smooth scrolling para âncoras
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