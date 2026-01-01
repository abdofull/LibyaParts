// =====================================================
// الخادم الرئيسي - Main Server
// هذا الملف هو قلب التطبيق ويحتوي على:
// - اتصال قاعدة البيانات MongoDB Atlas
// - إعدادات Express والـ Middleware
// - مسارات API للمصادقة والقطع والطلبات
// =====================================================

// =====================================================
// استيراد المكتبات والوحدات الضرورية
// =====================================================

// تحميل متغيرات البيئة من ملف .env
require('dotenv').config();

// استيراد Express لإنشاء الخادم
const express = require('express');

// استيراد Mongoose للتعامل مع MongoDB
const mongoose = require('mongoose');

// استيراد JWT لإنشاء والتحقق من الرموز المميزة
const jwt = require('jsonwebtoken');

// استيراد bcryptjs لتشفير كلمات المرور
const bcrypt = require('bcryptjs');

// استيراد CORS للسماح بالطلبات من مصادر مختلفة
const cors = require('cors');

// استيراد path للتعامل مع مسارات الملفات
const path = require('path');

// =====================================================
// استيراد نماذج قاعدة البيانات
// =====================================================

// نموذج المستخدم (تاجر أو زبون)
const User = require('./models/User');

// نموذج القطعة
const Part = require('./models/Part');

// نموذج طلب القطعة
const Request = require('./models/Request');

// =====================================================
// إنشاء تطبيق Express
// =====================================================
const app = express();

// =====================================================
// إعداد الـ Middleware
// =====================================================

// تفعيل CORS للسماح بالطلبات من أي مصدر
app.use(cors());

// تحليل JSON في جسم الطلبات مع حد أقصى 10MB للصور Base64
app.use(express.json({ limit: '10mb' }));

// تحليل البيانات المشفرة في URL
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// تقديم الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// =====================================================
// الاتصال بقاعدة البيانات MongoDB Atlas
// =====================================================
const connectDB = async () => {
    try {
        // محاولة الاتصال بقاعدة البيانات
        await mongoose.connect(process.env.MONGODB_URI);

        // طباعة رسالة نجاح الاتصال
        console.log('✅ تم الاتصال بقاعدة البيانات MongoDB Atlas بنجاح');
    } catch (error) {
        // طباعة رسالة الخطأ في حالة فشل الاتصال
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);

        // إنهاء العملية في حالة الفشل
        process.exit(1);
    }
};

// تنفيذ دالة الاتصال
connectDB();

// =====================================================
// Middleware للتحقق من المصادقة (JWT)
// يتم استخدامه لحماية المسارات التي تتطلب تسجيل دخول
// =====================================================
const authMiddleware = async (req, res, next) => {
    try {
        // استخراج الرمز من ترويسة Authorization
        const token = req.header('Authorization')?.replace('Bearer ', '');

        // التحقق من وجود الرمز
        if (!token) {
            // إرجاع خطأ إذا لم يوجد رمز
            return res.status(401).json({
                success: false,
                message: 'الوصول مرفوض. الرجاء تسجيل الدخول'
            });
        }

        // التحقق من صحة الرمز وفك تشفيره
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // البحث عن المستخدم في قاعدة البيانات
        const user = await User.findById(decoded.userId);

        // التحقق من وجود المستخدم
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // إضافة بيانات المستخدم للطلب
        req.user = user;

        // الانتقال للخطوة التالية
        next();
    } catch (error) {
        // إرجاع خطأ في حالة فشل التحقق
        res.status(401).json({
            success: false,
            message: 'رمز غير صالح'
        });
    }
};

// =====================================================
// Middleware للتحقق من صلاحية التاجر
// يستخدم بعد authMiddleware للتأكد أن المستخدم تاجر
// =====================================================
const merchantOnly = (req, res, next) => {
    // التحقق من أن دور المستخدم هو تاجر
    if (req.user.role !== 'تاجر') {
        return res.status(403).json({
            success: false,
            message: 'هذه الصفحة متاحة للتجار فقط'
        });
    }
    // الانتقال للخطوة التالية
    next();
};

// =====================================================
// مسارات المصادقة - Authentication Routes
// =====================================================

// ----- تسجيل مستخدم جديد -----
app.post('/api/auth/register', async (req, res) => {
    try {
        // استخراج البيانات من جسم الطلب
        const { name, email, password, phone, role } = req.body;

        // التحقق من وجود جميع البيانات المطلوبة
        if (!name || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة'
            });
        }

        // التحقق من عدم وجود مستخدم بنفس البريد الإلكتروني
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني مستخدم مسبقاً'
            });
        }

        // إنشاء مستخدم جديد
        const user = new User({
            name,
            email,
            password,
            phone,
            role: role || 'زبون' // القيمة الافتراضية هي زبون
        });

        // حفظ المستخدم في قاعدة البيانات
        await user.save();

        // إنشاء رمز JWT
        const token = jwt.sign(
            { userId: user._id }, // البيانات المُشفرة
            process.env.JWT_SECRET, // المفتاح السري
            { expiresIn: '7d' } // صلاحية الرمز: 7 أيام
        );

        // إرجاع الاستجابة الناجحة
        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        // إرجاع خطأ في حالة الفشل
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم',
            error: error.message
        });
    }
});

// ----- تسجيل الدخول -----
app.post('/api/auth/login', async (req, res) => {
    try {
        // استخراج البيانات من جسم الطلب
        const { email, password } = req.body;

        // التحقق من وجود البيانات
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني وكلمة المرور مطلوبان'
            });
        }

        // البحث عن المستخدم مع تضمين كلمة المرور
        const user = await User.findOne({ email }).select('+password');

        // التحقق من وجود المستخدم
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        // التحقق من صحة كلمة المرور
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        // إنشاء رمز JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // إرجاع الاستجابة الناجحة
        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم',
            error: error.message
        });
    }
});

// ----- جلب بيانات المستخدم الحالي -----
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        // إرجاع بيانات المستخدم
        res.json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone,
                role: req.user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =====================================================
// مسارات القطع - Parts Routes
// =====================================================

// ----- جلب جميع القطع (متاح للجميع) -----
app.get('/api/parts', async (req, res) => {
    try {
        // استخراج معايير البحث من الاستعلام
        const { search, carMake, carModel, carYear, category } = req.query;

        // بناء كائن الفلترة
        let filter = { status: 'متوفرة' };

        // إضافة فلتر البحث النصي
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { carMake: { $regex: search, $options: 'i' } },
                { carModel: { $regex: search, $options: 'i' } }
            ];
        }

        // إضافة فلتر ماركة السيارة
        if (carMake) {
            filter.carMake = { $regex: carMake, $options: 'i' };
        }

        // إضافة فلتر موديل السيارة
        if (carModel) {
            filter.carModel = { $regex: carModel, $options: 'i' };
        }

        // إضافة فلتر سنة السيارة
        if (carYear) {
            filter.carYear = carYear;
        }

        // إضافة فلتر التصنيف
        if (category) {
            filter.category = category;
        }

        // جلب القطع من قاعدة البيانات مع الترتيب
        const parts = await Part.find(filter)
            .sort({ isFeatured: -1, createdAt: -1 }) // المميزة أولاً ثم الأحدث
            .limit(100); // حد أقصى 100 قطعة

        // إرجاع القطع
        res.json({
            success: true,
            count: parts.length,
            parts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب القطع'
        });
    }
});

// ----- جلب قطع التاجر الحالي -----
app.get('/api/parts/my', authMiddleware, merchantOnly, async (req, res) => {
    try {
        // جلب قطع التاجر فقط
        const parts = await Part.find({ merchantId: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: parts.length,
            parts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب القطع'
        });
    }
});

// ----- إضافة قطعة جديدة (للتجار فقط) -----
app.post('/api/parts', authMiddleware, merchantOnly, async (req, res) => {
    try {
        // استخراج البيانات من جسم الطلب
        const { name, description, category, price, imageUrl, carMake, carModel, carYear, isFeatured } = req.body;

        // التحقق من البيانات المطلوبة
        if (!name || !category || !price || !carMake || !carModel) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول المطلوبة يجب تعبئتها'
            });
        }

        // التحقق من حجم الصورة (الحد الأقصى 1MB)
        if (imageUrl && imageUrl.length > 1400000) { // ~1MB in Base64
            return res.status(400).json({
                success: false,
                message: 'حجم الصورة يجب ألا يتجاوز 1 ميجابايت'
            });
        }

        // إنشاء قطعة جديدة
        const part = new Part({
            name,
            description,
            category,
            price,
            imageUrl,
            carMake,
            carModel,
            carYear,
            isFeatured: isFeatured || false,
            merchantId: req.user._id,
            merchantName: req.user.name,
            merchantPhone: req.user.phone
        });

        // حفظ القطعة
        await part.save();

        res.status(201).json({
            success: true,
            message: 'تمت إضافة القطعة بنجاح',
            part
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إضافة القطعة',
            error: error.message
        });
    }
});

// ----- تحديث قطعة (للتاجر صاحب القطعة فقط) -----
app.put('/api/parts/:id', authMiddleware, merchantOnly, async (req, res) => {
    try {
        // البحث عن القطعة
        const part = await Part.findById(req.params.id);

        // التحقق من وجود القطعة
        if (!part) {
            return res.status(404).json({
                success: false,
                message: 'القطعة غير موجودة'
            });
        }

        // التحقق من ملكية القطعة
        if (part.merchantId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بتعديل هذه القطعة'
            });
        }

        // تحديث القطعة
        const updatedPart = await Part.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'تم تحديث القطعة بنجاح',
            part: updatedPart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في تحديث القطعة'
        });
    }
});

// ----- حذف قطعة (للتاجر صاحب القطعة فقط) -----
app.delete('/api/parts/:id', authMiddleware, merchantOnly, async (req, res) => {
    try {
        // البحث عن القطعة
        const part = await Part.findById(req.params.id);

        // التحقق من وجود القطعة
        if (!part) {
            return res.status(404).json({
                success: false,
                message: 'القطعة غير موجودة'
            });
        }

        // التحقق من ملكية القطعة
        if (part.merchantId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بحذف هذه القطعة'
            });
        }

        // حذف القطعة
        await Part.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'تم حذف القطعة بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في حذف القطعة'
        });
    }
});

// =====================================================
// مسارات الطلبات - Requests Routes
// =====================================================

// ----- إنشاء طلب جديد (للزبائن) -----
app.post('/api/requests', async (req, res) => {
    try {
        // استخراج البيانات
        const { customerName, customerPhone, partName, carMake, carModel, carYear, notes } = req.body;

        // التحقق من البيانات المطلوبة
        if (!customerName || !customerPhone || !partName || !carMake || !carModel) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول المطلوبة يجب تعبئتها'
            });
        }

        // إنشاء طلب جديد
        const request = new Request({
            customerName,
            customerPhone,
            partName,
            carMake,
            carModel,
            carYear,
            notes
        });

        // حفظ الطلب
        await request.save();

        res.status(201).json({
            success: true,
            message: 'تم إرسال طلبك بنجاح. سيتواصل معك التجار قريباً',
            request
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إرسال الطلب'
        });
    }
});

// ----- جلب جميع الطلبات (للتجار فقط) -----
app.get('/api/requests', authMiddleware, merchantOnly, async (req, res) => {
    try {
        // جلب الطلبات مرتبة من الأحدث للأقدم
        const requests = await Request.find()
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب الطلبات'
        });
    }
});

// ----- تحديث حالة الطلب (للتجار فقط) -----
app.put('/api/requests/:id', authMiddleware, merchantOnly, async (req, res) => {
    try {
        const { status } = req.body;

        const request = await Request.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث حالة الطلب',
            request
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في تحديث الطلب'
        });
    }
});

// =====================================================
// مسار الإحصائيات للتاجر
// =====================================================
app.get('/api/stats', authMiddleware, merchantOnly, async (req, res) => {
    try {
        // عدد قطع التاجر
        const partsCount = await Part.countDocuments({ merchantId: req.user._id });

        // عدد الطلبات الجديدة
        const newRequestsCount = await Request.countDocuments({ status: 'جديد' });

        // عدد جميع الطلبات
        const totalRequestsCount = await Request.countDocuments();

        res.json({
            success: true,
            stats: {
                partsCount,
                newRequestsCount,
                totalRequestsCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب الإحصائيات'
        });
    }
});

// =====================================================
// توجيه الصفحات الثابتة
// =====================================================

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// صفحة تسجيل الدخول
app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

// لوحة تحكم التاجر
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// =====================================================
// التعامل مع المسارات غير الموجودة
// =====================================================
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'الصفحة غير موجودة'
    });
});

// =====================================================
// تشغيل الخادم
// =====================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(`📍 افتح http://localhost:${PORT} في المتصفح`);
});
