let currentPath = [];

function loadCustomComponents() {
    document.querySelectorAll("*").forEach(el => {
        if (el.tagName.startsWith("SWD-")) {
        const tagName = el.tagName.toLowerCase();
        fetch(`components/${tagName}.htm`)
            .then(res => res.text())
            .then(html => {
            el.insertAdjacentHTML('afterend', html);
            el.remove()
            disableCurrentLink()
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

const disableCurrentLink = () => {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.header .left .nav a[href]').forEach(a => {
        const linkPath = a.getAttribute('href');
        if (linkPath === currentPath || linkPath === window.location.href) {
            a.addEventListener('click', e => e.preventDefault());
            a.style.pointerEvents = 'none';
            a.style.cursor = 'default';
            a.style.setProperty("font-weight", "600");
        }
    });
};

const dirSet = (dir, root) => {
    const nav = document.getElementById("navShow");

    if (dir.startsWith("/")) {
        currentPath = dir.split("/").filter(Boolean);
    } 
    else {
        const parts = dir.split("/").filter(Boolean);
        for (const p of parts) {
            if (p === "..") {
                currentPath.pop();
            } else {
                currentPath.push(p);
            }
        }
    }

    let html = `<b>${root}</b>`;
    if (currentPath.length > 0) {
        html += " / " + currentPath.map(p => `<b>${p}</b>`).join(" / ");
    } else {
        html += " /";
    }
    nav.innerHTML = html;
};

const getDir = () => {
    return "/" + currentPath.join("/");
};