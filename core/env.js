// core/env.js
// Copyright (c) 2026 Le Minh Hao
// This code is licensed under MIT license (see LICENSE for details)
(async function () {
    const CONFIG_URL = '/core/versions.json';
    try {
        const response = await fetch(CONFIG_URL);
        if (!response.ok) throw new Error('Unable to load configuration file.');
        const config = await response.json();
        const { latest, versions } = config;
        let selectedVersion = latest;
        const iterator = document.createNodeIterator(document, NodeFilter.SHOW_COMMENT);
        let currentNode;
        const tasks = [];
        while (currentNode = iterator.nextNode()) {
            const content = currentNode.nodeValue.trim();
            const versionMatch = content.match(/\{\{\s*version:\s*([\w.-]+)\s*\}\}/);
            if (versionMatch) {
                selectedVersion = versionMatch[1];
                continue;
            }
            const assetMatch = content.match(/\{\{\s*(link:css|script:js)\s+(.+?)\s*\}\}/);
            if (assetMatch) {
                tasks.push({
                    node: currentNode,
                    type: assetMatch[1],
                    file: assetMatch[2]
                });
            }
        }
        const basePath = (selectedVersion === latest) 
            ? `/${selectedVersion}` 
            : `/o/${selectedVersion}`;
        window._CURRENT_VERSION = selectedVersion;
        window._BASE_PATH = basePath;
        tasks.forEach(task => {
            const fullUrl = `${basePath}/${task.file}`;
            if (task.type === 'link:css') {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = fullUrl;
                document.head.appendChild(link);
            } else if (task.type === 'script:js') {
                const script = document.createElement('script');
                script.src = fullUrl;
                task.node.parentNode.insertBefore(script, task.node.nextSibling);
            }
            task.node.remove();
        });

    } catch (error) {
        console.error('Error when loading environment:', error);
    }
})();