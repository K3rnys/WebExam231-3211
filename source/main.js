document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods';
    const API_KEY = '1233643e-a41e-47eb-ac2e-00774f721d9e';

    let currentPage = 1;
    let totalPages = 1;
    let sortOrder = 'rating_asc'; 

    const sortSelect = document.getElementById('sort');

    async function loadProducts(page = 1) {
        try {
            // Формируем URL с учётом страницы сортировки 
            const url = `${API_URL}?page=${page}&per_page=10&sort_order=${sortOrder}&api_key=${API_KEY}`;
            console.log(`Запрос на страницу: ${page} Сортировка: ${sortOrder}`); // Логирование запроса
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при запросе данных');
            }

            // Все товары с сервера
            const data = await response.json();

            currentPage = data._pagination.current_page;
            totalPages = Math.ceil(data._pagination.total_count / data._pagination.per_page);

            const productsContainer = document.getElementById('productGrid');
            productsContainer.innerHTML = '';

            // Товары из корзины (LocalStorage)
            const cart = JSON.parse(localStorage.getItem('cart')) || [];

            // Генерация карточек товаров
            data.goods.forEach(product => {
                const productCard = document.createElement('div');
                productCard.classList.add('productCard');

                const isInCart = cart.includes(String(product.id)); // Проверяем, в корзине ли товар

                productCard.innerHTML = `
                    <img src="${product.image_url}" alt="${product.name}">
                    <h3 title="${product.name}">${product.name}</h3>
                    <p class="rating">Рейтинг: ${product.rating}</p>
                    <p class="price">Цена:
                        ${product.discount_price ? 
                            `<span class="actualPrice">₽${product.actual_price}</span>` : ''}
                        <span class="discountPrice">₽${product.discount_price || product.actual_price}</span>
                    </p>
                    <button class="add-to-cart" data-id="${product.id}">
                        ${isInCart ? 'Добавлено' : 'В корзину'}
                    </button>
                `;

                if (isInCart) {
                    productCard.querySelector('button').classList.add('added');
                }

                productsContainer.appendChild(productCard);
            });

            updatePagination();
        } catch (error) {
            console.error('Ошибка при загрузке товаров:', error);
        }
    }

    // Регистрация клика на кнопке "В корзину"
    document.getElementById('productGrid').addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart')) {
            const productId = event.target.dataset.id;
            addToCart(productId, event.target);
        }
    });

    // Добавление товара в корзину
    function addToCart(productId, button) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (!cart.includes(productId)) {
            cart.push(productId);
            localStorage.setItem('cart', JSON.stringify(cart));
            button.textContent = 'Добавлено'; 
            button.classList.add('added'); 
        }
    }

    // Обновление текущей страницы 
    function updatePagination() {
        const paginationContainer = document.getElementById('pagination');
        paginationContainer.innerHTML = '';

        for (let page = 1; page <= totalPages; page++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = page;
            pageButton.classList.add('pageButton');

            if (page === currentPage) {
                pageButton.classList.add('active');
            }

            pageButton.addEventListener('click', () => {
                // Загружаем товары с определенной страницы
                loadProducts(page);
            });

            paginationContainer.appendChild(pageButton);
        }
    }

    // Изменение алгоритма сортировки
    sortSelect.addEventListener('change', (event) => {
        sortOrder = event.target.value || 'rating_asc'; 
        loadProducts(1); 
    });

    loadProducts(currentPage);
});
