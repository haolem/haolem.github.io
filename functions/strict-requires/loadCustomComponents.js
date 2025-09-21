function loadCustomComponents() {
  document.querySelectorAll("*").forEach(el => {
    if (el.tagName.startsWith("SWD-")) {
      const tagName = el.tagName.toLowerCase();
      fetch(`components/${tagName}.html`)
        .then(res => res.text())
        .then(html => {
          el.outerHTML = html;
          
        })
        .catch(err => console.error(`Can not load ${tagName}:`, err));
    }
  });
};

const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      loadCustomComponents();
    }
    if (mutation.type === "attributes" && mutation.attributeName !== "class") {
      loadCustomComponents();
    }
  }
});

observer.observe(document.body, {
  childList: true,
  attributes: true,
  subtree: true
});