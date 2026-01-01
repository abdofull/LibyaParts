// =====================================================
// ملف JavaScript للمصادقة - Authentication JS
// يتعامل مع تسجيل الدخول وإنشاء الحسابات
// =====================================================

// =====================================================
// المتغيرات العامة
// =====================================================

// عنوان الـ API الأساسي
const API_URL = '';

// التبويب النشط حالياً (login أو register)
let currentTab = 'login';

// الدور المختار (زبون أو تاجر)
let selectedRole = 'زبون';

// =====================================================
// التحقق من حالة تسجيل الدخول عند تحميل الصفحة
// إذا كان المستخدم مسجلاً، يتم توجيهه تلقائياً
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من وجود رمز JWT في التخزين المحلي
    checkAuthStatus();
});

// =====================================================
// دالة التحقق من حالة المصادقة
// تتحقق من وجود token وتوجه المستخدم للصفحة المناسبة
// =====================================================
async function checkAuthStatus() {
    // جلب الرمز من التخزين المحلي
    const token = localStorage.getItem('token');

    // إذا لم يوجد رمز، لا نفعل شيئاً (المستخدم على صفحة الدخول)
    if (!token) return;

    try {
        // محاولة جلب بيانات المستخدم باستخدام الرمز
        const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // إذا نجح الطلب، توجيه المستخدم حسب صلاحياته
        if (response.data.success) {
            redirectUser(response.data.user);
        }
    } catch (error) {
        // إذا فشل الطلب، حذف الرمز القديم
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}

// =====================================================
// دالة توجيه المستخدم حسب دوره وصلاحياته
// المدير -> لوحة المدير | التاجر -> لوحة التحكم | الزبون -> الصفحة الرئيسية
// =====================================================
function redirectUser(user) {
    // التأخير قليلاً لإظهار رسالة النجاح
    setTimeout(() => {
        // إذا كان المستخدم هو المدير
        if (user.isAdmin) {
            window.location.href = '/superadmin.html';
        }
        // إذا كان تاجر
        else if (user.role === 'تاجر') {
            // التحقق من الموافقة
            if (user.isApproved) {
                window.location.href = '/dashboard.html';
            } else {
                window.location.href = '/pending.html';
            }
        }
        // الزبون يذهب للصفحة الرئيسية
        else {
            window.location.href = '/index.html';
        }
    }, 1000);
}

// =====================================================
// دالة التبديل بين تبويبات الدخول والتسجيل
// =====================================================
function switchTab(tab) {
    // تحديث التبويب النشط
    currentTab = tab;

    // العناصر المطلوبة
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
        // تفعيل تبويب الدخول
        loginTab.classList.add('bg-gradient-to-l', 'from-blue-500', 'to-green-500');
        loginTab.classList.remove('text-gray-400');
        loginTab.classList.add('text-white');

        // إلغاء تفعيل تبويب التسجيل
        registerTab.classList.remove('bg-gradient-to-l', 'from-blue-500', 'to-green-500');
        registerTab.classList.add('text-gray-400');
        registerTab.classList.remove('text-white');

        // إظهار نموذج الدخول وإخفاء التسجيل
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        // تفعيل تبويب التسجيل
        registerTab.classList.add('bg-gradient-to-l', 'from-blue-500', 'to-green-500');
        registerTab.classList.remove('text-gray-400');
        registerTab.classList.add('text-white');

        // إلغاء تفعيل تبويب الدخول
        loginTab.classList.remove('bg-gradient-to-l', 'from-blue-500', 'to-green-500');
        loginTab.classList.add('text-gray-400');
        loginTab.classList.remove('text-white');

        // إظهار نموذج التسجيل وإخفاء الدخول
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

// =====================================================
// دالة اختيار نوع الحساب (تاجر/زبون)
// =====================================================
function selectRole(role) {
    // تحديث الدور المختار
    selectedRole = role;

    // تحديث قيمة الحقل المخفي
    document.getElementById('register-role').value = role;

    // العناصر المطلوبة
    const customerBtn = document.getElementById('role-customer');
    const merchantBtn = document.getElementById('role-merchant');

    if (role === 'زبون') {
        // تفعيل زر الزبون
        customerBtn.classList.add('active');
        customerBtn.querySelector('i').classList.remove('text-gray-400');
        customerBtn.querySelector('i').classList.add('text-white');
        customerBtn.querySelector('span').classList.remove('text-gray-400');
        customerBtn.querySelector('span').classList.add('text-white');

        // إلغاء تفعيل زر التاجر
        merchantBtn.classList.remove('active');
        merchantBtn.querySelector('i').classList.add('text-gray-400');
        merchantBtn.querySelector('i').classList.remove('text-white');
        merchantBtn.querySelector('span:first-of-type').classList.add('text-gray-400');
        merchantBtn.querySelector('span:first-of-type').classList.remove('text-white');
    } else {
        // تفعيل زر التاجر
        merchantBtn.classList.add('active');
        merchantBtn.querySelector('i').classList.remove('text-gray-400');
        merchantBtn.querySelector('i').classList.add('text-white');
        merchantBtn.querySelector('span:first-of-type').classList.remove('text-gray-400');
        merchantBtn.querySelector('span:first-of-type').classList.add('text-white');

        // إلغاء تفعيل زر الزبون
        customerBtn.classList.remove('active');
        customerBtn.querySelector('i').classList.add('text-gray-400');
        customerBtn.querySelector('i').classList.remove('text-white');
        customerBtn.querySelector('span:first-of-type').classList.add('text-gray-400');
        customerBtn.querySelector('span:first-of-type').classList.remove('text-white');
    }
}

// =====================================================
// دالة إظهار/إخفاء كلمة المرور
// =====================================================
function togglePassword(inputId) {
    // جلب حقل الإدخال
    const input = document.getElementById(inputId);

    // جلب الأيقونة
    const icon = input.nextElementSibling.querySelector('i');

    // تبديل نوع الحقل
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// =====================================================
// دالة إظهار Toast Notification
// =====================================================
function showToast(message, type = 'success') {
    // جلب حاوية التوست
    const container = document.getElementById('toast-container');

    // إنشاء عنصر التوست
    const toast = document.createElement('div');

    // تحديد الألوان حسب النوع
    const bgColor = type === 'success' ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

    // إضافة الكلاسات والمحتوى
    toast.className = `toast bg-gradient-to-l ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]`;
    toast.innerHTML = `
        <i class="fas ${icon} text-xl"></i>
        <span class="font-semibold">${message}</span>
    `;

    // إضافة التوست للحاوية
    container.appendChild(toast);

    // إزالة التوست بعد 4 ثواني
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// =====================================================
// دالة تفعيل/تعطيل حالة التحميل على الزر
// =====================================================
function setLoading(button, isLoading) {
    if (isLoading) {
        // حفظ النص الأصلي
        button.dataset.originalText = button.innerHTML;

        // إظهار حالة التحميل
        button.innerHTML = '<div class="spinner mx-auto"></div>';
        button.disabled = true;
    } else {
        // إرجاع النص الأصلي
        button.innerHTML = button.dataset.originalText;
        button.disabled = false;
    }
}

// =====================================================
// معالج نموذج تسجيل الدخول
// =====================================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    // منع الإرسال الافتراضي للنموذج
    e.preventDefault();

    // جلب الزر وتفعيل حالة التحميل
    const btn = document.getElementById('login-btn');
    setLoading(btn, true);

    // جلب البيانات من الحقول
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        // إرسال طلب تسجيل الدخول للخادم
        const response = await axios.post(`${API_URL}/api/auth/login`, {
            email,
            password
        });

        // التحقق من نجاح الطلب
        if (response.data.success) {
            // حفظ الرمز وبيانات المستخدم في التخزين المحلي
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // إظهار رسالة نجاح
            showToast('تم تسجيل الدخول بنجاح!', 'success');

            // توجيه المستخدم حسب صلاحياته
            redirectUser(response.data.user);
        }
    } catch (error) {
        // إظهار رسالة الخطأ
        const message = error.response?.data?.message || 'حدث خطأ في تسجيل الدخول';
        showToast(message, 'error');
    } finally {
        // إلغاء حالة التحميل
        setLoading(btn, false);
    }
});

// =====================================================
// معالج نموذج إنشاء حساب جديد
// =====================================================
document.getElementById('register-form').addEventListener('submit', async (e) => {
    // منع الإرسال الافتراضي للنموذج
    e.preventDefault();

    // جلب الزر وتفعيل حالة التحميل
    const btn = document.getElementById('register-btn');
    setLoading(btn, true);

    // جلب البيانات من الحقول
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    try {
        // إرسال طلب إنشاء الحساب للخادم
        const response = await axios.post(`${API_URL}/api/auth/register`, {
            name,
            email,
            phone,
            password,
            role
        });

        // التحقق من نجاح الطلب
        if (response.data.success) {
            // حفظ الرمز وبيانات المستخدم في التخزين المحلي
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // إظهار رسالة نجاح
            showToast('تم إنشاء الحساب بنجاح!', 'success');

            // توجيه المستخدم حسب صلاحياته
            redirectUser(response.data.user);
        }
    } catch (error) {
        // إظهار رسالة الخطأ
        const message = error.response?.data?.message || 'حدث خطأ في إنشاء الحساب';
        showToast(message, 'error');
    } finally {
        // إلغاء حالة التحميل
        setLoading(btn, false);
    }
});
