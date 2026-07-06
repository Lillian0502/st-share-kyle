// Share to Kyle - SillyTavern Extension
// 在每条AI回复上添加"分享给Kyle"按钮

const SHARE_API = 'https://lillian-w.com/api/st/share';

// 等待ST加载完成
jQuery(async () => {
    // 监听新消息渲染
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    addShareButtons(node);
                }
            });
        });
    });

    // 观察聊天区域
    const chatEl = document.getElementById('chat');
    if (chatEl) {
        observer.observe(chatEl, { childList: true, subtree: true });
        // 给已有消息也加按钮
        setTimeout(() => addShareButtons(chatEl), 1000);
    }
});

function addShareButtons(container) {
    // 找所有AI回复消息（非user的消息）
    const messages = container.querySelectorAll
        ? container.querySelectorAll('.mes:not([is_user="true"])')
        : [];
    
    messages.forEach((mes) => {
        // 已经加过按钮就跳过
        if (mes.querySelector('.kyle-share-btn')) return;
        
        // 找到消息操作栏
        const extraBlock = mes.querySelector('.mes_block .mes_buttons');
        if (!extraBlock) return;

        const btn = document.createElement('div');
        btn.className = 'mes_button kyle-share-btn';
        btn.title = '分享给Kyle';
        btn.innerHTML = '💌';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            shareToKyle(mes, btn);
        });
        extraBlock.prepend(btn);
    });
}

async function shareToKyle(mesEl, btn) {
    // 获取角色名
    const charName = mesEl.querySelector('.ch_name .name_text')?.textContent?.trim() || 'unknown';
    
    // 获取AI回复内容
    const mesText = mesEl.querySelector('.mes_text')?.innerText?.trim() || '';
    
    // 尝试获取上一条user消息
    let userMsg = '';
    let prev = mesEl.previousElementSibling;
    while (prev) {
        if (prev.getAttribute('is_user') === 'true') {
            userMsg = prev.querySelector('.mes_text')?.innerText?.trim() || '';
            break;
        }
        prev = prev.previousElementSibling;
    }

    if (!mesText) {
        btn.innerHTML = '❌';
        setTimeout(() => btn.innerHTML = '💌', 2000);
        return;
    }

    btn.innerHTML = '⏳';
    
    try {
        const resp = await fetch(SHARE_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                character: charName,
                message: mesText,
                user_message: userMsg
            })
        });
        
        if (resp.ok) {
            btn.innerHTML = '✅';
            btn.classList.add('kyle-shared');
            setTimeout(() => btn.innerHTML = '💌', 3000);
        } else {
            throw new Error('发送失败');
        }
    } catch (err) {
        console.error('Share to Kyle failed:', err);
        btn.innerHTML = '❌';
        setTimeout(() => btn.innerHTML = '💌', 2000);
    }
}
