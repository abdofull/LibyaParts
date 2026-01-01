// =====================================================
// ملف JavaScript للوحة تحكم التاجر - Admin Dashboard JS
// يتعامل مع إدارة القطع والطلبات
// =====================================================

// =====================================================
// المتغيرات العامة
// =====================================================

// عنوان الـ API الأساسي
const API_URL = '';

// التبويب النشط حالياً
let currentTab = 'inventory';

// رمز JWT للمصادقة
let authToken = '';

// =====================================================
// تهيئة الصفحة عند التحميل
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من صلاحيات الوصول
    checkMerchantAccess();
});

// =====================================================
// دالة التحقق من صلاحيات التاجر
// تتأكد أن المستخدم تاجر مسجل دخوله
// =====================================================
async function checkMerchantAccess() {
    // جلب الرمز من التخزين المحلي
    authToken = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // التحقق من وجود الرمز
    if (!authToken) {
        // توجيه لصفحة تسجيل الدخول
        window.location.href = '/auth.html';
        return;
    }

    // التحقق من أن المستخدم تاجر
    if (user.role !== 'تاجر') {
        // إظهار رسالة خطأ
        showToast('هذه الصفحة متاحة للتجار فقط', 'error');

        // توجيه للصفحة الرئيسية
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
        return;
    }

    // عرض اسم التاجر
    document.getElementById('merchant-name').textContent = user.name || 'التاجر';

    // تحميل البيانات
    loadStats();
    loadMyParts();
    loadRequests();
}

// =====================================================
// دالة تسجيل الخروج
// =====================================================
function logout() {
    // حذف بيانات المستخدم من التخزين المحلي
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // توجيه لصفحة تسجيل الدخول
    window.location.href = '/auth.html';
}

// =====================================================
// دالة تحميل الإحصائيات
// =====================================================
async function loadStats() {
    try {
        // إرسال طلب للخادم
        const response = await axios.get(`${API_URL}/api/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        // تحديث العناصر
        if (response.data.success) {
            const stats = response.data.stats;
            document.getElementById('stat-parts').textContent = stats.partsCount;
            document.getElementById('stat-new-requests').textContent = stats.newRequestsCount;
            document.getElementById('stat-total-requests').textContent = stats.totalRequestsCount;

            // تحديث شارة الطلبات الجديدة
            const badge = document.getElementById('requests-badge');
            if (stats.newRequestsCount > 0) {
                badge.textContent = stats.newRequestsCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
    }
}

// =====================================================
// دالة تحميل قطع التاجر
// =====================================================
async function loadMyParts() {
    // إظهار حالة التحميل
    document.getElementById('parts-loading').classList.remove('hidden');
    document.getElementById('parts-empty').classList.add('hidden');
    document.getElementById('my-parts-grid').innerHTML = '';

    try {
        // إرسال طلب للخادم
        const response = await axios.get(`${API_URL}/api/parts/my`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        // إخفاء حالة التحميل
        document.getElementById('parts-loading').classList.add('hidden');

        const parts = response.data.parts || [];

        // تحديث العداد
        document.getElementById('my-parts-count').textContent = `(${parts.length})`;

        // عرض القطع أو حالة الفراغ
        if (parts.length === 0) {
            document.getElementById('parts-empty').classList.remove('hidden');
        } else {
            renderMyParts(parts);
        }
    } catch (error) {
        document.getElementById('parts-loading').classList.add('hidden');
        document.getElementById('parts-empty').classList.remove('hidden');
        showToast('حدث خطأ في تحميل القطع', 'error');
    }
}

// =====================================================
// دالة عرض قطع التاجر
// =====================================================
function renderMyParts(parts) {
    // جلب الحاوية
    const grid = document.getElementById('my-parts-grid');
    grid.innerHTML = '';

    // إنشاء بطاقة لكل قطعة
    parts.forEach(part => {
        const card = document.createElement('div');
        card.className = 'glass-card rounded-xl overflow-hidden';

        // صورة افتراضية
        const imageUrl = part.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMyMDIwMzAiLz48cGF0aCBkPSJNMTAwIDcwQzg1IDcwIDczIDgyIDczIDk3QzczIDExMiA4NSAxMjQgMTAwIDEyNEMxMTUgMTI0IDEyNyAxMTIgMTI3IDk3QzEyNyA4MiAxMTUgNzAgMTAwIDcwWiIgc3Ryb2tlPSIjNDA0MDUwIiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI5NyIgcj0iNCIgZmlsbD0iIzQwNDA1MCIvPjwvc3ZnPg==';

        card.innerHTML = `
            <!-- صورة القطعة -->
            <div class="relative h-32 bg-gradient-to-br from-gray-800 to-gray-900">
                <img src="${imageUrl}" alt="${part.name}" class="w-full h-full object-cover">
                ${part.isFeatured ? `
                    <div class="absolute top-2 right-2 bg-green-500 px-2 py-0.5 rounded text-white text-xs font-bold">
                        ⭐ مميز
                    </div>
                ` : ''}
            </div>
            
            <!-- معلومات القطعة -->
            <div class="p-4">
                <h3 class="font-bold text-white mb-1 truncate">${part.name}</h3>
                <p class="text-gray-400 text-sm mb-2">${part.carMake} ${part.carModel}</p>
                <div class="flex items-center justify-between">
                    <span class="text-green-400 font-bold">${part.price.toLocaleString()} د.ل</span>
                    <button onclick="deletePart('${part._id}')" 
                        class="text-red-400 hover:text-red-300 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

// =====================================================
// دالة تحميل الطلبات
// =====================================================
async function loadRequests() {
    // إظهار حالة التحميل
    document.getElementById('requests-loading').classList.remove('hidden');
    document.getElementById('requests-empty').classList.add('hidden');
    document.getElementById('requests-list').innerHTML = '';

    try {
        // إرسال طلب للخادم
        const response = await axios.get(`${API_URL}/api/requests`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        // إخفاء حالة التحميل
        document.getElementById('requests-loading').classList.add('hidden');

        const requests = response.data.requests || [];

        // تحديث العداد
        document.getElementById('requests-count').textContent = `(${requests.length})`;

        // عرض الطلبات أو حالة الفراغ
        if (requests.length === 0) {
            document.getElementById('requests-empty').classList.remove('hidden');
        } else {
            renderRequests(requests);
        }
    } catch (error) {
        document.getElementById('requests-loading').classList.add('hidden');
        document.getElementById('requests-empty').classList.remove('hidden');
        showToast('حدث خطأ في تحميل الطلبات', 'error');
    }
}

// =====================================================
// دالة عرض الطلبات
// =====================================================
function renderRequests(requests) {
    // جلب الحاوية
    const list = document.getElementById('requests-list');
    list.innerHTML = '';

    // إنشاء بطاقة لكل طلب
    requests.forEach(request => {
        const card = document.createElement('div');
        card.className = 'glass-card rounded-xl p-4';

        // تحديد لون الحالة
        let statusClass = 'status-new';
        if (request.status === 'قيد المعالجة') statusClass = 'status-processing';
        if (request.status === 'تم الرد' || request.status === 'مكتمل') statusClass = 'status-done';

        // تنسيق التاريخ
        const date = new Date(request.createdAt);
        const formattedDate = date.toLocaleDateString('ar-LY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        card.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <!-- معلومات الطلب -->
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <span class="${statusClass} px-3 py-1 rounded-full text-white text-sm font-bold">
                            ${request.status}
                        </span>
                        <span class="text-gray-500 text-sm">${formattedDate}</span>
                    </div>
                    
                    <h3 class="font-bold text-white text-lg mb-1">
                        <i class="fas fa-cog ml-2 text-blue-400"></i>
                        ${request.partName}
                    </h3>
                    
                    <p class="text-gray-400 mb-2">
                        <i class="fas fa-car ml-2"></i>
                        ${request.carMake} ${request.carModel} ${request.carYear || ''}
                    </p>
                    
                    <div class="flex items-center gap-4 text-sm">
                        <span class="text-gray-300">
                            <i class="fas fa-user ml-1 text-green-400"></i>
                            ${request.customerName}
                        </span>
                        <span class="text-gray-300">
                            <i class="fas fa-phone ml-1 text-green-400"></i>
                            ${request.customerPhone}
                        </span>
                    </div>
                    
                    ${request.notes ? `
                        <p class="text-gray-500 text-sm mt-2">
                            <i class="fas fa-comment ml-1"></i>
                            ${request.notes}
                        </p>
                    ` : ''}
                </div>
                
                <!-- أزرار الإجراءات -->
                <div class="flex gap-2">
                    <button onclick="contactCustomer('${request.customerPhone}', '${request.partName}')"
                        class="btn-whatsapp px-4 py-2 rounded-xl font-bold text-white flex items-center gap-2">
                        <i class="fab fa-whatsapp"></i>
                        <span>تواصل</span>
                    </button>
                    
                    <button onclick="updateRequestStatus('${request._id}', 'تم الرد')"
                        class="glass-card px-4 py-2 rounded-xl text-gray-300 hover:text-white transition-colors">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
        `;

        list.appendChild(card);
    });
}

// =====================================================
// دالة التواصل مع الزبون عبر WhatsApp
// =====================================================
function contactCustomer(phone, partName) {
    // تنظيف رقم الهاتف
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '218' + cleanPhone.substring(1);
    }

    // إنشاء نص الرسالة
    const message = `السلام عليكم،\n\nتلقينا طلبك بخصوص: ${partName}\n\nنحن نتواصل معك من منصة LibyaParts.\n\nكيف يمكننا مساعدتك؟`;

    // فتح WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// =====================================================
// دالة تحديث حالة الطلب
// =====================================================
async function updateRequestStatus(requestId, status) {
    try {
        await axios.put(`${API_URL}/api/requests/${requestId}`,
            { status },
            { headers: { 'Authorization': `Bearer ${authToken}` } }
        );

        showToast('تم تحديث حالة الطلب', 'success');
        loadRequests();
        loadStats();
    } catch (error) {
        showToast('حدث خطأ في تحديث الطلب', 'error');
    }
}

// =====================================================
// دالة حذف قطعة
// =====================================================
async function deletePart(partId) {
    // تأكيد الحذف
    if (!confirm('هل أنت متأكد من حذف هذه القطعة؟')) {
        return;
    }

    try {
        await axios.delete(`${API_URL}/api/parts/${partId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        showToast('تم حذف القطعة بنجاح', 'success');
        loadMyParts();
        loadStats();
    } catch (error) {
        showToast('حدث خطأ في حذف القطعة', 'error');
    }
}

// =====================================================
// دالة التبديل بين التبويبات
// =====================================================
function switchTab(tab) {
    currentTab = tab;

    const inventoryTab = document.getElementById('tab-inventory');
    const requestsTab = document.getElementById('tab-requests');
    const inventorySection = document.getElementById('inventory-section');
    const requestsSection = document.getElementById('requests-section');

    if (tab === 'inventory') {
        inventoryTab.classList.add('active');
        inventoryTab.classList.remove('glass-card', 'text-gray-400');
        inventoryTab.classList.add('text-white');

        requestsTab.classList.remove('active');
        requestsTab.classList.add('glass-card', 'text-gray-400');
        requestsTab.classList.remove('text-white');

        inventorySection.classList.remove('hidden');
        requestsSection.classList.add('hidden');
    } else {
        requestsTab.classList.add('active');
        requestsTab.classList.remove('glass-card', 'text-gray-400');
        requestsTab.classList.add('text-white');

        inventoryTab.classList.remove('active');
        inventoryTab.classList.add('glass-card', 'text-gray-400');
        inventoryTab.classList.remove('text-white');

        requestsSection.classList.remove('hidden');
        inventorySection.classList.add('hidden');
    }
}

// =====================================================
// دالة معاينة الصورة قبل الرفع
// =====================================================
function previewImage(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        // التحقق من حجم الصورة (الحد الأقصى 1MB)
        if (file.size > 1048576) {
            showToast('حجم الصورة يجب ألا يتجاوز 1 ميجابايت', 'error');
            input.value = '';
            return;
        }

        // قراءة الملف كـ Base64
        const reader = new FileReader();

        reader.onload = function (e) {
            // عرض المعاينة
            document.getElementById('image-preview').src = e.target.result;
            document.getElementById('image-preview-container').classList.remove('hidden');

            // حفظ Base64 في الحقل المخفي
            document.getElementById('part-image-base64').value = e.target.result;
        };

        reader.readAsDataURL(file);
    }
}

// =====================================================
// دالة إزالة الصورة المختارة
// =====================================================
function removeImage() {
    document.getElementById('part-image').value = '';
    document.getElementById('part-image-base64').value = '';
    document.getElementById('image-preview-container').classList.add('hidden');
}

// =====================================================
// معالج نموذج إضافة قطعة
// =====================================================
document.getElementById('add-part-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('add-part-btn');
    setLoading(btn, true);

    // جلب البيانات
    const name = document.getElementById('part-name').value;
    const category = document.getElementById('part-category').value;
    const price = document.getElementById('part-price').value;
    const carMake = document.getElementById('part-car-make').value;
    const carModel = document.getElementById('part-car-model').value;
    const carYear = document.getElementById('part-car-year').value;
    const description = document.getElementById('part-description').value;
    const isFeatured = document.getElementById('part-featured').checked;
    const imageUrl = document.getElementById('part-image-base64').value;

    try {
        const response = await axios.post(`${API_URL}/api/parts`, {
            name,
            category,
            price: Number(price),
            carMake,
            carModel,
            carYear,
            description,
            isFeatured,
            imageUrl
        }, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.data.success) {
            showToast('تمت إضافة القطعة بنجاح', 'success');

            // مسح النموذج
            document.getElementById('add-part-form').reset();
            removeImage();

            // إعادة تحميل البيانات
            loadMyParts();
            loadStats();
        }
    } catch (error) {
        const message = error.response?.data?.message || 'حدث خطأ في إضافة القطعة';
        showToast(message, 'error');
    } finally {
        setLoading(btn, false);
    }
});

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

// =====================================================
// دالة تفعيل/تعطيل حالة التحميل
// =====================================================
function setLoading(button, isLoading) {
    if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<div class="spinner mx-auto"></div>';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalText;
        button.disabled = false;
    }
}
