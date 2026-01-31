"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export interface UTMData {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
}

export interface TrackingData {
  utm: UTMData
  referrer: string
  userAgent: string
  timestamp: string
}

export function useUTMTracking() {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Parse UTM parameters from URL
    const utmData: UTMData = {
      source: searchParams.get("utm_source") || undefined,
      medium: searchParams.get("utm_medium") || undefined,
      campaign: searchParams.get("utm_campaign") || undefined,
      content: searchParams.get("utm_content") || undefined,
      term: searchParams.get("utm_term") || undefined,
    }

    // Get referrer and user agent
    const referrer = document.referrer
    const userAgent = navigator.userAgent
    const timestamp = new Date().toISOString()

    const trackingInfo: TrackingData = {
      utm: utmData,
      referrer,
      userAgent,
      timestamp,
    }

    setTrackingData(trackingInfo)

    // Store in localStorage for persistence
    localStorage.setItem("ticobot_tracking", JSON.stringify(trackingInfo))

    // Send to backend for analytics
    if (utmData.source) {
      trackUTMVisit(trackingInfo)
    }
  }, [searchParams])

  // Track specific events
  const trackEvent = (event: string, data?: Record<string, any>) => {
    const eventData = {
      event,
      data,
      timestamp: new Date().toISOString(),
      utm: trackingData?.utm || {},
      referrer: trackingData?.referrer || document.referrer,
    }

    // Send to Umami
    if (window.umami) {
      window.umami.track(event, eventData)
    }

    // Send to backend for additional tracking
    sendTrackingEvent(eventData)
  }

  // Track social media conversions
  const trackSocialConversion = (platform: string, action: string) => {
    trackEvent("social_conversion", {
      platform,
      action,
      utm_source: trackingData?.utm.source,
      utm_medium: trackingData?.utm.medium,
      utm_campaign: trackingData?.utm.campaign,
    })
  }

  // Track registration with UTM data
  const trackRegistration = (userId: string, email: string) => {
    trackEvent("user_registration", {
      userId,
      email: trackingData?.utm.source ? "masked" : "direct",
      utm_source: trackingData?.utm.source,
      utm_medium: trackingData?.utm.medium,
      utm_campaign: trackingData?.utm.campaign,
      utm_content: trackingData?.utm.content,
    })
  }

  return {
    trackingData,
    trackEvent,
    trackSocialConversion,
    trackRegistration,
  }
}

// Send UTM visit to backend
async function trackUTMVisit(data: TrackingData) {
  try {
    await fetch("/api/analytics/utm-visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
  } catch (error) {
    console.error("Error tracking UTM visit:", error)
  }
}

// Send general tracking events to backend
async function sendTrackingEvent(eventData: any) {
  try {
    await fetch("/api/analytics/track-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    })
  } catch (error) {
    console.error("Error sending tracking event:", error)
  }
}

// Generate UTM URLs for social media
export function generateSocialUTMLinks(baseUrl: string): Record<string, string> {
  const campaigns = {
    instagram: {
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: "social_follow_2026",
      utm_content: "bio_link",
    },
    x: {
      utm_source: "x_twitter",
      utm_medium: "social",
      utm_campaign: "social_follow_2026",
      utm_content: "profile_link",
    },
    linkedin: {
      utm_source: "linkedin",
      utm_medium: "professional",
      utm_campaign: "professional_network_2026",
      utm_content: "company_page",
    },
    threads: {
      utm_source: "threads",
      utm_medium: "social",
      utm_campaign: "social_follow_2026",
      utm_content: "profile_bio",
    },
  }

  const links: Record<string, string> = {}

  for (const [platform, params] of Object.entries(campaigns)) {
    const urlParams = new URLSearchParams(params)
    links[platform] = `${baseUrl}?${urlParams.toString()}`
  }

  return links
}

// Type declaration for Umami
declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: any) => void
    }
  }
}