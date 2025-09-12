import { Router, Request, Response } from 'express'

const router = Router()

// GET /api/vimeo/oembed - Proxy endpoint for Vimeo oEmbed API
router.get('/oembed', async (req: Request, res: Response) => {
  try {
    const { url } = req.query
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'Video URL is required'
      })
    }

    // Validate that it's a Vimeo URL
    const vimeoMatch = url.match(/vimeo\.com\/video\/(\d+)|player\.vimeo\.com\/video\/(\d+)/)
    if (!vimeoMatch) {
      return res.status(400).json({
        error: 'Invalid Vimeo URL'
      })
    }

    const vimeoId = vimeoMatch[1] || vimeoMatch[2]
    const vimeoOembedUrl = `https://vimeo.com/api/oembed.json?url=https://player.vimeo.com/video/${vimeoId}`
    
    console.log(`🎬 [DEBUG] Fetching Vimeo data for ID: ${vimeoId}`)
    console.log(`🎬 [DEBUG] Vimeo oEmbed URL: ${vimeoOembedUrl}`)

    const response = await fetch(vimeoOembedUrl)
    
    if (!response.ok) {
      console.error(`❌ [ERROR] Vimeo API failed with status: ${response.status}`)
      return res.status(response.status).json({
        error: 'Failed to fetch video data from Vimeo'
      })
    }

    const data = await response.json()
    console.log(`✅ [DEBUG] Vimeo data fetched successfully:`, {
      title: data.title,
      duration: data.duration,
      hasDescription: !!data.description,
      description: data.description
    })
    
    res.json(data)
  } catch (error: any) {
    console.error('❌ [ERROR] Vimeo proxy error:', error)
    res.status(500).json({
      error: 'Internal server error while fetching video data'
    })
  }
})

export default router