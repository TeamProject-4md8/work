const supabaseUrl = 'https://oivswyxszlbvkduuhdqd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdnN3eXhzemxidmtkdXVoZHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MjcwMTksImV4cCI6MjA4OTIwMzAxOX0.qDqMN9ZjRhDUmjJRrN8FXOrgmQR_S9TM7o3Zuw4qp98'
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey)

// ===== ПРОДУКТЫ =====
const products = [
  { id: 1, name: "Сливки для торта", category: "cream", price: 750, image: "img/Rectangle 186-2.png" },
  { id: 2, name: "Клубничная глазурь", category: "fillings", price: 110, image: "img/Rectangle 186.png" },
  { id: 3, name: "Начинка Ириска", category: "fillings", price: 620, image: "img/Rectangle 186-1.png" },
  { id: 4, name: "Конфитюр малина", category: "jams", price: 450, image: "img/Rectangle 187.png" },
  { id: 5, name: "Фисташковый круассан", category: "croissants", price: 499, image: "img/freepik__-__30101 3.png" },
  { id: 6, name: "Круассан с розой", category: "croissants", price: 519, image: "img/freepik__-__30100 3.png" }
]

// ===== DOM =====
const catalogList = document.getElementById("catalogList")
const filterButtons = document.querySelectorAll(".filter-btn")
const cartItems = document.getElementById("cartItems")
const totalPrice = document.getElementById("totalPrice")
const orderForm = document.getElementById("orderForm")
const message = document.getElementById("message")

let cart = []

// ===== КАТАЛОГ =====
function showProducts(category = "all") {
  if (!catalogList) return
  catalogList.innerHTML = ""

  let filtered = category === "all"
    ? products
    : products.filter(p => p.category === category)

  filtered.forEach(product => {
    const card = document.createElement("div")
    card.className = "item"

    card.innerHTML = `
      <img src="${product.image}">
      <h3>${product.name}</h3>
      <p>${product.price} ₽</p>
      <button>В корзину</button>
    `

    card.querySelector("button").onclick = () => addToCart(product.id)
    catalogList.appendChild(card)
  })
}

// ===== КОРЗИНА =====
function addToCart(id) {
  const product = products.find(p => p.id === id)
  const found = cart.find(p => p.id === id)

  if (found) {
    found.count++
  } else {
    cart.push({ ...product, count: 1 })
  }

  updateCart()
  syncPopularCounts()
}

function updateCart() {
  if (!cartItems) return

  if (!cart.length) {
    cartItems.innerHTML = "Пока пусто"
    totalPrice.textContent = "0 ₽"
    return
  }

  let total = 0
  cartItems.innerHTML = ""

  cart.forEach(item => {
    total += item.price * item.count

    const row = document.createElement("div")
    row.className = "cart-row"
    row.innerText = `${item.name} — ${item.count} шт.`
    cartItems.appendChild(row)
  })

  totalPrice.textContent = total + " ₽"
}

function getCartItemCount(id) {
  const item = cart.find(p => p.id === id)
  return item ? item.count : 0
}

function setCartItemCount(id, count) {
  const product = products.find(p => p.id === id)
  const found = cart.find(p => p.id === id)

  if (count <= 0) {
    cart = cart.filter(p => p.id !== id)
  } else if (found) {
    found.count = count
  } else {
    cart.push({ ...product, count })
  }

  updateCart()
  syncPopularCounts()
}

function syncPopularCounts() {
  document.querySelectorAll(".pop-item").forEach(item => {
    const id = +item.dataset.id
    const el = item.querySelector(".pop-count")
    if (el) el.textContent = getCartItemCount(id)
  })
}

// ===== ФИЛЬТРЫ =====
filterButtons.forEach(btn => {
  btn.onclick = () => {
    filterButtons.forEach(b => b.classList.remove("active"))
    btn.classList.add("active")
    showProducts(btn.dataset.filter)
  }
})

// ===== ОТПРАВКА =====
if (orderForm) {
  orderForm.onsubmit = async (e) => {
    e.preventDefault()

    if (!cart.length) {
      message.textContent = "Добавьте товар"
      return
    }

    const formData = new FormData(orderForm)

    const order = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      address: formData.get("address"),
      comment: formData.get("comment"),
      total_price: cart.reduce((s, i) => s + i.price * i.count, 0),
      delivery_price: 350
    }

    const { data, error } = await supabaseClient.from("orders").insert([order]).select()
    if (error) return

    await supabaseClient.from("order_items").insert(
      cart.map(i => ({
        order_id: data[0].id,
        product_id: i.id,
        product_name: i.name,
        price: i.price,
        quantity: i.count
      }))
    )

    message.textContent = "Заказ отправлен"
    cart = []
    updateCart()
    syncPopularCounts()
    orderForm.reset()
  }
}

// ===== POPULAR БЛОК =====
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".pop-item")
  const box = document.querySelector(".popular-box")

  const positions = [
    { x: 10, y: 65 },
    { x: 75, y: 70 },
    { x: 20, y: 30 },
    { x: 60, y: 50 },
    { x: 55, y: 10 },
    { x: 80, y: 15 },
    { x: 60, y: 85 }
  ]

  items.forEach((item, i) => {
    const pos = positions[i] || { x: 50, y: 50 }

    item.style.left = pos.x + "%"
    item.style.top = pos.y + "%"

    let t = Math.random() * 100

    function float() {
      t += 0.02
      const x = Math.sin(t + i) * 5
      const y = Math.cos(t + i) * 5

      if (!item.classList.contains("active")) {
        item.style.transform = `translate(${x}px, ${y}px)`
      }

      requestAnimationFrame(float)
    }

    float()

    item.onmouseenter = () => {
      items.forEach(i => i.classList.remove("active"))
      item.classList.add("active")
      box.classList.add("blur-active")

      const id = +item.dataset.id
      item.querySelector(".pop-count").textContent = getCartItemCount(id)
    }

    item.onmouseleave = () => {
      item.classList.remove("active")
      box.classList.remove("blur-active")
    }
  })

  box.onclick = (e) => {
    const plus = e.target.closest(".pop-plus")
    const minus = e.target.closest(".pop-minus")
    if (!plus && !minus) return

    const item = e.target.closest(".pop-item")
    const id = +item.dataset.id
    const current = getCartItemCount(id)

    if (plus) setCartItemCount(id, current + 1)
    if (minus) setCartItemCount(id, current - 1)

    item.querySelector(".pop-count").textContent = getCartItemCount(id)
  }

  syncPopularCounts()
})

// ===== INIT =====
showProducts()
updateCart()
syncPopularCounts()