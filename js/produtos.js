/* Catálogo local: mantenha e expanda conforme necessário */
const PRODUCTS = [
    {
        id: 'notebook-001',
        name: 'Notebook Gamer',
        price: 4999.90,
        img: '../img/Notebook Gamer.png',
        thumbs: ['../img/Notebook Gamer.png', '../img/Notebook Gamer1.png'],
        category: 'NOTEBOOK',
        description: 'Alta performance para jogos, estudos e trabalho. Processador potente, SSD rápido e placa dedicada.',
        specs: ['Processador Intel i7', '16GB RAM', 'SSD 1TB', 'GPU dedicada 6GB']
    },
    {
        id: 'notebook-002',
        name: 'Notebook Gamer Pro',
        price: 6499.90,
        img: '../img/Notebook Gamer1.png',
        thumbs: ['../img/Notebook Gamer1.png', '../img/Notebook Gamer2.png'],
        category: 'NOTEBOOK',
        description: 'Mais desempenho para jogos e aplicações pesadas. Ideal para criadores de conteúdo.',
        specs: ['Processador Intel i9', '32GB RAM', 'SSD 1TB NVMe', 'GPU 8GB']
    },
    {
        id: 'notebook-003',
        name: 'Notebook Gamer Ultra',
        price: 8999.90,
        img: '../img/Notebook Gamer2.png',
        thumbs: ['../img/Notebook Gamer2.png', '../img/Notebook Gamer.png'],
        category: 'NOTEBOOK',
        description: 'Experiência premium para usuários exigentes, com visual moderno e alto desempenho.',
        specs: ['Processador Intel i9 Extreme', '64GB RAM', 'SSD 2TB NVMe', 'Tela 165Hz']
    },
    {
        id: 'teclado-001',
        name: 'Teclado Mecânico',
        price: 349.90,
        img: '../img/Teclado Mecânico.jpg',
        thumbs: ['../img/Teclado Mecânico.jpg'],
        category: 'PERIFÉRICO',
        description: 'Precisão e resposta rápida para jogos e trabalho.',
        specs: ['Switch mecânico', 'Anti-ghosting', 'Construção em alumínio']
    },
    {
        id: 'teclado-002',
        name: 'Teclado Mecânico RGB',
        price: 429.90,
        img: '../img/Teclado Mecânico1.jpg',
        thumbs: ['../img/Teclado Mecânico1.jpg', '../img/Teclado Mecânico.jpg'],
        category: 'GAMING',
        description: 'Iluminação RGB, construção robusta e precisão para seu setup gamer.',
        specs: ['RGB customizável', 'Switch mecânico', 'Anti-ghosting', 'Cabo reforçado']
    },
    {
        id: 'mouse-001',
        name: 'Mouse Gamer',
        price: 199.90,
        img: '../img/Mouse Gamer.jpg',
        thumbs: ['../img/Mouse Gamer.jpg'],
        category: 'GAMING',
        description: 'Sensor de alta precisão para jogos competitivos.',
        specs: ['Sensor 16000 DPI', '6 botões programáveis', 'Iluminação RGB']
    }
];

(function () {
    function qs(name) { return new URLSearchParams(location.search).get(name); }
    function formatBRL(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
    const id = qs('id');

    // elementos
    const mainImg = document.getElementById('main-image');
    const thumbsEl = document.getElementById('thumbs');
    const catEl = document.getElementById('produto-categoria');
    const nameEl = document.getElementById('produto-nome');
    const descEl = document.getElementById('produto-descricao');
    const specsEl = document.getElementById('produto-especificacoes');
    const priceEl = document.getElementById('produto-preco');
    const addBtn = document.getElementById('btn-add');
    const qtyInput = document.getElementById('qty');
    const breadcrumb = document.getElementById('breadcrumb-current');
    const relatedList = document.getElementById('related-list');

    if (!id) {
        // sem id: redireciona para produtos
        window.location.href = 'produtos.html';
        return;
    }

    const product = PRODUCTS.find(p => p.id === id);
    if (!product) {
        nameEl.textContent = 'Produto não encontrado';
        descEl.textContent = 'O produto solicitado não foi localizado.';
        priceEl.textContent = '—';
        addBtn.disabled = true;
        return;
    }

    // preencher dados
    mainImg.src = product.img;
    mainImg.alt = product.name;
    catEl.textContent = product.category;
    nameEl.textContent = product.name;
    descEl.textContent = product.description;
    priceEl.textContent = formatBRL(product.price);
    if (breadcrumb) breadcrumb.textContent = product.name;

    // specs
    specsEl.innerHTML = '';
    product.specs.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        specsEl.appendChild(li);
    });

    // thumbs
    thumbsEl.innerHTML = '';
    (product.thumbs || [product.img]).forEach((t, idx) => {
        const img = document.createElement('img');
        img.src = t;
        img.alt = product.name + ' ' + (idx + 1);
        img.className = 'thumb';
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            mainImg.src = t;
        });
        thumbsEl.appendChild(img);
    });

    // configurar botão adicionar
    addBtn.dataset.id = product.id;
    addBtn.dataset.name = product.name;
    addBtn.dataset.price = product.price;
    addBtn.addEventListener('click', () => {
        const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
        // usa API global NovaTechCart (fornecida no js/script.js)
        if (window.NovaTechCart && window.NovaTechCart.addToCart) {
            window.NovaTechCart.addToCart({ id: product.id, name: product.name, price: product.price, qty });
            // feedback
            addBtn.disabled = true;
            const original = addBtn.innerText;
            addBtn.innerText = 'Adicionado ✓';
            setTimeout(() => { addBtn.disabled = false; addBtn.innerText = original; }, 1200);
        } else {
            alert('Carrinho não disponível. Verifique o script.');
        }
    });

    // produtos relacionados (mesma categoria, exceto o atual)
    relatedList.innerHTML = '';
    const related = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);
    related.forEach(r => {
        const card = document.createElement('div');
        card.className = 'related-card';

        card.innerHTML = `
        <img src="${r.img}" alt="${r.name}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:8px">
        <div style="font-weight:700;font-size:0.95rem">${r.name}</div>
        <div style="color:#9da2af;font-size:0.9rem">${formatBRL(r.price)}</div>
        <a href="detalhes.html?id=${encodeURIComponent(r.id)}" style="display:inline-block;margin-top:8px;padding:6px 8px;border-radius:6px;background:var(--accent, #00aaff);color:#071827;text-decoration:none;font-weight:700">Ver</a>
      `;
        relatedList.appendChild(card);
    });

    // atualiza contador de carrinho se existir
    const countEl = document.getElementById('cart-count');
    if (countEl && window.NovaTechCart) {
        const cart = window.NovaTechCart.getCart();
        countEl.textContent = cart.reduce((s, p) => s + Number(p.qty), 0);
    }
})();
