document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods';
    const ORDER_API_URL = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders'; 
    const API_KEY = '1233643e-a41e-47eb-ac2e-00774f721d9e';

    const cartItemsContainer = document.getElementById('productGrid');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const totalPriceElement = document.getElementById('totalPrice');
    const deliveryDateInput = document.getElementById('deliveryDate');
    const timeSlotInput = document.getElementById('timeSlot');

    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    const commentInput = document.getElementById('comment');
    const newsletterInput = document.getElementById('newsletter');

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let data = [];
    let totalProductPrice = 0;

    // Функция для отображения товаров в корзине
    async function loadCartItems() {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '';
            emptyCartMessage.style.display = 'block';
            totalPriceElement.textContent = 'Итоговая стоимость: ₽0';
            return;
        }

        emptyCartMessage.style.display = 'none';

        try {
            const url = `${API_URL}?&api_key=${API_KEY}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('Ошибка загрузки товаров. Статус:', response.status);
                throw new Error('Ошибка при загрузке данных товаров');
            }

            data = await response.json();

            const filteredProducts = data.filter(product => cart.includes(String(product.id)));

            if (filteredProducts.length === 0) {
                cartItemsContainer.innerHTML = '';
                emptyCartMessage.style.display = 'block';
                return;
            }

            cartItemsContainer.innerHTML = '';
            totalProductPrice = 0;

            filteredProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.classList.add('productCard');

                const productPrice = product.discount_price || product.actual_price;
                totalProductPrice += productPrice;

                productCard.innerHTML = `
                    <img src="${product.image_url}" alt="${product.name}">
                    <h3 title="${product.name}">${product.name}</h3>
                    <p class="rating">Рейтинг: ${product.rating}</p>
                    <p class="price">Цена:
                        ${product.discount_price ? 
                            `<span class="actualPrice">₽${product.actual_price}</span>` : ''} 
                        <span class="discountPrice">₽${productPrice}</span>
                    </p>
                    <button class="removeFromCart" data-id="${product.id}">Удалить</button>
                `;

                cartItemsContainer.appendChild(productCard);
            });

            document.querySelectorAll('.removeFromCart').forEach(button => {
                button.addEventListener('click', (event) => {
                    const productId = event.target.dataset.id;
                    removeFromCart(productId);
                });
            });

            updateTotalPrice();

        } catch (error) {
            console.error('Ошибка при загрузке товаров в корзину:', error);
            showNotification('Ошибка при загрузке товаров в корзину, попробуйте снова', 'error');
        }
    }

    function removeFromCart(productId) {
        cart = cart.filter(id => id !== productId);
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCartItems();
    }

    function updateTotalPrice() {
        let deliveryCost = calculateDeliveryCost();
        let totalPrice = totalProductPrice + deliveryCost;
        totalPriceElement.textContent = `Итоговая стоимость: ₽${totalPrice}`;
    }

    function calculateDeliveryCost() {
        const deliveryDate = deliveryDateInput.value; 
        const timeSlot = timeSlotInput.value;

        let deliveryCost = 200;

        const day = new Date(deliveryDate).getDay();  

        if (day === 0 || day === 6) { 
            deliveryCost += 300;
        } else if (timeSlot && timeSlot.startsWith('18')) { 
            deliveryCost += 200;
        }

        return deliveryCost;
    }

    deliveryDateInput.addEventListener('change', () => {
        updateTotalPrice();
    });

    timeSlotInput.addEventListener('change', () => {
        updateTotalPrice();
    });

    const resetButton = document.querySelector('button[type="reset"]');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            localStorage.removeItem('cart');
            cart = [];
            loadCartItems();
        });
    }

    // Функция для отображения уведомлений
    function showNotification(message, type = 'info', duration = 2000) {
        const notification = document.getElementById('notifications');
        const notificationMessage = document.getElementById('notificationMessage');
    
        notificationMessage.textContent = message;
        notification.classList.remove('hidden'); 
        notification.classList.add(type); 
    
        setTimeout(() => {
            notification.classList.add('hidden');
            notification.classList.remove(type);
        }, duration);
    }

    // Обработчик отправки формы заказа
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.addEventListener('click', async (event) => {
            event.preventDefault(); 

            let deliveryCost = calculateDeliveryCost();
            let totalPrice = totalProductPrice + deliveryCost;

            const orderData = {
                // Костыль для передачи итоговой стоимости, чтобы не считать ее снова..
                comment: commentInput.value + `₽${totalPrice.toFixed(2)}`,
                delivery_address: addressInput.value,
                delivery_date: deliveryDateInput.value.split('-').reverse().join('.'),
                delivery_interval: timeSlotInput.value,
                email: emailInput.value,
                full_name: nameInput.value,
                good_ids: cart.map(id => parseInt(id, 10)),
                phone: phoneInput.value,
                subscribe: newsletterInput.checked ? 1 : 0
            };

            try {
                const url = `${ORDER_API_URL}?&api_key=${API_KEY}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderData)
                });

                if (!response.ok) {
                    showNotification('Ошибка при оформлении заказа. Попробуйте снова.', 'error');
                    return;
                }

                showNotification('Ваш заказ успешно оформлен!', 'success');

                localStorage.removeItem('cart');
                cart = [];
                loadCartItems();

                setTimeout(() => {
                    window.location.href = 'index.html'; 
                }, 2000); 
            } catch (error) {
                console.error('Произошла ошибка при отправке запроса:', error);
                showNotification('Произошла ошибка при отправке запроса. Попробуйте снова.', 'error');
            }
        });
    }

    loadCartItems();
});       
