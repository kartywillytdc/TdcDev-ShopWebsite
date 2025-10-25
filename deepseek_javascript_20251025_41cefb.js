// TDC-Dev - Application JavaScript
class TDCDevApp {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.userData = null;
        this.init();
    }

    init() {
        // Inicializar Firebase
        this.initFirebase();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Verificar estado de autenticação
        this.checkAuthState();
        
        // Carregar reviews
        this.loadReviews();
        
        // Esconder loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 1000);
    }

    initFirebase() {
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

        // Inicializar Firebase
        try {
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase inicializado com sucesso!");
        } catch (error) {
            console.error("Erro ao inicializar Firebase:", error);
        }
        
        // Configurações do administrador
        this.ADMIN_EMAIL = "kartywillytdc@gmail.com";
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

        // Mobile menu
        document.getElementById('mobileMenuButton').addEventListener('click', () => this.toggleMobileMenu());
        
        // Fechar mobile menu ao clicar em um link
        document.querySelectorAll('#mobileMenu .nav-link').forEach(link => {
            link.addEventListener('click', () => this.closeMobileMenu());
        });

        // Botões de autenticação
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('registerBtn').addEventListener('click', () => this.showRegisterModal());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Mobile auth buttons
        document.getElementById('mobileLoginBtn').addEventListener('click', () => {
            this.closeMobileMenu();
            this.showLoginModal();
        });
        document.getElementById('mobileRegisterBtn').addEventListener('click', () => {
            this.closeMobileMenu();
            this.showRegisterModal();
        });
        document.getElementById('mobileLogoutBtn').addEventListener('click', () => {
            this.closeMobileMenu();
            this.logout();
        });

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

        // Google auth
        document.getElementById('googleLoginBtn').addEventListener('click', () => this.handleGoogleLogin());
        document.getElementById('googleRegisterBtn').addEventListener('click', () => this.handleGoogleLogin());

        // Welcome modal
        document.getElementById('explorePlatform').addEventListener('click', () => this.hideWelcomeModal());
        document.getElementById('skipWelcome').addEventListener('click', () => this.hideWelcomeModal());

        // Profile
        document.getElementById('profileLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showProfile();
        });
        document.getElementById('mobileProfileLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showProfile();
        });
        document.getElementById('updateProfileBtn').addEventListener('click', () => this.updateProfile());

        // Reviews
        document.getElementById('addReviewBtn').addEventListener('click', () => this.showAddReviewModal());
        document.getElementById('cancelReview').addEventListener('click', () => this.hideAddReviewModal());
        document.getElementById('reviewForm').addEventListener('submit', (e) => this.handleAddReview(e));
        
        // Star rating
        document.querySelectorAll('#starRating span').forEach(star => {
            star.addEventListener('click', () => this.setStarRating(parseInt(star.dataset.rating)));
        });

        // Token redemption
        document.getElementById('redeemTokenBtn').addEventListener('click', () => this.redeemToken());

        // Fechar modais ao clicar fora
        document.addEventListener('click', (e) => {
            if (e.target.id === 'loginModal') this.hideLoginModal();
            if (e.target.id === 'registerModal') this.hideRegisterModal();
            if (e.target.id === 'welcomeModal') this.hideWelcomeModal();
            if (e.target.id === 'addReviewModal') this.hideAddReviewModal();
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

    // Mobile Menu Methods
    toggleMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        menu.classList.toggle('open');
    }

    closeMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        menu.classList.remove('open');
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
            await this.loadUserData();
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
            await this.saveUserData({
                name: name,
                email: email,
                plan: 'free',
                isActive: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await this.loadUserData();
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

    async handleGoogleLogin() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await firebase.auth().signInWithPopup(provider);
            this.currentUser = result.user;
            
            // Verificar se é a primeira vez que o usuário faz login
            const userDoc = await firebase.firestore().collection('users').doc(this.currentUser.uid).get();
            
            if (!userDoc.exists) {
                // Primeiro login - salvar dados do usuário
                await this.saveUserData({
                    name: this.currentUser.displayName,
                    email: this.currentUser.email,
                    plan: 'free',
                    isActive: true,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            await this.loadUserData();
            this.checkAdminStatus();
            this.hideLoginModal();
            this.hideRegisterModal();
            this.showToast('Login com Google realizado com sucesso!', 'success');
            this.updateUI();
        } catch (error) {
            console.error('Google login error:', error);
            this.showToast('Erro ao fazer login com Google', 'error');
        }
    }

    async logout() {
        try {
            await firebase.auth().signOut();
            this.currentUser = null;
            this.userData = null;
            this.isAdmin = false;
            this.updateUI();
            this.hideProfile();
            this.showToast('Logout realizado com sucesso', 'info');
        } catch (error) {
            this.showToast('Erro ao fazer logout', 'error');
        }
    }

    async saveUserData(userData) {
        try {
            await firebase.firestore().collection('users').doc(this.currentUser.uid).set(userData, { merge: true });
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    async loadUserData() {
        if (!this.currentUser) return;
        
        try {
            const userDoc = await firebase.firestore().collection('users').doc(this.currentUser.uid).get();
            if (userDoc.exists) {
                this.userData = userDoc.data();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    checkAuthState() {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserData();
                this.checkAdminStatus();
                this.updateUI();
            } else {
                this.currentUser = null;
                this.userData = null;
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
        const profileLink = document.getElementById('profileLink');
        const mobileAuthButtons = document.getElementById('mobileAuthButtons');
        const mobileUserMenu = document.getElementById('mobileUserMenu');
        const addReviewBtn = document.getElementById('addReviewBtn');

        if (this.currentUser) {
            // Desktop UI
            authButtons.classList.add('hidden');
            userMenu.classList.remove('hidden');
            profileLink.classList.remove('hidden');
            
            // Mobile UI
            mobileAuthButtons.classList.add('hidden');
            mobileUserMenu.classList.remove('hidden');

            // Atualizar informações do usuário
            const displayName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            document.getElementById('userName').textContent = displayName;
            document.getElementById('userAvatar').src = this.currentUser.photoURL || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7f13ec&color=fff`;

            // Mobile user info
            document.getElementById('mobileProfileLink').textContent = displayName;

            // Mostrar link do admin se for administrador
            if (this.isAdmin) {
                adminPanelLink.classList.remove('hidden');
                document.getElementById('mobileAdminLink').classList.remove('hidden');
            } else {
                adminPanelLink.classList.add('hidden');
                document.getElementById('mobileAdminLink').classList.add('hidden');
            }

            // Mostrar botão de adicionar review se o usuário tiver assinatura paga
            if (this.userData && this.userData.plan !== 'free') {
                addReviewBtn.classList.remove('hidden');
            } else {
                addReviewBtn.classList.add('hidden');
            }

            // Atualizar perfil se visível
            if (!document.getElementById('profile').classList.contains('hidden')) {
                this.updateProfileUI();
            }
        } else {
            // Desktop UI
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
            adminPanelLink.classList.add('hidden');
            profileLink.classList.add('hidden');
            
            // Mobile UI
            mobileAuthButtons.classList.remove('hidden');
            mobileUserMenu.classList.add('hidden');
            
            addReviewBtn.classList.add('hidden');
            this.hideProfile();
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

    showProfile() {
        document.getElementById('profile').classList.remove('hidden');
        this.scrollToSection('profile');
        this.updateProfileUI();
    }

    hideProfile() {
        document.getElementById('profile').classList.add('hidden');
    }

    updateProfileUI() {
        if (this.currentUser && this.userData) {
            document.getElementById('profileName').textContent = this.currentUser.displayName || 'Usuário';
            document.getElementById('profileEmail').textContent = this.currentUser.email;
            document.getElementById('profileNameInput').value = this.currentUser.displayName || '';
            document.getElementById('profileEmailInput').value = this.currentUser.email;
            document.getElementById('profileAvatar').src = this.currentUser.photoURL || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.displayName || this.currentUser.email)}&background=7f13ec&color=fff`;
            
            // Atualizar informações da assinatura
            document.getElementById('currentPlan').textContent = this.userData.plan === 'free' ? 'Free' : this.userData.plan;
            document.getElementById('planStatus').textContent = this.userData.isActive ? 'Ativo' : 'Inativo';
            document.getElementById('planStatus').className = this.userData.isActive ? 
                'text-lg font-medium text-success' : 'text-lg font-medium text-danger';
        }
    }

    async updateProfile() {
        const name = document.getElementById('profileNameInput').value;
        const email = document.getElementById('profileEmailInput').value;

        try {
            // Atualizar perfil no Firebase Auth
            await this.currentUser.updateProfile({
                displayName: name
            });

            // Atualizar email se mudou
            if (email !== this.currentUser.email) {
                await this.currentUser.updateEmail(email);
            }

            // Atualizar no Firestore
            await this.saveUserData({
                name: name,
                email: email
            });

            await this.loadUserData();
            this.updateProfileUI();
            this.updateUI();
            this.showToast('Perfil atualizado com sucesso!', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showToast('Erro ao atualizar perfil', 'error');
        }
    }

    // Reviews Methods
    async loadReviews() {
        try {
            const reviewsSnapshot = await firebase.firestore().collection('reviews')
                .orderBy('createdAt', 'desc')
                .get();
            
            this.displayReviews(reviewsSnapshot);
            this.updateReviewStats(reviewsSnapshot);
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    }

    displayReviews(reviewsSnapshot) {
        const reviewsList = document.getElementById('reviewsList');
        reviewsList.innerHTML = '';

        if (reviewsSnapshot.empty) {
            reviewsList.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <span class="material-symbols-outlined text-6xl text-text-light mb-4">reviews</span>
                    <p class="text-text-light text-lg">Seja o primeiro a avaliar!</p>
                </div>
            `;
            return;
        }

        reviewsSnapshot.docs.forEach(doc => {
            const review = doc.data();
            const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            
            const reviewElement = document.createElement('div');
            reviewElement.className = 'glass-effect rounded-xl p-6 animate-fade-in';
            reviewElement.innerHTML = `
                <div class="flex items-center gap-3 mb-4">
                    <img src="${review.userAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.userName) + '&background=7f13ec&color=fff'}" 
                         class="w-10 h-10 rounded-full">
                    <div>
                        <h4 class="font-bold text-white">${review.userName}</h4>
                        <div class="text-yellow-400">${stars}</div>
                    </div>
                </div>
                <p class="text-text-light mb-4">${review.comment}</p>
                ${review.website ? `<a href="${review.website}" target="_blank" class="text-primary hover:underline text-sm">Ver site</a>` : ''}
                <div class="text-xs text-text-light mt-3">${review.createdAt?.toDate().toLocaleDateString('pt-BR')}</div>
            `;
            
            reviewsList.appendChild(reviewElement);
        });
    }

    updateReviewStats(reviewsSnapshot) {
        if (reviewsSnapshot.empty) {
            document.getElementById('totalReviews').textContent = '0';
            document.getElementById('averageRating').textContent = '0.0';
            document.getElementById('fiveStarReviews').textContent = '0';
            return;
        }

        let totalRating = 0;
        let fiveStarCount = 0;

        reviewsSnapshot.docs.forEach(doc => {
            const review = doc.data();
            totalRating += review.rating;
            if (review.rating === 5) fiveStarCount++;
        });

        const averageRating = (totalRating / reviewsSnapshot.size).toFixed(1);

        document.getElementById('totalReviews').textContent = reviewsSnapshot.size;
        document.getElementById('averageRating').textContent = averageRating;
        document.getElementById('fiveStarReviews').textContent = fiveStarCount;
    }

    showAddReviewModal() {
        if (!this.currentUser) {
            this.showToast('Faça login para adicionar uma avaliação', 'info');
            return;
        }

        if (this.userData.plan === 'free') {
            this.showToast('Você precisa de uma assinatura paga para avaliar', 'warning');
            return;
        }

        document.getElementById('addReviewModal').classList.remove('hidden');
        document.getElementById('addReviewModal').classList.add('flex');
        this.setStarRating(5); // Default rating
    }

    hideAddReviewModal() {
        document.getElementById('addReviewModal').classList.add('hidden');
        document.getElementById('addReviewModal').classList.remove('flex');
        document.getElementById('reviewForm').reset();
    }

    setStarRating(rating) {
        document.getElementById('reviewRating').value = rating;
        
        const stars = document.querySelectorAll('#starRating span');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.textContent = 'star';
                star.classList.add('text-yellow-400');
                star.classList.remove('text-text-light');
            } else {
                star.textContent = 'star';
                star.classList.remove('text-yellow-400');
                star.classList.add('text-text-light');
            }
        });
    }

    async handleAddReview(e) {
        e.preventDefault();
        
        const rating = parseInt(document.getElementById('reviewRating').value);
        const comment = document.getElementById('reviewComment').value;
        const website = document.getElementById('reviewWebsite').value;

        if (!comment.trim()) {
            this.showToast('Por favor, escreva um comentário', 'warning');
            return;
        }

        try {
            const reviewData = {
                userId: this.currentUser.uid,
                userName: this.currentUser.displayName || this.currentUser.email.split('@')[0],
                userAvatar: this.currentUser.photoURL,
                rating: rating,
                comment: comment,
                website: website || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await firebase.firestore().collection('reviews').add(reviewData);
            
            this.hideAddReviewModal();
            this.showToast('Avaliação publicada com sucesso!', 'success');
            this.loadReviews(); // Recarregar reviews
        } catch (error) {
            console.error('Error adding review:', error);
            this.showToast('Erro ao publicar avaliação', 'error');
        }
    }

    // Token Methods
    async redeemToken() {
        const token = document.getElementById('tokenInput').value.trim();
        
        if (!token) {
            this.showToast('Por favor, insira um token', 'warning');
            return;
        }

        try {
            const tokenDoc = await firebase.firestore().collection('tokens').doc(token).get();
            
            if (!tokenDoc.exists) {
                this.showToast('Token inválido', 'error');
                return;
            }

            const tokenData = tokenDoc.data();
            
            if (tokenData.used) {
                this.showToast('Token já utilizado', 'error');
                return;
            }

            if (tokenData.expiresAt.toDate() < new Date()) {
                this.showToast('Token expirado', 'error');
                return;
            }

            // Atualizar token como usado
            await firebase.firestore().collection('tokens').doc(token).update({
                used: true,
                usedBy: this.currentUser.uid,
                usedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Atualizar plano do usuário
            await this.saveUserData({
                plan: tokenData.plan,
                isActive: true
            });

            await this.loadUserData();
            this.updateUI();
            this.showToast(`Plano ${tokenData.plan} ativado com sucesso!`, 'success');
            document.getElementById('tokenInput').value = '';
        } catch (error) {
            console.error('Error redeeming token:', error);
            this.showToast('Erro ao resgatar token', 'error');
        }
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

// Função global para fechar mobile menu
function closeMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.remove('open');
}

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