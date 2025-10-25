// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Admin Panel
    initAdminPanel();
    
    // Navigation
    setupNavigation();
    
    // Authentication
    setupAuth();
    
    // Dashboard
    setupDashboard();
    
    // Users Management
    setupUsersManagement();
    
    // Tokens Management
    setupTokensManagement();
    
    // Pricing Management
    setupPricingManagement();
    
    // Requests Management
    setupRequestsManagement();
    
    // Analytics
    setupAnalytics();
});

// Global Variables
let currentUser = null;
let usersData = [];
let tokensData = [];
let requestsData = [];
let transactionsData = [];
let currentUsersPage = 1;
let currentRequestsPage = 1;
const itemsPerPage = 10;

// Initialize Admin Panel
function initAdminPanel() {
    // Hide loading screen after 1.5 seconds
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
    }, 1500);
    
    // Check if user is admin
    checkAdminStatus();
}

// Navigation Setup
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');
    const pageTitle = document.getElementById('pageTitle');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(navItem => {
                navItem.classList.remove('bg-primary/30', 'text-white');
                navItem.classList.add('hover:bg-white/5', 'text-white/80');
            });
            
            // Add active class to clicked item
            item.classList.add('bg-primary/30', 'text-white');
            item.classList.remove('hover:bg-white/5', 'text-white/80');
            
            // Hide all sections
            sections.forEach(section => {
                section.classList.add('hidden');
            });
            
            // Show selected section
            const sectionId = item.getAttribute('data-section');
            document.getElementById(sectionId).classList.remove('hidden');
            
            // Update page title
            updatePageTitle(sectionId);
            
            // Load section data if needed
            loadSectionData(sectionId);
        });
    });
    
    // Quick action buttons
    const quickActionButtons = document.querySelectorAll('[data-section]');
    quickActionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.getAttribute('data-section');
            const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
            if (navItem) {
                navItem.click();
            }
        });
    });
}

// Update Page Title
function updatePageTitle(sectionId) {
    const titles = {
        'dashboard': 'Dashboard Principal',
        'users': 'Gerenciamento de Usuários',
        'tokens': 'Gerenciamento de Tokens',
        'pricing': 'Configurar Preços',
        'requests': 'Solicitações de Site',
        'analytics': 'Relatórios e Análises'
    };
    
    document.getElementById('pageTitle').textContent = titles[sectionId] || 'Painel Administrativo';
}

// Load Section Data
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'tokens':
            loadTokensData();
            break;
        case 'pricing':
            loadPricingData();
            break;
        case 'requests':
            loadRequestsData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
    }
}

// Authentication Setup
function setupAuth() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Listen for auth state changes
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            document.getElementById('adminEmail').textContent = user.email;
            document.getElementById('adminName').textContent = user.displayName || 'Administrador';
            
            // Set admin avatar
            const adminAvatar = document.getElementById('adminAvatar');
            if (user.photoURL) {
                adminAvatar.src = user.photoURL;
            } else {
                adminAvatar.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'Admin') + '&background=7f13ec&color=fff';
            }
            
            // Check if user is admin
            checkAdminStatus();
        } else {
            // Redirect to login if not authenticated
            window.location.href = '../index.html';
        }
    });
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = '../index.html';
        }).catch(error => {
            showToast('Erro ao fazer logout: ' + error.message, 'error');
        });
    });
}

// Check Admin Status
function checkAdminStatus() {
    if (currentUser && currentUser.email === "kartywillytdc@gmail.com") {
        return true;
    } else {
        window.location.href = '../index.html';
        return false;
    }
}

// Dashboard Setup
function setupDashboard() {
    // Load dashboard data
    loadDashboardData();
    
    // Set up refresh button if exists
    const refreshBtn = document.getElementById('refreshStatsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboardData);
    }
}

// Load Dashboard Data
function loadDashboardData() {
    // Simulate loading data from Firebase
    setTimeout(() => {
        // Mock data for demonstration
        document.getElementById('totalUsers').textContent = '1,247';
        document.getElementById('usersGrowth').textContent = '+12%';
        document.getElementById('activeTokens').textContent = '892';
        document.getElementById('tokensGrowth').textContent = '+8%';
        document.getElementById('monthlyRevenue').textContent = 'R$ 24,580';
        document.getElementById('revenueGrowth').textContent = '+15%';
        document.getElementById('activeRequests').textContent = '34';
        document.getElementById('requestsGrowth').textContent = '+5%';
        
        // Recent Activity
        const recentActivity = document.getElementById('recentActivity');
        recentActivity.innerHTML = `
            <div class="flex items-center gap-3 text-sm text-text-light">
                <div class="w-2 h-2 bg-success rounded-full"></div>
                <span>Novo usuário registrado: João Silva</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-text-light">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Token gerado para plano Premium</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-text-light">
                <div class="w-2 h-2 bg-warning rounded-full"></div>
                <span>Solicitação de site concluída</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-text-light">
                <div class="w-2 h-2 bg-success rounded-full"></div>
                <span>Pagamento recebido: R$ 499,90</span>
            </div>
        `;
        
        // Recent Tokens
        const recentTokensTable = document.getElementById('recentTokensTable');
        recentTokensTable.innerHTML = `
            <tr class="border-b border-white/10">
                <td class="p-4 text-sm text-text-light">TDCPREMIUM2024XYZ123</td>
                <td class="p-4 text-sm text-white">Maria Santos</td>
                <td class="p-4">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/20 text-success text-xs">
                        <span class="w-1.5 h-1.5 bg-success rounded-full"></span>
                        Ativo
                    </span>
                </td>
                <td class="p-4 text-sm text-text-light">30/12/2024</td>
                <td class="p-4">
                    <button class="text-primary hover:text-primary-light transition-colors">
                        <span class="material-symbols-outlined text-sm">visibility</span>
                    </button>
                </td>
            </tr>
            <tr class="border-b border-white/10">
                <td class="p-4 text-sm text-text-light">TDCBASIC2024ABC456</td>
                <td class="p-4 text-sm text-white">Pedro Oliveira</td>
                <td class="p-4">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning/20 text-warning text-xs">
                        <span class="w-1.5 h-1.5 bg-warning rounded-full"></span>
                        Pendente
                    </span>
                </td>
                <td class="p-4 text-sm text-text-light">15/01/2025</td>
                <td class="p-4">
                    <button class="text-primary hover:text-primary-light transition-colors">
                        <span class="material-symbols-outlined text-sm">visibility</span>
                    </button>
                </td>
            </tr>
        `;
    }, 1000);
}

// Users Management Setup
function setupUsersManagement() {
    const usersSearch = document.getElementById('usersSearch');
    const usersPrevPage = document.getElementById('usersPrevPage');
    const usersNextPage = document.getElementById('usersNextPage');
    
    // Search functionality
    usersSearch.addEventListener('input', debounce(() => {
        currentUsersPage = 1;
        loadUsersData();
    }, 300));
    
    // Pagination
    usersPrevPage.addEventListener('click', () => {
        if (currentUsersPage > 1) {
            currentUsersPage--;
            loadUsersData();
        }
    });
    
    usersNextPage.addEventListener('click', () => {
        const totalPages = Math.ceil(usersData.length / itemsPerPage);
        if (currentUsersPage < totalPages) {
            currentUsersPage++;
            loadUsersData();
        }
    });
}

// Load Users Data
function loadUsersData() {
    // Simulate loading from Firebase
    setTimeout(() => {
        // Mock data
        usersData = [
            { id: 1, name: 'João Silva', email: 'joao@email.com', plan: 'Premium', status: 'active', registrationDate: '15/03/2024' },
            { id: 2, name: 'Maria Santos', email: 'maria@email.com', plan: 'Pro', status: 'active', registrationDate: '22/03/2024' },
            { id: 3, name: 'Pedro Oliveira', email: 'pedro@email.com', plan: 'Básico', status: 'inactive', registrationDate: '01/04/2024' },
            { id: 4, name: 'Ana Costa', email: 'ana@email.com', plan: 'Premium', status: 'active', registrationDate: '05/04/2024' },
            { id: 5, name: 'Carlos Lima', email: 'carlos@email.com', plan: 'Pro', status: 'active', registrationDate: '12/04/2024' }
        ];
        
        const searchTerm = document.getElementById('usersSearch').value.toLowerCase();
        const filteredUsers = usersData.filter(user => 
            user.name.toLowerCase().includes(searchTerm) || 
            user.email.toLowerCase().includes(searchTerm)
        );
        
        const startIndex = (currentUsersPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        const usersTable = document.getElementById('usersTable');
        usersTable.innerHTML = '';
        
        if (paginatedUsers.length === 0) {
            usersTable.innerHTML = `
                <tr>
                    <td colspan="6" class="p-4 text-center text-text-light">Nenhum usuário encontrado</td>
                </tr>
            `;
        } else {
            paginatedUsers.forEach(user => {
                const statusClass = user.status === 'active' ? 
                    'bg-success/20 text-success' : 'bg-warning/20 text-warning';
                const statusText = user.status === 'active' ? 'Ativo' : 'Inativo';
                
                usersTable.innerHTML += `
                    <tr class="border-b border-white/10">
                        <td class="p-4 text-sm text-white">${user.name}</td>
                        <td class="p-4 text-sm text-text-light">${user.email}</td>
                        <td class="p-4 text-sm text-white">${user.plan}</td>
                        <td class="p-4">
                            <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full ${statusClass} text-xs">
                                <span class="w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-success' : 'bg-warning'}"></span>
                                ${statusText}
                            </span>
                        </td>
                        <td class="p-4 text-sm text-text-light">${user.registrationDate}</td>
                        <td class="p-4">
                            <div class="flex gap-2">
                                <button class="text-primary hover:text-primary-light transition-colors" onclick="editUser(${user.id})">
                                    <span class="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button class="text-danger hover:text-red-400 transition-colors" onclick="deleteUser(${user.id})">
                                    <span class="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
        
        // Update pagination info
        document.getElementById('usersPaginationInfo').textContent = 
            `Mostrando ${startIndex + 1}-${Math.min(endIndex, filteredUsers.length)} de ${filteredUsers.length} usuários`;
        
        // Update pagination buttons
        document.getElementById('usersPrevPage').disabled = currentUsersPage === 1;
        document.getElementById('usersNextPage').disabled = endIndex >= filteredUsers.length;
    }, 800);
}

// Tokens Management Setup
function setupTokensManagement() {
    const generateTokensBtn = document.getElementById('generateTokensBtn');
    const tokensSearch = document.getElementById('tokensSearch');
    
    // Generate tokens
    generateTokensBtn.addEventListener('click', generateTokens);
    
    // Search functionality
    tokensSearch.addEventListener('input', debounce(loadTokensData, 300));
}

// Load Tokens Data
function loadTokensData() {
    // Simulate loading from Firebase
    setTimeout(() => {
        // Mock data
        tokensData = [
            { token: 'TDCPREMIUM2024XYZ123', plan: 'Premium', created: '15/03/2024', expires: '15/04/2024', status: 'active' },
            { token: 'TDCBASIC2024ABC456', plan: 'Básico', created: '22/03/2024', expires: '22/04/2024', status: 'pending' },
            { token: 'TDCPRO2024DEF789', plan: 'Pro', created: '01/04/2024', expires: '01/05/2024', status: 'active' },
            { token: 'TDCPREMIUM2024GHI012', plan: 'Premium', created: '05/04/2024', expires: '05/05/2024', status: 'expired' }
        ];
        
        const searchTerm = document.getElementById('tokensSearch').value.toLowerCase();
        const filteredTokens = tokensData.filter(token => 
            token.token.toLowerCase().includes(searchTerm) || 
            token.plan.toLowerCase().includes(searchTerm)
        );
        
        const tokensTable = document.getElementById('tokensTable');
        tokensTable.innerHTML = '';
        
        if (filteredTokens.length === 0) {
            tokensTable.innerHTML = `
                <tr>
                    <td colspan="5" class="p-4 text-center text-text-light">Nenhum token encontrado</td>
                </tr>
            `;
        } else {
            filteredTokens.forEach(token => {
                let statusClass, statusText;
                if (token.status === 'active') {
                    statusClass = 'bg-success/20 text-success';
                    statusText = 'Ativo';
                } else if (token.status === 'pending') {
                    statusClass = 'bg-warning/20 text-warning';
                    statusText = 'Pendente';
                } else {
                    statusClass = 'bg-danger/20 text-danger';
                    statusText = 'Expirado';
                }
                
                tokensTable.innerHTML += `
                    <tr class="border-b border-white/10">
                        <td class="p-4 text-sm text-text-light">${token.token}</td>
                        <td class="p-4 text-sm text-white">${token.plan}</td>
                        <td class="p-4 text-sm text-text-light">${token.created}</td>
                        <td class="p-4 text-sm text-text-light">${token.expires}</td>
                        <td class="p-4">
                            <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full ${statusClass} text-xs">
                                <span class="w-1.5 h-1.5 rounded-full ${token.status === 'active' ? 'bg-success' : token.status === 'pending' ? 'bg-warning' : 'bg-danger'}"></span>
                                ${statusText}
                            </span>
                        </td>
                    </tr>
                `;
            });
        }
    }, 800);
}

// Generate Tokens
function generateTokens() {
    const plan = document.getElementById('tokenPlan').value;
    const quantity = parseInt(document.getElementById('tokenQuantity').value);
    
    if (quantity < 1 || quantity > 10) {
        showToast('Quantidade deve ser entre 1 e 10', 'error');
        return;
    }
    
    // Simulate token generation
    const tokens = [];
    for (let i = 0; i < quantity; i++) {
        const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
        const token = `TDC${plan.toUpperCase()}2024${randomString}`;
        tokens.push(token);
    }
    
    // Display generated tokens
    const generatedTokens = document.getElementById('generatedTokens');
    const tokenCode = generatedTokens.querySelector('code');
    tokenCode.textContent = tokens.join('\n');
    generatedTokens.classList.remove('hidden');
    
    showToast(`${quantity} token(s) gerado(s) com sucesso!`, 'success');
    
    // Refresh tokens table
    loadTokensData();
}

// Pricing Management Setup
function setupPricingManagement() {
    const savePricesBtn = document.getElementById('savePrices');
    const discardChangesBtn = document.getElementById('discardChanges');
    
    // Save prices
    savePricesBtn.addEventListener('click', savePrices);
    
    // Discard changes
    discardChangesBtn.addEventListener('click', loadPricingData);
}

// Load Pricing Data
function loadPricingData() {
    // In a real app, this would load from Firebase
    // For demo, we'll use default values
    document.querySelector('[data-plan="basic"]').value = 19;
    document.querySelector('[data-plan="pro"]').value = 49;
    document.querySelector('[data-plan="premium"]').value = 99;
    
    showToast('Preços carregados com sucesso', 'success');
}

// Save Prices
function savePrices() {
    const basicPrice = document.querySelector('[data-plan="basic"]').value;
    const proPrice = document.querySelector('[data-plan="pro"]').value;
    const premiumPrice = document.querySelector('[data-plan="premium"]').value;
    
    // In a real app, this would save to Firebase
    console.log('Saving prices:', { basicPrice, proPrice, premiumPrice });
    
    showToast('Preços atualizados com sucesso!', 'success');
}

// Requests Management Setup
function setupRequestsManagement() {
    const requestsSearch = document.getElementById('requestsSearch');
    const requestsStatusFilter = document.getElementById('requestsStatusFilter');
    const requestsPrevPage = document.getElementById('requestsPrevPage');
    const requestsNextPage = document.getElementById('requestsNextPage');
    
    // Search functionality
    requestsSearch.addEventListener('input', debounce(() => {
        currentRequestsPage = 1;
        loadRequestsData();
    }, 300));
    
    // Status filter
    requestsStatusFilter.addEventListener('change', () => {
        currentRequestsPage = 1;
        loadRequestsData();
    });
    
    // Pagination
    requestsPrevPage.addEventListener('click', () => {
        if (currentRequestsPage > 1) {
            currentRequestsPage--;
            loadRequestsData();
        }
    });
    
    requestsNextPage.addEventListener('click', () => {
        const totalPages = Math.ceil(requestsData.length / itemsPerPage);
        if (currentRequestsPage < totalPages) {
            currentRequestsPage++;
            loadRequestsData();
        }
    });
}

// Load Requests Data
function loadRequestsData() {
    // Simulate loading from Firebase
    setTimeout(() => {
        // Mock data
        requestsData = [
            { id: 1, userName: 'João Silva', plan: 'Premium', siteType: 'E-commerce', requestDate: '15/03/2024', status: 'completed' },
            { id: 2, name: 'Maria Santos', plan: 'Pro', siteType: 'Blog', requestDate: '22/03/2024', status: 'in-progress' },
            { id: 3, name: 'Pedro Oliveira', plan: 'Básico', siteType: 'Portfolio', requestDate: '01/04/2024', status: 'pending' },
            { id: 4, name: 'Ana Costa', plan: 'Premium', siteType: 'Landing Page', requestDate: '05/04/2024', status: 'completed' },
            { id: 5, name: 'Carlos Lima', plan: 'Pro', siteType: 'Institucional', requestDate: '12/04/2024', status: 'in-progress' }
        ];
        
        const searchTerm = document.getElementById('requestsSearch').value.toLowerCase();
        const statusFilter = document.getElementById('requestsStatusFilter').value;
        
        const filteredRequests = requestsData.filter(request => {
            const matchesSearch = 
                request.userName.toLowerCase().includes(searchTerm) || 
                request.plan.toLowerCase().includes(searchTerm) ||
                request.siteType.toLowerCase().includes(searchTerm);
            
            const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
        
        const startIndex = (currentRequestsPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
        
        const requestsTable = document.getElementById('requestsTable');
        requestsTable.innerHTML = '';
        
        if (paginatedRequests.length === 0) {
            requestsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="p-4 text-center text-text-light">Nenhuma solicitação encontrada</td>
                </tr>
            `;
        } else {
            paginatedRequests.forEach(request => {
                let statusClass, statusText;
                if (request.status === 'completed') {
                    statusClass = 'bg-success/20 text-success';
                    statusText = 'Concluído';
                } else if (request.status === 'in-progress') {
                    statusClass = 'bg-warning/20 text-warning';
                    statusText = 'Em Andamento';
                } else {
                    statusClass = 'bg-danger/20 text-danger';
                    statusText = 'Pendente';
                }
                
                requestsTable.innerHTML += `
                    <tr class="border-b border-white/10">
                        <td class="p-4 text-sm text-white">${request.userName}</td>
                        <td class="p-4 text-sm text-text-light">${request.plan}</td>
                        <td class="p-4 text-sm text-white">${request.siteType}</td>
                        <td class="p-4 text-sm text-text-light">${request.requestDate}</td>
                        <td class="p-4">
                            <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full ${statusClass} text-xs">
                                <span class="w-1.5 h-1.5 rounded-full ${request.status === 'completed' ? 'bg-success' : request.status === 'in-progress' ? 'bg-warning' : 'bg-danger'}"></span>
                                ${statusText}
                            </span>
                        </td>
                        <td class="p-4">
                            <div class="flex gap-2">
                                <button class="text-primary hover:text-primary-light transition-colors" onclick="viewRequest(${request.id})">
                                    <span class="material-symbols-outlined text-sm">visibility</span>
                                </button>
                                <button class="text-warning hover:text-yellow-400 transition-colors" onclick="updateRequestStatus(${request.id})">
                                    <span class="material-symbols-outlined text-sm">edit</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
        
        // Update pagination info
        document.getElementById('requestsPaginationInfo').textContent = 
            `Mostrando ${startIndex + 1}-${Math.min(endIndex, filteredRequests.length)} de ${filteredRequests.length} solicitações`;
        
        // Update pagination buttons
        document.getElementById('requestsPrevPage').disabled = currentRequestsPage === 1;
        document.getElementById('requestsNextPage').disabled = endIndex >= filteredRequests.length;
    }, 800);
}

// Analytics Setup
function setupAnalytics() {
    // Load analytics data when section is opened
    // This is handled by loadSectionData
}

// Load Analytics Data
function loadAnalyticsData() {
    // Simulate loading from Firebase
    setTimeout(() => {
        // Mock data
        document.getElementById('analyticsTotalUsers').textContent = '1,247';
        document.getElementById('analyticsTotalTokens').textContent = '2,548';
        document.getElementById('analyticsActiveTokens').textContent = '892';
        document.getElementById('analyticsTotalRevenue').textContent = 'R$ 124,580';
        
        // Recent Transactions
        const transactionsTable = document.getElementById('transactionsTable');
        transactionsTable.innerHTML = `
            <tr class="border-b border-white/10">
                <td class="p-4 text-sm text-text-light">#TXN001</td>
                <td class="p-4 text-sm text-white">João Silva</td>
                <td class="p-4 text-sm text-text-light">15/03/2024</td>
                <td class="p-4 text-sm text-white">Premium</td>
                <td class="p-4 text-sm text-success">R$ 499,90</td>
            </tr>
            <tr class="border-b border-white/10">
                <td class="p-4 text-sm text-text-light">#TXN002</td>
                <td class="p-4 text-sm text-white">Maria Santos</td>
                <td class="p-4 text-sm text-text-light">22/03/2024</td>
                <td class="p-4 text-sm text-white">Pro</td>
                <td class="p-4 text-sm text-success">R$ 299,90</td>
            </tr>
            <tr class="border-b border-white/10">
                <td class="p-4 text-sm text-text-light">#TXN003</td>
                <td class="p-4 text-sm text-white">Pedro Oliveira</td>
                <td class="p-4 text-sm text-text-light">01/04/2024</td>
                <td class="p-4 text-sm text-white">Básico</td>
                <td class="p-4 text-sm text-success">R$ 149,90</td>
            </tr>
        `;
    }, 800);
}

// Utility Functions

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = 'toast-' + Date.now();
    
    const typeClasses = {
        'success': 'bg-success border-success/30',
        'error': 'bg-danger border-danger/30',
        'warning': 'bg-warning border-warning/30',
        'info': 'bg-primary border-primary/30'
    };
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `glass-effect rounded-lg p-4 border-l-4 ${typeClasses[type]} flex items-center gap-3 animate-slide-in-right`;
    toast.innerHTML = `
        <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'}</span>
        <span class="flex-1">${message}</span>
        <button onclick="document.getElementById('${toastId}').remove()" class="text-white/60 hover:text-white transition-colors">
            <span class="material-symbols-outlined">close</span>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.getElementById(toastId)) {
            document.getElementById(toastId).remove();
        }
    }, 5000);
}

// User Management Functions
function editUser(userId) {
    showToast(`Editando usuário ID: ${userId}`, 'info');
    // In a real app, this would open a modal or redirect to edit page
}

function deleteUser(userId) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        showToast(`Usuário ID: ${userId} excluído com sucesso`, 'success');
        // In a real app, this would delete from Firebase
        loadUsersData(); // Refresh the table
    }
}

// Request Management Functions
function viewRequest(requestId) {
    showToast(`Visualizando solicitação ID: ${requestId}`, 'info');
    // In a real app, this would open a modal with request details
}

function updateRequestStatus(requestId) {
    showToast(`Atualizando status da solicitação ID: ${requestId}`, 'info');
    // In a real app, this would open a modal to update status
}

// Add custom animation for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in-right {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .animate-slide-in-right {
        animation: slide-in-right 0.3s ease-out;
    }
`;
document.head.appendChild(style);