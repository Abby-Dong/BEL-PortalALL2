// Common JavaScript functionality for BEL Portal
document.addEventListener('DOMContentLoaded', async () => {
    // --- Initialize Data and UI ---
    await initializeGlobalData();
    
    // --- Basic UI and Navigation ---
    const sidebar = document.getElementById('bel-sidebar');
    const hamburgerBtn = document.getElementById('bel-hamburger-btn');
    const contentLinks = document.querySelectorAll('.bel-sidebar-nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const notificationBell = document.getElementById('notification-bell');
    const notificationPanel = document.getElementById('notification-panel');
    const languageSelector = document.getElementById('language-selector');
    const languagePanel = document.getElementById('language-panel');
    const userProfile = document.querySelector('.bel-user-profile');
    const userProfilePanel = document.getElementById('user-profile-panel');

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    
    function showContent(targetId) {
        contentSections.forEach(section => section.classList.remove('active'));
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    // Navigation for multi-page architecture
    contentLinks.forEach(link => {
        // Only prevent default for hash links (if any remain)
        if (link.getAttribute('href').startsWith('#')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                showContent(targetId);
                contentLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                if (window.innerWidth <= 768) sidebar.classList.remove('open');
            });
        } else {
            // For file links, just close sidebar on mobile
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) sidebar.classList.remove('open');
            });
        }
    });

    // Handle panel links (like in user profile dropdown)
    document.querySelectorAll('.panel-link').forEach(link => {
        const targetHref = link.getAttribute('href');
        if(targetHref && targetHref.startsWith('#')) {
            // Legacy hash links - convert to SPA behavior if needed
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = targetHref.substring(1);
                showContent(targetId);
                contentLinks.forEach(l => l.classList.remove('active'));
                document.querySelector(`.bel-sidebar-nav-link[href="#${targetId}"]`)?.classList.add('active');
                userProfilePanel.classList.remove('show');
            });
        } else {
            // File links - just close the panel
            link.addEventListener('click', () => {
                userProfilePanel.classList.remove('show');
            });
        }
    });

    // Set active state for current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    let activeHref = 'index.html'; // default to dashboard
    
    if (currentPage === 'index.html' || currentPage === '') {
        activeHref = 'index.html';
    } else if (currentPage === 'my-account.html') {
        activeHref = 'my-account.html';
    } else if (currentPage === 'earnings-orders.html') {
        activeHref = 'earnings-orders.html';
    } else if (currentPage === 'resource-center.html') {
        activeHref = 'resource-center.html';
    } else if (currentPage === 'support-faq.html') {
        activeHref = 'support-faq.html';
    } else if (currentPage === 'terms.html') {
        activeHref = 'terms.html';
    }
    
    const activeLink = document.querySelector(`.bel-sidebar-nav-link[href="${activeHref}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    if (notificationBell && notificationPanel) {
        notificationBell.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            notificationPanel.classList.toggle('show'); 
            // Close other panels when this one opens
            if (languagePanel) languagePanel.classList.remove('show');
            if (userProfilePanel) userProfilePanel.classList.remove('show');
        });
    }

    if (languageSelector && languagePanel) {
        languageSelector.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            languagePanel.classList.toggle('show'); 
            // Close other panels when this one opens
            if (notificationPanel) notificationPanel.classList.remove('show');
            if (userProfilePanel) userProfilePanel.classList.remove('show');
        });
        
        // Handle language selection
        const languageItems = languagePanel.querySelectorAll('.bel-language-item');
        languageItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const selectedLang = item.dataset.lang;
                
                // Remove active class from all items
                languageItems.forEach(li => li.classList.remove('active'));
                // Add active class to selected item
                item.classList.add('active');
                
                // Here you can add language switching logic
                console.log('Language selected:', selectedLang);
                
                // Close the panel
                languagePanel.classList.remove('show');
            });
        });
    }

    window.addEventListener('click', (e) => {
        if (notificationPanel && !notificationPanel.contains(e.target) && !notificationBell.contains(e.target)) {
            notificationPanel.classList.remove('show');
        }
        if (languagePanel && !languagePanel.contains(e.target) && !languageSelector.contains(e.target)) {
            languagePanel.classList.remove('show');
        }
        if (userProfilePanel && !userProfilePanel.contains(e.target) && !userProfile.contains(e.target)) {
            userProfilePanel.classList.remove('show');
        }
    });
        
    if(userProfile && userProfilePanel) {
        userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other panels when this one opens
            if (notificationPanel) notificationPanel.classList.remove('show');
            if (languagePanel) languagePanel.classList.remove('show');
            userProfilePanel.classList.toggle('show');
        });
    }
        
    document.querySelectorAll('.faq-question').forEach(b => b.addEventListener('click', () => b.parentElement.classList.toggle('active')));
        
    // --- My Account Page Edit/Save Logic ---
    document.querySelectorAll('.editable-panel').forEach(panel => {
        const editButton = panel.querySelector('.edit-button');
        const saveButton = panel.querySelector('.save-button');
        const cancelButton = panel.querySelector('.cancel-button');
        const inputs = panel.querySelectorAll('input');
        
        // Store original values
        let originalValues = {};
        
        // Store original values when entering edit mode
        function storeOriginalValues() {
            originalValues = {};
            inputs.forEach(input => {
                originalValues[input.id] = input.value;
            });
        }
        
        // Check if any values have changed
        function hasChanges() {
            return Array.from(inputs).some(input => 
                originalValues[input.id] !== input.value
            );
        }
        
        // Update save button state
        function updateSaveButtonState() {
            if (panel.classList.contains('edit-mode')) {
                if (hasChanges()) {
                    saveButton.classList.remove('secondary');
                    saveButton.classList.add('primary');
                    saveButton.disabled = false;
                } else {
                    saveButton.classList.remove('primary');
                    saveButton.classList.add('secondary');
                    saveButton.disabled = true;
                }
            }
        }

        if(editButton) {
            editButton.addEventListener('click', () => {
                panel.classList.add('edit-mode');
                inputs.forEach(input => input.removeAttribute('readonly'));
                storeOriginalValues();
                updateSaveButtonState();
                
                // Update avatar button visibility when entering edit mode
                if (panel.id === 'account-profile-panel') {
                    updateRemoveButtonVisibility();
                }
                
                if(inputs.length > 0) inputs[0].focus();
            });
        }

        // Add input listeners to monitor changes
        inputs.forEach(input => {
            input.addEventListener('input', updateSaveButtonState);
            input.addEventListener('change', updateSaveButtonState);
        });

        function exitEditMode() {
            panel.classList.remove('edit-mode');
            inputs.forEach(input => input.setAttribute('readonly', 'true'));
            saveButton.classList.remove('primary');
            saveButton.classList.add('secondary');
            saveButton.disabled = false;
            
            // Update avatar button visibility when exiting edit mode
            if (panel.id === 'account-profile-panel') {
                updateRemoveButtonVisibility();
            }
        }
        
        function cancelChanges() {
            // Restore original values
            inputs.forEach(input => {
                if (originalValues[input.id] !== undefined) {
                    input.value = originalValues[input.id];
                }
            });
            exitEditMode();
        }
        
        function saveChanges() {
            if (hasChanges()) {
                // Here you can add API call to save changes
                console.log('Saving changes for', panel.id);
                console.log('New values:', Array.from(inputs).reduce((acc, input) => {
                    acc[input.id] = input.value;
                    return acc;
                }, {}));
                
                // Show success modal
                showSuccessModal();
                
                // Update original values to current values
                storeOriginalValues();
            }
            exitEditMode();
        }
        
        if(saveButton) saveButton.addEventListener('click', saveChanges);
        if(cancelButton) cancelButton.addEventListener('click', cancelChanges);
    });

    // --- Profile Avatar Upload Logic ---
    const avatarUploadBtn = document.getElementById('avatar-upload-btn');
    const avatarRemoveBtn = document.getElementById('avatar-remove-btn');
    const avatarUploadInput = document.getElementById('avatar-upload');
    const avatarPreview = document.querySelector('.avatar-preview');
    const avatarImg = document.getElementById('profile-avatar-img');
    const defaultAvatarUrl = 'https://irp.cdn-website.com/56869327/dms3rep/multi/AVATAR-G.png';

    // Initialize avatar state from loaded data
    let currentAvatarUrl = defaultAvatarUrl;
    let hasCustomAvatar = false;
    
    // Initialize after data is loaded
    if (avatarImg) {
        currentAvatarUrl = avatarImg.src || defaultAvatarUrl;
        hasCustomAvatar = currentAvatarUrl !== defaultAvatarUrl;
    }

    // Update remove button visibility based on edit mode and avatar state
    function updateRemoveButtonVisibility() {
        if (avatarRemoveBtn) {
            // Show remove button only if we have custom avatar and are in edit mode
            const panel = document.getElementById('account-profile-panel');
            const isEditMode = panel && panel.classList.contains('edit-mode');
            const shouldShow = hasCustomAvatar && isEditMode;
            avatarRemoveBtn.style.display = shouldShow ? 'inline-flex' : 'none';
        }
    }

    // Initialize remove button state
    updateRemoveButtonVisibility();

    // Handle avatar upload button click - only works in edit mode
    if (avatarUploadBtn && avatarUploadInput) {
        avatarUploadBtn.addEventListener('click', () => {
            const panel = document.getElementById('account-profile-panel');
            if (panel && panel.classList.contains('edit-mode')) {
                avatarUploadInput.click();
            }
        });
    }

    // Handle avatar preview click - only works in edit mode
    if (avatarPreview && avatarUploadInput) {
        avatarPreview.addEventListener('click', () => {
            const panel = document.getElementById('account-profile-panel');
            if (panel && panel.classList.contains('edit-mode')) {
                avatarUploadInput.click();
            }
        });
    }

    // Handle file selection
    if (avatarUploadInput && avatarImg) {
        avatarUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            
            if (file) {
                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    alert('Please select a valid image file (JPG, PNG, GIF, or WebP).');
                    return;
                }

                // Validate file size (5MB max)
                const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                if (file.size > maxSize) {
                    alert('File size must be less than 5MB.');
                    return;
                }

                // Show uploading state
                if (avatarPreview) {
                    avatarPreview.classList.add('uploading');
                }

                // Read and display the file
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Simulate upload delay
                    setTimeout(() => {
                        avatarImg.src = e.target.result;
                        currentAvatarUrl = e.target.result;
                        hasCustomAvatar = true;
                        
                        // Update UI state
                        if (avatarPreview) {
                            avatarPreview.classList.remove('uploading');
                        }
                        updateRemoveButtonVisibility();
                        
                        // Update header avatar too
                        const headerAvatar = document.querySelector('.bel-user-profile img');
                        if (headerAvatar) {
                            headerAvatar.src = e.target.result;
                        }

                        // Here you would typically upload to server and update user profile
                        console.log('Avatar uploaded successfully');
                        
                        // Update user profile data in localStorage for demo purposes
                        if (window.dataLoader && window.dataLoader.userProfile) {
                            window.dataLoader.userProfile.avatar = e.target.result;
                        }
                        
                        // Show success message
                        showSuccessModal();
                    }, 1000);
                };
                
                reader.onerror = () => {
                    if (avatarPreview) {
                        avatarPreview.classList.remove('uploading');
                        avatarPreview.classList.add('error');
                        setTimeout(() => {
                            avatarPreview.classList.remove('error');
                        }, 1000);
                    }
                    alert('Error reading file. Please try again.');
                };
                
                reader.readAsDataURL(file);
            }
        });
    }

    // Handle avatar removal
    if (avatarRemoveBtn && avatarImg) {
        avatarRemoveBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to remove your profile picture?')) {
                // Reset to default avatar
                avatarImg.src = defaultAvatarUrl;
                currentAvatarUrl = defaultAvatarUrl;
                hasCustomAvatar = false;
                
                // Update UI state
                updateRemoveButtonVisibility();
                
                // Update header avatar too
                const headerAvatar = document.querySelector('.bel-user-profile img');
                if (headerAvatar) {
                    headerAvatar.src = defaultAvatarUrl;
                }

                // Clear file input
                if (avatarUploadInput) {
                    avatarUploadInput.value = '';
                }

                // Here you would typically remove from server and update user profile
                console.log('Avatar removed successfully');
                
                // Update user profile data in localStorage for demo purposes
                if (window.dataLoader && window.dataLoader.userProfile) {
                    window.dataLoader.userProfile.avatar = defaultAvatarUrl;
                }
                
                // Show success message
                showSuccessModal();
            }
        });
    }

    // --- Success Modal Logic ---
    function showSuccessModal() {
        const successModal = document.getElementById('success-modal');
        if (successModal) {
            successModal.classList.add('show');
        }
    }
    
    const successModal = document.getElementById('success-modal');
    if (successModal) {
        const successCloseButton = successModal.querySelector('.success-modal-close');
        
        const closeSuccessModal = () => successModal.classList.remove('show');
        
        if (successCloseButton) successCloseButton.addEventListener('click', closeSuccessModal);
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                closeSuccessModal();
            }
        });
    }
        
    // --- Payout Information Help Modal Logic ---
    const payoutInfoModal = document.getElementById('payout-info-modal');
    const payoutInfoHelp = document.getElementById('payout-info-help');
    if (payoutInfoModal && payoutInfoHelp) {
        const closeModalButton = payoutInfoModal.querySelector('.modal-close-button');

        const openPayoutModal = (e) => {
            e.preventDefault();
            payoutInfoModal.classList.add('show');
        };
        const closePayoutModal = () => payoutInfoModal.classList.remove('show');

        payoutInfoHelp.addEventListener('click', openPayoutModal);
        if (closeModalButton) closeModalButton.addEventListener('click', closePayoutModal);
        payoutInfoModal.addEventListener('click', (e) => {
            if (e.target === payoutInfoModal) {
                closePayoutModal();
            }
        });
    }
        
    // --- Language Setting Logic ---
    const langRow = document.getElementById('language-setting-row');
    if(langRow) {
        const langValue = langRow.querySelector('#language-current-value');
        const langSelectGroup = langRow.querySelector('#language-select-group');
        const langArrow = langRow.querySelector('#language-arrow');
        const saveLangBtn = langRow.querySelector('#save-language-btn');
        const langSelect = langRow.querySelector('#language-select');

        langRow.addEventListener('click', (e) => {
            if (!langSelectGroup.contains(e.target)) {
                langValue.style.display = 'none';
                langArrow.style.display = 'none';
                langSelectGroup.style.display = 'flex';
            }
        });

        if (saveLangBtn) {
            saveLangBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                langValue.textContent = langSelect.value;
                langValue.style.display = 'block';
                langArrow.style.display = 'block';
                langSelectGroup.style.display = 'none';
            });
        }
    }
        
    // --- Contact Support Modal Logic ---
    const contactSupportBtn = document.getElementById('contact-support-btn');
    const contactSupportModal = document.getElementById('contact-support-modal');
    const contactSupportForm = document.getElementById('contact-support-form');
    const closeContactModalBtn = document.getElementById('close-contact-modal');
    const cancelSupportBtn = document.getElementById('cancel-support-btn');

    if (contactSupportBtn && contactSupportModal) {
        const openContactModal = () => {
            contactSupportModal.classList.add('show');
            // Clear form
            const form = contactSupportModal.querySelector('#contact-support-form');
            if (form) form.reset();
        };
        
        const closeContactModal = () => {
            contactSupportModal.classList.remove('show');
        };

        contactSupportBtn.addEventListener('click', openContactModal);
        if (closeContactModalBtn) closeContactModalBtn.addEventListener('click', closeContactModal);
        if (cancelSupportBtn) cancelSupportBtn.addEventListener('click', closeContactModal);
        
        contactSupportModal.addEventListener('click', (e) => {
            if (e.target === contactSupportModal) {
                closeContactModal();
            }
        });

        // Handle form submission
        if (contactSupportForm) {
            contactSupportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const subject = document.getElementById('support-subject').value.trim();
                const message = document.getElementById('support-message').value.trim();
                if (subject && message) {
                    // 產生新 ticketId
                    let nextNum = 1;
                    if (window.ticketsData && window.ticketsData.length > 0) {
                        const nums = window.ticketsData.map(t => {
                            const m = t.ticketId.match(/TICK-(\d+)-(\d+)/);
                            return m ? parseInt(m[2], 10) : 0;
                        });
                        nextNum = Math.max(...nums) + 1;
                    }
                    const today = new Date();
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const dd = String(today.getDate()).padStart(2, '0');
                    const ticketId = `TICK-${yyyy}-${String(nextNum).padStart(3, '0')}`;
                    const newTicket = {
                        ticketId,
                        subject,
                        message,
                        status: 'Open',
                        response: 'Pending Review',
                        lastUpdated: `${yyyy}-${mm}-${dd}`
                    };
                    if (!window.ticketsData) window.ticketsData = [];
                    window.ticketsData.unshift(newTicket);
                    // 重新渲染表格
                    const ticketsTable = document.getElementById('support-tickets-table');
                    if (ticketsTable) {
                        const tbody = ticketsTable.querySelector('tbody');
                        if (tbody) {
                            tbody.innerHTML = window.ticketsData.map(ticket => {
                                let responseStatus = 'Pending';
                                if (ticket.response && !['Pending Review', 'Under Investigation', '-'].includes(ticket.response.trim()) && ticket.response.trim().length > 0) {
                                    responseStatus = 'Replied';
                                }
                                return `
                                <tr>
                                    <td>${ticket.ticketId}</td>
                                    <td>${ticket.lastUpdated}</td>
                                    <td>${ticket.subject}</td>
                                    <td><span class="bel-badge ${ticket.status.toLowerCase() === 'open' ? 'pending' : 'completed'}">${ticket.status}</span></td>
                                    <td>${responseStatus}</td>
                                    <td>
                                        <button class="bel-btn-s secondary" onclick="viewTicket('${ticket.ticketId}')">
                                            <i class="fas fa-eye"></i> View
                                        </button>
                                    </td>
                                </tr>
                                `;
                            }).join('');
                        }
                    }
                    // Show success modal
                    const successModal = document.getElementById('success-modal');
                    if (successModal) {
                        successModal.classList.add('show');
                    }
                    // Close contact modal
                    closeContactModal();
                }
            });
        }
    }
        
    // --- Copy Button Logic ---
    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', () => {
            const targetInput = document.getElementById(button.dataset.copyTarget);
            if (targetInput) {
                navigator.clipboard.writeText(targetInput.value).then(() => {
                    const originalText = button.innerHTML;
                    button.innerHTML = 'COPIED!';
                    setTimeout(() => {
                        button.innerHTML = originalText;
                    }, 2000);
                });
            }
        });
    });
        
    // --- Resource Filter Logic ---
    const filterContainer = document.getElementById('resource-filter');
    const resourceCards = document.querySelectorAll('.resource-card');
    
    if(filterContainer && resourceCards.length > 0) {
        console.log('Resource filter initialized with', resourceCards.length, 'cards');
        
        // Function to apply filter
        function applyResourceFilter(filter) {
            console.log('Applying filter:', filter);
            resourceCards.forEach(card => {
                const category = card.dataset.category;
                if (category === filter) {
                    card.style.display = 'block';
                    console.log('Showing card with category:', category);
                } else {
                    card.style.display = 'none';
                    console.log('Hiding card with category:', category);
                }
            });
        }
        
        // Apply initial filter on page load based on active button
        const activeFilterBtn = filterContainer.querySelector('.filter-btn.active');
        if (activeFilterBtn) {
            const initialFilter = activeFilterBtn.dataset.filter;
            console.log('Initial filter detected:', initialFilter);
            // Add a small delay to ensure DOM is fully loaded
            setTimeout(() => {
                applyResourceFilter(initialFilter);
            }, 100);
        }
        
        // Handle filter button clicks
        filterContainer.addEventListener('click', (e) => {
            const target = e.target.closest('.filter-btn');
            if(target) {
                const currentActive = filterContainer.querySelector('.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                target.classList.add('active');
                const filter = target.dataset.filter;
                applyResourceFilter(filter);
            }
        });
    } else {
        console.log('Resource filter not initialized - missing elements');
    }

    // --- Date Range Filtering Logic ---
    function applyDateFilter(table, dateInput) {
        if (typeof flatpickr !== 'undefined') {
            flatpickr(dateInput, {
                mode: "range",
                dateFormat: "Y-m-d",
                onChange: function(selectedDates) {
                    if (selectedDates.length !== 2) {
                        // If range is cleared, show all rows
                        table.querySelectorAll('tbody tr').forEach(row => {
                            row.style.display = '';
                        });
                        return;
                    }

                    const startDate = selectedDates[0];
                    const endDate = selectedDates[1];

                    table.querySelectorAll('tbody tr').forEach(row => {
                        const dateCell = row.querySelector('td:first-child');
                        if (dateCell) {
                            const rowDate = new Date(dateCell.textContent);
                            if (rowDate >= startDate && rowDate <= endDate) {
                                row.style.display = '';
                            } else {
                                row.style.display = 'none';
                            }
                        }
                    });
                }
            });
        }
    }

    const payoutTable = document.getElementById('payout-history-table');
    const payoutDateFilterInput = document.getElementById('payout-date-filter');
    if(payoutTable && payoutDateFilterInput) {
        applyDateFilter(payoutTable, payoutDateFilterInput);
    }

    const orderTable = document.getElementById('order-tracking-table');
    const orderDateFilterInput = document.getElementById('order-date-filter');
    if(orderTable && orderDateFilterInput) {
        applyDateFilter(orderTable, orderDateFilterInput);
    }
        
    // --- Table Sorting Logic ---
    function makeTableSortable(table) {
        const headers = table.querySelectorAll('th[data-sortable]');
        const tbody = table.querySelector('tbody');

        headers.forEach((header, index) => {
            header.addEventListener('click', () => {
                const rows = Array.from(tbody.querySelectorAll('tr'));
                const sortDir = header.getAttribute('data-sort-dir') === 'asc' ? 'desc' : 'asc';
                const dataType = header.getAttribute('data-type') || 'string';

                // Remove sort direction from other headers
                headers.forEach(h => h.removeAttribute('data-sort-dir'));
                header.setAttribute('data-sort-dir', sortDir);

                // Sort the rows
                rows.sort((a, b) => {
                    let valA = a.children[index].textContent.trim();
                    let valB = b.children[index].textContent.trim();

                    // Handle different data types
                    switch (dataType) {
                        case 'number':
                            valA = parseFloat(valA.replace(/[^0-9.-]+/g,""));
                            valB = parseFloat(valB.replace(/[^0-9.-]+/g,""));
                            break;
                        case 'date':
                            valA = new Date(valA);
                            valB = new Date(valB);
                            break;
                    }

                    if (valA < valB) {
                        return sortDir === 'asc' ? -1 : 1;
                    }
                    if (valA > valB) {
                        return sortDir === 'asc' ? 1 : -1;
                    }
                    return 0;
                });

                // Re-append rows to the tbody
                tbody.innerHTML = '';
                rows.forEach(row => tbody.appendChild(row));
            });
        });
    }
        
    // Apply the sortable logic to tables
    const payoutHistoryTable = document.getElementById('payout-history-table');
    if (payoutHistoryTable) {
        makeTableSortable(payoutHistoryTable);
    }
    const orderTrackingTable = document.getElementById('order-tracking-table');
    if (orderTrackingTable) {
        makeTableSortable(orderTrackingTable);
    }

    // --- Payout History View Switcher Logic ---
    const payoutSwitcher = document.getElementById('payout-view-switcher');
    const payoutListView = document.getElementById('payout-list-view');
    const payoutChartView = document.getElementById('payout-chart-view');

    if (payoutSwitcher) {
        const viewBtns = payoutSwitcher.querySelectorAll('.view-btn');
        
        payoutSwitcher.addEventListener('click', (e) => {
            const clickedBtn = e.target.closest('.view-btn');
            if (!clickedBtn || clickedBtn.classList.contains('active')) {
                return; // Do nothing if not a button or already active
            }

            viewBtns.forEach(btn => btn.classList.remove('active'));
            clickedBtn.classList.add('active');

            const viewToShow = clickedBtn.dataset.view;
            if (viewToShow === 'list') {
                payoutListView.style.display = 'block';
                payoutChartView.style.display = 'none';
            } else {
                payoutListView.style.display = 'none';
                payoutChartView.style.display = 'block';
                if (typeof renderPayoutChart === 'function') {
                    renderPayoutChart(); // Call function to render chart
                }
            }
        });
    }
});

// View ticket function
function viewTicket(ticketId) {
    // Find ticket data (search in table data for now)
    let ticket = null;
    if (window.ticketsData && Array.isArray(window.ticketsData)) {
        ticket = window.ticketsData.find(t => t.ticketId === ticketId);
    }
    if (!ticket) {
        // fallback: try to find in table
        const row = Array.from(document.querySelectorAll('#support-tickets-table tbody tr')).find(tr => tr.children[0]?.textContent === ticketId);
        if (row) {
            ticket = {
                ticketId: row.children[0].textContent,
                lastUpdated: row.children[1].textContent,
                subject: row.children[2].textContent,
                status: row.children[3].textContent,
                response: row.children[4].textContent
            };
        }
    }
    if (!ticket) {
        alert('Ticket not found.');
        return;
    }
    const modal = document.getElementById('view-detail-modal');
    const body = document.getElementById('view-detail_body');
        if (modal && body) {
            // Modal header: Subject 作為主標題
            const header = document.getElementById('view-detail-modal-header');
            if (header) {
                header.innerHTML = `
                    <div style=\"display:flex;align-items:flex-start;flex-direction:column; width: 100%;\">
                        <h3 style=\"margin:0; font-size:1.3rem; font-weight:700; color:var(--ds-color-gray-90);\">${ticket.subject}</h3>
                        <div style=\"margin-top:6px; font-size:0.92rem; font-weight:400; color:var(--ds-color-gray-60);\">
                            ${ticket.ticketId} | ${ticket.lastUpdated || '-'}
                        </div>
                    </div>`;
            }
            
            // 主體內容：Message + Response
            let responseContent = '';
            const noReplyVals = ['Pending Review', 'Under Investigation', '-', '', null, undefined];
            if (!ticket.response || noReplyVals.includes(ticket.response.trim())) {
                responseContent = `
                    <div style="color:var(--ds-color-gray-60); font-style:italic;">No Reply</div>
                    <div style="margin-top:32px; padding-top:16px; border-top:1px solid var(--ds-color-gray-20);">
                        <div style="color:var(--ds-color-gray-50); font-size:0.85rem; line-height:1.5;">
                            We haven't responded to your ticket yet. Our support team typically responds within 24 hours during business days. 
                            If you have urgent matters, please contact us directly at 
                            <a href="mailto:Service.iotmart@advantech.com" style="color:var(--ds-color-link); text-decoration:none;">Service.iotmart@advantech.com</a>
                        </div>
                    </div>
                `;
            } else {
                responseContent = `
                    <div class=\"ticket-response-container\">
                        <div class=\"ticket-response-content\">${ticket.response}</div>
                        <div class=\"ticket-response-meta\">Replied at: ${ticket.lastUpdated || '-'}</div>
                    </div>
                    <div style=\"margin-top:16px; padding-top:12px; border-top:1px solid var(--ds-color-gray-20);\">
                        <div style=\"color:var(--ds-color-gray-50); font-size:0.85rem; line-height:1.5;\">
                            If you have any additional questions or need further assistance regarding this response, please contact 
                            <a href=\"mailto:Service.iotmart@advantech.com\" style=\"color:var(--ds-color-link); text-decoration:none;\">Service.iotmart@advantech.com</a>.
                        </div>
                    </div>
                `;
            }
            
            body.innerHTML = `
                <div style=\"margin-bottom: 24px;\">
                    ${ticket.message ? `<div style=\"font-size:1rem; line-height:1.6; color:var(--ds-color-gray-80);\">${ticket.message}<\/div>` : '<div style=\"color:var(--ds-color-gray-60); font-style:italic;\">No message content</div>'}
                </div>
                <div style=\"margin-bottom: 0;\">
                    <div style=\"font-size:1rem; font-weight:600; color:var(--ds-color-gray-70); margin-bottom:8px;\">Response</div>
                    ${responseContent}
                </div>
            `;
            modal.classList.add('show');
        }
    // 關閉事件
    const closeModal = () => modal.classList.remove('show');
    document.getElementById('close-view-detail-modal')?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

// Global data initialization
async function initializeGlobalData() {
    try {
        // Load and populate notifications
        await loadNotifications();
        
        // Load and populate user profile data in header
        await loadUserProfileHeader();
        
        // Load page-specific data based on current page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        switch (currentPage) {
            case 'index.html':
            case '':
                await loadDashboardData();
                break;
            case 'my-account.html':
                await loadAccountData();
                break;
            case 'earnings-orders.html':
                await loadEarningsData();
                break;
            case 'resource-center.html':
                await loadResourceCenterData();
                break;
            case 'support-faq.html':
                await loadSupportFAQData();
                break;
            case 'terms.html':
                await loadTermsData();
                break;
        }
    } catch (error) {
        console.error('Error initializing global data:', error);
    }
}

// Load notifications data
async function loadNotifications() {
    try {
        const notifications = await window.dataLoader.getMergedNotifications();
        const notificationsList = document.querySelector('.bel-notification-list');
        
        if (notificationsList && notifications.length > 0) {
            notificationsList.innerHTML = notifications.slice(0, 5).map(notification => `
                <li class="bel-notification-item">
                    <span class="notification-badge ${notification.tag.type}">${notification.tag.text}</span>
                    <div class="bel-notification-title"><br>${notification.title}</div>
                    <div class="bel-notification-date">${formatDate(notification.date)}</div>
                </li>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Load user profile data for header
async function loadUserProfileHeader() {
    try {
        const userProfile = await window.dataLoader.loadUserProfile();
        const config = await window.dataLoader.loadConfig();
        
        if (userProfile) {
            // Update user avatar
            const avatarImg = document.querySelector('.bel-user-profile img');
            if (avatarImg) {
                avatarImg.src = userProfile.avatar;
                avatarImg.alt = `${userProfile.name} Avatar`;
            }
            
            // Update user profile panel
            const panelContent = document.querySelector('.user-profile-panel .panel-content');
            if (panelContent) {
                const levelInfo = config.partnerLevels.find(level => level.name === userProfile.level.name);
                panelContent.innerHTML = `
                    <div class="user-info">
                        <div class="user-name">${userProfile.name}</div>
                        <div class="user-email">${userProfile.email}</div>
                    </div>
                    <div class="user-level">
                        <span class="bel-badge explorer">
                            <i class="${userProfile.level.icon}"></i> ${userProfile.level.name}
                        </span>
                    </div>
                    <hr class="divider">
                    <a href="my-account.html" class="panel-link">My Account</a>
                    <a href="#" class="panel-link">Log Out</a>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading user profile header:', error);
    }
}

// Load dashboard data
async function loadDashboardData() {
    if (window.location.pathname.split('/').pop() !== 'index.html' && 
        window.location.pathname.split('/').pop() !== '') return;
    
    try {
        const userProfile = await window.dataLoader.loadUserProfile();
        const stats = await window.dataLoader.loadDashboardStats();
        const performance = await window.dataLoader.loadAnnualPerformance();
        const productAnalysis = await window.dataLoader.loadProductAnalysis();
        const marketAnalysis = await window.dataLoader.loadMarketAnalysis();
        const config = await window.dataLoader.loadConfig();
        
        if (userProfile) {
            // Update welcome message
            const welcomeH1 = document.querySelector('.bel-h1');
            if (welcomeH1) {
                welcomeH1.textContent = `Welcome Back, ${userProfile.name} 👋`;
            }
            
            // Update level panel
            const levelInfo = config.partnerLevels.find(level => level.name === userProfile.level.name);
            const nextLevel = config.partnerLevels.find(level => level.requirement > userProfile.level.progress.current);
            
            const levelPanel = document.querySelector('.level-panel');
            if (levelPanel && nextLevel) {
                const levelBadge = levelPanel.querySelector('.bel-badge');
                const milestoneContainer = levelPanel.querySelector('.level-milestone-container');
                const levelText = levelPanel.querySelector('p');
                
                if (levelBadge) {
                    levelBadge.innerHTML = `<i class="${userProfile.level.icon}"></i> ${userProfile.level.name}`;
                }
                
                if (milestoneContainer) {
                    // 計算當前級別在整個等級系統中的位置
                    const allLevels = ['Builder', 'Enabler', 'Explorer', 'Leader'];
                    const currentLevelIndex = allLevels.indexOf(userProfile.level.name);
                    const progressPercentage = (currentLevelIndex / (allLevels.length - 1)) * 100;
                    
                    milestoneContainer.innerHTML = `
                        <div class="milestone-track">
                            <div class="milestone-progress" style="width: ${progressPercentage}%;"></div>
                            <div class="milestone-nodes">
                                ${allLevels.map((level, index) => {
                                    let nodeClass = 'milestone-node';
                                    if (index < currentLevelIndex) {
                                        nodeClass += ' completed';
                                    } else if (index === currentLevelIndex) {
                                        nodeClass += ' active';
                                    }
                                    return `<div class="${nodeClass}"></div>`;
                                }).join('')}
                            </div>
                        </div>
                        <div class="milestone-labels">
                            ${allLevels.map((level, index) => {
                                let labelClass = 'milestone-label';
                                if (index <= currentLevelIndex) {
                                    labelClass += ' active';
                                }
                                return `<div class="${labelClass}">${level}</div>`;
                            }).join('')}
                        </div>
                    `;
                }
                
                if (levelText) {
                    levelText.textContent = `Complete ${userProfile.level.progress.remaining} more referral orders to be promoted to the '${nextLevel.name}' level.`;
                }
            }
            
            // Update referral panel
            const referralPanel = document.querySelector('.referral-panel');
            if (referralPanel) {
                const qrCodeDiv = referralPanel.querySelector('.qr-code');
                const linksDiv = referralPanel.querySelector('.links');
                
                if (qrCodeDiv) {
                    qrCodeDiv.innerHTML = `<img src="${userProfile.referralInfo.qrCode}" alt="QR Code">`;
                }
                
                if (linksDiv) {
                    linksDiv.innerHTML = `
                        <div class="referral-input-group">
                            <label for="ref-link-db" style="margin-bottom: 2px;">Your Referral Link</label>
                            <div class="referral-inline">
                                <input id="ref-link-db" type="text" value="${userProfile.referralInfo.link}" readonly />
                                <button class="copy-button" data-copy-target="ref-link-db"><i class="far fa-copy"></i> </button>
                            </div>
                        </div>
                        <div class="referral-input-group">
                            <label for="ref-id-db" style="margin-bottom: 2px;">Your Referral ID</label>
                            <div class="referral-inline">
                                <input id="ref-id-db" type="text" value="${userProfile.referralInfo.id}" readonly />
                                <button class="copy-button" data-copy-target="ref-id-db"><i class="far fa-copy"></i></button>
                            </div>
                        </div>
                    `;
                }
            }
        }
        
        // Update stats cards
        if (stats) {
            const statsCards = document.querySelectorAll('.bel-card');
            stats.forEach((stat, index) => {
                if (statsCards[index]) {
                    const card = statsCards[index];
                    const titleElement = card.querySelector('.bel-card-title');
                    const valueElement = card.querySelector('.bel-card-value');
                    const iconElement = card.querySelector('.bel-card-icon i');
                    const trendElement = card.querySelector('.trend-indicator');
                    
                    if (titleElement) titleElement.textContent = stat.title;
                    if (valueElement) valueElement.textContent = stat.value;
                    if (iconElement) iconElement.className = stat.icon;
                    
                    if (trendElement) {
                        trendElement.className = `trend-indicator ${stat.trend.direction}`;
                        const icon = stat.trend.direction === 'positive' ? 'fas fa-caret-up' : 'fas fa-caret-down';
                        trendElement.innerHTML = `<i class="${icon}"></i> ${stat.trend.percentage} <span class="trend-indicator-text">${stat.trend.text}</span>`;
                    }
                }
            });
        }
        
        // Update year selector and performance chart
        if (performance) {
            const yearSelect = document.getElementById('year-select');
            if (yearSelect) {
                const years = Object.keys(performance.yearlyData).sort().reverse();
                yearSelect.innerHTML = years.map(year => 
                    `<option value="${year}" ${year === '2025' ? 'selected' : ''}>${year}</option>`
                ).join('');
            }
        }
        
        // Update product analysis
        if (productAnalysis) {
            const productGrid = document.querySelector('.product-analysis-grid');
            if (productGrid) {
                productGrid.innerHTML = `
                    <div>
                        <h4 style="font-size: 1rem; margin-bottom: 10px;">Top 5 Product Category Analysis</h4>
                        <div class="chart-container bar-chart-container">
                            <canvas id="product-category-chart"></canvas>
                        </div>
                    </div>
                    <div>
                        <h4 style="font-size: 1rem; margin-bottom: 10px;">Top 20 Products</h4>
                        <div class="scrollable-table-container">
                            <table class="bel-table" style="margin-top:0;">
                                <thead><tr><th style="width:24px;"></th><th style="width:160px;">Product</th><th>Price</th><th>Units</th><th>Total</th></tr></thead>
                                <tbody>
                                    ${productAnalysis && productAnalysis.topProducts ? productAnalysis.topProducts.map(product => `
                                        <tr>
                                            <td>${product.rank || ''}</td>
                                            <td>${product.name || product.productName || ''}</td>
                                            <td>${product.price || '$--'}</td>
                                            <td>${product.units || product.orders || '--'}</td>
                                            <td>${product.total || product.sales || '--'}</td>
                                        </tr>
                                    `).join('') : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        }
        
        // Update market analysis
        if (marketAnalysis) {
            // 找到市場分析區段的表格（最後一個 panel 中的表格）
            const marketPanels = document.querySelectorAll('.bel-panel');
            const marketPanel = marketPanels[marketPanels.length - 1]; // 最後一個 panel
            
            if (marketPanel) {
                // Create a grid layout with chart on left and table on right
                marketPanel.innerHTML = `
                    <h4 class="bel-section-heading-large">Top 5 Market Regions</h4>
                    <div class="market-analysis-grid">
                        <div>
                            <div class="chart-container" style="height: 300px;">
                                <canvas id="market-regions-chart"></canvas>
                            </div>
                        </div>
                        <div>
                            <div class="bel-table-container">
                                <table class="bel-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 40px;">#</th>
                                            <th>Market</th>
                                            <th>Orders</th>
                                            <th>Sales</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${marketAnalysis.slice(0, 5).map((market, index) => `
                                            <tr>
                                                <td>${market.rank || (index + 1)}</td>
                                                <td>${market.region || market.market || market.name}</td>
                                                <td>${market.orders}</td>
                                                <td>${market.sales}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
                
                // Store market data for chart rendering
                window.marketAnalysisData = marketAnalysis.slice(0, 5);
            }
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load account data
async function loadAccountData() {
    if (window.location.pathname.split('/').pop() !== 'my-account.html') return;
    
    try {
        const userProfile = await window.dataLoader.loadUserProfile();
        const config = await window.dataLoader.loadConfig();
        
        if (userProfile) {
            // Update profile avatar
            const profileAvatarImg = document.getElementById('profile-avatar-img');
            if (profileAvatarImg) {
                profileAvatarImg.src = userProfile.avatar;
            }
            
            // Update account profile form
            const nameInput = document.getElementById('acc-name');
            const emailInput = document.getElementById('acc-email');
            
            if (nameInput) nameInput.value = userProfile.name;
            if (emailInput) emailInput.value = userProfile.email;
            
            // Update payout information
            const payoutPanel = document.getElementById('payout-info-panel');
            if (payoutPanel) {
                // Find the existing grid containers and update them
                const gridContainers = payoutPanel.querySelectorAll('.bel-grid-container');
                if (gridContainers.length >= 3) {
                    // First row: Account Holder Name | Phone Number (50% each)
                    gridContainers[0].innerHTML = `
                        <div class="bel-form-group">
                            <label for="account-holder-name">Account Holder Name</label>
                            <div class="bel-text-display" id="account-holder-name">${userProfile.name}</div>
                        </div>
                        <div class="bel-form-group">
                            <label for="phone-number">Phone Number</label>
                            <div class="bel-text-display" id="phone-number">+1 (555) 123-4567</div>
                        </div>
                    `;
                    
                    
                    //  Second row: Bank Name | SWIFT Code | Account Number (33% each)
                    gridContainers[1].innerHTML = `
                        <div class="bel-form-group">
                            <label for="bank-name">Bank Name</label>
                            <div class="bel-text-display" id="bank-name">${userProfile.bankInfo.bankName}</div>
                        </div>
                        <div class="bel-form-group">
                            <label for="swift-code">SWIFT Code</label>
                            <div class="bel-text-display" id="swift-code">${userProfile.bankInfo.swiftCode}</div>
                        </div>
                        <div class="bel-form-group">
                            <label for="account-number">Account Number</label>
                            <div class="bel-text-display" id="account-number">****${userProfile.bankInfo.accountNumber.slice(-4)}</div>
                        </div>
                    `;

                    // Third row: Address (full width)
                    gridContainers[2].innerHTML = `
                        <div class="bel-form-group">
                            <label for="address">Address</label>
                            <div class="bel-text-display" id="address">1234 Technology Innovation Boulevard, Suite 567, Silicon Valley Business District, San Francisco, California 94102, United States of America</div>
                        </div>
                    `;
                }
            }
            
            // Update account settings
            const languageRow = document.getElementById('language-setting-row');
            if (languageRow) {
                const languageCurrentValue = languageRow.querySelector('#language-current-value');
                const languageSelectGroup = languageRow.querySelector('#language-select-group');
                
                if (languageCurrentValue) {
                    languageCurrentValue.textContent = userProfile.accountSettings.language;
                }
                
                if (languageSelectGroup) {
                    languageSelectGroup.innerHTML = `
                        <select id="language-select">
                            ${config.languages.map(lang => 
                                `<option value="${lang.name}" ${lang.name === userProfile.accountSettings.language ? 'selected' : ''}>${lang.name}</option>`
                            ).join('')}
                        </select>
                        <button class="bel-btn" id="save-language-btn">Save</button>
                    `;
                }
                
                // Add missing text content
                const textContent = languageRow.querySelector('.text-content');
                if (textContent && !textContent.innerHTML.trim()) {
                    textContent.innerHTML = `
                        <div class="setting-title">Language</div>
                        <div class="setting-description">Choose your preferred language</div>
                    `;
                }
            }
        }
    } catch (error) {
        console.error('Error loading account data:', error);
    }
}

// Load earnings data
async function loadEarningsData() {
    if (window.location.pathname.split('/').pop() !== 'earnings-orders.html') return;
    
    try {
        let earningsSummary = await window.dataLoader.loadEarningsSummary();
        const payoutHistory = await window.dataLoader.loadPayoutHistory();
        const orderTracking = await window.dataLoader.loadOrderTracking();

        // Fallback demo data if missing
        if (!earningsSummary || !earningsSummary.totalEarnings) {
            earningsSummary = {
                totalEarnings: "$8,500.00",
                pendingPayout: "$1,520.00",
                alreadyPaid: "$6,980.00",
                tooltipText: "Payouts over $100 USD are processed on the 5th of each month. Balances under $100 will roll over to the next month."
            };
        }

        // Calculate stats for the new cards
        let totalNetPayouts = 0;
        let totalOrderCount = 0;
        let totalOrderAmount = 0;

        // Calculate net payouts from payout history
        if (payoutHistory && payoutHistory.length > 0) {
            payoutHistory.forEach(payout => {
                const netAmount = parseFloat(payout.netPayout.replace(/[$,]/g, ''));
                totalNetPayouts += netAmount;
            });
        }

        // Calculate order stats from order tracking
        if (orderTracking && orderTracking.length > 0) {
            totalOrderCount = orderTracking.length;
            
            orderTracking.forEach(order => {
                // Extract numeric value from order amount (handle different currencies)
                const amountStr = order.orderAmount || '';
                const numericMatch = amountStr.match(/[\d,]+\.?\d*/);
                if (numericMatch) {
                    const amount = parseFloat(numericMatch[0].replace(/,/g, ''));
                    // Convert to USD equivalent (simplified - you might want more sophisticated currency conversion)
                    let usdAmount = amount;
                    if (amountStr.includes('EUR')) {
                        usdAmount = amount * 1.08; // Approximate EUR to USD
                    } else if (amountStr.includes('GBP')) {
                        usdAmount = amount * 1.25; // Approximate GBP to USD
                    } else if (amountStr.includes('JPY')) {
                        usdAmount = amount * 0.0067; // Approximate JPY to USD
                    } else if (amountStr.includes('TWD')) {
                        usdAmount = amount * 0.031; // Approximate TWD to USD
                    }
                    totalOrderAmount += usdAmount;
                }
            });
        }

        // Update the new stats cards
        const netPayoutsValue = document.getElementById('net-payouts-value');
        const orderCountsValue = document.getElementById('order-counts-value');
        const orderAmountValue = document.getElementById('order-amount-value');

        if (netPayoutsValue) {
            netPayoutsValue.textContent = `$${totalNetPayouts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (orderCountsValue) {
            orderCountsValue.textContent = totalOrderCount.toString();
        }
        if (orderAmountValue) {
            orderAmountValue.textContent = `$${totalOrderAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        // Update earnings summary
        const totalValue = document.querySelector('.total-value');
        const subEarnings = document.querySelector('.sub-earnings');
        const tooltipText = document.querySelector('.tooltip-text');

        if (totalValue) totalValue.textContent = earningsSummary.totalEarnings;
        if (tooltipText) tooltipText.textContent = earningsSummary.tooltipText;

        if (subEarnings) {
            subEarnings.innerHTML = `
                <div>
                    <div class="sub-title">To Be Payout</div>
                    <div class="sub-value">${earningsSummary.pendingPayout}</div>
                </div>
                <div>
                    <div class="sub-title">Already Paid</div>
                    <div class="sub-value">${earningsSummary.alreadyPaid}</div>
                </div>
            `;
        }
        
        // Update payout history table
        if (payoutHistory) {
            const payoutTable = document.getElementById('payout-history-table');
            if (payoutTable) {
                const tbody = payoutTable.querySelector('tbody');
                
                if (tbody) {
                    tbody.innerHTML = payoutHistory.map(payout => `
                        <tr>
                            <td>${payout.id}</td>
                            <td>${payout.date}</td>
                            <td>${payout.grossEarnings}</td>
                            <td>${payout.wht}</td>
                            <td>${payout.netPayout}</td>
                        </tr>
                    `).join('');
                }
            }
        }
        
        // Update order tracking table
        if (orderTracking) {
            console.log('Order tracking data loaded:', orderTracking);
            const orderTable = document.getElementById('order-tracking-table');
            if (orderTable) {
                const tbody = orderTable.querySelector('tbody');
                
                if (tbody) {
                    tbody.innerHTML = orderTracking.map(order => {
                        // Split currency and amount with safety checks
                        const orderAmountParts = (order.orderAmount || '').split(' ');
                        const currency = orderAmountParts[0] || '';
                        const amount = orderAmountParts[1] || '';
                        
                        return `
                        <tr>
                            <td>${order.orderPlaced || ''}</td>
                            <td>${order.orderNumber || ''}</td>
                            <td>${currency}</td>
                            <td>${amount}</td>
                            <td>${order.productActualAmount || ''}</td>
                            <td><span class="status-badge ${order.statusClass || ''}">${order.orderStatus || ''}</span></td>
                        </tr>
                    `;
                    }).join('');
                }
            }
        } else {
            console.error('No order tracking data received');
        }
        
    } catch (error) {
        console.error('Error loading earnings data:', error);
    }
}

// Load resource center data
async function loadResourceCenterData() {
    if (window.location.pathname.split('/').pop() !== 'resource-center.html') return;
    
    try {
        const resourceData = await window.dataLoader.loadResourceCenter();
        
        if (resourceData) {
            const resourceGrid = document.querySelector('.resource-grid');
            if (resourceGrid) {
                const allResources = [
                    ...resourceData.deals.map(item => ({...item, category: 'deals'})),
                    ...resourceData.products.map(item => ({...item, category: 'products'})),
                    ...resourceData.marketing.map(item => ({...item, category: 'marketing'}))
                ];
                
                resourceGrid.innerHTML = allResources.map(resource => `
                    <div class="resource-card" data-category="${resource.category}" onclick="window.open('${resource.link || '#'}', '_blank')" style="cursor: pointer;">
                        <div class="thumbnail">
                            ${resource.image ? 
                                `<img src="${resource.image}" alt="${resource.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSIxMDAiIHk9Ijc1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+UmVzb3VyY2U8L3RleHQ+PC9zdmc+';">` : 
                                `<div class="placeholder-image"><i class="fas fa-file"></i></div>`
                            }
                        </div>
                        <div class="resource-card-copy">
                            <p>${resource.title}</p>
                            ${resource.description ? `<div class="resource-description" style="color: #666; font-size: 14px; line-height: 140%;">${resource.description}</div>` : ''}
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading resource center data:', error);
    }
}

// Load support FAQ data
async function loadSupportFAQData() {
    if (window.location.pathname.split('/').pop() !== 'support-faq.html') return;
    
    // Load support tickets - use fake data for now
    try {
        console.log('Loading support tickets...');
        
        // Use fake data directly (you can replace this with real data loading later)
    const ticketsData = [
        {
            "ticketId": "TICK-2025-001",
            "subject": "Payment Processing Issue",
            "message": "I tried to process a payment but it failed with an unknown error. Please help!",
            "status": "Open",
            "response": "Pending Review",
            "lastUpdated": "2025-08-29"
        },
        {
            "ticketId": "TICK-2025-002",
            "subject": "Referral Link Not Working",
            "message": "My referral link does not redirect to the registration page. Can you check?",
            "status": "Open",
            "response": "Under Investigation",
            "lastUpdated": "2025-08-30"
        },
        {
            "ticketId": "TICK-2025-003",
            "subject": "Commission Calculation Query",
            "message": "Could you explain how the commission is calculated for my last order?",
            "status": "Closed",
            "response": "Your commission for order #IMUS00068925 was calculated based on your Explorer level and includes a performance bonus. Commissions are processed monthly on the 5th. View detailed breakdowns in your Earnings & Orders dashboard.",
            "lastUpdated": "2025-08-22"
        },
        {
            "ticketId": "TICK-2025-004",
            "subject": "Account Level Promotion Request",
            "message": "I believe I have met the requirements for a level promotion. Please review my account.",
            "status": "Closed",
            "response": "Congratulations! You've been promoted to Leader level effective immediately. Your 47 successful referrals exceeded our requirements. You now have access to exclusive materials and priority support.",
            "lastUpdated": "2025-08-18"
        }
    ];
        
        window.ticketsData = ticketsData;
        const ticketsTable = document.getElementById('support-tickets-table');
        if (ticketsTable) {
            const tbody = ticketsTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = ticketsData.map(ticket => {
                    let responseStatus = 'Pending';
                    if (ticket.response && !['Pending Review', 'Under Investigation', '-'].includes(ticket.response.trim()) && ticket.response.trim().length > 0) {
                        responseStatus = 'Replied';
                    }
                    return `
                    <tr>
                        <td>${ticket.ticketId}</td>
                        <td>${ticket.lastUpdated}</td>
                        <td>${ticket.subject}</td>
                        <td><span class="bel-badge ${ticket.status.toLowerCase() === 'open' ? 'pending' : 'completed'}">${ticket.status}</span></td>
                        <td>${responseStatus}</td>
                        <td>
                            <button class="bel-btn-s secondary" onclick="viewTicket('${ticket.ticketId}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </td>
                    </tr>
                    `;
                }).join('');
                console.log('Support tickets table populated successfully');
            }
        }
    } catch (error) {
        console.error('Error loading support tickets:', error);
        // Even if there's an error, show some basic fake data
        const ticketsTable = document.getElementById('support-tickets-table');
        if (ticketsTable) {
            const tbody = ticketsTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td>TICK-2025-001</td>
                        <td>2025-08-29</td>
                        <td>Sample Support Request</td>
                        <td><span class="bel-badge pending">Open</span></td>
                        <td>Pending Review</td>
                        <td>
                            <button class="bel-btn-s secondary" onclick="viewTicket('TICK-2025-001')">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </td>
                    </tr>
                `;
            }
        }
    }
    
    // Load FAQ data (separate try-catch to ensure it loads independently)
    try {
        const faqData = await window.dataLoader.loadFAQ();
        if (faqData && faqData.length > 0) {
            const faqContainer = document.getElementById('faq-content');
            if (faqContainer) {
                faqContainer.innerHTML = faqData.map(faq => `
                    <div class="faq-item">
                        <button class="faq-question">${faq.question}</button>
                        <div class="faq-answer" style="color: #666; font-size: 14px; line-height: 140%;">
                            <p>${faq.answer}</p>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading FAQ data:', error);
        const faqContainer = document.getElementById('faq-content');
        if (faqContainer) {
            faqContainer.innerHTML = '<div class="loading-message">Error loading FAQ content.</div>';
        }
    }
}

// Load terms data
async function loadTermsData() {
    console.log('loadTermsData called');
    console.log('Current pathname:', window.location.pathname);
    
    if (window.location.pathname.split('/').pop() !== 'terms.html') {
        console.log('Not terms.html page, skipping');
        return;
    }
    
    const termsPanel = document.getElementById('terms-content');
    if (!termsPanel) {
        console.error('Terms content panel not found');
        return;
    }
    
    try {
        console.log('Loading terms data...');
        const termsData = await window.dataLoader.loadTerms();
        console.log('Terms data loaded:', termsData);
        
        if (termsData) {
            // Create terms content HTML with proper styling
            let termsHTML = `
                <div class="terms-header">
                    <div class="terms-meta">
                        <span class="version">Version ${termsData.version}</span>
                        <span class="last-updated">Last Updated: ${termsData.lastUpdated}</span>
                    </div>
                </div>
                <div class="terms-sections">
            `;
            
            // Add each section
            termsData.sections.forEach(section => {
                termsHTML += `
                    <div class="terms-section">
                        <h2 class="section-title">${section.id}. ${section.title}</h2>
                        <div class="section-content">
                            <p>${section.content}</p>
                `;
                
                // Add partner levels table if this is the earnings section
                if (section.levels && section.levels.length > 0) {
                    termsHTML += `
                        <div class="partner-levels-table">
                            <h3>Partner Levels and Benefits</h3>
                            <table class="bel-table">
                                <thead>
                                    <tr>
                                        <th>Level</th>
                                        <th>Requirements</th>
                                        <th>Benefits</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;
                    
                    section.levels.forEach(level => {
                        termsHTML += `
                            <tr>
                                <td><strong>${level.name}</strong></td>
                                <td>${level.requirement}</td>
                                <td>
                                    <ul>
                                        ${level.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                                    </ul>
                                </td>
                            </tr>
                        `;
                    });
                    
                    termsHTML += `
                                </tbody>
                            </table>
                        </div>
                    `;
                }
                
                termsHTML += `
                        </div>
                    </div>
                `;
            });
            
            termsHTML += '</div>';
            
            // Update the panel content
            termsPanel.innerHTML = termsHTML;
            console.log('Terms content displayed successfully');
        } else {
            console.error('No terms data received');
            termsPanel.innerHTML = '<div class="error-message">No terms data available. Please try refreshing the page.</div>';
        }
    } catch (error) {
        console.error('Error loading Terms data:', error);
        termsPanel.innerHTML = '<div class="error-message">Error loading terms and conditions. Please try refreshing the page.</div>';
    }
}

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    });
}