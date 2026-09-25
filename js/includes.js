function getCurrentPage() {
  const file = window.location.pathname.split("/").pop();
  if (!file || file === "index.html") return "home";
  return file.replace(".html", "");
}

function applyTemplate(html) {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => SITE_CONFIG[key] ?? "");
}

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT"]);
const CONFIG_ATTRS = ["href", "content", "title"];

function applyConfigToTree(root) {
  const textNodes = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE && SKIP_TAGS.has(node.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  while (walker.nextNode()) {
    const node = walker.currentNode;

    if (node.nodeType === Node.TEXT_NODE && node.textContent.includes("{{")) {
      textNodes.push(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      CONFIG_ATTRS.forEach((attr) => {
        const value = node.getAttribute(attr);
        if (value?.includes("{{")) {
          node.setAttribute(attr, applyTemplate(value));
        }
      });
    }
  }

  textNodes.forEach((node) => {
    node.textContent = applyTemplate(node.textContent);
  });
}

function applyConfigToPage() {
  applyConfigToTree(document.head);
  const main = document.querySelector("main");
  if (main) applyConfigToTree(main);
}

async function loadIncludes() {
  const slots = document.querySelectorAll("[data-include]");

  await Promise.all(
    [...slots].map(async (slot) => {
      const url = slot.dataset.include;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load ${url}`);
      slot.outerHTML = applyTemplate(await response.text());
    })
  );

  const currentPage = getCurrentPage();
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const isCurrent = link.dataset.nav === currentPage;
    link.classList.toggle("active", isCurrent);
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyConfigToPage();

  loadIncludes()
    .then(() => document.dispatchEvent(new Event("includes:loaded")))
    .catch((err) => console.error("Could not load page sections:", err));
});
