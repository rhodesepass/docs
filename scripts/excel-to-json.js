#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CATEGORIES = [
  { id: 'power', name: '电源部分', color: '#4CAF50' },
  { id: 'core', name: '核心部分', color: '#2196F3' },
  { id: 'display', name: '屏幕部分', color: '#F44336' },
  { id: 'expansion', name: '扩展部分', color: '#3F51B5' },
  { id: 'connector', name: '接插件', color: '#FF9800' },
  { id: 'passive', name: '无源器件', color: '#9C27B0' },
  { id: 'other', name: '其他', color: '#607D8B' }
]

function normalizeText(value) {
  return String(value ?? '').trim()
}

function detectCategory(reference, value, footprint, description) {
  const ref = normalizeText(reference).toUpperCase()
  const val = normalizeText(value).toLowerCase()
  const fp = normalizeText(footprint).toLowerCase()
  const desc = normalizeText(description).toLowerCase()

  if (
    (ref.startsWith('U') && (val.includes('ldo') || val.includes('regulator') || val.includes('7333'))) ||
    val.includes('ams1117') ||
    val.includes('me6211') ||
    desc.includes('稳压') ||
    desc.includes('ldo')
  ) return 'power'
  if ((ref.startsWith('D') && (val.includes('ss14') || val.includes('5819') || val.includes('schottky'))) || desc.includes('肖特基')) return 'power'
  if (val.includes('battery') || val.includes('电池') || desc.includes('电池')) return 'power'
  if (
    (ref.startsWith('U') && (val.includes('f1c') || val.includes('mcu') || val.includes('flash') || val.includes('sdram'))) ||
    val.includes('f1c') ||
    val.includes('flash') ||
    val.includes('sdram') ||
    desc.includes('主控') ||
    desc.includes('flash') ||
    desc.includes('sdram')
  ) return 'core'
  if (val.includes('crystal') || val.includes('晶振') || desc.includes('晶振') || ref.startsWith('Y')) return 'core'
  if (val.includes('lcd') || val.includes('screen') || val.includes('屏') || val.includes('display') || fp.includes('fpc-24')) return 'display'
  if (ref.startsWith('J') || ref.startsWith('CN') || val.includes('connector') || val.includes('fpc') || val.includes('usb-c') || val.includes('micro-usb') || desc.includes('连接器')) return 'connector'
  if (ref.startsWith('R') || ref.startsWith('C') || ref.startsWith('L')) return 'passive'
  if (val.includes('resistor') || val.includes('capacitor') || val.includes('ferrite') || desc.includes('电阻') || desc.includes('电容') || desc.includes('磁珠')) return 'passive'
  if (val.includes('sd') || val.includes('usb') || val.includes('uart') || desc.includes('按键') || desc.includes('开关')) return 'expansion'
  if (fp.includes('0402') || fp.includes('0603') || fp.includes('0805')) return 'passive'
  return 'other'
}

async function convertExcelToJson(inputPath, version) {
  try {
    const xlsxModule = await import('xlsx')
    const XLSX = xlsxModule.default ?? xlsxModule

    const workbook = XLSX.readFile(inputPath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    const components = data.map((row, index) => {
      const reference = normalizeText(row['Designator'] || row['Reference'] || row['位号'])
      const value = normalizeText(row['Value'] || row['Comment'] || row['值'])
      const footprint = normalizeText(row['Footprint'] || row['封装'])
      const quantity = parseInt(normalizeText(row['Quantity'] || row['数量'] || '1'), 10)
      const description = normalizeText(row['Description'] || row['描述'])
      const supplierName = normalizeText(row['Supplier'] || row['供应商'] || '立创商城')
      const supplierUrl = normalizeText(row['SupplierURL'] || row['链接'])
      const unitPrice = parseFloat(normalizeText(row['UnitPrice'] || row['Price'] || row['单价'] || '0'))

      return {
        id: String(index + 1),
        reference,
        value,
        footprint,
        quantity: Number.isNaN(quantity) ? 1 : quantity,
        description,
        category: detectCategory(reference, value, footprint, description),
        supplier: {
          name: supplierName,
          url: supplierUrl,
          unitPrice: isNaN(unitPrice) ? 0 : unitPrice
        }
      }
    }).filter(c =>
      c.value ||
      c.footprint ||
      c.description ||
      c.supplier.url ||
      c.supplier.name
    )

    const output = {
      version,
      metadata: {
        totalComponents: components.length,
        generatedAt: new Date().toISOString()
      },
      categories: CATEGORIES,
      components
    }

    const outputPath = resolve(__dirname, `../docs/public/bom/${version}.json`)
    await writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8')

    console.log(`Successfully converted ${inputPath} to ${outputPath}`)
    console.log(`Total components: ${components.length}`)
    await updateIndex(version)

  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.error('Error: xlsx package not found. Install it with: npm install xlsx --save-dev')
      process.exit(1)
    }
    throw error
  }
}

async function updateIndex(newVersion) {
  const indexPath = resolve(__dirname, '../docs/public/bom/index.json')

  let index = { versions: [], defaultVersion: '' }
  try {
    const content = await readFile(indexPath, 'utf-8')
    index = JSON.parse(content)
  } catch {}

  if (!index.versions.includes(newVersion)) {
    index.versions.push(newVersion)
    index.versions.sort((a, b) => {
      const parseVersion = v => v.replace('v', '').split('.').map(Number)
      const [aMaj, aMin, aPatch = 0] = parseVersion(a)
      const [bMaj, bMin, bPatch = 0] = parseVersion(b)
      if (bMaj !== aMaj) return bMaj - aMaj
      if (bMin !== aMin) return bMin - aMin
      return bPatch - aPatch
    })
    index.defaultVersion = index.versions[0]

    await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
    console.log(`Updated index.json with version ${newVersion}`)
  }
}

const args = process.argv.slice(2)
if (args.length < 2) {
  console.log('Usage: node scripts/excel-to-json.js <input.xlsx> <version>')
  console.log('Example: node scripts/excel-to-json.js bom.xlsx v0.6')
  process.exit(1)
}

convertExcelToJson(args[0], args[1]).catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
