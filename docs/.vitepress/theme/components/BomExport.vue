<template>
  <div class="bom-export">
    <button @click="exportCSV" class="bom-export-btn" type="button">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      导出 CSV
    </button>
    <button @click="generateShoppingList" class="bom-export-btn bom-export-btn-secondary" type="button">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
      购物清单
    </button>
  </div>
</template>

<script setup lang="ts">
interface Component {
  value: string
  footprint: string
  quantity: number
  description: string
  category: string
  supplier: {
    name: string
    url: string
    unitPrice: number
  }
}

const props = defineProps<{
  data: Component[]
  version: string
}>()

function exportCSV() {
  const headers = ['值', '封装', '数量', '描述', '供应商', '单价', '小计', '链接']
  const rows = props.data.map(c => [
    c.value,
    c.footprint,
    c.quantity,
    c.description,
    c.supplier.name,
    c.supplier.unitPrice.toFixed(2),
    (c.quantity * c.supplier.unitPrice).toFixed(2),
    c.supplier.url
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]) // UTF-8 BOM
  const blob = new Blob([BOM, csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bom-${props.version}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function generateShoppingList() {
  // Group by supplier
  const grouped = props.data.reduce((acc, c) => {
    const supplier = c.supplier.name
    if (!acc[supplier]) acc[supplier] = []
    acc[supplier].push(c)
    return acc
  }, {} as Record<string, Component[]>)

  let content = `# 购物清单 - ${props.version}\n\n`
  content += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`

  for (const [supplier, items] of Object.entries(grouped)) {
    const subtotal = items.reduce((sum, c) => sum + c.quantity * c.supplier.unitPrice, 0)
    content += `## ${supplier} (小计: ¥${subtotal.toFixed(2)})\n\n`
    content += `| 值 | 封装 | 数量 | 单价 | 链接 |\n`
    content += `|---|---|---|---|---|\n`
    for (const item of items) {
      content += `| ${item.value} | ${item.footprint} | ${item.quantity} | ¥${item.supplier.unitPrice.toFixed(2)} | [购买](${item.supplier.url}) |\n`
    }
    content += '\n'
  }

  const total = props.data.reduce((sum, c) => sum + c.quantity * c.supplier.unitPrice, 0)
  content += `---\n\n**总计: ¥${total.toFixed(2)}**\n`

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shopping-list-${props.version}.md`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
