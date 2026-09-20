const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

navToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

document.getElementById("year").textContent = new Date().getFullYear();

const copyButton = document.querySelector(".copy-email");
copyButton?.addEventListener("click", async () => {
  const email = copyButton.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
    const oldText = copyButton.textContent;
    copyButton.textContent = "Email copied ✓";
    setTimeout(() => copyButton.textContent = oldText, 1800);
  } catch {
    window.location.href = `mailto:${email}`;
  }
});
