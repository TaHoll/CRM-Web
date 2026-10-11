import QRCode from 'qrcodejs2-fixes'
import contractTemplateUrl from '@/assets/images/e签宝电子合同模板图片.png'
import esignLogoUrl from '@/assets/images/e签宝logo.jpg'

const canvasWidth = 1024
const canvasHeight = 1536
const qrBox = { x: 324, y: 890, width: 376, height: 376 }

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function createQrImage(text, size) {
  return new Promise((resolve, reject) => {
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-10000px'
    container.style.top = '-10000px'
    container.style.width = `${size}px`
    container.style.height = `${size}px`
    document.body.appendChild(container)

    const cleanup = () => container.remove()
    try {
      new QRCode(container, {
        text,
        width: size,
        height: size,
        correctLevel: QRCode.CorrectLevel.H,
        colorDark: '#000000',
        colorLight: 'rgba(255, 255, 255, 0)'
      })
    } catch (error) {
      cleanup()
      reject(error)
      return
    }

    const findQrSource = () => {
      const source = container.querySelector('canvas, img')
      if (!source) {
        requestAnimationFrame(findQrSource)
        return
      }

      if (source.tagName.toLowerCase() === 'img') {
        if (source.complete) {
          cleanup()
          resolve(source)
        } else {
          source.onload = () => {
            cleanup()
            resolve(source)
          }
          source.onerror = (error) => {
            cleanup()
            reject(error)
          }
        }
      } else {
        cleanup()
        resolve(source)
      }
    }

    requestAnimationFrame(findQrSource)
  })
}

function drawTextInBox(context, value, box) {
  const text = String(value ?? '')
  if (!text) return

  const fontSize = 28
  context.font = `bold ${fontSize}px "Microsoft YaHei", Arial, sans-serif`
  context.fillStyle = '#3f4650'
  context.textBaseline = 'middle'
  context.fillText(text, box.x, box.y + box.height / 2, box.width)
}

function drawLogoInQr(context, logoImage) {
  const logoSize = 64
  const x = qrBox.x + (qrBox.width - logoSize) / 2
  const y = qrBox.y + (qrBox.height - logoSize) / 2

  context.save()
  context.fillStyle = '#ffffff'
  context.beginPath()
  context.roundRect(x - 6, y - 6, logoSize + 12, logoSize + 12, 10)
  context.fill()
  context.drawImage(logoImage, x, y, logoSize, logoSize)
  context.restore()
}

/**
 * 生成电子合同预览图。
 * @param {Object} params
 * @param {string} params.initiatorName 发起方
 * @param {string} params.signerName 签署方
 * @param {string} params.contractName 合同名称
 * @param {string} params.initiatedAt 发起时间
 * @param {string} params.signQrCode 签署二维码链接
 * @returns {Promise<string>} PNG 图片 data URL
 */
export async function generateContractImage({
  initiatorName,
  signerName,
  contractName,
  initiatedAt,
  signQrCode
}) {
  if (!signQrCode) {
    throw new Error('签署二维码链接不能为空')
  }

  const [templateImage, logoImage, qrImage] = await Promise.all([
    loadImage(contractTemplateUrl),
    loadImage(esignLogoUrl),
    createQrImage(signQrCode, qrBox.width)
  ])

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const context = canvas.getContext('2d')

  context.drawImage(templateImage, 0, 0, canvasWidth, canvasHeight)
  drawTextInBox(context, initiatorName, { x: 90, y: 380, width: 385, height: 62 })
  drawTextInBox(context, signerName, { x: 555, y: 380, width: 385, height: 62 })
  drawTextInBox(context, contractName, { x: 90, y: 523, width: 845, height: 58 })
  drawTextInBox(context, initiatedAt, { x: 90, y: 658, width: 845, height: 58 })
  context.drawImage(qrImage, qrBox.x, qrBox.y, qrBox.width, qrBox.height)
  drawLogoInQr(context, logoImage)

  return canvas.toDataURL('image/png')
}

export default generateContractImage
