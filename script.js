const storedApps = JSON.parse(localStorage.getItem('apps')) || {};
const apps = mergeApps(appsList, storedApps);

// إضافة كائن يحتوي على الأيقونات الافتراضية لكل تصنيف
const defaultCategoryIcons = {
    "browsers": "https://cdn-icons-png.flaticon.com/512/3178/3178285.png",
    "gaming and emulators": "https://cdn-icons-png.flaticon.com/512/3097/3097980.png",
    "social and entertainment": "https://cdn-icons-png.flaticon.com/512/2065/2065157.png",
    "streaming and audio": "https://cdn-icons-png.flaticon.com/512/9066/9066904.png",
    "programming": "https://cdn-icons-png.flaticon.com/512/1157/1157109.png",
    "hardware": "https://cdn-icons-png.flaticon.com/512/3659/3659899.png",
    "utility": "https://cdn-icons-png.flaticon.com/512/3953/3953226.png"
};

// إضافة متغير لتخزين التطبيقات المحددة
let selectedApps = new Set(JSON.parse(localStorage.getItem('selectedApps')) || []);

// تحميل التطبيقات مع البحث
function loadApps(category = 'all', searchQuery = '') {
    const container = document.querySelector('.apps-container');
    container.innerHTML = '';

    // تجميع كل التطبيقات في مصفوفة واحدة مع إضافة الفئة لكل تطبيق
    let allApps = [];
    for (let categoryName in appsList) {
        appsList[categoryName].forEach(app => {
            allApps.push({
                ...app,
                category: categoryName
            });
        });
    }

    // تصفية حسب الفئة
    let filteredApps = allApps;
    if (category !== 'all') {
        filteredApps = allApps.filter(app => {
            if (category === 'gaming and emulators' && app.category === 'gaming and emulators') return true;
            if (category === 'social and entertainment' && app.category === 'social and entertainment') return true;
            if (category === 'streaming and audio' && app.category === 'streaming and audio') return true;
            return app.category === category;
        });
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

        // تحديد الأيقونة - استخدام الأيقونة الافتراضية للتصنيف إذا لم تكن هناك صورة للتطبيق
        const iconSrc = app.image || defaultCategoryIcons[app.category];

        card.innerHTML = `
            <div class="app-icon">
                <img src="${iconSrc}" alt="${app.name}" onError="handleImageError(event)">
            </div>
            <div class="app-card-content">
                <h3>${app.name}</h3>
                <p>${app.description}</p>
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
            // حفظ التحديد في localStorage
            localStorage.setItem('selectedApps', JSON.stringify([...selectedApps]));
        });

        container.appendChild(card);
    });
}

function getAppImage(app) {
    if (app.image) {
        // إذا كان للبرنامج صورة خاصة
        return `<img src="${app.image}" alt="${app.name}">`;
    } else if (defaultCategoryIcons[app.category]) {
        // إذا لم تكن هناك صورة، استخدم أيقونة الفئة
        return `<img src="${defaultCategoryIcons[app.category]}" alt="${app.name}" class="category-icon">`;
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

    // إضافة مستمع لحدث popstate
    window.addEventListener('popstate', handleNavigationChange);

    // تهيئة الحالة الأولية
    if (!window.location.hash) {
        history.replaceState({ page: 'selection' }, '', '#selection');
    } else {
        handleNavigationChange();
    }

    // مستمع لزر إنشاء السكربت
    document.getElementById('generateScript').addEventListener('click', function() {
        showScriptSection();
        history.pushState({ page: 'script' }, '', '#script');
    });

    // مستمعات لأزرار العودة
    document.querySelector('.top-back-btn').addEventListener('click', handleBackClick);
    document.querySelector('.global-back-btn').addEventListener('click', handleBackClick);

    // إضافة مستمع حدث لزر الرجوع العلوي
    const topBackBtn = document.querySelector('.top-back-btn');
    if (topBackBtn) {
        topBackBtn.addEventListener('click', () => {
            document.getElementById('scriptSection').classList.add('hidden-section');
            document.getElementById('selectionSection').classList.remove('hidden-section');
        });
    }

    // إعداد أزرار النسخ والحفظ
    const copyBtn = document.querySelector('.copy-btn');
    const saveBtn = document.querySelector('.save-btn');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            copyScript();
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            saveScript();
        });
    }

    // تأخير ظهور البطاقات
    const cards = document.querySelectorAll('.fade-in');
    
    // تفعيل أنيميشن البطاقات بشكل متتالي
    setTimeout(() => {
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('active');
            }, index * 300); // زيادة التأخير بين البطاقات
        });
    }, 1000); // تقليل وقت الانتظار قبل بدء ظهور البطاقات

    // عند تحميل الصفحة، نقوم بتحديد البطاقات المحفوظة
    if (window.location.hash === '#script') {
        if (selectedApps.size > 0) {
            showScriptSection();
        } else {
            window.location.hash = '#selection';
        }
    }

    // تحديد البطاقات المحفوظة مسبقاً
    document.querySelectorAll('.app-card').forEach(card => {
        if (selectedApps.has(card.dataset.appId)) {
            card.classList.add('selected');
        }
    });

    // إضافة استدعاء لدالة تحديث العدد
    updateAppsCount();
    
    // تحديث العدد عند تغيير التصنيف
    if (categoryButtons.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                // الكود الموجود مسبقاً للتصنيف
                const category = button.dataset.category;
                if (category === 'all') {
                    updateAppsCount();
                } else {
                    document.querySelector('.count-number').textContent = appsList[category].length;
                }
            });
        });
    }

    // تحديث العدد عند البحث
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const visibleApps = document.querySelectorAll('.app-card:not([style*="display: none"])').length;
                document.querySelector('.count-number').textContent = visibleApps;
            }, 300);
        });
    }
});

function handleBackClick() {
    // تنظيف التحديد عند الضغط على زر العودة
    clearSelection();
    history.pushState({ page: 'selection' }, '', '#selection');
    showSelectionSection();
}

function handleNavigationChange() {
    const hash = window.location.hash;
    if (hash === '#script') {
        // التحقق من وجود تطبيقات محددة قبل عرض قسم السكربت
        if (selectedApps.size > 0) {
            showScriptSection();
        } else {
            window.location.hash = '#selection';
        }
    } else {
        showSelectionSection();
    }
}

function showScriptSection() {
    document.getElementById('heroSection').classList.add('hidden-section');
    document.getElementById('selectionSection').classList.add('hidden-section');
    document.getElementById('scriptSection').classList.remove('hidden-section');
    document.querySelector('.global-back-btn').classList.add('hidden-section');
    
    // توليد السكربت عند الانتقال إلى قسم السكربت
    generateScript();
}

function showSelectionSection() {
    document.getElementById('heroSection').classList.remove('hidden-section');
    document.getElementById('selectionSection').classList.remove('hidden-section');
    document.getElementById('scriptSection').classList.add('hidden-section');
    document.querySelector('.global-back-btn').classList.add('hidden-section');
    
    // تنظيف التحديد فقط عند العودة لقسم التحديد
    clearSelection();
}

// إضافة دالة جديدة لتنظيف التحديد
function clearSelection() {
    // إزالة التحديد من جميع البطاقات
    document.querySelectorAll('.app-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // تفريغ مجموعة التطبيقات المحددة
    selectedApps.clear();
    
    // حذف البيانات من localStorage
    localStorage.removeItem('selectedApps');
}

// إضافة تأثيرات CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// إضافة الدوال الجديدة لمعالجة السكربت

function showScript(script) {
    const scriptSection = document.getElementById('scriptSection');
    const selectionSection = document.getElementById('selectionSection');
    const scriptOutput = document.querySelector('.script-output');
    
    // إظهار قسم السكربت
    scriptSection.classList.remove('hidden-section');
    selectionSection.classList.add('hidden-section');
    
    // عرض السكربت مع تأثير الكتابة
    scriptOutput.textContent = '';
    scriptOutput.classList.add('typing');
    
    let i = 0;
    const typeScript = () => {
        if (i < script.length) {
            scriptOutput.textContent += script.charAt(i);
            i++;
            setTimeout(typeScript, 10);
        } else {
            scriptOutput.classList.remove('typing');
        }
    };
    
    typeScript();
}

function copyScript() {
    const scriptContent = document.querySelector('.script-output').textContent;
    const copyBtn = document.querySelector('.copy-btn');
    
    navigator.clipboard.writeText(scriptContent)
        .then(() => {
            copyBtn.classList.add('success');
            setTimeout(() => {
                copyBtn.classList.remove('success');
            }, 2000);
        })
        .catch(err => {
            console.error('فشل النسخ:', err);
            copyBtn.querySelector('.btn-text').textContent = 'فشل النسخ';
            setTimeout(() => {
                copyBtn.querySelector('.btn-text').textContent = 'نسخ';
            }, 2000);
        });
}

function saveScript() {
    const scriptContent = document.querySelector('.script-output').textContent;
    const saveBtn = document.querySelector('.save-btn');
    
    try {
        const blob = new Blob([scriptContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'install-apps.bat';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        saveBtn.classList.add('success');
        setTimeout(() => {
            saveBtn.classList.remove('success');
        }, 2000);
    } catch (err) {
        console.error('فشل الحفظ:', err);
        saveBtn.querySelector('.btn-text').textContent = 'فشل الحفظ';
        setTimeout(() => {
            saveBtn.querySelector('.btn-text').textContent = 'حفظ';
        }, 2000);
    }
}

// تحديث دالة generateScript
function generateScript() {
    if (selectedApps.size === 0) {
        alert('الرجاء تحديد تطبيق واحد على الأقل!');
        return;
    }

    const selectedAppsArray = Array.from(selectedApps);
    let script = '@echo off\n\n';
    
    selectedAppsArray.forEach(appId => {
        for (const category in appsList) {
            const app = appsList[category].find(a => a.id === appId);
            if (app) {
                if (app.prerequisites && app.prerequisites.length > 0) {
                    app.prerequisites.forEach(prereq => {
                        script += `winget install -e --id ${prereq}\n`;
                    });
                }
                script += `winget install -e --id ${app.id}\n`;
                break;
            }
        }
    });
    
    const scriptOutput = document.querySelector('.script-output');
    if (scriptOutput) {
        scriptOutput.textContent = script;
    }
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

// تحديث أي استخدام للتصنيفات في الكود
function filterApps(category) {
    if (category === 'all') {
        // ...
    } else {
        apps = appsList[category] || [];
    }
    // ...
}

function createFallbackIcon(appName) {
    const initials = appName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    
    return `<div class="fallback-text">${initials}</div>`;
}

function handleImageError(event) {
    const appCard = event.target.closest('.app-card');
    const category = appCard.getAttribute('data-category');
    const defaultIcon = defaultCategoryIcons[category];
    event.target.src = defaultIcon;
}

// إضافة دالة لحساب إجمالي عدد البرامج
function updateAppsCount() {
    let totalApps = 0;
    for (let category in appsList) {
        totalApps += appsList[category].length;
    }
    document.querySelector('.count-number').textContent = totalApps;
} 
