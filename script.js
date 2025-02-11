const storedApps = JSON.parse(localStorage.getItem('apps')) || {};
const apps = mergeApps(appsList, storedApps);

// تعريف الأيقونات الافتراضية لكل فئة
const defaultIcons = {
    browsers: "https://cdn-icons-png.flaticon.com/512/2807/2807714.png",
    gaming: "https://cdn-icons-png.flaticon.com/512/1374/1374723.png",
    programming: "https://cdn-icons-png.flaticon.com/512/1005/1005141.png",
    communication: "https://cdn-icons-png.flaticon.com/512/2343/2343805.png",
    entertainment: "https://cdn-icons-png.flaticon.com/512/2991/2991195.png",
    utility: "https://cdn-icons-png.flaticon.com/512/4149/4149677.png",
    security: "https://cdn-icons-png.flaticon.com/512/2888/2888702.png",
    hardware: "https://cdn-icons-png.flaticon.com/512/3659/3659899.png",
};

// إضافة متغير لتخزين التطبيقات المحددة
let selectedApps = new Set();

// تحميل التطبيقات مع البحث
function loadApps(category = 'all', searchQuery = '') {
    const container = document.querySelector('.apps-container');
    container.innerHTML = '';

    // تجميع كل التطبيقات في مصفوفة واحدة مع إضافة الفئة لكل تطبيق
    let allApps = [];
    for (let categoryName in apps) {
        apps[categoryName].forEach(app => {
            allApps.push({
                ...app,
                category: categoryName
            });
        });
    }

    // تصفية حسب الفئة
    let filteredApps = allApps;
    if (category !== 'all') {
        filteredApps = allApps.filter(app => app.category === category);
    }

    // تصفية حسب البحث
    if (searchQuery) {
        filteredApps = filteredApps.filter(app => 
            app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    // إنشاء بطاقات التطبيقات
    filteredApps.forEach(app => {
        const card = document.createElement('div');
        card.className = `app-card ${selectedApps.has(app.id) ? 'selected' : ''}`;
        card.setAttribute('data-category', app.category);
        card.dataset.appId = app.id;

        card.innerHTML = `
            <div class="app-card-content">
                <p>${app.description}</p>
                <div class="app-card-info">
                    <h3>${app.name}</h3>
                </div>
            </div>
        `;

        // إضافة حدث النقر
        card.addEventListener('click', function() {
            this.classList.toggle('selected');
            if (this.classList.contains('selected')) {
                selectedApps.add(app.id);
            } else {
                selectedApps.delete(app.id);
            }
        });

        container.appendChild(card);
    });
}

function getAppImage(app) {
    if (app.image) {
        // إذا كان للبرنامج صورة خاصة
        return `<img src="${app.image}" alt="${app.name}">`;
    } else if (defaultIcons[app.category]) {
        // إذا لم تكن هناك صورة، استخدم أيقونة الفئة
        return `<img src="${defaultIcons[app.category]}" alt="${app.name}" class="category-icon">`;
    } else {
        // إذا لم تتوفر أيقونة الفئة، استخدم الحرف الأول
        return `<div class="default-app-image">${app.name.charAt(0).toUpperCase()}</div>`;
    }
}

// إضافة مستمع لتحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تحميل التطبيقات
    loadApps();
    
    // إعداد مستمع البحث
    const searchInput = document.querySelector('#poda .input');
    let searchTimeout;
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
                loadApps(activeCategory, e.target.value);
            }, 300);
        });
    }

    // مستمع أحداث التصنيفات
    const categoryButtons = document.querySelectorAll('.category-btn');
    if (categoryButtons.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const category = button.dataset.category;
                const searchValue = searchInput ? searchInput.value : '';
                loadApps(category, searchValue);
            });
        });
    }

    // إعداد أزرار السكربت
    const generateScriptBtn = document.getElementById('generateScript');
    if (generateScriptBtn) {
        generateScriptBtn.addEventListener('click', generateScript);
    }

    // إعداد زر العودة
    const backBtn = document.querySelector('.global-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('scriptSection').classList.add('hidden-section');
            document.getElementById('selectionSection').classList.remove('hidden-section');
        });
    }

    // إعداد أزرار النسخ والحفظ
    const copyBtn = document.querySelector('.copy-btn');
    const saveBtn = document.querySelector('.save-btn');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', copyScript);
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveScript);
    }
});

// إضافة تأثيرات CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// إضافة الدوال الناقصة
function copyScript() {
    const scriptContent = document.querySelector('.script-output').textContent;
    navigator.clipboard.writeText(scriptContent)
        .then(() => alert('تم نسخ السكربت بنجاح!'))
        .catch(err => console.error('فشل النسخ:', err));
}

function saveScript() {
    const scriptContent = document.querySelector('.script-output').textContent;
    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'install-apps.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// تعديل دالة generateScript لتظهر قسم السكربت
function generateScript() {
    if (selectedApps.size === 0) {
        alert('الرجاء تحديد تطبيق واحد على الأقل!');
        return;
    }

    const selectedAppsArray = Array.from(selectedApps);
    let script = '@echo off\n\n';
    
    // تجميع كل التطبيقات المحددة
    selectedAppsArray.forEach(appId => {
        // البحث في جميع الفئات
        for (const category in appsList) {
            const app = appsList[category].find(a => a.id === appId);
            if (app) {
                // إضافة المتطلبات إذا وجدت
                if (app.prerequisites && app.prerequisites.length > 0) {
                    app.prerequisites.forEach(prereq => {
                        script += `winget install -e --id ${prereq}\n`;
                    });
                }
                // إضافة التطبيق نفسه
                script += `winget install -e --id ${app.id}\n`;
                break;
            }
        }
    });
    
    // عرض السكربت وتبديل الأقسام
    document.querySelector('.script-output').textContent = script;
    document.getElementById('selectionSection').classList.add('hidden-section');
    document.getElementById('scriptSection').classList.remove('hidden-section');
}

function getPackageId(appName) {
    // دالة مساعدة للحصول على معرّف الحزمة
    const packageMap = {
        'Google Chrome': 'Google.Chrome',
        'Steam': 'Valve.Steam',
        'Discord': 'Discord.Discord',
        'Visual Studio Code': 'Microsoft.VisualStudioCode',
        'Bitwarden': 'Bitwarden.Bitwarden'
    };
    return packageMap[appName] || appName.replace(/\s+/g, '');
}

// إضافة دالة دمج التطبيقات
function mergeApps(original, stored) {
    const merged = JSON.parse(JSON.stringify(original));
    for (const category in stored) {
        if (!merged[category]) {
            merged[category] = [];
        }
        stored[category].forEach(storedApp => {
            const existingIndex = merged[category].findIndex(a => a.id === storedApp.id);
            if (existingIndex > -1) {
                merged[category][existingIndex] = storedApp;
            } else {
                merged[category].push(storedApp);
            }
        });
    }
    return merged;
}

// إضافة مستمعي الأحداث للتمرير
document.addEventListener('DOMContentLoaded', () => {
    let isScrolling = false;
    let isScrolled = false;

    // تعديل دالة التمرير
    function handleScroll(event) {
        // التحقق مما إذا كان المؤشر فوق مربع التطبيقات
        const appsContainer = document.querySelector('.apps-container');
        if (appsContainer) {
            const rect = appsContainer.getBoundingClientRect();
            const isOverAppsContainer = (
                event.clientX >= rect.left &&
                event.clientX <= rect.right &&
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom
            );

            // إذا كان المؤشر فوق مربع التطبيقات، اسمح بالتمرير الطبيعي
            if (isOverAppsContainer) {
                event.stopPropagation();
                return;
            }
        }

        // وإلا، قم بتنفيذ التمرير للصفحة
        if (!isScrolling) {
            isScrolling = true;
            
            if (event.deltaY > 0 && !isScrolled) {
                document.body.classList.add('scrolled');
                isScrolled = true;
            } else if (event.deltaY < 0 && isScrolled) {
                document.body.classList.remove('scrolled');
                isScrolled = false;
            }

            setTimeout(() => {
                isScrolling = false;
            }, 800);
        }
        event.preventDefault();
    }

    // إضافة مستمع حدث عجلة الماوس
    window.addEventListener('wheel', handleScroll, { passive: false });

    // إضافة مستمع النقر على زر السحب للأسفل
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            if (!isScrolled) {
                document.body.classList.add('scrolled');
                isScrolled = true;
            }
        });
    }
}); 
