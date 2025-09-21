let _WEBSTATE;

document.addEventListener("DOMContentLoaded", () => {
    fetch("/configs/webstatic.json")
        .then((dat) => dat.json())
        .then(jsond => {
            _WEBSTATE = jsond;
            if (_WEBSTATE.isContruct === 1) {
                document.body.innerHTML = "<swd-contruct-msg></swd-contruct-msg><code><b style='color:orange'>WARN</b>  Website is in construction!</code>";
            }
        }).catch(err => {
            console.error("Web State can not load:", err)
    });
    

});