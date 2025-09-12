import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Validate that it's a Vimeo URL
    if (!url.includes('vimeo.com')) {
      return NextResponse.json(
        { error: 'Invalid Vimeo URL' },
        { status: 400 }
      )
    }

    // Call Vimeo's oEmbed API directly
    const vimeoOembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
    
    console.log('Fetching from Vimeo oEmbed API:', vimeoOembedUrl)
    
    const response = await fetch(vimeoOembedUrl, {
      headers: {
        'User-Agent': 'FXトレード道場 App/1.0',
      },
    })

    if (!response.ok) {
      console.error('Vimeo oEmbed API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch video data from Vimeo' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Vimeo oEmbed response:', data)

    // Return the data with consistent structure
    return NextResponse.json({
      title: data.title,
      duration: data.duration,
      thumbnail_url: data.thumbnail_url,
      author_name: data.author_name,
      provider_name: data.provider_name,
      html: data.html,
      width: data.width,
      height: data.height
    })

  } catch (error) {
    console.error('oEmbed API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}