<template>
  <div class="bom-container">
    <div v-if="loading" class="bom-loading">
      <div class="bom-loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="error" class="bom-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{{ error }}</span>
    </div>

    <template v-else>
      <div class="bom-toolbar">
        <BomVersionSelector v-model="version" :versions="versions" />
        <BomSearchBar v-model="search" />
        <BomExport :data="filteredComponents" :version="version" />
      </div>

      <BomCategoryFilter
        v-model="selectedCategories"
        :options="categories"
      />

      <div class="bom-table-wrapper">
        <table class="bom-table">
          <thead>
            <tr>
              <th @click="toggleSort('value')" class="bom-th-sortable">
                值
                <span class="bom-sort-icon" :class="{ active: sortBy === 'value' }">
                  {{ sortBy === 'value' ? (sortDesc ? '↓' : '↑') : '↕' }}
                </span>
              </th>
              <th class="bom-th-hide-mobile">封装</th>
              <th @click="toggleSort('quantity')" class="bom-th-sortable">
                数量
                <span class="bom-sort-icon" :class="{ active: sortBy === 'quantity' }">
                  {{ sortBy === 'quantity' ? (sortDesc ? '↓' : '↑') : '↕' }}
                </span>
              </th>
              <th class="bom-th-hide-mobile">描述</th>
              <th @click="toggleSort('price')" class="bom-th-sortable">
                单价
                <span class="bom-sort-icon" :class="{ active: sortBy === 'price' }">
                  {{ sortBy === 'price' ? (sortDesc ? '↓' : '↑') : '↕' }}
                </span>
              </th>
              <th>小计</th>
              <th class="bom-th-hide-mobile">链接</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="comp in filteredComponents"
              :key="comp.id"
              :style="{ '--row-cat-color': getCategoryColor(comp.category) }"
              class="bom-row"
            >
              <td class="bom-td-value">{{ comp.value }}</td>
              <td class="bom-th-hide-mobile">{{ comp.footprint }}</td>
              <td class="bom-td-quantity">{{ comp.quantity }}</td>
              <td class="bom-th-hide-mobile bom-td-description">{{ comp.description }}</td>
              <td class="bom-td-price">¥{{ comp.supplier.unitPrice.toFixed(2) }}</td>
              <td class="bom-td-subtotal">¥{{ (comp.quantity * comp.supplier.unitPrice).toFixed(2) }}</td>
              <td class="bom-th-hide-mobile">
                <a
                  v-if="comp.supplier.url"
                  :href="comp.supplier.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="bom-link"
                >
                  {{ comp.supplier.name }}
                </a>
                <span v-else>{{ comp.supplier.name }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredComponents.length === 0" class="bom-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <span>没有找到匹配的元器件</span>
      </div>

      <BomSummary :components="filteredComponents" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import BomVersionSelector from './BomVersionSelector.vue'
import BomSearchBar from './BomSearchBar.vue'
import BomCategoryFilter from './BomCategoryFilter.vue'
import BomSummary from './BomSummary.vue'
import BomExport from './BomExport.vue'

interface Category {
  id: string
  name: string
  color: string
}

interface Supplier {
  name: string
  url: string
  unitPrice: number
}

interface Component {
  id: string
  reference?: string
  value: string
  footprint: string
  quantity: number
  description: string
  category: string
  supplier: Supplier
}

interface BomData {
  version: string
  metadata: {
    totalComponents: number
    generatedAt: string
  }
  categories: Category[]
  components: Component[]
}

interface IndexData {
  versions: string[]
  defaultVersion: string
}

const loading = ref(true)
const error = ref('')
const versions = ref<string[]>([])
const version = ref('')
const categories = ref<Category[]>([])
const components = ref<Component[]>([])
const selectedCategories = ref<string[]>([])
const search = ref('')
const sortBy = ref<'value' | 'quantity' | 'price' | ''>('')
const sortDesc = ref(false)

async function loadIndex() {
  try {
    const res = await fetch('/bom/index.json')
    if (!res.ok) throw new Error('无法加载版本索引')
    const data: IndexData = await res.json()
    versions.value = data.versions
    version.value = data.defaultVersion
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
    loading.value = false
  }
}

async function loadVersion(v: string) {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`/bom/${v}.json`)
    if (!res.ok) throw new Error(`无法加载版本 ${v}`)
    const data: BomData = await res.json()
    categories.value = data.categories
    components.value = data.components
    // Select all categories by default
    selectedCategories.value = data.categories.map(c => c.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function getCategoryColor(categoryId: string): string {
  const cat = categories.value.find(c => c.id === categoryId)
  return cat?.color || '#607D8B'
}

function toggleSort(field: 'value' | 'quantity' | 'price') {
  if (sortBy.value === field) {
    sortDesc.value = !sortDesc.value
  } else {
    sortBy.value = field
    sortDesc.value = false
  }
}

const filteredComponents = computed(() => {
  let result = components.value

  // Filter by category
  if (selectedCategories.value.length > 0 && selectedCategories.value.length < categories.value.length) {
    result = result.filter(c => selectedCategories.value.includes(c.category))
  }

  // Filter by search
  if (search.value.trim()) {
    const q = search.value.toLowerCase().trim()
    result = result.filter(c =>
      c.value.toLowerCase().includes(q) ||
      c.footprint.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.reference?.toLowerCase().includes(q) ?? false)
    )
  }

  // Sort
  if (sortBy.value) {
    result = [...result].sort((a, b) => {
      let cmp = 0
      switch (sortBy.value) {
        case 'value':
          cmp = a.value.localeCompare(b.value)
          break
        case 'quantity':
          cmp = a.quantity - b.quantity
          break
        case 'price':
          cmp = a.supplier.unitPrice - b.supplier.unitPrice
          break
      }
      return sortDesc.value ? -cmp : cmp
    })
  }

  return result
})

watch(version, (v) => {
  if (v) loadVersion(v)
})

onMounted(async () => {
  await loadIndex()
  if (version.value) {
    await loadVersion(version.value)
  }
})
</script>
