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

// Inicialização do Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Estado da aplicação
let currentUser = null;
let isAdmin = false;
const ADMIN_EMAIL = "admin@tdcdev.com"; // Altere para o email do administrador

// Funções de UI
function showLoading() {
    document.body.classList.add('loading');
}

function hideLoading() {
    document.body.classList.remove('loading');
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
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
            loadUserProfile();
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
async function generateToken() {
    if (!isAdmin) {
        showNotification('Acesso negado! Apenas administradores podem gerar tokens.', 'error');
        return;
    }

    const name = document.getElementById('tokenName').value;
    const type = document.getElementById('tokenType').value;
    const expiry = document.getElementById('tokenExpiry').value;

    if (!name || !type || !expiry) {
        showNotification('Preencha todos os campos para gerar o token.', 'error');
        return;
    }

    showLoading();

    try {
        const token = 'TDC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const expires = new Date(expiry);

        await db.collection('tokens').doc(token).set({
            name: name,
            type: type,
            token: token,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            expires: expires,
            used: false,
            status: 'active'
        });

        showNotification(`Token "${name}" gerado com sucesso!`, 'success');
        
        // Limpar formulário
        document.getElementById('tokenName').value = '';
        document.getElementById('tokenType').value = '';
        document.getElementById('tokenExpiry').value = '';

        // Recarregar tabela de tokens
        loadTokensTable();

    } catch (error) {
        showNotification('Erro ao gerar token: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Atualizar preços
async function updatePricing() {
    if (!isAdmin) {
        showNotification('Acesso negado! Apenas administradores podem atualizar preços.', 'error');
        return;
    }

    const basicPrice = document.getElementById('basicPrice').value;
    const proPrice = document.getElementById('proPrice').value;
    const premiumPrice = document.getElementById('premiumPrice').value;

    showLoading();

    try {
        await db.collection('pricing').doc('current').set({
            basic: parseFloat(basicPrice),
            pro: parseFloat(proPrice),
            premium: parseFloat(premiumPrice),
            updatedBy: currentUser.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showNotification('Preços atualizados com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro ao atualizar preços: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Carregar perfil do usuário
async function loadUserProfile() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            document.getElementById('profileName').value = userData.name || '';
            document.getElementById('profileEmail').value = currentUser.email;
            document.getElementById('profilePhone').value = userData.phone || '';
            document.getElementById('profileCompany').value = userData.company || '';
            
            // Avatar
            if (userData.photoURL) {
                document.getElementById('profileAvatar').src = userData.photoURL;
                document.getElementById('profileAvatar').style.display = 'block';
                document.getElementById('adminUserAvatar').innerHTML = `<img src="${userData.photoURL}" style="width: 100%; height: 100%; border-radius: 50%;">`;
            } else {
                document.getElementById('adminUserAvatar').textContent = currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'A';
            }
            
            document.getElementById('adminUserName').textContent = userData.name || currentUser.displayName || 'Administrador';
        }
        
        // Carregar galeria
        loadUserGallery();
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

// Atualizar perfil
async function updateProfile() {
    const name = document.getElementById('profileName').value;
    const phone = document.getElementById('profilePhone').value;
    const company = document.getElementById('profileCompany').value;
    
    showLoading();

    try {
        await db.collection('users').doc(currentUser.uid).set({
            name: name,
            phone: phone,
            company: company,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        document.getElementById('adminUserName').textContent = name || 'Administrador';
        showNotification('Perfil atualizado com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro ao atualizar perfil: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Carregar galeria do usuário
async function loadUserGallery() {
    try {
        const galleryDoc = await db.collection('galleries').doc(currentUser.uid).get();
        const galleryGrid = document.getElementById('galleryGrid');
        
        if (galleryDoc.exists) {
            const galleryData = galleryDoc.data();
            const images = galleryData.images || [];
            
            if (images.length > 0) {
                galleryGrid.innerHTML = images.map((image, index) => `
                    <div class="gallery-item">
                        <img src="${image.url}" alt="Gallery image" class="gallery-img">
                        <button class="gallery-remove" onclick="removeGalleryImage(${index})">
                            <span class="material-symbols-outlined" style="font-size: 1rem;">close</span>
                        </button>
                    </div>
                `).join('');
            } else {
                galleryGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-light); padding: 2rem;">Nenhuma imagem na galeria. Clique em "Adicionar Imagem" para fazer upload.</div>';
            }
        } else {
            galleryGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-light); padding: 2rem;">Nenhuma imagem na galeria. Clique em "Adicionar Imagem" para fazer upload.</div>';
        }
    } catch (error) {
        console.error('Erro ao carregar galeria:', error);
    }
}

// Upload de avatar
document.getElementById('avatarUpload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    showLoading();

    try {
        const storageRef = storage.ref();
        const avatarRef = storageRef.child(`avatars/${currentUser.uid}/${file.name}`);
        const snapshot = await avatarRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        // Atualizar no Firestore
        await db.collection('users').doc(currentUser.uid).set({
            photoURL: downloadURL,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Atualizar na UI
        document.getElementById('profileAvatar').src = downloadURL;
        document.getElementById('profileAvatar').style.display = 'block';
        document.getElementById('adminUserAvatar').innerHTML = `<img src="${downloadURL}" style="width: 100%; height: 100%; border-radius: 50%;">`;
        
        showNotification('Avatar atualizado com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro ao fazer upload do avatar: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Upload para galeria
document.getElementById('galleryUpload')?.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    
    showLoading();

    try {
        const storageRef = storage.ref();
        const uploadPromises = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const galleryRef = storageRef.child(`galleries/${currentUser.uid}/${Date.now()}_${file.name}`);
            const uploadPromise = galleryRef.put(file).then(snapshot => snapshot.ref.getDownloadURL());
            uploadPromises.push(uploadPromise);
        }

        const downloadURLs = await Promise.all(uploadPromises);
        
        // Adicionar à galeria no Firestore
        const userGallery = await db.collection('galleries').doc(currentUser.uid).get();
        const galleryData = userGallery.exists ? userGallery.data() : { images: [] };
        
        downloadURLs.forEach((url, index) => {
            galleryData.images.push({
                url: url,
                name: files[index].name,
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await db.collection('galleries').doc(currentUser.uid).set(galleryData);
        
        // Recarregar galeria
        loadUserGallery();
        showNotification('Imagens adicionadas à galeria!', 'success');
    } catch (error) {
        showNotification('Erro ao fazer upload das imagens: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Remover imagem da galeria
async function removeGalleryImage(index) {
    showLoading();

    try {
        const userGallery = await db.collection('galleries').doc(currentUser.uid).get();
        const galleryData = userGallery.data();
        
        galleryData.images.splice(index, 1);
        
        await db.collection('galleries').doc(currentUser.uid).set(galleryData);
        
        loadUserGallery();
        showNotification('Imagem removida da galeria!', 'success');
    } catch (error) {
        showNotification('Erro ao remover imagem: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Carregar tokens existentes
async function loadTokensTable() {
    try {
        const tokensSnapshot = await db.collection('tokens')
            .where('createdBy', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        const tableBody = document.getElementById('tokensTable');
        
        if (tokensSnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-light);">Nenhum token gerado</td></tr>';
            return;
        }
        
        tableBody.innerHTML = tokensSnapshot.docs.map(doc => {
            const token = doc.data();
            const status = token.used ? 'used' : (new Date() > token.expires.toDate() ? 'expired' : 'active');
            const statusText = status === 'active' ? 'Ativo' : status === 'used' ? 'Usado' : 'Expirado';
            const statusClass = status === 'active' ? 'status-active' : status === 'used' ? 'status-pending' : 'status-expired';
            
            return `
                <tr>
                    <td>${token.name}</td>
                    <td>${token.type}</td>
                    <td>${token.createdAt?.toDate().toLocaleDateString('pt-BR')}</td>
                    <td>${token.expires?.toDate().toLocaleDateString('pt-BR')}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="copyToken('${token.token}')">
                            <span class="material-symbols-outlined" style="font-size: 1rem;">content_copy</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Erro ao carregar tokens:', error);
    }
}

// Copiar token
function copyToken(token) {
    navigator.clipboard.writeText(token).then(() => {
        showNotification('Token copiado para a área de transferência!', 'success');
    });
}

// Funções do Admin Panel
function showAdminTab(tabName) {
    // Esconder todas as abas
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover active de todos os itens do menu
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Ativar item do menu correspondente
    document.querySelector(`.admin-nav-item[onclick="showAdminTab('${tabName}')"]`).classList.add('active');
    
    // Atualizar título da página
    document.getElementById('adminPageTitle').textContent = 
        document.querySelector(`.admin-nav-item[onclick="showAdminTab('${tabName}')"]`).textContent.trim();
    
    // Carregar dados específicos da aba
    if (tabName === 'tokens') {
        loadTokensTable();
    }
    
    // Fechar sidebar no mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

function toggleAdminSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function loadAdminPanel() {
    showAdminTab('dashboard');
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
        
        .admin-tab {
            display: none;
        }
        
        .admin-tab.active {
            display: block;
        }
    `;
    document.head.appendChild(style);
});
