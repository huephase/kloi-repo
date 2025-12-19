// 🟡🟡🟡 - KLOI Live Quote Calculator Module

;(function () {
  "use strict";

  // 🟡🟡🟡 - Utils
  function toNumber(value) {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }

  // 🟡🟡🟡 - Format currency with thousand separators for better readability
  function formatCurrency(aed) {
    // 🟡🟡🟡 - Use toLocaleString to add thousand separators (commas) and ensure 2 decimal places
    return `AED ${aed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // 🟡🟡🟡 - Calculator Engine
  class KloiCalculatorEngine {
    constructor(menuSections, options = {}) {
      // ⚪⚪⚪ - Persist raw menu for reference/debug
      this.menuSections = Array.isArray(menuSections) ? menuSections : []
      // 🟡🟡🟡 - Build price maps by section and option/product keys
      this.priceIndex = this.buildPriceIndex(this.menuSections)
      // 🟡🟡🟡 - [NUMBER OF DAYS] Store number of days from options (default to 1 if not provided)
      this.numberOfDays = options.numberOfDays && options.numberOfDays > 0 ? Math.floor(options.numberOfDays) : 1
      // 🟡🟡🟡 - [TAXES FEES] Store taxes and fees array from options
      this.taxesFees = Array.isArray(options.taxesFees) ? options.taxesFees : []
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
      console.log('🟡🟡🟡 - [KLOI CALC] Number of days for minimum orders:', this.numberOfDays)
      console.log('🟡🟡🟡 - [KLOI CALC] Taxes/fees loaded:', this.taxesFees.length)
    }

    // 🟡🟡🟡 - Build a look-up of prices and bases
    buildPriceIndex(sections) {
      const index = {
        radios: {}, // { sectionId: { optionKey: { price, basis } } }
        checkboxes: {}, // { optionKey: { price, basis } }
        products: {}, // { productKey: { price, basis } }
        minimumOrders: {}, // { orderKey: { price, basis, label } }
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

        // 🟡🟡🟡 - [ADDON ITEMS] Extract addon items from sections with addon-items property (e.g., "Add Ons" section)
        // 2025-11-28T00:00:00Z 🟡🟡🟡 - [ADDON ITEMS] Process addon-items nested in sections (not in content property)
        const addonItems = section['addon-items']
        if (addonItems && typeof addonItems === 'object') {
          Object.entries(addonItems).forEach(([productKey, productData]) => {
            index.products[productKey] = {
              price: toNumber(productData.price),
              basis: productData['price-basis'] || 'Per guest',
            }
          })
          console.log('🟡🟡🟡 - [KLOI CALC] Processed addon items from section:', id, Object.keys(addonItems))
        }

        // 🟡🟡🟡 - [MINIMUM ORDERS] Extract minimum order data from div-group sections
        if (type === 'div-group') {
          Object.entries(content).forEach(([orderKey, orderData]) => {
            const price = toNumber(orderData.price)
            // 🟡🟡🟡 - Only include if price > 0 (ignore zero prices)
            if (price > 0) {
              index.minimumOrders[orderKey] = {
                price: price,
                basis: orderData['price-basis'] || 'Per event',
                label: orderData.label || orderKey,
              }
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

    // 🟡🟡🟡 - [TAXES FEES] Apply taxes and fees to order total
    applyTaxesFees(baseAmount) {
      if (!this.taxesFees || this.taxesFees.length === 0) {
        return { total: baseAmount, breakdown: [] }
      }

      let currentTotal = baseAmount
      const breakdown = []

      // Apply taxes/fees in order (already sorted by service: TAX first, then FEE)
      this.taxesFees.forEach((taxFee) => {
        // Only apply if applies_to is ORDER_TOTAL (for now)
        if (taxFee.applies_to !== 'ORDER_TOTAL') {
          return
        }

        let amount = 0
        if (taxFee.calculation_type === 'PERCENTAGE') {
          // Apply percentage to current total (compound)
          amount = currentTotal * (taxFee.rate_value / 100)
        } else if (taxFee.calculation_type === 'FIXED') {
          // Add fixed amount
          amount = taxFee.rate_value
        }

        if (amount > 0) {
          currentTotal += amount
          breakdown.push({
            name: taxFee.name,
            type: taxFee.type,
            category: taxFee.category,
            code: taxFee.code,
            calculation_type: taxFee.calculation_type,
            rate_value: taxFee.rate_value,
            amount: amount
          })
        }
      })

      return { total: currentTotal, breakdown }
    }

    // 🟡🟡🟡 - Core calculation
    calculate() {
      const guestCount = this.state.guestCount || 0
      // 🟡🟡🟡 - [NUMBER OF DAYS] Get number of days for multiplying all line items
      // ⚠️⚠️⚠️ - [MULTI-DAY EVENTS] All line items must be multiplied by numberOfDays for multi-day events
      const numberOfDays = this.numberOfDays
      let subtotal = 0
      const breakdown = []

      // Radios: exactly one per group contributes, basis respected
      // 🟡🟡🟡 - [MULTI-DAY EVENTS] Multiply by numberOfDays for multi-day events
      Object.entries(this.state.radios).forEach(([groupId, optionKey]) => {
        const group = this.priceIndex.radios[groupId]
        const meta = group ? group[optionKey] : null
        if (!meta) return
        const basePrice = meta.price
        const basis = meta.basis
        // 🟡🟡🟡 - [LINE ITEM CALCULATION] Calculate base line total (per guest or fixed)
        let lineTotal = basis === 'Per guest' ? basePrice * guestCount : basePrice
        // 🟡🟡🟡 - [MULTI-DAY MULTIPLICATION] Multiply by numberOfDays for multi-day events
        lineTotal = lineTotal * numberOfDays
        subtotal += lineTotal
        breakdown.push({ kind: 'radio', key: `${groupId}.${optionKey}`, basis, amount: lineTotal })
      })

      // Checkboxes: all selected add up
      // 🟡🟡🟡 - [MULTI-DAY EVENTS] Multiply by numberOfDays for multi-day events
      this.state.checkboxes.forEach((optionKey) => {
        const meta = this.priceIndex.checkboxes[optionKey]
        if (!meta) return
        const basePrice = meta.price
        const basis = meta.basis
        // 🟡🟡🟡 - [LINE ITEM CALCULATION] Calculate base line total (per guest or fixed)
        let lineTotal = basis === 'Per guest' ? basePrice * guestCount : basePrice
        // 🟡🟡🟡 - [MULTI-DAY MULTIPLICATION] Multiply by numberOfDays for multi-day events
        lineTotal = lineTotal * numberOfDays
        subtotal += lineTotal
        breakdown.push({ kind: 'checkbox', key: optionKey, basis, amount: lineTotal })
      })

      // 🟡🟡🟡 - Products with quantities
      // ⚠️⚠️⚠️ NOTE: For "Per guest" items, the quantity input already represents how many guests get this add-on
      // So we should NOT multiply by the main guest count - only by the item's own quantity input
      // The quantity input represents the number of units/guests for this specific product
      // 🟡🟡🟡 - [MULTI-DAY EVENTS] Multiply by numberOfDays for multi-day events
      Object.entries(this.state.products).forEach(([productKey, qty]) => {
        const meta = this.priceIndex.products[productKey]
        if (!meta) return
        const basePrice = meta.price
        const basis = meta.basis
        // 🟡🟡🟡 - [LINE ITEM CALCULATION] Calculate base line total (price * quantity)
        // The "Per guest" label means each unit costs basePrice, and qty represents how many units
        // We do NOT multiply by the main guest count here - each product has its own quantity counter
        let lineTotal = basePrice * qty
        // 🟡🟡🟡 - [MULTI-DAY MULTIPLICATION] Multiply by numberOfDays for multi-day events
        lineTotal = lineTotal * numberOfDays
        subtotal += lineTotal
        breakdown.push({ kind: 'product', key: productKey, basis, qty, amount: lineTotal })
      })

      // 🟡🟡🟡 - [MINIMUM ORDERS] Calculate minimum order requirements
      // 🟡🟡🟡 - [DYNAMIC NUMBER OF DAYS] Use numberOfDays from engine (set from database/session data)
      let minimumOrderTotal = 0
      const minimumOrderBreakdown = []

      Object.entries(this.priceIndex.minimumOrders).forEach(([orderKey, orderMeta]) => {
        const basePrice = orderMeta.price
        const basis = orderMeta.basis
        let lineTotal = 0

        if (basis === 'Per day') {
          // 🟡🟡🟡 - Multiply by number of days (from database/session)
          lineTotal = basePrice * numberOfDays
          minimumOrderBreakdown.push({
            kind: 'minimum-order',
            key: orderKey,
            label: orderMeta.label,
            basis: basis,
            amount: lineTotal,
            days: numberOfDays
          })
        } else if (basis === 'Per event') {
          // 🟡🟡🟡 - Add directly as fixed amount
          lineTotal = basePrice
          minimumOrderBreakdown.push({
            kind: 'minimum-order',
            key: orderKey,
            label: orderMeta.label,
            basis: basis,
            amount: lineTotal
          })
        }

        if (lineTotal > 0) {
          minimumOrderTotal += lineTotal
        }
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

      // 🟡🟡🟡 - [MINIMUM ORDER ADDITION] Only add minimum order to total if subtotal is less than minimum
      // ⚠️⚠️⚠️ - [MINIMUM ORDER LOGIC] When minimum is met (subtotal >= minimumOrderTotal), do NOT add minimum to total
      if (minimumOrderTotal > 0 && subtotal < minimumOrderTotal) {
        total += minimumOrderTotal
        console.log('🟡🟡🟡 - [KLOI CALC] Minimum order not met, adding minimum order amount to total:', minimumOrderTotal)
      } else if (minimumOrderTotal > 0 && subtotal >= minimumOrderTotal) {
        console.log('✅✅✅ - [KLOI CALC] Minimum order met, NOT adding minimum order amount to total')
      }

      // 🟡🟡🟡 - [TAXES FEES] Apply taxes and fees to order total (after minimum order)
      const taxesFeesResult = this.applyTaxesFees(total)
      total = taxesFeesResult.total
      const taxesFeesBreakdown = taxesFeesResult.breakdown

      // Add taxes/fees to modifiersMeta for display
      taxesFeesBreakdown.forEach((tf) => {
        modifiersMeta.push({
          name: tf.name,
          delta: tf.amount,
          meta: {
            type: tf.type,
            category: tf.category,
            code: tf.code,
            calculation_type: tf.calculation_type,
            rate_value: tf.rate_value
          }
        })
      })

      console.log('✅✅✅ - [KLOI CALC] Calculated', { guestCount, subtotal, total, breakdown, modifiersMeta, minimumOrderTotal, minimumOrderBreakdown, numberOfDays, taxesFeesBreakdown })
      console.log('🟡🟡🟡 - [KLOI CALC] Multi-day event calculation - numberOfDays:', numberOfDays, 'subtotal:', subtotal, 'total:', total)
      return { guestCount, subtotal, total, breakdown, modifiersMeta, minimumOrderTotal, minimumOrderBreakdown, taxesFeesBreakdown }
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
      const { subtotal, total, breakdown, modifiersMeta, minimumOrderTotal, minimumOrderBreakdown, taxesFeesBreakdown } = this.engine.calculate()
      const lines = breakdown
        .map((l) => {
          // 2025-11-05T00:00:00Z 🟡🟡🟡 - [LABELS] Use friendly labels from KloiMenuLabels where available
          let display = l.key
          try {
            if (window.KloiMenuLabels) {
              if (l.kind === 'radio') {
                const parts = String(l.key).split('.')
                const groupId = parts[0]
                const optionKey = parts[1]
                display = window.KloiMenuLabels.getOptionLabel(groupId, optionKey)
              } else if (l.kind === 'checkbox') {
                // Checkbox keys are flat in engine; try flat map via getOptionLabel without section
                display = window.KloiMenuLabels.getOptionLabel(null, l.key)
              } else if (l.kind === 'product') {
                display = window.KloiMenuLabels.getProductLabel(l.key)
              }
            }
          } catch (e) {
            console.error('❗❗❗ - [KLOI CALC] Label resolution error:', e)
          }
          // 2025-01-XX 🟡🟡🟡 - [STRUCTURE] Split item name and amount into separate h4 and p elements
          const qtyText = l.qty ? ` × ${l.qty}` : ''
          const itemName = `${display}${qtyText}`
          const itemAmount = formatCurrency(l.amount)
          return `<div class="calc-line"><h4>${itemName}</h4><p>${itemAmount}</p></div>`
        }) 
        .join('')
      const mods = modifiersMeta
        .map((m) => `<div class="calc-mod">${m.name}: ${formatCurrency(m.delta)}</div>`) 
        .join('')
      
      // 🟡🟡🟡 - [MINIMUM ORDER DISPLAY] Render minimum order information only if minimum is NOT met
      // 🟡🟡🟡 - [MINIMUM ORDER LOGIC] Only show minimum order section if subtotal < minimumOrderTotal
      let minimumOrderHtml = ''
      if (minimumOrderBreakdown && minimumOrderBreakdown.length > 0 && subtotal < minimumOrderTotal) {
        minimumOrderHtml = `
          <div class="calc-minimum-orders">
            <div class="calc-min-order-title" style="display: none;">Minimum Orders:</div>
            <div class="calc-min-order-total">Minimum Order Total: ${formatCurrency(minimumOrderTotal)}</div>
          </div>
        `
      }

      const html = `
        <div class="calc-wrapper">
          <div class="calc-breakdown">${lines || '<div class="calc-line">No selections yet</div>'}</div>
          <div class="calc-subtotal"><h4>Subtotal:</h4><p>${formatCurrency(subtotal)}</p></div>
          ${mods}
          ${minimumOrderHtml}
          <div class="calc-total"><h4><strong>Total:</strong></h4><p>${formatCurrency(total)}</p></div>
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
        const engine = new KloiCalculatorEngine(sections, options)

        // 🟡🟡🟡 - Find calculator container
        const container = document.querySelector('.kloi-calculator')
        if (!container) {
          console.error('❗❗❗ - [KLOI CALC] .kloi-calculator container not found')
          return null
        }

        const ui = new KloiCalculatorUI(engine, container)

        // 🟡🟡🟡 - Return bindings for page to wire inputs
        const api = {
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
          setNumberOfDays: (days) => {
            // 🟡🟡🟡 - [NUMBER OF DAYS] Update number of days and recalculate
            // ⚠️⚠️⚠️ - [NUMBER OF DAYS] This affects minimum order calculations for "Per day" basis
            const numDays = days && days > 0 ? Math.floor(days) : 1
            engine.numberOfDays = numDays
            console.log('🟡🟡🟡 - [KLOI CALC] Number of days updated to:', numDays)
            ui.render()
          },
          // 2025-11-05T00:00:00Z 🟡🟡🟡 - [API] Expose read-only getters for saving to session/DB
          getState: () => {
            try {
              const state = {
                guestCount: engine.state.guestCount,
                radios: { ...engine.state.radios },
                checkboxes: Array.from(engine.state.checkboxes),
                products: { ...engine.state.products },
                numberOfDays: engine.numberOfDays,
              }
              console.log('🟡🟡🟡 - [KLOI CALC] getState()', state)
              return state
            } catch (err) {
              console.error('❗❗❗ - [KLOI CALC] getState() error:', err)
              return null
            }
          },
          getQuote: () => {
            try {
              const { guestCount, subtotal, total, breakdown, modifiersMeta, minimumOrderTotal, minimumOrderBreakdown } = engine.calculate()
              const quote = { guestCount, subtotal, total, breakdown, modifiersMeta, minimumOrderTotal, minimumOrderBreakdown, numberOfDays: engine.numberOfDays }
              console.log('🟡🟡🟡 - [KLOI CALC] getQuote()', quote)
              return quote
            } catch (err) {
              console.error('❗❗❗ - [KLOI CALC] getQuote() error:', err)
              return null
            }
          },
        }
        // ⚪⚪⚪ - [GLOBAL REF] Make current calculator accessible to other modules (e.g., wizard__progress)
        try { window.__kloiCalc = api } catch (_e) {}
        return api
      } catch (err) {
        console.error('❗❗❗ - [KLOI CALC] Initialization error:', err)
        return null
      }
    },
  }
})()


