const supabaseUrl = 'https://oivswyxszlbvkduuhdqd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdnN3eXhzemxidmtkdXVoZHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MjcwMTksImV4cCI6MjA4OTIwMzAxOX0.qDqMN9ZjRhDUmjJRrN8FXOrgmQR_S9TM7o3Zuw4qp98'
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey)

const products = [
  {
    id: 1,
    name: "Сливки для торта",
    category: "cream",
    price: 750,
    image: "img/Rectangle 186-2.png"
  },
  {
    id: 2,
    name: "Клубничная глазурь",
    category: "fillings",
    price: 110,
    image: "img/Rectangle 186.png"
  },
  {
    id: 3,
    name: "Начинка Ириска",
    category: "fillings",
    price: 620,
    image: "img/Rectangle 186-1.png"
  },
  {
    id: 4,
    name: "Конфитюр малина",
    category: "jams",
    price: 450,
    image: "img/Rectangle 187.png"
  },
  {
    id: 5,
    name: "Фисташковый круассан",
    category: "croissants",
    price: 499,
    image: "img/freepik__-__30101 3.png"
  },
  {
    id: 6,
    name: "Круассан с розой",
    category: "croissants",
    price: 519,
    image: "img/freepik__-__30100 3.png"
  }
]

const catalogList = document.getElementById("catalogList")
const filterButtons = document.querySelectorAll(".filter-btn")
const cartItems = document.getElementById("cartItems")
const totalPrice = document.getElementById("totalPrice")
const orderForm = document.getElementById("orderForm")
const message = document.getElementById("message")

let cart = []

function showProducts(category = "all") {
  if (!catalogList) return

  catalogList.innerHTML = ""

  let filtered = products

  if (category !== "all") {
    filtered = products.filter(product => product.category === category)
  }

  filtered.forEach(product => {
    const card = document.createElement("div")
    card.className = "item"

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${product.price} ₽</p>
      <button>В корзину</button>
    `

    const button = card.querySelector("button")
    button.addEventListener("click", function () {
      addToCart(product.id)
    })

    catalogList.appendChild(card)
  })
}

function addToCart(id) {
  const product = products.find(item => item.id === id)
  if (!product) return

  const found = cart.find(item => item.id === id)

  if (found) {
    found.count += 1
  } else {
    cart.push({
      ...product,
      count: 1
    })
  }

  updateCart()
}

function updateCart() {
  if (!cartItems || !totalPrice) return

  if (cart.length === 0) {
    cartItems.innerHTML = "Пока пусто"
    totalPrice.textContent = "0 ₽"
    return
  }

  cartItems.innerHTML = ""
  let total = 0

  cart.forEach(item => {
    total += item.price * item.count

    const row = document.createElement("div")
    row.className = "cart-row"
    row.innerHTML = `${item.name} — ${item.count} шт.`
    cartItems.appendChild(row)
  })

  totalPrice.textContent = total + " ₽"
}

function getCartTotal() {
  let total = 0

  cart.forEach(item => {
    total += item.price * item.count
  })

  return total
}

async function createOrder(orderData) {
  const { data, error } = await supabaseClient
      .from("orders")
      .insert([orderData])
      .select()

  if (error) {
    console.log("Ошибка orders:", error.message)
    console.log("Полная ошибка:", error)
    return null
  }

  console.log("Заказ создан:", data)
  return data[0]
}

async function createOrderItems(orderId) {
  const items = cart.map(item => ({
    order_id: orderId,
    product_id: item.id,
    product_name: item.name,
    price: item.price,
    quantity: item.count
  }))

  const { data, error } = await supabaseClient
      .from("order_items")
      .insert(items)
      .select()

  if (error) {
    console.log("Ошибка order_items:", error.message)
    console.log("Полная ошибка:", error)
    return false
  }

  console.log("Позиции созданы:", data)
  return true
}

filterButtons.forEach(button => {
  button.addEventListener("click", function () {
    filterButtons.forEach(btn => btn.classList.remove("active"))
    this.classList.add("active")
    showProducts(this.dataset.filter)
  })
})

if (orderForm) {
  orderForm.addEventListener("submit", async function (e) {
    e.preventDefault()

    if (cart.length === 0) {
      message.textContent = "Сначала добавьте товар в корзину."
      return
    }

    const formData = new FormData(orderForm)

    const orderData = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      address: formData.get("address"),
      comment: formData.get("comment"),
      total_price: getCartTotal(),
      delivery_price: 350
    }

    message.textContent = "Отправка заказа..."

    const createdOrder = await createOrder(orderData)

    if (!createdOrder) {
      message.textContent = "Ошибка при создании заказа."
      return
    }

    const itemsCreated = await createOrderItems(createdOrder.id)

    if (!itemsCreated) {
      message.textContent = "Заказ создался, но позиции не записались."
      return
    }

    message.textContent = "Заказ успешно отправлен в Supabase."
    orderForm.reset()
    cart = []
    updateCart()
  })
}

// работа ливитации и тд для карт
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.pop-item');
  const box = document.querySelector('.popular-box');

  function updateBoxHeight() {
  let maxBottom = 0;

  items.forEach(item => {
    const rect = item.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    const bottom = rect.top - boxRect.top + rect.height;

    if (bottom > maxBottom) {
      maxBottom = bottom;
    }
  });

  box.style.height = maxBottom + 50 + 'px';
}

  if (!items.length || !box) return;

  const positions = [];

  function isFarEnough(x, y) {
    return positions.every(pos => {
      const dx = pos.x - x;
      const dy = pos.y - y;
      return Math.sqrt(dx * dx + dy * dy) > 140;
    });
  }

  items.forEach(item => {
  
    const padding = 220;

    const maxX = box.clientWidth - padding;
    const maxY = box.clientHeight - padding;

    let x, y;
    let tries = 0;

    do {
      x = Math.random() * maxX;
      y = Math.random() * maxY;
      tries++;
    } while (!isFarEnough(x, y) && tries < 10);

    positions.push({ x, y });

    item.style.left = x + 'px';
    item.style.top = y + 'px';


    const duration = 3 + Math.random() * 3;
    const delay = Math.random() * 2;
    const amplitude = 10 + Math.random() * 15;

    const animName = `float-${Math.random().toString(36).substr(2, 5)}`;

    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes ${animName} {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-${amplitude}px); }
        100% { transform: translateY(0px); }
      }
    `;
    document.head.appendChild(style);

    item.style.animation = `${animName} ${duration}s ease-in-out ${delay}s infinite`;

  
    item.addEventListener('mouseenter', () => {
      item.classList.add('active');
      box.classList.add('blur-active');
    });

    item.addEventListener('mouseleave', () => {
      item.classList.remove('active');
      box.classList.remove('blur-active');
    });
  });
});

showProducts()
updateCart()
updateBoxHeight()

