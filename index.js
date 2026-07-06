// Share to Kyle 💌
// SillyTavern Extension - 一键分享AI回复给Kyle

const SHARE_API = 'https://lillian-w.com/api/st/share';

function getContext() {
    return typeof SillyTavern !== 'undefined' && SillyTavern.getContext
        ? SillyTavern.getContext()
        : null;
}

function showToast(msg) {
    const ctx = getContext();
    if (ctx && ctx.toastr) {
        ctx.toastr.success(msg);
        return;
    }
    // fallback
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(231,76,154,0.95);color:#fff;padding:10px 20px;border-radius:20px;font-size:14px;z-index:99999;pointer-events:none;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

function showError(msg) {
    const ctx = getContext();
    if (ctx && ctx.toastr) {
        ctx.toastr.error(msg);
        return;
    }
    showToast('❌ ' + msg);
}

async function shareToKyle(mesEl, btn) {
    const ctx = getContext();
    
    // 获取角色名
    let charName = 'unknown';
    if (ctx && ctx.name2) {
        charName = ctx.name2;
    } else {
        const nameEl = mesEl.querySelector('.name_text');
        if (nameEl) charName = nameEl.textContent.trim();
    }
    
    // 获取消息文本 - 用 innerText 保留换行
    const mesTextEl = mesEl.querySelector('.mes_text');
    if (!mesTextEl || !mesTextEl.innerText.trim()) {
        showError('没找到消息内容');
        return;
    }
    const message = mesTextEl.innerText.trim();
    
    // 获取上一条user消息
    let userMsg = '';
    let prev = mesEl.previousElementSibling;
    while (prev) {
        if (prev.getAttribute('is_user') === 'true') {
            const ut = prev.querySelector('.mes_text');
            if (ut) userMsg = ut.innerText.trim();
            break;
        }
        prev = prev.previousElementSibling;
    }
    
    const origText = btn.innerHTML;
    btn.innerHTML = '⏳';
    btn.style.pointerEvents = 'none';
    
    try {
        const resp = await fetch(SHARE_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                character: charName,
                message: message,
                user_message: userMsg
            })
        });
        
        const data = await resp.json();
        
        if (resp.ok && data.ok) {
            btn.innerHTML = '💗';
            btn.classList.add('kyle-shared');
            showToast('已发送给哥哥～ 💌');
            setTimeout(() => { btn.innerHTML = '💌'; btn.style.pointerEvents = ''; }, 3000);
        } else {
            throw new Error(data.error || '服务器返回错误');
        }
    } catch (err) {
        console.error('[Share to Kyle] Error:', err);
        btn.innerHTML = '❌';
        showError('发送失败: ' + err.message);
        setTimeout(() => { btn.innerHTML = '💌'; btn.style.pointerEvents = ''; }, 3000);
    }
}

function addShareButtons() {
    document.querySelectorAll('.mes:not([is_user="true"])').forEach(mes => {
        if (mes.querySelector('.kyle-share-btn')) return;
        
        // ST的消息按钮区域 - 尝试多种选择器
        const btnArea = mes.querySelector('.extraMesButtons')
            || mes.querySelector('.mes_buttons .extraMesButtonsHint')?.parentElement
            || mes.querySelector('.mes_buttons');
        if (!btnArea) return;
        
        const btn = document.createElement('div');
        btn.className = 'mes_button kyle-share-btn';
        btn.title = '分享给Kyle 💌';
        btn.innerHTML = '💌';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            shareToKyle(mes, btn);
        });
        
        btnArea.appendChild(btn);
    });
}

// 初始化
jQuery(() => {
    console.log('[Share to Kyle] Extension loaded! 💌');
    
    // 延迟首次添加按钮
    setTimeout(addShareButtons, 2000);
    
    // 监听聊天区域变化
    const chatEl = document.getElementById('chat');
    if (chatEl) {
        const observer = new MutationObserver(() => {
            setTimeout(addShareButtons, 300);
        });
        observer.observe(chatEl, { childList: true, subtree: false });
    }
    
    // 兜底：定期扫描
    setInterval(addShareButtons, 5000);
    
    // 监听ST的事件（如果可用）
    const ctx = getContext();
    if (ctx && ctx.eventSource) {
        const evts = ctx.eventTypes || {};
        if (evts.MESSAGE_RECEIVED) {
            ctx.eventSource.on(evts.MESSAGE_RECEIVED, () => setTimeout(addShareButtons, 500));
        }
        if (evts.CHAT_CHANGED) {
            ctx.eventSource.on(evts.CHAT_CHANGED, () => setTimeout(addShareButtons, 1000));
        }
    }
});
