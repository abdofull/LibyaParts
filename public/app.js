// =====================================================
// ملف JavaScript للصفحة الرئيسية - Main App JS
// يتعامل مع عرض القطع والبحث وإرسال الطلبات
// =====================================================

// =====================================================
// المتغيرات العامة
// =====================================================

// عنوان الـ API الأساسي
const API_URL = '';

// مصفوفة القطع المحملة
let partsData = [];

// =====================================================
// تهيئة الصفحة عند التحميل
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من حالة تسجيل الدخول
    checkAuthStatus();

    // تحميل القطع من الخادم
    loadParts();

    // إعداد مستمعات الأحداث للبحث
    setupSearchListeners();
});

// =====================================================
// دالة التحقق من حالة المصادقة
// تحديث واجهة المستخدم حسب حالة الدخول
// =====================================================
async function checkAuthStatus() {
    // جلب الرمز من التخزين المحلي
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // العناصر المطلوبة
    const userInfo = document.getElementById('user-info');
    const authBtn = document.getElementById('auth-btn');
    const userName = document.getElementById('user-name');

    if (token && user.name) {
        // إظهار معلومات المستخدم
        userInfo.classList.remove('hidden');
        userInfo.classList.add('flex');
        authBtn.classList.add('hidden');
        userName.textContent = user.name;

        // ملء نموذج الطلب ببيانات المستخدم
        const nameInput = document.getElementById('request-name');
        const phoneInput = document.getElementById('request-phone');

        if (nameInput && user.name) nameInput.value = user.name;
        if (phoneInput && user.phone) phoneInput.value = user.phone;
    } else {
        // إظهار زر تسجيل الدخول
        userInfo.classList.add('hidden');
        authBtn.classList.remove('hidden');
    }
}

// =====================================================
// دالة تسجيل الخروج
// =====================================================
function logout() {
    // حذف بيانات المستخدم من التخزين المحلي
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // إظهار رسالة
    showToast('تم تسجيل الخروج بنجاح', 'success');

    // تحديث الواجهة
    checkAuthStatus();
}

// =====================================================
// دالة تحميل القطع من الخادم
// =====================================================
async function loadParts(filters = {}) {
    // إظهار حالة التحميل
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('parts-grid').innerHTML = '';

    try {
        // بناء معايير البحث
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.carMake) params.append('carMake', filters.carMake);
        if (filters.category) params.append('category', filters.category);

        // إرسال الطلب للخادم
        const response = await axios.get(`${API_URL}/api/parts?${params.toString()}`);

        // حفظ البيانات
        partsData = response.data.parts || [];

        // إخفاء حالة التحميل
        document.getElementById('loading-state').classList.add('hidden');

        // تحديث عداد القطع
        document.getElementById('parts-count').textContent = `(${partsData.length})`;

        // عرض القطع أو حالة الفراغ
        if (partsData.length === 0) {
            document.getElementById('empty-state').classList.remove('hidden');
        } else {
            renderParts(partsData);
        }
    } catch (error) {
        // إخفاء حالة التحميل
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('empty-state').classList.remove('hidden');

        // إظهار رسالة خطأ
        showToast('حدث خطأ في تحميل القطع', 'error');
    }
}

// =====================================================
// دالة عرض القطع في الشبكة
// =====================================================
function renderParts(parts) {
    // جلب حاوية القطع
    const grid = document.getElementById('parts-grid');

    // مسح المحتوى السابق
    grid.innerHTML = '';

    // إنشاء بطاقة لكل قطعة
    parts.forEach(part => {
        // إنشاء عنصر البطاقة
        const card = document.createElement('div');

        // إضافة الكلاسات الأساسية
        card.className = `part-card glass-card rounded-2xl overflow-hidden ${part.isFeatured ? 'glow-green' : 'glow-border'}`;

        // صورة افتراضية إذا لم توجد صورة
        const imageUrl = part.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMyMDIwMzAiLz48cGF0aCBkPSJNMTAwIDcwQzg1IDcwIDczIDgyIDczIDk3QzczIDExMiA4NSAxMjQgMTAwIDEyNEMxMTUgMTI0IDEyNyAxMTIgMTI3IDk3QzEyNyA4MiAxMTUgNzAgMTAwIDcwWiIgc3Ryb2tlPSIjNDA0MDUwIiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI5NyIgcj0iNCIgZmlsbD0iIzQwNDA1MCIvPjwvc3ZnPg==';

        // بناء محتوى البطاقة
        card.innerHTML = `
            <!-- صورة القطعة -->
            <div class="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900">
                <img src="${imageUrl}" alt="${part.name}" 
                    class="w-full h-full object-cover"
                    onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMyMDIwMzAiLz48cGF0aCBkPSJNMTAwIDcwQzg1IDcwIDczIDgyIDczIDk3QzczIDExMiA4NSAxMjQgMTAwIDEyNEMxMTUgMTI0IDEyNyAxMTIgMTI3IDk3QzEyNyA4MiAxMTUgNzAgMTAwIDcwWiIgc3Ryb2tlPSIjNDA0MDUwIiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI5NyIgcj0iNCIgZmlsbD0iIzQwNDA1MCIvPjwvc3ZnPg=='">
                
                <!-- شارة القطعة المميزة -->
                ${part.isFeatured ? `
                    <div class="absolute top-3 right-3 bg-gradient-to-l from-green-500 to-emerald-600 px-3 py-1 rounded-full text-white text-sm font-bold">
                        <i class="fas fa-star ml-1"></i>
                        مميز
                    </div>
                ` : ''}
                
                <!-- شارة التصنيف -->
                <div class="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
                    ${part.category}
                </div>
            </div>
            
            <!-- معلومات القطعة -->
            <div class="p-4">
                <!-- اسم القطعة -->
                <h3 class="text-lg font-bold text-white mb-2 line-clamp-2">${part.name}</h3>
                
                <!-- معلومات السيارة -->
                <div class="flex items-center gap-2 text-gray-400 text-sm mb-3">
                    <i class="fas fa-car"></i>
                    <span>${part.carMake} ${part.carModel} ${part.carYear || ''}</span>
                </div>
                
                <!-- السعر -->
                <div class="flex items-center justify-between mb-4">
                    <div class="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-l from-blue-400 to-green-400">
                        ${part.price.toLocaleString()} د.ل
                    </div>
                </div>
                
                <!-- اسم التاجر -->
                <div class="text-gray-500 text-sm mb-4">
                    <i class="fas fa-store ml-1"></i>
                    ${part.merchantName || 'تاجر'}
                </div>
                
                <!-- زر الطلب عبر WhatsApp -->
                <button onclick="orderViaWhatsApp('${part.merchantPhone}', '${part.name}', '${part.carMake} ${part.carModel}')"
                    class="btn-whatsapp w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2">
                    <i class="fab fa-whatsapp text-xl"></i>
                    <span>طلب عبر واتساب</span>
                </button>
            </div>
        `;

        // إضافة البطاقة للشبكة
        grid.appendChild(card);
    });
}

// =====================================================
// دالة الطلب عبر WhatsApp
// تفتح نافذة محادثة مع رسالة جاهزة
// =====================================================
function orderViaWhatsApp(phone, partName, carInfo) {
    // تنظيف رقم الهاتف (إزالة أول صفر وإضافة كود ليبيا)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '218' + cleanPhone.substring(1);
    }

    // إنشاء نص الرسالة
    const message = `السلام عليكم،\n\nأرغب في الاستفسار عن:\n\n📦 القطعة: ${partName}\n🚗 السيارة: ${carInfo}\n\nهل القطعة متوفرة؟ وما هو السعر النهائي؟\n\nشكراً لكم 🙏`;

    // إنشاء رابط WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    // فتح الرابط في نافذة جديدة
    window.open(whatsappUrl, '_blank');
}

// =====================================================
// دالة البحث عن القطع
// =====================================================
function searchParts() {
    // جلب قيم الفلاتر
    const search = document.getElementById('search-input').value;
    const carMake = document.getElementById('filter-make').value;
    const category = document.getElementById('filter-category').value;

    // تحميل القطع مع الفلاتر
    loadParts({ search, carMake, category });
}

// =====================================================
// إعداد مستمعات أحداث البحث
// =====================================================
function setupSearchListeners() {
    // البحث عند الضغط على Enter
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchParts();
        }
    });

    // البحث التلقائي عند تغيير الفلاتر
    document.getElementById('filter-make').addEventListener('change', searchParts);
    document.getElementById('filter-category').addEventListener('change', searchParts);
}

// =====================================================
// معالج نموذج طلب القطعة
// =====================================================
document.getElementById('request-form').addEventListener('submit', async (e) => {
    // منع الإرسال الافتراضي للنموذج
    e.preventDefault();

    // جلب الزر وتفعيل حالة التحميل
    const btn = document.getElementById('request-btn');
    setLoading(btn, true);

    // جلب البيانات من الحقول
    const customerName = document.getElementById('request-name').value;
    const customerPhone = document.getElementById('request-phone').value;
    const partName = document.getElementById('request-part').value;
    const carMake = document.getElementById('request-make').value;
    const carModel = document.getElementById('request-model').value;
    const carYear = document.getElementById('request-year').value;
    const notes = document.getElementById('request-notes').value;

    try {
        // إرسال الطلب للخادم
        const response = await axios.post(`${API_URL}/api/requests`, {
            customerName,
            customerPhone,
            partName,
            carMake,
            carModel,
            carYear,
            notes
        });

        // التحقق من نجاح الطلب
        if (response.data.success) {
            // إظهار رسالة نجاح
            showToast('تم إرسال طلبك بنجاح! سيتواصل معك التجار قريباً', 'success');

            // مسح حقول النموذج (عدا الاسم والهاتف)
            document.getElementById('request-part').value = '';
            document.getElementById('request-make').value = '';
            document.getElementById('request-model').value = '';
            document.getElementById('request-year').value = '';
            document.getElementById('request-notes').value = '';
        }
    } catch (error) {
        // إظهار رسالة الخطأ
        const message = error.response?.data?.message || 'حدث خطأ في إرسال الطلب';
        showToast(message, 'error');
    } finally {
        // إلغاء حالة التحميل
        setLoading(btn, false);
    }
});

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
