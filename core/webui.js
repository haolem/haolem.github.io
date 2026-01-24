// core/webui.js
// Copyright (c) 2026 Le Minh Hao
// This code is licensed under MIT license (see LICENSE for details)
class WebUI {
    constructor() {
        this.version = window._CURRENT_VERSION || 'v1';
        this.basePath = window._BASE_PATH || `/${this.version}`;
        this.init();
    }
    init() {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        const regex = /\{\{\s*\.load\s+(\w+)\s*\?\s*\((.+?)\)\s*\}\}/g;
        const replacements = [];
        while (node = walker.nextNode()) {
            if (regex.test(node.nodeValue)) {
                replacements.push(node);
            }
        }
        replacements.forEach(node => {
            const fragment = document.createDocumentFragment();
            const parts = node.nodeValue.split(/(\{\{\s*\.load\s+\w+\s*\?\s*\(.+?\)\s*\}\})/g);
            
            parts.forEach(part => {
                const match = part.match(/\{\{\s*\.load\s+(\w+)\s*\?\s*\((.+?)\)\s*\}\}/);
                if (match) {
                    const el = document.createElement('ui-observe');
                    el.setAttribute('name', match[1]);
                    el.setAttribute('statement', match[2]);
                    fragment.appendChild(el);
                } else if (part) {
                    fragment.appendChild(document.createTextNode(part));
                }
            });
            node.parentNode.replaceChild(fragment, node);
        });

        this.defineElement();
    }
    defineElement() {
        const self = this;
        if (customElements.get('ui-observe')) return;
        customElements.define('ui-observe', class extends HTMLElement {
            connectedCallback() {
                this.style.display = 'contents';
                this.name = this.getAttribute('name');
                this.statement = this.getAttribute('statement');
                this.isVisible = false;
                this.checkStatus();
            }
            async checkStatus() {
                this.timer = setInterval(async () => {
                    let result = false;
                    try {
                        result = !!(new Function(`
                            try { 
                                return ${this.statement}; 
                            } catch(e) { 
                                // Silent if variable is not defined
                                if (e instanceof ReferenceError) return false;
                                // Rethrow other types of errors
                                throw e;
                            }
                        `))();
                    } catch (e) {
                        console.error(`Error executing statement [${this.statement}]:`, e);
                        result = false;
                    }

                    if (result && !this.isVisible) {
                        await this.show();
                    } else if (!result && this.isVisible) {
                        this.hide();
                    }
                }, 100);
            }
            async show() {
                this.isVisible = true;
                const url = `${self.basePath}/c/${this.name}.htm`;
                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        const html = await res.text();
                        this.innerHTML = `\n\n${html}\n\n`;
                    } else {
                        throw new Error(`Status ${res.status}`);
                    }
                } catch (e) {
                    this.isVisible = false;
                    console.error(`Unable to load component ${this.name}:`, e.message);
                }
            }
            hide() {
                this.isVisible = false;
                this.innerHTML = '';
            }
            disconnectedCallback() {
                clearInterval(this.timer);
            }
        });
    }
}
document.addEventListener('DOMContentLoaded', () => new WebUI());