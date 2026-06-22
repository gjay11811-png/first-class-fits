import React from 'react'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  customerName?: string
  orderNumber?: string
  carrier?: string
  trackingNumber?: string
  trackingUrl?: string
  estimatedDelivery?: string
}

const Email = ({
  customerName = 'there',
  orderNumber = '—',
  carrier = '',
  trackingNumber = '',
  trackingUrl,
  estimatedDelivery,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Order {orderNumber} is on the way</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>FIRST CLASS FITS</Text>
        <Heading style={h1}>Your order is on the way</Heading>
        <Text style={text}>Hi {customerName}, order {orderNumber} just shipped.</Text>

        {(carrier || trackingNumber) && (
          <Section style={card}>
            {carrier && (<><Text style={label}>Carrier</Text><Text style={value}>{carrier}</Text></>)}
            {trackingNumber && (<><Text style={{ ...label, marginTop: 12 }}>Tracking number</Text><Text style={value}>{trackingNumber}</Text></>)}
            {estimatedDelivery && (<><Text style={{ ...label, marginTop: 12 }}>Estimated delivery</Text><Text style={value}>{estimatedDelivery}</Text></>)}
          </Section>
        )}

        {trackingUrl && (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={trackingUrl} style={btn}>Track package</Button>
          </Section>
        )}

        <Hr style={hr} />
        <Text style={muted}>Reply to this email if anything's off — we're here to help.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Order ${d.orderNumber ?? ''} shipped — First Class Fits`,
  displayName: 'Shipping update',
  previewData: {
    customerName: 'Alex',
    orderNumber: 'FCF-1042',
    carrier: 'Royal Mail',
    trackingNumber: 'AB123456789GB',
    trackingUrl: 'https://www.royalmail.com/track-your-item',
    estimatedDelivery: 'Tue, 16 Jun',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', color: '#0a0a0a' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = { fontSize: '11px', letterSpacing: '3px', color: '#666', margin: '0 0 24px' }
const h1 = { fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase' as const, margin: '0 0 16px' }
const text = { fontSize: '14px', lineHeight: '22px', color: '#0a0a0a', margin: '0' }
const muted = { fontSize: '12px', color: '#666', margin: '8px 0 0' }
const card = { backgroundColor: '#f5f5f5', padding: '16px', margin: '20px 0' }
const label = { fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '2px', color: '#666', margin: '0 0 4px' }
const value = { fontSize: '16px', fontWeight: 600, margin: '0' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const btn = { backgroundColor: '#0a0a0a', color: '#ffffff', padding: '14px 28px', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' as const, textDecoration: 'none' }
