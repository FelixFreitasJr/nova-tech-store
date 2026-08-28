/* js/script.js
   - Card clicável (abre detalhes)
   - Menu mobile toggle
   - Carrinho simples com localStorage e API global NovaTechCart
   - Handlers para add-to-cart em todas as páginas
   - Renderização da página carrinho (se existir elementos específicos)
*/

/* ====== Utilitários ====== */
const CART_KEY = 'nova_tech_cart_v1';

function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Erro ao ler carrinho', e);
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function cartTotal() {
    const cart = getCart();
    return cart.reduce((acc, p) => acc + (Number(p.price) * Number(p.qty)), 0);
}

/* ====== API pública do carrinho ====== */
function addToCart(product) {
    // product: { id, name, price, qty }
    const cart = getCart();
    const idx = cart.findIndex(p => p.id === product.id);
    if (idx > -1) {
        cart[idx].qty += product.qty;
    } else {
        cart.push(product);
    }
    saveCart(cart);
    dispatchCartUpdated();
}

function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(p => p.id !== id);
    saveCart(cart);
    dispatchCartUpdated();
}

function updateQuantity(id, qty) {
    const cart = getCart();
    const idx = cart.findIndex(p => p.id === id);
    if (idx > -1) {
        cart[idx].qty = Math.max(0, qty);
        if (cart[idx].qty === 0) cart.splice(idx, 1);
        saveCart(cart);
        dispatchCartUpdated();
    }
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    dispatchCartUpdated();
}

function dispatchCartUpdated() {
    const event = new CustomEvent('cartUpdated', { detail: { cart: getCart(), total: cartTotal() } });
    window.dispatchEvent(event);
}

/* Expor API para console/outros scripts */
window.NovaTechCart = {
    getCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal
};

/* ====== DOMContentLoaded: inicializações comuns ====== */
document.addEventListener('DOMContentLoaded', () => {

    /* --- 1) Card clicável (abre detalhes) --- */
    document.querySelectorAll('.produto').forEach(prod => {
        const addBtn = prod.querySelector('.add-to-cart');
        const id = addBtn?.dataset.id;
        if (!id) return;
        prod.style.cursor = 'pointer';
        prod.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart') || e.target.closest('button') || e.target.closest('a')) return;
            // abre detalhes (produtos.html está em pages/, detalhes também)
            // se estiver em pages/, o link relativo é 'detalhes.html'
            const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
            window.location.href = `${base}detalhes.html?id=${encodeURIComponent(id)}`;
        });
    });

    /* --- 2) Botão mobile do menu --- */
    if (!document.querySelector('.mobile-menu-btn')) {
        const navbar = document.querySelector('.navbar');
        const nav = document.querySelector('.nav-links');
        if (navbar && nav) {
            const btn = document.createElement('button');
            btn.className = 'mobile-menu-btn';
            btn.setAttribute('aria-label', 'Abrir menu');
            btn.innerHTML = '☰';
            btn.style.cssText = 'background:transparent;border:0;color:var(--muted);font-size:1.25rem;padding:0.25rem 0.5rem;cursor:pointer;';
            navbar.insertBefore(btn, navbar.firstChild);
            btn.addEventListener('click', () => nav.classList.toggle('mobile-open'));
        }
    }

    /* --- 3) Inicializa contador do carrinho --- */
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        const cart = getCart();
        const totalItems = cart.reduce((s, p) => s + Number(p.qty), 0);
        countEl.textContent = totalItems;
    }

    /* --- 4) Detecta e conecta botões .add-to-cart --- */
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        // evita múltiplos listeners
        if (btn.dataset.bound === 'true') return;
        btn.dataset.bound = 'true';

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id || btn.getAttribute('data-id');
            const name = btn.dataset.name || btn.getAttribute('data-name') || 'Produto';
            const price = parseFloat(btn.dataset.price || btn.getAttribute('data-price') || 0);
            // tenta pegar quantidade de um input próximo (detalhes.html usa #qty)
            let qty = 1;
            const qtyInput = document.querySelector('#qty');
            if (qtyInput && !isNaN(parseInt(qtyInput.value, 10))) qty = Math.max(1, parseInt(qtyInput.value, 10));
            // se o botão tem data-qty
            if (btn.dataset.qty) qty = Math.max(1, parseInt(btn.dataset.qty, 10));

            if (!id) {
                console.warn('Produto sem data-id não pode ser adicionado ao carrinho.');
                return;
            }

            addToCart({ id, name, price, qty });

            // feedback visual
            const original = btn.innerText;
            btn.disabled = true;
            btn.innerText = 'Adicionado ✓';
            setTimeout(() => { btn.disabled = false; btn.innerText = original; }, 1200);
        });
    });

    /* --- 5) Atualiza contador quando evento global for disparado --- */
    window.addEventListener('cartUpdated', (e) => {
        const el = document.getElementById('cart-count');
        if (!el) return;
        const total = e.detail.cart.reduce((s, p) => s + Number(p.qty), 0);
        el.textContent = total;
    });

    /* --- 6) Se estivermos na página de carrinho, inicializa renderização --- */
    if (document.getElementById('lista-carrinho') || document.getElementById('cart-body')) {
        initCartPage();
    }
});

/* ====== Funções para renderizar e controlar a página do carrinho ====== */
function initCartPage() {
    // suporta duas variantes de markup: sua versão com #lista-carrinho e a versão em tabela (#cart-body)
    const lista = document.getElementById('lista-carrinho');
    const cartBody = document.getElementById('cart-body');
    const cartWrapper = document.getElementById('cart-wrapper');
    const emptyMsg = document.getElementById('cart-empty');
    const totalEl = document.getElementById('cart-total') || document.getElementById('total-carrinho') || document.getElementById('total-carrinho');

    function formatBRL(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function render() {
        const cart = getCart();

        // atualizar contador global
        const countEl = document.getElementById('cart-count');
        if (countEl) countEl.textContent = cart.reduce((s, p) => s + Number(p.qty), 0);

        // versão lista simples (se existir)
        if (lista) {
            lista.innerHTML = '';
            if (!cart || cart.length === 0) {
                lista.innerHTML = '<div class="center text-muted">Seu carrinho está vazio.</div>';
                if (totalEl) totalEl.textContent = formatBRL(0);
                return;
            }
            cart.forEach(item => {
                const div = document.createElement('div');
                div.className = 'item-carrinho';
                div.innerHTML = `
          <div class="item-thumb">
            <img src="../img/${item.id}.png" alt="${item.name}" onerror="this.src='../img/placeholder.png'">
          </div>
          <div class="item-info">
            <div class="nome">${item.name}</div>
            <div class="sku">SKU: ${item.id}</div>
            <div class="text-muted">${formatBRL(Number(item.price))} cada</div>
          </div>
          <div class="item-actions">
            <input type="number" min="1" value="${item.qty}" data-id="${item.id}" class="cart-qty">
            <div style="display:flex;gap:6px;margin-top:6px">
              <button class="remove-item" data-id="${item.id}">Remover</button>
            </div>
          </div>
        `;
                lista.appendChild(div);
            });
            if (totalEl) totalEl.textContent = formatBRL(cartTotal());
        }

        // versão tabela (se existir)
        if (cartBody) {
            if (!cart || cart.length === 0) {
                if (cartWrapper) cartWrapper.classList.add('hidden');
                if (emptyMsg) emptyMsg.classList.remove('hidden');
                if (totalEl) totalEl.textContent = formatBRL(0);
                return;
            }
            if (cartWrapper) cartWrapper.classList.remove('hidden');
            if (emptyMsg) emptyMsg.classList.add('hidden');

            cartBody.innerHTML = '';
            cart.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
          <td style="min-width:220px">
            <div style="font-weight:700">${item.name}</div>
            <div class="text-muted" style="font-size:0.9rem">SKU: ${item.id}</div>
          </td>
          <td>${formatBRL(Number(item.price))}</td>
          <td><input type="number" min="1" value="${item.qty}" data-id="${item.id}" class="cart-qty" style="width:72px;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:inherit"></td>
          <td>${formatBRL(Number(item.price) * Number(item.qty))}</td>
          <td><button class="remove-item btn-secondary" data-id="${item.id}">Remover</button></td>
        `;
                cartBody.appendChild(tr);
            });
            if (totalEl) totalEl.textContent = formatBRL(cartTotal());
        }
    }

    // delegação: alterar quantidade
    document.addEventListener('input', (e) => {
        const input = e.target.closest && e.target.closest('.cart-qty');
        if (!input) return;
        const id = input.dataset.id;
        const qty = Math.max(1, parseInt(input.value, 10) || 1);
        updateQuantity(id, qty);
        render();
    });

    // delegação: remover item
    document.addEventListener('click', (e) => {
        const rem = e.target.closest && e.target.closest('.remove-item');
        if (rem) {
            const id = rem.dataset.id;
            removeFromCart(id);
            render();
        }
    });

    // limpar carrinho (se existir botão)
    const clearBtn = document.getElementById('clear-cart');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Deseja limpar todo o carrinho?')) {
                clearCart();
                render();
            }
        });
    }

    // checkout via WhatsApp (se existir botão)
    const checkoutBtn = document.getElementById('checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cart = getCart();
            if (!cart || cart.length === 0) { alert('Seu carrinho está vazio.'); return; }
            // coleta dados do formulário se existir
            const form = document.getElementById('form-pedido');
            let nome = '', email = '', telefone = '', endereco = '', pagamento = '';
            if (form) {
                nome = form.nome?.value || '';
                email = form.email?.value || '';
                telefone = form.telefone?.value || '';
                endereco = form.endereco?.value || '';
                pagamento = form.pagamento?.value || '';
            }
            let msg = `Olá, tenho interesse na compra:%0A`;
            cart.forEach(i => {
                msg += `- ${i.name} (SKU: ${i.id}) x${i.qty} = ${Number(i.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}%0A`;
            });
            msg += `%0ATotal: ${cartTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}%0A`;
            msg += `%0ADados:%0ANome: ${nome}%0AEmail: ${email}%0ATelefone: ${telefone}%0AEndereço: ${endereco}%0APagamento: ${pagamento}`;
            const vendedor = '5511999999999'; // substitua pelo número real
            const url = `https://wa.me/${vendedor}?text=${msg}`;
            window.open(url, '_blank');
        });
    }

    // inicial render
    render();

    // atualiza quando evento global for disparado
    window.addEventListener('cartUpdated', render);
}
