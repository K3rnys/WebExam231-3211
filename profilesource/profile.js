document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders';
    const API_KEY = '1233643e-a41e-47eb-ac2e-00774f721d9e';
    const ordersList = document.getElementById('ordersList');
    const notifications = document.getElementById('notifications');

    const modal = document.getElementById('modal');
    const confirmDeleteButton = document.getElementById('confirmDelete');
    const cancelDeleteButton = document.getElementById('cancelDelete');
    const orderModal = document.getElementById('orderModal');
    const closeOrderModalButton = document.getElementById('closeOrderModal');

    const editOrderModal = document.getElementById('editOrderModal');
    const editOrderForm = document.getElementById('editOrderForm');
    const cancelEditButton = document.getElementById('cancelEdit');


    const orderDetails = document.getElementById('orderDetails');
    let orderIdToDelete = null;

    // Функция для получения списка заказов с сервера
    async function loadOrders() {
        try {
            // Получение созданных заказов с сервера
            const response = await fetch(`${API_URL}?api_key=${API_KEY}`);
            if (!response.ok) {
                throw new Error('Ошибка при загрузке заказов');
            }
            const orders = await response.json();
            if (orders.length === 0) {
                showNotification('Нет заказов', 'info');
                return;
            }
            ordersList.innerHTML = '';
            // Отображение заказов на странице 
            orders.forEach((order, index) => {
                const totalPriceFromComment = extractTotalPriceFromComment(order.comment);
                const orderRow = document.createElement('tr');
                orderRow.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${order.created_at}</td>
                    <td>${order.good_ids.join(', ')}</td>
                    <td>₽${totalPriceFromComment || order.total_price}</td>
                    <td>${order.delivery_date} ${order.delivery_interval}</td>
                    <td>
                        <img class="viewOrder" data-id="${order.id}" src="./profilesource/eye.png" alt="Просмотр" title="Просмотр">
                        <img class="editOrder" data-id="${order.id}" src="./profilesource/pen.png" alt="Редактировать" title="Редактировать">
                        <img class="deleteOrder" data-id="${order.id}" src="./profilesource/trash.png" alt="Удалить" title="Удалить">
                    </td>
                `;
                // Добавление кнопок
                ordersList.appendChild(orderRow);
                orderRow.querySelector('.viewOrder').addEventListener('click', () => viewOrder(order.id));
                orderRow.querySelector('.editOrder').addEventListener('click', () => editOrder(order.id));
                orderRow.querySelector('.deleteOrder').addEventListener('click', () => showDeleteModal(order.id));
            });
        } catch (error) {
            console.error('Ошибка при загрузке заказов:', error);
            showNotification('Ошибка при загрузке заказов. Попробуйте позже.', 'error');
        }
    }

    // Функция для открытия модального окна редактирования заказа
    async function editOrder(orderId) {
        try {
            // Получение информации о конкретном товаре
            const response = await fetch(`${API_URL}/${orderId}?api_key=${API_KEY}`);
            if (!response.ok) {
                throw new Error('Ошибка при загрузке данных заказа');
            }
            // Данные заказа
            const order = await response.json();
    
            // Извлекаем итоговую стоимость из комментария
            const totalPriceFromComment = extractTotalPriceFromComment(order.comment);
            const cleanComment = order.comment.replace(/₽\d+(\.\d{1,2})?/, '').trim(); 
    
            document.getElementById('editOrderDate').value = order.created_at;
            document.getElementById('editName').value = order.full_name;
            document.getElementById('editPhone').value = order.phone;
            document.getElementById('editEmail').value = order.email;
            document.getElementById('editAddress').value = order.delivery_address;
            document.getElementById('editDeliveryDate').value = order.delivery_date;
            document.getElementById('editTimeSlot').value = order.delivery_interval;
            document.getElementById('editOrderItems').value = order.good_ids.join(', ');
            document.getElementById('editTotalPrice').value = totalPriceFromComment || order.total_price; 
            document.getElementById('editComment').value = cleanComment; 
    
            editOrderForm.dataset.orderId = orderId;
            editOrderModal.classList.remove('hidden');
        } catch (error) {
            console.error('Ошибка при редактировании заказа:', error);
            showNotification('Ошибка при редактировании заказа. Попробуйте позже.', 'error');
        }
    }

    // Костыль для извлечения итоговой стоимости из комментария
    function extractTotalPriceFromComment(comment) {
        if (comment) {
            const priceMatch = comment.match(/₽(\d+)/); 
            if (priceMatch) {
                return priceMatch[1];
            }
        }
        return null;
    }

    // Обработчик кнопки "Отмена"
    cancelEditButton.addEventListener('click', () => {
        editOrderModal.classList.add('hidden');
    });

    // Обработчик сохранения изменений
    editOrderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
    
        const orderId = editOrderForm.dataset.orderId;
    
        const updatedData = {};
        const fields = [
            { id: 'editName', key: 'full_name' },
            { id: 'editPhone', key: 'phone' },
            { id: 'editEmail', key: 'email' },
            { id: 'editAddress', key: 'delivery_address' },
            { id: 'editDeliveryDate', key: 'delivery_date' },
            { id: 'editTimeSlot', key: 'delivery_interval' },
            { id: 'editComment', key: 'comment' },
        ];
    
        // Подготовка информации о товаре для отправки на сервер
        fields.forEach(({ id, key }) => {
            const fieldValue = document.getElementById(id).value.trim();
            if (fieldValue) {
                updatedData[key] = fieldValue; 
            }
        });
        
        // Возвращение тотал прайса в комментарий для корректной обработки
        const totalPrice = document.getElementById('editTotalPrice').value.trim();
        if (totalPrice) {
            updatedData.total_price = totalPrice;
            updatedData.comment = `${updatedData.comment || ''} ₽${totalPrice}`; // Вставляем стоимость обратно в комментарий
        }
        
        try {
            // Попытка запроса редактирования заказа
            const response = await fetch(`${API_URL}/${orderId}?api_key=${API_KEY}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });
    
            if (response.ok) {
                showNotification('Заказ успешно обновлён', 'success');
                editOrderModal.classList.add('hidden');
                loadOrders(); 
            } else {
                showNotification('Ошибка при обновлении заказа', 'error');
            }
        } catch (error) {
            console.error('Ошибка сети при обновлении заказа:', error);
            showNotification('Ошибка сети. Попробуйте позже.', 'error');
        }
    });


    // Получение данных конкретного заказа и отображение в модальном окне
    async function viewOrder(orderId) {
        try {
            // Получение данных о заказе с сервера
            const response = await fetch(`${API_URL}/${orderId}?api_key=${API_KEY}`);
            if (!response.ok) {
                throw new Error('Ошибка при загрузке данных заказа');
            }
            const order = await response.json();
            const totalPriceFromComment = extractTotalPriceFromComment(order.comment);

            const cleanComment = order.comment.replace(/₽\d+(\.\d{1,2})?/, '').trim();

            // Отображение в модальном окне
            orderDetails.innerHTML = `
                <p><strong>Дата оформления:</strong> ${order.created_at}</p>
                <p><strong>Имя:</strong> ${order.full_name}</p>
                <p><strong>Номер телефона:</strong> ${order.phone}</p>
                <p><strong>Email:</strong> ${order.email}</p>
                <p><strong>Адрес доставки:</strong> ${order.delivery_address}</p>
                <p><strong>Дата доставки:</strong> ${order.delivery_date}</p>
                <p><strong>Время доставки:</strong> ${order.delivery_interval}</p>
                <p><strong>Состав заказа:</strong> ${order.good_ids.join(', ')}</p>
                <p><strong>Итоговая стоимость:</strong> ₽${totalPriceFromComment || order.total_price}</p>
                <p><strong>Комментарий:</strong> ${cleanComment || 'Нет комментариев'}</p>
            `;

            orderModal.classList.remove('hidden');
        } catch (error) {
            console.error('Ошибка при загрузке данных заказа:', error);
            showNotification('Ошибка при загрузке данных заказа. Попробуйте позже.', 'error');
        }
    }

    // Функция для отображения уведомлений
    function showNotification(message, type = 'info', duration = 2000) {
        notifications.textContent = message;
        notifications.className = `notifications ${type}`;
        setTimeout(() => {
            notifications.className = 'notifications hidden';
        }, duration);
    }

    // Модальное окно удаления
    function showDeleteModal(orderId) {
        orderIdToDelete = orderId;
        modal.classList.remove('hidden');
    }

    // Подтверждения удаления
    confirmDeleteButton.addEventListener('click', async () => {
        if (!orderIdToDelete) return;
        try {
            // Отправка на сервер DELETE запроса
            const response = await fetch(`${API_URL}/${orderIdToDelete}?api_key=${API_KEY}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Ошибка при удалении заказа');
            }
            showNotification('Заказ успешно удалён', 'success');
            loadOrders();
        } catch (error) {
            console.error('Ошибка при удалении заказа:', error);
            showNotification('Ошибка при удалении заказа. Попробуйте позже.', 'error');
        } finally {
            modal.classList.add('hidden');
        }
    });

    // Обработчик закрытия модального окна просмотра
    closeOrderModalButton.addEventListener('click', () => {
        orderModal.classList.add('hidden');
    });

    // Обработчик отмены удаления
    cancelDeleteButton.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    loadOrders();
});
