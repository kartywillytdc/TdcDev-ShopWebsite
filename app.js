// app.js - Arquivo separado com informações sensíveis

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

// Funções de Autenticação
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(message, type = 'success') {
    // Implementação do toast (já está no HTML)
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Login com Email/Senha
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        checkAdminStatus(currentUser);
        showToast('Login realizado com sucesso!', 'success');
        closeModal('loginModal');
        
        if (currentUser.email === ADMIN_EMAIL) {
            showToast('Bem-vindo, Administrador!', 'success');
        }
    } catch (error) {
        showToast('Erro no login: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Registro com Email/Senha
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        showToast('As senhas não coincidem!', 'error');
        hideLoading();
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        // Salvar informações adicionais do usuário
        await db.collection('users').doc(currentUser.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            plan: 'free',
            isAdmin: email === ADMIN_EMAIL
        });

        checkAdminStatus(currentUser);
        showToast('Conta criada com sucesso!', 'success');
        closeModal('registerModal');
        openModal('welcomeModal');
    } catch (error) {
        showToast('Erro no registro: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Login com Google
async function loginWithGoogle() {
    showLoading();
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        currentUser = result.user;
        checkAdminStatus(currentUser);
        showToast('Login com Google realizado!', 'success');
        closeModal('loginModal');
    } catch (error) {
        showToast('Erro no login com Google: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Registro com Google
async function registerWithGoogle() {
    showLoading();
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        currentUser = result.user;
        
        // Salvar informações do usuário
        await db.collection('users').doc(currentUser.uid).set({
            name: currentUser.displayName,
            email: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            plan: 'free',
            isAdmin: currentUser.email === ADMIN_EMAIL
        });

        checkAdminStatus(currentUser);
        showToast('Conta criada com Google!', 'success');
        closeModal('registerModal');
        openModal('welcomeModal');
    } catch (error) {
        showToast('Erro no registro com Google: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Logout
async function logout() {
    showLoading();
    try {
        await auth.signOut();
        currentUser = null;
        isAdmin = false;
        updateAuthUI();
        showToast('Logout realizado com sucesso!', 'success');
    } catch (error) {
        showToast('Erro no logout: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Verificar status de administrador
function checkAdminStatus(user) {
    isAdmin = user.email === ADMIN_EMAIL;
    updateAuthUI();
}

// Atualizar UI baseada no estado de autenticação
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userEmail = document.getElementById('userEmail');
    const adminBtn = document.getElementById('adminBtn');

    if (currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        userEmail.textContent = currentUser.email;
        
        if (isAdmin) {
            adminBtn.style.display = 'block';
        } else {
            adminBtn.style.display = 'none';
        }
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

// Sistema de Tokens
async function redeemToken() {
    const tokenInput = document.getElementById('tokenInput');
    const token = tokenInput.value.trim();

    if (!token) {
        showToast('Por favor, digite um token válido!', 'error');
        return;
    }

    if (!currentUser) {
        showToast('Você precisa estar logado para resgatar um token!', 'error');
        openModal('loginModal');
        return;
    }

    showLoading();

    try {
        // Verificar token no Firestore
        const tokenDoc = await db.collection('tokens').doc(token).get();
        
        if (!tokenDoc.exists) {
            showToast('Token inválido ou expirado!', 'error');
            return;
        }

        const tokenData = tokenDoc.data();

        if (tokenData.used) {
            showToast('Este token já foi utilizado!', 'error');
            return;
        }

        if (tokenData.expires && tokenData.expires.toDate() < new Date()) {
            showToast('Token expirado!', 'error');
            return;
        }

        // Ativar plano do usuário
        await db.collection('users').doc(currentUser.uid).update({
            plan: tokenData.plan,
            planActivated: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Marcar token como usado
        await db.collection('tokens').doc(token).update({
            used: true,
            usedBy: currentUser.uid,
            usedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast(`Plano ${tokenData.plan} ativado com sucesso!`, 'success');
        tokenInput.value = '';

        // Redirecionar ou mostrar próximos passos
        if (tokenData.plan === 'premium') {
            showToast('Acesso liberado! Agora você pode solicitar seu site.', 'success');
        }

    } catch (error) {
        showToast('Erro ao resgatar token: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Observador de estado de autenticação
auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        checkAdminStatus(user);
        
        // Carregar dados adicionais do usuário
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                isAdmin = userData.isAdmin || user.email === ADMIN_EMAIL;
                updateAuthUI();
            }
        });
    } else {
        currentUser = null;
        isAdmin = false;
        updateAuthUI();
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    
    // Fechar menu mobile ao clicar em um link
    document.querySelectorAll('.mobile-menu a').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelector('.mobile-menu').classList.remove('open');
        });
    });
});

// Funções do Painel Admin (para gerar tokens)
async function generateAdminToken(planType) {
    if (!isAdmin) {
        showToast('Acesso negado! Apenas administradores podem gerar tokens.', 'error');
        return;
    }

    showLoading();

    try {
        // Gerar token único
        const token = 'TDC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const expires = new Date();
        expires.setDate(expires.getDate() + 30); // 30 dias de validade

        // Salvar token no Firestore
        await db.collection('tokens').doc(token).set({
            plan: planType,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            expires: expires,
            used: false
        });

        showToast(`Token ${planType} gerado: ${token}`, 'success');
        
        // Aqui você pode mostrar o token em um modal ou copiar para área de transferência
        navigator.clipboard.writeText(token);
        showToast('Token copiado para área de transferência!', 'success');

    } catch (error) {
        showToast('Erro ao gerar token: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}
