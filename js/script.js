
// Contact Form Functionality
const contactOverlay = document.getElementById('contactOverlay');

function openContactForm() {
    contactOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeContactForm() {
    contactOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetForm();
}

function resetForm() {
    const form = document.getElementById('contactForm');
    if (form) {
        form.reset();
        hideAllErrors();
    }
}

function hideAllErrors() {
    document.querySelectorAll('.error-message').forEach(error => {
        error.style.display = 'none';
    });
    document.querySelectorAll('.error').forEach(input => {
        input.classList.remove('error');
    });
}

function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(inputId + 'Error');

    if (input) input.classList.add('error');
    if (error) {
        error.textContent = message;
        error.style.display = 'block';
    }
}

function hideError(inputId) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(inputId + 'Error');

    if (input) input.classList.remove('error');
    if (error) error.style.display = 'none';
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

const verificationOverlay = document.getElementById('verificationOverlay');
let currentTaskId = null;
let currentUserEmail = null;

async function submitContactForm(event) {
    event.preventDefault();

    hideAllErrors();

    const userType = document.querySelector('input[name="userType"]:checked');
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const postcode = document.getElementById('postcode').value.trim();
    const description = document.getElementById('description').value.trim();
    const contactTime = document.querySelector('input[name="contactTime"]:checked');

    let isValid = true;

    if (!userType) {
        showError('userType', 'Required');
        isValid = false;
    }

    if (!fullName) {
        showError('fullName', 'Please enter your full name');
        isValid = false;
    }

    if (!email) {
        showError('email', 'Please enter your email address');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    }

    if (!postcode) {
        showError('postcode', 'Please enter your postcode');
        isValid = false;
    }

    if (!description) {
        showError('description', 'Please describe your needs');
        isValid = false;
    } else if (description.length < 10) {
        showError('description', 'Please provide more details (at least 10 characters)');
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    const submitBtn = document.querySelector('#contactForm button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Securely Transmitting...';
    submitBtn.disabled = true;

    const formData = {
        userType: userType.value,
        fullName: fullName,
        email: email,
        phone: phone,
        postcode: postcode,
        description: description,
        contactTime: contactTime ? contactTime.value : 'flexible'
    };

    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const data = await response.json();
            currentTaskId = data.taskId;
            currentUserEmail = email;

            // Close Form and Open Verification Modal with Urgency Context
            resetForm();
            closeContactForm();
            const urgency = contactTime ? contactTime.value : 'flexible';
            openVerificationModal(currentTaskId, urgency);
        } else {
            const data = await response.json();
            alert(`Submission Error: ${data.error || 'Please try again later or contact us directly at info@gotx.uk'}`);
        }
    } catch (error) {
        console.error('Submission Error:', error);
        // Fallback for local testing (mock success) or network error
        if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
            currentTaskId = "WEB-" + Date.now();
            currentUserEmail = email;
            resetForm();
            closeContactForm();
            const urgency = contactTime ? contactTime.value : 'flexible';
            openVerificationModal(currentTaskId, urgency);
        } else {
            alert('Network Error. Please verify your connection or try again later.');
        }
    } finally {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}

function openVerificationModal(taskId, urgency) {
    if (verificationOverlay) {
        // Set Task ID
        const taskIdDisplay = document.getElementById('verifyTaskId');
        if (taskIdDisplay) taskIdDisplay.textContent = taskId;

        // Set SLA Message based on Urgency
        const slaDisplay = document.getElementById('verifySLA');
        if (slaDisplay) {
            if (urgency === 'asap') {
                slaDisplay.textContent = "Your request is prioritized. Expect our call or email during the next available support slot before 18:00, or by the next working day.";
            } else {
                slaDisplay.textContent = "Your request is logged. Expect our call or email between now and the end of the next working day.";
            }
        }

        verificationOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeVerificationModal() {
    if (verificationOverlay) {
        verificationOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function handleVerification(status) {
    // Fire and forget verification logging
    const payload = { taskId: currentTaskId, status: status, email: currentUserEmail };

    try {
        fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) { console.log("Verification log failed", e); }

    closeVerificationModal();
}

function showComingSoon() {
    alert("Thank you for your interest! This section is currently in development. We're busy helping customers at the moment, but we'll have this content ready very soon. Do check back in a little while!");
    return false;
}

// Event Listeners (Security Best Practice: No inline events)
document.addEventListener('DOMContentLoaded', function () {
    // Contact Form Open Buttons
    document.querySelectorAll('.js-open-contact').forEach(btn => {
        btn.addEventListener('click', openContactForm);
    });

    // Contact Form Close Buttons
    const formCloseBtn = document.querySelector('.form-close');
    if (formCloseBtn) {
        formCloseBtn.addEventListener('click', closeContactForm);
    }

    const cancelBtn = document.querySelector('.cancel-button');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeContactForm);
    }

    // Contact Form Submit
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', submitContactForm);
    }

    // Close contact form with Escape key
    document.addEventListener('keydown', function (e) {
        const overlay = document.getElementById('contactOverlay');
        if (e.key === 'Escape' && overlay.style.display === 'flex') {
            closeContactForm();
        }
    });

    // Close contact form when clicking outside
    const overlay = document.getElementById('contactOverlay');
    if (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                closeContactForm();
            }
        });
    }

    // Q&A Accordion functionality
    document.querySelectorAll('.qa-item').forEach(item => {
        const question = item.querySelector('.qa-question');

        question.addEventListener('click', (e) => {
            if (e.target.closest('.cta-button')) return;

            document.querySelectorAll('.qa-item').forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.qa-toggle i').className = 'fas fa-plus';
                }
            });

            item.classList.toggle('active');
            const toggleIcon = item.querySelector('.qa-toggle i');

            if (item.classList.contains('active')) {
                toggleIcon.className = 'fas fa-times';
            } else {
                toggleIcon.className = 'fas fa-plus';
            }
        });
    });

    // Open first Q&A item by default
    const firstQaItem = document.querySelector('.qa-item');
    if (firstQaItem) {
        firstQaItem.classList.add('active');
        firstQaItem.querySelector('.qa-toggle i').className = 'fas fa-times';
    }

    // Coming Soon Links functionality
    document.querySelectorAll('.coming-soon').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            // Use the global function
            showComingSoon();
        });
    });

    // Cookie management
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptCookies = document.getElementById('accept-cookies');
    const rejectCookies = document.getElementById('reject-cookies');

    if (cookieBanner) {
        // Check for coming soon link in cookie banner
        const cookiePolicyLink = cookieBanner.querySelector('a');
        if (cookiePolicyLink) {
            cookiePolicyLink.addEventListener('click', function (e) {
                e.preventDefault();
                showComingSoon();
            });
        }

        if (!localStorage.getItem('cookies-accepted')) {
            setTimeout(() => {
                cookieBanner.style.display = 'block';
            }, 1000);
        }

        if (acceptCookies) {
            acceptCookies.addEventListener('click', () => {
                localStorage.setItem('cookies-accepted', 'true');
                localStorage.setItem('cookies-timestamp', Date.now());
                cookieBanner.style.display = 'none';
            });
        }

        if (rejectCookies) {
            rejectCookies.addEventListener('click', () => {
                localStorage.setItem('cookies-accepted', 'essential');
                localStorage.setItem('cookies-timestamp', Date.now());
                cookieBanner.style.display = 'none';
            });
        }
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a, .footer-column a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                // If it's a specific link that should just scroll
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Interactive button effects
    document.querySelectorAll('.cta-button').forEach(button => {
        button.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-3px)';
        });

        button.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add subtle interactive effect to service cards
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mouseenter', function () {
            const icon = this.querySelector('.service-icon i');
            if (icon) {
                icon.style.transform = 'scale(1.1)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });

        card.addEventListener('mouseleave', function () {
            const icon = this.querySelector('.service-icon i');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    });

    // Pricing card hover effect
    document.querySelectorAll('.pricing-card').forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });

    // Verification Modal Listeners
    const btnVerifyYes = document.getElementById('btnVerifyYes');
    const btnVerifyNo = document.getElementById('btnVerifyNo');
    const btnVerifySkip = document.getElementById('btnVerifySkip');

    if (btnVerifyYes) btnVerifyYes.addEventListener('click', () => handleVerification('CONFIRMED'));
    if (btnVerifyNo) btnVerifyNo.addEventListener('click', () => handleVerification('DENIED'));
    if (btnVerifySkip) btnVerifySkip.addEventListener('click', () => handleVerification('SKIPPED'));

    // Newsletter Subscription handler
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const emailInput = document.getElementById('subscriberEmail');
            const feedback = document.getElementById('newsletterFeedback');
            const submitBtn = this.querySelector('button[type="submit"]');

            if (!emailInput || !emailInput.value) return;

            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Joining...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailInput.value.trim() })
                });

                feedback.style.display = 'block';
                if (response.ok) {
                    feedback.textContent = 'Success! You are now subscribed to the GOTX mission list.';
                    feedback.style.color = '#00f2ff';
                    this.reset();
                } else {
                    const data = await response.json();
                    feedback.textContent = `Error: ${data.error || 'Please try again later.'}`;
                    feedback.style.color = '#ff4d4d';
                }
            } catch (error) {
                feedback.style.display = 'block';
                feedback.textContent = 'Connection error. Please try again later.';
                feedback.style.color = '#ff4d4d';
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
