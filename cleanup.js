// =====================================================
// أداة تنظيف قاعدة البيانات - Database Cleanup Tool
// تستخدم لحذف البيانات (المستخدمين، القطع، الطلبات)
// =====================================================

const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// استيراد النماذج
const User = require('./models/User');
const Part = require('./models/Part');
const Request = require('./models/Request');

// إعداد واجهة لقراءة المدخلات من سطر الأوامر
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// بريد المدير للاستثناء من الحذف
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'abdo2002@gmail.com';

// دالة الاتصال بقاعدة البيانات
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ تم الاتصال بقاعدة البيانات');
    } catch (error) {
        console.error('❌ خطأ في الاتصال:', error.message);
        process.exit(1);
    }
};

// دالة حذف المستخدمين
const cleanUsers = async () => {
    try {
        // حذف جميع المستخدمين عدا المدير
        const result = await User.deleteMany({ email: { $ne: ADMIN_EMAIL } });
        console.log(`✅ تم حذف ${result.deletedCount} مستخدم (تم استثناء المدير)`);
    } catch (error) {
        console.error('❌ خطأ في حذف المستخدمين:', error.message);
    }
};

// دالة حذف القطع
const cleanParts = async () => {
    try {
        const result = await Part.deleteMany({});
        console.log(`✅ تم حذف ${result.deletedCount} قطعة`);
    } catch (error) {
        console.error('❌ خطأ في حذف القطع:', error.message);
    }
};

// دالة حذف الطلبات
const cleanRequests = async () => {
    try {
        const result = await Request.deleteMany({});
        console.log(`✅ تم حذف ${result.deletedCount} طلب`);
    } catch (error) {
        console.error('❌ خطأ في حذف الطلبات:', error.message);
    }
};

// الدالة الرئيسية
const main = async () => {
    await connectDB();

    console.log('\n--- أداة تنظيف قاعدة البيانات ---');
    console.log('1. حذف كل البيانات (المستخدمين، القطع، الطلبات)');
    console.log('2. حذف المستخدمين فقط (عدا المدير)');
    console.log('3. حذف القطع فقط');
    console.log('4. حذف الطلبات فقط');
    console.log('0. خروج');

    rl.question('\n> اختر عملية (0-4): ', async (answer) => {
        switch (answer.trim()) {
            case '1':
                await cleanUsers();
                await cleanParts();
                await cleanRequests();
                break;
            case '2':
                await cleanUsers();
                break;
            case '3':
                await cleanParts();
                break;
            case '4':
                await cleanRequests();
                break;
            case '0':
                console.log('👋 إلى اللقاء');
                break;
            default:
                console.log('❌ خيار غير صحيح');
        }

        await mongoose.disconnect();
        rl.close();
        process.exit(0);
    });
};

// تشغيل البرنامج
main();
