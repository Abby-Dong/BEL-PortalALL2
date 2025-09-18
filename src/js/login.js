'use strict';

class LoginManager {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.setupPasswordValidation();
    }

    initializeElements() {
        this.form = document.getElementById('login-form');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.loginButton = document.getElementById('login-button');
        this.signupButton = document.getElementById('signup-button');
        this.errorMessage = document.getElementById('error-message');
        
        // Password toggle
        this.passwordToggle = document.getElementById('password-toggle');
        
        // Error elements
        this.emailError = document.getElementById('email-error');
        this.passwordError = document.getElementById('password-error');
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Password visibility toggle
        this.passwordToggle.addEventListener('click', () => this.togglePasswordVisibility('password'));
        
        // Input validation
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.emailInput.addEventListener('input', () => this.clearFieldError('email'));
        
        this.passwordInput.addEventListener('input', () => {
            this.clearFieldError('password');
        });
        
        // Clear general error message on any input
        [this.emailInput, this.passwordInput].forEach(input => {
            input.addEventListener('input', () => this.clearError());
        });
        
        // Sign up button
        this.signupButton.addEventListener('click', () => this.handleSignUp());
    }

    setupPasswordValidation() {
        // No password strength validation needed for login
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showFieldError('email', 'Email is required');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            return false;
        }
        
        // Check if it looks like an IoTMart compatible email format
        if (!this.isIoTMartCompatible(email)) {
            this.showFieldError('email', 'Please use the same email format as your IoTMart account');
            return false;
        }
        
        this.clearFieldError('email');
        return true;
    }

    isIoTMartCompatible(email) {
        // Basic validation for IoTMart compatibility
        // This could be enhanced with specific domain checks or API validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    validatePasswordStrength() {
        // Simple password validation for login
        const password = this.passwordInput.value;
        return password.length > 0;
    }

    validatePasswordMatch() {
        // No password confirmation needed for login
        return true;
    }

    async handleLogin(event) {
        event.preventDefault();
        
        // Validate all fields
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePasswordStrength();
        
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        
        // Basic field validation
        if (!email || !password) {
            this.showError('Please fill in all required fields.');
            return;
        }
        
        if (!isEmailValid) {
            this.showError('Please enter a valid email address that matches your IoTMart account.');
            return;
        }
        
        if (!isPasswordValid) {
            this.showError('Please enter your password.');
            return;
        }

        this.setLoading(true);
        
        try {
            const loginResult = await this.authenticateUser(email, password);
            
            if (loginResult.success) {
                // Show success animation
                this.showSuccess();
                
                // Save user session
                sessionStorage.setItem('bel_user_session', JSON.stringify({
                    email: loginResult.user.email,
                    name: loginResult.user.name,
                    role: loginResult.user.role,
                    loginTime: new Date().toISOString(),
                    iotMartLinked: true,
                    isFirstLogin: loginResult.user.isFirstLogin
                }));
                
                // Redirect based on user role and first login status
                setTimeout(() => {
                    console.log('User role:', loginResult.user.role);
                    console.log('Is first login:', loginResult.user.isFirstLogin);
                    
                    if (loginResult.user.role === 'administrator' || loginResult.user.role === 'manager') {
                        // Admin/Manager users go to admin dashboard
                        console.log('Redirecting to admin dashboard: index.html');
                        window.location.href = 'index.html';
                    } else if (loginResult.user.role === 'newuser' && loginResult.user.isFirstLogin) {
                        // New users go to first-login flow
                        console.log('Redirecting to first login flow: BEL-UserPortal-A/first-login.html');
                        window.location.href = 'BEL-UserPortal-A/first-login.html';
                    } else if (loginResult.user.role === 'user' || loginResult.user.role === 'partner') {
                        // Regular users go to user portal
                        console.log('Redirecting to user portal: BEL-UserPortal-A/index.html');
                        window.location.href = 'BEL-UserPortal-A/index.html';
                    }
                }, 1500);
            } else {
                this.showError(loginResult.message || 'Login failed. Please check your credentials and try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please check your internet connection and try again.');
        } finally {
            if (!document.querySelector('.checkmark')) {
                this.setLoading(false);
            }
        }
    }

    async authenticateUser(email, password) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Demo credentials with IoTMart integration simulation
        const validCredentials = [
            {
                email: 'admin@advantech.com',
                password: 'Admin123!',
                name: 'Admin User',
                role: 'administrator',
                iotMartLinked: true
            },
            {
                email: 'manager@advantech.com',
                password: 'Manager123!',
                name: 'Manager User',
                role: 'manager',
                iotMartLinked: true
            },
            {
                email: 'demo@iotmart.com',
                password: 'Demo123!',
                name: 'Demo User',
                role: 'user',
                iotMartLinked: true
            },
            {
                email: 'bel@iotmart.com',
                password: 'BEL123!',
                name: 'BEL Partner',
                role: 'partner',
                iotMartLinked: true
            },
            {
                email: 'newuser@iotmart.com',
                password: 'NewUser123!',
                name: 'New User',
                role: 'newuser',
                iotMartLinked: true,
                isFirstLogin: true
            }
        ];
        
        const user = validCredentials.find(cred => 
            cred.email.toLowerCase() === email.toLowerCase() && 
            cred.password === password
        );
        
        if (user) {
            return {
                success: true,
                user: {
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    iotMartLinked: user.iotMartLinked,
                    isFirstLogin: user.isFirstLogin
                }
            };
        }
        
        return {
            success: false,
            message: 'Invalid email or password. Please check your IoTMart account credentials.\n\nDemo accounts:\n• admin@advantech.com / Admin123!\n• demo@iotmart.com / Demo123!\n• newuser@iotmart.com / NewUser123! (First-time user)'
        };
    }

    togglePasswordVisibility(targetId) {
        const input = document.getElementById(targetId);
        const toggle = this.passwordToggle;
        
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggle.className = isPassword ? 
            'fas fa-eye-slash password-toggle' : 
            'fas fa-eye password-toggle';
    }

    setLoading(loading) {
        this.loginButton.disabled = loading;
        this.loginButton.classList.toggle('loading', loading);
        
        // Disable all form inputs during loading
        [this.emailInput, this.passwordInput, this.signupButton].forEach(element => {
            element.disabled = loading;
        });
    }

    showSuccess() {
        // Replace loading spinner with success checkmark
        this.loginButton.classList.remove('loading');
        this.loginButton.innerHTML = `
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle class="checkmark-circle" fill="none" cx="26" cy="26" r="25"/>
                <path class="checkmark-check" fill="none" d="m14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            Success!
        `;
        this.loginButton.style.background = '#28a745';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.add('show');
        
        // Auto-hide error after 8 seconds
        setTimeout(() => {
            this.clearError();
        }, 8000);
    }

    clearError() {
        this.errorMessage.classList.remove('show');
    }

    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
        
        if (inputElement) {
            inputElement.classList.add('error');
        }
    }

    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement) {
            errorElement.classList.remove('show');
        }
        
        if (inputElement) {
            inputElement.classList.remove('error');
        }
    }

    handleSignUp() {
        // In a real application, this would redirect to IoTMart registration
        // For demo purposes, show an informative message
        
        const message = `To create a new account, please visit IoTMart registration portal:

🌐 IoTMart Registration
   → Create your account at IoTMart
   → Verify your email address
   → Complete your profile setup

Once registered with IoTMart, you can use the same credentials to access BEL Management Portal.
        `.trim();
        
        // Create custom modal for sign up information
        this.showSignUpModal(message);
    }

    showSignUpModal(message) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 4px;
            padding: 30px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        `;
        
        modal.innerHTML = `
            <div style="margin-bottom: 20px;">
                <i class="fas fa-user-plus" style="font-size: 36px; color: var(--ds-color-primary, #F39800); margin-bottom: 15px;"></i>
                <h3 style="margin: 0 0 10px 0; color: var(--ds-color-gray-80, #434447);">Sign Up for BEL Management Portal</h3>
            </div>
            <div style="white-space: pre-line; text-align: left; font-size: 14px; line-height: 1.5; color: var(--ds-color-gray-70, #737b7d); margin-bottom: 25px; background: #f8f9fa; padding: 20px; border-radius: 4px;">
                ${message}
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button id="visitIoTMart" style="
                    padding: 12px 24px;
                    background: var(--ds-color-primary, #F39800);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    Visit IoTMart
                </button>
                <button id="alreadyHaveAccount" style="
                    padding: 12px 24px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    Already Have IoTMart Account
                </button>
                <button id="closeModal" style="
                    padding: 12px 24px;
                    background: transparent;
                    color: var(--ds-color-gray-60, #b6bfc1);
                    border: 2px solid var(--ds-color-gray-40, #e8ecef);
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    Close
                </button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Add event listeners
        const visitButton = modal.querySelector('#visitIoTMart');
        const alreadyHaveAccountButton = modal.querySelector('#alreadyHaveAccount');
        const closeButton = modal.querySelector('#closeModal');
        
        visitButton.addEventListener('click', () => {
            // In real implementation, redirect to IoTMart
            window.open('https://www.iotmart.com', '_blank');
            document.body.removeChild(overlay);
        });

        alreadyHaveAccountButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
            this.showAccountSetupModal();
        });
        
        closeButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
        
        // Add hover effects
        visitButton.addEventListener('mouseenter', () => {
            visitButton.style.background = 'var(--ds-color-primary-dark, #e57b03)';
            visitButton.style.transform = 'translateY(-1px)';
        });
        
        visitButton.addEventListener('mouseleave', () => {
            visitButton.style.background = 'var(--ds-color-primary, #F39800)';
            visitButton.style.transform = 'translateY(0)';
        });

        alreadyHaveAccountButton.addEventListener('mouseenter', () => {
            alreadyHaveAccountButton.style.background = '#0056b3';
            alreadyHaveAccountButton.style.transform = 'translateY(-1px)';
        });

        alreadyHaveAccountButton.addEventListener('mouseleave', () => {
            alreadyHaveAccountButton.style.background = '#007bff';
            alreadyHaveAccountButton.style.transform = 'translateY(0)';
        });
        
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.borderColor = 'var(--ds-color-gray-60, #b6bfc1)';
            closeButton.style.color = 'var(--ds-color-gray-80, #434447)';
        });
        
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.borderColor = 'var(--ds-color-gray-40, #e8ecef)';
            closeButton.style.color = 'var(--ds-color-gray-60, #b6bfc1)';
        });
    }

    showAccountSetupModal() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 4px;
            padding: 30px;
            max-width: 550px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        `;
        
        modal.innerHTML = `
            <div style="margin-bottom: 25px;">
                <i class="fas fa-link" style="font-size: 48px; color: #007bff; margin-bottom: 15px;"></i>
                <h3 style="margin: 0 0 10px 0; color: var(--ds-color-gray-80, #434447);">Link Your IoTMart Account</h3>
                <p style="margin: 0; color: var(--ds-color-gray-60, #737b7d); font-size: 14px;">Connect your existing IoTMart account to access BEL Management Portal</p>
            </div>
            
            <form id="account-setup-form" style="text-align: left;">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--ds-color-gray-80, #434447); font-weight: 600; font-size: 14px;">
                        IoTMart Email Account <span style="color: #e74c3c;">*</span>
                    </label>
                    <input type="email" id="iotmart-email" required style="
                        width: 100%;
                        padding: 12px 15px;
                        border: 2px solid var(--ds-color-gray-40, #e8ecef);
                        border-radius: 4px;
                        font-size: 14px;
                        box-sizing: border-box;
                        transition: border-color 0.3s ease;
                    " placeholder="Enter your IoTMart email address">
                    <div id="iotmart-email-error" class="error-message" style="color: #e74c3c; font-size: 12px; margin-top: 5px; display: none;"></div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--ds-color-gray-80, #434447); font-weight: 600; font-size: 14px;">
                        New BEL Password <span style="color: #e74c3c;">*</span>
                    </label>
                    <div style="position: relative;">
                        <input type="password" id="bel-password" required style="
                            width: 100%;
                            padding: 12px 15px;
                            border: 2px solid var(--ds-color-gray-40, #e8ecef);
                            border-radius: 4px;
                            font-size: 14px;
                            box-sizing: border-box;
                            padding-right: 45px;
                            transition: border-color 0.3s ease;
                        " placeholder="Create a new password for BEL Portal">
                        <i class="fas fa-eye password-toggle" id="bel-password-toggle" style="
                            position: absolute;
                            right: 15px;
                            top: 50%;
                            transform: translateY(-50%);
                            cursor: pointer;
                            color: var(--ds-color-gray-60, #737b7d);
                        "></i>
                    </div>
                    <div id="bel-password-strength" style="margin-top: 8px; display: none;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <span style="font-size: 12px; color: var(--ds-color-gray-60, #737b7d);">Password Strength:</span>
                            <span id="bel-strength-level" style="font-size: 12px; font-weight: 600;"></span>
                        </div>
                        <div style="width: 100%; height: 4px; background: #e8ecef; border-radius: 2px; overflow: hidden;">
                            <div id="bel-strength-bar" style="height: 100%; width: 0%; transition: all 0.3s ease; border-radius: 2px;"></div>
                        </div>
                        <div style="margin-top: 8px; font-size: 11px; color: var(--ds-color-gray-60, #737b7d); line-height: 1.3;">
                            Requirements: At least 8 characters with uppercase, lowercase, numbers, and symbols
                        </div>
                    </div>
                    <div id="bel-password-error" class="error-message" style="color: #e74c3c; font-size: 12px; margin-top: 5px; display: none;"></div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--ds-color-gray-80, #434447); font-weight: 600; font-size: 14px;">
                        Confirm BEL Password <span style="color: #e74c3c;">*</span>
                    </label>
                    <div style="position: relative;">
                        <input type="password" id="confirm-bel-password" required style="
                            width: 100%;
                            padding: 12px 15px;
                            border: 2px solid var(--ds-color-gray-40, #e8ecef);
                            border-radius: 4px;
                            font-size: 14px;
                            box-sizing: border-box;
                            padding-right: 45px;
                            transition: border-color 0.3s ease;
                        " placeholder="Confirm your new BEL password">
                        <i class="fas fa-eye password-toggle" id="confirm-bel-password-toggle" style="
                            position: absolute;
                            right: 15px;
                            top: 50%;
                            transform: translateY(-50%);
                            cursor: pointer;
                            color: var(--ds-color-gray-60, #737b7d);
                        "></i>
                    </div>
                    <div id="confirm-bel-password-error" class="error-message" style="color: #e74c3c; font-size: 12px; margin-top: 5px; display: none;"></div>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--ds-color-gray-80, #434447); font-weight: 600; font-size: 14px;">
                        6-Letter Exclusive Code <span style="color: #e74c3c;">*</span>
                    </label>
                    <input type="text" id="exclusive-code" required maxlength="6" pattern="[A-Za-z]{6}" style="
                        width: 100%;
                        padding: 12px 15px;
                        border: 2px solid var(--ds-color-gray-40, #e8ecef);
                        border-radius: 4px;
                        font-size: 18px;
                        font-family: monospace;
                        letter-spacing: 2px;
                        text-align: center;
                        box-sizing: border-box;
                        transition: border-color 0.3s ease;
                        text-transform: uppercase;
                    " placeholder="ABCDEF">
                    <div id="exclusive-code-error" class="error-message" style="color: #e74c3c; font-size: 12px; margin-top: 5px; display: none;"></div>
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; margin-top: 8px; font-size: 12px; color: var(--ds-color-gray-60, #737b7d); line-height: 1.4;">
                        <i class="fas fa-info-circle" style="color: #007bff; margin-right: 5px;"></i>
                        Note: This code will be used by IoTMart support team to create your referral ID. Final decision is made by IoTMart.
                    </div>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--ds-color-gray-80, #434447); font-weight: 600; font-size: 14px;">
                        Primary Sales Region <span style="color: #e74c3c;">*</span>
                    </label>
                    <select id="primary-region" required style="
                        width: 100%;
                        padding: 12px 15px;
                        border: 2px solid var(--ds-color-gray-40, #e8ecef);
                        border-radius: 4px;
                        font-size: 14px;
                        box-sizing: border-box;
                        transition: border-color 0.3s ease;
                        background-color: white;
                    ">
                        <option value="">Select your primary sales region</option>
                        <option value="AAU / NZ">AAU / NZ (Australia & New Zealand)</option>
                        <option value="ASEAN">ASEAN (Southeast Asia)</option>
                        <option value="China">China</option>
                        <option value="Europe">Europe</option>
                        <option value="India">India</option>
                        <option value="Japan">Japan</option>
                        <option value="Korea">Korea</option>
                        <option value="LATAM">LATAM (Latin America)</option>
                        <option value="ME&A">ME&A (Middle East & Africa)</option>
                        <option value="North America">North America</option>
                        <option value="Taiwan">Taiwan</option>
                        <option value="Russia & CIS">Russia & CIS</option>
                        <option value="Others">Others</option>
                    </select>
                    <div id="primary-region-error" class="error-message" style="color: #e74c3c; font-size: 12px; margin-top: 5px; display: none;"></div>
                </div>
                
                <div id="setup-error-message" class="error-message" style="color: #e74c3c; font-size: 14px; margin-bottom: 20px; display: none; text-align: center; background: #fef2f2; padding: 12px; border-radius: 4px; border: 1px solid #fecaca;"></div>
                
                <div style="display: flex; gap: 15px;">
                    <button type="submit" id="submit-setup" style="
                        flex: 1;
                        padding: 12px 24px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-size: 14px;
                    ">
                        Link Account
                    </button>
                    <button type="button" id="cancel-setup" style="
                        flex: 1;
                        padding: 12px 24px;
                        background: transparent;
                        color: var(--ds-color-gray-60, #b6bfc1);
                        border: 2px solid var(--ds-color-gray-40, #e8ecef);
                        border-radius: 4px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-size: 14px;
                    ">
                        Cancel
                    </button>
                </div>
            </form>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Add event listeners
        this.setupAccountModal(overlay, modal);
    }

    setupAccountModal(overlay, modal) {
        const form = modal.querySelector('#account-setup-form');
        const emailInput = modal.querySelector('#iotmart-email');
        const passwordInput = modal.querySelector('#bel-password');
        const confirmPasswordInput = modal.querySelector('#confirm-bel-password');
        const codeInput = modal.querySelector('#exclusive-code');
        const regionInput = modal.querySelector('#primary-region');
        const passwordToggle = modal.querySelector('#bel-password-toggle');
        const confirmPasswordToggle = modal.querySelector('#confirm-bel-password-toggle');
        const submitButton = modal.querySelector('#submit-setup');
        const cancelButton = modal.querySelector('#cancel-setup');
        const errorMessage = modal.querySelector('#setup-error-message');

        // Password visibility toggles
        passwordToggle.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            passwordToggle.className = isPassword ? 
                'fas fa-eye-slash password-toggle' : 
                'fas fa-eye password-toggle';
        });

        confirmPasswordToggle.addEventListener('click', () => {
            const isPassword = confirmPasswordInput.type === 'password';
            confirmPasswordInput.type = isPassword ? 'text' : 'password';
            confirmPasswordToggle.className = isPassword ? 
                'fas fa-eye-slash password-toggle' : 
                'fas fa-eye password-toggle';
        });

        // Code input formatting
        codeInput.addEventListener('input', (e) => {
            // Allow only English letters and convert to uppercase
            e.target.value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
        });

        // Password strength validation
        const passwordStrengthElement = modal.querySelector('#bel-password-strength');
        const strengthBar = modal.querySelector('#bel-strength-bar');
        const strengthLevel = modal.querySelector('#bel-strength-level');

        const calculatePasswordStrength = (password) => {
            let score = 0;
            let level = 'Very Weak';
            let color = '#e74c3c';
            let width = '0%';
            
            if (password.length >= 8) score++;
            if (password.length >= 12) score++;
            if (/[a-z]/.test(password)) score++;
            if (/[A-Z]/.test(password)) score++;
            if (/[0-9]/.test(password)) score++;
            if (/[^A-Za-z0-9]/.test(password)) score++;
            
            if (score >= 6) {
                level = 'Very Strong';
                color = 'var(--ds-color-success-dark, #025324)';
                width = '100%';
            } else if (score >= 5) {
                level = 'Strong';
                color = 'var(--ds-color-success, #00893a)';
                width = '80%';
            } else if (score >= 3) {
                level = 'Medium';
                color = '#f59e0b';
                width = '60%';
            } else if (score >= 2) {
                level = 'Weak';
                color = '#f97316';
                width = '40%';
            } else if (score >= 1) {
                level = 'Very Weak';
                color = '#e74c3c';
                width = '20%';
            }
            
            return { score, level, color, width };
        };

        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            
            if (password.length > 0) {
                passwordStrengthElement.style.display = 'block';
                const strength = calculatePasswordStrength(password);
                
                strengthLevel.textContent = strength.level;
                strengthLevel.style.color = strength.color;
                strengthBar.style.width = strength.width;
                strengthBar.style.background = strength.color;
            } else {
                passwordStrengthElement.style.display = 'none';
            }
        });

        // Form validation
        const validateSetupForm = () => {
            let isValid = true;
            
            // Email validation
            const email = emailInput.value.trim();
            const emailError = modal.querySelector('#iotmart-email-error');
            if (!email || !this.isIoTMartCompatible(email)) {
                emailError.textContent = 'Please enter a valid IoTMart email address';
                emailError.style.display = 'block';
                emailInput.style.borderColor = '#e74c3c';
                isValid = false;
            } else {
                emailError.style.display = 'none';
                emailInput.style.borderColor = 'var(--ds-color-gray-40, #e8ecef)';
            }

            // Password validation
            const password = passwordInput.value;
            const passwordError = modal.querySelector('#bel-password-error');
            const strength = password.length > 0 ? calculatePasswordStrength(password) : { score: 0 };
            
            if (!password) {
                passwordError.textContent = 'Password is required';
                passwordError.style.display = 'block';
                passwordInput.style.borderColor = '#e74c3c';
                isValid = false;
            } else if (password.length < 8) {
                passwordError.textContent = 'Password must be at least 8 characters';
                passwordError.style.display = 'block';
                passwordInput.style.borderColor = '#e74c3c';
                isValid = false;
            } else if (!/(?=.*[a-z])/.test(password)) {
                passwordError.textContent = 'Password must contain at least one lowercase letter';
                passwordError.style.display = 'block';
                passwordInput.style.borderColor = '#e74c3c';
                isValid = false;
            } else if (!/(?=.*[A-Z])/.test(password)) {
                passwordError.textContent = 'Password must contain at least one uppercase letter';
                passwordError.style.display = 'block';
                passwordInput.style.borderColor = '#e74c3c';
                isValid = false;
            } else if (!/(?=.*\d)/.test(password)) {
                passwordError.textContent = 'Password must contain at least one number';
                passwordError.style.display = 'block';
                passwordInput.style.borderColor = '#e74c3c';
                isValid = false;
            } else if (!/(?=.*[^A-Za-z0-9])/.test(password)) {
                passwordError.textContent = 'Password must contain at least one special character';
                passwordError.style.display = 'block';
                passwordInput.style.borderColor = '#e74c3c';
                isValid = false;
            } else if (strength.score < 3) {
                passwordError.textContent = 'Please use a stronger password (at least Medium strength)';
                passwordError.style.display = 'block';
                passwordInput.style.borderColor = '#f59e0b';
                isValid = false;
            } else {
                passwordError.style.display = 'none';
                passwordInput.style.borderColor = strength.score >= 5 ? 'var(--ds-color-success, #00893a)' : '#f59e0b';
            }

            // Confirm password validation
            const confirmPassword = confirmPasswordInput.value;
            const confirmPasswordError = modal.querySelector('#confirm-bel-password-error');
            if (!confirmPassword) {
                confirmPasswordError.textContent = 'Please confirm your password';
                confirmPasswordError.style.display = 'block';
                confirmPasswordInput.style.borderColor = '#e74c3c';
                isValid = false;
            } else if (password !== confirmPassword) {
                confirmPasswordError.textContent = 'Passwords do not match';
                confirmPasswordError.style.display = 'block';
                confirmPasswordInput.style.borderColor = '#e74c3c';
                isValid = false;
            } else {
                confirmPasswordError.style.display = 'none';
                confirmPasswordInput.style.borderColor = 'var(--ds-color-gray-40, #e8ecef)';
            }

            // Code validation
            const code = codeInput.value;
            const codeError = modal.querySelector('#exclusive-code-error');
            if (!code || code.length !== 6 || !/^[A-Za-z]{6}$/.test(code)) {
                codeError.textContent = 'Please enter a valid 6-letter code';
                codeError.style.display = 'block';
                codeInput.style.borderColor = '#e74c3c';
                isValid = false;
            } else {
                codeError.style.display = 'none';
                codeInput.style.borderColor = 'var(--ds-color-gray-40, #e8ecef)';
            }

            // Region validation
            const region = regionInput.value;
            const regionError = modal.querySelector('#primary-region-error');
            if (!region) {
                regionError.textContent = 'Please select your primary sales region';
                regionError.style.display = 'block';
                regionInput.style.borderColor = '#e74c3c';
                isValid = false;
            } else {
                regionError.style.display = 'none';
                regionInput.style.borderColor = 'var(--ds-color-gray-40, #e8ecef)';
            }

            return isValid;
        };

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateSetupForm()) {
                return;
            }

            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Linking...';
            
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Show success and close modal
                submitButton.innerHTML = '<i class="fas fa-check"></i> Linked!';
                submitButton.style.background = '#28a745';
                
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    this.showError('Account successfully linked! Please log in with your IoTMart credentials.');
                }, 1000);
                
            } catch (error) {
                errorMessage.textContent = 'Failed to link account. Please check your credentials and try again.';
                errorMessage.style.display = 'block';
                submitButton.disabled = false;
                submitButton.innerHTML = 'Link Account';
            }
        });

        // Input event listeners for real-time validation
        [emailInput, passwordInput, confirmPasswordInput, codeInput, regionInput].forEach(input => {
            input.addEventListener('input', () => {
                errorMessage.style.display = 'none';
            });
        });

        // Real-time password confirmation validation
        confirmPasswordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const confirmPasswordError = modal.querySelector('#confirm-bel-password-error');
            
            if (confirmPassword && password !== confirmPassword) {
                confirmPasswordError.textContent = 'Passwords do not match';
                confirmPasswordError.style.display = 'block';
                confirmPasswordInput.style.borderColor = '#e74c3c';
            } else if (confirmPassword && password === confirmPassword) {
                confirmPasswordError.style.display = 'none';
                confirmPasswordInput.style.borderColor = 'var(--ds-color-success, #00893a)';
            }
        });

        // Cancel button
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        // Overlay click to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });

        // Button hover effects
        submitButton.addEventListener('mouseenter', () => {
            if (!submitButton.disabled) {
                submitButton.style.background = '#0056b3';
                submitButton.style.transform = 'translateY(-1px)';
            }
        });

        submitButton.addEventListener('mouseleave', () => {
            if (!submitButton.disabled) {
                submitButton.style.background = '#007bff';
                submitButton.style.transform = 'translateY(0)';
            }
        });

        cancelButton.addEventListener('mouseenter', () => {
            cancelButton.style.borderColor = 'var(--ds-color-gray-60, #b6bfc1)';
            cancelButton.style.color = 'var(--ds-color-gray-80, #434447)';
        });

        cancelButton.addEventListener('mouseleave', () => {
            cancelButton.style.borderColor = 'var(--ds-color-gray-40, #e8ecef)';
            cancelButton.style.color = 'var(--ds-color-gray-60, #b6bfc1)';
        });
    }
}

// Initialize login manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});