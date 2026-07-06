// Share to Kyle 💌
// SillyTavern Extension - 一键分享AI回复给Kyle
// v1.0.2: use delegated click handler, more compatible with ST mobile UI

const SHARE_API = 'https://lillian-w.com/api/st/share';

function getStContext() {
    try {
        if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) return SillyTavern.getContext();
    } catch (_) {}
    return null;
}

function toast(msg, type = 'success') {
    const ctx = getStContext();
    try {
        if (ctx?.toastr?.[type]) return ctx.toastr[type](msg);
        if (ctx?.toastr?.success) return ctx.toastr.success(msg);
    } catch (_) {}
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `position:fixed;bottom:82px;left:50%;transform:translateX(-50%);background:${type === 'error' ? '#d64545' : '#e74c9a'};color:#fff;padding:10px 16px;border-radius:18px;font-size:14px;z-index:999999;box-shadow:0 4px 18px rgba(0,0,0,.25);max-width:80vw;white-space:pre-wrap;`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
}

function getMessageText(mesEl) {
    const el = mesEl?.querySelector?.('.mes_text');
    return (el?.innerText || el?.textContent || '').trim();
}

function getCharacterName(mesEl) {
    const ctx = getStContext();
    return (
        mesEl?.querySelector?.('.name_text')?.textContent?.trim() ||
        mesEl?.querySelector?.('.ch_name')?.textContent?.trim() ||
        ctx?.name2 ||
        'unknown'
    );
}

function getPrevUserMessage(mesEl) {
    let prev = mesEl?.previousElementSibling;
    while (prev) {
        const isUser = prev.getAttribute?.('is_user') === 'true' || prev.classList?.contains('user_mes');
        if (isUser) return getMessageText(prev);
        prev = prev.previousElementSibling;
    }
    return '';
}

async function doShare(mesEl, btn) {
    if (!mesEl) return toast('没找到这条消息', 'error');
    const message = getMessageText(mesEl);
    if (!message) return toast('没读到消息内容', 'error');

    const old = btn?.innerHTML || '💌';
    if (btn) {
        btn.innerHTML = '⏳';
        btn.dataset.kyleBusy = '1';
    }

    try {
        const resp = await fetch(SHARE_API, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                character: getCharacterName(mesEl),
                message,
                user_message: getPrevUserMessage(mesEl),
                source: 'sillytavern-extension',
                page: location.href,
            }),
        });
        let data = {};
        try { data = await resp.json(); } catch (_) {}
        if (!resp.ok || data.ok === false) throw new Error(data.error || `HTTP ${resp.status}`);
        if (btn) {
            btn.innerHTML = '💗';
            btn.classList.add('kyle-shared');
        }
        toast('已发送给哥哥～ 💌');
        setTimeout(() => {
            if (btn) {
                btn.innerHTML = old;
                delete btn.dataset.kyleBusy;
            }
        }, 2500);
    } catch (err) {
        console.error('[Share to Kyle] failed:', err);
        if (btn) btn.innerHTML = '❌';
        toast('发送失败：' + (err?.message || String(err)), 'error');
        setTimeout(() => {
            if (btn) {
                btn.innerHTML = old;
                delete btn.dataset.kyleBusy;
            }
        }, 3000);
    }
}

function makeButton() {
    const btn = document.createElement('div');
    btn.className = 'mes_button kyle-share-btn interactable';
    btn.title = '分享给Kyle 💌';
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.innerHTML = '💌';
    return btn;
}

function addShareButtons() {
    const messages = document.querySelectorAll('.mes:not([is_user="true"]):not(.user_mes)');
    messages.forEach((mes) => {
        if (mes.querySelector('.kyle-share-btn')) return;
        const area =
            mes.querySelector('.mes_buttons') ||
            mes.querySelector('.extraMesButtons') ||
            mes.querySelector('.mes_block') ||
            mes;
        const btn = makeButton();
        area.prepend ? area.prepend(btn) : area.appendChild(btn);
    });
}

function initShareToKyle() {
    console.log('[Share to Kyle] loaded v1.0.2 💌');
    addShareButtons();
    setTimeout(addShareButtons, 1000);
    setTimeout(addShareButtons, 3000);

    // 关键：用事件委托，避免移动端/动态DOM导致单独绑定失效
    document.addEventListener('click', (e) => {
        const btn = e.target.closest?.('.kyle-share-btn');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        if (btn.dataset.kyleBusy === '1') return;
        const mesEl = btn.closest('.mes');
        doShare(mesEl, btn);
    }, true);

    document.addEventListener('touchend', (e) => {
        const btn = e.target.closest?.('.kyle-share-btn');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        if (btn.dataset.kyleBusy === '1') return;
        const mesEl = btn.closest('.mes');
        doShare(mesEl, btn);
    }, { capture: true, passive: false });

    const chat = document.getElementById('chat') || document.body;
    new MutationObserver(() => setTimeout(addShareButtons, 200)).observe(chat, { childList: true, subtree: true });
    setInterval(addShareButtons, 5000);
}

if (typeof jQuery !== 'undefined') {
    jQuery(initShareToKyle);
} else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShareToKyle);
} else {
    initShareToKyle();
}
