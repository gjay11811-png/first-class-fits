import React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface OrderItem {
  name: string
  qty: number
  price: string
}

interface Props {
  customerName?: string
  orderNumber?: string
  items?: OrderItem[]
  subtotal?: string
  shipping?: string
  total?: string
  shippingAddress?: string
}

const Email = ({
  customerName = 'there',
  orderNumber = '—',
  items = [],
  subtotal = '£0.00',
  shipping = '£0.00',
  total = '£0.00',
  shippingAddress = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Order {orderNumber} confirmed — First Class Fits</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>FIRST CLASS FITS</Text>
        <Heading style={h1}>Order confirmed</Heading>
        <Text style={text}>Hi {customerName}, thanks for your order. We're getting it ready.</Text>

        <Section style={card}>
          <Text style={label}>Order number</Text>
          <Text style={value}>{orderNumber}</Text>
        </Section>

        <Hr style={hr} />
        <Text style={sectionTitle}>Items</Text>
        {items.map((it, i) => (
          <Section key={i} style={row}>
            <Text style={itemText}>{it.qty}× {it.name}</Text>
            <Text style={itemPrice}>{it.price}</Text>
          </Section>
        ))}

        <Hr style={hr} />
        <Section style={row}><Text style={text}>Subtotal</Text><Text style={text}>{subtotal}</Text></Section>
        <Section style={row}><Text style={text}>Shipping</Text><Text style={text}>{shipping}</Text></Section>
        <Section style={row}><Text style={totalText}>Total</Text><Text style={totalText}>{total}</Text></Section>

        {shippingAddress && (
          <>
            <Hr style={hr} />
            <Text style={sectionTitle}>Shipping to</Text>
            <Text style={text}>{shippingAddress}</Text>
          </>
        )}

        <Hr style={hr} />
        <Text style={muted}>Reply to this email if you need help — we'll get back to you within 24 hours.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Order ${d.orderNumber ?? ''} confirmed — First Class Fits`,
  displayName: 'Order confirmation',
  previewData: {
    customerName: 'Alex',
    orderNumber: 'FCF-1042',
    items: [{ name: 'Heritage Tee — Black', qty: 1, price: '£45.00' }],
    subtotal: '£45.00',
    shipping: '£5.00',
    total: '£50.00',
    shippingAddress: '12 Example St, London, E1 6AN',
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
const sectionTitle = { fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '2px', color: '#666', margin: '0 0 12px' }
const row = { display: 'flex' as const, justifyContent: 'space-between' as const, padding: '6px 0' }
const itemText = { fontSize: '14px', margin: '0', flex: 1 }
const itemPrice = { fontSize: '14px', margin: '0', fontWeight: 600 }
const totalText = { fontSize: '16px', margin: '4px 0', fontWeight: 700 }
