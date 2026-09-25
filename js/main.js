function initContactForm() {
  const contactForm = document.querySelector(".contact-form");
  if (!contactForm) return;

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Thanks for your message! Hook this form up to a backend or service when you're ready.");
    contactForm.reset();
  });
}

document.addEventListener("includes:loaded", initContactForm);
