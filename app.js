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
const storage = firebase.storage();

// Estado da aplicação
let currentUser = null;
let isAdmin = false;

// Funções de UI
function showLoading() {
    document.body.classList.add('loading');
}

function hideLoading() {
    document.body.classList.remove('loading');
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
    const adminUserEmail = document.getElementById('adminUserEmail');

    if (currentUser) {
        // Usuário logado
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        userEmail.textContent = currentUser.email;
        adminUserEmail.textContent = currentUser.email;
        
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

// Sistema de Tokens (Admin)
async function generateToken(planType) {
    if (!isAdmin) {
        showNotification('Acesso negado! Apenas administradores podem gerar tokens.', 'error');
        return;
    }

    showLoading();

    try {
        const token = 'TDC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const expires = new Date();
        expires.setDate(expires.getDate() + 30); // 30 dias de validade

        await db.collection('tokens').doc(token).set({
            plan: planType,
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
            planActivated: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Marcar token como usado
        await db.collection('tokens').doc(token).update({
            used: true,
            usedBy: currentUser.uid,
            usedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showNotification(`Plano ${tokenData.plan} ativado com sucesso!`, 'success');

    } catch (error) {
        showNotification('Erro ao resgatar token: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
});
