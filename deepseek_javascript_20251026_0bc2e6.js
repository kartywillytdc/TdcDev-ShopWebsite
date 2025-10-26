// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC4wR7X7Q8XqY8Q9rX8W7tY6u5i4o3p2l1m",
    authDomain: "tdc-dev-app.firebaseapp.com",
    projectId: "tdc-dev-app",
    storageBucket: "tdc-dev-app.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

// Inicialização do Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Elementos DOM
const loadingScreen = document.getElementById('loadingScreen');
const header = document.getElementById('header');
const userMenuContainer = document.getElementById('userMenuContainer');
const userMenuTrigger = document.getElementById('userMenuTrigger');
const userDropdown = document.getElementById('userDropdown');
const loginBtn = document.getElementById('loginBtn');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuClose = document.getElementById('mobileMenuClose');
const mobileAuthButtons = document.getElementById('mobileAuthButtons');
const mobileUserMenu = document.getElementById('mobileUserMenu');
const mobileLoginBtn = document.getElementById('mobileLoginBtn');
const profileModal = document.getElementById('profileModal');
const profileModalClose = document.getElementById('profileModalClose');
const profileBtn = document.getElementById('profileBtn');
const mobileProfileBtn = document.getElementById('mobileProfileBtn');
const imageEditorModal = document.getElementById('imageEditorModal');
const imageEditorModalClose = document.getElementById('imageEditorModalClose');
const loginModal = document.getElementById('loginModal');
const loginModalClose = document.getElementById('loginModalClose');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const loginCancelBtn = document.getElementById('loginCancelBtn');
const adminPanel = document.getElementById('adminPanel');
const adminPanelBtn = document.getElementById('adminPanelBtn');
const mobileAdminPanelBtn = document.getElementById('mobileAdminPanelBtn');
const adminPanelClose = document.getElementById('adminPanelClose');
const logoutBtn = document.getElementById('logoutBtn');
const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
const imageUpload = document.getElementById('imageUpload');
const uploadImageBtn = document.getElementById('uploadImageBtn');
const editorSaveBtn = document.getElementById('editorSaveBtn');
const editorCancelBtn = document.getElementById('editorCancelBtn');
const adminDashboard = document.getElementById('adminDashboard');
const adminSidebar = document.getElementById('adminSidebar');
const adminNavLinks = document.querySelectorAll('.admin-nav-link');
const adminSectionContents = document.querySelectorAll('.admin-section-content');
const generateTokenBtn = document.getElementById('generateTokenBtn');
const adminTokenForm = document.getElementById('adminTokenForm');
const adminTokenResult = document.getElementById('adminTokenResult');
const adminTokenCode = document.getElementById('adminTokenCode');
const copyTokenBtn = document.getElementById('copyTokenBtn');

// Estado da aplicação
let currentUser = null;
let userProfile = null;
let isAdmin = false;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    startCountdown();
    updateStats();
});

// Inicializar aplicação
function initializeApp() {
    // Verificar autenticação
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadUserProfile(user);
            showUserMenu();
        } else {
            hideUserMenu();
        }
    });

    // Configurar scroll do header
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Menu do usuário
    userMenuTrigger.addEventListener('click', toggleUserDropdown);
    document.addEventListener('click', closeUserDropdown);

    // Menu mobile
    mobileMenuBtn.addEventListener('click', openMobileMenu);
    mobileMenuClose.addEventListener('click', closeMobileMenu);

    // Modais
    loginBtn.addEventListener('click', openLoginModal);
    mobileLoginBtn.addEventListener('click', openLoginModal);
    loginModalClose.addEventListener('click', closeLoginModal);
    loginCancelBtn.addEventListener('click', closeLoginModal);
    loginSubmitBtn.addEventListener('click', handleLogin);

    profileBtn.addEventListener('click', openProfileModal);
    mobileProfileBtn.addEventListener('click', openProfileModal);
    profileModalClose.addEventListener('click', closeProfileModal);

    // Admin panel
    adminPanelBtn.addEventListener('click', openAdminPanel);
    mobileAdminPanelBtn.addEventListener('click', openAdminPanel);
    adminPanelClose.addEventListener('click', closeAdminPanel);

    // Admin dashboard
    adminNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showAdminSection(section);
            
            // Atualizar navegação ativa
            adminNavLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    mobileLogoutBtn.addEventListener('click', handleLogout);

    // Editor de imagem
    uploadImageBtn.addEventListener('click', () => imageUpload.click());
    imageUpload.addEventListener('change', handleImageUpload);
    editorSaveBtn.addEventListener('click', saveProfileImage);
    editorCancelBtn.addEventListener('click', closeImageEditor);

    // Navegação mobile
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Formulário de contato
    document.getElementById('contactForm').addEventListener('submit', handleContactForm);

    // Toggle de preços
    document.getElementById('billingToggle').addEventListener('change', togglePricing);

    // Admin token generation
    generateTokenBtn?.addEventListener('click', generateAdminToken);
    adminTokenForm?.addEventListener('submit', handleAdminTokenGeneration);
    copyTokenBtn?.addEventListener('click', copyAdminToken);

    // Admin section toggles
    document.querySelectorAll('.plan-toggle').forEach(toggle => {
        toggle.addEventListener('change', updateAdminPricing);
    });

    // Admin filters
    document.querySelectorAll('.admin-filter').forEach(filter => {
        filter.addEventListener('click', () => {
            document.querySelectorAll('.admin-filter').forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
        });
    });
}

// Carregar perfil do usuário
function loadUserProfile(user) {
    db.collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                userProfile = doc.data();
                updateUserUI(user, userProfile);
                
                // Verificar se é admin
                isAdmin = userProfile.role === 'admin';
            } else {
                // Criar perfil padrão
                userProfile = {
                    name: user.displayName || 'Usuário',
                    email: user.email,
                    phone: '',
                    company: '',
                    avatar: '',
                    role: 'user',
                    since: new Date().getFullYear(),
                    projects: 0
                };
                db.collection('users').doc(user.uid).set(userProfile);
                updateUserUI(user, userProfile);
            }
        })
        .catch(error => {
            console.error('Erro ao carregar perfil:', error);
        });
}

// Atualizar UI do usuário
function updateUserUI(user, profile) {
    // Header
    document.getElementById('userName').textContent = profile.name;
    document.getElementById('userEmail').textContent = profile.email;
    document.getElementById('avatarPlaceholder').textContent = profile.name.charAt(0).toUpperCase();

    // Menu mobile
    document.getElementById('mobileUserName').textContent = profile.name;
    document.getElementById('mobileUserEmail').textContent = profile.email;
    document.getElementById('mobileAvatarPlaceholder').textContent = profile.name.charAt(0).toUpperCase();

    // Modal de perfil
    document.getElementById('modalUserName').textContent = profile.name;
    document.getElementById('modalUserEmail').textContent = profile.email;
    document.getElementById('modalUserRole').textContent = profile.role === 'admin' ? 'Administrador' : 'Cliente';
    document.getElementById('modalProjects').textContent = profile.projects || 0;
    document.getElementById('modalSince').textContent = profile.since || new Date().getFullYear();
    document.getElementById('modalAvatarPlaceholder').textContent = profile.name.charAt(0).toUpperCase();

    // Campos do formulário
    document.getElementById('profileName').value = profile.name;
    document.getElementById('profilePhone').value = profile.phone || '';
    document.getElementById('profileCompany').value = profile.company || '';

    // Carregar avatar se existir
    if (profile.avatar) {
        loadAvatar(profile.avatar);
    }
}

// Carregar avatar
function loadAvatar(avatarUrl) {
    const avatarElements = [
        document.getElementById('userAvatar'),
        document.getElementById('mobileUserAvatar'),
        document.getElementById('modalAvatar')
    ];

    avatarElements.forEach(element => {
        const placeholder = element.querySelector('.profile-avatar-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        let img = element.querySelector('img');
        if (!img) {
            img = document.createElement('img');
            element.appendChild(img);
        }
        img.src = avatarUrl;
        img.style.display = 'block';
    });
}

// Mostrar menu do usuário
function showUserMenu() {
    userMenuContainer.style.display = 'block';
    loginBtn.style.display = 'none';
    mobileAuthButtons.style.display = 'none';
    mobileUserMenu.style.display = 'block';
}

// Esconder menu do usuário
function hideUserMenu() {
    userMenuContainer.style.display = 'none';
    loginBtn.style.display = 'flex';
    mobileAuthButtons.style.display = 'flex';
    mobileUserMenu.style.display = 'none';
}

// Toggle dropdown do usuário
function toggleUserDropdown(e) {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
}

// Fechar dropdown do usuário
function closeUserDropdown(e) {
    if (!userMenuTrigger.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('show');
    }
}

// Abrir menu mobile
function openMobileMenu() {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
}

// Fechar menu mobile
function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
}

// Abrir modal de login
function openLoginModal() {
    loginModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    closeMobileMenu();
}

// Fechar modal de login
function closeLoginModal() {
    loginModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Abrir modal de perfil
function openProfileModal() {
    profileModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    closeUserDropdown();
    closeMobileMenu();
}

// Fechar modal de perfil
function closeProfileModal() {
    profileModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Abrir editor de imagem
function openImageEditor() {
    imageEditorModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Fechar editor de imagem
function closeImageEditor() {
    imageEditorModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Abrir painel admin
function openAdminPanel() {
    if (isAdmin) {
        adminDashboard.classList.add('active');
        document.body.style.overflow = 'hidden';
        closeUserDropdown();
        closeMobileMenu();
    } else {
        alert('Acesso restrito para administradores');
    }
}

// Fechar painel admin
function closeAdminPanel() {
    adminPanel.classList.remove('open');
    document.body.style.overflow = '';
}

// Mostrar seção do admin
function showAdminSection(section) {
    adminSectionContents.forEach(content => {
        content.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Manipular login
function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            closeLoginModal();
            // Verificar se é admin
            if (email === 'admin@tdcdev.com') {
                db.collection('users').doc(userCredential.user.uid).update({
                    role: 'admin'
                });
            }
        })
        .catch((error) => {
            alert('Erro ao fazer login: ' + error.message);
        });
}

// Manipular logout
function handleLogout() {
    auth.signOut()
        .then(() => {
            closeUserDropdown();
            closeMobileMenu();
            if (adminDashboard.classList.contains('active')) {
                adminDashboard.classList.remove('active');
            }
        })
        .catch((error) => {
            console.error('Erro ao fazer logout:', error);
        });
}

// Manipular upload de imagem
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('editorImage').src = event.target.result;
            openImageEditor();
        };
        reader.readAsDataURL(file);
    }
}

// Salvar imagem de perfil
function saveProfileImage() {
    const imageSrc = document.getElementById('editorImage').src;
    if (imageSrc && currentUser) {
        // Em uma aplicação real, aqui você faria o upload para o Firebase Storage
        // Por simplicidade, vamos apenas salvar como base64 no perfil
        
        // Simular upload
        const loadingBtn = editorSaveBtn;
        loadingBtn.innerHTML = '<span class="material-symbols-outlined">progress_activity</span> Salvando...';
        loadingBtn.disabled = true;

        setTimeout(() => {
            // Atualizar perfil
            db.collection('users').doc(currentUser.uid).update({
                avatar: imageSrc
            }).then(() => {
                loadAvatar(imageSrc);
                closeImageEditor();
                loadingBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Aplicar';
                loadingBtn.disabled = false;
            });
        }, 1500);
    }
}

// Manipular formulário de contato
function handleContactForm(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        service: document.getElementById('service').value,
        message: document.getElementById('message').value,
        timestamp: new Date()
    };

    // Simular envio
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<span class="material-symbols-outlined">progress_activity</span> Enviando...';
    submitBtn.disabled = true;

    setTimeout(() => {
        // Em uma aplicação real, salvar no Firestore
        console.log('Mensagem enviada:', formData);
        
        submitBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Mensagem Enviada!';
        submitBtn.style.background = 'var(--success)';
        
        setTimeout(() => {
            e.target.reset();
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
        }, 2000);
    }, 2000);
}

// Toggle de preços anual/mensal
function togglePricing(e) {
    const isAnnual = e.target.checked;
    const basicPrice = document.getElementById('basicPrice');
    const proPrice = document.getElementById('proPrice');
    const enterprisePrice = document.getElementById('enterprisePrice');
    const basicPeriod = document.getElementById('basicPeriod');
    const proPeriod = document.getElementById('proPeriod');
    const enterprisePeriod = document.getElementById('enterprisePeriod');

    if (isAnnual) {
        basicPrice.textContent = 'R$ 239';
        proPrice.textContent = 'R$ 479';
        enterprisePrice.textContent = 'R$ 1.039';
        basicPeriod.textContent = '/ano';
        proPeriod.textContent = '/ano';
        enterprisePeriod.textContent = '/ano';
    } else {
        basicPrice.textContent = 'R$ 299';
        proPrice.textContent = 'R$ 599';
        enterprisePrice.textContent = 'R$ 1.299';
        basicPeriod.textContent = '/mês';
        proPeriod.textContent = '/mês';
        enterprisePeriod.textContent = '/mês';
    }
}

// Atualizar preços no admin
function updateAdminPricing(e) {
    const plan = e.target.getAttribute('data-plan');
    const isAnnual = e.target.checked;
    
    const priceInput = document.querySelector(`[data-plan="${plan}-monthly"]`);
    if (priceInput) {
        let price = parseFloat(priceInput.value);
        if (isAnnual) {
            price = price * 0.8; // 20% de desconto
        }
        // Atualizar display do preço (se houver)
        console.log(`Preço atualizado para ${plan}: R$ ${price.toFixed(2)}`);
    }
}

// Gerar token no admin
function generateAdminToken() {
    adminTokenResult.style.display = 'block';
    const token = 'TDC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    adminTokenCode.textContent = token;
}

// Manipular geração de token no admin
function handleAdminTokenGeneration(e) {
    e.preventDefault();
    generateAdminToken();
}

// Copiar token
function copyAdminToken() {
    const token = adminTokenCode.textContent;
    navigator.clipboard.writeText(token).then(() => {
        // Mostrar feedback
        const originalText = copyTokenBtn.innerHTML;
        copyTokenBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Copiado!';
        setTimeout(() => {
            copyTokenBtn.innerHTML = originalText;
        }, 2000);
    });
}

// Contador regressivo para oferta
function startCountdown() {
    const countdownDate = new Date();
    countdownDate.setDate(countdownDate.getDate() + 7); // 7 dias a partir de agora

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
            clearInterval(countdownInterval);
            document.getElementById('countdown').innerHTML = '<span style="color: var(--white); font-size: 1.5rem; font-weight: 700;">Oferta Expirada</span>';
        }
    }

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
}

// Atualizar estatísticas em tempo real
function updateStats() {
    // Simular dados em tempo real
    setInterval(() => {
        // Projetos (aumentando gradualmente)
        const projectsCount = document.getElementById('projectsCount');
        let projects = parseInt(projectsCount.textContent);
        if (projects < 200 && Math.random() > 0.7) {
            projects++;
            projectsCount.textContent = projects + '+';
        }

        // Clientes (aumentando gradualmente)
        const clientsCount = document.getElementById('clientsCount');
        let clients = parseInt(clientsCount.textContent);
        if (clients < 100 && Math.random() > 0.8) {
            clients++;
            clientsCount.textContent = clients + '+';
        }

        // Estatísticas do admin (simulando mudanças)
        if (isAdmin) {
            const adminStats = [
                { id: 'adminTotalUsers', min: 150, max: 160 },
                { id: 'adminActiveProjects', min: 20, max: 30 },
                { id: 'adminMonthlyRevenue', min: 40, max: 45, prefix: 'R$ ', suffix: 'K' },
                { id: 'adminSupportTickets', min: 5, max: 12 }
            ];

            adminStats.forEach(stat => {
                const element = document.getElementById(stat.id);
                if (element && Math.random() > 0.9) {
                    const current = parseInt(element.textContent.replace(/[^0-9]/g, ''));
                    const newValue = Math.floor(Math.random() * (stat.max - stat.min + 1)) + stat.min;
                    if (newValue !== current) {
                        element.textContent = (stat.prefix || '') + newValue + (stat.suffix || '');
                    }
                }
            });
        }
    }, 5000);
}

// Prevenir zoom e seleção de texto
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
});

document.addEventListener('gestureend', function(e) {
    e.preventDefault();
});

// Inicializar animações de entrada
function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    });

    document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .zoom-in, .stagger-children').forEach(el => {
        observer.observe(el);
    });
}

// Inicializar animações quando a página carregar
window.addEventListener('load', initAnimations);