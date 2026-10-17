        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
        import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc, increment, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
        import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

        const firebaseConfig = {
            apiKey: "AIzaSyCwqM_2qvOX99DNTu9nAClaT9KVSSOl0h0",
            authDomain: "elanlar-ff4cb.firebaseapp.com",
            projectId: "elanlar-ff4cb",
            storageBucket: "elanlar-ff4cb.firebasestorage.app",
            messagingSenderId: "593281324616",
            appId: "1:593281324616:web:7ce0215af0bb9c5c422a7d",
            measurementId: "G-EHHSNEM0SV"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();

        const categoriesData = {
            "Şəxsi əşyalar": {
                icon: "fa-gem",
                sub: {
                    "Saat və zinət əşyaları": ["Qol saatları", "Bijuteriya", "Digər"],
                    "Aksesuarlar": ["Çantalar", "Saç aksesuarları", "Portmone və pul kisələri", "Digər"],
                    "Sağlamlıq və gözəllik": ["Masaj aparatları", "Digər"]
                }
            },
            "Ev və bağ üçün": {
                icon: "fa-house",
                sub: {
                    "Təmir və tikinti": ["Uzadıcı və ötürücülər", "Elektrikli alətlər", "Əl alətləri", "Digər"],
                    "Məişət texnikası": ["Tozsoranlar", "Digər"],
                    "Bağ və bostan": ["Qaz balonları", "Su üçün test cihazları", "Digər"],
                    "Ev təsərrüfatı malları": ["Digər"]
                }
            },
            "Elektronika": {
                icon: "fa-laptop",
                sub: {
                    "Audio və video": ["Audio aksesuarlar", "Mikrofonlar", "Qulaqlıqlar", "Digər"],
                    "Kompüter aksesuarları": ["Laptop Adapters & Power Supplies", "Klaviaturalar və kompüter siçanları", "PC Component Power & Data Cables", "HDD/SDD Adapters, Cables & Connectors", "COM Port Adapters, Cables & Connectors", "Video Cables, Adapters & Converters", "Other Cables, Adapters & Converters", "USB flaş və yaddaş kartları", "Yaddaş kart oxuyucuları", "USB Hubs & Splitters", "Digər"],
                    "Oyunlar, pultlar və proqramlar": ["Proqramlar"],
                    "Komponentlər və monitorlar": ["Ana plataları", "Batareyalar", "CD, DVD və Blu-ray", "Keyslər və korpuslar", "Kulerlər və ventilyatorlar", "Monitorlar və ekranlar", "Operativ yaddaş (RAM)", "Prosessorlar (CPU)", "Qida blokları", "Sərt disklər (HDD, SSD)", "Video kartlar", "Digər"],
                    "Noutbuklar və netbuklar": ["Noutbuklar üçün aksesuarlar", "Noutbuklar üçün ehtiyyat hissələri", "Noutbuk korpusları"],
                    "Ofis avadanlığı və istehlak materialları": ["İstehlak və aksesuarlar"],
                    "Telefonlar": ["Aksesuarlar", "OTG (On-The-Go) adapterləri"],
                    "Şəbəkə və server avadanlığı": ["Routerlər", "Şəbəkə adapterləri", "Şəbəkə avadanlığı aksesuarları", "Digər"]
                }
            },
            "Hobbi və asudə": {
                icon: "fa-bicycle",
                sub: {
                    "Velosipedlər": ["Ehtiyyat hissələri və aksesuarlar"]
                }
            },
            "Nəqliyyat": {
                icon: "fa-car",
                sub: {
                    "Ehtiyyat hissələri və aksesuarlar": ["Bütün ehtiyyat hissələri və aksesuarlar"]
                }
            },
            "Xidmətlər və biznes": {
                icon: "fa-briefcase",
                sub: {
					"Təhlükəsizlik sistemləri": ["Siqnalizasiya sistemləri"],
                    "IT, internet, telekom": ["Bütün IT, internet və telekom xidmətləri"]
                }
            }
        };

        let ads = [];
        let favorites = JSON.parse(localStorage.getItem('sumqayit_favs')) || [];
        let currentCategoryTab = '';
        let currentUser = null;
        let currentEditingImages = [];

        let activeFullscreenImages = [];
        let currentFullscreenIndex = 0;

        window.runAdminMigration = async function() {
            if (!currentUser) {
                showToast("Bunun üçün admin olmalısınız!", "error");
                return;
            }

            const typeEl = document.querySelector('input[name="migrationType"]:checked');
            const type = typeEl ? typeEl.value : 'category';
            const oldValInput = document.getElementById('oldCatInput').value.trim();
            const newVal = document.getElementById('newCatInput').value.trim();

            if (!oldValInput || !newVal) {
                showToast("Həm köhnə, həm də yeni adı daxil edin!", "error");
                return;
            }

            const oldValLower = oldValInput.toLowerCase();
            const targetName = type === 'category' ? 'əsas kateqoriyanı' : 'alt kateqoriyanı';
            
            if (!confirm(`Bütün elanlarda ${targetName} "${oldValInput}" adını "${newVal}" ilə əvəz etmək istədiyinizə əminsiniz?`)) {
                return;
            }

            try {
                const querySnapshot = await getDocs(collection(db, "ads"));
                let updatedCount = 0;

                for (const docSnap of querySnapshot.docs) {
                    const data = docSnap.data();
                    
                    if (type === 'category' && data.category) {
                        if (data.category.trim().toLowerCase() === oldValLower) {
                            await updateDoc(doc(db, "ads", docSnap.id), { category: newVal });
                            updatedCount++;
                        }
                    } else if (type === 'subCategory' && data.subCategory) {
                        if (data.subCategory.toLowerCase().includes(oldValLower)) {
                            const parts = data.subCategory.split('->');
                            if (parts.length === 2) {
                                let groupPart = parts[0].trim();
                                let itemPart = parts[1].trim();
                                
                                if (groupPart.toLowerCase() === oldValLower) {
                                    groupPart = newVal;
                                } else if (itemPart.toLowerCase() === oldValLower) {
                                    itemPart = newVal;
                                }
                                const updatedSub = groupPart + " -> " + itemPart;
                                await updateDoc(doc(db, "ads", docSnap.id), { subCategory: updatedSub });
                                updatedCount++;
                            } else {
                                await updateDoc(doc(db, "ads", docSnap.id), { subCategory: newVal });
                                updatedCount++;
                            }
                        }
                    }
                }

                showToast(`${updatedCount} ədəd elan uğurla yeniləndi!`);
                document.getElementById('oldCatInput').value = '';
                document.getElementById('newCatInput').value = '';
            } catch (err) {
                showToast("Xəta baş verdi: " + err.message, "error");
            }
        };

        window.handleVipPinnedChange = function(type) {
            const vipCheckbox = document.getElementById('adIsVip');
            const pinnedCheckbox = document.getElementById('adIsPinned');
            const vipDurationContainer = document.getElementById('vipDurationContainer');

            if (type === 'vip' && vipCheckbox.checked) {
                pinnedCheckbox.checked = false;
                vipDurationContainer.classList.remove('hidden');
            } else if (type === 'pinned' && pinnedCheckbox.checked) {
                vipCheckbox.checked = false;
                vipDurationContainer.classList.add('hidden');
            } else if (!vipCheckbox.checked) {
                vipDurationContainer.classList.add('hidden');
            }
        };

        window.formatPhoneInput = function(input) {
            let digits = input.value.replace(/\D/g, '');
            if (digits.startsWith('994')) {
                digits = digits.substring(3);
            }
            if (digits.length > 9) {
                digits = digits.substring(0, 9);
            }
            
            let formatted = '+994';
            if (digits.length > 0) {
                formatted += ' ' + digits.substring(0, 2);
            }
            if (digits.length > 2) {
                formatted += ' ' + digits.substring(2, 5);
            }
            if (digits.length > 5) {
                formatted += ' ' + digits.substring(5, 7);
            }
            if (digits.length > 7) {
                formatted += ' ' + digits.substring(7, 9);
            }
            input.value = formatted;
        };

        function cleanAndFormatPhone(rawPhone) {
            if (!rawPhone) return "+994 50 545 85 86";
            let digits = rawPhone.replace(/\D/g, '');
            if (digits.startsWith('994')) {
                digits = digits.substring(3);
            }
            if (digits.length !== 9) return rawPhone;
            return `+994 ${digits.substring(0, 2)}${digits.substring(2, 5)} ${digits.substring(5, 7)}${digits.substring(7, 9)}`;
        }

        window.toggleSiteShareMenu = function() {
            const dropdown = document.getElementById('siteShareDropdown');
            dropdown.classList.toggle('hidden');
            const siteUrl = window.location.origin + window.location.pathname;
            const shareText = "ElanSaytı - Ən son elanlar";
            document.getElementById('shareWhatsapp').href = "https://api.whatsapp.com/send?text=" + encodeURIComponent(shareText + ' - ' + siteUrl);
        };

        window.copySiteLink = function() {
            const siteUrl = window.location.origin + window.location.pathname;
            navigator.clipboard.writeText(siteUrl);
            showToast("Saytın linki kopyalandı!");
            document.getElementById('siteShareDropdown').classList.add('hidden');
        };

        window.copyAdText = function(title, description, price, phone) {
            const textToCopy = `${title}\n\n${description}\n\nQiymət: ${price} AZN\nƏlaqə: ${phone}`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast('Elan mətni kopyalandı!');
            });
        };

        window.addEventListener('click', function(e) {
            const container = document.getElementById('siteShareDropdown');
            if (container && !e.target.closest('button[onclick="toggleSiteShareMenu()"]') && !container.contains(e.target)) {
                container.classList.add('hidden');
            }
        });

        window.showToast = function(message, type = 'success') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            const bgClass = type === 'success' ? 'bg-emerald-600' : 'bg-slate-900';
            const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-info';

            toast.className = bgClass + " text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 text-sm font-semibold pointer-events-auto transition transform translate-y-2 opacity-0 duration-300";
            toast.innerHTML = '<i class="fa-solid ' + icon + '"></i><span>' + message + '</span>';
            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.remove('translate-y-2', 'opacity-0');
            }, 10);

            setTimeout(() => {
                toast.classList.add('translate-y-2', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        };

        function initCategorySelectors() {
            const mainSelect = document.getElementById('mainCategorySelect');
            const subSelect = document.getElementById('subCategorySelect');
            const tabsContainer = document.getElementById('categoryTabsContainer');

            // 3-cü səviyyə üçün seçici (Sub-Sub Category / Element seçimi) yoxdursa dinamik əlavə edirik
            let subSubSelect = document.getElementById('subSubCategorySelect');
            if (!subSubSelect) {
                subSubSelect = document.createElement('select');
                subSubSelect.id = 'subSubCategorySelect';
                subSubSelect.className = subSelect.className;
                subSubSelect.onchange = window.onSubSubCategoryChange;
                subSelect.parentNode.insertBefore(subSubSelect, subSelect.nextSibling);
            }

            mainSelect.innerHTML = '<option value="">Kateqoriyalar</option>';
            tabsContainer.innerHTML = '<button onclick="setCategoryTab(\'\')" class="cat-tab active px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition bg-primary text-white shadow-md shadow-primary/25">Hamısı</button>';

            for (const [catName, details] of Object.entries(categoriesData)) {
                let mainOpt = document.createElement('option');
                mainOpt.value = catName;
                mainOpt.text = catName;
                mainSelect.appendChild(mainOpt);

                tabsContainer.innerHTML += `
                    <button onclick="setCategoryTab('${catName}')" class="cat-tab px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-2" data-cat="${catName}">
                        <i class="fa-solid ${details.icon}"></i> ${catName}
                    </button>
                `;
            }

            updateSubCategoryDropdown('');
            initModalCategorySelectors();
        }

        window.onMainCategoryChange = function() {
            const mainCat = document.getElementById('mainCategorySelect').value;
            currentCategoryTab = mainCat;
            updateSubCategoryDropdown(mainCat, false);
            updateActiveTabUI(mainCat);
            filterAds();
        };

        window.onSubCategoryChange = function() {
            const mainCat = document.getElementById('mainCategorySelect').value;
            const subCat = document.getElementById('subCategorySelect').value;
            updateSubSubCategoryDropdown(mainCat, subCat, false);
            filterAds();
        };

        window.onSubSubCategoryChange = function() {
            filterAds();
        };

        function updateActiveTabUI(catName) {
            document.querySelectorAll('.cat-tab').forEach(btn => {
                const btnCat = btn.getAttribute('data-cat') || '';
                if (btnCat === catName) {
                    btn.className = "cat-tab active px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition bg-primary text-white shadow-md shadow-primary/25 flex items-center gap-2";
                } else if (!catName && !btnCat) {
                    btn.className = "cat-tab active px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition bg-primary text-white shadow-md shadow-primary/25";
                } else {
                    btn.className = "cat-tab px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-2";
                }
            });
        }

        function updateSubCategoryDropdown(selectedMainCat, keepSelection = false) {
            const subSelect = document.getElementById('subCategorySelect');
            const prevSub = keepSelection ? subSelect.value : '';
            
            subSelect.innerHTML = '<option value="">Alt Kateqoriyalar</option>';
            const subSubSelect = document.getElementById('subSubCategorySelect');
            if (subSubSelect) {
                subSubSelect.innerHTML = '<option value="">Seçimlər</option>';
            }

            const categoriesToProcess = selectedMainCat ? { [selectedMainCat]: categoriesData[selectedMainCat] } : categoriesData;

            for (const [catName, details] of Object.entries(categoriesToProcess)) {
                for (const subGroup of Object.keys(details.sub)) {
                    let opt = document.createElement('option');
                    opt.value = subGroup;
                    opt.text = subGroup;
                    subSelect.appendChild(opt);
                }
            }

            if (keepSelection) {
                subSelect.value = prevSub;
            }
            updateSubSubCategoryDropdown(selectedMainCat, subSelect.value, keepSelection);
        }

        function updateSubSubCategoryDropdown(selectedMainCat, selectedSubGroup, keepSelection = false) {
            const subSubSelect = document.getElementById('subSubCategorySelect');
            if (!subSubSelect) return;

            const prevSubSub = keepSelection ? subSubSelect.value : '';
            subSubSelect.innerHTML = '<option value="">Seçimlər</option>';

            if (!selectedMainCat || !selectedSubGroup) return;

            const details = categoriesData[selectedMainCat];
            if (details && details.sub && details.sub[selectedSubGroup]) {
                const items = details.sub[selectedSubGroup];
                items.forEach(item => {
                    let opt = document.createElement('option');
                    opt.value = item;
                    opt.text = item;
                    subSubSelect.appendChild(opt);
                });
            }

            if (keepSelection) {
                subSubSelect.value = prevSubSub;
            }
        }

        function initModalCategorySelectors() {
            const modalMainSelect = document.getElementById('modalMainCategory');
            const modalSubSelect = document.getElementById('modalSubCategory');
            
            let modalSubSubSelect = document.getElementById('modalSubSubCategory');
            if (!modalSubSubSelect) {
                modalSubSubSelect = document.createElement('select');
                modalSubSubSelect.id = 'modalSubSubCategory';
                modalSubSubSelect.className = modalSubSelect.className;
                modalSubSubSelect.onchange = window.onModalSubCategoryChange;
                modalSubSelect.parentNode.insertBefore(modalSubSubSelect, modalSubSelect.nextSibling);
            }

            modalMainSelect.innerHTML = '<option value="">Kateqoriya seçin...</option>';
            for (const catName of Object.keys(categoriesData)) {
                let opt = document.createElement('option');
                opt.value = catName;
                opt.text = catName;
                modalMainSelect.appendChild(opt);
            }
        }

        window.onModalMainCategoryChange = function() {
            const selectedMain = document.getElementById('modalMainCategory').value;
            const modalSubSelect = document.getElementById('modalSubCategory');
            const modalSubSubSelect = document.getElementById('modalSubSubCategory');
            
            modalSubSelect.innerHTML = '<option value="">Alt kateqoriya qrupu seçin...</option>';
            if (modalSubSubSelect) modalSubSubSelect.innerHTML = '<option value="">Element seçin...</option>';

            if (!selectedMain || !categoriesData[selectedMain]) return;

            const details = categoriesData[selectedMain];
            for (const subGroup of Object.keys(details.sub)) {
                let opt = document.createElement('option');
                opt.value = subGroup;
                opt.text = subGroup;
                modalSubSelect.appendChild(opt);
            }
        };

        window.onModalSubCategoryChange = function() {
            const selectedMain = document.getElementById('modalMainCategory').value;
            const selectedSub = document.getElementById('modalSubCategory').value;
            const modalSubSubSelect = document.getElementById('modalSubSubCategory');

            if (!modalSubSubSelect) return;
            modalSubSubSelect.innerHTML = '<option value="">Element seçin...</option>';

            if (!selectedMain || !selectedSub || !categoriesData[selectedMain]) return;

            const details = categoriesData[selectedMain];
            if (details.sub && details.sub[selectedSub]) {
                details.sub[selectedSub].forEach(item => {
                    let opt = document.createElement('option');
                    opt.value = item;
                    opt.text = item;
                    modalSubSubSelect.appendChild(opt);
                });
            }
        };

        onAuthStateChanged(auth, (user) => {
            currentUser = user;
            const authSection = document.getElementById('authSection');
            const addAdBtnContainer = document.getElementById('addAdBtnContainer');

            if (user) {
                addAdBtnContainer.innerHTML = `
                    <button onclick="openAddModal()" class="bg-primary hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-primary/25 flex items-center space-x-2 transition transform active:scale-95 text-sm">
                        <i class="fa-solid fa-plus"></i>
                        <span>Elan Yerləşdir</span>
                    </button>
                `;
                authSection.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <img src="${user.photoURL || 'https://via.placeholder.com/40'}" class="w-8 h-8 rounded-full border border-primary" title="${user.email}">
                        <button onclick="logoutGoogle()" class="p-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition text-xs font-semibold" title="Çıxış et">
                            <i class="fa-solid fa-right-from-bracket"></i>
                        </button>
                    </div>
                `;
            } else {
                addAdBtnContainer.innerHTML = '';
                authSection.innerHTML = `
                    <button onclick="loginWithGoogle()" class="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition flex items-center space-x-2 text-xs font-semibold" title="Google ilə Admin Girişi">
                        <i class="fa-brands fa-google text-red-500"></i>
                        <span class="hidden sm:inline">Admin Girişi</span>
                    </button>
                `;
            }
            filterAds();
        });

        window.loginWithGoogle = async function() {
            try {
                await signInWithPopup(auth, provider);
                showToast("Uğurla admin olaraq daxil olundunuz!");
            } catch (error) {
                showToast("Giriş xətası: " + error.message, 'error');
            }
        };

        window.logoutGoogle = async function() {
            try {
                await signOut(auth);
                showToast("Admin hesabından çıxış edildi.");
            } catch (error) {
                console.error(error);
            }
        };

        async function initStats() {
            try {
                const statsRef = doc(db, "stats", "general");
                const hasVisited = localStorage.getItem('sumqayit_site_visited');

                if (!hasVisited) {
                    const statsDoc = await getDoc(statsRef);
                    if (statsDoc.exists()) {
                        await updateDoc(statsRef, { totalViews: increment(1) });
                    } else {
                        await setDoc(statsRef, { totalViews: 1 });
                    }
                    localStorage.setItem('sumqayit_site_visited', 'true');
                }

                const updatedStats = await getDoc(statsRef);
                document.getElementById('totalViewsCount').innerText = updatedStats.exists() ? (updatedStats.data().totalViews || 1) : 1;

                const sessionId = 'user_' + Math.random().toString(36).substring(2, 9);
                const userPresenceRef = doc(db, "active_sessions", sessionId);
                await setDoc(userPresenceRef, { lastSeen: Date.now() });

                setInterval(async () => {
                    try {
                        await updateDoc(userPresenceRef, { lastSeen: Date.now() });
                    } catch(e) {
                        await setDoc(userPresenceRef, { lastSeen: Date.now() });
                    }
                }, 10000);

                onSnapshot(collection(db, "active_sessions"), (snapshot) => {
                    const now = Date.now();
                    let activeCount = 0;
                    snapshot.forEach(docSnap => {
                        const data = docSnap.data();
                        if (now - data.lastSeen < 25000) activeCount++;
                    });
                    document.getElementById('activeUsersCount').innerText = Math.max(1, activeCount);
                });
            } catch (e) {
                console.error("Stats error:", e);
            }
        }

        function listenToAds() {
            onSnapshot(collection(db, "ads"), async (snapshot) => {
                ads = [];
                const now = Date.now();

                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    let imgList = data.images;
                    if (!imgList || imgList.length === 0) {
                        imgList = data.image ? [data.image] : ["https://images.unsplash.com/photo-1588702547919-26b89e033105?auto=format&fit=crop&w=600&q=80"];
                    }
                    const formattedPhone = cleanAndFormatPhone(data.phone);

                    let isVip = data.isVip;
                    if (isVip && data.vipExpiresAt && now > data.vipExpiresAt) {
                        isVip = false;
                        try {
                            await updateDoc(doc(db, "ads", docSnap.id), { isVip: false });
                        } catch (e) {
                            console.error("VIP vaxtı bitmə yenilənmə xətası:", e);
                        }
                    }

                    ads.push({ id: docSnap.id, views: 0, ...data, isVip, phone: formattedPhone, images: imgList });
                }
                
                document.getElementById('totalAdsCount').innerText = ads.length;
                const currentMainCat = document.getElementById('mainCategorySelect').value;
                updateSubCategoryDropdown(currentMainCat, true);

                filterAds();
                updateFavCount();
            });
        }

        function resizeAndConvertImage(file, quality) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const img = new Image();
                    img.onload = function () {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        
                        const MAX_WIDTH = 5000;
                        const MAX_HEIGHT = 5000;
                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        const dataUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(dataUrl);
                    };
                    img.onerror = reject;
                    img.src = event.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        function rotateBase64Image(base64Image, degrees, quality) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (degrees === 90 || degrees === 270 || degrees === -90 || degrees === -270) {
                        canvas.width = img.height;
                        canvas.height = img.width;
                    } else {
                        canvas.width = img.width;
                        canvas.height = img.height;
                    }
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.save();
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate((degrees * Math.PI) / 180);
                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                    ctx.restore();
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.src = base64Image;
            });
        }

        window.handleNewFiles = async function(input) {
			if (input.files && input.files.length > 0) {
				const qualitySelect = document.getElementById('compressionQuality');
				const quality = qualitySelect ? parseFloat(qualitySelect.value) : 0.75;

				showToast("Şəkillər yüklənir...", "info");

				for (let i = 0; i < input.files.length; i++) {
					const file = input.files[i];

					try {
						let finalBase64 = "";
						if (quality === 1) {
							finalBase64 = await new Promise((resolve, reject) => {
								const reader = new FileReader();
								reader.onload = (e) => resolve(e.target.result);
								reader.onerror = reject;
								reader.readAsDataURL(file);
							});
						} else if (typeof resizeAndConvertImage === 'function') {
							finalBase64 = await resizeAndConvertImage(file, quality);
						}

						if (finalBase64) {
							currentEditingImages.push({ src: finalBase64, rotation: 0 });
						}
					} catch(err) { 
						console.error(err);
						showToast("Şəkil yüklənərkən xəta baş verdi!", "error");
					}
				}
				
				renderEditingThumbnails();
				input.value = ''; 
				showToast("Şəkillər uğurla əlavə olundu!");
			}
		};

		function renderEditingThumbnails() {
            const container = document.getElementById('imagePreviewContainer');
            const thumbs = document.getElementById('previewThumbnails');
            thumbs.innerHTML = '';
            container.style.display = 'block';

            currentEditingImages.forEach((imgObj, index) => {
                const div = document.createElement('div');
                div.className = "relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-300 bg-white flex-shrink-0 cursor-move select-none group shadow-sm flex items-center justify-center";
                div.draggable = true;
                div.dataset.index = index;

                div.addEventListener('dragstart', handleDragStart);
                div.addEventListener('dragover', handleDragOver);
                div.addEventListener('drop', handleDrop);
                div.addEventListener('dragend', handleDragEnd);

                div.innerHTML = `
                    <img src="${imgObj.src}" style="transform: rotate(${imgObj.rotation}deg);" class="w-full h-full object-cover transition-transform duration-200 pointer-events-none">
                    <button type="button" onclick="removeEditingImage(${index})" class="absolute top-1.5 right-1.5 w-5 h-5 bg-white hover:bg-gray-100 text-red-600 rounded-full flex items-center justify-center text-xs font-black shadow transition z-10 leading-none" style="font-weight: 900; -webkit-text-stroke: 0.8px #dc2626;" title="Sil">✕</button>
                    <button type="button" onclick="rotateEditingImageLeft(${index})" class="absolute bottom-1 left-1 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow transition z-10" title="Sola fırlat">
                        <i class="fa-solid fa-rotate-left text-[10px]"></i>
                    </button>
                    <button type="button" onclick="rotateEditingImageRight(${index})" class="absolute bottom-1 right-1 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow transition z-10" title="Sağa fırlat">
                        <i class="fa-solid fa-rotate-right text-[10px]"></i>
                    </button>
                `;
                thumbs.appendChild(div);
            });
            
            const addBtnDiv = document.createElement('div');
            addBtnDiv.innerHTML = `
                <label for="adImageFiles" class="w-24 h-24 border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all rounded-2xl text-slate-500 flex-shrink-0">
                    <i class="fa-solid fa-camera text-2xl mb-1"></i>
                    <span class="text-[11px] font-bold">Şəkil əlavə et</span>
                </label>
            `;
            thumbs.appendChild(addBtnDiv.firstElementChild);
        }

        window.removeEditingImage = function(index) {
            currentEditingImages.splice(index, 1);
            renderEditingThumbnails();
        };

        window.rotateEditingImageLeft = function(index) {
            currentEditingImages[index].rotation = (currentEditingImages[index].rotation - 90) % 360;
            renderEditingThumbnails();
        };

        window.rotateEditingImageRight = function(index) {
            currentEditingImages[index].rotation = (currentEditingImages[index].rotation + 90) % 360;
            renderEditingThumbnails();
        };

        let draggedEditingIndex = null;
        function handleDragStart(e) {
            draggedEditingIndex = parseInt(this.dataset.index);
            e.dataTransfer.effectAllowed = 'move';
        }
        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }
        function handleDrop(e) {
            e.preventDefault();
            const targetIndex = parseInt(this.dataset.index);
            if (draggedEditingIndex !== null && draggedEditingIndex !== targetIndex) {
                const movedItem = currentEditingImages.splice(draggedEditingIndex, 1)[0];
                currentEditingImages.splice(targetIndex, 0, movedItem);
                renderEditingThumbnails();
            }
        }
        function handleDragEnd(e) {
            draggedEditingIndex = null;
        }

        window.submitAd = async function(e) {
            e.preventDefault();
            if (!currentUser) {
                showToast("Bu əməliyyat üçün admin kimi daxil olmalısınız!", 'error');
                return;
            }

            const submitBtn = document.getElementById('submitAdBtn');
            submitBtn.disabled = true;
            submitBtn.innerText = "Yüklənir...";

            const editingId = document.getElementById('editingAdId').value;
            
            let finalImages = [];
            for (let imgObj of currentEditingImages) {
                if (imgObj.rotation !== 0) {
                    const rotatedBase64 = await rotateBase64Image(imgObj.src, imgObj.rotation);
                    finalImages.push(rotatedBase64);
                } else {
                    finalImages.push(imgObj.src);
                }
            }
            
            if (finalImages.length === 0) {
                finalImages = ["https://images.unsplash.com/photo-1588702547919-26b89e033105?auto=format&fit=crop&w=600&q=80"];
            }

            const mainCategoryVal = document.getElementById('modalMainCategory').value;
            const subCategoryGroup = document.getElementById('modalSubCategory').value;
            const subCategoryItem = document.getElementById('modalSubSubCategory') ? document.getElementById('modalSubSubCategory').value : '';
            
            // Verilənlər bazasında köhnə struktur ilə tam uyğunluq üçün birləşdiririk
            const subCategoryVal = (subCategoryGroup && subCategoryItem) ? (subCategoryGroup + " -> " + subCategoryItem) : (subCategoryGroup || subCategoryItem);

            const rawPhoneInput = document.getElementById('adPhone').value;
            const finalPhone = cleanAndFormatPhone(rawPhoneInput);
            const isVipChecked = document.getElementById('adIsVip').checked;
            const isPinnedChecked = document.getElementById('adIsPinned').checked;
            const selectedCondition = document.querySelector('input[name="adCondition"]:checked') ? document.querySelector('input[name="adCondition"]:checked').value : 'Yeni';

            let vipExpiresAt = null;
            if (isVipChecked) {
                const days = parseInt(document.getElementById('vipDays').value) || 7;
                vipExpiresAt = Date.now() + (days * 24 * 60 * 60 * 1000);
            }

            const adData = {
                title: document.getElementById('adTitle').value,
                category: mainCategoryVal,
                subCategory: subCategoryVal,
                price: Number(document.getElementById('adPrice').value),
                phone: finalPhone,
                images: finalImages,
                description: document.getElementById('adDescription').value,
                isVip: isVipChecked,
                vipExpiresAt: vipExpiresAt,
                isPinned: isPinnedChecked,
                condition: selectedCondition,
                createdAt: Date.now()
            };

            try {
                if (editingId) {
                    delete adData.createdAt; 
                    if (!isVipChecked) {
                        adData.vipExpiresAt = null;
                    }
                    await updateDoc(doc(db, "ads", editingId), adData);
                    showToast("Elan uğurla yeniləndi!");
                } else {
                    adData.views = 0;
                    await addDoc(collection(db, "ads"), adData);
                    showToast("Elan uğurla əlavə olundu!");
                }
                closeAddModal();
                closeDetailModal();
            } catch (err) {
                showToast("Xəta baş verdi: " + err.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = "Yadda Saxla / Dərc Et";
            }
        };

        window.deleteAd = async function(id) {
            if (!currentUser) {
                showToast("Bu əməliyyat üçün admin kimi daxil olmalısınız!", 'error');
                return;
            }
            if (confirm("Bu elanı silmək istədiyinizə əminsiniz?")) {
                try {
                    await deleteDoc(doc(db, "ads", id));
                    closeDetailModal();
                    showToast("Elan uğurla silindi.");
                } catch (err) { showToast("Silinmə xətası: " + err.message, 'error'); }
            }
        };

        window.editAd = function(id) {
            const ad = ads.find(a => a.id === id);
            if (!ad) return;

            document.getElementById('editingAdId').value = ad.id;
            document.getElementById('adTitle').value = ad.title;
            document.getElementById('adIsVip').checked = !!ad.isVip;
            document.getElementById('adIsPinned').checked = !!ad.isPinned;
            
            const vipDurationContainer = document.getElementById('vipDurationContainer');
            if (ad.isVip) {
                vipDurationContainer.classList.remove('hidden');
                if (ad.vipExpiresAt) {
                    const remainingDays = Math.max(1, Math.ceil((ad.vipExpiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
                    document.getElementById('vipDays').value = remainingDays;
                }
            } else {
                vipDurationContainer.classList.add('hidden');
            }

            const conditionVal = ad.condition || 'Yeni';
            const conditionRadio = document.querySelector(`input[name="adCondition"][value="${conditionVal}"]`);
            if (conditionRadio) conditionRadio.checked = true;
            
            document.getElementById('modalMainCategory').value = ad.category || "";
            onModalMainCategoryChange();

            if (ad.subCategory) {
                const parts = ad.subCategory.split('->').map(s => s.trim());
                if (parts.length === 2) {
                    document.getElementById('modalSubCategory').value = parts[0];
                    onModalSubCategoryChange();
                    document.getElementById('modalSubSubCategory').value = parts[1];
                } else {
                    document.getElementById('modalSubCategory').value = ad.subCategory;
                }
            }

            document.getElementById('adPrice').value = ad.price;
            document.getElementById('adPhone').value = ad.phone || "+994 50 545 85 86";
            document.getElementById('adDescription').value = ad.description;
            document.getElementById('modalTitleText').innerText = "Elana Düzəliş Et (Admin)";

            currentEditingImages = (ad.images || []).map(src => ({ src: src, rotation: 0 }));
            renderEditingThumbnails();

            closeDetailModal();
            openAddModal();
        };

        window.filterAds = function() {
            const search = document.getElementById('searchInput').value.toLowerCase();
            const selectedMainCat = document.getElementById('mainCategorySelect').value;
            const selectedSubGroup = document.getElementById('subCategorySelect').value;
            const selectedSubItem = document.getElementById('subSubCategorySelect') ? document.getElementById('subSubCategorySelect').value : '';
            const sort = document.getElementById('sortSelect').value;

            let filtered = ads.filter(ad => {
                let matchesSearch = ad.title.toLowerCase().includes(search) || ad.description.toLowerCase().includes(search);
                let matchesCat = true;

                if (selectedMainCat && ad.category !== selectedMainCat) {
                    matchesCat = false;
                }

                if (selectedSubGroup) {
                    if (!ad.subCategory || !ad.subCategory.startsWith(selectedSubGroup)) {
                        matchesCat = false;
                    }
                }

                if (selectedSubItem) {
                    const expectedSub = selectedSubGroup + " -> " + selectedSubItem;
                    if (ad.subCategory !== expectedSub) {
                        matchesCat = false;
                    }
                }

                if (currentCategoryTab && ad.category !== currentCategoryTab) {
                    matchesCat = false;
                }

                return matchesSearch && matchesCat;
            });

            filtered.sort((a, b) => {
                if (sort === 'price-asc') return a.price - b.price;
                if (sort === 'price-desc') return b.price - a.price;
                return (b.createdAt || 0) - (a.createdAt || 0);
            });

            renderAds(filtered);
        };

        function renderAds(list) {
            const container = document.getElementById('listingsContainer');
            const empty = document.getElementById('emptyState');
            container.innerHTML = '';

            if (list.length === 0) {
                empty.classList.remove('hidden');
                return;
            }
            empty.classList.add('hidden');

            const vipAds = list.filter(ad => ad.isVip);
            const pinnedAds = list.filter(ad => !ad.isVip && ad.isPinned);
            const normalAds = list.filter(ad => !ad.isVip && !ad.isPinned);

            const appendSection = (titleText, badgeIcon, adsArray, sectionId) => {
                if (adsArray.length === 0) return;

                const sectionDiv = document.createElement('div');
                sectionDiv.className = "space-y-4";
                
                sectionDiv.innerHTML = `
                    <div class="flex items-center space-x-2 border-b border-slate-200 pb-3">
                        <i class="fa-solid ${badgeIcon} text-primary text-lg"></i>
                        <h2 class="text-lg font-extrabold text-slate-900">${titleText}</h2>
                        <span class="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">${adsArray.length}</span>
                    </div>
                    <div id="${sectionId}" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
                `;
                
                container.appendChild(sectionDiv);
                const gridEl = sectionDiv.querySelector('#' + sectionId);

                adsArray.forEach(ad => {
                    const isFav = favorites.some(f => f.id === ad.id);
                    const displayPhone = ad.phone || "+994 50 545 85 86";
                    const cleanPhone = displayPhone.replace(/[^0-9]/g,'');
                    const mainImg = (ad.images && ad.images.length > 0) ? ad.images[0] : "https://images.unsplash.com/photo-1588702547919-26b89e033105?auto=format&fit=crop&w=600&q=80";
                    const condition = ad.condition || 'Yeni';

                    const card = document.createElement('div');
                    card.className = "bg-white rounded-2xl border " + (ad.isVip ? 'border-amber-400 shadow-lg ring-2 ring-amber-400/20' : (ad.isPinned ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-slate-200')) + " overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between";
                    
                    let badgeHTML = '';
                    if (ad.isVip) {
                        badgeHTML += '<span class="absolute top-3 left-3 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-md font-bold shadow flex items-center gap-1"><i class="fa-solid fa-crown"></i> VIP</span>';
                    } else if (ad.isPinned) {
                        badgeHTML += '<span class="absolute top-3 left-3 bg-primary text-white text-[10px] px-2 py-0.5 rounded-md font-bold shadow flex items-center gap-1"><i class="fa-solid fa-thumbtack"></i> Xüsusi</span>';
                    }

                    let adminVipWarningHTML = '';
                    if (currentUser && ad.isVip && ad.vipExpiresAt) {
                        const timeLeft = ad.vipExpiresAt - Date.now();
                        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
                        if (timeLeft > 0 && daysLeft <= 3) {
                            const reminderMsg = `Salam, "${ad.title}" elanınızın VIP statusunun bitməsinə ${daysLeft} gün qaldı. Yeniləmək üçün əlaqə saxlayın.`;
                            const reminderWhatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderMsg)}`;

                            adminVipWarningHTML = `
                                <div class="mt-2.5 bg-rose-50 border border-rose-200 p-2.5 rounded-xl space-y-2">
                                    <div class="text-rose-600 text-[11px] font-bold flex items-center gap-1.5">
                                        <i class="fa-solid fa-triangle-exclamation"></i> VIP bitməsinə ${daysLeft} gün qaldı!
                                    </div>
                                    <a href="${reminderWhatsappUrl}" target="_blank" onclick="event.stopPropagation()" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm">
                                        <i class="fa-brands fa-whatsapp text-xs"></i> WhatsApp-a xatırlat
                                    </a>
                                </div>
                            `;
                        }
                    }

                    const whatsappMsgText = "Salam, " + ad.title + " elanı ilə maraqlanıram, hələ satılmayıb?";

                    card.innerHTML = `
                        <div class="relative h-48 cursor-pointer bg-slate-100" onclick="openDetail('${ad.id}')">
                            <img src="${mainImg}" class="w-full h-full object-cover">
                            ${badgeHTML}${ad.images && ad.images.length > 1 ? '<span class="absolute top-3 ' + (badgeHTML ? 'left-20' : 'left-3') + ' bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md font-semibold"><i class="fa-solid fa-images"></i> '
