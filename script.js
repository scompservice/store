        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
        import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc, increment, setDoc, onSnapshot, query, limit, startAfter } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
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
                    "Aksesuarlar": ["Çantalar", "Portmone və pul kisələri", "Ağıllı saat və fitnes qolbağı aksesuarları", "Digər"],
                    "Sağlamlıq və gözəllik": ["Masaj aparatları", "Saç və saqqal baxımı üçün alətlər və aksesuarlar", "Digər"]
                }
            },
            "Ev və bağ üçün": {
                icon: "fa-house",
                sub: {
                    "Təmir və tikinti": ["Elektrik yuvası və aksesuarları", "Elektrikli alətlər", "Əl alətləri", "Digər"],
                    "Məişət texnikası": ["Tozsoranlar", "Digər"],
                    "Bağ və bostan": ["Qaz balonları", "Su üçün test cihazları", "Digər"],
                    "Ev təsərrüfatı malları": ["Digər"]
                }
            },
            "Elektronika": {
                icon: "fa-laptop",
                sub: {
                    "Audio və video": ["Audio aksesuarlar", "Mikrofonlar", "Qulaqlıqlar", "Digər"],
                    "Kompüter aksesuarları": [
					  "Laptop Adapters & Power Supplies",
					  "Klaviaturalar və kompüter siçanları",
					  "PC Component Power & Data Cables",
					  "Video Cables, Adapters & Converters",
					  "COM Port Adapters, Cables & Connectors",
					  "Other Cables, Adapters & Connectors",
					  "USB Bluetooth Adapters",
					  "USB Hubs & Splitters",
					  "KVM Switch"
					],
					"Yaddaş Qurğuları və Aksesuarları": [
					  "HDD (Hard Disk Drive)",
					  "SSD (Solid State Drive)",
					  "M.2 SSD",
					  "External HDD (Hard Disk Drives)",
					  "USB Flash Drives & Memory Cards",
					  "Card Readers",
					  "HDD & SSD Enclosures",
					  "HDD Caddies & Drive Adapters",
					  "M.2 & SSD Adapters",
					  "HDD/SSD Adapters, Cables & Connectors",
					  "Other Storage Devices",
					  "Storage Accessories"
					],
					"Oyunlar, pultlar və proqramlar": ["Proqramlar"],
                    "Komponentlər və monitorlar": ["Ana plataları", "Batareyalar", "CD, DVD və Blu-ray", "Keyslər və korpuslar", "Kulerlər və ventilyatorlar", "Monitorlar və ekranlar", "Operativ yaddaş (RAM)", "Prosessorlar (CPU)", "Qida blokları", "Video kartlar", "Digər"],
                    "Noutbuklar və netbuklar": ["Noutbuklar üçün aksesuarlar", "Noutbuklar üçün ehtiyyat hissələri", "Noutbuk üçün korpuslar"],
                    "Ofis avadanlığı və istehlak materialları": ["İstehlak və aksesuarlar"],
                    "Telefonlar": ["Telefon aksesuarları və təmir alətləri", "OTG (On-The-Go) adapterləri"],
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
        let selectedSubCategoryValue = '';

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

            const targetName = type === 'category' ? 'əsas kateqoriyanı' : 'alt kateqoriyanı';
            
            if (!confirm(`Bütün elanlarda ${targetName} "${oldValInput}" adını "${newVal}" ilə əvəz etmək istədiyinizə əminsiniz?`)) {
                return;
            }

            try {
                showToast("Miqrasiya icra olunur, gözləyin...", "info");
                const querySnapshot = await getDocs(collection(db, "ads"));
                let updatedCount = 0;

                for (const docSnap of querySnapshot.docs) {
                    const data = docSnap.data();
                    
                    if (type === 'category' && data.category) {
                        // Hərfbəhərf dəqiq uyğunluq (böyük-kiçik hərf fərqi nəzərə alınır)
                        if (data.category.trim() === oldValInput) {
                            await updateDoc(doc(db, "ads", docSnap.id), { category: newVal });
                            
                            const localIndex = ads.findIndex(a => a.id === docSnap.id);
                            if (localIndex > -1) ads[localIndex].category = newVal;

                            updatedCount++;
                        }
                    } else if (type === 'subCategory' && data.subCategory) {
                        const parts = data.subCategory.split('->');
                        
                        if (parts.length === 2) {
                            let groupPart = parts[0].trim();
                            let itemPart = parts[1].trim();
                            let isChanged = false;

                            // Hərfbəhərf dəqiq uyğunluq yoxlaması
                            if (groupPart === oldValInput) {
                                groupPart = newVal;
                                isChanged = true;
                            }
                            if (itemPart === oldValInput) {
                                itemPart = newVal;
                                isChanged = true;
                            }

                            if (isChanged) {
                                const updatedSub = groupPart + " -> " + itemPart;
                                await updateDoc(doc(db, "ads", docSnap.id), { subCategory: updatedSub });

                                const localIndex = ads.findIndex(a => a.id === docSnap.id);
                                if (localIndex > -1) ads[localIndex].subCategory = updatedSub;

                                updatedCount++;
                            }
                        } else {
                            if (data.subCategory.trim() === oldValInput) {
                                await updateDoc(doc(db, "ads", docSnap.id), { subCategory: newVal });

                                const localIndex = ads.findIndex(a => a.id === docSnap.id);
                                if (localIndex > -1) ads[localIndex].subCategory = newVal;

                                updatedCount++;
                            }
                        }
                    }
                }

                filterAds();
                const currentMainCat = document.getElementById('mainCategorySelect') ? document.getElementById('mainCategorySelect').value : '';
                buildCustomAccordionDropdown(currentMainCat);

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
            return `+994 ${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5, 7)} ${digits.substring(7, 9)}`;
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
		
		// Əsas kateqoriya menyusunun açılıb-bağlanması
        window.toggleMainCatMenu = function() {
            const list = document.getElementById('mainCategoryDropdownList');
            const subList = document.getElementById('customSubCatList');
            const sortList = document.getElementById('sortDropdownList');
            
            // Digərlərini bağla
            if (subList) subList.classList.add('hidden');
            if (sortList) sortList.classList.add('hidden');

            if (list) list.classList.toggle('hidden');
        };

        // Sıralama menyusunun açılıb-bağlanması
        window.toggleSortMenu = function() {
            const list = document.getElementById('sortDropdownList');
            const mainList = document.getElementById('mainCategoryDropdownList');
            const subList = document.getElementById('customSubCatList');

            // Digərlərini bağla
            if (mainList) mainList.classList.add('hidden');
            if (subList) subList.classList.add('hidden');

            if (list) list.classList.toggle('hidden');
        };

        window.toggleCustomSubCatMenu = function() {
            const mainSelect = document.getElementById('mainCategorySelect');
            if (mainSelect && !mainSelect.value) return;

            const list = document.getElementById('customSubCatList');
            const mainList = document.getElementById('mainCategoryDropdownList');
            const sortList = document.getElementById('sortDropdownList');

            // Digərlərini bağla
            if (mainList) mainList.classList.add('hidden');
            if (sortList) sortList.classList.add('hidden');

            if (list) list.classList.toggle('hidden');
        };

        window.selectMainCatOption = function(val, text) {
            document.getElementById('mainCategorySelectedText').innerText = text;
            document.getElementById('mainCategorySelect').value = val;
            const list = document.getElementById('mainCategoryDropdownList');
            if (list) list.classList.add('hidden');
            onMainCategoryChange();
        };

        window.selectSortOption = function(val, text) {
            document.getElementById('sortSelectedText').innerText = text;
            document.getElementById('sortSelect').value = val;
            const list = document.getElementById('sortDropdownList');
            if (list) list.classList.add('hidden');
            filterAds();
        };

        window.addEventListener('click', function(e) {
            const container = document.getElementById('siteShareDropdown');
            if (container && !e.target.closest('button[onclick="toggleSiteShareMenu()"]') && !container.contains(e.target)) {
                container.classList.add('hidden');
            }

            // Alt kateqoriya menyusu
            const customDropdown = document.getElementById('customSubCatList');
            const customToggleBtn = document.querySelector('[onclick="toggleCustomSubCatMenu()"]');
            if (customDropdown && !customDropdown.classList.contains('hidden')) {
                if (!customDropdown.contains(e.target) && (!customToggleBtn || !customToggleBtn.contains(e.target))) {
                    customDropdown.classList.add('hidden');
                }
            }

            // Əsas kateqoriya menyusu
            const mainDropdownList = document.getElementById('mainCategoryDropdownList');
            const mainToggleBtn = document.querySelector('[onclick="toggleMainCatMenu()"]');
            if (mainDropdownList && !mainDropdownList.classList.contains('hidden')) {
                if (!mainDropdownList.contains(e.target) && (!mainToggleBtn || !mainToggleBtn.contains(e.target))) {
                    mainDropdownList.classList.add('hidden');
                }
            }

            // Sıralama menyusu
            const sortDropdownList = document.getElementById('sortDropdownList');
            const sortToggleBtn = document.querySelector('[onclick="toggleSortMenu()"]');
            if (sortDropdownList && !sortDropdownList.classList.contains('hidden')) {
                if (!sortDropdownList.contains(e.target) && (!sortToggleBtn || !sortToggleBtn.contains(e.target))) {
                    sortDropdownList.classList.add('hidden');
                }
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
            const mainDropdownList = document.getElementById('mainCategoryDropdownList');
            const tabsContainer = document.getElementById('categoryTabsContainer');

            if (mainSelect && mainDropdownList) {
                mainSelect.innerHTML = '<option value="">Kateqoriyalar</option>';
                // Varsayılan başlık seçeneğindeki py-2.5 değerini py-1.5 yaptık:
                mainDropdownList.innerHTML = '<div onclick="selectMainCatOption(\'\', \'Kateqoriyalar\')" class="px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition">Bütün kateqoriyalar</div>';
                
                for (const [catName, details] of Object.entries(categoriesData)) {
					let mainOpt = document.createElement('option');
					mainOpt.value = catName;
					mainOpt.text = catName;
					mainSelect.appendChild(mainOpt);

					let divItem = document.createElement('div');
					divItem.className = "px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition flex items-center gap-2";
					divItem.innerHTML = `<i class="fa-solid ${details.icon} w-4 text-slate-400"></i> <span>${catName}</span>`;
					divItem.onclick = () => selectMainCatOption(catName, catName);
					mainDropdownList.appendChild(divItem);
				}
            }

            if (tabsContainer) {
                tabsContainer.innerHTML = '<button onclick="setCategoryTab(\'\')" class="cat-tab active px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition bg-primary text-white shadow-md shadow-primary/25">Hamısı</button>';
                for (const [catName, details] of Object.entries(categoriesData)) {
                    tabsContainer.innerHTML += `
                        <button onclick="setCategoryTab('${catName}')" class="cat-tab px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-2" data-cat="${catName}">
                            <i class="fa-solid ${details.icon}"></i> ${catName}
                        </button>
                    `;
                }
            }

            buildCustomAccordionDropdown('');
            initModalMainCategoryDropdown();
        }

        window.onMainCategoryChange = function() {
            const mainCat = document.getElementById('mainCategorySelect').value;
            currentCategoryTab = mainCat;
            selectedSubCategoryValue = '';
            buildCustomAccordionDropdown(mainCat);
            updateActiveTabUI(mainCat);
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

        function buildCustomAccordionDropdown(selectedMainCat) {
			const buttonText = selectedSubCategoryValue ? selectedSubCategoryValue.replace(' -> ', ' / ') : 'Alt Kateqoriyalar';
			const subCategorySelectedText = document.getElementById('subCategorySelectedText');
			if (subCategorySelectedText) {
				subCategorySelectedText.innerText = buttonText;
			}

			const groupsContainer = document.getElementById('accordionGroupsContainer');
			if (!groupsContainer) return;
			groupsContainer.innerHTML = '';

			const categoriesToProcess = selectedMainCat ? { [selectedMainCat]: categoriesData[selectedMainCat] } : categoriesData;

			for (const [catName, details] of Object.entries(categoriesToProcess)) {
				if (!details || !details.sub) continue;
				for (const [subGroup, items] of Object.entries(details.sub)) {
					const groupDiv = document.createElement('div');
					groupDiv.className = "border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50";
					
					const groupId = 'group_' + subGroup.replace(/[^a-zA-Z0-9]/g, '_');
					const isOpen = (typeof activeAccordionGroupId !== 'undefined' && activeAccordionGroupId === groupId);
					
					groupDiv.innerHTML = `
						<div onclick="toggleAccordionGroup('${groupId}')" class="px-3 py-2.5 text-sm text-slate-800 hover:bg-slate-100 cursor-pointer flex items-center justify-between select-none">
							<span>${subGroup}</span>
							<i id="icon_${groupId}" class="fa-solid ${isOpen ? 'fa-chevron-down text-primary' : 'fa-chevron-right text-slate-400'} text-[10px] transition-transform duration-200"></i>
						</div>
						<div id="${groupId}" class="${isOpen ? '' : 'hidden'} pl-3 pr-2 py-1 space-y-1 bg-white border-t border-slate-100"></div>
					`;

					const itemsContainer = groupDiv.querySelector('#' + groupId);
					items.forEach(item => {
						const valueName = subGroup + " -> " + item;
						const count = ads.filter(ad => ad.subCategory === valueName).length;
						const isSelected = selectedSubCategoryValue === valueName ? 'bg-primary text-white font-bold' : 'text-slate-600 hover:bg-slate-100';

						const itemDiv = document.createElement('div');
						itemDiv.className = `px-2.5 py-1.5 rounded-lg text-sm cursor-pointer transition flex items-center justify-between ${isSelected}`;
						itemDiv.innerHTML = `<span>${item}</span> <span class="opacity-70 text-[10px]">(${count})</span>`;
						itemDiv.onclick = (e) => {
							e.stopPropagation();
							selectSubCat(valueName);
						};
						itemsContainer.appendChild(itemDiv);
					});

					groupsContainer.appendChild(groupDiv);
				}
			}
		}
		
		window.toggleAccordionGroup = function(groupId) {
			const itemsEl = document.getElementById(groupId);
			const iconEl = document.getElementById('icon_' + groupId);
			
			if (itemsEl) {
				const isOpen = !itemsEl.classList.contains('hidden');

				// Bütün qrupları bağla və ox işarələrini sıfırla
				document.querySelectorAll('[id^="group_"]').forEach(el => {
					if (el.id !== groupId) {
						el.classList.add('hidden');
						const otherIcon = document.getElementById('icon_' + el.id);
						if (otherIcon) {
							otherIcon.className = "fa-solid fa-chevron-right text-[10px] text-slate-400 transition-transform duration-200";
						}
					}
				});

				// Kliklənən qrupun vəziyyətini dəyiş (açıqdısa bağla, bağlıdısa aç)
				if (isOpen) {
					itemsEl.classList.add('hidden');
					iconEl.className = "fa-solid fa-chevron-right text-[10px] text-slate-400 transition-transform duration-200";
				} else {
					itemsEl.classList.remove('hidden');
					iconEl.className = "fa-solid fa-chevron-down text-[10px] text-primary transition-transform duration-200";
				}
			}
		};

        window.selectSubCat = function(val) {
            selectedSubCategoryValue = val;
            const subSelectEl = document.getElementById('subCategorySelect');
            if (subSelectEl) subSelectEl.value = val;
            
            const list = document.getElementById('customSubCatList');
            if (list) list.classList.add('hidden');

            const currentMainCat = document.getElementById('mainCategorySelect') ? document.getElementById('mainCategorySelect').value : '';
            buildCustomAccordionDropdown(currentMainCat);
            filterAds();
        };

        function initModalMainCategoryDropdown() {
            const modalMainSelect = document.getElementById('modalMainCategory');
            if (!modalMainSelect) return;
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
            if (!modalSubSelect) return;
            
            modalSubSelect.innerHTML = '<option value="">Alt kateqoriya seçin...</option>';
            if (!selectedMain || !categoriesData[selectedMain]) return;

            const details = categoriesData[selectedMain];
            for (const [subGroup, items] of Object.entries(details.sub)) {
                let groupOpt = document.createElement('option');
                groupOpt.disabled = true;
                groupOpt.style.fontWeight = "bold";
                groupOpt.style.color = "#0f172a";
                groupOpt.style.backgroundColor = "#f1f5f9";
                groupOpt.text = subGroup;
                modalSubSelect.appendChild(groupOpt);

                items.forEach(item => {
                    const valueName = subGroup + " -> " + item;
                    let opt = document.createElement('option');
                    opt.value = valueName;
                    opt.text = "\u00A0\u00A0\u00A0\u00A0  " + item;
                    modalSubSelect.appendChild(opt);
                });
            }
        };

        onAuthStateChanged(auth, (user) => {
            currentUser = user;
            const authSection = document.getElementById('authSection');
            const addAdBtnContainer = document.getElementById('addAdBtnContainer');

            if (user) {
                if (addAdBtnContainer) {
                    addAdBtnContainer.innerHTML = `
                        <button onclick="openAddModal()" class="bg-primary hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-primary/25 flex items-center space-x-2 transition transform active:scale-95 text-sm">
                            <i class="fa-solid fa-plus"></i>
                            <span>Elan Yerləşdir</span>
                        </button>
                    `;
                }
                if (authSection) {
                    authSection.innerHTML = `
                        <div class="flex items-center space-x-2">
                            <img src="${user.photoURL || 'https://via.placeholder.com/40'}" class="w-8 h-8 rounded-full border border-primary" title="${user.email}">
                            <button onclick="logoutGoogle()" class="p-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition text-xs font-semibold" title="Çıxış et">
                                <i class="fa-solid fa-right-from-bracket"></i>
                            </button>
                        </div>
                    `;
                }
            } else {
                if (addAdBtnContainer) addAdBtnContainer.innerHTML = '';
                if (authSection) {
                    authSection.innerHTML = `
                        <button onclick="loginWithGoogle()" class="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition flex items-center space-x-2 text-xs font-semibold" title="Google ilə Admin Girişi">
                            <i class="fa-brands fa-google text-red-500"></i>
                            <span class="hidden sm:inline">Admin Girişi</span>
                        </button>
                    `;
                }
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
                const viewsEl = document.getElementById('totalViewsCount');
                if (viewsEl) viewsEl.innerText = updatedStats.exists() ? (updatedStats.data().totalViews || 1) : 1;

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
                    const activeEl = document.getElementById('activeUsersCount');
                    if (activeEl) activeEl.innerText = Math.max(1, activeCount);
                });
            } catch (e) {
                console.error("Stats error:", e);
            }
        }
		
		let isDataLoaded = false;

        async function listenToAds() {
            isDataLoaded = false;
            
            const loadTimeout = setTimeout(() => {
                if (!isDataLoaded) {
                    console.warn("Məlumatların gəlməsi gecikdi, yenidən qoşulma yoxlanılır...");
                    showToast("Məlumatlar yüklənir, zəhmət olmasa gözləyin...", "info");
                }
            }, 10000);

            try {
                ads = [];
                let batchSize = 25; // İlk batch
                let firstQuery = query(collection(db, "ads"), limit(batchSize));
                let snapshot = await getDocs(firstQuery);

                isDataLoaded = true;
                clearTimeout(loadTimeout);

                if (!snapshot.empty) {
                    processSnapshotDocs(snapshot.docs);
                    filterAds(); 

                    let lastVisible = snapshot.docs[snapshot.docs.length - 1];
                    
                    // Əgər ilk batch-dəki elanların sayı limitdən azdırsa, deməli başqa elan yoxdur, spinneri gizlət
                    if (snapshot.docs.length < batchSize) {
                        const spinner = document.getElementById('trafficSpinner');
                        if (spinner) spinner.style.display = 'none';
                    } else {
                        // Hələ elanlar qalıb, arxa fonda davam edirik, SPİNNER FIRLANMAĞA DAVAM EDİR
                        updateTrafficSize();
                        fetchRemainingAdsInBackground(lastVisible, batchSize);
                    }
                } else {
                    isDataLoaded = true;
                    clearTimeout(loadTimeout);
                    filterAds();
                    const spinner = document.getElementById('trafficSpinner');
                    if (spinner) spinner.style.display = 'none';
                }

            } catch (error) {
                console.error("Firebase bağlantı xətası:", error);
                showToast("Bağlantı qopdu, yenidən qoşulmağa çalışılır...", "error");
                setTimeout(() => {
                    listenToAds();
                }, 10000);
                const spinner = document.getElementById('trafficSpinner');
                if (spinner) spinner.style.display = 'none';
            }
        }

        // Arxa fonda qalan elanları fasilə ilə çəkən funksiya
        async function fetchRemainingAdsInBackground(lastDoc, batchSize) {
            setTimeout(async () => {
                try {
                    const nextQuery = query(
                        collection(db, "ads"), 
                        startAfter(lastDoc), 
                        limit(batchSize)
                    );
                    const snapshot = await getDocs(nextQuery);

                    const spinner = document.getElementById('trafficSpinner');

                    if (!snapshot.empty) {
                        processSnapshotDocs(snapshot.docs);
                        filterAds(); 
                        updateTrafficSize();

                        const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
                        
                        // Əgər gələn elanların sayı batchSize-dan azdırsa, deməli SONUNCU hissədir -> SPİNNERİ İNDİ GİZLƏDİRİK!
                        if (snapshot.docs.length < batchSize) {
                            if (spinner) spinner.style.display = 'none';
                        } else {
                            // Hələ elanlar qalır, növbəti hissəni çəkməyə davam et
                            fetchRemainingAdsInBackground(newLastDoc, batchSize);
                        }
                    } else {
                        // Başqa elan qalmadı, spinneri gizlət
                        if (spinner) spinner.style.display = 'none';
                    }
                } catch (err) {
                    console.error("Arxa fonda növbəti elanların çəkilmə xətası:", err);
                    const spinner = document.getElementById('trafficSpinner');
                    if (spinner) spinner.style.display = 'none';
                }
            }, 1000); 
        }

        // Trafik həcmini hesablayıb ekranda yeniləyən köməkçi funksiya
        function updateTrafficSize() {
            let totalBytes = 0;
            
            if (performance && performance.getEntriesByType) {
                const resources = performance.getEntriesByType('resource');
                resources.forEach(res => {
                    totalBytes += (res.decodedBodySize || res.transferSize || 0);
                });
            }
            
            if (performance.getEntriesByType('navigation')[0]) {
                const nav = performance.getEntriesByType('navigation')[0];
                totalBytes += (nav.decodedBodySize || nav.transferSize || 0);
            }

            if (typeof ads !== 'undefined' && ads.length > 0) {
                try {
                    totalBytes += new Blob([JSON.stringify(ads)]).size;
                } catch(e) {}
            }

            const sizeEl = document.getElementById('topTrafficSize');
            if (sizeEl && totalBytes > 0) {
                let formattedSize = "";
                if (totalBytes < 1024 * 1024) {
                    formattedSize = (totalBytes / 1024).toFixed(1) + " KB";
                } else if (totalBytes < 1024 * 1024 * 1024) {
                    formattedSize = (totalBytes / (1024 * 1024)).toFixed(2) + " MB";
                } else {
                    formattedSize = (totalBytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
                }
                sizeEl.innerText = formattedSize;
            }
        }

        

        // Gələn sənədləri ümumi massivə işləyən ortaq funksiya
        function processSnapshotDocs(docs) {
            const now = Date.now();
            docs.forEach(docSnap => {
                const data = docSnap.data();
                let imgList = data.images;
                if (!imgList || imgList.length === 0) {
                    imgList = data.image ? [data.image] : ["https://images.unsplash.com/photo-1588702547919-26b89e033105?auto=format&fit=crop&w=600&q=80"];
                }
                const formattedPhone = cleanAndFormatPhone(data.phone);

                let isVip = data.isVip;
                if (isVip && data.vipExpiresAt && now > data.vipExpiresAt) {
                    isVip = false;
                    updateDoc(doc(db, "ads", docSnap.id), { isVip: false }).catch(e => console.error("VIP yenilənmə xətası:", e));
                }

                if (!ads.some(a => a.id === docSnap.id)) {
                    ads.push({ id: docSnap.id, views: 0, ...data, isVip, phone: formattedPhone, images: imgList });
                }
            });

            const totalAdsEl = document.getElementById('totalAdsCount');
            if (totalAdsEl) totalAdsEl.innerText = ads.length;
            
            const currentMainCat = document.getElementById('mainCategorySelect') ? document.getElementById('mainCategorySelect').value : '';
            buildCustomAccordionDropdown(currentMainCat);
            updateFavCount();
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

        // Orijinal faylları saxlamaq üçün qlobal massiv
		if (!window.originalFiles) {
			window.originalFiles = [];
		}

		window.handleNewFiles = async function(input) {
			if (input.files && input.files.length > 0) {
				// Yeni seçilən faylları orijinal massivə əlavə edirik (və ya hamısını yeniləyirik)
				for (let i = 0; i < input.files.length; i++) {
					window.originalFiles.push(input.files[i]);
				}

				await processAndRenderImages();
				input.value = ''; 
			}
		};

		async function processAndRenderImages() {
			if (!window.originalFiles || window.originalFiles.length === 0) return;

			const qualitySelect = document.getElementById('compressionQuality');
			const quality = qualitySelect ? parseFloat(qualitySelect.value) : 0.75;

			showToast("Şəkillər emal olunur...", "info");
			currentEditingImages = []; // KöhnəBase64 massivini təmizləyirik

			for (let i = 0; i < window.originalFiles.length; i++) {
				const file = window.originalFiles[i];

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
					showToast("Şəkil emal edilərkən xəta baş verdi!", "error");
				}
			}
			
			renderEditingThumbnails();
			showToast("Şəkillər yeniləndi!");
		}

		document.addEventListener('DOMContentLoaded', () => {
			const qualitySelect = document.getElementById('compressionQuality');
			if (qualitySelect) {
				qualitySelect.addEventListener('change', async () => {
					if (window.originalFiles && window.originalFiles.length > 0) {
						await processAndRenderImages();
					}
				});
			}
		});

		function renderEditingThumbnails() {
            const container = document.getElementById('imagePreviewContainer');
            const thumbs = document.getElementById('previewThumbnails');
            if (!thumbs || !container) return;
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
			window.originalFiles.splice(index, 1);
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
            const subCategoryVal = document.getElementById('modalSubCategory').value;
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
                    
                    const index = ads.findIndex(a => a.id === editingId);
                    if (index > -1) {
                        ads[index] = { ...ads[index], ...adData, phone: finalPhone, images: finalImages };
                    }
                    
                    showToast("Elan uğurla yeniləndi!");
                } else {
                    adData.views = 0;
                    const docRef = await addDoc(collection(db, "ads"), adData);
                    
                    ads.unshift({ id: docRef.id, ...adData, phone: finalPhone });
                    
                    // Ümumi elanların sayını dərhal artırırıq
                    const totalAdsEl = document.getElementById('totalAdsCount');
                    if (totalAdsEl) {
                        totalAdsEl.innerText = ads.length;
                    }

                    showToast("Elan uğurla əlavə olundu!");
                }
                
                filterAds(); 
                
                // AKORDEON MENYUNU VƏ SAYLARI YENİLƏYİRİK:
                const currentMainCat = document.getElementById('mainCategorySelect') ? document.getElementById('mainCategorySelect').value : '';
                buildCustomAccordionDropdown(currentMainCat);

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
                    
                    ads = ads.filter(a => a.id !== id);
                    
                    // Ümumi elanların sayını dərhal azaldırıq
                    const totalAdsEl = document.getElementById('totalAdsCount');
                    if (totalAdsEl) {
                        totalAdsEl.innerText = ads.length;
                    }
                    
                    closeDetailModal();
                    showToast("Elan uğurla silindi.");
                    filterAds(); 
                    
                    // SİLİNDİKDƏ DƏ AKORDEON SAYLARINI YENİLƏYİRİK:
                    const currentMainCat = document.getElementById('mainCategorySelect') ? document.getElementById('mainCategorySelect').value : '';
                    buildCustomAccordionDropdown(currentMainCat);
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
            document.getElementById('modalSubCategory').value = ad.subCategory || "";

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
            const selectedSubCat = selectedSubCategoryValue;
            const sort = document.getElementById('sortSelect').value;

            let filtered = ads.filter(ad => {
                let matchesSearch = ad.title.toLowerCase().includes(search) || ad.description.toLowerCase().includes(search);
                let matchesCat = true;

                if (selectedMainCat) {
                    if (ad.category !== selectedMainCat) matchesCat = false;
                }

                if (selectedSubCat) {
                    if (ad.subCategory !== selectedSubCat) matchesCat = false;
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
            if (!container || !empty) return;
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
                            <img src="${mainImg}" loading="lazy" class="w-full h-full object-cover">
                            ${badgeHTML}
                            ${ad.images && ad.images.length > 1 ? '<span class="absolute top-3 ' + (badgeHTML ? 'left-20' : 'left-3') + ' bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md font-semibold"><i class="fa-solid fa-images"></i> ' + ad.images.length + '</span>' : ''}
                            
                            <span class="absolute bottom-3 right-3 ${condition === 'Yeni' ? 'bg-emerald-600' : 'bg-slate-700'} text-white text-[10px] px-2 py-0.5 rounded-md font-bold shadow">
                                ${condition}
                            </span>

                            <div class="absolute bottom-3 left-3 bg-black/65 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                                <i class="fa-solid fa-eye text-emerald-400"></i> ${ad.views || 0} baxış
                            </div>
                            <button onclick="event.stopPropagation(); toggleFavorite('${ad.id}')" class="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 hover:text-rose-500 transition">
                                <i class="fa-solid fa-heart ${isFav ? 'text-rose-500' : 'text-slate-400'}"></i>
                            </button>
                        </div>
                        <div class="p-5 flex-grow flex flex-col justify-between">
                            <div>
                                <div class="flex justify-between items-center mb-1 flex-wrap gap-1">
                                    <span class="text-[11px] font-semibold text-primary uppercase tracking-wider">${ad.category}</span>
                                    <span class="text-[11px] font-bold text-slate-500 tracking-wide"><i class="fa-solid fa-phone text-emerald-500 mr-0.5"></i> ${displayPhone}</span>
                                </div>
                                ${ad.subCategory ? '<div class="text-[11px] text-slate-500 font-medium mb-1">' + ad.subCategory.replace(' -> ', ' / ') + '</div>' : ''}
                                <h3 class="font-bold text-slate-900 mt-1 cursor-pointer text-sm leading-snug" onclick="openDetail('${ad.id}')">${ad.title}</h3>
                                <p class="text-slate-500 text-xs mt-1.5 line-clamp-2 whitespace-pre-line">${ad.description}</p>
                                ${adminVipWarningHTML}
                            </div>
                            <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span class="text-lg font-extrabold text-slate-900">${ad.price.toFixed(2)} AZN</span>
                                <div class="flex items-center gap-2">
                                    <a href="https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsgText)}" target="_blank" onclick="event.stopPropagation()" class="bg-emerald-500 hover:bg-emerald-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm transition" title="WhatsApp">
                                        <i class="fa-brands fa-whatsapp"></i>
                                    </a>
                                    <button onclick="openDetail('${ad.id}')" class="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition">Bax</button>
                                </div>
                            </div>
                        </div>
                    `;
                    gridEl.appendChild(card);
                });
            };

            appendSection("VIP Elanlar", "fa-crown", vipAds, "vipGrid");
            appendSection("Xüsusi Elanlar", "fa-thumbtack", pinnedAds, "pinnedGrid");
            appendSection("Elanlar", "fa-rectangle-ad", normalAds, "normalGrid");
        }

        window.setCategoryTab = function(cat) {
			currentCategoryTab = cat;
			document.getElementById('mainCategorySelect').value = cat;
			const catNameText = cat ? cat : "Kateqoriyalar";
			const selectedTextEl = document.getElementById('mainCategorySelectedText');
			if (selectedTextEl) selectedTextEl.innerText = catNameText;

			// Alt kateqoriyanı sıfırlamaq üçün əlavələr:
			selectedSubCategoryValue = '';
			const subCatSelectedText = document.getElementById('subCategorySelectedText');
			if (subCatSelectedText) subCatSelectedText.innerText = "Alt Kateqoriyalar";

			buildCustomAccordionDropdown(cat);
			updateActiveTabUI(cat);
			if (cat === '') {
				document.getElementById('sortSelect').value = 'newest';
				const sortSelectedText = document.getElementById('sortSelectedText');
				if (sortSelectedText) sortSelectedText.innerText = "Ən yenilər";
			}
			filterAds();
		};

        window.openDetail = async function(id) {
            const ad = ads.find(a => a.id === id);
            if (!ad) return;

            try {
                const adRef = doc(db, "ads", id);
                await updateDoc(adRef, { views: increment(1) });
                ad.views = (ad.views || 0) + 1;
            } catch (err) { console.error("View count update error:", err); }

            const displayPhone = ad.phone || "+994 50 545 85 86";
            const cleanPhone = displayPhone.replace(/[^0-9]/g, '');
            const whatsappMsgText = "Salam, " + ad.title + " elanı ilə maraqlanıram, hələ satılmayıb?";
            const whatsappUrl = "https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent(whatsappMsgText);
            const adSpecificUrl = window.location.origin + window.location.pathname + "?id=" + ad.id;
            const condition = ad.condition || 'Yeni';

            let imagesHTML = '';
            if (ad.images && ad.images.length > 0) {
			const escapedImagesStr = JSON.stringify(ad.images).replace(/"/g, '&quot;');
			let thumbsHTML = '';
			if (ad.images.length > 1) {
				thumbsHTML += '<div class="flex gap-2 overflow-x-auto pb-2">';
				for (let idx = 0; idx < ad.images.length; idx++) {
					const img = ad.images[idx];
					thumbsHTML += `
						<div class="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden border-2 border-transparent hover:border-primary cursor-pointer transition flex-shrink-0 flex items-center justify-center">
							<img src="${img}" onclick="document.getElementById('mainDetailImg').src='${img}'; document.getElementById('mainDetailImg').setAttribute('onclick', 'openImageModalWithList(${escapedImagesStr}, ${idx})'); document.getElementById('zoomText').setAttribute('onclick', 'openImageModalWithList(${escapedImagesStr}, ${idx})');" class="max-w-full max-h-full object-cover">
						</div>
					`;
				}
				thumbsHTML += '</div>';
			}

			imagesHTML = `
				<div class="mb-6">
					<div class="relative h-80 rounded-2xl overflow-hidden bg-slate-100 mb-3 border border-slate-200 flex items-center justify-center">
						<img id="mainDetailImg" src="${ad.images[0]}" onclick="openImageModalWithList(${escapedImagesStr}, 0)" class="max-w-full max-h-full object-cover cursor-pointer hover:opacity-95 transition" title="Şəkilə tam ekran baxmaq üçün klikləyin">
					</div>
					<p id="zoomText" class="text-[12px] text-center text-blue-600 mt-1 cursor-pointer -translate-y-2 hover:text-blue-800 hover:underline" onclick="openImageModalWithList(${escapedImagesStr}, 0)">Şəkli böyütmək üçün klikləyin</p>
					${thumbsHTML}
				</div>
			`;
		}

            const categoryText = ad.category + (ad.subCategory ? ' / ' + ad.subCategory.replace(' -> ', ' / ') : '');

            const content = document.getElementById('detailContent');
            content.innerHTML = `
                ${imagesHTML}
                <div class="flex justify-between items-start mb-4">
                    <div class="w-full pr-2">
                        <div style="font-size: 11px;" class="font-bold text-primary tracking-wide truncate mb-1 flex items-center gap-2">
                            <span>${categoryText}</span>
                            <span class="${condition === 'Yeni' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'} px-2 py-0.5 rounded text-[10px] font-bold">${condition}</span>
                        </div>
                        <h2 class="text-2xl font-bold text-slate-900 mt-1 leading-snug">${ad.title}</h2>
                        <div class="flex items-center gap-4 mt-2 flex-wrap">
                            <span class="text-xs text-slate-500 font-semibold"><i class="fa-solid fa-location-dot text-rose-500"></i> Sumqayıt</span>
                            <span class="text-xs text-slate-400"><i class="fa-solid fa-eye text-emerald-500"></i> Bu elana ${ad.views || 1} dəfə baxılıb</span>
                            <span class="text-xs font-bold text-slate-700 tracking-wide"><i class="fa-solid fa-phone text-emerald-500 mr-0.5"></i> ${displayPhone}</span>
                        </div>
                    </div>
                    <span class="text-2xl font-black text-slate-900 whitespace-nowrap ml-2">${ad.price.toFixed(2)} AZN</span>
                </div>
                <p class="text-slate-600 text-sm leading-relaxed mb-6 whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">${ad.description}</p>
                
                <div class="flex items-center gap-2 mb-6 flex-wrap">
                    <span class="text-xs font-semibold text-slate-400 mr-1">Paylaş:</span>
                    <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(ad.title + ' - ' + adSpecificUrl)}" target="_blank" class="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5">
                        <i class="fa-brands fa-whatsapp"></i> WhatsApp
                    </a>
                    <button onclick="navigator.clipboard.writeText('${adSpecificUrl}'); showToast('Elanın linki kopyalandı!');" class="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5">
                        <i class="fa-solid fa-copy"></i> Elanın linkini kopyala
                    </button>
                    <button onclick='copyAdText(${JSON.stringify(ad.title)}, ${JSON.stringify(ad.description)}, ${JSON.stringify(ad.price.toLocaleString())}, ${JSON.stringify(displayPhone)})' class="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5">
                        <i class="fa-solid fa-file-lines"></i> Mətni kopyala
                    </button>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-slate-200 flex-wrap gap-4">
                    <div class="flex items-center space-x-3 flex-wrap gap-y-2">
                        <a href="tel:${displayPhone}" class="bg-primary hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-semibold text-sm flex items-center space-x-2 shadow-lg shadow-primary/25 transition">
                            <i class="fa-solid fa-phone"></i>
                            <span>Zəng et</span>
                        </a>
                        <a href="${whatsappUrl}" target="_blank" class="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-semibold text-sm flex items-center space-x-2 transition">
                            <i class="fa-brands fa-whatsapp text-lg"></i>
                            <span>WhatsApp-a Yaz</span>
                        </a>
                    </div>
                    ${currentUser ? `
                        <div class="flex items-center space-x-2">
                            <button onclick="editAd('${ad.id}')" class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-3 rounded-xl font-semibold text-sm transition flex items-center gap-1.5"><i class="fa-solid fa-pen-to-square"></i> Düzəliş et</button>
                            <button onclick="deleteAd('${ad.id}')" class="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-3 rounded-xl font-semibold text-sm transition" title="Elanı sil"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    ` : ''}
                </div>
            `;
            document.getElementById('detailModal').classList.remove('hidden');
        };

        window.closeDetailModal = () => document.getElementById('detailModal').classList.add('hidden');
        
        window.openImageModalWithList = function(imagesArray, index) {
            activeFullscreenImages = imagesArray;
            currentFullscreenIndex = index;
            updateFullscreenImageView();
            document.getElementById('imageModal').classList.remove('hidden');
        };

        function updateFullscreenImageView() {
            const imgEl = document.getElementById('fullscreenImg');
            const counterEl = document.getElementById('imageCounter');
            if (activeFullscreenImages.length > 0 && imgEl && counterEl) {
                imgEl.src = activeFullscreenImages[currentFullscreenIndex];
                counterEl.innerText = (currentFullscreenIndex + 1) + " / " + activeFullscreenImages.length;
            }
        }
		
		window.closeImageModal = function() {
			document.getElementById('imageModal').classList.add('hidden');
			resetImageZoom();
		};

        window.openAddModal = () => {
            if(!document.getElementById('editingAdId').value) {
                document.getElementById('addAdForm').reset();
                document.getElementById('modalSubCategory').innerHTML = '<option value="">Əvvəl kateqoriya seçin...</option>';
                document.getElementById('adPhone').value = "+994 50 545 85 86";
                document.getElementById('modalTitleText').innerText = "Yeni Elan Yerləşdir (Admin)";
                document.getElementById('adIsVip').checked = false;
                document.getElementById('adIsPinned').checked = false;
                document.getElementById('vipDurationContainer').classList.add('hidden');
                document.querySelector('input[name="adCondition"][value="Yeni"]').checked = true;
                
                // MİQRASİYA PANELİNİ HƏR DƏFƏ BAĞLI VƏZİYYƏTƏ GƏTİRİRİK:
                const migrationBox = document.getElementById('migrationContent');
                if (migrationBox) migrationBox.classList.add('hidden');

                // BURASI VACİBDİR: Yeni elan açılarkən köhnə şəkilləri tamamilə sıfırlayırıq
                currentEditingImages = [];
                window.originalFiles = []; 
                renderEditingThumbnails();
            }
            document.getElementById('addModal').classList.remove('hidden');
        };

        window.closeAddModal = () => {
            document.getElementById('editingAdId').value = '';
            currentEditingImages = [];
            document.getElementById('addModal').classList.add('hidden');
        };

        window.openFavoritesModal = () => {
            renderFavorites();
            document.getElementById('favoritesModal').classList.remove('hidden');
        };
        window.closeFavoritesModal = () => document.getElementById('favoritesModal').classList.add('hidden');

        window.toggleFavorite = function(id) {
            const ad = ads.find(a => a.id === id);
            if (!ad) return;
            const index = favorites.findIndex(f => f.id === id);
            if (index > -1) {
                favorites.splice(index, 1);
                showToast("Elan favoritlərdən çıxarıldı", 'info');
            } else {
                favorites.push(ad);
                showToast("Elan favoritlərə əlavə olundu!");
            }
            localStorage.setItem('sumqayit_favs', JSON.stringify(favorites));
            updateFavCount();
            filterAds();
        };

        function updateFavCount() {
            const favCountEl = document.getElementById('favCount');
            if (favCountEl) favCountEl.innerText = favorites.length;
        }

        function renderFavorites() {
            const list = document.getElementById('favoritesList');
            if (!list) return;
            list.innerHTML = '';
            if (favorites.length === 0) {
                list.innerHTML = '<p class="text-center text-slate-500 py-8">Seçilmiş elan yoxdur.</p>';
                return;
            }
            favorites.forEach(ad => {
                const mainImg = (ad.images && ad.images.length > 0) ? ad.images[0] : "https://images.unsplash.com/photo-1588702547919-26b89e033105?auto=format&fit=crop&w=600&q=80";
                const priceVal = ad.price && typeof ad.price === 'object' && ad.price.price ? ad.price.price.toLocaleString() : Number(ad.price || 0).toLocaleString();
                const item = document.createElement('div');
                item.className = "flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200";
                item.innerHTML = `
                    <div class="flex items-center space-x-3 cursor-pointer" onclick="closeFavoritesModal(); openDetail('${ad.id}')">
                        <div class="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                            <img src="${mainImg}" class="max-w-full max-h-full object-cover">
                        </div>
                        <div>
                            <h4 class="font-bold text-sm text-slate-900 line-clamp-1">${ad.title}</h4>
                            <span class="text-xs font-bold text-slate-700">${priceVal} AZN</span>
                        </div>
                    </div>
                    <button onclick="toggleFavorite('${ad.id}'); renderFavorites();" class="text-rose-500 hover:text-rose-700 p-2"><i class="fa-solid fa-trash"></i></button>
                `;
                list.appendChild(item);
            });
        }

        window.resetFilters = function() {
            document.getElementById('searchInput').value = '';
            document.getElementById('mainCategorySelect').value = '';
            const mainCatText = document.getElementById('mainCategorySelectedText');
            if (mainCatText) mainCatText.innerText = "Kateqoriyalar";

            selectedSubCategoryValue = '';
            buildCustomAccordionDropdown('');
            
            document.getElementById('sortSelect').value = 'newest';
            const sortText = document.getElementById('sortSelectedText');
            if (sortText) sortText.innerText = "Ən yenilər";

            currentCategoryTab = '';
            updateActiveTabUI('');
            filterAds();
        };

        function checkUrlForAd() {
            const urlParams = new URLSearchParams(window.location.search);
            const adId = urlParams.get('id');
            if (adId) {
                const timer = setInterval(() => {
                    if (ads.length > 0) {
                        clearInterval(timer);
                        openDetail(adId);
                    }
                }, 200);
            }
        }

        initCategorySelectors();
        initStats();
        listenToAds();
        checkUrlForAd();
		
		window.resetAddAdForm = function() {
			document.getElementById('addAdForm').reset();
			document.getElementById('modalSubCategory').innerHTML = '<option value="">Əvvəl kateqoriya seçin...</option>';
			document.getElementById('adPhone').value = "+994 50 545 85 86";
			document.getElementById('adIsVip').checked = false;
			document.getElementById('adIsPinned').checked = false;
			document.getElementById('vipDurationContainer').classList.add('hidden');
			const defaultCondition = document.querySelector('input[name="adCondition"][value="Yeni"]');
			if (defaultCondition) defaultCondition.checked = true;
			currentEditingImages = [];
			renderEditingThumbnails();
			checkResetButtonColor();
			showToast("Forma sıfırlandı", "info");
		};

		function checkResetButtonColor() {
			const resetBtn = document.getElementById('resetFormBtn');
			if (!resetBtn) return;

			const title = document.getElementById('adTitle').value.trim();
			const mainCat = document.getElementById('modalMainCategory').value;
			const subCat = document.getElementById('modalSubCategory').value;
			const price = document.getElementById('adPrice').value.trim();
			const description = document.getElementById('adDescription').value.trim();
    
			if (title || mainCat || subCat || price || description || (typeof currentEditingImages !== 'undefined' && currentEditingImages.length > 0)) {
				resetBtn.className = "text-red-500 hover:text-red-600 font-semibold transition text-sm cursor-pointer select-none";
			} else {
				resetBtn.className = "text-slate-400 font-semibold transition text-sm cursor-pointer select-none";
			}
		}

		document.addEventListener('DOMContentLoaded', function() {
			checkResetButtonColor();
		});

		document.addEventListener('input', function(e) {
			if (e.target.closest('#addAdForm')) {
				checkResetButtonColor();
			}
		});

		document.addEventListener('change', function(e) {
			if (e.target.closest('#addAdForm')) {
				checkResetButtonColor();
			}
		});
		
		document.addEventListener('keydown', function(e) {
			const imageModal = document.getElementById('imageModal');
			const detailModal = document.getElementById('detailModal');
			
			const isImageModalOpen = imageModal && !imageModal.classList.contains('hidden');
			const isDetailModalOpen = detailModal && !detailModal.classList.contains('hidden');

			if (e.key === 'Escape') {
				if (isImageModalOpen) {
					closeImageModal();
				} else if (isDetailModalOpen) {
					closeDetailModal();
				}
			} else if (isImageModalOpen) {
				if (e.key === 'ArrowRight') {
                    if (typeof nextFullscreenImage === 'function') nextFullscreenImage();
				} else if (e.key === 'ArrowLeft') {
                    if (typeof prevFullscreenImage === 'function') prevFullscreenImage();
				}
			}
		});
		
		let isZoomed = false;
		const scaleFactor = 2.5;

		function resetImageZoom() {
			isZoomed = false;
			const imgEl = document.getElementById('fullscreenImg');
			if (imgEl) {
				imgEl.style.transform = 'translate(0px, 0px) scale(1)';
				imgEl.style.cursor = 'zoom-in';
				imgEl.style.transition = 'transform 0.3s ease'; 
			}
		}

		window.updateFullscreenImageView = function() {
			const imgEl = document.getElementById('fullscreenImg');
			const counterEl = document.getElementById('imageCounter');
			if (activeFullscreenImages.length > 0 && imgEl) {
				imgEl.src = activeFullscreenImages[currentFullscreenIndex];
				counterEl.innerText = (currentFullscreenIndex + 1) + " / " + activeFullscreenImages.length;
				resetImageZoom();
			}
		}

		document.addEventListener('DOMContentLoaded', () => {
			const imgEl = document.getElementById('fullscreenImg');
			const containerEl = imgEl ? imgEl.parentElement : null;
			if (!imgEl || !containerEl) return;

			imgEl.style.cursor = 'zoom-in';
			containerEl.style.overflow = 'hidden';

			imgEl.addEventListener('click', function(e) {
				e.stopPropagation();
				isZoomed = !isZoomed;

				if (isZoomed) {
					imgEl.style.transition = 'transform 0.1s ease-out';
					imgEl.style.cursor = 'zoom-out';

					const containerRect = containerEl.getBoundingClientRect();
					const imgRect = imgEl.getBoundingClientRect();

					const centerX = containerRect.left + containerRect.width / 2;
					const centerY = containerRect.top + containerRect.height / 2;

					let moveX = (centerX - e.clientX) * (scaleFactor - 1);
					let moveY = (centerY - e.clientY) * (scaleFactor - 1);

					const maxX = (imgRect.width * scaleFactor - containerRect.width) / 2;
					const maxY = (imgRect.height * scaleFactor - containerRect.height) / 2;

					moveX = Math.max(-maxX, Math.min(maxX, moveX));
					moveY = Math.max(-maxY, Math.min(maxY, moveY));

					imgEl.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scaleFactor})`;
				} else {
					resetImageZoom();
				}
			});

			imgEl.addEventListener('mousemove', function(e) {
				if (!isZoomed) return;

				const containerRect = containerEl.getBoundingClientRect();
				const imgRect = imgEl.getBoundingClientRect();

				const centerX = containerRect.left + containerRect.width / 2;
				const centerY = containerRect.top + containerRect.height / 2;

				let moveX = (centerX - e.clientX) * (scaleFactor - 1);
				let moveY = (centerY - e.clientY) * (scaleFactor - 1);

				const maxX = (imgRect.width * scaleFactor - containerRect.width) / 2;
				const maxY = (imgRect.height * scaleFactor - containerRect.height) / 2;

				moveX = Math.max(-maxX, Math.min(maxX, moveX));
				moveY = Math.max(-maxY, Math.min(maxY, moveY));

				imgEl.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scaleFactor})`;
			});

			containerEl.addEventListener('mouseleave', function() {
				if (isZoomed) {
					 imgEl.style.transform = `translate(0px, 0px) scale(${scaleFactor})`;
				}
			});
		});

		window.nextFullscreenImage = function() {
			if (activeFullscreenImages.length > 1) {
				currentFullscreenIndex = (currentFullscreenIndex + 1) % activeFullscreenImages.length;
				updateFullscreenImageView();
				resetImageZoom();
			}
		};

		window.prevFullscreenImage = function() {
			if (activeFullscreenImages.length > 1) {
				currentFullscreenIndex = (currentFullscreenIndex - 1 + activeFullscreenImages.length) % activeFullscreenImages.length;
				updateFullscreenImageView();
				resetImageZoom();
			}
		};
		
		// Trafik ölçmə və artım funksiyası (onComplete callback əlavə olundu)
		function calculateAndUpdateTraffic(onComplete) {
			let totalBytes = 0;
			
			// 1. Brauzerdə yüklənən resurslar
			if (performance && performance.getEntriesByType) {
				const resources = performance.getEntriesByType('resource');
				resources.forEach(res => {
					totalBytes += (res.decodedBodySize || res.transferSize || 0);
				});
			}
			
			if (performance.getEntriesByType('navigation')[0]) {
				const nav = performance.getEntriesByType('navigation')[0];
				totalBytes += (nav.decodedBodySize || nav.transferSize || 0);
			}

			// 2. Firebase-dən gələn elanların həcmi
			if (typeof ads !== 'undefined' && ads.length > 0) {
				try {
					totalBytes += new Blob([JSON.stringify(ads)]).size;
				} catch(e) {}
			}

			const targetBytes = totalBytes;
			const sizeEl = document.getElementById('topTrafficSize');
			
			if (sizeEl && targetBytes > 0) {
				let currentBytes = 0;
				const step = targetBytes / 25; 
				
				const timer = setInterval(() => {
					currentBytes += step;
					if (currentBytes >= targetBytes) {
						currentBytes = targetBytes;
						clearInterval(timer);
						
						// MEQABAYTLAR TAM YIĞILIB QURTARDI: İndi xəbər veririk ki, spinner gizlənsin
						if (typeof onComplete === 'function') {
							onComplete();
						}
					}

					let formattedSize = "";
					if (currentBytes < 1024 * 1024) {
						formattedSize = (currentBytes / 1024).toFixed(1) + " KB";
					} else if (currentBytes < 1024 * 1024 * 1024) {
						formattedSize = (currentBytes / (1024 * 1024)).toFixed(2) + " MB";
					} else {
						formattedSize = (currentBytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
					}

					sizeEl.innerText = formattedSize;
				}, 40);
			} else {
				if (typeof onComplete === 'function') {
					onComplete();
				}
			}
		}
		
		// Səhifə açılan kimi ilkin resurs həcmini dərhal hesablayıb hərəkətə başlayırıq
		window.addEventListener('load', () => {
			// İlkin olaraq səhifənin yüklənmə həcmini dərhal göstərək ki, sıfırda qalmasın
			calculateAndUpdateTraffic();
		});
