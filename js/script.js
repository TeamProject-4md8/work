import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"

const supabaseUrl = 'https://pwykgseanhuvaaxhmsaz.supabase.co'
const supabaseKey = 'sb_publishable_XydslCojK5a8utYzRFj2ag_1i9WIoSM'
const supabaseClient = createClient(supabaseUrl, supabaseKey)

var products = []
var categories = []

const catalogList = document.getElementById("catalogList")
const filterButtons = [...document.querySelectorAll(".filter-btn")]
const cartItems = document.getElementById("cartItems")
const filters = document.getElementById("filters")
const totalPrice = document.getElementById("totalPrice")
const orderForm = document.getElementById("orderForm")
const message = document.getElementById("message")

let cart = []

document.addEventListener('DOMContentLoaded', function() {
  const burger = document.getElementById('burgerMenu');
  const menu = document.getElementById('menu');
  const body = document.body;

  if (burger && menu) {
    burger.addEventListener('click', function() {
      burger.classList.toggle('active');
      menu.classList.toggle('open');
      body.classList.toggle('menu-open');
    });

    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        menu.classList.remove('open');
        body.classList.remove('menu-open');
      });
    });

    body.addEventListener('click', function(e) {
      if (body.classList.contains('menu-open') && !menu.contains(e.target) && !burger.contains(e.target)) {
        burger.classList.remove('active');
        menu.classList.remove('open');
        body.classList.remove('menu-open');
      }
    });
  }
});

function showProducts(category = "all") {
  if (!catalogList) return
  catalogList.innerHTML = ""

  let filtered = category === "all"
    ? products
    : products.filter(p => p.id_type_product.toString() === category)

  filtered.forEach(product => {
    const card = document.createElement("div")
    card.className = "item"

    card.innerHTML = `
      <img src="${product.product_image}">
      <h3>${product.product_name}</h3>
      <p>${product.product_price} ₽</p>
      <button>В корзину</button>
    `

    card.querySelector("button").onclick = () => addToCart(product.id_product)
    catalogList.appendChild(card)
  })
}

function setupFilters(){
  filterButtons.forEach(btn => {
    btn.onclick = () => {
      filterButtons.forEach(b => b.classList.remove("active"))
      btn.classList.add("active")
      showProducts(btn.dataset.filter)
    }
  })
}

function showCategories() {
  categories.forEach(category => {
    const card = document.createElement("button")
    card.className = "filter-btn"
    card.dataset.filter = category.id_type_product
    card.innerHTML = category.product_type_name
    filterButtons.push(card)
    filters.appendChild(card)
  })
  setupFilters()
}

function addToCart(id) {
  const product = products.find(p => p.id_product === id)
  const found = cart.find(p => p.id_product === id)

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
    total += item.product_price * item.count

    const row = document.createElement("div")
    row.className = "cart-row"
    row.innerText = `${item.product_name} — ${item.count} шт.`
    cartItems.appendChild(row)
  })

  totalPrice.textContent = total + " ₽"
}

function getCartItemCount(id) {
  const item = cart.find(p => p.id_product === id)
  return item ? item.count : 0
}

function setCartItemCount(id, count) {
  const product = products.find(p => p.id_product === id)
  const found = cart.find(p => p.id_product === id)

  if (count <= 0) {
    cart = cart.filter(p => p.id_product !== id)
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

if (orderForm) {
  orderForm.onsubmit = async (e) => {
    e.preventDefault()

    if (!cart.length) {
      message.textContent = "Добавьте товар"
      return
    }

    const formData = new FormData(orderForm)
    const rawPhone = formData.get("phone");
    const phoneNumber = rawPhone.replace(/\D/g, "");

    const phoneRegex = /^\d+$/;

    if (!phoneRegex.test(phoneNumber)) {
      message.textContent = "Неправильный номер";
      return;
    }

    const order = {
      customer_name: formData.get("name"),
      customer_phone_number: phoneNumber,
      customer_email: formData.get("email"),
      order_address: formData.get("address"),
      order_comment: formData.get("comment"),
      price_order: cart.reduce((s, i) => s + i.product_price * i.count, 0),
      price_delivery: 350
    }

    const { data, error } = await supabaseClient.from("Order").insert([order]).select()
    if (error) return

    await supabaseClient.from("order_items").insert(
      cart.map(i => ({
        order_id: data[0].id_order,
        product_id: i.id_product,
        product_name: i.product_name,
        price: i.product_price,
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

async function fetchCategories() {
  const { data, error } = await supabaseClient
    .from('product_type')
    .select('*')

  if (error) {
    console.error('Error:', error)
    return
  }

  data.forEach(p => categories.push(p))
  
  showCategories()
  showProducts()
  updateCart()
  syncPopularCounts()
}

async function fetchData() {
  const { data, error } = await supabaseClient
    .from('Product')
    .select('*')

  if (error) {
    console.error('Error:', error)
    return
  }

  data.forEach(p => products.push(p))
  fetchCategories()
}

fetchData()
