const params = new URLSearchParams(location.search);
const domain = params.get('domain') || '';
const message = params.get('message') || 'בחרת לחסום את האתר הזה';
const unblockDuration = parseInt(params.get('unblockDuration')) || 0;

document.getElementById('domainName').textContent = domain;
document.getElementById('blockMessage').textContent = message;
document.getElementById('backBtn').addEventListener('click', () => history.back());

if (unblockDuration > 0) {
    document.getElementById('unblockSection').style.display = 'block';
    document.getElementById('countdown').textContent = `לזמן של ${unblockDuration} דקות`;

    document.getElementById('unblockBtn').addEventListener('click', () => {
        if (!/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain)) return;
        chrome.runtime.sendMessage({ action: 'unblockSite', domain, duration: unblockDuration }, () => {
            location.assign('https://' + encodeURIComponent(domain).replace(/%2E/g, '.'));
        });
    });
}
