// =====================================================
// ملف JavaScript للوحة تحكم المدير - Super Admin JS
// السيطرة الكاملة على الموقع
// =====================================================

// =====================================================
// المتغيرات العامة
// =====================================================

// عنوان الـ API الأساسي
const API_URL = '';

// رمز JWT للمصادقة
let authToken = '';

// قائمة المستخدمين الكاملة
let allUsers = [];

// =====================================================
// تهيئة الصفحة عند التحميل
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من صلاحيات الوصول
    checkAdminAccess();
});

// =====================================================
// دالة التحقق من صلاحيات المدير
// تتأكد أن المستخدم هو المدير الوحيد
// =====================================================
async function checkAdminAccess() {
    // جلب الرمز من التخزين المحلي
    authToken = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // التحقق من وجود الرمز
    if (!authToken) {
        window.location.href = '/auth.html';
        return;
    }

    // التحقق من أن المستخدم هو المدير
    if (!user.isAdmin) {
        showToast('هذه الصفحة متاحة للمدير فقط', 'error');
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
        return;
    }

    // عرض اسم المدير
    document.getElementById('admin-name').textContent = user.name || 'المدير';

    // تحميل البيانات
    loadStats();
    loadUsers();
}

// =====================================================
// دالة تسجيل الخروج
// =====================================================

function logout() {
    Swal.fire({
        title: 'تسجيل الخروج',
        text: "هل أنت متأكد من تسجيل الخروج؟",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'نعم، خروج',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/auth.html';
        }
    });
}


// =====================================================
// دالة تحميل الإحصائيات
// =====================================================
async function loadStats() {
    try {
        const response = await axios.get(`${API_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.data.success) {
            const stats = response.data.stats;
            document.getElementById('stat-total-users').textContent = stats.totalUsers;
            document.getElementById('stat-pending').textContent = stats.pendingMerchants;
            document.getElementById('stat-merchants').textContent = stats.approvedMerchants;
            document.getElementById('stat-customers').textContent = stats.totalCustomers;
            document.getElementById('stat-parts').textContent = stats.totalParts;
            document.getElementById('stat-requests').textContent = stats.totalRequests;
        }
    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
    }
}

// =====================================================
// دالة تحميل المستخدمين
// =====================================================
async function loadUsers() {
    // إظهار حالة التحميل
    document.getElementById('users-loading').classList.remove('hidden');
    document.getElementById('users-empty').classList.add('hidden');
    document.getElementById('users-list').innerHTML = '';

    try {
        const response = await axios.get(`${API_URL}/api/admin/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        // إخفاء حالة التحميل
        document.getElementById('users-loading').classList.add('hidden');

        allUsers = response.data.users || [];

        // تحديث العداد
        document.getElementById('users-count').textContent = `(${allUsers.length})`;

        if (allUsers.length === 0) {
            document.getElementById('users-empty').classList.remove('hidden');
        } else {
            renderUsers(allUsers);
        }
    } catch (error) {
        document.getElementById('users-loading').classList.add('hidden');
        document.getElementById('users-empty').classList.remove('hidden');
        showToast('حدث خطأ في تحميل المستخدمين', 'error');
    }
}

// =====================================================
// دالة فلترة المستخدمين
// =====================================================
function filterUsers() {
    const filter = document.getElementById('user-filter').value;
    let filteredUsers = allUsers;

    if (filter === 'pending') {
        filteredUsers = allUsers.filter(u => u.role === 'تاجر' && !u.isApproved);
    } else if (filter === 'merchants') {
        filteredUsers = allUsers.filter(u => u.role === 'تاجر');
    } else if (filter === 'customers') {
        filteredUsers = allUsers.filter(u => u.role === 'زبون');
    }

    if (filteredUsers.length === 0) {
        document.getElementById('users-list').innerHTML = '';
        document.getElementById('users-empty').classList.remove('hidden');
    } else {
        document.getElementById('users-empty').classList.add('hidden');
        renderUsers(filteredUsers);
    }
}

// =====================================================
// دالة عرض المستخدمين
// =====================================================
function renderUsers(users) {
    const list = document.getElementById('users-list');
    list.innerHTML = '';

    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'glass-card rounded-xl p-4';
        card.id = `user-${user._id}`;

        // تحديد شارة الدور
        const roleBadge = user.role === 'تاجر'
            ? '<span class="badge-merchant px-3 py-1 rounded-full text-white text-sm font-bold">تاجر</span>'
            : '<span class="badge-customer px-3 py-1 rounded-full text-white text-sm font-bold">زبون</span>';

        // تحديد شارة الحالة
        let statusBadge = '';
        if (user.role === 'تاجر') {
            statusBadge = user.isApproved
                ? '<span class="badge-approved px-3 py-1 rounded-full text-white text-sm font-bold"><i class="fas fa-check ml-1"></i>موافق عليه</span>'
                : '<span class="badge-pending px-3 py-1 rounded-full text-white text-sm font-bold"><i class="fas fa-clock ml-1"></i>في انتظار الموافقة</span>';
        }

        // تنسيق التاريخ
        const date = new Date(user.createdAt);
        const formattedDate = date.toLocaleDateString('ar-LY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // أزرار الإجراءات حسب الحالة
        let actionButtons = '';
        if (user.role === 'تاجر') {
            if (!user.isApproved) {
                actionButtons = `
                    <button onclick="approveUser('${user._id}')" 
                        class="btn-approve px-4 py-2 rounded-xl font-bold text-white flex items-center gap-2">
                        <i class="fas fa-check"></i>
                        <span>موافقة</span>
                    </button>
                `;
            } else {
                actionButtons = `
                    <button onclick="rejectUser('${user._id}')" 
                        class="btn-reject px-4 py-2 rounded-xl font-bold text-white flex items-center gap-2">
                        <i class="fas fa-ban"></i>
                        <span>إلغاء الموافقة</span>
                    </button>
                `;
            }
        }

        card.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <!-- معلومات المستخدم -->
                <div class="flex items-center gap-4">
                    <!-- أفاتار -->
                    <div class="w-14 h-14 rounded-xl bg-gradient-to-br ${user.role === 'تاجر' ? 'from-blue-500 to-blue-600' : 'from-purple-500 to-indigo-600'} flex items-center justify-center">
                        <i class="fas ${user.role === 'تاجر' ? 'fa-store' : 'fa-user'} text-2xl text-white"></i>
                    </div>
                    
                    <!-- البيانات -->
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="text-lg font-bold text-white">${user.name}</h3>
                            ${roleBadge}
                            ${statusBadge}
                        </div>
                        <p class="text-gray-400 text-sm">
                            <i class="fas fa-envelope ml-1"></i>
                            ${user.email}
                        </p>
                        <p class="text-gray-500 text-sm">
                            <i class="fas fa-phone ml-1"></i>
                            ${user.phone}
                            <span class="mx-2">•</span>
                            <i class="fas fa-calendar ml-1"></i>
                            ${formattedDate}
                        </p>
                    </div>
                </div>
                
                <!-- أزرار الإجراءات -->
                <div class="flex gap-2">
                    ${actionButtons}
                    <button onclick="deleteUser('${user._id}', '${user.name}')" 
                        class="btn-danger px-4 py-2 rounded-xl font-bold text-white flex items-center gap-2">
                        <i class="fas fa-trash"></i>
                        <span class="hidden sm:inline">حذف</span>
                    </button>
                </div>
            </div>
        `;

        list.appendChild(card);
    });
}

// =====================================================
// دالة الموافقة على تاجر
// =====================================================
async function approveUser(userId) {
    const result = await Swal.fire({
        title: 'تأكيد الموافقة',
        text: "هل تريد الموافقة على هذا التاجر؟",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#d33',
        confirmButtonText: 'نعم، موافقة',
        cancelButtonText: 'إلغاء'
    });

    if (result.isConfirmed) {
        try {
            const response = await axios.put(`${API_URL}/api/admin/users/${userId}/approve`, {}, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (response.data.success) {
                showToast(response.data.message, 'success');
                loadStats();
                loadUsers();
            }
        } catch (error) {
            showToast('حدث خطأ في الموافقة', 'error');
        }
    }
}

// =====================================================
// دالة إلغاء الموافقة على تاجر
// =====================================================
async function rejectUser(userId) {
    const result = await Swal.fire({
        title: 'إلغاء الموافقة',
        text: "هل أنت متأكد من إلغاء موافقة هذا التاجر؟ سيتم تعطيل حسابه.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#d33',
        confirmButtonText: 'نعم، إلغاء الموافقة',
        cancelButtonText: 'تراجع'
    });

    if (result.isConfirmed) {
        try {
            const response = await axios.put(`${API_URL}/api/admin/users/${userId}/reject`, {}, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (response.data.success) {
                showToast(response.data.message, 'success');
                loadStats();
                loadUsers();
            }
        } catch (error) {
            showToast('حدث خطأ في إلغاء الموافقة', 'error');
        }
    }
}

// =====================================================
// دالة حذف مستخدم
// =====================================================
async function deleteUser(userId, userName) {
    const result = await Swal.fire({
        title: 'حذف المستخدم',
        text: `هل أنت متأكد من حذف "${userName}"؟\nسيتم حذف جميع بياناته وقطعه نهائياً!`,
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'نعم، حذف نهائي',
        cancelButtonText: 'إلغاء'
    });

    if (result.isConfirmed) {
        try {
            const response = await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (response.data.success) {
                Swal.fire(
                    'تم الحذف!',
                    'تم حذف المستخدم بنجاح.',
                    'success'
                );
                loadStats();
                loadUsers();
            }
        } catch (error) {
            showToast('حدث خطأ في حذف المستخدم', 'error');
        }
    }
}

// =====================================================
// دالة إظهار Toast Notification
// =====================================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    const bgColor = type === 'success' ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

    toast.className = `toast bg-gradient-to-l ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]`;
    toast.innerHTML = `
        <i class="fas ${icon} text-xl"></i>
        <span class="font-semibold">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
