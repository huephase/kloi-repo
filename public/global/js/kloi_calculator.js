// 🟡🟡🟡 - [2025-10-19 00:00:00] KLOI Live Quote Calculator Module

;(function () {
  "use strict";

  // 🟡🟡🟡 - [2025-10-19 00:00:00] Utils
  function toNumber(value) {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }

  function formatCurrency(aed) {
    return `AED ${aed.toFixed(2)}`
  }

  // 🟡🟡🟡 - [2025-10-19 00:00:00] Calculator Engine
  class KloiCalculatorEngine {
    constructor(menuSections) {
      // ⚪⚪⚪ - [2025-10-19 00:00:00] Persist raw menu for reference/debug
      this.menuSections = Array.isArray(menuSections) ? menuSections : []
      // 🟡🟡🟡 - Build price maps by section and option/product keys
      this.priceIndex = this.buildPriceIndex(this.menuSections)
      // 🟡🟡🟡 - Current selections/state shape
      this.state = {
        guestCount: 0,
        radios: {}, // { groupId: optionKey }
        checkboxes: new Set(), // Set<optionKey qualified by section>
        products: {}, // { productKey: quantity }
      }
      // 🔵🔵🔵 - Modifiers pipeline (e.g., tax, discounts)
      this.modifiers = []
      console.log('🟡🟡🟡 - [KLOI CALC] Engine initialized with sections:', this.menuSections.length)
    }

    // 🟡🟡🟡 - Build a look-up of prices and bases
    buildPriceIndex(sections) {
      const index = {
        radios: {}, // { sectionId: { optionKey: { price, basis } } }
        checkboxes: {}, // { optionKey: { price, basis } }
        products: {}, // { productKey: { price, basis } }
      }

      sections.forEach((section) => {
        const id = section.id
        const type = section.htmlType || section['html-type']
        const content = section.content

        if (!content) return

        if (type === 'radio-group') {
          index.radios[id] = {}
          Object.entries(content).forEach(([optionKey, optionData]) => {
            index.radios[id][optionKey] = {
              price: toNumber(optionData.price),
              basis: optionData['price-basis'] || 'Per guest',
            }
          })
        }

        if (type === 'checkbox-group') {
          Object.entries(content).forEach(([optionKey, optionData]) => {
            index.checkboxes[optionKey] = {
              price: toNumber(optionData.price),
              basis: optionData['price-basis'] || 'Per guest',
            }
          })
        }

        if (type === 'product-group') {
          Object.entries(content).forEach(([productKey, productData]) => {
            index.products[productKey] = {
              price: toNumber(productData.price),
              basis: productData['price-basis'] || 'Per guest',
            }
          })
        }
      })

      console.log('🟡🟡🟡 - [KLOI CALC] Price index built', index)
      return index
    }

    // 🟡🟡🟡 - State setters
    setGuestCount(count) {
      this.state.guestCount = Math.max(0, toNumber(count))
    }

    setRadioSelection(groupId, optionKey) {
      this.state.radios[groupId] = optionKey
    }

    setCheckboxSelected(optionKey, selected) {
      if (selected) this.state.checkboxes.add(optionKey)
      else this.state.checkboxes.delete(optionKey)
    }

    setProductQuantity(productKey, quantity) {
      const q = Math.max(0, toNumber(quantity))
      if (q > 0) this.state.products[productKey] = q
      else delete this.state.products[productKey]
    }

    // 🔵🔵🔵 - Modifiers API
    use(modifierFn) {
      // 🟡🟡🟡 - modifierFn signature: ({ subtotal, state }) => ({ total, meta })
      this.modifiers.push(modifierFn)
    }

    // 🟡🟡🟡 - Core calculation
    calculate() {
      const guestCount = this.state.guestCount || 0
      let subtotal = 0
      const breakdown = []

      // Radios: exactly one per group contributes, basis respected
      Object.entries(this.state.radios).forEach(([groupId, optionKey]) => {
        const group = this.priceIndex.radios[groupId]
        const meta = group ? group[optionKey] : null
        if (!meta) return
        const basePrice = meta.price
        const basis = meta.basis
        const lineTotal = basis === 'Per guest' ? basePrice * guestCount : basePrice
        subtotal += lineTotal
        breakdown.push({ kind: 'radio', key: `${groupId}.${optionKey}`, basis, amount: lineTotal })
      })

      // Checkboxes: all selected add up
      this.state.checkboxes.forEach((optionKey) => {
        const meta = this.priceIndex.checkboxes[optionKey]
        if (!meta) return
        const basePrice = meta.price
        const basis = meta.basis
        const lineTotal = basis === 'Per guest' ? basePrice * guestCount : basePrice
        subtotal += lineTotal
        breakdown.push({ kind: 'checkbox', key: optionKey, basis, amount: lineTotal })
      })

      // Products with quantities
      Object.entries(this.state.products).forEach(([productKey, qty]) => {
        const meta = this.priceIndex.products[productKey]
        if (!meta) return
        const basePrice = meta.price
        const basis = meta.basis
        const unit = basis === 'Per guest' ? basePrice * guestCount : basePrice
        const lineTotal = unit * qty
        subtotal += lineTotal
        breakdown.push({ kind: 'product', key: productKey, basis, qty, amount: lineTotal })
      })

      // Apply modifiers pipeline
      let total = subtotal
      const modifiersMeta = []
      this.modifiers.forEach((fn) => {
        try {
          const res = fn({ subtotal: total, state: this.state }) || {}
          if (typeof res.total === 'number' && Number.isFinite(res.total)) {
            modifiersMeta.push({ name: fn.name || 'modifier', delta: res.total - total, meta: res.meta })
            total = res.total
          }
        } catch (err) {
          console.error('❗❗❗ - [KLOI CALC] Modifier error:', err)
        }
      })

      console.log('✅✅✅ - [KLOI CALC] Calculated', { guestCount, subtotal, total, breakdown, modifiersMeta })
      return { guestCount, subtotal, total, breakdown, modifiersMeta }
    }
  }

  // 🟡🟡🟡 - DOM Binder: wires engine to the page and renders UI
  class KloiCalculatorUI {
    constructor(engine, container) {
      this.engine = engine
      this.container = container
      this.render()
    }

    render() {
      const { subtotal, total, breakdown, modifiersMeta } = this.engine.calculate()
      const lines = breakdown
        .map((l) => `<div class="calc-line">${l.key}${l.qty ? ` × ${l.qty}` : ''}: ${formatCurrency(l.amount)}</div>`) 
        .join('')
      const mods = modifiersMeta
        .map((m) => `<div class="calc-mod">${m.name}: ${formatCurrency(m.delta)}</div>`) 
        .join('')
      const html = `
        <div class="calc-wrapper">
          <div class="calc-breakdown">${lines || '<div class="calc-line">No selections yet</div>'}</div>
          <div class="calc-subtotal">Subtotal: ${formatCurrency(subtotal)}</div>
          ${mods}
          <div class="calc-total"><strong>Total: ${formatCurrency(total)}</strong></div>
        </div>
      `
      this.container.innerHTML = html
    }
  }

  // 🟡🟡🟡 - Public API: attaches to window for page scripts to use
  window.KloiCalculator = {
    // 🟡🟡🟡 - Initialize from server-provided JSON string or object
    initFromMenuSections(menuSections, options = {}) {
      try {
        const sections = Array.isArray(menuSections)
          ? menuSections
          : JSON.parse(menuSections)
        const engine = new KloiCalculatorEngine(sections)

        // 🟡🟡🟡 - Optional: add tax modifier via options.taxPercent
        if (options.taxPercent && options.taxPercent > 0) {
          const pct = toNumber(options.taxPercent)
          engine.use(function tax({ subtotal }) {
            const taxAmount = subtotal * (pct / 100)
            return { total: subtotal + taxAmount, meta: { taxPercent: pct, taxAmount } }
          })
        }

        // 🟡🟡🟡 - Find calculator container
        const container = document.querySelector('.kloi-calculator')
        if (!container) {
          console.error('❗❗❗ - [KLOI CALC] .kloi-calculator container not found')
          return null
        }

        const ui = new KloiCalculatorUI(engine, container)

        // 🟡🟡🟡 - Return bindings for page to wire inputs
        return {
          engine,
          ui,
          recalc: () => ui.render(),
          setGuestCount: (n) => {
            engine.setGuestCount(n)
            ui.render()
          },
          setRadio: (groupId, optionKey) => {
            engine.setRadioSelection(groupId, optionKey)
            ui.render()
          },
          setCheckbox: (optionKey, selected) => {
            engine.setCheckboxSelected(optionKey, selected)
            ui.render()
          },
          setProductQty: (productKey, qty) => {
            engine.setProductQuantity(productKey, qty)
            ui.render()
          },
        }
      } catch (err) {
        console.error('❗❗❗ - [KLOI CALC] Initialization error:', err)
        return null
      }
    },
  }
})()


