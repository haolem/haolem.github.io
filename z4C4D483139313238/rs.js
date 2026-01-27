window.desc = true;

let params = new URLSearchParams(window.location.search);
if (params.has('ac')) {
    let access = params.get('ac');
    let sha256 = 'EAECF98D9480C40A282A4C3C36368F6F57B5FA399085B69E55E59F4A47B96F52';
    if (access.toUpperCase() === sha256) {
        window.desc = false;
    }
}